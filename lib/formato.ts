const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearPrecio(precio: number | null): string {
  return precio === null ? "Precio por verificar" : formatoCOP.format(precio);
}

export type NivelExistencias = "ok" | "bajo" | "agotado" | "desconocido";

export function describirExistencias(existencias: number | null): {
  texto: string;
  nivel: NivelExistencias;
} {
  if (existencias === null) return { texto: "Existencias por verificar", nivel: "desconocido" };
  if (existencias <= 0) return { texto: "Agotado (inventario de demostración)", nivel: "agotado" };
  if (existencias <= 5) return { texto: "Pocas unidades (inventario de demostración)", nivel: "bajo" };
  return { texto: "Disponible (inventario de demostración)", nivel: "ok" };
}