// @ts-check
/**
 * Cascada de cruce / deduplicacion.
 *
 * Filosofia (ver SEGURIDAD.md):
 *  - Automatizamos la DETECCION de duplicados, no la CONFIRMACION de identidad
 *    ni el cambio de estado.
 *  - Unica fusion automatica: cedula exacta. Todo lo demas (nombre+edad+ubicacion,
 *    o misma foto) genera un CANDIDATO que un humano revisa.
 *  - Cedulas distintas => personas distintas, aunque el nombre coincida.
 */

import { similitudNombres } from './similitud.js';
import { mismaImagen } from './phash.js';
import { estadoMasConservador, CONFIANZA } from './esquema.js';
import { clavesBloqueo } from './normalizar.js';

/**
 * @typedef {import('./esquema.js').Registro} Registro
 */

/**
 * @typedef {Object} OpcionesCruce
 * @property {number} [umbralNombreAlto=0.90]  similitud minima para CANDIDATO de fusion
 * @property {number} [umbralNombreMedio=0.84] similitud minima para POSIBLE DUPLICADO (solo panel)
 * @property {number} [toleranciaEdad=2]       diferencia maxima de edad en años
 * @property {number} [ventanaDias=7]          ventana de fecha de ultimo contacto
 * @property {number} [umbralFotoHamming=10]   distancia hamming maxima para "misma foto"
 * @property {boolean} [exhaustivo=false]      si true, compara todos contra todos (ignora bloqueo)
 */

/** @type {Required<OpcionesCruce>} */
const POR_DEFECTO = {
  umbralNombreAlto: 0.90,
  umbralNombreMedio: 0.84,
  toleranciaEdad: 2,
  ventanaDias: 7,
  umbralFotoHamming: 10,
  exhaustivo: false,
};

/**
 * @typedef {Object} Coincidencia
 * @property {'exacta_cedula'|'cedula_distinta'|'candidata'|'posible_duplicado'|'sin_relacion'} tipo
 * @property {number} score        confianza del match en [0,1]
 * @property {boolean} requiereRevision  si un humano debe confirmar antes de fusionar
 * @property {string[]} razones    explicacion legible de por que coinciden o no
 */

/**
 * Compara dos registros y clasifica su relacion segun la cascada.
 * @param {Registro} a
 * @param {Registro} b
 * @param {OpcionesCruce} [opciones]
 * @returns {Coincidencia}
 */
export function compararRegistros(a, b, opciones = {}) {
  const o = { ...POR_DEFECTO, ...opciones };
  const razones = [];

  // --- Nivel 1: cedula (llave fuerte) ---
  if (a.cedula && b.cedula) {
    if (a.cedula === b.cedula) {
      return {
        tipo: 'exacta_cedula',
        score: 1,
        requiereRevision: false,
        razones: ['Cedula identica: ' + a.cedula],
      };
    }
    // Dos cedulas distintas => personas distintas. La cedula manda sobre el nombre.
    return {
      tipo: 'cedula_distinta',
      score: 0,
      requiereRevision: false,
      razones: [`Cedulas distintas (${a.cedula} != ${b.cedula}): se asumen personas diferentes`],
    };
  }

  // --- Nivel 2: nombre + señales de apoyo (sin cedula en al menos uno) ---
  const simNombre = similitudNombres(a.nombreNormalizado, b.nombreNormalizado);
  razones.push(`Similitud de nombre: ${simNombre.toFixed(3)}`);

  const edad = compatibilidadEdad(a, b, o.toleranciaEdad);
  if (edad.aplica) razones.push(edad.razon);

  const fecha = compatibilidadFecha(a, b, o.ventanaDias);
  if (fecha.aplica) razones.push(fecha.razon);

  const ubic = compatibilidadUbicacion(a, b);
  if (ubic.aplica) razones.push(ubic.razon);

  let mismaFoto = false;
  if (a.fotoHash && b.fotoHash) {
    mismaFoto = mismaImagen(a.fotoHash, b.fotoHash, o.umbralFotoHamming);
    razones.push(mismaFoto ? 'Misma foto (repost detectado por pHash)' : 'Fotos distintas');
  }

  // Señales de apoyo: edad compatible, fecha cercana, ubicacion cercana, misma foto.
  const edadOk = edad.aplica ? edad.compatible : false;
  const fechaOk = fecha.aplica ? fecha.compatible : false;
  const ubicOk = ubic.aplica ? ubic.compatible : false;
  const apoyos = [edadOk, fechaOk, ubicOk, mismaFoto].filter(Boolean).length;

  // Score combinado: nombre domina, las señales lo refuerzan.
  let score = simNombre;
  if (edadOk) score += 0.03;
  if (fechaOk) score += 0.02;
  if (ubicOk) score += 0.03;
  if (mismaFoto) score += 0.08; // misma foto reposteada es señal fuerte de "mismo reporte"
  score = Math.min(1, score);

  // Misma foto + nombre razonable eleva a candidato aunque el nombre no llegue al umbral alto.
  const candidatoPorFoto = mismaFoto && simNombre >= o.umbralNombreMedio;

  if (
    (simNombre >= o.umbralNombreAlto && apoyos >= 1) ||
    candidatoPorFoto
  ) {
    return {
      tipo: 'candidata',
      score,
      requiereRevision: true, // SIEMPRE revision humana: sin cedula no hay fusion automatica
      razones,
    };
  }

  if (simNombre >= o.umbralNombreMedio) {
    return {
      tipo: 'posible_duplicado',
      score,
      requiereRevision: true,
      razones,
    };
  }

  return { tipo: 'sin_relacion', score, requiereRevision: false, razones };
}

