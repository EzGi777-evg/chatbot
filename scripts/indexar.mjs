// Genera data/indice-embeddings.json con los embeddings de productos y preguntas frecuentes.
// Uso: npm run indexar (carga las variables de .env.local).
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import OpenAI from "openai";

const DIMENSIONES = 512;
const SALIDA = "data/indice-embeddings.json";

const modelo = process.env.OPENAI_EMBEDDING_MODEL;
if (!process.env.OPENAI_API_KEY || !modelo) {
  console.error("Faltan OPENAI_API_KEY u OPENAI_EMBEDDING_MODEL en .env.local.");
  process.exit(1);
}

const productosData = JSON.parse(readFileSync("data/productos.json", "utf8"));
const preguntasData = JSON.parse(readFileSync("data/preguntas.json", "utf8"));
const categorias = JSON.parse(readFileSync("data/categorias.json", "utf8")).categorias;

// Debe coincidir con hashDatos() de lib/rag.ts: si los datos cambian, el índice se considera desactualizado.
const hashDatos = createHash("sha256")
  .update(JSON.stringify({ productos: productosData.productos, preguntas: preguntasData.preguntas }))
  .digest("hex");

// La descripción es 'Producto ficticio de demostración (subcategoría "X"): uso.'; solo se embebe el uso.
function usoDe(p) {
  const m = p.descripcion.match(/\):\s*(.+?)\.?$/);
  if (!m) throw new Error(`${p.id}: la descripción no tiene frase de uso.`);
  return m[1];
}

const fragmentos = [
  ...productosData.productos.map((p) => {
    const categoria = categorias.find((c) => c.id === p.categoria)?.nombre ?? p.categoria;
    return {
      tipo: "producto",
      id: p.id,
      texto: `${p.nombre.replace(/^\[Demo\]\s*/, "")}. ${p.subcategoria}. ${categoria}. ${usoDe(p)}.`,
      fuente: p.fuente,
      verificado: p.verificado,
      ficticio: p.fuente === "ficticio",
    };
  }),
  ...preguntasData.preguntas.map((q) => ({
    tipo: "pregunta",
    id: q.id,
    texto: `${q.pregunta} ${q.respuesta}`,
    fuente: q.fuente,
    verificado: q.verificado,
    ficticio: false,
  })),
];

function normalizar(v) {
  const norma = Math.hypot(...v);
  return v.map((x) => Number((x / norma).toFixed(6)));
}

const cliente = new OpenAI({ timeout: 60_000, maxRetries: 2 });
const inicio = performance.now();
const r = await cliente.embeddings.create({
  model: modelo,
  input: fragmentos.map((f) => f.texto),
  dimensions: DIMENSIONES,
});
const ms = Math.round(performance.now() - inicio);

const indice = {
  aviso: "Índice generado por scripts/indexar.mjs. Los productos son ficticios de demostración.",
  modelo,
  dimensiones: DIMENSIONES,
  creado: new Date().toISOString(),
  hashDatos,
  fragmentos: fragmentos.map((f, i) => ({ ...f, vector: normalizar(r.data[i].embedding) })),
};

writeFileSync(SALIDA, JSON.stringify(indice) + "\n");
console.log(
  `Indexados ${fragmentos.length} fragmentos (${productosData.productos.length} productos, ${preguntasData.preguntas.length} preguntas) en ${SALIDA}.`
);
console.log(`Modelo ${modelo}, ${DIMENSIONES} dimensiones, ${r.usage.prompt_tokens} tokens, ${ms} ms.`);
