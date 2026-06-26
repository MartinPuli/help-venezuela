// @ts-check
import { construir, cors } from './_demo.js';
import { redactarRegistro } from '../src/privacidad.js';

export default async function handler(req, res) {
  cors(res);
  const { clusters } = await construir();
  const personas = clusters.map((r) => ({
    ...redactarRegistro(r, 'publico'),
    fuentes: /** @type {any} */ (r).fuentes ?? [r.fuente],
  }));
  res.status(200).json({ total: personas.length, personas });
}
