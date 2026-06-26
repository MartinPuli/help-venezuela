// @ts-check
/**
 * Capa de privacidad. En Venezuela, exponer datos personales sin friccion
 * (ubicacion, estado de salud, contacto) es un vector de acoso o de
 * persecucion. Estas funciones imponen:
 *
 *  1. Busqueda por cedula CON segundo factor: el que busca debe aportar
 *     tambien apellido o fecha de nacimiento. Sin eso, no se entrega el
 *     registro completo, solo una confirmacion minima.
 *  2. Redaccion por rol: el publico ve lo minimo; el dato crudo (contacto,
 *     ubicacion exacta, notas de salud) es solo para voluntarios autenticados.
 *  3. Hooks de auditoria y rate-limit para detectar scraping/abuso.
 */

import { sinTildes, normalizarCedula } from './normalizar.js';

/** @typedef {import('./esquema.js').Registro} Registro */
/** @typedef {'publico'|'voluntario'} Rol */

/**
 * Redacta un registro segun el rol de quien consulta.
 *  - publico: nombre, estado, ubicacion APROXIMADA (sin coords exactas),
 *    sin contacto, sin notas de salud, sin cedula completa.
 *  - voluntario: registro completo (debe estar autenticado aguas arriba).
 * @param {Registro} reg
 * @param {Rol} rol
 * @returns {Partial<Registro>}
 */
export function redactarRegistro(reg, rol) {
  if (rol === 'voluntario') return { ...reg };

  /** @type {Partial<Registro>} */
  const publico = {
    id: reg.id,
    nombre: reg.nombre,
    estado: reg.estado,
    confianza: reg.confianza,
    fuente: reg.fuente,
    reportadoEn: reg.reportadoEn,
  };
  if (reg.edadAprox != null) publico.edadAprox = reg.edadAprox;
  if (reg.sexo) publico.sexo = reg.sexo;
  if (reg.cedula) publico.cedula = enmascararCedula(reg.cedula);
  if (reg.ultimaUbicacion) {
    publico.ultimaUbicacion = {
      texto: reg.ultimaUbicacion.texto, // texto general (zona), no coords
    };
  }
  // NO se incluye: contacto, notas (salud), urlOrigen, lat/lon, fotoHash.
  return publico;
}

/**
 * Enmascara una cedula dejando solo los ultimos 3 digitos.
 * @param {string} cedula
 * @returns {string}
 */
export function enmascararCedula(cedula) {
  const c = String(cedula);
  if (c.length <= 3) return '*'.repeat(c.length);
  return '*'.repeat(c.length - 3) + c.slice(-3);
}

/**
 * @typedef {Object} ResultadoBusqueda
 * @property {boolean} encontrado
 * @property {boolean} autorizado   si se valido el segundo factor
 * @property {Partial<Registro>} [registro]  presente y completo solo si autorizado
 * @property {string} [mensaje]
 */

/**
 * Busqueda por cedula con segundo factor obligatorio.
 *
 * Comportamiento:
 *  - Si la cedula no existe -> { encontrado:false } (no revela nada).
 *  - Si existe pero el segundo factor NO coincide -> { encontrado:true,
 *    autorizado:false } con mensaje pidiendo el dato. NO entrega el registro.
 *  - Si coincide -> entrega el registro redactado segun rol (por defecto publico).
 *
 * @param {Registro[]} registros  indice de registros
 * @param {string} cedula
 * @param {Object} opciones
 * @param {string} [opciones.apellido]        segundo factor: apellido
 * @param {string} [opciones.fechaNacimiento] segundo factor: ISO o YYYY-MM-DD
 * @param {Rol} [opciones.rol='publico']
 * @param {(evento:Object)=>void} [opciones.auditar]  hook de auditoria
 * @returns {ResultadoBusqueda}
 */
