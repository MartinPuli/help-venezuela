// @ts-check
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearServidor, almacenMemoria } from '../src/servidor.js';
import { crearRegistro, ESTADOS } from '../src/esquema.js';
import { normalizarNombre } from '../src/normalizar.js';

function reg(datos) {
  return crearRegistro({ ...datos, nombreNormalizado: normalizarNombre(datos.nombre) });
}

let servidor;
let base;
let almacen;

before(async () => {
  almacen = almacenMemoria([
    reg({ id: 'sos:1', nombre: 'Jose de la Cruz Pena', cedula: '12345678', edadAprox: 34,
      fuente: 'sos', estado: ESTADOS.DESAPARECIDO, contacto: { raw: '+58 412' },
      ultimaUbicacion: { texto: 'Caracas', lat: 10.49, lon: -66.84 } }),
    reg({ id: 'app:2', nombre: 'Jose Cruz Pena', edadAprox: 34, fuente: 'app',
      ultimaUbicacion: { texto: 'Caracas' }, fechaUltimoContacto: '2026-06-24' }),
  ]);
  servidor = crearServidor({ almacen, tokensVoluntario: ['secreto'] });
  await new Promise((r) => servidor.listen(0, r));
  const { port } = servidor.address();
  base = `http://localhost:${port}`;
});

after(() => servidor && servidor.close());

test('GET /salud responde ok', async () => {
  const r = await fetch(`${base}/salud`);
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.ok, true);
  assert.equal(j.registros, 2);
});

test('GET /feed.json es publico y NO filtra contacto ni coords', async () => {
  const r = await fetch(`${base}/feed.json`);
  const j = await r.json();
  assert.equal(j.pfif_version, '1.4');
  const texto = JSON.stringify(j);
  assert.ok(!texto.includes('+58 412'), 'el feed publico no debe exponer contacto');
  assert.ok(!texto.includes('10.49'), 'el feed publico no debe exponer coords exactas');
});

test('GET /buscar sin segundo factor no autoriza', async () => {
  const r = await fetch(`${base}/buscar?cedula=12345678`);
  const j = await r.json();
  assert.equal(j.encontrado, true);
  assert.equal(j.autorizado, false);
});

test('GET /buscar con apellido autoriza', async () => {
  const r = await fetch(`${base}/buscar?cedula=12345678&apellido=Pena`);
  const j = await r.json();
  assert.equal(j.autorizado, true);
  assert.ok(j.registro);
});

test('GET /verificacion sin token => 401', async () => {
  const r = await fetch(`${base}/verificacion`);
  assert.equal(r.status, 401);
});

test('GET /verificacion con token => candidatos', async () => {
  const r = await fetch(`${base}/verificacion`, { headers: { 'x-voluntario-token': 'secreto' } });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(j.candidatos));
  assert.ok(Array.isArray(j.posiblesDuplicados));
});

test('POST /verificacion/resolver confirma estado (unico camino para estado terminal)', async () => {
  const r = await fetch(`${base}/verificacion/resolver`, {
    method: 'POST',
    headers: { 'x-voluntario-token': 'secreto', 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'sos:1', accion: 'confirmar_estado', estado: ESTADOS.LOCALIZADO_A_SALVO, voluntario: 'vol-1' }),
  });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.verificado, true);
  // El almacen refleja el cambio hecho por humano.
  const actualizado = almacen.listar().find((x) => x.id === 'sos:1');
  assert.equal(actualizado.estado, ESTADOS.LOCALIZADO_A_SALVO);
  assert.equal(actualizado.verificado, true);
  assert.equal(actualizado.verificadoPor, 'vol-1');
});

test('POST /verificacion/resolver rechaza estado invalido', async () => {
  const r = await fetch(`${base}/verificacion/resolver`, {
    method: 'POST',
    headers: { 'x-voluntario-token': 'secreto', 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'sos:1', accion: 'confirmar_estado', estado: 'inventado', voluntario: 'vol-1' }),
  });
  assert.equal(r.status, 400);
});
