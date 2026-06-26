// @ts-check
/**
 * Servidor HTTP minimo (node:http, sin dependencias) que expone la capa de
 * cruce. Pensado como referencia integrable, no como producto final.
 *
 * Endpoints:
 *   GET  /salud                      -> estado del servicio
 *   GET  /feed.json                  -> feed PFIF JSON, PUBLICO y REDACTADO
 *   GET  /feed.xml                   -> feed PFIF XML, PUBLICO y REDACTADO
 *   GET  /buscar?cedula=&apellido=   -> busqueda con segundo factor (publico)
 *   GET  /verificacion               -> candidatos + posibles duplicados (VOLUNTARIO)
 *   POST /verificacion/resolver      -> humano confirma/rechaza (VOLUNTARIO)
 *
 * Autenticacion de voluntario: cabecera `x-voluntario-token`. Es un mecanismo
 * MINIMO (token compartido) para la demo; en produccion usar auth real (OIDC,
 * sesiones) y un store persistente. La logica de negocio no depende de esto.
 *
 * IMPORTANTE: el cambio de estado a "fallecido"/"localizado" SOLO ocurre via
 * POST /verificacion/resolver por un voluntario autenticado. Nada lo automatiza.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cruzar } from './cruce.js';
import { aPfifJson, aPfifXml } from './pfif.js';
import { buscarPorCedula, redactarRegistro, LimitadorTasa } from './privacidad.js';
import { ESTADOS, esEstadoValido } from './esquema.js';

const DIR_WEB = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');

/**
 * @typedef {Object} AlmacenDatos
 * @property {() => import('./esquema.js').Registro[]} listar
 * @property {(id:string, cambios:Partial<import('./esquema.js').Registro>) => void} actualizar
 */

/**
 * Crea (sin escuchar) el servidor HTTP.
 * @param {Object} opciones
 * @param {AlmacenDatos} opciones.almacen           fuente de registros (inyectable)
 * @param {string[]} [opciones.tokensVoluntario]    tokens validos de voluntario
 * @param {(evento:Object)=>void} [opciones.auditar] hook de auditoria
 * @param {LimitadorTasa} [opciones.limitador]
 * @returns {import('node:http').Server}
 */
export function crearServidor(opciones) {
  const { almacen } = opciones;
  if (!almacen || typeof almacen.listar !== 'function') {
    throw new Error('crearServidor: se requiere opciones.almacen.listar()');
  }
  const tokens = new Set(opciones.tokensVoluntario ?? []);
  const auditar = opciones.auditar ?? (() => {});
  const limitador = opciones.limitador ?? new LimitadorTasa();

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const ruta = url.pathname;
      const ip = (req.socket && req.socket.remoteAddress) || 'desconocida';

      // CORS basico para que los 4 sitios puedan consumir el feed desde el navegador.
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'content-type, x-voluntario-token');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') return fin(res, 204, '');

      // Pagina web demo conectada al feed.
      if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
        try {
          const html = await readFile(join(DIR_WEB, 'index.html'), 'utf8');
          return fin(res, 200, html, 'text/html; charset=utf-8');
        } catch {
          return fin(res, 200, 'Motor de cruce activo. Endpoints: /feed.json /buscar /personas.json');
        }
      }

      if (req.method === 'GET' && ruta === '/salud') {
        return json(res, 200, { ok: true, registros: almacen.listar().length });
      }

      // Listado redactado y amigable para la pagina.
      if (req.method === 'GET' && ruta === '/personas.json') {
        const personas = almacen.listar().map((r) => ({
          ...redactarRegistro(r, 'publico'),
          fuentes: /** @type {any} */ (r).fuentes ?? [r.fuente],
        }));
        return json(res, 200, { total: personas.length, personas });
      }

      if (req.method === 'GET' && ruta === '/feed.json') {
        const feed = aPfifJson(almacen.listar(), { publico: true });
        return json(res, 200, feed);
      }

      if (req.method === 'GET' && ruta === '/feed.xml') {
        const xml = aPfifXml(almacen.listar(), { publico: true });
        return fin(res, 200, xml, 'application/xml; charset=utf-8');
      }

      if (req.method === 'GET' && ruta === '/buscar') {
        if (!limitador.permitir(ip)) {
          return json(res, 429, { error: 'Demasiadas busquedas. Intenta mas tarde.' });
        }
        const cedula = url.searchParams.get('cedula') ?? '';
        const apellido = url.searchParams.get('apellido') ?? undefined;
        const fechaNacimiento = url.searchParams.get('fechaNacimiento') ?? undefined;
        const rol = tieneTokenValido(req, tokens) ? 'voluntario' : 'publico';
        const resultado = buscarPorCedula(almacen.listar(), cedula, {
          apellido, fechaNacimiento, rol, auditar,
        });
        return json(res, 200, resultado);
      }

      // --- Zona voluntario (requiere token) ---
      if (ruta === '/verificacion' || ruta === '/verificacion/resolver') {
        if (!tieneTokenValido(req, tokens)) {
          auditar({ accion: 'acceso_denegado', ruta, ip, ts: new Date().toISOString() });
          return json(res, 401, { error: 'Requiere token de voluntario (x-voluntario-token).' });
        }

        if (req.method === 'GET' && ruta === '/verificacion') {
          const { candidatos, posiblesDuplicados } = cruzar(almacen.listar());
          return json(res, 200, {
            candidatos: candidatos.map(serializarPar),
            posiblesDuplicados: posiblesDuplicados.map(serializarPar),
          });
        }

        if (req.method === 'POST' && ruta === '/verificacion/resolver') {
          const cuerpo = await leerJson(req);
          return resolver(res, almacen, cuerpo, auditar);
        }
      }

      return json(res, 404, { error: 'No encontrado' });
    } catch (e) {
      return json(res, 500, { error: 'Error interno', detalle: String(e && e.message) });
    }
  });
}

