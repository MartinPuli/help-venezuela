// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sinTildes,
  normalizarNombre,
  tokensNombre,
  normalizarCedula,
  nacionalidadCedula,
  clavesBloqueo,
} from '../src/normalizar.js';
import { crearRegistro } from '../src/esquema.js';

test('sinTildes quita diacriticos y baja a minusculas', () => {
  assert.equal(sinTildes('José'), 'jose');
  assert.equal(sinTildes('PEÑA'), 'pena');
  assert.equal(sinTildes('María Fernánda'), 'maria fernanda');
  assert.equal(sinTildes('Ángel Muñoz'), 'angel munoz');
});

test('normalizarNombre quita particulas y normaliza', () => {
  assert.equal(normalizarNombre('José de la Cruz Peña'), 'jose cruz pena');
  assert.equal(normalizarNombre('  María   Fernanda  '), 'maria fernanda');
  assert.equal(normalizarNombre('Pedro González!!! 😀'), 'pedro gonzalez');
});

test('normalizarNombre con solo particulas no queda vacio', () => {
  assert.equal(normalizarNombre('de la'), 'de la');
});

test('tokensNombre devuelve palabras significativas', () => {
  assert.deepEqual(tokensNombre('José de la Cruz Peña'), ['jose', 'cruz', 'pena']);
  assert.deepEqual(tokensNombre(''), []);
});

test('normalizarCedula deja solo digitos y quita ceros a la izquierda', () => {
  assert.equal(normalizarCedula('V-12.345.678'), '12345678');
  assert.equal(normalizarCedula('v 12345678'), '12345678');
  assert.equal(normalizarCedula('E-012.345.678'), '12345678');
  assert.equal(normalizarCedula(12345678), '12345678');
  assert.equal(normalizarCedula('sin numeros'), undefined);
  assert.equal(normalizarCedula(null), undefined);
});

test('nacionalidadCedula infiere V/E', () => {
  assert.equal(nacionalidadCedula('V-12345678'), 'V');
  assert.equal(nacionalidadCedula('e12345678'), 'E');
  assert.equal(nacionalidadCedula('12345678'), undefined);
});

test('clavesBloqueo agrupa por cedula y por nombre', () => {
  const reg = crearRegistro({
    id: 'x:1', nombre: 'Jose Cruz Pena', fuente: 'x',
    cedula: '12345678', nombreNormalizado: 'jose cruz pena',
  });
  const claves = clavesBloqueo(reg);
  assert.ok(claves.includes('ced:12345678'));
  assert.ok(claves.some((c) => c.startsWith('nom:jose')));
});
