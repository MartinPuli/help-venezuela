// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aPfifJson, aPfifPersona, desdePfifJson, aPfifXml } from '../src/pfif.js';
import { crearRegistro, ESTADOS } from '../src/esquema.js';
import { normalizarNombre } from '../src/normalizar.js';

function reg(datos) {
  return crearRegistro({ ...datos, nombreNormalizado: normalizarNombre(datos.nombre) });
}

const persona = reg({
  id: 'sos:1',
  nombre: 'Jose de la Cruz Pena',
  cedula: '12345678',
  edadAprox: 34,
  sexo: 'M',
  fuente: 'sos',
  estado: ESTADOS.DESAPARECIDO,
  ultimaUbicacion: { texto: 'Caracas', lat: 10.49, lon: -66.84 },
  contacto: { raw: '+58 412' },
  urlOrigen: 'https://sosvenezuela2026.com/p/1',
  reportadoEn: '2026-06-24T20:00:00Z',
});

test('aPfifPersona feed publico NO incluye contacto, coords ni foto/url', () => {
  const p = aPfifPersona(persona, { publico: true });
  assert.equal(p.full_name, 'Jose de la Cruz Pena');
  assert.equal(p.given_name, 'Jose');
  assert.equal(p.home_city, 'Caracas');
  assert.equal(p.photo_url, undefined);
  assert.equal(p.source_url, undefined);
  assert.equal(p.notes[0].status, 'believed_missing');
  assert.equal(p.x_confianza, 'alta');
});

test('aPfifJson genera estructura con version y persons', () => {
  const feed = aPfifJson([persona], { generadoEn: '2026-06-25T00:00:00Z' });
  assert.equal(feed.pfif_version, '1.4');
  assert.equal(feed.persons.length, 1);
  assert.equal(feed.generado_en, '2026-06-25T00:00:00Z');
});

test('estados se mapean a PFIF correctamente', () => {
  const vivo = aPfifPersona(reg({
    id: 'a', nombre: 'X Y', fuente: 'f', estado: ESTADOS.LOCALIZADO_A_SALVO,
    verificado: true, verificadoPor: 'vol',
  }));
  assert.equal(vivo.notes[0].status, 'believed_alive');

  const muerto = aPfifPersona(reg({
    id: 'b', nombre: 'X Y', fuente: 'f', estado: ESTADOS.FALLECIDO_CONFIRMADO,
    verificado: true, verificadoPor: 'vol',
  }));
  assert.equal(muerto.notes[0].status, 'believed_dead');
});

test('round-trip PFIF JSON conserva nombre y estado', () => {
  const feed = aPfifJson([persona]);
  const crudos = desdePfifJson(feed);
  assert.equal(crudos.length, 1);
  assert.equal(crudos[0].nombre, 'Jose de la Cruz Pena');
  assert.equal(crudos[0].estado, ESTADOS.DESAPARECIDO);
  assert.equal(crudos[0].fuente, 'sos');
});

test('aPfifXml produce XML valido con namespace pfif y escapa entidades', () => {
  const conAmp = reg({ id: 'c', nombre: 'Ana & Co', fuente: 'f' });
  const xml = aPfifXml([conAmp]);
  assert.match(xml, /<\?xml/);
  assert.match(xml, /xmlns:pfif/);
  assert.match(xml, /Ana &amp; Co/);
  assert.ok(!xml.includes('Ana & Co'));
});
