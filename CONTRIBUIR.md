# Cómo contribuir

Gracias por ayudar. Hay tres formas de sumar, de menor a mayor esfuerzo técnico.

## 1. Agregar una persona (sin programar)

Agrega un JSON en [`personas/`](personas/README.md) y abre un PR. Un voluntario
revisa y al aprobar entra al cruce. Solo `nombre` es obligatorio.

## 2. Integrar tu sitio / plataforma (un adaptador)

Si tu plataforma publica datos (un endpoint JSON, un feed, un CSV público):

1. Copia `fuentes/_plantilla.js` a `fuentes/<tu-fuente>.js`.
2. Completa `ID`, `MAPA` (mapeo de campos) y `obtenerCrudos()`.
3. Corre `node scripts/recolectar.js` para probar que entra al cruce.
4. Abre un PR. **No hay que tocar `fuentes/registro.js`**: se descubre solo.

Ejemplo mínimo:

```js
import { normalizarCrudo } from '../src/fuentes.js';
export const ID = 'mi-sitio';
export const MAPA = { nombre: 'name', cedula: 'ci', reportadoEn: 'createdAt' };
export async function obtenerCrudos() {
  const res = await fetch('https://mi-sitio.example/api/desaparecidos.json');
  return await res.json();
}
export const fuente = { id: ID, obtenerCrudos, normalizar: (c) => normalizarCrudo(c, ID, MAPA) };
export default fuente;
```

### Reglas para adaptadores

- Consume lo que la fuente **publica** o lo que tú operas. Respeta `robots.txt`,
  los límites de tasa y los términos de servicio. No incluyas scraping encubierto
  de plataformas que lo prohíben.
- No traigas al feed datos sensibles que no hagan falta (la capa redacta, pero
  no los pidas de más).

## 3. Mejorar el núcleo

El núcleo está en `src/` y no tiene dependencias. Antes de un PR:

```bash
node --test                  # las 50 pruebas deben pasar
node scripts/validar-personas.js
```

Agrega pruebas para lo que cambies. **Cualquier cambio debe respetar los
principios de [SEGURIDAD.md](SEGURIDAD.md)** (verificación humana, sin
reconocimiento facial, redacción, fusión solo por cédula). Un PR que los rompa
no se mergea aunque sea ingenioso.

## Estilo

- JavaScript ESM, sin dependencias en el núcleo.
- Comentarios y nombres en español, como el resto del código.
- Funciones pequeñas y con tipos vía JSDoc.
