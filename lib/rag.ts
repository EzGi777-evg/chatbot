import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { buscarPorNombre, buscarPreguntas, buscarProductos, preguntas, productos } from "./datos";
import { obtenerCliente, resumirError } from "./openai";
import type { Pregunta, Producto } from "./types";

const ARCHIVO = path.join(process.cwd(), "data", "indice-embeddings.json");

// Puntaje mínimo de similitud y distancia máxima al mejor resultado (calibrados con npm run evaluar).
const UMBRAL_PRODUCTO = 0.42;
const UMBRAL_PREGUNTA = 0.45;
const MARGEN = 0.12;
const MAX_CACHE = 300;
// Tras una falla de la API de embeddings, no se reintenta durante este tiempo para no sumar latencia.
const PAUSA_TRAS_FALLA_MS = 60_000;

type Fragmento = {
  tipo: "producto" | "pregunta";
  id: string;
  texto: string;
  fuente: string;
  verificado: boolean;
  ficticio: boolean;
  vector: number[];
};

type Indice = {
  modelo: string;
  dimensiones: number;
  hashDatos: string;
  fragmentos: Fragmento[];
};

export type ModoRecuperacion = "semantico" | "palabras";

export type Recuperacion = {
  productos: Producto[];
  preguntas: Pregunta[];
  modo: ModoRecuperacion;
  ms: number;
};

let cargado: { mtimeMs: number; indice: Indice | null } | null = null;
const cacheConsultas = new Map<string, number[]>();
let pausaHasta = 0;

// Debe coincidir con el hash de scripts/indexar.mjs.
function hashDatos(): string {
  return createHash("sha256").update(JSON.stringify({ productos, preguntas })).digest("hex");
}

function avisar(motivo: string) {
  console.warn(`[rag] Uso el buscador por palabras: ${motivo}`);
}

// Lee el índice solo si cambió en disco; devuelve null si no sirve para los datos y el modelo actuales.
async function cargarIndice(): Promise<Indice | null> {
  let mtimeMs: number;
  try {
    mtimeMs = (await stat(ARCHIVO)).mtimeMs;
  } catch {
    if (cargado?.mtimeMs !== -1) avisar("no existe data/indice-embeddings.json (ejecuta npm run indexar).");
    cargado = { mtimeMs: -1, indice: null };
    return null;
  }
  if (cargado?.mtimeMs === mtimeMs) return cargado.indice;

  let indice: Indice | null = null;
  try {
    const datos = JSON.parse(await readFile(ARCHIVO, "utf8")) as Indice;
    if (datos.hashDatos !== hashDatos()) {
      avisar("el índice no corresponde a los datos actuales (ejecuta npm run indexar).");
    } else if (datos.modelo !== process.env.OPENAI_EMBEDDING_MODEL) {
      avisar(`el índice se generó con ${datos.modelo} y OPENAI_EMBEDDING_MODEL es otro.`);
    } else {
      indice = datos;
    }
  } catch (e) {
    avisar(`no pude leer el índice (${e instanceof Error ? e.message : e}).`);
  }
  cargado = { mtimeMs, indice };
  return indice;
}

async function embeber(consulta: string, indice: Indice): Promise<number[]> {
  const clave = consulta.toLowerCase().trim();
  const guardado = cacheConsultas.get(clave);
  if (guardado) return guardado;

  const r = await obtenerCliente().embeddings.create(
    { model: indice.modelo, input: consulta, dimensions: indice.dimensiones },
    { timeout: 5_000, maxRetries: 0 }
  );
  const v = r.data[0].embedding;
  const norma = Math.hypot(...v);
  const vector = v.map((x) => x / norma);

  if (cacheConsultas.size >= MAX_CACHE) {
    const primera = cacheConsultas.keys().next().value;
    if (primera !== undefined) cacheConsultas.delete(primera);
  }
  cacheConsultas.set(clave, vector);
  return vector;
}

