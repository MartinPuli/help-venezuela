// @ts-check
/**
 * Esquema comun de un reporte de persona desaparecida.
 *
 * Toda fuente (scraper propio, SOS Venezuela, terremotovenezuela.app, etc.)
 * se normaliza a este registro unico ANTES de cruzar. Si las fuentes no
 * comparten esquema, no hay forma confiable de deduplicar.
 *
 * Reglas de seguridad codificadas aqui (ver SEGURIDAD.md):
 *  - `estado` es un enum CERRADO. No se inventan estados nuevos.
 *  - Un estado terminal (fallecido/localizado) solo se considera "confirmado"
 *    si trae `verificado === true` y un `verificadoPor` humano. La deteccion
 *    automatica jamas confirma; solo propone.
 */

import { normalizarCedula } from './normalizar.js';

/**
 * Estados posibles de una persona. Enum cerrado a proposito.
 * @readonly
 */
export const ESTADOS = Object.freeze({
  DESAPARECIDO: 'desaparecido',
  VISTO_NO_CONFIRMADO: 'visto_no_confirmado',
  LOCALIZADO_A_SALVO: 'localizado_a_salvo',
  FALLECIDO_CONFIRMADO: 'fallecido_confirmado',
});

/** Estados que representan un desenlace y NO deben fijarse automaticamente. */
export const ESTADOS_TERMINALES = Object.freeze([
  ESTADOS.LOCALIZADO_A_SALVO,
  ESTADOS.FALLECIDO_CONFIRMADO,
]);

/** Severidad para elegir el estado mas conservador al fusionar. Menor = mas seguro de mostrar. */
const SEVERIDAD = Object.freeze({
  [ESTADOS.DESAPARECIDO]: 0,
  [ESTADOS.VISTO_NO_CONFIRMADO]: 1,
  [ESTADOS.LOCALIZADO_A_SALVO]: 2,
  [ESTADOS.FALLECIDO_CONFIRMADO]: 3,
});

/**
 * Nivel de confianza de un match o de un registro.
 * @readonly
 */
export const CONFIANZA = Object.freeze({
  ALTA: 'alta', // cedula exacta
  MEDIA: 'media', // nombre + foto/edad/ubicacion
  BAJA: 'baja', // solo nombre
});

/**
 * @typedef {'desaparecido'|'visto_no_confirmado'|'localizado_a_salvo'|'fallecido_confirmado'} Estado
 * @typedef {'alta'|'media'|'baja'} Confianza
 * @typedef {'M'|'F'|'X'} Sexo
 */

/**
 * @typedef {Object} Ubicacion
 * @property {string} [texto]   Texto libre ("Edif. X, Los Palos Grandes, Caracas")
 * @property {number} [lat]
 * @property {number} [lon]
 */

/**
 * Registro normalizado. Es la unidad que viaja por todo el sistema.
 * @typedef {Object} Registro
 * @property {string} id                 Id estable dentro de la capa (fuente:idOrigen)
 * @property {string} [cedula]           Cedula normalizada (solo digitos). Llave fuerte.
 * @property {string} nombre             Nombre tal cual lo reporto la fuente.
 * @property {string} nombreNormalizado  Nombre para comparar (sin tildes, sin particulas).
 * @property {number} [edadAprox]
 * @property {Sexo} [sexo]
 * @property {Ubicacion} [ultimaUbicacion]
 * @property {string} [fechaUltimoContacto] ISO 8601
 * @property {string} [fotoHash]         pHash/dHash de la foto (hex). NUNCA la foto en si.
 * @property {Estado} estado
 * @property {boolean} [verificado]      true solo si un humano confirmo el estado.
 * @property {string} [verificadoPor]    Identificador del voluntario verificador.
 * @property {string} fuente             Id de la fuente (ej. "sos-venezuela").
 * @property {string} [urlOrigen]
 * @property {string} reportadoEn        ISO 8601
 * @property {Confianza} confianza
 * @property {Object} [contacto]         Datos sensibles de contacto (solo para voluntarios).
 * @property {string} [notas]            Notas sensibles (estado de salud, etc.).
 */

