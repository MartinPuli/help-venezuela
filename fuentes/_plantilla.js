// @ts-check
/**
 * PLANTILLA DE ADAPTADOR DE FUENTE.
 *
 * Copia este archivo a `fuentes/<tu-fuente>.js`, complétalo y abre un PR.
 * Asi tu sitio/plataforma queda integrado a la capa de cruce sin que nadie
 * tenga que reescribir nada.
 *
 * Un adaptador hace dos cosas:
 *   1. obtenerCrudos(): trae los registros que TU fuente PUBLICA (un endpoint
 *      JSON, un feed PFIF, un CSV publico, o HTML publico que parseas).
 *   2. normalizar(crudo): lleva cada registro crudo al esquema comun.
 *
 * Reglas (ver CONTRIBUIR.md y SEGURIDAD.md):
 *   - Consume datos que la fuente PUBLICA o que tu operas. No incluyas scraping
 *     encubierto de plataformas de terceros que prohiben el acceso.
 *   - Respeta robots.txt, rate limits y ToS de la fuente.
 *   - No publiques en el feed datos sensibles (contacto, salud): eso lo filtra
 *     la capa de privacidad, pero no los traigas si no hacen falta.
 */

import { normalizarCrudo } from '../src/fuentes.js';

/** Id corto y estable de tu fuente (minusculas, sin espacios). */
export const ID = 'mi-fuente';

/**
 * Mapeo de campos: nombre-de-campo-en-tu-fuente -> nombre-estandar.
 * Solo necesitas declarar los que difieren del estandar. Estandar:
 *   id, nombre, cedula, edadAprox, sexo, ubicacion, lat, lon, estado,
 *   fechaUltimoContacto, fotoHash, urlOrigen, reportadoEn, verificado, notas, contacto
 * Ejemplo si tu fuente usa "name"/"ci"/"createdAt":
 *   { nombre: 'name', cedula: 'ci', reportadoEn: 'createdAt' }
 */
export const MAPA = {
  // nombre: 'name',
  // cedula: 'ci',
};

/**
 * Trae los registros crudos de tu fuente.
 * Reemplaza el cuerpo por tu fetch real. Debe devolver un arreglo de objetos.
 * @returns {Promise<any[]>}
 */
export async function obtenerCrudos() {
  // Ejemplo con un endpoint JSON publico:
  //   const res = await fetch('https://mi-fuente.example/api/desaparecidos.json');
  //   if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //   const datos = await res.json();
  //   return Array.isArray(datos) ? datos : datos.personas ?? [];
  return [];
}

/** @type {import('../src/fuentes.js').Fuente} */
export const fuente = {
  id: ID,
  obtenerCrudos,
  normalizar: (crudo) => normalizarCrudo(crudo, ID, MAPA),
};

export default fuente;