/**
 * @typedef {Object} Par
 * @property {Registro} a
 * @property {Registro} b
 * @property {Coincidencia} coincidencia
 */

/**
 * @typedef {Object} ResultadoCruce
 * @property {Registro[]} clusters      registros fusionados (uno por persona detectada por cedula)
 * @property {Par[]} candidatos         pares que requieren confirmacion humana para fusionar
 * @property {Par[]} posiblesDuplicados pares debiles, solo para el panel de verificacion
 * @property {number} totalEntrada
 * @property {number} fusionesAutomaticas
 */

/**
 * Cruza una lista de registros.
 *  - Fusiona automaticamente SOLO los que comparten cedula (union-find).
 *  - Reporta candidatos y posibles duplicados para revision humana, sin fusionar.
 * @param {Registro[]} registros
 * @param {OpcionesCruce} [opciones]
 * @returns {ResultadoCruce}
 */
export function cruzar(registros, opciones = {}) {
  const o = { ...POR_DEFECTO, ...opciones };
  const n = registros.length;

  // Union-find solo para fusiones por cedula.
  const padre = registros.map((_, i) => i);
  const buscar = (x) => {
    while (padre[x] !== x) {
      padre[x] = padre[padre[x]];
      x = padre[x];
    }
    return x;
  };
  const unir = (x, y) => {
    const rx = buscar(x);
    const ry = buscar(y);
    if (rx !== ry) padre[rx] = ry;
  };

  /** @type {Par[]} */
  const candidatos = [];
  /** @type {Par[]} */
  const posiblesDuplicados = [];
  let fusionesAutomaticas = 0;

  const pares = o.exhaustivo ? paresExhaustivos(n) : paresPorBloqueo(registros);

  for (const [i, j] of pares) {
    const c = compararRegistros(registros[i], registros[j], o);
    switch (c.tipo) {
      case 'exacta_cedula':
        if (buscar(i) !== buscar(j)) {
          unir(i, j);
          fusionesAutomaticas++;
        }
        break;
      case 'candidata':
        candidatos.push({ a: registros[i], b: registros[j], coincidencia: c });
        break;
      case 'posible_duplicado':
        posiblesDuplicados.push({ a: registros[i], b: registros[j], coincidencia: c });
        break;
      default:
        break; // cedula_distinta / sin_relacion: nada
    }
  }

  // Construir clusters fusionados.
  /** @type {Map<number, Registro[]>} */
  const grupos = new Map();
  for (let i = 0; i < n; i++) {
    const r = buscar(i);
    if (!grupos.has(r)) grupos.set(r, []);
    grupos.get(r).push(registros[i]);
  }
  const clusters = [...grupos.values()].map(fusionarCluster);

  return {
    clusters,
    candidatos,
    posiblesDuplicados,
    totalEntrada: n,
    fusionesAutomaticas,
  };
}

/**
 * Fusiona un grupo de registros que se confirmo que son la misma persona
 * (mismo cedula). Combina campos de forma conservadora.
 *
 * REGLA DE ESTADO: nunca se escala el estado por fusionar. El estado mostrado
 * es el mas conservador entre los VERIFICADOS por humanos; si ninguno esta
 * verificado, se mantiene el mas conservador y se anexa `estadosReportados`
 * para que un voluntario decida.
 * @param {Registro[]} grupo
 * @returns {Registro & { estadosReportados?: Array<{fuente:string,estado:string,verificado:boolean}>, fuentes?: string[] }}
 */
export function fusionarCluster(grupo) {
  if (grupo.length === 1) return { ...grupo[0] };

  // Orden por reciente primero, para preferir el dato mas nuevo.
  const ordenados = [...grupo].sort((a, b) =>
    String(b.reportadoEn).localeCompare(String(a.reportadoEn)),
  );

  const base = { ...ordenados[0] };
  const primeroCon = (campo) => ordenados.find((r) => r[campo] != null && r[campo] !== '')?.[campo];

  base.cedula = primeroCon('cedula') ?? base.cedula;
  base.edadAprox = primeroCon('edadAprox') ?? base.edadAprox;
  base.sexo = primeroCon('sexo') ?? base.sexo;
  base.ultimaUbicacion = primeroCon('ultimaUbicacion') ?? base.ultimaUbicacion;
  base.fechaUltimoContacto = primeroCon('fechaUltimoContacto') ?? base.fechaUltimoContacto;
  base.fotoHash = primeroCon('fotoHash') ?? base.fotoHash;

  // Estado: solo entre verificados; si no hay, el mas conservador de todos.
  const verificados = grupo.filter((r) => r.verificado === true);
  const fuente = verificados.length ? verificados : grupo;
  base.estado = estadoMasConservador(fuente.map((r) => r.estado));
  base.verificado = verificados.length > 0;

  // Confianza alta: se fusiono por cedula.
  base.confianza = CONFIANZA.ALTA;

  // Trazabilidad: que reporto cada fuente.
  const conMeta = /** @type {any} */ (base);
  conMeta.fuentes = [...new Set(grupo.map((r) => r.fuente))];
  conMeta.estadosReportados = grupo.map((r) => ({
    fuente: r.fuente,
    estado: r.estado,
    verificado: r.verificado === true,
  }));

  return conMeta;
}

