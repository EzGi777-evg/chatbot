import type OpenAI from "openai";
import { buscarPorNombre, buscarProductos, categorias, normalizar, productos } from "./datos";
import { buscarSemantico } from "./rag";
import { MAX_CANTIDAD, MAX_ITEMS_COTIZACION, MAX_UNIDADES, MINIMO_COMPRA } from "./config";
import type { Producto } from "./types";

type Resultado = { salida: Record<string, unknown>; productos: Producto[] };

type TipoCantidad = "paquetes" | "unidades";

// Paquetes necesarios para una cantidad, con lo que cubren y lo que sobra si se pidió en unidades.
type Conversion = {
  paquetes: number;
  unidades_cubiertas: number | null;
  sobrante_unidades: number | null;
};

type LineaCotizacion = {
  id: string;
  producto: Producto | null;
  pedido: { cantidad: number; tipo: TipoCantidad }[];
  conversion: Conversion | null;
  problema: string | null;
};

const descripcionTipo =
  "'paquetes' si la cantidad es de paquetes o presentaciones del catálogo; 'unidades' si son piezas sueltas (por ejemplo 30 panes o 30 hamburguesas): el servidor calcula los paquetes necesarios.";

export const HERRAMIENTAS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "buscar_productos",
    description:
      "Busca productos en el catálogo de demostración por nombre, subcategoría o categoría. Devuelve hasta 6 productos con id, precio por paquete, existencias en paquetes y unidades_por_paquete.",
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
      "Consulta si hay existencias de demostración de un producto para una cantidad en paquetes o en unidades. Si no alcanza, devuelve alternativas con existencias suficientes, primero de la misma subcategoría y luego de la misma categoría.",
    parameters: {
      type: "object",
      properties: {
        producto_id: { type: "string", description: "Id del producto." },
        cantidad: { type: "integer", description: "Cantidad que pide el cliente." },
        tipo_cantidad: { type: "string", enum: ["paquetes", "unidades"], description: descripcionTipo },
      },
      required: ["producto_id", "cantidad", "tipo_cantidad"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "cotizar_productos",
    description:
      "Calcula subtotales y el total de una lista de productos del catálogo de demostración, convierte unidades a paquetes, verifica existencias y si se cumple la compra mínima. Solo informa: no guarda nada ni crea pedidos. El total no incluye el domicilio. Si alguna línea tiene problema, el total y la compra mínima quedan en null.",
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
              cantidad: { type: "integer", description: "Cantidad que pide el cliente." },
              tipo_cantidad: { type: "string", enum: ["paquetes", "unidades"], description: descripcionTipo },
            },
            required: ["producto_id", "cantidad", "tipo_cantidad"],
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

// Unidades por paquete según el nombre ("Pan para hamburguesa x12" → 12); null si el nombre no lo indica.
export function unidadesPorPaquete(p: Producto): number | null {
  const m = p.nombre.match(/\bx\s?(\d+)\b/i);
  return m ? Number(m[1]) : null;
}

function resumen(p: Producto) {
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    subcategoria: p.subcategoria,
    precio_por_paquete_cop: p.precio,
    existencias_demo_paquetes: p.existencias,
    unidades_por_paquete: unidadesPorPaquete(p),
  };
}

function fallo(mensaje: string): Resultado {
  return { salida: { ok: false, error: mensaje }, productos: [] };
}

function esTipo(valor: unknown): valor is TipoCantidad {
  return valor === "paquetes" || valor === "unidades";
}

function cantidadValida(cantidad: unknown, tipo: TipoCantidad): cantidad is number {
  const maximo = tipo === "unidades" ? MAX_UNIDADES : MAX_CANTIDAD;
  return typeof cantidad === "number" && Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= maximo;
}

function convertir(p: Producto, cantidad: number, tipo: TipoCantidad): Conversion | { error: string } {
  const porPaquete = unidadesPorPaquete(p);
  if (tipo === "paquetes") {
    return {
      paquetes: cantidad,
      unidades_cubiertas: porPaquete === null ? null : cantidad * porPaquete,
      sobrante_unidades: null,
    };
  }
  if (porPaquete === null) {
    return {
      error: `"${p.nombre}" no indica cuántas unidades trae cada paquete: pregunta al cliente cuántos paquetes quiere.`,
    };
  }
  const paquetes = Math.ceil(cantidad / porPaquete);
  return {
    paquetes,
    unidades_cubiertas: paquetes * porPaquete,
    sobrante_unidades: paquetes * porPaquete - cantidad,
  };
}

