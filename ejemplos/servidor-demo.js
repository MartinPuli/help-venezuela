// @ts-check
/**
 * Levanta el servidor de referencia con datos de ejemplo. `npm run servidor`.
 *
 * Prueba rapida:
 *   curl localhost:3000/salud
 *   curl localhost:3000/feed.json
 *   curl 'localhost:3000/buscar?cedula=V-12.345.678'                 # sin 2o factor -> no autorizado
 *   curl 'localhost:3000/buscar?cedula=V-12.345.678&apellido=Pena'   # con 2o factor -> ok
 *   curl -H 'x-voluntario-token: demo-token' localhost:3000/verificacion
 */

import { crearServidor, almacenMemoria } from '../src/servidor.js';
import { recolectar, adaptadorJSON, normalizarCrudo } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import {
  crudosSosVenezuela, crudosScraperPropio, crudosTerremotoApp, mapaTerremotoApp,
} from './datos-ejemplo.js';

const registros = await recolectar([
  adaptadorJSON('sos-venezuela', async () => crudosSosVenezuela),
  adaptadorJSON('scraper-propio', async () => crudosScraperPropio),
  { id: 'terremoto-app', obtenerCrudos: async () => crudosTerremotoApp, normalizar: (c) => normalizarCrudo(c, 'terremoto-app', mapaTerremotoApp) },
]);

const { clusters } = cruzar(registros);
const almacen = almacenMemoria(clusters);

const servidor = crearServidor({
  almacen,
  tokensVoluntario: ['demo-token'],
  auditar: (e) => console.log('[auditoria]', JSON.stringify(e)),
});

const PUERTO = Number(process.env.PUERTO ?? 3000);
servidor.listen(PUERTO, () => {
  console.log(`Servidor de cruce escuchando en http://localhost:${PUERTO}`);
  console.log('Prueba: curl localhost:' + PUERTO + '/feed.json');
});
