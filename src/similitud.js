// @ts-check
/**
 * Metricas de similitud de cadenas, sin dependencias.
 *
 * Se usan para el matching difuso de nombres cuando NO hay cedula.
 * Jaro-Winkler tolera bien errores de tipeo y abreviaciones al inicio;
 * Levenshtein da una distancia de edicion clasica. La comparacion por
 * tokens (conjuntos) tolera nombres en distinto orden o incompletos.
 */

/**
 * Distancia de Levenshtein (numero minimo de inserciones/borrados/sustituciones).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  a = a ?? '';
  b = b ?? '';
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let fila = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) fila[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = fila[j];
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min(
        fila[j] + 1, // borrado
        fila[j - 1] + 1, // insercion
        anterior + costo, // sustitucion
      );
      anterior = temp;
    }
  }
  return fila[b.length];
}

/**
 * Similitud Levenshtein normalizada a [0,1].
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function similitudLevenshtein(a, b) {
  a = a ?? '';
  b = b ?? '';
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/**
 * Similitud de Jaro entre dos cadenas, en [0,1].
 * @param {string} s1
 * @param {string} s2
 * @returns {number}
 */
export function jaro(s1, s2) {
  s1 = s1 ?? '';
  s2 = s2 ?? '';
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const ventana = Math.max(0, Math.floor(Math.max(len1, len2) / 2) - 1);
  const coinc1 = new Array(len1).fill(false);
  const coinc2 = new Array(len2).fill(false);

  let coincidencias = 0;
  for (let i = 0; i < len1; i++) {
    const ini = Math.max(0, i - ventana);
    const fin = Math.min(i + ventana + 1, len2);
    for (let j = ini; j < fin; j++) {
      if (coinc2[j]) continue;
      if (s1[i] !== s2[j]) continue;
      coinc1[i] = true;
      coinc2[j] = true;
      coincidencias++;
      break;
    }
  }
  if (coincidencias === 0) return 0;

  // Transposiciones
  let transposiciones = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!coinc1[i]) continue;
    while (!coinc2[k]) k++;
    if (s1[i] !== s2[k]) transposiciones++;
    k++;
  }
  transposiciones /= 2;

  const m = coincidencias;
  return (m / len1 + m / len2 + (m - transposiciones) / m) / 3;
}

/**
 * Similitud de Jaro-Winkler en [0,1]. Premia prefijos comunes.
 * @param {string} s1
 * @param {string} s2
 * @param {number} [p=0.1] factor de escala del prefijo (estandar 0.1, max 0.25)
 * @returns {number}
 */
export function jaroWinkler(s1, s2, p = 0.1) {
  const j = jaro(s1, s2);
  if (j === 0) return 0;
  let prefijo = 0;
  const max = Math.min(4, Math.min((s1 ?? '').length, (s2 ?? '').length));
  for (let i = 0; i < max; i++) {
    if (s1[i] === s2[i]) prefijo++;
    else break;
  }
  return j + prefijo * p * (1 - j);
}

/**
 * Similitud por tokens (conjuntos de palabras). Usa el mejor emparejamiento
 * 1-a-1 entre tokens con Jaro-Winkler, promediado sobre el conjunto mayor.
 * Tolera nombres en distinto orden ("Pena Jose" vs "Jose Pena") y faltantes.
 * @param {string[]} tokensA
 * @param {string[]} tokensB
 * @returns {number} en [0,1]
 */
export function similitudTokens(tokensA, tokensB) {
  const a = (tokensA ?? []).filter(Boolean);
  const b = (tokensB ?? []).filter(Boolean);
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;

  const [chico, grande] = a.length <= b.length ? [a, b] : [b, a];
  const usados = new Array(grande.length).fill(false);
  let suma = 0;

  for (const t of chico) {
    let mejor = 0;
    let mejorIdx = -1;
    for (let i = 0; i < grande.length; i++) {
      if (usados[i]) continue;
      const s = jaroWinkler(t, grande[i]);
      if (s > mejor) {
        mejor = s;
        mejorIdx = i;
      }
    }
    if (mejorIdx >= 0) usados[mejorIdx] = true;
    suma += mejor;
  }
  // Promedio sobre el conjunto GRANDE: penaliza tokens sobrantes (nombres incompletos).
  return suma / grande.length;
}

/**
 * Similitud combinada de nombres normalizados: el maximo entre comparar la
 * cadena completa (Jaro-Winkler) y la comparacion por tokens. Quedarse con el
 * maximo evita penalizar de mas por orden de palabras.
 * @param {string} nombreNormA
 * @param {string} nombreNormB
 * @returns {number} en [0,1]
 */
export function similitudNombres(nombreNormA, nombreNormB) {
  const a = nombreNormA ?? '';
  const b = nombreNormB ?? '';
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const completa = jaroWinkler(a, b);
  const porTokens = similitudTokens(a.split(' '), b.split(' '));
  return Math.max(completa, porTokens);
}
