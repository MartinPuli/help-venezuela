// @ts-check
import { construir, cors } from './_demo.js';

export default async function handler(req, res) {
  cors(res);
  const { registros } = await construir();
  res.status(200).json({ ok: true, registros: registros.length, demo: true });
}
