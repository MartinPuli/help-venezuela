// @ts-check
/**
 * Pipeline de recoleccion + cruce. Es lo que corre el workflow programado
 * (.github/workflows/recolectar.yml) cada X tiempo:
 *
 *   1. Carga TODAS las fuentes (adaptadores en fuentes/ + registro comunitario).
 *   2. Recolecta y normaliza al esquema comun.
 *   3. Cruza (fusion automatica solo por cedula; resto a revision humana).
 *   4. Escribe los datos UNIFICADOS aqui:
 *        publico/feed.json   feed PFIF redactado (consumible por cualquier sitio)
 *        publico/feed.xml    idem en XML
 *        publico/personas.json  vista publica amigable de las personas
 *        publico/estado.json    estadisticas y contadores (sin PII)
 *
 * PRIVACIDAD: a `publico/` SOLO va informacion redactada (sin contacto, sin
 * cedula completa, sin coords exactas, sin fotos). Los datos crudos se
 * escriben en `datos/` (que esta en .gitignore) para el uso del servidor /
 * canal de voluntarios, y NUNCA se commitean.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarFuentes } from '../fuentes/registro.js';
import { recolectar } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import { aPfifJson, aPfifXml } from '../src/pfif.js';
import { redactarRegistro } from '../src/privacidad.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_PUBLICO = join(RAIZ, 'publico');
const DIR_DATOS = join(RAIZ, 'datos'); // gitignored

async function main() {
  const generadoEn = new Date().toISOString();
  console.log(`[recolectar] inicio ${generadoEn}`);

  const fuentes = await cargarFuentes();
  console.log(`[recolectar] fuentes activas: ${fuentes.map((f) => f.id).join(', ') || '(ninguna)'}`);

  const registros = await recolectar(fuentes);
  console.log(`[recolectar] registros normalizados: ${registros.length}`);

  const resultado = cruzar(registros);
  console.log(
    `[recolectar] clusters=${resultado.clusters.length} ` +
    `fusiones=${resultado.fusionesAutomaticas} ` +
    `candidatos=${resultado.candidatos.length} ` +
    `posiblesDup=${resultado.posiblesDuplicados.length}`,
  );

  // --- Salidas PUBLICAS (redactadas) ---
  await mkdir(DIR_PUBLICO, { recursive: true });

  const feedJson = aPfifJson(resultado.clusters, { publico: true, generadoEn });
  await writeFile(join(DIR_PUBLICO, 'feed.json'), JSON.stringify(feedJson, null, 2) + '\n');

  const feedXml = aPfifXml(resultado.clusters, { publico: true });
  await writeFile(join(DIR_PUBLICO, 'feed.xml'), feedXml + '\n');

  const personasPublicas = resultado.clusters.map((r) => ({
    ...redactarRegistro(r, 'publico'),
    fuentes: /** @type {any} */ (r).fuentes ?? [r.fuente],
  }));
  await writeFile(
    join(DIR_PUBLICO, 'personas.json'),
    JSON.stringify({ generadoEn, total: personasPublicas.length, personas: personasPublicas }, null, 2) + '\n',
  );

  const estado = {
    generadoEn,
    fuentesActivas: fuentes.map((f) => f.id),
    totales: {
      registrosEntrada: registros.length,
      personas: resultado.clusters.length,
      fusionesAutomaticasPorCedula: resultado.fusionesAutomaticas,
      candidatosRevisionHumana: resultado.candidatos.length,
      posiblesDuplicados: resultado.posiblesDuplicados.length,
    },
    porEstado: contarPorEstado(resultado.clusters),
    porFuente: contarPorFuente(registros),
  };
  await writeFile(join(DIR_PUBLICO, 'estado.json'), JSON.stringify(estado, null, 2) + '\n');

  // --- Salidas CRUDAS (gitignored, para el servidor / voluntarios) ---
  await mkdir(DIR_DATOS, { recursive: true });
  await writeFile(
    join(DIR_DATOS, 'crudo.json'),
    JSON.stringify({ generadoEn, clusters: resultado.clusters, candidatos: resultado.candidatos, posiblesDuplicados: resultado.posiblesDuplicados }, null, 2) + '\n',
  );

  console.log(`[recolectar] listo. publico/ actualizado.`);
}

function contarPorEstado(registros) {
  const c = {};
  for (const r of registros) c[r.estado] = (c[r.estado] ?? 0) + 1;
  return c;
}

function contarPorFuente(registros) {
  const c = {};
  for (const r of registros) c[r.fuente] = (c[r.fuente] ?? 0) + 1;
  return c;
}

main().catch((e) => {
  console.error('[recolectar] ERROR:', e);
  process.exit(1);
});