const NUMEROS_EN_LETRAS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

// Protección contra cantidades ambiguas (el prompt sola no basta): si el último mensaje del cliente no dice
// "paquete" ni "unidad" ni nombra la presentación (x12) y el modelo usa ese número como paquetes ("quiero 2" → 2
// paquetes, "30 hamburguesas" → 30 paquetes), o el mensaje es una cantidad suelta ("quiero 2", "un quesito"),
// la herramienta no elige: pide preguntarle al cliente.
function cantidadAmbigua(p: Producto, cantidad: number, tipo: TipoCantidad, mensaje: string): string | null {
  const porPaquete = unidadesPorPaquete(p);
  if (porPaquete === null || porPaquete <= 1 || !mensaje) return null;

  const texto = normalizar(mensaje);
  if (/\b(paquete|paquetes|paq|unidad|unidades|und)\b/.test(texto)) return null;
  if (new RegExp(`\\bx\\s?${porPaquete}\\b`).test(texto)) return null;

  const palabras = texto.split(" ");
  const numeros = new Set(palabras.map((w) => (/^\d+$/.test(w) ? Number(w) : NUMEROS_EN_LETRAS[w])).filter(Boolean));
  const suelta = /^(quiero|dame|ponme|son|serian|necesito|mejor|solo)?\s*(\d+|un|una|uno|dos|tres|cuatro|cinco)(\s+\S+)?$/.test(texto);
  if (!(suelta || (tipo === "paquetes" && numeros.has(cantidad)))) return null;

  const paquetes = Math.ceil(cantidad / porPaquete);
  return `Cantidad ambigua: el cliente escribió "${mensaje.slice(0, 80)}" sin decir si son paquetes o unidades, y "${p.nombre}" viene en paquete de ${porPaquete}. No cotices todavía: pregúntale si son paquetes o unidades (${cantidad} unidades = ${paquetes} ${paquetes === 1 ? "paquete" : "paquetes"}; ${cantidad} paquetes = ${cantidad * porPaquete} unidades).`;
}

function textoPedido(cantidad: number, tipo: TipoCantidad, c: Conversion): string {
  return tipo === "unidades"
    ? `pide ${cantidad} unidades (${c.paquetes} paquetes)`
    : `pide ${c.paquetes} paquetes`;
}

async function buscar(args: unknown): Promise<Resultado> {
  const consulta =
    typeof args === "object" && args !== null ? (args as { consulta?: unknown }).consulta : undefined;
  if (typeof consulta !== "string" || consulta.trim().length === 0 || consulta.length > 200) {
    return fallo("La consulta debe ser un texto de hasta 200 caracteres.");
  }

  // Primero por significado; si no hay resultados (o no hay índice, o falla la API), por palabras en el nombre
  // y, por último, en nombre, subcategoría y descripción.
  const semantico = await buscarSemantico(consulta, 6, 0);
  const porSignificado = (semantico?.productos ?? [])
    .map((x) => productos.find((p) => p.id === x.f.id))
    .filter((p): p is Producto => Boolean(p));
  const porNombre = porSignificado.length > 0 ? [] : buscarPorNombre(consulta, 6);
  const encontrados =
    porSignificado.length > 0 ? porSignificado : porNombre.length > 0 ? porNombre : buscarProductos(consulta, 6);
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
      nota: "Precios y existencias ficticios de demostración. Las existencias están en paquetes; unidades_por_paquete dice cuántas unidades trae cada uno (null si no se sabe).",
    },
    productos: encontrados,
  };
}

