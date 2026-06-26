// @ts-check
/**
 * Genera el sitio estatico para GitHub Pages en `sitio/`.
 *
 * Como Pages no tiene servidor, dejamos:
 *   index.html        la pagina (misma de web/, con fallback de busqueda en cliente)
 *   personas.json     listado unificado y redactado
 *   feed.json         feed PFIF
 *   buscar-demo.json  dataset SINTETICO para la busqueda del lado del cliente
 *   .nojekyll         para que Pages no ignore archivos
 *
 * Los datos son los de EJEMPLO (sinteticos): es una DEMO.
 */

import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recolectar, adaptadorJSON, normalizarCrudo } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import { aPfifJson } from '../src/pfif.js';
import { redactarRegistro } from '../src/privacidad.js';
import {
  crudosSosVenezuela, crudosScraperPropio, crudosTerremotoApp, mapaTerremotoApp,
} from '../ejemplos/datos-ejemplo.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'sitio');

const registros = await recolectar([
  adaptadorJSON('sos-venezuela', async () => crudosSosVenezuela),
  adaptadorJSON('scraper-propio', async () => crudosScraperPropio),
  { id: 'terremoto-app', obtenerCrudos: async () => crudosTerremotoApp, normalizar: (c) => normalizarCrudo(c, 'terremoto-app', mapaTerremotoApp) },
]);
const { clusters } = cruzar(registros);

await mkdir(SALIDA, { recursive: true });
await copyFile(join(RAIZ, 'web', 'index.html'), join(SALIDA, 'index.html'));
await writeFile(join(SALIDA, '.nojekyll'), '');

const personas = clusters.map((r) => ({
  ...redactarRegistro(r, 'publico'),
  fuentes: /** @type {any} */ (r).fuentes ?? [r.fuente],
}));
await writeFile(join(SALIDA, 'personas.json'), JSON.stringify({ total: personas.length, personas }, null, 2));
await writeFile(join(SALIDA, 'feed.json'), JSON.stringify(aPfifJson(clusters, { publico: true }), null, 2));

// Dataset de busqueda (SINTETICO): cedula completa de ejemplo + nombre para el gate.
const buscarDemo = registros
  .filter((r) => r.cedula)
  .map((r) => ({ cedula: r.cedula, nombre: r.nombre, edadAprox: r.edadAprox, estado: r.estado }));
await writeFile(join(SALIDA, 'buscar-demo.json'), JSON.stringify(buscarDemo, null, 2));

console.log(`[build-pages] sitio/ generado: ${personas.length} personas, ${buscarDemo.length} buscables.`);