/**
 * Crea un Registro validado y con valores por defecto seguros.
 * Lanza si faltan campos obligatorios o el estado es invalido.
 * @param {Partial<Registro> & { id: string, nombre: string, fuente: string }} datos
 * @returns {Registro}
 */
export function crearRegistro(datos) {
  if (!datos || typeof datos !== 'object') throw new TypeError('crearRegistro: se esperaba un objeto');
  if (!datos.id) throw new Error('crearRegistro: "id" es obligatorio');
  if (!datos.nombre) throw new Error('crearRegistro: "nombre" es obligatorio');
  if (!datos.fuente) throw new Error('crearRegistro: "fuente" es obligatorio');

  const estado = datos.estado ?? ESTADOS.DESAPARECIDO;
  if (!esEstadoValido(estado)) {
    throw new Error(`crearRegistro: estado invalido "${estado}". Validos: ${Object.values(ESTADOS).join(', ')}`);
  }

  const reportadoEn = datos.reportadoEn ?? new Date().toISOString();
  const cedula = normalizarCedula(datos.cedula);

  /** @type {Registro} */
  const reg = {
    id: String(datos.id),
    nombre: String(datos.nombre),
    nombreNormalizado: datos.nombreNormalizado ?? '',
    estado,
    fuente: String(datos.fuente),
    reportadoEn,
    // Confianza: si no se especifica, se infiere de las señales disponibles.
    // cedula => alta (llave fuerte); foto => media; solo nombre => baja.
    confianza: datos.confianza ?? (cedula ? CONFIANZA.ALTA : (datos.fotoHash ? CONFIANZA.MEDIA : CONFIANZA.BAJA)),
  };

  if (cedula) reg.cedula = cedula;
  if (datos.edadAprox != null) reg.edadAprox = Number(datos.edadAprox);
  if (datos.sexo) reg.sexo = datos.sexo;
  if (datos.ultimaUbicacion) reg.ultimaUbicacion = datos.ultimaUbicacion;
  if (datos.fechaUltimoContacto) reg.fechaUltimoContacto = datos.fechaUltimoContacto;
  if (datos.fotoHash) reg.fotoHash = datos.fotoHash;
  if (datos.verificado != null) reg.verificado = Boolean(datos.verificado);
  if (datos.verificadoPor) reg.verificadoPor = datos.verificadoPor;
  if (datos.urlOrigen) reg.urlOrigen = datos.urlOrigen;
  if (datos.contacto) reg.contacto = datos.contacto;
  if (datos.notas) reg.notas = datos.notas;

  // Invariante de seguridad: un estado terminal sin verificacion humana se
  // degrada a "visto_no_confirmado". La deteccion automatica nunca confirma.
  if (esEstadoTerminal(reg.estado) && reg.verificado !== true) {
    reg.estado = ESTADOS.VISTO_NO_CONFIRMADO;
  }

  return reg;
}

/** @param {string} estado @returns {boolean} */
export function esEstadoValido(estado) {
  return Object.values(ESTADOS).includes(/** @type {any} */ (estado));
}

/** @param {string} estado @returns {boolean} */
export function esEstadoTerminal(estado) {
  return ESTADOS_TERMINALES.includes(/** @type {any} */ (estado));
}

/**
 * Devuelve el estado mas conservador (menos severo) entre varios.
 * Usado al fusionar: nunca escala a un desenlace por contar varias fuentes.
 * @param {Estado[]} estados
 * @returns {Estado}
 */
export function estadoMasConservador(estados) {
  if (!estados.length) return ESTADOS.DESAPARECIDO;
  return estados.reduce((a, b) => (SEVERIDAD[a] <= SEVERIDAD[b] ? a : b));
}
