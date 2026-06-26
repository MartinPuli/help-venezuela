// @ts-check
/**
 * Datos de ejemplo SINTETICOS. Personas inventadas para demostrar el cruce.
 * NUNCA poner datos reales de personas en el repositorio.
 *
 * Simula el mismo grupo de personas reportado por varias fuentes con
 * variaciones tipicas: tildes, errores de tipeo, cedula a veces ausente,
 * el mismo post reposteado (mismo fotoHash), distinto orden de nombre.
 */

/** @type {Array<Object>} */
export const crudosSosVenezuela = [
  {
    id: 'sv-1',
    nombre: 'José de la Cruz Peña',
    cedula: 'V-12.345.678',
    edad: 34,
    sexo: 'M',
    ubicacion: 'Los Palos Grandes, Caracas',
    estado: 'desaparecido',
    fechaUltimoContacto: '2026-06-24T18:00:00Z',
    fotoHash: 'f0e1d2c3b4a59687',
    url: 'https://sosvenezuela2026.com/p/1',
    fecha: '2026-06-24T20:00:00Z',
  },
  {
    id: 'sv-2',
    nombre: 'María Fernanda Rangel',
    cedula: 'V-20.111.222',
    edad: 28,
    sexo: 'F',
    ubicacion: 'Catia, Caracas',
    estado: 'desaparecido',
    fechaUltimoContacto: '2026-06-24T18:30:00Z',
    fecha: '2026-06-24T21:00:00Z',
  },
];

/** El scraper propio: a veces sin cedula, con tildes faltantes y typos. */
export const crudosScraperPropio = [
  {
    id: 'sc-1',
    nombre: 'Jose Cruz Pena', // mismo de sv-1 pero sin cedula, sin tildes
    edad: 35,
    ubicacion: 'Los Palos Grandes',
    estado: 'desaparecido',
    fechaUltimoContacto: '2026-06-24',
    fotoHash: 'f0e1d2c3b4a59687', // MISMA foto reposteada
    url: 'https://x.com/post/abc',
    fecha: '2026-06-25T02:00:00Z',
  },
  {
    id: 'sc-2',
    nombre: 'Pedro Gonzalez',
    edad: 50,
    ubicacion: 'Maiquetia, La Guaira',
    estado: 'desaparecido',
    fecha: '2026-06-25T03:00:00Z',
  },
];

/** terremotovenezuela.app: usa otros nombres de campo (mapeo distinto). */
export const crudosTerremotoApp = [
  {
    uuid: 'tv-1',
    name: 'Jose de la Cruz Peña', // mismo, con cedula -> fusion fuerte con sv-1
    ci: 'V12345678',
    age: 34,
    location: 'Los Palos Grandes, Caracas',
    status: 'visto_no_confirmado',
    lastSeen: '2026-06-24T18:00:00Z',
    link: 'https://terremotovenezuela.app/r/1',
    createdAt: '2026-06-25T05:00:00Z',
  },
  {
    uuid: 'tv-2',
    name: 'Maria F. Rangel', // mismo de sv-2 pero nombre abreviado, SIN cedula
    age: 29,
    location: 'Catia',
    status: 'desaparecido',
    createdAt: '2026-06-25T06:00:00Z',
  },
];

/** Mapeo de campos para terremotovenezuela.app. */
export const mapaTerremotoApp = {
  id: 'uuid',
  nombre: 'name',
  cedula: 'ci',
  edadAprox: 'age',
  ubicacion: 'location',
  estado: 'status',
  fechaUltimoContacto: 'lastSeen',
  urlOrigen: 'link',
  reportadoEn: 'createdAt',
};