function similitud(a: number[], b: number[]): number {
  let suma = 0;
  for (let i = 0; i < a.length; i++) suma += a[i] * b[i];
  return suma;
}

function mejores(
  puntuados: { f: Fragmento; puntaje: number }[],
  tipo: Fragmento["tipo"],
  umbral: number,
  limite: number
) {
  const delTipo = puntuados.filter((x) => x.f.tipo === tipo).sort((a, b) => b.puntaje - a.puntaje);
  const tope = delTipo[0]?.puntaje ?? 0;
  return delTipo.filter((x) => x.puntaje >= umbral && x.puntaje >= tope - MARGEN).slice(0, limite);
}

// Búsqueda semántica con puntajes; null si no hay índice válido o falla la API de embeddings.
export async function buscarSemantico(consulta: string, limiteProductos = 5, limitePreguntas = 3) {
  if (!consulta.trim() || Date.now() < pausaHasta) return null;
  const indice = await cargarIndice();
  if (!indice) return null;

  try {
    const q = await embeber(consulta, indice);
    const puntuados = indice.fragmentos.map((f) => ({ f, puntaje: similitud(q, f.vector) }));
    return {
      productos: mejores(puntuados, "producto", UMBRAL_PRODUCTO, limiteProductos),
      preguntas: mejores(puntuados, "pregunta", UMBRAL_PREGUNTA, limitePreguntas),
    };
  } catch (e) {
    pausaHasta = Date.now() + PAUSA_TRAS_FALLA_MS;
    avisar(`falló la API de embeddings (${resumirError(e)}); pauso la búsqueda semántica 60 s.`);
    return null;
  }
}

// partes: fragmentos de búsqueda de productos (cada producto pedido por separado); consulta: el mensaje
// completo, para las preguntas frecuentes y para el buscador por palabras de respaldo.
export async function recuperar(
  partes: string[],
  consulta: string,
  limiteProductos = 8,
  limitePreguntas = 3
): Promise<Recuperacion> {
  const inicio = performance.now();
  const [general, ...porParte] = await Promise.all([
    buscarSemantico(consulta, 3, limitePreguntas),
    ...partes.map((p) => buscarSemantico(p, 3, 0)),
  ]);
  const ms = Math.round(performance.now() - inicio);

  if (!general || porParte.some((x) => x === null)) {
    return {
      productos: buscarProductos(consulta, limiteProductos),
      preguntas: buscarPreguntas(consulta, limitePreguntas),
      modo: "palabras",
      ms,
    };
  }

  // Se intercalan los mejores de cada parte para que ningún producto pedido quede fuera. Si una parte no tiene
  // resultados semánticos (palabras que el modelo de embeddings no conoce, como "ripio"), se busca por nombre.
  const listas = [
    ...porParte.map((x, i) =>
      x && x.productos.length > 0 ? x.productos.map((y) => y.f.id) : buscarPorNombre(partes[i], 3).map((p) => p.id)
    ),
    general.productos.map((y) => y.f.id),
  ];
  const ids: string[] = [];
  for (let i = 0; ids.length < limiteProductos && listas.some((l) => i < l.length); i++) {
    for (const l of listas) if (l[i] && !ids.includes(l[i]) && ids.length < limiteProductos) ids.push(l[i]);
  }
  const encontrados = ids
    .map((id) => productos.find((p) => p.id === id))
    .filter((p): p is Producto => Boolean(p));

  // Las preguntas por palabras clave se suman: son pocas y sus palabras clave están curadas a mano.
  const idsPreguntas = new Set(general.preguntas.map((x) => x.f.id));
  buscarPreguntas(consulta, limitePreguntas).forEach((p) => idsPreguntas.add(p.id));
  const relevantes = preguntas.filter((p) => idsPreguntas.has(p.id));

  return { productos: encontrados, preguntas: relevantes, modo: "semantico", ms };
}
