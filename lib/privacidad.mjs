// Protección de datos personales en las respuestas: si el cliente escribió su teléfono o su dirección y el modelo
// los repite, se reemplazan por "[dato omitido]". Solo se omite lo que el cliente escribió (no cualquier dirección
// o número), y nunca el WhatsApp de la tienda. Es JavaScript para que scripts/probar-privacidad.mjs la pruebe.

const SEP = String.raw`[\s.\-]?`;
// Celular (3xx) y fijo (60x) de 10 dígitos, con +57/57 opcional, espacios, guiones, puntos o paréntesis.
const TELEFONO = new RegExp(
  String.raw`(?<!\d)(?:\+?57${SEP})?\(?(?:3\d{2}|60\d)\)?${SEP}\d{3}${SEP}\d{2}${SEP}\d{2}(?!\d)`,
  "g"
);

const TIPOS = String.raw`avenida\s+calle|avenida\s+carrera|calle|clle|cll|cl|carrera|kra|cra|crr|kr|cr|avenida|av|ac|ak|diagonal|diag|dg|transversal|trans|tv|tr|circular|cq|autopista|v[ií]a`;
const LETRA = String.raw`(?:\s?[a-z](?![a-z]))?(?:\s?bis\b)?(?:\s?[a-z](?![a-z]))?`;
const ORIENTACION = String.raw`(?:\s+(?:sur|norte|este|oeste)\b)?`;
const PLACA = String.raw`\s*(?:#|n[°º]\.?|no\.?|num\.?|n[uú]mero)\s*\d{1,3}${LETRA}(?:\s*-\s*\d{1,3})?${ORIENTACION}`;
const PARTES = String.raw`apartamento|apto|apt|torre|interior|int|casa|bloque|piso|oficina|local|manzana|mz|lote|etapa`;
const COMPLEMENTO = String.raw`(?:\s*,?\s*(?:${PARTES})\.?\s*[a-z]?\d+[a-z]?\b)*`;
const DIRECCION = new RegExp(
  String.raw`\b(?:${TIPOS})\.?\s*\d{1,3}${LETRA}${ORIENTACION}(?:${PLACA})?${COMPLEMENTO}|\b(?:${PARTES})\.?\s*[a-z]?\d+[a-z]?\b${COMPLEMENTO}`,
  "gi"
);

const soloDigitos = (s) => s.replace(/\D/g, "").slice(-10);

// Forma comparable de una dirección: "Carrera 43 A No. 10-50" y "Cra 43A #10-50" dan lo mismo.
function clave(direccion) {
  return direccion
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(?:carrera|kra|cra|crr|kr)\b/g, "cr")
    .replace(/\b(?:calle|clle|cll)\b/g, "cl")
    .replace(/\b(?:avenida|av)\b/g, "av")
    .replace(/\b(?:diagonal|diag)\b/g, "dg")
    .replace(/\b(?:transversal|trans|tr)\b/g, "tv")
    .replace(/\b(?:apartamento|apto|apt)\b/g, "apto")
    .replace(/(?:#|\bn[°º]|\bno\b|\bnum\b|\bnumero\b)\.?/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * @param {string} texto respuesta del modelo
 * @param {string[]} mensajesUsuario lo que escribió el cliente en la conversación
 * @param {string} protegido número que nunca se omite (el WhatsApp de la tienda)
 * @returns {string}
 */
export function omitirDatosPersonales(texto, mensajesUsuario, protegido) {
  const delCliente = mensajesUsuario.join("\n");
  const telefonos = new Set(
    (delCliente.match(TELEFONO) ?? []).map(soloDigitos).filter((t) => t !== protegido)
  );
  const direcciones = (delCliente.match(DIRECCION) ?? []).map(clave).filter((c) => c.length >= 4);

  return texto
    .replace(TELEFONO, (t) => (telefonos.has(soloDigitos(t)) ? "[dato omitido]" : t))
    .replace(DIRECCION, (d) => {
      const c = clave(d);
      return c.length >= 4 && direcciones.some((x) => x.includes(c) || c.includes(x)) ? "[dato omitido]" : d;
    });
}
