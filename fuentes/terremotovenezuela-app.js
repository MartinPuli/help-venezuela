// @ts-check
/**
 * Adaptador: terremotovenezuela.app (mapa de emergencia open-source)
 * Feed verificado en vivo: GET /api/reports -> { reports: [...] }.
 * Solo nos interesan los reportes type === 'missing' (personas buscadas).
 * Los nombres/edades vienen en texto libre en el campo `needs`
 * (ej. "Se busca a Magaly obdeus 52 años"), asi que hacemos un parseo best-effort.
 *
 * OPT-IN: requiere HABILITAR_FUENTES_REALES=1 (ver _externo.js).
 */

import { normalizarCrudo } from '../src/fuentes.js';
import { traerJSON } from './_externo.js';

export const ID = 'terremotovenezuela-app';
const URL = 'https://terremotovenezuela.app/api/reports';

export async function obtenerCrudos() {
  const datos = await traerJSON(URL, { id: ID });
  if (!datos) return [];
  const reports = Array.isArray(datos) ? datos : (datos.reports ?? []);
  return reports
    .filter((r) => r && r.type === 'missing')
    .map((r) => {
      const { nombre, edad } = parseNeeds(r.needs || r.place || '');
      return {
        id: r.id,
        nombre: nombre || (r.needs ? String(r.needs).slice(0, 80) : 'Sin nombre'),
        edadAprox: edad,
        ubicacion: r.place,
        lat: r.lat,
        lng: r.lng,
        estado: 'desaparecido',
        reportadoEn: r.createdAt ? new Date(Number(r.createdAt)).toISOString() : undefined,
        urlOrigen: 'https://terremotovenezuela.app/',
      };
    });
}

/**
 * Extrae nombre y edad de un texto libre tipo "Se busca a Juan Perez 34 años".
 * Best-effort: si no logra, deja nombre vacio (el caller usa el texto crudo).
 * @param {string} texto
 * @returns {{nombre:string, edad:number|undefined}}
 */
function parseNeeds(texto) {
  let t = String(texto || '').trim();
  let edad;
  const mEdad = t.match(/(\d{1,3})\s*(?:a[nñ]os|años|edad)/i);
  if (mEdad) edad = Number(mEdad[1]);
  // Quitar prefijos y la parte de la edad.
  t = t
    .replace(/^\s*(se\s+busca\s+a|buscamos\s+a|desaparecid[oa]:?|se\s+busca:?)\s*/i, '')
    .replace(/\d{1,3}\s*(?:a[nñ]os|años).*$/i, '')
    .replace(/[.,;].*$/, '')
    .trim();
  // Heuristica: un nombre razonable tiene 2-5 palabras alfabeticas.
  const palabras = t.split(/\s+/).filter((w) => /[a-záéíóúñ]/i.test(w));
  const nombre = palabras.length >= 1 && palabras.length <= 6 ? palabras.join(' ') : '';
  return { nombre, edad };
}

/** @type {import('../src/fuentes.js').Fuente} */
export const fuente = {
  id: ID,
  obtenerCrudos,
  normalizar: (crudo) => normalizarCrudo(crudo, ID),
};

export default fuente;
