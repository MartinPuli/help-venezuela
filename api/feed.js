// @ts-check
import { construir, cors } from './_demo.js';
import { aPfifJson } from '../src/pfif.js';

export default async function handler(req, res) {
  cors(res);
  const { clusters } = await construir();
  res.status(200).json(aPfifJson(clusters, { publico: true }));
}
