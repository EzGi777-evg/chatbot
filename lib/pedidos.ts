import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizar, productos } from "./datos";
import { formatearPrecio } from "./formato";
import {
  MAX_CANTIDAD,
  MAX_ITEMS_PEDIDO,
  MAX_SOLICITUDES_ARCHIVO,
  MINIMO_COMPRA,
  RESERVA_MINUTOS,
  WHATSAPP,
} from "./config";
import type { Producto } from "./types";

const ARCHIVO = path.join(process.cwd(), "data", "pedidos", "solicitudes.json");

export const MUNICIPIOS = ["Envigado", "Itagüí", "La Estrella", "Medellín", "Sabaneta"];

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

export type LineaPedido = {
  id: string;
  cantidad: number;
  producto: Producto | null;
  problema: string | null;
};

export type ItemSolicitud = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitarioDemo: number;
  subtotalDemo: number;
};

export type Solicitud = {
  id: string;
  creadoEn: string;
  creadoEnBogota: string;
  estado: "pendiente_de_atencion_humana";
  cliente: { nombre: string; telefono: string };
  entrega: { municipio: string; barrio: string; direccion: string; notas: string };
  items: ItemSolicitud[];
  totalProductosDemo: number;
  costoDomicilio: string;
  reservaMinutos: number;
  reservaHasta: string;
  reservaHastaBogota: string;
  origen: "chatbot-demo";
  aviso: string;
};

export type DatosSolicitud = Omit<
  Solicitud,
  | "id"
  | "creadoEn"
  | "creadoEnBogota"
  | "estado"
  | "reservaMinutos"
  | "reservaHasta"
  | "reservaHastaBogota"
  | "origen"
  | "aviso"
>;

function error<T>(mensaje: string): Resultado<T> {
  return { ok: false, error: mensaje };
}

function limpiar(valor: unknown, min: number, max: number): string | null {
  if (typeof valor !== "string") return null;
  const sinControl = Array.from(valor)
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? " " : c))
    .join("");
  const texto = sinControl.replace(/\s+/g, " ").trim();
  return texto.length >= min && texto.length <= max ? texto : null;
}

function normalizarTelefono(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length === 12 && digitos.startsWith("57")) digitos = digitos.slice(2);
  return /^3\d{9}$/.test(digitos) ? digitos : null;
}

function municipioCanonico(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const buscado = normalizar(valor);
  return MUNICIPIOS.find((m) => normalizar(m) === buscado) ?? null;
}

const AFIRMATIVAS = new Set([
  "si", "confirmo", "confirmado", "correcto", "dale", "listo", "ok", "okay",
  "claro", "perfecto", "adelante", "hagale", "exacto", "afirmativo",
]);

export function esConfirmacion(texto: string): boolean {
  const normal = normalizar(texto);
  const palabras = normal.split(" ").filter(Boolean);
  if (palabras.length === 0 || palabras.length > 8) return false;
  if (["no", "pero", "cambia", "cambiar", "quitar", "agregar"].some((x) => palabras.includes(x))) {
    return false;
  }
  return palabras.some((p) => AFIRMATIVAS.has(p)) || normal.includes("de acuerdo");
}

function formatoHora(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}

async function leerSolicitudes(): Promise<Solicitud[]> {
  try {
    const bruto = await fs.readFile(ARCHIVO, "utf8");
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? (datos as Solicitud[]) : [];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

function reservadoPorSolicitudes(solicitudes: Solicitud[], ahora: number): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const s of solicitudes) {
    if (s.estado !== "pendiente_de_atencion_humana") continue;
    if (!s.reservaHasta || Date.parse(s.reservaHasta) <= ahora) continue;
    for (const it of s.items) {
      mapa.set(it.productoId, (mapa.get(it.productoId) ?? 0) + it.cantidad);
    }
  }
  return mapa;
}

// Unidades apartadas por solicitudes con reserva vigente (producto -> unidades).
export async function reservasActivas(): Promise<Map<string, number>> {
  try {
    return reservadoPorSolicitudes(await leerSolicitudes(), Date.now());
  } catch (e) {
    console.error("[pedidos] No se pudo leer el archivo de solicitudes:", e instanceof Error ? e.message : e);
    return new Map();
  }
}

