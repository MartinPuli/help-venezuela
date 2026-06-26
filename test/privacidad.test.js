// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  redactarRegistro,
  enmascararCedula,
  buscarPorCedula,
  validarSegundoFactor,
  LimitadorTasa,
} from '../src/privacidad.js';
import { crearRegistro } from '../src/esquema.js';
import { normalizarNombre } from '../src/normalizar.js';

function reg(datos) {
  return crearRegistro({ ...datos, nombreNormalizado: normalizarNombre(datos.nombre) });
}

const persona = reg({
  id: 'sos:1',
  nombre: 'Jose de la Cruz Pena',
  cedula: '12345678',
  edadAprox: 34,
  fuente: 'sos',
  ultimaUbicacion: { texto: 'Los Palos Grandes, Caracas', lat: 10.49, lon: -66.84 },
  contacto: { raw: '+58 412 0000000' },
  notas: 'Herido, posible fractura',
  urlOrigen: 'https://sosvenezuela2026.com/p/1',
});

test('redaccion publica oculta contacto, notas, coords y url', () => {
  const pub = redactarRegistro(persona, 'publico');
  assert.equal(pub.contacto, undefined);
  assert.equal(pub.notas, undefined);
  assert.equal(pub.urlOrigen, undefined);
  assert.equal(pub.ultimaUbicacion?.lat, undefined);
  assert.equal(pub.ultimaUbicacion?.texto, 'Los Palos Grandes, Caracas');
  // cedula enmascarada
  assert.equal(pub.cedula, '*****678');
});

test('redaccion voluntario entrega todo', () => {
  const vol = redactarRegistro(persona, 'voluntario');
  assert.equal(vol.contacto?.raw, '+58 412 0000000');
  assert.equal(vol.notas, 'Herido, posible fractura');
  assert.equal(vol.ultimaUbicacion?.lat, 10.49);
});

test('enmascararCedula deja ultimos 3 digitos', () => {
  assert.equal(enmascararCedula('12345678'), '*****678');
  assert.equal(enmascararCedula('12'), '**');
});

test('buscarPorCedula SIN segundo factor no autoriza', () => {
  const r = buscarPorCedula([persona], 'V-12.345.678', {});
  assert.equal(r.encontrado, true);
  assert.equal(r.autorizado, false);
  assert.equal(r.registro, undefined);
  assert.match(r.mensaje ?? '', /apellido|fecha/i);
});

test('buscarPorCedula CON apellido correcto autoriza y redacta publico', () => {
  const r = buscarPorCedula([persona], '12345678', { apellido: 'Pena' });
  assert.equal(r.autorizado, true);
  assert.ok(r.registro);
  // por defecto rol publico => cedula enmascarada, sin contacto
  assert.equal(r.registro?.contacto, undefined);
});

test('buscarPorCedula con apellido incorrecto no autoriza', () => {
  const r = buscarPorCedula([persona], '12345678', { apellido: 'Martinez' });
  assert.equal(r.autorizado, false);
});

test('buscarPorCedula rol voluntario no exige segundo factor', () => {
  const r = buscarPorCedula([persona], '12345678', { rol: 'voluntario' });
  assert.equal(r.autorizado, true);
  assert.equal(r.registro?.contacto?.raw, '+58 412 0000000');
});

test('buscarPorCedula inexistente => no encontrado', () => {
  const r = buscarPorCedula([persona], '00000000', { apellido: 'Pena' });
  assert.equal(r.encontrado, false);
});

test('validarSegundoFactor acepta apellido con tildes/case', () => {
  assert.ok(validarSegundoFactor(persona, { apellido: 'PEÑA' }));
  assert.ok(validarSegundoFactor(persona, { apellido: 'cruz' }));
  assert.ok(!validarSegundoFactor(persona, { apellido: 'lopez' }));
});

test('LimitadorTasa bloquea al exceder la ventana', () => {
  let t = 1000;
  const lim = new LimitadorTasa({ maxPorVentana: 3, ventanaMs: 1000, ahora: () => t });
  assert.ok(lim.permitir('ip1'));
  assert.ok(lim.permitir('ip1'));
  assert.ok(lim.permitir('ip1'));
  assert.ok(!lim.permitir('ip1')); // 4a excede
  // otra ip no afectada
  assert.ok(lim.permitir('ip2'));
  // avanza la ventana
  t += 1001;
  assert.ok(lim.permitir('ip1'));
});
