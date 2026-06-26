# Registro comunitario de personas

Aquí cualquiera puede **agregar a una persona desaparecida** abriendo un Pull Request.
Es la forma de sumar reportes sin saber programar.

## Cómo agregar a una persona

1. Copia `_plantilla.json` a un archivo nuevo, por ejemplo `personas/maria-rangel.json`.
2. Completa los datos que conozcas. **Solo `nombre` es obligatorio.**
3. Abre un Pull Request. Un voluntario revisa y, al aprobar (verificación humana),
   la persona entra al cruce automático con todas las demás fuentes.

Puedes poner **una persona** (un objeto JSON) o **varias** (un arreglo) por archivo.

## Qué NO poner en este repositorio público

Este repo es público. Para proteger a las personas (contexto de Venezuela):

- ❌ **Cédula completa** — desaconsejado. Omítela o comparte solo los últimos 3 dígitos.
  La búsqueda por cédula completa va por el canal privado de voluntarios.
- ❌ **Teléfonos / datos de contacto** — nunca en el archivo público.
- ❌ **Dirección exacta del domicilio** — usa zona/edificio general.
- ❌ **Datos de salud detallados** — van por el canal privado.

El sistema, además, **redacta** automáticamente el feed público. Pero la primera
línea de defensa eres tú: no subas lo que no debe ser público.

## Estados válidos

`desaparecido` · `visto_no_confirmado` · `localizado_a_salvo` · `fallecido_confirmado`

> El cambio a `localizado_a_salvo` o `fallecido_confirmado` lo confirma un
> **voluntario verificador**, no se hace automáticamente. Si no estás seguro,
> deja `desaparecido`.

## Validación

Cada PR corre una validación automática (`scripts/validar-personas.js`) que revisa
el formato y avisa de posibles duplicados con personas ya registradas.
