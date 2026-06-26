// @ts-check
import { construir, cors } from './_demo.js';
import { buscarPorCedula } from '../src/privacidad.js';

export default async function handler(req, res) {
  cors(res);
  const { registros } = await construir();
  const cedula = (req.query && req.query.cedula) || '';
  const apellido = (req.query && req.query.apellido) || undefined;
  const fechaNacimiento = (req.query && req.query.fechaNacimiento) || undefined;
  const resultado = buscarPorCedula(registros, String(cedula), { apellido, fechaNacimiento });
  res.status(200).json(resultado);
}
