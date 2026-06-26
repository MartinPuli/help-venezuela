// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararRegistros, cruzar, fusionarCluster } from '../src/cruce.js';
import { crearRegistro, ESTADOS, CONFIANZA } from '../src/esquema.js';
import { normalizarNombre } from '../src/normalizar.js';

/** Helper para crear registros de prueba con nombre normalizado. */
function reg(datos) {
  return crearRegistro({ ...datos, nombreNormalizado: normalizarNombre(datos.nombre) });
}

test('cedula identica => fusion automatica sin revision', () => {
  const a = reg({ id: 'a', nombre: 'Jose Cruz Pena', cedula: '12345678', fuente: 'f1' });
  const b = reg({ id: 'b', nombre: 'J. Cruz', cedula: 'V-12.345.678', fuente: 'f2' });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'exacta_cedula');
  assert.equal(c.requiereRevision, false);
});

test('cedulas distintas => personas distintas aunque el nombre sea identico', () => {
  const a = reg({ id: 'a', nombre: 'Jose Cruz Pena', cedula: '11111111', fuente: 'f1' });
  const b = reg({ id: 'b', nombre: 'Jose Cruz Pena', cedula: '22222222', fuente: 'f2' });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'cedula_distinta');
  assert.equal(c.requiereRevision, false);
});

test('mismo nombre + edad + ubicacion sin cedula => candidato con revision humana', () => {
  const a = reg({
    id: 'a', nombre: 'Jose Cruz Pena', edadAprox: 34, fuente: 'f1',
    ultimaUbicacion: { texto: 'Los Palos Grandes, Caracas' },
    fechaUltimoContacto: '2026-06-24T18:00:00Z',
  });
  const b = reg({
    id: 'b', nombre: 'Jose Cruz Pena', edadAprox: 35, fuente: 'f2',
    ultimaUbicacion: { texto: 'Los Palos Grandes' },
    fechaUltimoContacto: '2026-06-24',
  });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'candidata');
  assert.equal(c.requiereRevision, true, 'sin cedula NUNCA se fusiona automaticamente');
});

test('misma foto reposteada eleva a candidato aunque el nombre no llegue al umbral alto', () => {
  const a = reg({ id: 'a', nombre: 'Jose Cruz', fuente: 'f1', fotoHash: 'f0e1d2c3b4a59687' });
  const b = reg({ id: 'b', nombre: 'Jose C Pena', fuente: 'f2', fotoHash: 'f0e1d2c3b4a59687' });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'candidata');
  assert.equal(c.requiereRevision, true);
});

test('solo nombre parecido sin apoyos => posible duplicado (solo panel)', () => {
  const a = reg({ id: 'a', nombre: 'Pedro Gonzalez', fuente: 'f1' });
  const b = reg({ id: 'b', nombre: 'Pedro Gonzales', fuente: 'f2' });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'posible_duplicado');
  assert.equal(c.requiereRevision, true);
});

test('nombres distintos => sin relacion', () => {
  const a = reg({ id: 'a', nombre: 'Pedro Gonzalez', fuente: 'f1' });
  const b = reg({ id: 'b', nombre: 'Maria Rangel', fuente: 'f2' });
  const c = compararRegistros(a, b);
  assert.equal(c.tipo, 'sin_relacion');
});

test('cruzar fusiona por cedula y deja candidatos aparte', () => {
  const registros = [
    reg({ id: 'a', nombre: 'Jose Cruz Pena', cedula: '12345678', fuente: 'sos', estado: ESTADOS.DESAPARECIDO,
      edadAprox: 34, ultimaUbicacion: { texto: 'Los Palos Grandes, Caracas' }, fechaUltimoContacto: '2026-06-24T18:00:00Z' }),
    reg({ id: 'b', nombre: 'Jose de la Cruz Pena', cedula: 'V-12345678', fuente: 'app', estado: ESTADOS.VISTO_NO_CONFIRMADO }),
    reg({ id: 'c', nombre: 'Jose Cruz Pena', edadAprox: 34, fuente: 'scraper',
      ultimaUbicacion: { texto: 'Los Palos Grandes' }, fechaUltimoContacto: '2026-06-24' }),
    reg({ id: 'd', nombre: 'Maria Rangel', cedula: '99999999', fuente: 'sos' }),
  ];
  const r = cruzar(registros);
  // a y b se fusionan por cedula -> 3 clusters (ab, c, d)
  assert.equal(r.clusters.length, 3);
  assert.equal(r.fusionesAutomaticas, 1);
  // c (sin cedula) coincide con a en nombre+edad+ubicacion => candidato (revision humana),
  // NUNCA fusion automatica.
  assert.ok(r.candidatos.length >= 1, `candidatos=${r.candidatos.length}`);
  assert.ok(r.candidatos.every((p) => p.coincidencia.requiereRevision));
});

test('fusionarCluster NO escala el estado automaticamente', () => {
  // Una fuente dice "fallecido" pero SIN verificacion humana.
  // crearRegistro ya degrada terminal no verificado, probamos la regla de fusion:
  const verificadoVivo = reg({
    id: 'a', nombre: 'Jose Cruz', cedula: '1', fuente: 'f1',
    estado: ESTADOS.LOCALIZADO_A_SALVO, verificado: true, verificadoPor: 'vol-1',
  });
  const sinVerificar = reg({
    id: 'b', nombre: 'Jose Cruz', cedula: '1', fuente: 'f2',
    estado: ESTADOS.DESAPARECIDO,
  });
  const fusion = fusionarCluster([verificadoVivo, sinVerificar]);
  // Hay un verificado (localizado_a_salvo) => se respeta el verificado.
  assert.equal(fusion.estado, ESTADOS.LOCALIZADO_A_SALVO);
  assert.equal(fusion.verificado, true);
  assert.equal(fusion.confianza, CONFIANZA.ALTA);
  // Trazabilidad de lo que reporto cada fuente.
  const meta = /** @type {any} */ (fusion);
  assert.equal(meta.estadosReportados.length, 2);
  assert.deepEqual([...meta.fuentes].sort(), ['f1', 'f2']);
});

test('fusion sin ningun verificado se queda en el estado mas conservador', () => {
  const a = reg({ id: 'a', nombre: 'Jose Cruz', cedula: '1', fuente: 'f1', estado: ESTADOS.VISTO_NO_CONFIRMADO });
  const b = reg({ id: 'b', nombre: 'Jose Cruz', cedula: '1', fuente: 'f2', estado: ESTADOS.DESAPARECIDO });
  const fusion = fusionarCluster([a, b]);
  assert.equal(fusion.estado, ESTADOS.DESAPARECIDO); // el mas conservador
  assert.equal(fusion.verificado, false);
});