function existencias(args: unknown, ultimoMensaje: string): Resultado {
  const a = (typeof args === "object" && args !== null ? args : {}) as {
    producto_id?: unknown;
    cantidad?: unknown;
    tipo_cantidad?: unknown;
  };
  if (typeof a.producto_id !== "string" || !esTipo(a.tipo_cantidad) || !cantidadValida(a.cantidad, a.tipo_cantidad)) {
    return fallo(
      `Se requiere producto_id, tipo_cantidad ('paquetes' o 'unidades') y una cantidad entera (hasta ${MAX_CANTIDAD} paquetes o ${MAX_UNIDADES} unidades).`
    );
  }

  const { cantidad, tipo_cantidad: tipo } = a;
  const producto = productos.find((p) => p.id === a.producto_id);
  if (!producto) return fallo("Producto no encontrado. Usa un id devuelto por buscar_productos.");

  const ambigua = cantidadAmbigua(producto, cantidad, tipo, ultimoMensaje);
  if (ambigua) return fallo(ambigua);

  const conversion = convertir(producto, cantidad, tipo);
  if ("error" in conversion) return fallo(conversion.error);

  const alcanza = producto.existencias !== null && producto.existencias >= conversion.paquetes;

  // Alternativas: para unidades, cada una con sus propios paquetes necesarios.
  const alternativas = alcanza
    ? []
    : productos
        .filter((x) => x.id !== producto.id && x.categoria === producto.categoria && x.precio !== null)
        .map((x) => ({ x, c: convertir(x, cantidad, tipo) }))
        .filter(
          (y): y is { x: Producto; c: Conversion } =>
            !("error" in y.c) && y.x.existencias !== null && y.x.existencias >= y.c.paquetes
        )
        .sort(
          (y, z) =>
            Number(z.x.subcategoria === producto.subcategoria) - Number(y.x.subcategoria === producto.subcategoria)
        )
        .slice(0, 3);

  return {
    salida: {
      ok: true,
      producto: resumen(producto),
      cantidad_solicitada: cantidad,
      tipo_cantidad: tipo,
      ...conversion,
      alcanza,
      motivo: alcanza
        ? null
        : `${textoPedido(cantidad, tipo, conversion)} y hay ${producto.existencias ?? "desconocidas"} paquetes`,
      alternativas: alternativas.map(({ x, c }) => ({
        ...resumen(x),
        paquetes_necesarios: c.paquetes,
        misma_subcategoria: x.subcategoria === producto.subcategoria,
      })),
      nota: "Existencias ficticias de demostración, en paquetes. Las alternativas con misma_subcategoria=true son del mismo tipo de producto; las demás son solo de la misma categoría.",
    },
    productos: [producto, ...alternativas.map((y) => y.x)],
  };
}

function analizarItems(
  crudos: unknown,
  ultimoMensaje: string
): { ok: true; lineas: LineaCotizacion[] } | { ok: false; error: string } {
  if (!Array.isArray(crudos) || crudos.length === 0 || crudos.length > MAX_ITEMS_COTIZACION) {
    return { ok: false, error: `La lista de productos debe tener entre 1 y ${MAX_ITEMS_COTIZACION} elementos.` };
  }

  const porProducto = new Map<string, { cantidad: number; tipo: TipoCantidad }[]>();
  for (const it of crudos) {
    if (typeof it !== "object" || it === null) return { ok: false, error: "Elemento de producto inválido." };
    const { producto_id, cantidad, tipo_cantidad } = it as {
      producto_id?: unknown;
      cantidad?: unknown;
      tipo_cantidad?: unknown;
    };
    if (typeof producto_id !== "string" || !esTipo(tipo_cantidad) || !cantidadValida(cantidad, tipo_cantidad)) {
      return {
        ok: false,
        error: `Cada producto necesita un id, tipo_cantidad ('paquetes' o 'unidades') y una cantidad entera (hasta ${MAX_CANTIDAD} paquetes o ${MAX_UNIDADES} unidades).`,
      };
    }
    porProducto.set(producto_id, [...(porProducto.get(producto_id) ?? []), { cantidad, tipo: tipo_cantidad }]);
  }

  const lineas = Array.from(porProducto.entries()).map(([id, pedido]): LineaCotizacion => {
    const producto = productos.find((p) => p.id === id) ?? null;
    if (!producto) return { id, producto, pedido, conversion: null, problema: `el producto ${id} no existe en el catálogo` };
    if (producto.precio === null) {
      return { id, producto, pedido, conversion: null, problema: `"${producto.nombre}" no tiene precio disponible` };
    }

    // Si el mismo producto viene varias veces, se suman los paquetes de cada pedido.
    const ambigua = pedido.map((x) => cantidadAmbigua(producto, x.cantidad, x.tipo, ultimoMensaje)).find(Boolean);
    if (ambigua) return { id, producto, pedido, conversion: null, problema: ambigua };

    const partes = pedido.map((x) => convertir(producto, x.cantidad, x.tipo));
    const error = partes.find((x): x is { error: string } => "error" in x);
    if (error) return { id, producto, pedido, conversion: null, problema: error.error };

    const validas = partes as Conversion[];
    const conversion: Conversion = {
      paquetes: validas.reduce((s, x) => s + x.paquetes, 0),
      unidades_cubiertas: validas.every((x) => x.unidades_cubiertas !== null)
        ? validas.reduce((s, x) => s + (x.unidades_cubiertas ?? 0), 0)
        : null,
      sobrante_unidades: validas.some((x) => x.sobrante_unidades !== null)
        ? validas.reduce((s, x) => s + (x.sobrante_unidades ?? 0), 0)
        : null,
    };

    const disponibles = producto.existencias;
    const problema =
      disponibles === null || disponibles < conversion.paquetes
        ? `${pedido.map((x, i) => textoPedido(x.cantidad, x.tipo, validas[i])).join(" y ")} de "${producto.nombre}" y hay ${disponibles ?? "desconocidas"} paquetes`
        : null;
    return { id, producto, pedido, conversion, problema };
  });

  return { ok: true, lineas };
}

