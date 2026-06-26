// @ts-check
/**
 * Demo end-to-end del cruce. Ejecutar: `npm run demo`.
 *
 * Muestra:
 *  1. Recolectar de 3 fuentes con formatos distintos.
 *  2. Cruzar (fusion automatica solo por cedula).
 *  3. Listar clusters fusionados, candidatos (revision humana) y posibles dups.
 *  4. Generar el feed PFIF publico (redactado).
 */

import { adaptadorJSON, normalizarCrudo, recolectar } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import { aPfifJson } from '../src/pfif.js';
import {
  crudosSosVenezuela,
  crudosScraperPropio,
  crudosTerremotoApp,
  mapaTerremotoApp,
} from './datos-ejemplo.js';

const fuentes = [
  adaptadorJSON('sos-venezuela', async () => crudosSosVenezuela),
  adaptadorJSON('scraper-propio', async () => crudosScraperPropio),
  {
    id: 'terremoto-app',
    obtenerCrudos: async () => crudosTerremotoApp,
    normalizar: (c) => normalizarCrudo(c, 'terremoto-app', mapaTerremotoApp),
  },
];

const registros = await recolectar(fuentes);
console.log(`\n== Registros normalizados: ${registros.length} ==`);
for (const r of registros) {
  console.log(`  [${r.fuente}] ${r.nombre}  ced=${r.cedula ?? '-'}  conf=${r.confianza}  estado=${r.estado}`);
}

const resultado = cruzar(registros);

console.log(`\n== Clusters (personas detectadas): ${resultado.clusters.length} ==`);
console.log(`   Fusiones automaticas por cedula: ${resultado.fusionesAutomaticas}`);
for (const c of resultado.clusters) {
  const meta = /** @type {any} */ (c);
  const fuentes = meta.fuentes ? ` <- ${meta.fuentes.join(', ')}` : '';
  console.log(`  * ${c.nombre}  ced=${c.cedula ?? '-'}  estado=${c.estado}${fuentes}`);
}

console.log(`\n== Candidatos a fusion (REQUIEREN revision humana): ${resultado.candidatos.length} ==`);
for (const par of resultado.candidatos) {
  console.log(`  ? ${par.a.nombre} [${par.a.fuente}]  <->  ${par.b.nombre} [${par.b.fuente}]`);
  console.log(`     tipo=${par.coincidencia.tipo} score=${par.coincidencia.score.toFixed(3)}`);
  for (const razon of par.coincidencia.razones) console.log(`     - ${razon}`);
}

console.log(`\n== Posibles duplicados (solo panel): ${resultado.posiblesDuplicados.length} ==`);
for (const par of resultado.posiblesDuplicados) {
  console.log(`  ~ ${par.a.nombre} [${par.a.fuente}]  <->  ${par.b.nombre} [${par.b.fuente}]  score=${par.coincidencia.score.toFixed(3)}`);
}

console.log(`\n== Feed PFIF publico (redactado) ==`);
const feed = aPfifJson(resultado.clusters, { publico: true });
console.log(JSON.stringify(feed, null, 2));
