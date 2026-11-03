// Prueba la función de slug (lib/slug.mjs) con los 60 pares categoría + subcategoría de data/categorias.json.
// Uso: npm run probar:slugs
import { readFileSync } from "node:fs";
import { aSlug } from "../lib/slug.mjs";

const categorias = JSON.parse(readFileSync(new URL("../data/categorias.json", import.meta.url), "utf8")).categorias;
const fallas = [];

// Casos conocidos de la función.
const ejemplos = [
  ["Azúcar y endulzantes", "azucar-y-endulzantes"],
  ["Servilletas, higiénicos y toallas", "servilletas-higienicos-y-toallas"],
  ["Piñata Ñandú", "pinata-nandu"],
  ["  Bases, cajas y domos  ", "bases-cajas-y-domos"],
];
for (const [entrada, esperado] of ejemplos) {
  const obtenido = aSlug(entrada);
  if (obtenido !== esperado) fallas.push(`aSlug(${JSON.stringify(entrada)}) = "${obtenido}", se esperaba "${esperado}"`);
}

const pares = categorias.flatMap((c) => c.subcategorias.map((nombre) => ({ categoria: c.id, nombre, slug: aSlug(nombre) })));
const rutas = new Map();

for (const p of pares) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) fallas.push(`slug con caracteres no permitidos: ${p.categoria} / "${p.nombre}" → "${p.slug}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.categoria)) fallas.push(`id de categoría no apto para URL: "${p.categoria}"`);
  const ruta = `/categoria/${p.categoria}/${p.slug}`;
  if (rutas.has(ruta)) fallas.push(`colisión: "${rutas.get(ruta)}" y "${p.nombre}" dan ${ruta}`);
  rutas.set(ruta, p.nombre);
}

// Nombres repetidos entre categorías: deben dar rutas distintas porque la ruta incluye la categoría.
const porNombre = new Map();
for (const p of pares) porNombre.set(p.nombre, [...(porNombre.get(p.nombre) ?? []), p.categoria]);
const repetidos = [...porNombre].filter(([, cats]) => cats.length > 1);

console.log(`${categorias.length} categorías, ${pares.length} pares, ${rutas.size} rutas de subcategoría distintas.`);
for (const [nombre, cats] of repetidos) {
  console.log(`Nombre repetido "${nombre}": ${cats.map((c) => `/categoria/${c}/${aSlug(nombre)}`).join(" y ")}`);
}

if (pares.length !== 60) fallas.push(`se esperaban 60 pares y hay ${pares.length}`);
if (fallas.length > 0) {
  fallas.forEach((f) => console.log(`✘ ${f}`));
  process.exit(1);
}
console.log(`✔ ${ejemplos.length} ejemplos correctos; ${pares.length} pares sin colisiones y solo con [a-z0-9-].`);
