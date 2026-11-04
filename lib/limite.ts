const registros = new Map<string, number[]>();

// Clave del límite. X-Forwarded-For lo puede escribir cualquier cliente, así que solo se usa con CONFIAR_EN_PROXY=1
// (detrás de un proxy propio que lo agrega); entonces vale su última entrada, la que puso ese proxy. Sin proxy no hay
// forma fiable de saber la IP y todas las solicitudes comparten un mismo contador.
export function claveDeCliente(encabezados: Headers): string {
  if (process.env.CONFIAR_EN_PROXY !== "1") return "todos";
  const ips = (encabezados.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return ips.at(-1) ?? "sin-ip";
}
const VENTANA_MAXIMA_MS = 3_600_000;

export function permitirSolicitud(clave: string, maximo = 30, ventanaMs = 60_000): boolean {
  const ahora = Date.now();
  const recientes = (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);

  if (recientes.length >= maximo) {
    registros.set(clave, recientes);
    return false;
  }

  recientes.push(ahora);
  registros.set(clave, recientes);

  if (registros.size > 1000) {
    for (const [k, marcas] of registros) {
      if (marcas.every((t) => ahora - t >= VENTANA_MAXIMA_MS)) registros.delete(k);
    }
  }
  return true;
}
