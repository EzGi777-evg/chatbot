// Prueba la protección de datos personales (lib/privacidad.mjs) sin servidor ni OpenAI.
// Uso: npm run probar:privacidad
import { omitirDatosPersonales } from "../lib/privacidad.mjs";

const WHATSAPP = "3023322766";
const fallas = [];

// Datos que el cliente escribe y que no deben aparecer si el modelo los repite (tal cual o con otro formato).
const OMITIR = [
  ["Cra 43A #10-50", "Cra 43A #10-50"],
  ["Cra 43A #10-50", "Carrera 43 A No. 10-50"],
  ["Calle 37 Sur No. 45-10", "Calle 37 Sur No. 45-10"],
  ["Calle 37 Sur No. 45-10 apto 301", "Calle 37 Sur No. 45-10 apto 301"],
  ["Calle 37 Sur No. 45-10 apto 301", "apto 301"],
  ["apto 301", "apartamento 301"],
  ["carrera 70 # 44 - 21 apto 301", "carrera 70 # 44 - 21 apto 301"],
  ["Kr 15 # 80-20", "Kr 15 # 80-20"],
  ["Cll 10 # 5 - 33", "Calle 10 # 5-33"],
  ["Av. 80 # 45-10 torre 2 apto 1203", "Av. 80 # 45-10 torre 2 apto 1203"],
  ["Diagonal 75B No 2A-80 interior 4", "Diagonal 75B No 2A-80 interior 4"],
  ["Transversal 5 bis # 12-3", "Transversal 5 bis # 12-3"],
  ["Calle 10 Sur # 43A-50 casa 12", "Calle 10 Sur # 43A-50 casa 12"],
  ["Avenida Calle 26 # 68-35", "Avenida Calle 26 # 68-35"],
  ["300 123 4567", "300 123 4567"],
  ["300-123-4567", "300-123-4567"],
  ["300-123-4567", "3001234567"],
  ["3001234567", "300 123 45 67"],
  ["+57 300 123 4567", "+57 300 123 4567"],
  ["(300) 123 4567", "(300) 123 4567"],
  ["300.123.4567", "300.123.4567"],
  ["57-300-123-4567", "57-300-123-4567"],
  ["604 444 1234", "604 444 1234"],
  ["(601) 555-1234", "601 555 1234"],
];

for (const [cliente, eco] of OMITIR) {
  const salida = omitirDatosPersonales(`Anoté: ${eco}. Escribe al WhatsApp ${WHATSAPP}.`, [`mis datos: ${cliente}`], WHATSAPP);
  const resto = salida.replace("Anoté: ", "").replace(`. Escribe al WhatsApp ${WHATSAPP}.`, "");
  if (resto !== "[dato omitido]") fallas.push(`"${eco}" (cliente: "${cliente}") quedó como "${resto}"`);
  if (!salida.includes(WHATSAPP)) fallas.push(`se omitió el WhatsApp de la tienda con "${cliente}"`);
}

// Textos que no se deben tocar: el WhatsApp aunque el cliente lo escriba, precios, productos y datos que el cliente no dio.
const CONSERVAR = [
  ["mi celular es 3023322766", `Escríbenos al WhatsApp ${WHATSAPP} o al 302 332 2766.`],
  ["mi celular es 300 123 4567", "El total es $108.500 y la compra mínima es $80.000."],
  ["vivo en la Cra 43A #10-50", "Te sugiero Pan para hamburguesa x12, Carne de hamburguesa x10 y Aceite vegetal 3 L."],
  ["vivo en la Cra 43A #10-50", "La tienda está en la Calle 30 # 65-20."],
  ["quiero 3 paquetes", "Son 3 paquetes de Salchichas x12, 36 unidades, por $28.500."],
  ["necesito 30 hamburguesas", "Avena 500 g y Crema de leche 200 ml en el catálogo de demostración."],
];
for (const [cliente, texto] of CONSERVAR) {
  const salida = omitirDatosPersonales(texto, [cliente], WHATSAPP);
  if (salida !== texto) fallas.push(`cambió un texto que no debía: "${texto}" → "${salida}"`);
}

if (fallas.length > 0) {
  fallas.forEach((f) => console.log(`✘ ${f}`));
  process.exit(1);
}
console.log(`✔ ${OMITIR.length} datos personales omitidos y ${CONSERVAR.length} textos sin cambios.`);
