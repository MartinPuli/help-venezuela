// @ts-check
/**
 * Fuente: registro comunitario de personas dentro de este repo.
 *
 * Cualquiera puede agregar a una persona desaparecida abriendo un PR con un
 * archivo JSON en `personas/`. Un voluntario revisa el PR (verificacion
 * humana) y al hacer merge la persona entra al cruce. Es el modelo
 * "PR para agregar personas".
 *
 * Cada archivo `personas/*.json` puede ser un objeto o un arreglo de objetos.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizarCrudo } from '../src/fuentes.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR_PERSONAS = join(AQUI, '..', 'personas');

/** @returns {import('../src/fuentes.js').Fuente} */
export function fuentePersonasRepo() {
  return {
    id: 'comunidad',
    obtenerCrudos: leerPersonas,
    normalizar: (crudo) => normalizarCrudo(crudo, 'comunidad'),
  };
}

/**
 * Lee todos los registros del directorio `personas/`.
 * @returns {Promise<any[]>}
 */
export async function leerPersonas() {
  let archivos = [];
  try {
    archivos = await readdir(DIR_PERSONAS);
  } catch {
    return []; // sin directorio aun
  }

  const crudos = [];
  for (const archivo of archivos) {
    if (!archivo.endsWith('.json')) continue;
    if (archivo.startsWith('_')) continue; // _plantilla.json, _esquema.json
    try {
      const texto = await readFile(join(DIR_PERSONAS, archivo), 'utf8');
      const datos = JSON.parse(texto);
      const lista = Array.isArray(datos) ? datos : [datos];
      for (const p of lista) {
        // id estable basado en el nombre de archivo si no trae id
        crudos.push({ id: p.id ?? archivo.replace(/\.json$/, ''), ...p });
      }
    } catch (e) {
      console.warn(`[personas] ${archivo} invalido: ${e.message}`);
    }
  }
  return crudos;
}
