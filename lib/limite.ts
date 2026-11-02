const registros = new Map<string, number[]>();
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
