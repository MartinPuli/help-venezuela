# Privacidad

> Esto se dice en serio dado el contexto venezolano. Exponer datos personales
> sin fricción (ubicación, estado de salud, contacto, cédula) es un vector de
> acoso y, en un país con un gobierno que ha perseguido disidentes, de algo peor.

## Qué es público y qué no

| Dato | Feed público / `publico/` | Voluntario autenticado |
|---|:---:|:---:|
| Nombre | ✅ | ✅ |
| Estado (desaparecido/…) | ✅ | ✅ |
| Edad, sexo | ✅ | ✅ |
| Ubicación general (zona/ciudad) | ✅ (texto) | ✅ |
| Coordenadas exactas (lat/lon) | ❌ | ✅ |
| Cédula | ❌ (enmascarada `*****678`) | ✅ |
| Teléfono / contacto | ❌ | ✅ |
| Notas de salud | ❌ | ✅ |
| Foto / URL de la foto | ❌ | (solo hash) |

La redacción la aplica `src/privacidad.js` (`redactarRegistro`). El feed PFIF
público (`aPfifPersona({ publico: true })`) nunca incluye foto, contacto ni
coordenadas. Cubierto por `privacidad.test.js` y `servidor.test.js`.

## Búsqueda por cédula con segundo factor

La cédula es buscable, pero **no sin fricción**: quien busca debe aportar también
**apellido o fecha de nacimiento**. Sin ese segundo dato, el sistema confirma que
hay un registro pero **no entrega los detalles**.

```
GET /buscar?cedula=12345678                 → { encontrado:true, autorizado:false }
GET /buscar?cedula=12345678&apellido=Pena   → { autorizado:true, registro:{…} }
```

Además hay un **limitador de tasa** (`LimitadorTasa`) por IP para frenar el
scraping masivo de cédulas.

## Panel de verificación: solo voluntarios autenticados

El panel con datos crudos y la cola de candidatos (`/verificacion`) requiere
token de voluntario. No es público. El cambio de estado queda **auditado**
(quién, qué, cuándo) vía el hook `auditar`.

## Para quien contribuye

- No subas cédulas completas, teléfonos ni direcciones exactas al repo público
  (`personas/`). El validador de CI te avisa si lo haces.
- Si tienes datos sensibles que ayudan a identificar, compártelos por el canal
  privado de voluntarios, no por el repositorio.

## En producción

- El token compartido de voluntario del servidor de referencia es un mínimo para
  la demo. Usa autenticación real (OIDC/sesiones) y un store persistente.
- Considera no commitear ni siquiera el feed redactado si tu modelo de amenaza lo
  exige; el pipeline permite servir todo en memoria sin escribir a git.
