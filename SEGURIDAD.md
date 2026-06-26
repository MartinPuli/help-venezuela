# Principios de seguridad (no negociables)

Esta capa maneja datos de personas en una situación de vida o muerte. Un error
no es un bug: es daño real a una familia. Estas reglas están **codificadas en el
código** y cubiertas por pruebas, no son solo buenas intenciones.

## 1. Automatizamos la detección, nunca la confirmación

El scraping y el matching pueden **proponer** que dos reportes son la misma
persona o que alguien fue localizado. **Confirmarlo lo hace un humano.**

- Único camino para fijar `localizado_a_salvo` o `fallecido_confirmado`:
  `POST /verificacion/resolver` por un voluntario autenticado.
- `crearRegistro()` **degrada** cualquier estado terminal sin `verificado:true`
  a `visto_no_confirmado`. (Prueba: `cruce.test.js`, `esquema.js`.)
- Al fusionar, el estado **nunca se escala** por contar varias fuentes: se toma
  el más conservador y se anexa `estadosReportados` para que un humano decida.

## 2. Única fusión automática: cédula exacta

- Cédula idéntica → fusión automática.
- **Cédulas distintas → personas distintas**, aunque el nombre sea idéntico.
  La cédula manda sobre el nombre.
- Sin cédula, **nada se fusiona solo**: solo se generan *candidatos* que un
  humano revisa. (Prueba: “sin cédula NUNCA se fusiona automáticamente”.)

## 3. Sin reconocimiento facial

`src/phash.js` hace *perceptual hashing*: detecta si **la misma imagen** fue
reposteada en varios sitios. Eso es deduplicar el mismo post.

Decir “esta foto **distinta** es la misma persona” requeriría reconocimiento
facial, y **no se implementa**: en este contexto un falso positivo (decir que
encontraron a alguien cuando es otra persona) hace daño real. Cualquier
coincidencia por foto distinta debe ir a revisión humana, jamás auto-confirmarse.

## 4. Lo público es redactado; lo crudo no se publica

- A `publico/` (y al feed PFIF) solo va información redactada: sin contacto, sin
  cédula completa, sin coordenadas exactas, sin fotos. (Ver PRIVACIDAD.md.)
- Los datos crudos se escriben en `datos/`, que está en `.gitignore` y **no se
  commitea**. El repositorio es público; los datos sensibles no.

## 5. Defensa contra datos falsos

- Las fuentes se catalogan con una señal de confianza (oficial / medio
  verificado / comunitaria / **sospechosa de scam**). No todas las “plataformas”
  que aparecen tras un desastre son legítimas.
- El registro comunitario (`personas/`) pasa por revisión humana en el PR antes
  de entrar al cruce.

---

Si una contribución rompe alguno de estos principios, **no se mergea**, por más
útil que parezca. “Matamos trabajo manual” (bien: automatizar la búsqueda) es
distinto de “automatizamos la confirmación” (riesgo inaceptable).
