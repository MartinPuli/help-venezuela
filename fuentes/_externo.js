// @ts-check
/**
 * Helper para adaptadores que consumen sitios REALES de terceros.
 *
 * OPT-IN POR SEGURIDAD: estos adaptadores solo traen datos si la variable de
 * entorno HABILITAR_FUENTES_REALES === '1'. Si no, devuelven [] (y avisan).
 *
 * Por que: este repo es PUBLICO y el pipeline programado commitea el feed.
 * Activar la ingesta de nombres reales de personas es una decision consciente
 * del operador (consentimiento, terminos de servicio de cada sitio, verificacion
 * de que no es una fuente fraudulenta). No debe pasar por accidente.
 *
 *   # para habilitar (local o en el Action):
 *   HABILITAR_FUENTES_REALES=1 node scripts/recolectar.js
 */

export const FUENTES_REALES_HABILITADAS = process.env.HABILITAR_FUENTES_REALES === '1';

const UA = 'cruce-desaparecidos/0.1 (+https://github.com/MartinPuli/help-venezuela; humanitario)';

/**
 * Trae JSON de una URL respetando el opt-in. Devuelve null si esta deshabilitado.
 * @param {string} url
 * @param {Object} opts
 * @param {string} opts.id  id de la fuente (para logs)
 * @param {number} [opts.timeoutMs=15000]
 * @returns {Promise<any|null>}
 */
export async function traerJSON(url, opts) {
  const id = opts?.id ?? 'externo';
  if (!FUENTES_REALES_HABILITADAS) {
    console.warn(`[${id}] fuentes reales deshabilitadas (HABILITAR_FUENTES_REALES!=1); se omite ${url}`);
    return null;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 15000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Mapea estados textuales libres de las fuentes a nuestro enum.
 * Conservador: cualquier "localizado/encontrado" es terminal y SIN verificar,
 * por lo que crearRegistro() lo degradara a visto_no_confirmado (correcto).
 * @param {string} [texto]
 * @returns {string}
 */
export function mapearEstado(texto) {
  const t = String(texto ?? '').toLowerCase();
  if (/(fallecid|muert|decea)/.test(t)) return 'fallecido_confirmado';
  if (/(localizad|encontrad|a salvo|reunid|hallad)/.test(t)) return 'localizado_a_salvo';
  if (/(visto|avistad)/.test(t)) return 'visto_no_confirmado';
  return 'desaparecido';
}
