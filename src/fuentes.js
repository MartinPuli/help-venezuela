// @ts-check
/**
 * Adaptadores de fuente.
 *
 * Cada plataforma (scraper propio, SOS Venezuela, terremotovenezuela.app,
 * Hazlo Hoy...) reporta con su propio formato. Un adaptador implementa
 * `obtenerCrudos()` (trae lo que la fuente PUBLICA) y `normalizar(crudo)`
 * (lo lleva al esquema comun).
 *
 * LIMITE: este proyecto NO incluye scraping encubierto de plataformas de
 * terceros. Un adaptador debe consumir un feed/endpoint que la fuente
 * publica, o datos que el operador ya posee. El scraping de redes para
 * recolectar fotos/nombres de personas que no consintieron es decision (y
 * responsabilidad) de cada operador, no de esta capa.
 */

import { crearRegistro, CONFIANZA } from './esquema.js';
import { normalizarNombre, normalizarCedula } from './normalizar.js';

/**
 * @typedef {Object} Fuente
 * @property {string} id
 * @property {() => Promise<any[]>} obtenerCrudos        trae registros crudos de la fuente
 * @property {(crudo:any) => import('./esquema.js').Registro} normalizar  crudo -> Registro
 */

/**
 * Normaliza un objeto crudo "flexible" al esquema comun, infiriendo
 * `nombreNormalizado`, `cedula` y `confianza`. Util como base de adaptadores.
 * @param {Object} crudo
 * @param {string} fuente  id de la fuente
 * @param {Object} [mapa]  mapeo de nombres de campo crudo -> estandar
 * @returns {import('./esquema.js').Registro}
 */
export function normalizarCrudo(crudo, fuente, mapa = {}) {
  const g = (estandar, ...alias) => {
    const claves = [mapa[estandar], estandar, ...alias].filter(Boolean);
    for (const k of claves) {
      if (crudo[k] != null && crudo[k] !== '') return crudo[k];
    }
    return undefined;
  };

  const nombre = g('nombre', 'name', 'nombre_completo', 'fullName');
  if (!nombre) throw new Error(`normalizarCrudo[${fuente}]: falta "nombre" en ${JSON.stringify(crudo).slice(0, 120)}`);

  const cedula = normalizarCedula(g('cedula', 'ci', 'dni', 'documento'));
  const idOrigen = g('id', 'idOrigen', 'uuid') ?? hashCorto(`${nombre}|${cedula ?? ''}`);

  const confianza = cedula
    ? CONFIANZA.ALTA
    : (g('fotoHash', 'foto_hash') ? CONFIANZA.MEDIA : CONFIANZA.BAJA);

  const ubicTexto = g('ubicacion', 'ultimaUbicacion', 'lugar', 'location');
  const lat = g('lat', 'latitud');
  const lon = g('lon', 'lng', 'longitud');

  return crearRegistro({
    id: `${fuente}:${idOrigen}`,
    cedula,
    nombre: String(nombre),
    nombreNormalizado: normalizarNombre(String(nombre)),
    edadAprox: numeroOpcional(g('edadAprox', 'edad', 'age')),
    sexo: g('sexo', 'genero', 'sex'),
    ultimaUbicacion: (ubicTexto || lat != null || lon != null)
      ? { texto: ubicTexto ? String(ubicTexto) : undefined, lat: numeroOpcional(lat), lon: numeroOpcional(lon) }
      : undefined,
    fechaUltimoContacto: g('fechaUltimoContacto', 'ultimo_contacto', 'lastSeen'),
    fotoHash: g('fotoHash', 'foto_hash', 'photoHash'),
    estado: g('estado', 'status'),
    verificado: g('verificado', 'verified') === true,
    verificadoPor: g('verificadoPor', 'verifiedBy'),
    fuente,
    urlOrigen: g('urlOrigen', 'url', 'link', 'source_url'),
    reportadoEn: g('reportadoEn', 'fecha', 'createdAt', 'timestamp'),
    confianza,
    contacto: g('contacto', 'contact', 'telefono', 'phone')
      ? { raw: g('contacto', 'contact', 'telefono', 'phone') }
      : undefined,
    notas: g('notas', 'notes', 'observaciones'),
  });
}

/**
 * Crea un adaptador generico para una fuente que expone un arreglo JSON.
 * @param {string} id
 * @param {() => Promise<any[]>} cargar  funcion que trae el arreglo crudo
 * @param {Object} [mapa]
 * @returns {Fuente}
 */
export function adaptadorJSON(id, cargar, mapa = {}) {
  return {
    id,
    obtenerCrudos: cargar,
    normalizar: (crudo) => normalizarCrudo(crudo, id, mapa),
  };
}

/**
 * Ejecuta una o varias fuentes y devuelve todos los registros normalizados.
 * Las fuentes que fallan se omiten (con aviso por consola), no rompen el resto.
 * @param {Fuente[]} fuentes
 * @returns {Promise<import('./esquema.js').Registro[]>}
 */
export async function recolectar(fuentes) {
  const todos = [];
  for (const f of fuentes) {
    try {
      const crudos = await f.obtenerCrudos();
      for (const c of crudos) {
        try {
          todos.push(f.normalizar(c));
        } catch (e) {
          console.warn(`[${f.id}] registro descartado: ${e.message}`);
        }
      }
    } catch (e) {
      console.warn(`[${f.id}] fuente fallo: ${e.message}`);
    }
  }
  return todos;
}

function numeroOpcional(v) {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Hash corto determinista (no criptografico) para generar ids estables. */
function hashCorto(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