export function buscarPorCedula(registros, cedula, opciones = {}) {
  const rol = opciones.rol ?? 'publico';
  const cedNorm = normalizarCedula(cedula);
  if (opciones.auditar) {
    opciones.auditar({ accion: 'buscarPorCedula', cedula: cedNorm, conSegundoFactor: !!(opciones.apellido || opciones.fechaNacimiento), ts: new Date().toISOString() });
  }

  if (!cedNorm) {
    return { encontrado: false, autorizado: false, mensaje: 'Cedula invalida.' };
  }

  const coincidentes = registros.filter((r) => r.cedula && normalizarCedula(r.cedula) === cedNorm);
  if (!coincidentes.length) {
    // No revelar si "no existe" vs "existe pero no autorizado" daria info;
    // aqui devolvemos no-encontrado de forma neutra.
    return { encontrado: false, autorizado: false, mensaje: 'Sin coincidencias.' };
  }

  // Voluntario autenticado puede ver sin segundo factor (ya paso auth aguas arriba).
  if (rol === 'voluntario') {
    return { encontrado: true, autorizado: true, registro: redactarRegistro(coincidentes[0], 'voluntario') };
  }

  const segundoFactorOk = coincidentes.some((r) => validarSegundoFactor(r, opciones));
  if (!segundoFactorOk) {
    return {
      encontrado: true,
      autorizado: false,
      mensaje: 'Aporta el apellido o la fecha de nacimiento de la persona para ver el resultado completo.',
    };
  }

  const reg = coincidentes.find((r) => validarSegundoFactor(r, opciones)) ?? coincidentes[0];
  return { encontrado: true, autorizado: true, registro: redactarRegistro(reg, rol) };
}

/**
 * Valida que el apellido o la fecha de nacimiento aportados coincidan.
 * @param {Registro} reg
 * @param {{apellido?:string, fechaNacimiento?:string}} opciones
 * @returns {boolean}
 */
export function validarSegundoFactor(reg, opciones) {
  const { apellido, fechaNacimiento } = opciones;
  if (apellido) {
    const tokensNombre = sinTildes(reg.nombre).split(/\s+/).filter(Boolean);
    const ap = sinTildes(apellido).trim();
    if (ap && tokensNombre.some((t) => t === ap)) return true;
  }
  if (fechaNacimiento && reg.fechaNacimiento) {
    // @ts-ignore campo opcional no declarado en el typedef base
    if (normalizarFecha(fechaNacimiento) === normalizarFecha(reg.fechaNacimiento)) return true;
  }
  return false;
}

/** @param {string} f @returns {string} */
function normalizarFecha(f) {
  // Quedarse con YYYY-MM-DD.
  const m = String(f).match(/(\d{4})\D?(\d{2})\D?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : String(f).trim();
}

/**
 * Limitador de tasa simple en memoria (token bucket por clave, p.ej. IP).
 * Para detectar scraping masivo de cedulas. En produccion usar un store
 * compartido (Redis); esto es el contrato minimo.
 */
export class LimitadorTasa {
  /**
   * @param {Object} [opciones]
   * @param {number} [opciones.maxPorVentana=30]
   * @param {number} [opciones.ventanaMs=60000]
   * @param {()=>number} [opciones.ahora] inyectable para tests
   */
  constructor(opciones = {}) {
    this.max = opciones.maxPorVentana ?? 30;
    this.ventanaMs = opciones.ventanaMs ?? 60000;
    this.ahora = opciones.ahora ?? (() => Date.now());
    /** @type {Map<string, number[]>} */
    this.registros = new Map();
  }

  /**
   * @param {string} clave  identificador del solicitante (IP, token...)
   * @returns {boolean} true si se permite, false si excede el limite
   */
  permitir(clave) {
    const t = this.ahora();
    const corte = t - this.ventanaMs;
    const previos = (this.registros.get(clave) ?? []).filter((x) => x > corte);
    if (previos.length >= this.max) {
      this.registros.set(clave, previos);
      return false;
    }
    previos.push(t);
    this.registros.set(clave, previos);
    return true;
  }
}
