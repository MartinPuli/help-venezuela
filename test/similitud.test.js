// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levenshtein,
  similitudLevenshtein,
  jaro,
  jaroWinkler,
  similitudTokens,
  similitudNombres,
} from '../src/similitud.js';

test('levenshtein casos basicos', () => {
  assert.equal(levenshtein('', ''), 0);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('pena', 'peña'.normalize()), 1);
  assert.equal(levenshtein('', 'abc'), 3);
});

test('similitudLevenshtein normaliza a [0,1]', () => {
  assert.equal(similitudLevenshtein('abc', 'abc'), 1);
  assert.equal(similitudLevenshtein('', ''), 1);
  assert.ok(similitudLevenshtein('gonzalez', 'gonzales') > 0.8);
});

test('jaro y jaroWinkler en [0,1] y premia prefijo', () => {
  assert.equal(jaro('abc', 'abc'), 1);
  assert.equal(jaroWinkler('abc', 'abc'), 1);
  assert.equal(jaro('', 'abc'), 0);
  const jw = jaroWinkler('martha', 'marhta');
  assert.ok(jw > 0.95 && jw <= 1, `jw=${jw}`);
  // prefijo comun sube el score respecto a jaro puro
  assert.ok(jaroWinkler('dwayne', 'duane') >= jaro('dwayne', 'duane'));
});

test('similitudTokens tolera orden y nombres incompletos', () => {
  assert.ok(similitudTokens(['jose', 'pena'], ['pena', 'jose']) > 0.99);
  // nombre incompleto penaliza algo pero sigue alto
  const s = similitudTokens(['maria', 'fernanda', 'rangel'], ['maria', 'rangel']);
  assert.ok(s > 0.6 && s < 1, `s=${s}`);
});

test('similitudNombres alto para mismo nombre con/sin tildes y typos', () => {
  assert.ok(similitudNombres('jose cruz pena', 'jose cruz pena') === 1);
  assert.ok(similitudNombres('jose cruz pena', 'jose cruz peña'.normalize('NFD').replace(/[̀-ͯ]/g, '')) === 1);
  assert.ok(similitudNombres('maria fernanda rangel', 'maria f rangel') > 0.6);
  assert.ok(similitudNombres('pedro gonzalez', 'juan martinez') < 0.6);
});
