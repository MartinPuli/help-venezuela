// @ts-check
/**
 * Adaptador: encuentralos.tecnosoft.dev
 * Feed verificado en vivo: GET /api/personas -> JSON.
 * OPT-IN: requiere HABILITAR_FUENTES_REALES=1 (ver _externo.js).
 */

import { normalizarCrudo } from '../src/fuentes.js';
import { traerJSON, mapearEstado } from './_externo.js';

export const ID = 'encuentralos';
const URL = 'https://encuentralos.tecnosoft.dev/api/personas';

const MAPA = {
  nombre: 'nombre',
  edadAprox: 'edad',
  ubicacion: 'zona',
  reportadoEn: 'createdAt',
};

export async function obtenerCrudos() {
  const datos = await traerJSON(URL, { id: ID });
  if (!datos) return [];
  const arr = Array.isArray(datos) ? datos : (datos.personas ?? datos.data ?? []);
  return arr
    .filter((p) => p && (p.nombre || p.name))
    .map((p) => ({
      ...p,
      nombre: p.nombre ?? p.name,
      ubicacion: p.zona ?? p.ubicacion ?? p.lugar,
      estado: mapearEstado(p.estado ?? p.status),
      urlOrigen: 'https://encuentralos.tecnosoft.dev/',
    }));
}

/** @type {import('../src/fuentes.js').Fuente} */
export const fuente = {
  id: ID,
  obtenerCrudos,
  normalizar: (crudo) => normalizarCrudo(crudo, ID, MAPA),
};

export default fuente;
