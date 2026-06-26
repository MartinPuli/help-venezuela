// @ts-check
/**
 * cruce-desaparecidos — capa open source de cruce y deduplicacion de reportes
 * de personas desaparecidas. Normaliza fuentes heterogeneas a un esquema
 * comun, deduplica con una cascada (cedula exacta -> candidato -> posible
 * duplicado) y expone un feed estandar (PFIF) que cualquier plataforma puede
 * consumir.
 *
 * Punto de entrada: re-exporta la API publica.
 */

export {
  ESTADOS,
  ESTADOS_TERMINALES,
  CONFIANZA,
  crearRegistro,
  esEstadoValido,
  esEstadoTerminal,
  estadoMasConservador,
} from './esquema.js';

export {
  sinTildes,
  normalizarNombre,
  tokensNombre,
  normalizarCedula,
  nacionalidadCedula,
  clavesBloqueo,
} from './normalizar.js';

export {
  levenshtein,
  similitudLevenshtein,
  jaro,
  jaroWinkler,
  similitudTokens,
  similitudNombres,
} from './similitud.js';

export {
  compararRegistros,
  cruzar,
  fusionarCluster,
} from './cruce.js';

export {
  dHash,
  distanciaHamming,
  mismaImagen,
  rgbaAGris,
} from './phash.js';

export {
  redactarRegistro,
  enmascararCedula,
  buscarPorCedula,
  validarSegundoFactor,
  LimitadorTasa,
} from './privacidad.js';

export {
  normalizarCrudo,
  adaptadorJSON,
  recolectar,
} from './fuentes.js';

export {
  aPfifPersona,
  aPfifJson,
  desdePfifJson,
  aPfifXml,
} from './pfif.js';
