// @ts-check
/**
 * Genera FUENTES.md a partir de fuentes/catalogo.json (salida del barrido de
 * investigacion). Asi el catalogo legible se mantiene en sync con los datos.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const cat = JSON.parse(await readFile(join(RAIZ, 'fuentes', 'catalogo.json'), 'utf8'));

const ICONO_ACCESO = {
  api: '🟢 API/JSON',
  feed_pfif: '🟢 PFIF',
  html_publico: '🟡 HTML',
  formulario: '🟡 Formulario',
  solo_lectura_manual: '🔴 Manual',
  desconocido: '⚪ ?',
};
const ICONO_CONF = {
  oficial: '🏛️ Oficial',
  verificado_medio: '📰 Verif. medio',
  comunitario: '🤝 Comunitario',
  desconocido: '⚪ ?',
  sospechoso_scam: '⚠️ SCAM?',
};

function fila(f) {
  const acceso = ICONO_ACCESO[f.metodo_acceso] || f.metodo_acceso;
  const conf = ICONO_CONF[f.senal_confianza] || f.senal_confianza;
  const feed = f.url_api_o_feed ? `\`${f.url_api_o_feed}\`` : '—';
  const url = f.url ? `[${f.nombre}](${f.url})` : f.nombre;
  return `| ${url} | ${f.tipo} | ${acceso} | ${feed} | ${conf} |`;
}

const porTipo = {};
for (const f of cat.fuentes) (porTipo[f.tipo] ??= []).push(f);

const ordenTipos = ['web', 'agregador', 'app', 'oficial', 'cruz_roja', 'ong', 'medio', 'red_social', 'mensajeria', 'hospital', 'foro', 'otro'];
const tiposOrdenados = [...new Set([...ordenTipos, ...Object.keys(porTipo)])].filter((t) => porTipo[t]);

const conApi = cat.fuentes.filter((f) => ['api', 'feed_pfif'].includes(f.metodo_acceso));

let md = `# Catálogo de fuentes

> Generado por un barrido de investigación (búsqueda + verificación en vivo).
> Regenerar: \`node scripts/build-fuentes-md.js\`. **No editar a mano.**

${cat.resumen}

## Prioridad de integración

Las que más conviene conectar primero (mayor cobertura + mejor acceso técnico):

${cat.prioridad_integracion.slice(0, 12).map((u, i) => `${i + 1}. ${u}`).join('\n')}

## ⚠️ Advertencias

${cat.advertencias.length ? cat.advertencias.map((a) => `- ${a}`).join('\n') : '_Ninguna._'}

> Estas NO son fuentes para ingerir: son patrones de estafa/desinformación a tener
> en cuenta. En un desastre proliferan dominios falsos y grupos fraudulentos.

## 🟢 Fuentes con API/feed (automatizables ya)

Estas exponen datos estructurados ingeribles por un adaptador:

| Fuente | Feed | Notas |
|---|---|---|
${conApi.map((f) => `| [${f.nombre}](${f.url}) | \`${f.url_api_o_feed || f.url}\` | ${(f.notas || '').slice(0, 140).replace(/\|/g, '/')}… |`).join('\n')}

## Todas las fuentes (${cat.fuentes.length})

`;

for (const tipo of tiposOrdenados) {
  md += `### ${tipo} (${porTipo[tipo].length})\n\n`;
  md += `| Fuente | Tipo | Acceso | Feed/API | Confianza |\n|---|---|---|---|---|\n`;
  md += porTipo[tipo].map(fila).join('\n') + '\n\n';
}

md += `---

**Leyenda de acceso:** 🟢 automatizable (API/PFIF) · 🟡 semi (HTML/formulario) · 🔴 manual · ⚪ desconocido
**Confianza:** 🏛️ oficial · 📰 medio verificado · 🤝 comunitario · ⚠️ posible scam

Los adaptadores de las fuentes con feed están en \`fuentes/\` (opt-in con
\`HABILITAR_FUENTES_REALES=1\`). Para sumar una fuente, ver [CONTRIBUIR.md](CONTRIBUIR.md).
`;

await writeFile(join(RAIZ, 'FUENTES.md'), md);
console.log(`[build-fuentes-md] FUENTES.md generado: ${cat.fuentes.length} fuentes, ${conApi.length} con API.`);