export function disponibles(producto: Producto, reservas: Map<string, number>): number | null {
  if (producto.existencias === null) return null;
  return Math.max(0, producto.existencias - (reservas.get(producto.id) ?? 0));
}

// Copias de los productos con las existencias ya descontadas por las reservas vigentes.
export function conReservas(lista: Producto[], reservas: Map<string, number>): Producto[] {
  return lista.map((p) => ({ ...p, existencias: disponibles(p, reservas) }));
}

export function analizarItems(
  crudos: unknown,
  reservas: Map<string, number>
): Resultado<LineaPedido[]> {
  if (!Array.isArray(crudos) || crudos.length === 0 || crudos.length > MAX_ITEMS_PEDIDO) {
    return error(`La lista de productos debe tener entre 1 y ${MAX_ITEMS_PEDIDO} elementos.`);
  }

  const acumulado = new Map<string, number>();
  for (const it of crudos) {
    if (typeof it !== "object" || it === null) return error("Elemento de producto inválido.");
    const { producto_id, cantidad } = it as { producto_id?: unknown; cantidad?: unknown };
    if (
      typeof producto_id !== "string" ||
      typeof cantidad !== "number" ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > MAX_CANTIDAD
    ) {
      return error(`Cada producto necesita un id y una cantidad entera entre 1 y ${MAX_CANTIDAD}.`);
    }
    acumulado.set(producto_id, (acumulado.get(producto_id) ?? 0) + cantidad);
  }

  const lineas: LineaPedido[] = Array.from(acumulado.entries()).map(([id, cantidad]) => {
    const producto = productos.find((p) => p.id === id) ?? null;
    const disp = producto ? disponibles(producto, reservas) : null;
    let problema: string | null = null;
    if (!producto) problema = "El producto no existe en el catálogo.";
    else if (producto.precio === null) problema = "El producto no tiene precio disponible.";
    else if (disp === null || disp < cantidad) {
      problema = `Existencias de demostración insuficientes (disponibles ahora: ${disp ?? "desconocidas"}, ya descontadas las reservas activas).`;
    }
    return { id, cantidad, producto, problema };
  });

  return { ok: true, valor: lineas };
}

export function totalValido(lineas: LineaPedido[]): number {
  return lineas.reduce(
    (suma, l) =>
      l.producto && l.producto.precio !== null && !l.problema
        ? suma + l.producto.precio * l.cantidad
        : suma,
    0
  );
}

export function validarSolicitud(
  args: unknown,
  reservas: Map<string, number>
): Resultado<DatosSolicitud> {
  if (typeof args !== "object" || args === null) return error("Datos de solicitud inválidos.");
  const a = args as Record<string, unknown>;

  if (a.confirmado_por_cliente !== true) return error("Falta la confirmación explícita del cliente.");

  const nombre = limpiar(a.nombre, 2, 80);
  if (!nombre) return error("El nombre del cliente es obligatorio (2 a 80 caracteres).");

  const telefono = normalizarTelefono(a.telefono);
  if (!telefono) {
    return error("El teléfono debe ser un celular colombiano de 10 dígitos que empiece por 3 (por ejemplo 3001234567).");
  }

  const municipio = municipioCanonico(a.municipio);
  if (!municipio) {
    return error(
      `El municipio no está dentro de la cobertura publicada (${MUNICIPIOS.join(", ")}). Para otros lugares, el cliente debe escribir al WhatsApp ${WHATSAPP}.`
    );
  }

  const barrio = limpiar(a.barrio, 2, 80);
  if (!barrio) return error("El barrio es obligatorio (2 a 80 caracteres).");

  const direccion = limpiar(a.direccion, 5, 120);
  if (!direccion) return error("La dirección es obligatoria (5 a 120 caracteres).");

  const notas = a.notas === null || a.notas === undefined ? "" : limpiar(a.notas, 0, 200);
  if (notas === null) return error("Las indicaciones no pueden superar 200 caracteres.");

  const analisis = analizarItems(a.items, reservas);
  if (!analisis.ok) return analisis;

  const items: ItemSolicitud[] = [];
  const problemas: string[] = [];
  for (const l of analisis.valor) {
    if (l.problema || !l.producto || l.producto.precio === null) {
      problemas.push(`${l.producto?.nombre ?? l.id}: ${l.problema ?? "sin precio"}`);
      continue;
    }
    items.push({
      productoId: l.id,
      nombre: l.producto.nombre,
      cantidad: l.cantidad,
      precioUnitarioDemo: l.producto.precio,
      subtotalDemo: l.producto.precio * l.cantidad,
    });
  }
  if (problemas.length > 0) return error(`Hay productos con problemas: ${problemas.join(" | ")}`);

  const total = items.reduce((s, i) => s + i.subtotalDemo, 0);
  if (total < MINIMO_COMPRA) {
    return error(
      `El total de productos es ${formatearPrecio(total)} y la compra mínima es ${formatearPrecio(MINIMO_COMPRA)}. Faltan ${formatearPrecio(MINIMO_COMPRA - total)}.`
    );
  }

  return {
    ok: true,
    valor: {
      cliente: { nombre, telefono },
      entrega: { municipio, barrio, direccion, notas },
      items,
      totalProductosDemo: total,
      costoDomicilio: "por confirmar por una persona de la tienda",
    },
  };
}

