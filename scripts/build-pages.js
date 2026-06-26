// @ts-check
/**
 * Genera el sitio estatico para GitHub Pages en `sitio/`.
 *
 * Con HABILITAR_FUENTES_REALES=1 trae datos REALES de las fuentes con feed
 * (desaparecidosvenezuela.com, terremotovenezuela.app, encuentralos...),
 * los cruza/deduplica y publica el listado REDACTADO. Si no hay datos reales
 * (flag apagado o fuentes caidas), cae a los datos de EJEMPLO (modo demo).
 *
 * Salidas:
 *   index.html      la pagina
 *   personas.json   { modo, generadoEn, total, personas }  (redactado)
 *   feed.json       feed PFIF
 *   .nojekyll
 *
 * NUNCA se publican: contacto, cedula completa, coordenadas exactas, fotos.
 */

import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarFuentes } from '../fuentes/registro.js';
import { recolectar, adaptadorJSON, normalizarCrudo } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import { aPfifJson } from '../src/pfif.js';
import { redactarRegistro } from '../src/privacidad.js';
import {
  crudosSosVenezuela, crudosScraperPropio, crudosTerremotoApp, mapaTerremotoApp,
} from '../ejemplos/datos-ejemplo.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'sitio');

async function recolectarReal() {
  const fuentes = await cargarFuentes();
  const registros = await recolectar(fuentes);
  // El registro "comunidad" (personas/) puede traer ejemplos; lo consideramos
  // real si hay datos de adaptadores externos. Contamos > la sola comunidad.
  const deExternas = registros.filter((r) => r.fuente !== 'comunidad');
  return { registros, hayReal: deExternas.length > 0 };
}

async function recolectarEjemplo() {
  return recolectar([
    adaptadorJSON('sos-venezuela', async () => crudosSosVenezuela),
    adaptadorJSON('scraper-propio', async () => crudosScraperPropio),
    { id: 'terremoto-app', obtenerCrudos: async () => crudosTerremotoApp, normalizar: (c) => normalizarCrudo(c, 'terremoto-app', mapaTerremotoApp) },
  ]);
}

const generadoEn = new Date().toISOString();

let registros = [];
let modo = 'demo';
try {
  const real = await recolectarReal();
  if (real.hayReal) { registros = real.registros; modo = 'real'; }
} catch (e) {
  console.warn('[build-pages] recoleccion real fallo:', e.message);
}
if (modo !== 'real') {
  registros = await recolectarEjemplo();
  modo = 'demo';
}

const { clusters } = cruzar(registros);

await mkdir(SALIDA, { recursive: true });
await copyFile(join(RAIZ, 'web', 'index.html'), join(SALIDA, 'index.html'));
await writeFile(join(SALIDA, '.nojekyll'), '');

const personas = clusters.map((r) => ({
  ...redactarRegistro(r, 'publico'),
  fuentes: /** @type {any} */ (r).fuentes ?? [r.fuente],
  urlOrigen: r.urlOrigen, // enlace a la fuente (no es dato sensible)
}));
await writeFile(join(SALIDA, 'personas.json'), JSON.stringify({ modo, generadoEn, total: personas.length, personas }, null, 2));
await writeFile(join(SALIDA, 'feed.json'), JSON.stringify(aPfifJson(clusters, { publico: true, generadoEn }), null, 2));

console.log(`[build-pages] sitio/ generado: modo=${modo}, ${personas.length} personas (de ${registros.length} reportes crudos).`);
