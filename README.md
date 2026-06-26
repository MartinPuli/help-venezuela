# cruce-desaparecidos

**Capa open source que unifica y deduplica los reportes de personas
desaparecidas del terremoto de Venezuela de 2026.**

No es una 5ª plataforma. Es la **capa de cruce** que se sienta encima de las
plataformas que ya existen (SOS Venezuela, terremotovenezuela.app,
desaparecidos…, scrapers, registros comunitarios) y responde una pregunta que
hoy nadie responde bien:

> ¿“José Pérez” reportado en 4 sitios distintos es **una persona o cuatro**?

Normaliza todas las fuentes a un esquema común, las cruza con una cascada de
matching (cédula → nombre+edad+ubicación → foto), y publica un **feed estándar
(PFIF)** que cualquiera de los sitios puede consumir. Todo con la verificación
humana y la privacidad como límites duros (ver [SEGURIDAD](SEGURIDAD.md) y
[PRIVACIDAD](PRIVACIDAD.md)).

---

## Cómo se analizan TODOS los datos (el flujo)

```
  FUENTES                NORMALIZAR            CRUZAR                 PUBLICAR
  ┌───────────────┐                                                  
  │ SOS Venezuela │─┐                                                
  │ terremoto.app │ │    ┌──────────────┐   ┌────────────────────┐  ┌──────────────┐
  │ desaparecid…  │ ├──▶ │ esquema único │──▶│ cascada de matching│─▶│ feed PFIF    │
  │ scraper propio│ │    │ (un registro  │   │ 1. cédula = fusión │  │ publico/     │
  │ personas/ (PR)│ │    │  por persona) │   │ 2. nombre+edad+ubic│  │ (redactado)  │
  │ … más fuentes │─┘    └──────────────┘   │ 3. misma foto pHash│  └──────────────┘
  └───────────────┘                          └─────────┬──────────┘
        ▲                                              │
        │                                    candidatos │ → panel de
   adaptadores                              (revisión    │   voluntarios
   (1 por fuente)                            humana)     ▼   (autenticado)
```

1. **Cada fuente tiene un adaptador** (`fuentes/<fuente>.js`) que trae lo que
   esa fuente publica y lo lleva al **esquema común** (`src/esquema.js`).
2. **Normalización** (`src/normalizar.js`): cédula a solo dígitos; nombre sin
   tildes, en minúsculas y sin partículas (“de la”, “del”…). Así
   `José de la Cruz Peña` y `jose cruz pena` se pueden comparar.
3. **Cruce en cascada** (`src/cruce.js`):
   - **Cédula idéntica → fusión automática.** Es la única fusión sin humano.
   - **Cédulas distintas → personas distintas** (la cédula manda sobre el nombre).
   - **Sin cédula:** similitud de nombre (Jaro-Winkler/Levenshtein) + edad ±2 +
     fecha/ubicación cercana → **candidato** que un humano confirma.
   - **Misma foto** (perceptual hashing, `src/phash.js`) → eleva a candidato.
     Es para detectar el **mismo post reposteado**, NO es reconocimiento facial.
   - **Solo nombre parecido** → “posible duplicado” en un panel, nunca se fusiona.
4. **Publicación** (`scripts/recolectar.js`): escribe el feed unificado y
   **redactado** en `publico/` (consumible por cualquier sitio) y los datos
   crudos en `datos/` (que NO se commitea).

> **Automatizamos la detección, nunca la confirmación.** El cambio de estado a
> “localizado” o “fallecido” solo lo hace un voluntario verificador.

---

## Que se recolecte cada X tiempo (workflow programado)

El GitHub Action [`recolectar.yml`](.github/workflows/recolectar.yml) corre el
pipeline **cada 15 minutos** (configurable), cruza todo y commitea el feed
actualizado en `publico/`. También se puede disparar a mano desde la pestaña
*Actions* o cuando alguien hace merge de una persona/fuente nueva.

```bash
# correrlo localmente:
node scripts/recolectar.js
# genera: publico/feed.json, publico/feed.xml, publico/personas.json, publico/estado.json
```

---

## Uso rápido

```bash
npm test        # 50 pruebas, sin dependencias
npm run demo    # demo del cruce con 3 fuentes de ejemplo
npm run servidor # levanta el servidor HTTP de referencia (puerto 3000)
```

Como librería:

```js
import { recolectar, cruzar, aPfifJson } from 'cruce-desaparecidos';
import { cargarFuentes } from './fuentes/registro.js';

const registros = await recolectar(await cargarFuentes());
const { clusters, candidatos } = cruzar(registros);
const feed = aPfifJson(clusters, { publico: true }); // PFIF redactado
```

El servidor expone:

| Método | Ruta | Quién | Qué |
|---|---|---|---|
| GET | `/feed.json` · `/feed.xml` | público | feed PFIF redactado |
| GET | `/buscar?cedula=&apellido=` | público | búsqueda con **segundo factor** |
| GET | `/verificacion` | voluntario | candidatos a fusionar |
| POST | `/verificacion/resolver` | voluntario | **confirmar estado** (único camino) |

---

## Cómo sumar tu sitio o una persona (PRs bienvenidos)

- **Tu plataforma:** copia `fuentes/_plantilla.js`, complétala y abre un PR.
  Queda integrada al cruce sin tocar nada más. Ver [CONTRIBUIR](CONTRIBUIR.md).
- **Una persona:** agrega un JSON en `personas/` (no hace falta programar).
  Ver [personas/README](personas/README.md).
- **Catálogo de fuentes reales:** ver [FUENTES.md](FUENTES.md) (se genera con un
  barrido de investigación de todas las fuentes existentes).

---

## Estructura

```
src/         núcleo: esquema, normalización, similitud, cruce, phash, privacidad, pfif, servidor
fuentes/     un adaptador por fuente + registro + plantilla
personas/    registro comunitario (1 JSON por persona, vía PR)
scripts/     recolectar.js (pipeline) · validar-personas.js (CI)
publico/     SALIDA unificada y redactada (la commitea el workflow)
test/        50 pruebas (node --test)
ejemplos/    demo + servidor de demostración
```

## Principios

Ver [SEGURIDAD.md](SEGURIDAD.md) y [PRIVACIDAD.md](PRIVACIDAD.md). En resumen:
ningún estado terminal se confirma sin humano; sin reconocimiento facial; la
búsqueda por cédula exige un segundo dato; los datos crudos no se hacen públicos.

Licencia [MIT](LICENSE).