let cola: Promise<unknown> = Promise.resolve();

function enCola<T>(tarea: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(tarea, tarea);
  cola = siguiente.catch(() => undefined);
  return siguiente;
}

export function guardarSolicitud(datos: DatosSolicitud): Promise<Solicitud> {
  return enCola(async () => {
    const existentes = await leerSolicitudes();
    if (existentes.length >= MAX_SOLICITUDES_ARCHIVO) throw new Error("LIMITE_ARCHIVO");

    const ahora = new Date();

    // Idempotencia: si el mismo cliente repite la misma solicitud mientras su reserva sigue vigente
    // (por ejemplo, al reintentar tras un error), se devuelve la existente en vez de duplicarla.
    const firma = (items: ItemSolicitud[]) =>
      items.map((i) => `${i.productoId}x${i.cantidad}`).sort().join("|");
    const repetida = existentes.find(
      (s) =>
        s.estado === "pendiente_de_atencion_humana" &&
        Date.parse(s.reservaHasta) > ahora.getTime() &&
        s.cliente.telefono === datos.cliente.telefono &&
        firma(s.items) === firma(datos.items)
    );
    if (repetida) return repetida;

    // Segunda comprobación de stock dentro de la cola, por si otra solicitud reservó mientras tanto.
    const reservas = reservadoPorSolicitudes(existentes, ahora.getTime());
    for (const it of datos.items) {
      const producto = productos.find((p) => p.id === it.productoId);
      const disp = producto ? disponibles(producto, reservas) : null;
      if (disp === null || disp < it.cantidad) throw new Error("SIN_STOCK");
    }

    const hasta = new Date(ahora.getTime() + RESERVA_MINUTOS * 60_000);
    const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" })
      .format(ahora)
      .replace(/-/g, "");
    const delDia = existentes.filter((s) => s.id.startsWith(`SOL-${fecha}-`)).length;

    const solicitud: Solicitud = {
      id: `SOL-${fecha}-${String(delDia + 1).padStart(4, "0")}`,
      creadoEn: ahora.toISOString(),
      creadoEnBogota: new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(ahora),
      estado: "pendiente_de_atencion_humana",
      ...datos,
      reservaMinutos: RESERVA_MINUTOS,
      reservaHasta: hasta.toISOString(),
      reservaHastaBogota: formatoHora(hasta),
      origen: "chatbot-demo",
      aviso: "Solicitud de demostración. Productos, precios y existencias son ficticios. Requiere atención de una persona.",
    };

    await fs.mkdir(path.dirname(ARCHIVO), { recursive: true });
    const temporal = `${ARCHIVO}.tmp`;
    await fs.writeFile(temporal, JSON.stringify([...existentes, solicitud], null, 2) + "\n", "utf8");
    await fs.rename(temporal, ARCHIVO);
    return solicitud;
  });
}