// @ts-check
/**
 * Entrada/salida en formato compatible con PFIF (People Finder Interchange
 * Format), el estandar que popularizo Google Person Finder. Exponer un feed
 * PFIF permite que CUALQUIER plataforma consuma o aporte datos sin acoplarse
 * a esta implementacion.
 *
 * Aqui se ofrece:
 *  - PFIF JSON (recomendado, simple de consumir): `aPfifJson` / `desdePfifJson`
 *  - PFIF XML (compatibilidad con herramientas existentes): `aPfifXml`
 *
 * Mapeo Registro <-> PFIF person. El feed publico debe ir SIEMPRE redactado
 * (ver privacidad.js): no se publican contacto, coords exactas ni notas de salud.
 */

import { ESTADOS } from './esquema.js';
import { redactarRegistro } from './privacidad.js';

const VERSION_PFIF = '1.4';

/**
 * Mapea el estado interno al `person_record` PFIF (note.status).
 * PFIF status: information_sought | is_note_author | believed_alive |
 *              believed_missing | believed_dead
 * @param {import('./esquema.js').Estado} estado
 * @returns {string}
 */
function estadoAPfif(estado) {
  switch (estado) {
    case ESTADOS.LOCALIZADO_A_SALVO: return 'believed_alive';
    case ESTADOS.FALLECIDO_CONFIRMADO: return 'believed_dead';
    case ESTADOS.VISTO_NO_CONFIRMADO: return 'believed_missing';
    case ESTADOS.DESAPARECIDO:
    default: return 'believed_missing';
  }
}

/** @param {string} status @returns {import('./esquema.js').Estado} */
function pfifAEstado(status) {
  switch (status) {
    case 'believed_alive': return ESTADOS.LOCALIZADO_A_SALVO;
    case 'believed_dead': return ESTADOS.FALLECIDO_CONFIRMADO;
    case 'believed_missing': return ESTADOS.DESAPARECIDO;
    default: return ESTADOS.DESAPARECIDO;
  }
}

/**
 * Convierte un Registro a una persona PFIF (objeto JSON).
 * @param {import('./esquema.js').Registro} reg
 * @param {Object} [opciones]
 * @param {string} [opciones.dominio='cruce-desaparecidos'] dominio del repositorio
 * @param {boolean} [opciones.publico=true] aplicar redaccion publica
 * @returns {Object} person PFIF
 */
export function aPfifPersona(reg, opciones = {}) {
  const dominio = opciones.dominio ?? 'cruce-desaparecidos';
  const publico = opciones.publico !== false;
  const r = publico ? redactarRegistro(reg, 'publico') : reg;

  const partes = (r.nombre ?? '').trim().split(/\s+/);
  const persona = {
    person_record_id: `${dominio}/${reg.id}`,
    source_name: reg.fuente,
    source_date: reg.reportadoEn,
    full_name: r.nombre,
    given_name: partes[0] ?? '',
    family_name: partes.slice(1).join(' '),
    age: r.edadAprox != null ? String(r.edadAprox) : undefined,
    sex: r.sexo ? r.sexo.toLowerCase() : undefined,
    home_city: r.ultimaUbicacion?.texto,
    photo_url: undefined, // jamas publicamos la foto/URL en el feed publico
    source_url: publico ? undefined : reg.urlOrigen,
    notes: [
      {
        note_record_id: `${dominio}/nota-${reg.id}`,
        status: estadoAPfif(reg.estado),
        author_made_contact: false,
        source_date: reg.reportadoEn,
      },
    ],
    // Extensiones propias (no estandar PFIF) bajo prefijo x_ para no romper consumidores.
    x_confianza: reg.confianza,
    x_verificado: reg.verificado === true,
  };
  // Limpiar undefined para un JSON limpio.
  return limpiar(persona);
}

/**
 * Genera un feed PFIF en JSON a partir de una lista de registros.
 * @param {import('./esquema.js').Registro[]} registros
 * @param {Object} [opciones]
 * @returns {Object} feed PFIF JSON
 */
export function aPfifJson(registros, opciones = {}) {
  return {
    pfif_version: VERSION_PFIF,
    generado_en: opciones.generadoEn ?? new Date().toISOString(),
    persons: registros.map((r) => aPfifPersona(r, opciones)),
  };
}

/**
 * Lee un feed PFIF JSON y devuelve datos crudos para `normalizarCrudo`.
 * @param {Object} feed
 * @returns {Object[]} crudos
 */
export function desdePfifJson(feed) {
  const persons = feed?.persons ?? [];
  return persons.map((p) => {
    const nota = (p.notes && p.notes[0]) || {};
    return {
      id: p.person_record_id,
      nombre: p.full_name || [p.given_name, p.family_name].filter(Boolean).join(' '),
      edadAprox: p.age,
      sexo: p.sex ? String(p.sex).toUpperCase() : undefined,
      ubicacion: p.home_city,
      urlOrigen: p.source_url,
      reportadoEn: p.source_date,
      estado: pfifAEstado(nota.status),
      fuente: p.source_name,
    };
  });
}

/**
 * Serializa un feed PFIF a XML (compatibilidad con herramientas clasicas).
 * @param {import('./esquema.js').Registro[]} registros
 * @param {Object} [opciones]
 * @returns {string} XML
 */
export function aPfifXml(registros, opciones = {}) {
  const personas = registros.map((r) => {
    const p = aPfifPersona(r, opciones);
    const nota = p.notes[0];
    return [
      '  <pfif:person>',
      `    <pfif:person_record_id>${esc(p.person_record_id)}</pfif:person_record_id>`,
      `    <pfif:source_name>${esc(p.source_name)}</pfif:source_name>`,
      `    <pfif:source_date>${esc(p.source_date)}</pfif:source_date>`,
      `    <pfif:full_name>${esc(p.full_name)}</pfif:full_name>`,
      p.given_name ? `    <pfif:given_name>${esc(p.given_name)}</pfif:given_name>` : '',
      p.family_name ? `    <pfif:family_name>${esc(p.family_name)}</pfif:family_name>` : '',
      p.age ? `    <pfif:age>${esc(p.age)}</pfif:age>` : '',
      p.home_city ? `    <pfif:home_city>${esc(p.home_city)}</pfif:home_city>` : '',
      '    <pfif:note>',
      `      <pfif:note_record_id>${esc(nota.note_record_id)}</pfif:note_record_id>`,
      `      <pfif:status>${esc(nota.status)}</pfif:status>`,
      `      <pfif:source_date>${esc(nota.source_date)}</pfif:source_date>`,
      '    </pfif:note>',
      '  </pfif:person>',
    ].filter(Boolean).join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<pfif:pfif xmlns:pfif="http://zesty.ca/pfif/${VERSION_PFIF}">`,
    ...personas,
    '</pfif:pfif>',
  ].join('\n');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function limpiar(obj) {
  const salida = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    salida[k] = v;
  }
  return salida;
}