function cotizar(args: unknown, ultimoMensaje: string): Resultado {
  const items =
    typeof args === "object" && args !== null ? (args as { items?: unknown }).items : undefined;
  const analisis = analizarItems(items, ultimoMensaje);
  if (!analisis.ok) return fallo(analisis.error);

  const { lineas } = analisis;
  const subtotal = (l: LineaCotizacion) =>
    l.producto && l.producto.precio !== null && l.conversion && !l.problema
      ? l.producto.precio * l.conversion.paquetes
      : null;
  const parcial = lineas.reduce((suma, l) => suma + (subtotal(l) ?? 0), 0);
  const conProblemas = lineas.some((l) => l.problema !== null);

  return {
    salida: {
      ok: true,
      lineas: lineas.map((l) => ({
        producto_id: l.id,
        nombre: l.producto?.nombre ?? null,
        pedido: l.pedido.map((x) => ({ cantidad: x.cantidad, tipo_cantidad: x.tipo })),
        unidades_por_paquete: l.producto ? unidadesPorPaquete(l.producto) : null,
        paquetes: l.conversion?.paquetes ?? null,
        unidades_cubiertas: l.conversion?.unidades_cubiertas ?? null,
        sobrante_unidades: l.conversion?.sobrante_unidades ?? null,
        precio_por_paquete_cop: l.producto?.precio ?? null,
        existencias_demo_paquetes: l.producto?.existencias ?? null,
        subtotal_cop: subtotal(l),
        problema: l.problema,
      })),
      todas_las_lineas_validas: !conProblemas,
      // Con alguna línea con problema no hay total: nunca se informa 0 ni "no cumple el mínimo".
      total_productos_cop: conProblemas ? null : parcial,
      cumple_compra_minima: conProblemas ? null : parcial >= MINIMO_COMPRA,
      faltante_para_minimo_cop: conProblemas ? null : Math.max(0, MINIMO_COMPRA - parcial),
      total_parcial_solo_lineas_validas_cop:
        conProblemas && lineas.some((l) => subtotal(l) !== null) ? parcial : null,
      compra_minima_cop: MINIMO_COMPRA,
      nota: conProblemas
        ? "Hay líneas con problema, así que no hay total ni se puede decir si se cumple la compra mínima. Explica cada problema y pregunta cómo ajustar. No digas que el total es $0 ni que no se alcanza el mínimo."
        : "Cotización informativa con precios y existencias ficticios de demostración. No crea ningún pedido. El total no incluye el domicilio.",
    },
    productos: lineas.flatMap((l) => (l.producto ? [l.producto] : [])),
  };
}

// ultimoMensaje: el último mensaje del cliente, para detectar cantidades ambiguas.
export async function ejecutarHerramienta(nombre: string, argumentos: string, ultimoMensaje = ""): Promise<Resultado> {
  let args: unknown;
  try {
    args = JSON.parse(argumentos);
  } catch {
    return fallo("Argumentos inválidos.");
  }

  try {
    switch (nombre) {
      case "buscar_productos":
        return await buscar(args);
      case "consultar_existencias":
        return existencias(args, ultimoMensaje);
      case "cotizar_productos":
        return cotizar(args, ultimoMensaje);
      default:
        return fallo("Herramienta desconocida.");
    }
  } catch (e) {
    console.error("[herramienta] error en", nombre, e instanceof Error ? e.message : e);
    return fallo("Ocurrió un error interno al ejecutar la herramienta.");
  }
}
