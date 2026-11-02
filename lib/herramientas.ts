import type OpenAI from "openai";
import { buscarProductos, categorias, productos } from "./datos";
import { permitirSolicitud } from "./limite";
import { MINIMO_COMPRA } from "./config";
import {
  analizarItems,
  conReservas,
  disponibles,
  esConfirmacion,
  guardarSolicitud,
  reservasActivas,
  totalValido,
  validarSolicitud,
} from "./pedidos";
import type { Producto } from "./types";

export type ContextoHerramientas = {
  ip: string;
  ultimoMensajeUsuario: string;
  historialAsistente: string[];
  solicitudId?: string;
};

// "productos" son siempre los del catálogo base; las existencias netas solo van en "salida".
type Resultado = { salida: Record<string, unknown>; productos: Producto[] };

const esquemaItems = {
  type: "array",
  description: "Productos y cantidades.",
  items: {
    type: "object",
    properties: {
      producto_id: { type: "string", description: "Id del producto devuelto por buscar_productos." },
      cantidad: { type: "integer", description: "Unidades pedidas." },
    },
    required: ["producto_id", "cantidad"],
    additionalProperties: false,
  },
};

export const HERRAMIENTAS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "buscar_productos",
    description:
      "Busca productos en el catálogo de demostración por nombre, subcategoría o categoría. Devuelve hasta 6 productos con id, precio y existencias de demostración disponibles ahora.",
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
      "Consulta si hay existencias de demostración de un producto para una cantidad, descontando las reservas activas de otras solicitudes. Si no alcanza, devuelve alternativas con existencias suficientes, primero de la misma subcategoría y luego de la misma categoría.",
    parameters: {
      type: "object",
      properties: {
        producto_id: { type: "string", description: "Id del producto." },
        cantidad: { type: "integer", description: "Unidades que el cliente quiere." },
      },
      required: ["producto_id", "cantidad"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "calcular_total_pedido",
    description:
      "Calcula subtotales y el total de productos de un pedido, verifica existencias de demostración y la compra mínima. El total no incluye el domicilio.",
    parameters: {
      type: "object",
      properties: { items: esquemaItems },
      required: ["items"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "registrar_solicitud_pedido",
    description:
      "Registra una solicitud de pedido y aparta las unidades por unos minutos, para que una persona de la tienda la confirme. Llamar SOLO después de mostrar el 'Resumen de tu solicitud' y de que el cliente lo confirme con un sí claro.",
    parameters: {
      type: "object",
      properties: {
        items: esquemaItems,
        nombre: { type: "string", description: "Nombre del cliente." },
        telefono: { type: "string", description: "Celular colombiano de 10 dígitos." },
        municipio: { type: "string", description: "Municipio de entrega." },
        barrio: { type: "string", description: "Barrio de entrega." },
        direccion: { type: "string", description: "Dirección de entrega." },
        notas: { type: ["string", "null"], description: "Indicaciones adicionales, o null si no hay." },
        confirmado_por_cliente: {
          type: "boolean",
          description: "true solo si el cliente confirmó explícitamente el resumen.",
        },
      },
      required: ["items", "nombre", "telefono", "municipio", "barrio", "direccion", "notas", "confirmado_por_cliente"],
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

async function buscar(args: unknown): Promise<Resultado> {
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

  const reservas = await reservasActivas();
  return {
    salida: {
      ok: true,
      resultados: conReservas(encontrados, reservas).map(resumen),
      nota: "Precios y existencias ficticios de demostración. Las existencias ya descuentan reservas activas.",
    },
    productos: encontrados,
  };
}

async function existencias(args: unknown): Promise<Resultado> {
  const a = (typeof args === "object" && args !== null ? args : {}) as {
    producto_id?: unknown;
    cantidad?: unknown;
  };
  if (
    typeof a.producto_id !== "string" ||
    typeof a.cantidad !== "number" ||
    !Number.isInteger(a.cantidad) ||
    a.cantidad < 1 ||
    a.cantidad > 500
  ) {
    return fallo("Se requiere un producto_id y una cantidad entera entre 1 y 500.");
  }

  const cantidad = a.cantidad;
  const producto = productos.find((p) => p.id === a.producto_id);
  if (!producto) return fallo("Producto no encontrado. Usa un id devuelto por buscar_productos.");

  const reservas = await reservasActivas();
  const netas = disponibles(producto, reservas);
  const alcanza = netas !== null && netas >= cantidad;

  const candidatos = alcanza
    ? []
    : productos
        .filter((x) => x.id !== producto.id && x.categoria === producto.categoria && x.precio !== null)
        .map((x) => ({ base: x, neto: disponibles(x, reservas) }))
        .filter((x) => x.neto !== null && x.neto >= cantidad)
        .sort(
          (x, y) =>
            Number(y.base.subcategoria === producto.subcategoria) -
            Number(x.base.subcategoria === producto.subcategoria)
        )
        .slice(0, 3);

  return {
    salida: {
      ok: true,
      producto: resumen({ ...producto, existencias: netas }),
      cantidad_solicitada: cantidad,
      unidades_reservadas_por_otras_solicitudes: reservas.get(producto.id) ?? 0,
      alcanza,
      alternativas: candidatos.map(({ base, neto }) => ({
        ...resumen({ ...base, existencias: neto }),
        misma_subcategoria: base.subcategoria === producto.subcategoria,
      })),
      nota: "Existencias ficticias de demostración. Las alternativas con misma_subcategoria=true son del mismo tipo de producto; las demás son solo de la misma categoría.",
    },
    productos: [producto, ...candidatos.map((c) => c.base)],
  };
}

async function calcular(args: unknown): Promise<Resultado> {
  const items =
    typeof args === "object" && args !== null ? (args as { items?: unknown }).items : undefined;
  const analisis = analizarItems(items, await reservasActivas());
  if (!analisis.ok) return fallo(analisis.error);

  const lineas = analisis.valor;
  const total = totalValido(lineas);

  return {
    salida: {
      ok: true,
      lineas: lineas.map((l) => ({
        producto_id: l.id,
        nombre: l.producto?.nombre ?? null,
        cantidad: l.cantidad,
        precio_unitario_cop: l.producto?.precio ?? null,
        subtotal_cop:
          l.producto && l.producto.precio !== null && !l.problema ? l.producto.precio * l.cantidad : null,
        problema: l.problema,
      })),
      total_productos_cop: total,
      compra_minima_cop: MINIMO_COMPRA,
      cumple_compra_minima: total >= MINIMO_COMPRA,
      faltante_para_minimo_cop: Math.max(0, MINIMO_COMPRA - total),
      hay_problemas: lineas.some((l) => l.problema !== null),
      nota: "Precios y existencias ficticios de demostración. El total no incluye el domicilio.",
    },
    productos: lineas.flatMap((l) => (l.producto ? [l.producto] : [])),
  };
}

async function registrar(args: unknown, ctx: ContextoHerramientas): Promise<Resultado> {
  if (ctx.solicitudId) return fallo("Ya se registró una solicitud en este turno.");

  if (ctx.historialAsistente.some((t) => /SOL-\d{8}-\d{4}/.test(t))) {
    return fallo(
      "Ya se registró una solicitud en esta conversación. Para otra solicitud, el cliente debe iniciar una nueva conversación."
    );
  }

  if (!ctx.historialAsistente.some((t) => /resumen de tu solicitud/i.test(t))) {
    return fallo(
      "Todavía no se le mostró al cliente el resumen. Muéstralo con el título 'Resumen de tu solicitud', pregunta '¿Confirmas que registre la solicitud?' y, solo cuando responda que sí, vuelve a llamar esta herramienta."
    );
  }

  if (!esConfirmacion(ctx.ultimoMensajeUsuario)) {
    return fallo(
      "El último mensaje del cliente no es una confirmación clara. Pregunta '¿Confirmas que registre la solicitud?' y espera su respuesta."
    );
  }

  if (!permitirSolicitud(`pedido:${ctx.ip}`, 5, 600_000)) {
    return fallo("Se superó el límite de solicitudes para esta conexión. Sugiere intentarlo más tarde o escribir por WhatsApp.");
  }

  const validacion = validarSolicitud(args, await reservasActivas());
  if (!validacion.ok) return fallo(validacion.error);

  try {
    const solicitud = await guardarSolicitud(validacion.valor);
    ctx.solicitudId = solicitud.id;
    return {
      salida: {
        ok: true,
        numero_solicitud: solicitud.id,
        estado: solicitud.estado,
        total_productos_cop: solicitud.totalProductosDemo,
        domicilio: "Por confirmar por una persona de la tienda (no está incluido en el total).",
        reserva_minutos: solicitud.reservaMinutos,
        reserva_hasta: solicitud.reservaHastaBogota,
        nota: "Es una solicitud, no un pedido confirmado. Las unidades quedan apartadas en el inventario de demostración hasta reserva_hasta; si nadie la confirma en ese plazo, se liberan. Una persona la revisará y contactará al cliente.",
      },
      productos: [],
    };
  } catch (e) {
    if (e instanceof Error && e.message === "LIMITE_ARCHIVO") {
      return fallo("El archivo de solicitudes de la demostración está lleno. No se pudo registrar.");
    }
    if (e instanceof Error && e.message === "SIN_STOCK") {
      return fallo(
        "Otra solicitud acaba de apartar esas unidades y ya no alcanzan. Vuelve a consultar existencias y ajusta el pedido."
      );
    }
    throw e;
  }
}

export async function ejecutarHerramienta(
  nombre: string,
  argumentos: string,
  ctx: ContextoHerramientas
): Promise<Resultado> {
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
        return await existencias(args);
      case "calcular_total_pedido":
        return await calcular(args);
      case "registrar_solicitud_pedido":
        return await registrar(args, ctx);
      default:
        return fallo("Herramienta desconocida.");
    }
  } catch (e) {
    console.error("[herramienta] error en", nombre, e instanceof Error ? e.message : e);
    return fallo("Ocurrió un error interno al ejecutar la herramienta.");
  }
}