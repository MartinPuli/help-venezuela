// @ts-check
/**
 * Helper compartido por las funciones serverless de la DEMO en Vercel.
 * Construye el cruce a partir de las 3 fuentes de EJEMPLO (sinteticas),
 * reusando el mismo motor que el resto del proyecto. (El prefijo "_" hace
 * que Vercel NO lo exponga como endpoint.)
 */

import { recolectar, adaptadorJSON, normalizarCrudo } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import {
  crudosSosVenezuela,
  crudosScraperPropio,
  crudosTerremotoApp,
  mapaTerremotoApp,
} from '../ejemplos/datos-ejemplo.js';

export async function construir() {
  const registros = await recolectar([
    adaptadorJSON('sos-venezuela', async () => crudosSosVenezuela),
    adaptadorJSON('scraper-propio', async () => crudosScraperPropio),
    {
      id: 'terremoto-app',
      obtenerCrudos: async () => crudosTerremotoApp,
      normalizar: (c) => normalizarCrudo(c, 'terremoto-app', mapaTerremotoApp),
    },
  ]);
  const { clusters } = cruzar(registros);
  return { registros, clusters };
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-voluntario-token');
}
