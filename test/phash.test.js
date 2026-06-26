// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dHash, distanciaHamming, mismaImagen, rgbaAGris } from '../src/phash.js';

/** Genera una imagen gris sintetica con un gradiente. */
function gradiente(w, h, desplazar = 0) {
  const datos = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      datos[y * w + x] = (x * 255 / w + desplazar) % 256;
    }
  }
  return { width: w, height: h, datos };
}

test('dHash devuelve 16 chars hex', () => {
  const h = dHash(gradiente(32, 32));
  assert.match(h, /^[0-9a-f]{16}$/);
});

test('misma imagen => distancia 0', () => {
  const img = gradiente(40, 40);
  assert.equal(distanciaHamming(dHash(img), dHash(img)), 0);
  assert.ok(mismaImagen(dHash(img), dHash(img)));
});

test('imagen casi igual (ruido leve) => distancia pequena, mismaImagen true', () => {
  const a = gradiente(40, 40);
  const b = gradiente(40, 40, 1); // leve desplazamiento de brillo
  const d = distanciaHamming(dHash(a), dHash(b));
  assert.ok(d <= 10, `distancia=${d}`);
  assert.ok(mismaImagen(dHash(a), dHash(b)));
});

test('imagenes muy distintas => mismaImagen false', () => {
  const a = gradiente(40, 40);
  const b = { width: 40, height: 40, datos: new Uint8Array(1600).map((_, i) => (i % 2 ? 0 : 255)) };
  assert.ok(!mismaImagen(dHash(a), dHash(b)));
});

test('distanciaHamming maneja hashes faltantes', () => {
  assert.equal(distanciaHamming('', 'ffff'), 64);
});

test('rgbaAGris convierte con luminancia', () => {
  // 1 pixel blanco
  const gris = rgbaAGris(new Uint8Array([255, 255, 255, 255]), 1, 1);
  assert.equal(gris.datos[0], 255);
  // 1 pixel negro
  const negro = rgbaAGris(new Uint8Array([0, 0, 0, 255]), 1, 1);
  assert.equal(negro.datos[0], 0);
});
