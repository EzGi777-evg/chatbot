// Recorre las 67 rutas del catálogo contra el servidor en marcha (npm run dev o npm start) y comprueba
// el estado HTTP, las tarjetas de producto y la estructura común. Uso: npm run verificar:rutas
// (otra URL: VERIFICAR_URL=http://localhost:3001 npm run verificar:rutas)
import { readFileSync } from "node:fs";
import { aSlug } from "../lib/slug.mjs";

const BASE = process.env.VERIFICAR_URL ?? "http://localhost:3000";
const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const categorias = leer("categorias.json").categorias;
const productos = leer("productos.json").productos;

const fallas = [];
let tarjetasTotales = 0;

async function pedir(ruta) {
  const res = await fetch(`${BASE}${ruta}`, { redirect: "manual" });
  return { status: res.status, html: await res.text() };
}

const tarjetas = (html) => [...html.matchAll(/data-tarjeta-producto="([^"]+)"/g)].map((m) => m[1]);
const titulo = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";

// Lo que debe estar en todas las páginas: aviso, botón del chat, pie y un título que diga que es una demostración.
function estructuraComun(ruta, html) {
  if (!html.includes("Demostración independiente. No es la tienda oficial")) fallas.push(`${ruta}: falta el aviso de demostración`);
  if (!html.includes('aria-label="Abrir asistente virtual"')) fallas.push(`${ruta}: falta el botón del chat`);
  if (!html.includes("Prototipo con fines ilustrativos")) fallas.push(`${ruta}: falta el pie`);
  if (!/demostraci/i.test(titulo(html))) fallas.push(`${ruta}: el título no dice que es una demostración ("${titulo(html)}")`);
}

try {
  await fetch(BASE);
} catch {
  console.error(`No pude conectarme con ${BASE}. ¿Está corriendo el servidor?`);
  process.exit(1);
}

let rutasOk = 0;
for (const c of categorias) {
  const rutaCat = `/categoria/${c.id}`;
  const cat = await pedir(rutaCat);
  if (cat.status !== 200) {
    fallas.push(`${rutaCat}: HTTP ${cat.status}`);
  } else {
    rutasOk++;
    estructuraComun(rutaCat, cat.html);
    for (const sub of c.subcategorias) {
      if (!cat.html.includes(`href="${rutaCat}/${aSlug(sub)}"`)) fallas.push(`${rutaCat}: falta el enlace a "${sub}"`);
    }
  }

  for (const sub of c.subcategorias) {
    const ruta = `${rutaCat}/${aSlug(sub)}`;
    const r = await pedir(ruta);
    if (r.status !== 200) {
      fallas.push(`${ruta}: HTTP ${r.status}`);
      continue;
    }
    rutasOk++;
    estructuraComun(ruta, r.html);

    // Exactamente los 5 productos de este par categoría + subcategoría, y no otros.
    const ids = tarjetas(r.html);
    const esperados = productos.filter((p) => p.categoria === c.id && p.subcategoria === sub).map((p) => p.id);
    tarjetasTotales += ids.length;
    if (ids.length !== 5) fallas.push(`${ruta}: ${ids.length} tarjetas (se esperaban 5)`);
    if (ids.sort().join() !== esperados.sort().join()) fallas.push(`${ruta}: las tarjetas no son los productos de "${sub}" en ${c.id}`);
    if (!r.html.includes(`href="${rutaCat}"`)) fallas.push(`${ruta}: falta el enlace para volver a la categoría`);
  }
}

// Rutas que no existen: categoría inventada, subcategoría inventada y un par cruzado (existe, pero en otra categoría).
const inexistentes = [
  "/categoria/no-existe",
  "/categoria/despensa/no-existe",
  `/categoria/despensa/${aSlug("Bolsas")}`,
];
for (const ruta of inexistentes) {
  const r = await pedir(ruta);
  if (r.status !== 404) fallas.push(`${ruta}: HTTP ${r.status} (se esperaba 404)`);
  else if (!r.html.includes("Página no encontrada")) fallas.push(`${ruta}: 404 sin la página propia`);
}

const esperadas = categorias.length + categorias.reduce((n, c) => n + c.subcategorias.length, 0);
console.log(`Rutas con HTTP 200: ${rutasOk}/${esperadas}.`);
console.log(`Tarjetas de producto en subcategorías: ${tarjetasTotales} (se esperaban ${productos.length}).`);
console.log(`Rutas inexistentes con 404 y página propia: ${inexistentes.join(", ")}.`);
if (tarjetasTotales !== productos.length) fallas.push(`total de tarjetas ${tarjetasTotales}, se esperaban ${productos.length}`);

if (fallas.length > 0) {
  fallas.forEach((f) => console.log(`✘ ${f}`));
  process.exit(1);
}
console.log("✔ Todas las comprobaciones pasaron.");
