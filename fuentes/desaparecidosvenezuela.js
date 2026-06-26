// @ts-check
/**
 * Adaptador: desaparecidosvenezuela.com
 * Feed verificado en vivo: GET /api/personas -> JSON array.
 * Campos: { id, nombre, edad, zona, fotoUrl, descripcion, estado:'BUSCADO',
 *           tipo, oculto, lat, lng, createdAt, updatedAt }.
 *
 * OPT-IN: requiere HABILITAR_FUENTES_REALES=1 (ver _externo.js).
 */

import { normalizarCrudo } from '../src/fuentes.js';
import { traerJSON, mapearEstado } from './_externo.js';

export const ID = 'desaparecidosvenezuela';
const URL = 'https://www.desaparecidosvenezuela.com/api/personas';

const MAPA = {
  nombre: 'nombre',
  edadAprox: 'edad',
  ubicacion: 'zona',
  fechaUltimoContacto: 'createdAt',
  reportadoEn: 'createdAt',
  // lat/lng los reconoce normalizarCrudo via alias 'lat'/'lng'.
};

export async function obtenerCrudos() {
  const datos = await traerJSON(URL, { id: ID });
  if (!datos) return [];
  const arr = Array.isArray(datos) ? datos : (datos.personas ?? datos.data ?? []);
  return arr
    .filter((p) => p && p.nombre && p.oculto !== true)
    .map((p) => ({
      ...p,
      estado: mapearEstado(p.estado),
      urlOrigen: p.id ? `https://www.desaparecidosvenezuela.com/persona/${p.id}` : 'https://www.desaparecidosvenezuela.com/',
    }));
}

/** @type {import('../src/fuentes.js').Fuente} */
export const fuente = {
  id: ID,
  obtenerCrudos,
  normalizar: (crudo) => normalizarCrudo(crudo, ID, MAPA),
};

export default fuente;
