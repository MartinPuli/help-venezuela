// @ts-check
/**
 * Normalizacion de nombres y cedulas para poder comparar entre fuentes.
 *
 * El objetivo NO es "embellecer" el dato sino producir una forma canonica
 * estable: "José de la Cruz Peña" y "jose dela cruz pena" deben colapsar a
 * lo mismo para que el matching difuso no falle por tildes o particulas.
 */

/** Particulas que se ignoran al comparar nombres (no aportan a la identidad). */
const PARTICULAS = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'y', 'da', 'do', 'dos', 'das', 'di',
  'van', 'von', 'mc', 'mac', 'san', 'santa',
]);

/**
 * Quita tildes/diacriticos y pasa a minusculas.
 * @param {string} texto
 * @returns {string}
 */
export function sinTildes(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacriticas combinantes (incluye la tilde de la n)
    .replace(/ñ/g, 'n') // por si llega una n con tilde ya compuesta que NFD no separo
    .toLowerCase();
}

/**
 * Normaliza un nombre a forma canonica para comparacion.
 * - sin tildes, minusculas
 * - solo letras y espacios
 * - sin particulas (de, la, del...)
 * - tokens ordenados? NO: el orden importa poco pero lo conservamos para
 *   Jaro-Winkler; la comparacion por tokens se hace aparte en similitud.js.
 * @param {string} nombre
 * @returns {string}
 */
export function normalizarNombre(nombre) {
  if (nombre == null) return '';
  const base = sinTildes(nombre)
    .replace(/[^a-z\s]/g, ' ') // fuera numeros, signos, emojis
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  const tokens = base.split(' ').filter((t) => t && !PARTICULAS.has(t));
  // Si todo eran particulas (caso raro), devolvemos la base sin filtrar.
  return (tokens.length ? tokens : base.split(' ')).join(' ');
}

/**
 * Tokens de un nombre normalizado (para comparacion por conjuntos).
 * @param {string} nombre
 * @returns {string[]}
 */
export function tokensNombre(nombre) {
  const n = normalizarNombre(nombre);
  return n ? n.split(' ') : [];
}

/**
 * Normaliza una cedula venezolana a solo digitos.
 * Acepta formatos: "V-12.345.678", "v 12345678", "E12345678", 12345678.
 * Devuelve undefined si no quedan digitos (no es una llave usable).
 * @param {string|number|null|undefined} cedula
 * @returns {string|undefined}
 */
export function normalizarCedula(cedula) {
  if (cedula == null) return undefined;
  const digitos = String(cedula).replace(/\D/g, '');
  if (!digitos) return undefined;
  // Quita ceros a la izquierda para que "012345678" == "12345678".
  const limpia = digitos.replace(/^0+/, '') || digitos;
  // Cedulas venezolanas razonables: 5 a 9 digitos. Fuera de rango = sospechosa,
  // pero la devolvemos igual (la validacion estricta es responsabilidad de la fuente).
  return limpia;
}

/**
 * Prefijo nacional (V/E) si se puede inferir. Solo informativo.
 * @param {string|number|null|undefined} cedula
 * @returns {'V'|'E'|undefined}
 */
export function nacionalidadCedula(cedula) {
  if (cedula == null) return undefined;
  const m = String(cedula).trim().match(/^([VEve])/);
  if (!m) return undefined;
  return /** @type {'V'|'E'} */ (m[1].toUpperCase());
}

/**
 * Clave de bloqueo (blocking key) para reducir comparaciones O(n^2).
 * Agrupa registros que PODRIAN coincidir: por cedula exacta, o por
 * (primer token de nombre + inicial del segundo). Dos registros en bloques
 * distintos no se comparan (salvo que se pida comparacion exhaustiva).
 * @param {import('./esquema.js').Registro} reg
 * @returns {string[]} una o varias claves
 */
export function clavesBloqueo(reg) {
  const claves = [];
  if (reg.cedula) claves.push('ced:' + reg.cedula);
  const toks = reg.nombreNormalizado ? reg.nombreNormalizado.split(' ') : [];
  if (toks.length >= 1) {
    const primero = toks[0];
    const segundaInicial = toks[1] ? toks[1][0] : '';
    claves.push('nom:' + primero + (segundaInicial ? '|' + segundaInicial : ''));
    // Clave alterna por apellido probable (ultimo token) para tolerar orden.
    const ultimo = toks[toks.length - 1];
    if (ultimo && ultimo !== primero) claves.push('ape:' + ultimo);
  }
  if (!claves.length) claves.push('sin-clave');
  return claves;
}
