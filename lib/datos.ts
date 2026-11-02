import categoriasData from "@/data/categorias.json";
import productosData from "@/data/productos.json";
import preguntasData from "@/data/preguntas.json";
import type { Categoria, Producto, Pregunta, TemaSinInformacion } from "./types";

export const categorias = categoriasData.categorias as Categoria[];
export const productos = productosData.productos as Producto[];
export const preguntas = preguntasData.preguntas as Pregunta[];
export const temasSinInformacion = preguntasData.temasSinInformacion as TemaSinInformacion[];

const PALABRAS_VACIAS = new Set([
  "los", "las", "una", "uno", "unos", "unas", "del", "por", "con", "que", "para",
  "quiero", "necesito", "busco", "hay", "tienen", "tiene", "son", "cual", "cuales",
  "como", "cuanto", "cuanta", "cuesta", "donde", "cuando", "esta", "estan", "mas",
  "muy", "sus", "mis", "tus", "algo", "algun", "alguna", "favor", "hola", "puedo",
  "pueden", "manejan", "venden", "tengo", "ustedes",
]);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t.length >= 3 && !PALABRAS_VACIAS.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

function coincide(consulta: Set<string>, token: string): boolean {
  if (consulta.has(token)) return true;
  if (token.length < 5) return false;
  for (const c of consulta) {
    if (c.length >= 5 && (token.startsWith(c) || c.startsWith(token))) return true;
  }
  return false;
}

export function buscarProductos(consulta: string, limite = 5): Producto[] {
  const q = new Set(tokens(consulta));
  if (q.size === 0) return [];

  return productos
    .map((p) => {
      const nombreCategoria = categorias.find((c) => c.id === p.categoria)?.nombre ?? "";
      const t = tokens(`${p.nombre} ${p.subcategoria} ${p.descripcion} ${nombreCategoria}`);
      const puntaje = t.filter((x) => coincide(q, x)).length;
      return { p, puntaje };
    })
    .filter((x) => x.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite)
    .map((x) => x.p);
}

function puntajeFrases(consulta: Set<string>, frases: string[]): number {
  let puntaje = 0;
  for (const frase of frases) {
    const t = tokens(frase);
    if (t.length > 0 && t.every((x) => coincide(consulta, x))) puntaje += t.length;
  }
  return puntaje;
}

export function buscarPreguntas(consulta: string, limite = 3): Pregunta[] {
  const q = new Set(tokens(consulta));
  if (q.size === 0) return [];

  return preguntas
    .map((p) => ({ p, puntaje: puntajeFrases(q, p.palabrasClave) }))
    .filter((x) => x.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite)
    .map((x) => x.p);
}

export function detectarTemasSinInformacion(consulta: string): string[] {
  const q = new Set(tokens(consulta));
  if (q.size === 0) return [];

  return temasSinInformacion
    .filter((t) => puntajeFrases(q, t.palabrasClave) > 0)
    .map((t) => t.tema);
}