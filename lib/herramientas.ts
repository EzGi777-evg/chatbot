import type OpenAI from "openai";
import { buscarProductos, categorias, productos } from "./datos";
import { MAX_CANTIDAD, MAX_ITEMS_COTIZACION, MINIMO_COMPRA } from "./config";
import type { Producto } from "./types";

type Resultado = { salida: Record<string, unknown>; productos: Producto[] };

type LineaCotizacion = {
  id: string;
  cantidad: number;
  producto: Producto | null;
  problema: string | null;
};

export const HERRAMIENTAS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "buscar_productos",
    description:
      "Busca productos en el catálogo de demostración por nombre, subcategoría o categoría. Devuelve hasta 6 productos con id, precio y existencias de demostración.",
    parameters: {
      type: "object",
      properties: {
        consulta: { type: "string", description: "Palabras de búsqueda, por ejemplo 'aceite' o 'salchichas'." },
      },
      required: ["consulta"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "consultar_existencias",
    description:
      "Consulta si hay existencias de demostración de un producto para una cantidad. Si no alcanza, devuelve alternativas con existencias suficientes, primero de la misma subcategoría y luego de la misma categoría.",
    parameters: {
      type: "object",
      properties: {
        producto_id: { type: "string", description: "Id del producto." },
        cantidad: { type: "integer", description: "Unidades por las que pregunta el cliente." },
      },
      required: ["producto_id", "cantidad"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "cotizar_productos",
    description:
      "Calcula subtotales y el total de una lista de productos del catálogo de demostración, verifica existencias y si se cumple la compra mínima. Solo informa: no guarda nada ni crea pedidos. El total no incluye el domicilio.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Productos y cantidades.",
          items: {
            type: "object",
            properties: {
              producto_id: { type: "string", description: "Id del producto devuelto por buscar_productos." },
              cantidad: { type: "integer", description: "Unidades." },
            },
            required: ["producto_id", "cantidad"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
    strict: true,
  },
];

function resumen(p: Producto) {
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    subcategoria: p.subcategoria,
    precio_cop: p.precio,
    existencias_demo: p.existencias,
  };
}

function fallo(mensaje: string): Resultado {
  return { salida: { ok: false, error: mensaje }, productos: [] };
}

function buscar(args: unknown): Resultado {
  const consulta =
    typeof args === "object" && args !== null ? (args as { consulta?: unknown }).consulta : undefined;
  if (typeof consulta !== "string" || consulta.trim().length === 0 || consulta.length > 200) {
    return fallo("La consulta debe ser un texto de hasta 200 caracteres.");
  }

  const encontrados = buscarProductos(consulta, 6);
  if (encontrados.length === 0) {
    return {
      salida: {
        ok: true,
        resultados: [],
        nota: "Sin coincidencias. Prueba con otra palabra (nombre del producto, subcategoría o categoría).",
        categorias_disponibles: categorias.map((c) => c.nombre),
      },
      productos: [],
    };
  }

  return {
    salida: {
      ok: true,
      resultados: encontrados.map(resumen),
      nota: "Precios y existencias ficticios de demostración.",
    },
    productos: encontrados,
  };
}

function existencias(args: unknown): Resultado {
  const a = (typeof args === "object" && args !== null ? args : {}) as {
    producto_id?: unknown;
    cantidad?: unknown;
  };
  if (
    typeof a.producto_id !== "string" ||
    typeof a.cantidad !== "number" ||
    !Number.isInteger(a.cantidad) ||
    a.cantidad < 1 ||
    a.cantidad > MAX_CANTIDAD
  ) {
    return fallo(`Se requiere un producto_id y una cantidad entera entre 1 y ${MAX_CANTIDAD}.`);
  }

  const cantidad = a.cantidad;
  const producto = productos.find((p) => p.id === a.producto_id);
  if (!producto) return fallo("Producto no encontrado. Usa un id devuelto por buscar_productos.");

  const alcanza = producto.existencias !== null && producto.existencias >= cantidad;

  const alternativas = alcanza
    ? []
    : productos
        .filter(
          (x) =>
            x.id !== producto.id &&
            x.categoria === producto.categoria &&
            x.precio !== null &&
            x.existencias !== null &&
            x.existencias >= cantidad
        )
        .sort(
          (x, y) =>
            Number(y.subcategoria === producto.subcategoria) -
            Number(x.subcategoria === producto.subcategoria)
        )
        .slice(0, 3);

  return {
    salida: {
      ok: true,
      producto: resumen(producto),
      cantidad_solicitada: cantidad,
      alcanza,
      alternativas: alternativas.map((x) => ({
        ...resumen(x),
        misma_subcategoria: x.subcategoria === producto.subcategoria,
      })),
      nota: "Existencias ficticias de demostración. Las alternativas con misma_subcategoria=true son del mismo tipo de producto; las demás son solo de la misma categoría.",
    },
    productos: [producto, ...alternativas],
  };
}

function analizarItems(crudos: unknown): { ok: true; lineas: LineaCotizacion[] } | { ok: false; error: string } {
  if (!Array.isArray(crudos) || crudos.length === 0 || crudos.length > MAX_ITEMS_COTIZACION) {
    return { ok: false, error: `La lista de productos debe tener entre 1 y ${MAX_ITEMS_COTIZACION} elementos.` };
  }

  const acumulado = new Map<string, number>();
  for (const it of crudos) {
    if (typeof it !== "object" || it === null) return { ok: false, error: "Elemento de producto inválido." };
    const { producto_id, cantidad } = it as { producto_id?: unknown; cantidad?: unknown };
    if (
      typeof producto_id !== "string" ||
      typeof cantidad !== "number" ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > MAX_CANTIDAD
    ) {
      return { ok: false, error: `Cada producto necesita un id y una cantidad entera entre 1 y ${MAX_CANTIDAD}.` };
    }
    acumulado.set(producto_id, (acumulado.get(producto_id) ?? 0) + cantidad);
  }

  const lineas = Array.from(acumulado.entries()).map(([id, cantidad]) => {
    const producto = productos.find((p) => p.id === id) ?? null;
    let problema: string | null = null;
    if (!producto) problema = "El producto no existe en el catálogo.";
    else if (producto.precio === null) problema = "El producto no tiene precio disponible.";
    else if (producto.existencias === null || producto.existencias < cantidad) {
      problema = `Existencias de demostración insuficientes (disponibles: ${producto.existencias ?? "desconocidas"}).`;
    }
    return { id, cantidad, producto, problema };
  });

  return { ok: true, lineas };
}

function cotizar(args: unknown): Resultado {
  const items =
    typeof args === "object" && args !== null ? (args as { items?: unknown }).items : undefined;
  const analisis = analizarItems(items);
  if (!analisis.ok) return fallo(analisis.error);

  const { lineas } = analisis;
  const subtotal = (l: LineaCotizacion) =>
    l.producto && l.producto.precio !== null && !l.problema ? l.producto.precio * l.cantidad : null;
  const total = lineas.reduce((suma, l) => suma + (subtotal(l) ?? 0), 0);

  return {
    salida: {
      ok: true,
      lineas: lineas.map((l) => ({
        producto_id: l.id,
        nombre: l.producto?.nombre ?? null,
        cantidad: l.cantidad,
        precio_unitario_cop: l.producto?.precio ?? null,
        subtotal_cop: subtotal(l),
        problema: l.problema,
      })),
      total_productos_cop: total,
      compra_minima_cop: MINIMO_COMPRA,
      cumple_compra_minima: total >= MINIMO_COMPRA,
      faltante_para_minimo_cop: Math.max(0, MINIMO_COMPRA - total),
      hay_problemas: lineas.some((l) => l.problema !== null),
      nota: "Cotización informativa con precios y existencias ficticios de demostración. No crea ningún pedido. El total no incluye el domicilio.",
    },
    productos: lineas.flatMap((l) => (l.producto ? [l.producto] : [])),
  };
}

export function ejecutarHerramienta(nombre: string, argumentos: string): Resultado {
  let args: unknown;
  try {
    args = JSON.parse(argumentos);
  } catch {
    return fallo("Argumentos inválidos.");
  }

  try {
    switch (nombre) {
      case "buscar_productos":
        return buscar(args);
      case "consultar_existencias":
        return existencias(args);
      case "cotizar_productos":
        return cotizar(args);
      default:
        return fallo("Herramienta desconocida.");
    }
  } catch (e) {
    console.error("[herramienta] error en", nombre, e instanceof Error ? e.message : e);
    return fallo("Ocurrió un error interno al ejecutar la herramienta.");
  }
}
