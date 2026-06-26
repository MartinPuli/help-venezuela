// @ts-check
/**
 * Perceptual hashing (dHash) para detectar la MISMA foto reposteada en
 * varias plataformas. Sin dependencias.
 *
 * LIMITE ETICO DELIBERADO (ver SEGURIDAD.md):
 *  - Esto NO es reconocimiento facial. Solo dice "esta imagen es (casi) la
 *    misma imagen". Sirve para deduplicar el mismo post replicado.
 *  - Para decir "esta foto DISTINTA es la misma persona" haria falta
 *    reconocimiento facial, y eso NO se implementa aqui: en contexto de vida
 *    o muerte un falso positivo hace daño real a una familia. Cualquier
 *    coincidencia por foto distinta debe ir a revision humana, jamas
 *    auto-confirmarse.
 *
 * Para no arrastrar dependencias de decodificacion de imagenes, este modulo
 * trabaja sobre PIXELES EN ESCALA DE GRISES ya decodificados. Quien llame
 * provee `{ width, height, datos: Uint8Array|number[] }` (gris 0..255,
 * fila por fila). En el README se muestra como obtenerlos con `sharp`,
 * `@napi-rs/canvas` o el <canvas> del navegador.
 */

const ANCHO = 9; // dHash compara 8 diferencias horizontales por fila => 8 bits/fila
const ALTO = 8; // 8 filas => 64 bits

/**
 * @typedef {Object} ImagenGris
 * @property {number} width
 * @property {number} height
 * @property {Uint8Array|number[]} datos  gris 0..255, longitud width*height, fila por fila
 */

/**
 * Calcula el dHash (64 bits, 16 chars hex) de una imagen en escala de grises.
 * @param {ImagenGris} imagen
 * @returns {string} hash hex de 16 caracteres
 */
export function dHash(imagen) {
  if (!imagen || !imagen.datos || !imagen.width || !imagen.height) {
    throw new Error('dHash: se esperaba { width, height, datos }');
  }
  const reducida = redimensionarGris(imagen, ANCHO, ALTO);
  let bits = '';
  for (let y = 0; y < ALTO; y++) {
    for (let x = 0; x < ANCHO - 1; x++) {
      const izq = reducida[y * ANCHO + x];
      const der = reducida[y * ANCHO + x + 1];
      bits += izq < der ? '1' : '0';
    }
  }
  return binarioAHex(bits);
}

/**
 * Distancia de Hamming entre dos hashes hex (numero de bits distintos).
 * @param {string} hexA
 * @param {string} hexB
 * @returns {number}
 */
export function distanciaHamming(hexA, hexB) {
  if (!hexA || !hexB) return 64;
  const a = BigInt('0x' + hexA);
  const b = BigInt('0x' + hexB);
  let x = a ^ b;
  let dist = 0;
  while (x > 0n) {
    dist += Number(x & 1n);
    x >>= 1n;
  }
  return dist;
}

/**
 * ¿Son (casi) la misma imagen? Umbral por defecto 10/64.
 * @param {string} hexA
 * @param {string} hexB
 * @param {number} [umbral=10]
 * @returns {boolean}
 */
export function mismaImagen(hexA, hexB, umbral = 10) {
  return distanciaHamming(hexA, hexB) <= umbral;
}

// ---------------------------------------------------------------------------

/**
 * Redimensiona por muestreo de area (promedio) a anchoDest x altoDest.
 * @param {ImagenGris} img
 * @param {number} anchoDest
 * @param {number} altoDest
 * @returns {number[]} gris destino, fila por fila
 */
function redimensionarGris(img, anchoDest, altoDest) {
  const { width: w, height: h, datos } = img;
  const salida = new Array(anchoDest * altoDest);
  for (let dy = 0; dy < altoDest; dy++) {
    const y0 = Math.floor((dy * h) / altoDest);
    const y1 = Math.max(y0 + 1, Math.floor(((dy + 1) * h) / altoDest));
    for (let dx = 0; dx < anchoDest; dx++) {
      const x0 = Math.floor((dx * w) / anchoDest);
      const x1 = Math.max(x0 + 1, Math.floor(((dx + 1) * w) / anchoDest));
      let suma = 0;
      let cuenta = 0;
      for (let y = y0; y < y1 && y < h; y++) {
        for (let x = x0; x < x1 && x < w; x++) {
          suma += datos[y * w + x];
          cuenta++;
        }
      }
      salida[dy * anchoDest + dx] = cuenta ? suma / cuenta : 0;
    }
  }
  return salida;
}

/** @param {string} bin cadena de '0'/'1' (multiplo de 4) @returns {string} hex */
function binarioAHex(bin) {
  let hex = '';
  for (let i = 0; i < bin.length; i += 4) {
    hex += parseInt(bin.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/**
 * Utilidad: convierte RGBA (Uint8ClampedArray del canvas) a ImagenGris.
 * Luminancia perceptual (Rec. 601).
 * @param {Uint8Array|Uint8ClampedArray|number[]} rgba
 * @param {number} width
 * @param {number} height
 * @returns {ImagenGris}
 */
export function rgbaAGris(rgba, width, height) {
  const datos = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < datos.length; i++, p += 4) {
    datos[i] = Math.round(0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]);
  }
  return { width, height, datos };
}
