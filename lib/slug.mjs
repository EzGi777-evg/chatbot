// Slug de URL: sin tildes ni eñes, en minúsculas y con guiones ("Azúcar y endulzantes" → "azucar-y-endulzantes").
// Es JavaScript (no TypeScript) para que los scripts de scripts/ usen exactamente la misma función con Node.

/**
 * @param {string} texto
 * @returns {string}
 */
export function aSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
