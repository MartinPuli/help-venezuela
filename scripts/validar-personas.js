// @ts-check
/**
 * Valida los archivos de `personas/` y avisa de posibles duplicados.
 * Lo corre la CI en cada PR (.github/workflows/ci.yml).
 *
 * Comprueba:
 *  - cada archivo es JSON valido y cumple el esquema minimo (nombre, estado...)
 *  - advierte si alguien puso una cedula COMPLETA en el repo publico
 *  - corre el cruce y lista posibles duplicados para que el revisor los vea
 *
 * Sale con codigo != 0 si hay errores DUROS (formato/estado invalido).
 * Los duplicados y las cedulas son ADVERTENCIAS (no bloquean), porque a veces
 * son legitimos y los decide un humano.
 */

import { leerPersonas } from '../fuentes/personas-repo.js';
import { normalizarCrudo } from '../src/fuentes.js';
import { cruzar } from '../src/cruce.js';
import { esEstadoValido } from '../src/esquema.js';

async function main() {
  const crudos = await leerPersonas();
  console.log(`Personas en el registro comunitario: ${crudos.length}`);

  const errores = [];
  const advertencias = [];
  const registros = [];

  for (const c of crudos) {
    const etiqueta = c.id ?? c.nombre ?? '(sin id)';
    if (!c.nombre || String(c.nombre).trim().length < 2) {
      errores.push(`[${etiqueta}] falta "nombre" valido`);
      continue;
    }
    if (c.estado && !esEstadoValido(c.estado)) {
      errores.push(`[${etiqueta}] estado invalido: "${c.estado}"`);
      continue;
    }
    if (c.cedula && String(c.cedula).replace(/\D/g, '').length >= 6) {
      advertencias.push(`[${etiqueta}] contiene una cedula COMPLETA en un repo publico. Considera omitirla (ver personas/README.md).`);
    }
    if (c.contacto || c.telefono || c.phone) {
      advertencias.push(`[${etiqueta}] contiene datos de contacto. NO deben ir en el repo publico.`);
    }
    try {
      registros.push(normalizarCrudo(c, 'comunidad'));
    } catch (e) {
      errores.push(`[${etiqueta}] no se pudo normalizar: ${e.message}`);
    }
  }

  // Cruce para detectar duplicados dentro del registro comunitario.
  if (registros.length > 1) {
    const r = cruzar(registros);
    const dups = [...r.candidatos, ...r.posiblesDuplicados];
    if (dups.length) {
      advertencias.push(`Se detectaron ${dups.length} posibles duplicados (revisar a mano):`);
      for (const p of dups.slice(0, 20)) {
        advertencias.push(`   - "${p.a.nombre}" <-> "${p.b.nombre}" (${p.coincidencia.tipo}, score ${p.coincidencia.score.toFixed(2)})`);
      }
    }
  }

  if (advertencias.length) {
    console.log('\n⚠️  Advertencias:');
    for (const a of advertencias) console.log('   ' + a);
  }
  if (errores.length) {
    console.error('\n❌ Errores:');
    for (const e of errores) console.error('   ' + e);
    process.exit(1);
  }
  console.log('\n✅ Validación OK');
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
