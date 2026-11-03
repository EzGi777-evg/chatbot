// Prueba de humo: corre en orden todas las pruebas del proyecto y resume el resultado.
// Las dos primeras no necesitan servidor; las demás, el servidor en marcha (npm run dev o npm start).
// Usa la API de OpenAI (probar.sh, seguridad y evaluar): unos 50 mensajes por corrida.
// Uso: npm run test:humo   (otra URL: EVALUAR_URL=http://localhost:3001 npm run test:humo)
import { spawnSync } from "node:child_process";

const PASOS = [
  ["Privacidad (sin servidor)", "node", ["scripts/probar-privacidad.mjs"]],
  ["Slugs (sin servidor)", "node", ["scripts/probar-slugs.mjs"]],
  ["Mensajes sueltos (probar.sh)", "bash", ["scripts/probar.sh", "¿Cuál es la compra mínima?", "¿Hay aceite vegetal?", "Busco algo para limpiar la cocina"]],
  ["Rutas del catálogo", "node", ["scripts/verificar-rutas.mjs"]],
  ["Seguridad", "node", ["scripts/seguridad.mjs"]],
  ["Comportamiento (evaluar)", "node", ["scripts/evaluar.mjs"]],
];

const resultados = [];
for (const [nombre, comando, args] of PASOS) {
  console.log(`\n━━ ${nombre}`);
  const inicio = Date.now();
  const r = spawnSync(comando, args, { stdio: "inherit" });
  resultados.push({ nombre, ok: r.status === 0, s: Math.round((Date.now() - inicio) / 1000) });
}

console.log("\n━━ Resumen");
for (const r of resultados) console.log(`${r.ok ? "✔" : "✘"} ${r.nombre} (${r.s} s)`);
const fallidos = resultados.filter((r) => !r.ok).length;
console.log(fallidos === 0 ? "\n✔ Prueba de humo completa." : `\n✘ ${fallidos} paso(s) fallaron.`);
process.exit(fallidos === 0 ? 0 : 1);