// ---------------------------------------------------------------------------
// Auxiliares de compatibilidad
// ---------------------------------------------------------------------------

/**
 * @param {Registro} a @param {Registro} b @param {number} tol
 * @returns {{aplica:boolean, compatible:boolean, razon:string}}
 */
function compatibilidadEdad(a, b, tol) {
  if (a.edadAprox == null || b.edadAprox == null) {
    return { aplica: false, compatible: false, razon: '' };
  }
  const dif = Math.abs(a.edadAprox - b.edadAprox);
  return {
    aplica: true,
    compatible: dif <= tol,
    razon: `Edad: ${a.edadAprox} vs ${b.edadAprox} (dif ${dif}, tol ${tol})`,
  };
}

/**
 * @param {Registro} a @param {Registro} b @param {number} ventanaDias
 * @returns {{aplica:boolean, compatible:boolean, razon:string}}
 */
function compatibilidadFecha(a, b, ventanaDias) {
  const fa = a.fechaUltimoContacto ? Date.parse(a.fechaUltimoContacto) : NaN;
  const fb = b.fechaUltimoContacto ? Date.parse(b.fechaUltimoContacto) : NaN;
  if (Number.isNaN(fa) || Number.isNaN(fb)) {
    return { aplica: false, compatible: false, razon: '' };
  }
  const difDias = Math.abs(fa - fb) / (1000 * 60 * 60 * 24);
  return {
    aplica: true,
    compatible: difDias <= ventanaDias,
    razon: `Fecha ultimo contacto: dif ${difDias.toFixed(1)} dias (ventana ${ventanaDias})`,
  };
}

/**
 * Compatibilidad de ubicacion: por coordenadas (si hay) o por texto.
 * @param {Registro} a @param {Registro} b
 * @returns {{aplica:boolean, compatible:boolean, razon:string}}
 */
function compatibilidadUbicacion(a, b) {
  const ua = a.ultimaUbicacion;
  const ub = b.ultimaUbicacion;
  if (!ua || !ub) return { aplica: false, compatible: false, razon: '' };

  if (ua.lat != null && ua.lon != null && ub.lat != null && ub.lon != null) {
    const km = distanciaKm(ua.lat, ua.lon, ub.lat, ub.lon);
    return {
      aplica: true,
      compatible: km <= 5, // mismo barrio/zona aprox
      razon: `Ubicacion: ${km.toFixed(1)} km de distancia`,
    };
  }
  if (ua.texto && ub.texto) {
    const ta = ua.texto.toLowerCase();
    const tb = ub.texto.toLowerCase();
    const comparten = ta.includes(tb) || tb.includes(ta) ||
      ta.split(/[\s,]+/).some((p) => p.length > 3 && tb.includes(p));
    return {
      aplica: true,
      compatible: comparten,
      razon: `Ubicacion (texto): ${comparten ? 'coincide' : 'no coincide'}`,
    };
  }
  return { aplica: false, compatible: false, razon: '' };
}

/** Distancia haversine en km. */
function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Pares (i,j) i<j exhaustivos. */
function paresExhaustivos(n) {
  const pares = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pares.push([i, j]);
  return pares;
}

/**
 * Pares candidatos por bloqueo: solo se comparan registros que comparten al
 * menos una clave de bloqueo. Reduce el O(n^2) drasticamente en datasets grandes.
 * @param {Registro[]} registros
 * @returns {Array<[number,number]>}
 */
function paresPorBloqueo(registros) {
  /** @type {Map<string, number[]>} */
  const cubos = new Map();
  registros.forEach((reg, idx) => {
    for (const clave of clavesBloqueo(reg)) {
      if (!cubos.has(clave)) cubos.set(clave, []);
      cubos.get(clave).push(idx);
    }
  });

  /** @type {Set<string>} */
  const vistos = new Set();
  /** @type {Array<[number,number]>} */
  const pares = [];
  for (const indices of cubos.values()) {
    if (indices.length < 2) continue;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = Math.min(indices[a], indices[b]);
        const j = Math.max(indices[a], indices[b]);
        const clave = i + ':' + j;
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        pares.push([i, j]);
      }
    }
  }
  return pares;
}
