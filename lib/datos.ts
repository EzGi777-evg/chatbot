import categoriasData from "@/data/categorias.json";
import productosData from "@/data/productos.json";
import preguntasData from "@/data/preguntas.json";
import { aSlug } from "./slug.mjs";
import type { Categoria, Producto, Pregunta, TemaSinInformacion } from "./types";

export const categorias = categoriasData.categorias as Categoria[];
export const productos = productosData.productos as Producto[];
export const preguntas = preguntasData.preguntas as Pregunta[];
export const temasSinInformacion = preguntasData.temasSinInformacion as TemaSinInformacion[];

// --- Rutas del catálogo ---------------------------------------------------------------------------
// Una subcategoría se identifica siempre por el par categoría + subcategoría: "Guantes, gorros y
// tapabocas" existe en dos categorías. La categoría usa su id (ya es un slug); la subcategoría, aSlug.

export type Subcategoria = { categoria: Categoria; nombre: string; slug: string };

export const subcategorias: Subcategoria[] = categorias.flatMap((categoria) =>
  categoria.subcategorias.map((nombre) => ({ categoria, nombre, slug: aSlug(nombre) }))
);

// Si dos subcategorías de una misma categoría dieran el mismo slug, se falla al cargar (y el build no pasa).
for (const c of categorias) {
  const slugs = subcategorias.filter((s) => s.categoria.id === c.id).map((s) => s.slug);
  const repetido = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (repetido) throw new Error(`Slug de subcategoría repetido en "${c.id}": ${repetido}`);
}

export function rutaCategoria(categoria: Categoria): string {
  return `/categoria/${categoria.id}`;
}

export function rutaSubcategoria(sub: Subcategoria): string {
  return `/categoria/${sub.categoria.id}/${sub.slug}`;
}

export function categoriaPorSlug(slug: string): Categoria | undefined {
  return categorias.find((c) => c.id === slug);
}

export function subcategoriaPorSlugs(categoriaSlug: string, subcategoriaSlug: string): Subcategoria | undefined {
  return subcategorias.find((s) => s.categoria.id === categoriaSlug && s.slug === subcategoriaSlug);
}

export function subcategoriasDe(categoria: Categoria): Subcategoria[] {
  return subcategorias.filter((s) => s.categoria.id === categoria.id);
}

export function productosDeSubcategoria(sub: Subcategoria): Producto[] {
  return productos.filter((p) => p.categoria === sub.categoria.id && p.subcategoria === sub.nombre);
}

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

// Nombres del catálogo sin "[Demo]", del más largo al más corto, para que "Salsa de tomate 1 kg" no se cuente
// dentro de un nombre más largo.
const NOMBRES_POR_LARGO = productos
  .map((p) => ({ p, nombre: p.nombre.replace(/^\[Demo\]\s*/, "").toLowerCase() }))
  .sort((a, b) => b.nombre.length - a.nombre.length);

// Productos del catálogo cuyo nombre exacto aparece en el texto (por ejemplo, en respuestas anteriores del asistente).
export function productosMencionados(texto: string): Producto[] {
  let resto = texto.toLowerCase();
  const encontrados: Producto[] = [];
  for (const { p, nombre } of NOMBRES_POR_LARGO) {
    if (resto.includes(nombre)) {
      encontrados.push(p);
      resto = resto.split(nombre).join(" ");
    }
  }
  return encontrados;
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