// @ts-check
/**
 * Registro de fuentes. Descubre automaticamente todos los adaptadores en
 * `fuentes/*.js` (cada plataforma que alguien integro via PR) y los expone
 * como una lista lista para `recolectar()`.
 *
 * Para agregar tu fuente: copia `_plantilla.js` a `fuentes/<tu-fuente>.js`,
 * complétalo y abre un PR. No hay que tocar este archivo.
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fuentePersonasRepo } from './personas-repo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Archivos que no son adaptadores de fuente. */
const EXCLUIR = new Set(['registro.js', 'personas-repo.js', '_plantilla.js']);

/**
 * Carga todos los adaptadores de `fuentes/` mas la fuente del registro
 * comunitario de personas (`personas/`).
 * @returns {Promise<import('../src/fuentes.js').Fuente[]>}
 */
export async function cargarFuentes() {
  const fuentes = [fuentePersonasRepo()];

  let archivos = [];
  try {
    archivos = await readdir(AQUI);
  } catch {
    return fuentes;
  }

  for (const archivo of archivos) {
    if (!archivo.endsWith('.js')) continue;
    if (EXCLUIR.has(archivo)) continue;
    if (archivo.startsWith('_')) continue;
    try {
      const mod = await import(pathToFileURL(join(AQUI, archivo)).href);
      const f = mod.fuente ?? mod.default;
      if (f && typeof f.obtenerCrudos === 'function' && typeof f.normalizar === 'function') {
        fuentes.push(f);
      } else {
        console.warn(`[registro] ${archivo} no exporta una fuente valida (se omite)`);
      }
    } catch (e) {
      console.warn(`[registro] no se pudo cargar ${archivo}: ${e.message}`);
    }
  }

  return fuentes;
}