/**
 * Aplica una decision HUMANA sobre un registro: confirmar estado, marcar
 * duplicado, etc. Es el unico camino para fijar un estado terminal.
 * @param {import('node:http').ServerResponse} res
 * @param {AlmacenDatos} almacen
 * @param {any} cuerpo
 * @param {(e:Object)=>void} auditar
 */
function resolver(res, almacen, cuerpo, auditar) {
  const { id, accion, estado, voluntario } = cuerpo ?? {};
  if (!id || !accion) return json(res, 400, { error: 'Faltan campos: id, accion.' });
  if (!voluntario) return json(res, 400, { error: 'Falta identificar al voluntario.' });

  if (accion === 'confirmar_estado') {
    if (!esEstadoValido(estado)) {
      return json(res, 400, { error: `Estado invalido. Validos: ${Object.values(ESTADOS).join(', ')}` });
    }
    almacen.actualizar(id, { estado, verificado: true, verificadoPor: String(voluntario) });
    auditar({ accion: 'confirmar_estado', id, estado, voluntario, ts: new Date().toISOString() });
    return json(res, 200, { ok: true, id, estado, verificado: true });
  }

  if (accion === 'marcar_no_duplicado' || accion === 'fusionar') {
    // Estas acciones requieren un modelo de relaciones que el almacen concreto
    // debe implementar; aqui solo se audita la decision humana.
    auditar({ accion, id, voluntario, datos: cuerpo, ts: new Date().toISOString() });
    return json(res, 200, { ok: true, registrado: accion });
  }

  return json(res, 400, { error: `Accion no soportada: ${accion}` });
}

// ---------------------------------------------------------------------------

function tieneTokenValido(req, tokens) {
  if (tokens.size === 0) return false;
  const t = req.headers['x-voluntario-token'];
  return typeof t === 'string' && tokens.has(t);
}

function serializarPar(par) {
  return {
    a: { id: par.a.id, nombre: par.a.nombre, fuente: par.a.fuente, estado: par.a.estado },
    b: { id: par.b.id, nombre: par.b.nombre, fuente: par.b.fuente, estado: par.b.estado },
    tipo: par.coincidencia.tipo,
    score: par.coincidencia.score,
    razones: par.coincidencia.razones,
  };
}

function leerJson(req) {
  return new Promise((resolve, reject) => {
    let datos = '';
    let tam = 0;
    req.on('data', (c) => {
      tam += c.length;
      if (tam > 1_000_000) { reject(new Error('cuerpo demasiado grande')); req.destroy(); return; }
      datos += c;
    });
    req.on('end', () => {
      if (!datos) return resolve({});
      try { resolve(JSON.parse(datos)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, codigo, obj) {
  fin(res, codigo, JSON.stringify(obj, null, 2), 'application/json; charset=utf-8');
}

function fin(res, codigo, cuerpo, tipo = 'text/plain; charset=utf-8') {
  res.writeHead(codigo, { 'Content-Type': tipo });
  res.end(cuerpo);
}

/**
 * Almacen en memoria de referencia. Para produccion, implementar la misma
 * interfaz contra una base de datos persistente.
 * @param {import('./esquema.js').Registro[]} [inicial]
 * @returns {AlmacenDatos}
 */
export function almacenMemoria(inicial = []) {
  const porId = new Map(inicial.map((r) => [r.id, r]));
  return {
    listar: () => [...porId.values()],
    actualizar: (id, cambios) => {
      const actual = porId.get(id);
      if (actual) porId.set(id, { ...actual, ...cambios });
    },
  };
}
