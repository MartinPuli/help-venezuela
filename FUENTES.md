# Catálogo de fuentes

> Generado por un barrido de investigación (búsqueda + verificación en vivo).
> Regenerar: `node scripts/build-fuentes-md.js`. **No editar a mano.**

65 fuentes verificadas y deduplicadas. Por tipo: web=7, agregador=8, ong=7, oficial=13, cruz_roja=5, medio=16, app=1, red_social=3, mensajeria=1, otro=1, hospital=2, foro=1. Con API/feed automatizable: 8. Sospechosas de scam: 2.

## Prioridad de integración

Las que más conviene conectar primero (mayor cobertura + mejor acceso técnico):

1. https://www.desaparecidosvenezuela.com/
2. https://terremotovenezuela.app/
3. https://sosvenezuela2026.com/
4. https://encuentralos.tecnosoft.dev/
5. https://google.org/personfinder/global/home.html
6. https://github.com/google/personfinder
7. https://ee.kobotoolbox.org/x/eaEmQ9YW
8. https://www.reddit.com/r/vzla/
9. https://desaparecidosterremotovenezuela.com/
10. https://venezuelatebusca.com/
11. https://terremotove.netlify.app/
12. https://venezuelareporta.org/

## ⚠️ Advertencias

- ALERTA scam / desinformacion - dominios falsos y campanas fraudulentas (entrada de control de calidad, NO fuente) (https://factchequeado.com/teexplicamos/20260625/terremotos-venezuela-danos-zonas-afectadas/): senal de posible scam — verificar antes de ingerir.
- Patrón de SCAM: cuentas de WhatsApp secuestradas, grupos falsos de donaciones y 'desaparecidos' (regla anti-scam, no fuente) (https://efectococuyo.com/cocuyo-chequea/tacticas-estafas-digitales-mas-comunes/): senal de posible scam — verificar antes de ingerir.

> Estas NO son fuentes para ingerir: son patrones de estafa/desinformación a tener
> en cuenta. En un desastre proliferan dominios falsos y grupos fraudulentos.

## 🟢 Fuentes con API/feed (automatizables ya)

Estas exponen datos estructurados ingeribles por un adaptador:

| Fuente | Feed | Notas |
|---|---|---|
| [Desaparecidos Venezuela (desaparecidosvenezuela.com)](https://www.desaparecidosvenezuela.com/) | `https://www.desaparecidosvenezuela.com/api/personas` | VERIFICADA EN VIVO Y CON CURL. /api/personas -> HTTP 200, Content-Type application/json, ~8358 bytes; array de objetos {id, nombre, edad, zo… |
| [Mapa de Emergencia y Rescate - Terremoto en Venezuela (terremotovenezuela.app)](https://terremotovenezuela.app/) | `https://terremotovenezuela.app/api/reports` | VERIFICADA EN VIVO. CORRECCION IMPORTANTE DE ACCESO: la candidata afirmaba 'sin feed publico' (probo /api/markers -> 404). FALSO: SI existe … |
| [SOS Venezuela 2026 (sosvenezuela2026.com)](https://sosvenezuela2026.com/) | `https://sosvenezuela2026.com/api/reports` | VERIFICADA EN VIVO. CORRECCION IMPORTANTE DE ACCESO: la candidata afirmaba '/api/reportes -> 404, sin feed'. Parcialmente cierto pero el end… |
| [Encuentralos (encuentralos.tecnosoft.dev)](https://encuentralos.tecnosoft.dev/) | `https://encuentralos.tecnosoft.dev/api/personas` | VERIFICADA EN VIVO Y CON CURL. CORRECCION DE ACCESO: la candidata decia 'no halle API publica documentada'. SI existe feed JSON real en /api… |
| [Google Person Finder](https://google.org/personfinder/global/home.html) | `PFIF Atom feeds por repositorio (formato /personfinder/<repo>/feeds/person y /note) SOLO si Google levanta una instancia para el evento` | CONFIRMADO PARCIAL. La página home.html resuelve y carga; menciona el modelo PFIF y dirige a GitHub para integración. PERO no muestra ningún… |
| [Google Person Finder - estandar PFIF (People Finder Interchange Format)](https://github.com/google/personfinder) | `PFIF / Atom feeds (pfif:person, pfif:note); Data API (PFIF import/export). Servicio en vivo: https://google.org/personfinder` | VERIFICADO. La URL github.com/google/personfinder es correcta y existe (HTTP 200). IMPORTANTE: el repo esta ARCHIVADO y en SOLO LECTURA desd… |
| [TerremotoVE (formulario y feed KoBoToolbox)](https://ee.kobotoolbox.org/x/eaEmQ9YW) | `https://kf.kobotoolbox.org/api/v2/assets/a8XWDsdUcpBzXGtgQmiiro/data/` | VERIFICADO Y CORREGIDO. El endpoint /api/v2/assets/a8XWDsdUcpBzXGtgQmiiro/data/ responde 200 OK SIN autenticacion y devuelve JSON paginado (… |
| [r/vzla y r/Venezuela (subreddits de la diaspora venezolana)](https://www.reddit.com/r/vzla/) | `https://www.reddit.com/r/vzla/new.json` | VERIFICACION 2026-06-26: La INFRAESTRUCTURA es real y aplica (subreddits venezolanos conocidos + API .json estandar de Reddit), por eso se c… |

## Todas las fuentes (65)

### web (7)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Desaparecidos Terremoto Venezuela](https://desaparecidosterremotovenezuela.com/) | web | 🟡 HTML | — | 🤝 Comunitario |
| [Desaparecidos Venezuela (desaparecidosvenezuela.com)](https://www.desaparecidosvenezuela.com/) | web | 🟢 API/JSON | `https://www.desaparecidosvenezuela.com/api/personas` | 🤝 Comunitario |
| [Mapa de Emergencia y Rescate - Terremoto en Venezuela (terremotovenezuela.app)](https://terremotovenezuela.app/) | web | 🟢 API/JSON | `https://terremotovenezuela.app/api/reports` | 🤝 Comunitario |
| [Venezuela Te Busca (venezuelatebusca.com)](https://venezuelatebusca.com/) | web | 🟡 HTML | — | 📰 Verif. medio |
| [Encuentralos (encuentralos.tecnosoft.dev)](https://encuentralos.tecnosoft.dev/) | web | 🟢 API/JSON | `https://encuentralos.tecnosoft.dev/api/personas` | 🤝 Comunitario |
| [Terremotovenezuela.com (mapa de edificios/daños — contexto de localización)](https://terremotovenezuela.com/) | web | 🟡 Formulario | — | 🤝 Comunitario |
| [Venezuela Rescue Map (ayudavene.site)](https://ayudavene.site/) | web | 🟡 HTML | — | 🤝 Comunitario |

### agregador (8)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [SOS Venezuela 2026 (sosvenezuela2026.com)](https://sosvenezuela2026.com/) | agregador | 🟢 API/JSON | `https://sosvenezuela2026.com/api/reports` | 🤝 Comunitario |
| [Venezuela Reporta](https://venezuelareporta.org/) | agregador | 🟡 HTML | — | 🤝 Comunitario |
| [Recursos Venezuela (directorio agregador) - recursos-venezuela.netlify.app](https://recursos-venezuela.netlify.app/) | agregador | 🟡 HTML | — | 📰 Verif. medio |
| [Google Person Finder](https://google.org/personfinder/global/home.html) | agregador | 🟢 PFIF | `PFIF Atom feeds por repositorio (formato /personfinder/<repo>/feeds/person y /note) SOLO si Google levanta una instancia para el evento` | 🏛️ Oficial |
| [Google Person Finder - estandar PFIF (People Finder Interchange Format)](https://github.com/google/personfinder) | agregador | 🟢 PFIF | `PFIF / Atom feeds (pfif:person, pfif:note); Data API (PFIF import/export). Servicio en vivo: https://google.org/personfinder` | 🏛️ Oficial |
| [emergenciavenezuela.com — agregador ciudadano con cuentas oficiales (X) y números de emergencia](https://emergenciavenezuela.com/) | agregador | 🟡 HTML | `HTML público; secciones https://emergenciavenezuela.com/desaparecidos y /desaparecidos/reportar scrapeables. Sin API/feed PFIF conocido. Operador independiente (contacto Telegram @miguelsantafe, email ms@ms.studio).` | 🤝 Comunitario |
| [Centros de Acopio Venezuela (centrosayudavenezuela.org) — agregador voluntario](https://centrosayudavenezuela.org/) | agregador | 🟡 HTML | — | 🤝 Comunitario |
| [TerremotoVE (formulario y feed KoBoToolbox)](https://ee.kobotoolbox.org/x/eaEmQ9YW) | agregador | 🟢 API/JSON | `https://kf.kobotoolbox.org/api/v2/assets/a8XWDsdUcpBzXGtgQmiiro/data/` | 🤝 Comunitario |

### app (1)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Talk360 (app de llamadas usada por la diáspora)](https://play.google.com/store/apps/details?id=com.ringcredible) | app | 🔴 Manual | — | 📰 Verif. medio |

### oficial (13)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [VenApp (canal oficial del Estado)](https://venapp.com/) | oficial | 🟡 Formulario | — | 🏛️ Oficial |
| [Protección Civil y Administración de Desastres (PCAD) - sitio oficial](https://www.pcivil.gob.ve/) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Protección Civil Venezuela (X / Twitter)](https://x.com/PCivil_Ve) | oficial | 🔴 Manual | — | 🏛️ Oficial |
| [FUNVISIS - Fundación Venezolana de Investigaciones Sismológicas (Monitor de Sismos)](http://www.funvisis.gob.ve/monitor.html) | oficial | 🟡 HTML | `http://www.funvisis.gob.ve/old/sis_mes.php (listado mensual HTML; también http://www.funvisis.gob.ve/recientes.php para sismos recientes)` | 🏛️ Oficial |
| [Sistema de emergencias de Venezuela: VEN 9-1-1 (número oficial actual) / 171 (legado)](tel:911) | oficial | 🔴 Manual | `https://ven911.gob.ve/` | 🏛️ Oficial |
| [VTV - Venezolana de Television (canal estatal)](https://www.vtv.gob.ve/) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Alcaldia de Caracas (Municipio Libertador) - sitio oficial](https://www.caracas.gob.ve/) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Ministerio de Educacion (MPPE) - escuelas como centros de acopio y refugios](https://www.me.gob.ve/) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Cruz Roja Venezolana - sitio oficial (cruzroja.ve)](https://cruzroja.ve/) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Cruz Roja Espanola - Ayuda Terremoto Venezuela 2026 (DONACIONES, no datos)](https://www2.cruzroja.es/-/ayuda-terremoto-venezuela-2026) | oficial | 🟡 HTML | — | 🏛️ Oficial |
| [Canal de Telegram de Delcy Rodriguez (@delcyrodriguezv) - Vicepresidenta Ejecutiva](https://t.me/s/delcyrodriguezv) | oficial | 🟡 HTML | `https://t.me/s/delcyrodriguezv (vista web publica del canal, scrapeable como HTML, sin login)` | 🏛️ Oficial |
| [Línea WhatsApp de emergencia Cancillería de Ecuador (búsqueda de connacionales)](https://wa.me/593984241667) | oficial | 🟡 Formulario | `Sin API; intake humano por WhatsApp +593 984241667 (y líneas +57 3138414045 / +57 3233195354 del consulado de Ecuador en Bogotá, que asumió funciones consulares regionales).` | 🏛️ Oficial |
| [VenApp (app estatal reconvertida a reporte de desaparecidos) — canal de difusión por Telegram/redes del gobierno](https://www.rtvcnoticias.com/actualidad/venapp-la-app-para-reportar-desaparecidos-tras-el-doble-terremoto-en-venezuela) | oficial | 🟡 Formulario | `App móvil propietaria conectada al 'Comando Conjunto' de emergencia; sin API pública conocida. Difusión por canales oficiales (Telegram/X de Prensa Presidencial, teleSUR).` | 🏛️ Oficial |

### cruz_roja (5)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [ICRC Restoring Family Links (familylinks.icrc.org)](https://familylinks.icrc.org/) | cruz_roja | 🟡 Formulario | — | 🏛️ Oficial |
| [Trace the Face (CICR / Cruz Roja) + Restablecimiento del Contacto entre Familiares (RFL) Cruz Roja Venezolana](https://tracetheface.familylinks.icrc.org/) | cruz_roja | 🟡 HTML | `https://familylinks.icrc.org/online-tracing` | 🏛️ Oficial |
| [Cruz Roja Venezolana - Linea RCF/RFL telefonica (Restablecimiento del Contacto entre Familiares)](tel:+584227994880) | cruz_roja | ⚪ ? | — | 🏛️ Oficial |
| [IFRC - Federacion Internacional de la Cruz Roja (respuesta Venezuela 2026 + RFL multipais)](https://www.ifrc.org/press-release/venezuela-red-cross-responds-needs-emerge-aftermath-powerful-back-back-earthquakes) | cruz_roja | 🔴 Manual | — | 🏛️ Oficial |
| [Cruz Roja Colombiana - Seccional Valle del Cauca: lineas RCF/RFL para familiares de venezolanos](https://www.cruzrojacolombiana.org/) | cruz_roja | 🟡 Formulario | `Canales del evento (Valle del Cauca): linea 132; WhatsApp +57 310 279 5325; email rcf.valle@cruzrojacolombiana.org` | 📰 Verif. medio |

### ong (7)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Venezuela Resiste / terremotove.netlify.app (Acceso Libre)](https://terremotove.netlify.app/) | ong | 🟡 HTML | — | 📰 Verif. medio |
| [Observatorio Venezolano de Fake News (fakenewsvenezuela.org) - control de scams/desinformacion](https://fakenewsvenezuela.org/) | ong | 🟡 HTML | — | 📰 Verif. medio |
| [Caritas Venezuela (Conferencia Episcopal Venezolana / Caritas Internationalis)](https://caritasvenezuela.org/) | ong | 🔴 Manual | — | 🏛️ Oficial |
| [Conferencia Episcopal Venezolana (CEV) — red de Caritas parroquiales y centros de acopio](https://conferenciaepiscopalvenezolana.com/) | ong | 🔴 Manual | `http://conferenciaepiscopalvenezolana.com/noticias/` | 🏛️ Oficial |
| [IRC — International Rescue Committee (respuesta de emergencia Venezuela 2026)](https://www.rescue.org/press-release/venezuela-irc-launches-emergency-response-twin-earthquakes) | ong | 🔴 Manual | — | 🏛️ Oficial |
| [Diaspora venezolana en Argentina: Centro Venezolano Argentino + Asociacion de Venezolanos en el AMBA (hubs de busqueda de familiares)](https://www.lanacion.com.ar/sociedad/terremoto-en-venezuela-la-angustia-de-los-venezolanos-radicados-en-la-argentina-que-intentan-nid25062026/) | ong | 🔴 Manual | `https://desaparecidosterremotovenezuela.com/` | 📰 Verif. medio |
| [Venezuelan American Caucus (diaspora Sur de Florida)](https://venezuelanamericancaucus.com/) | ong | 🔴 Manual | — | 📰 Verif. medio |

### medio (16)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [ALERTA scam / desinformacion - dominios falsos y campanas fraudulentas (entrada de control de calidad, NO fuente)](https://factchequeado.com/teexplicamos/20260625/terremotos-venezuela-danos-zonas-afectadas/) | medio | 🟡 HTML | — | ⚠️ SCAM? |
| [Ciudad CCS (ciudadccs.info) - medio oficial de la Alcaldia de Caracas](https://www.ciudadccs.info/) | medio | 🟡 HTML | — | 🏛️ Oficial |
| [Estrella Digital — 'Las plataformas ciudadanas que buscan a miles de desaparecidos'](https://www.estrelladigital.es/articulo/mundo/desaparecidos-terremoto-venezuela-plataformas-ciudadanas/20260625123121447982.html) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Pitazo — Casos de desaparecidos y plataformas de búsqueda (terremoto Venezuela)](https://elpitazo.net/regiones/gran-caracas/terremotos-en-venezuela-conozca-los-casos-de-desaparecidos-y-las-plataformas-de-busqueda/) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Estímulo — 'Conoce las plataformas para localizar desaparecidos y consultar edificios afectados'](https://elestimulo.com/terremoto-en-venezuela/2026-06-25/conoce-las-plataformas-para-localizar-desaparecidos-y-consultar-sobre-edificios-afectados/) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Colombiano — 'Más de 40.000 reportados desaparecidos en plataforma ciudadana' (desaparecidosterremotovenezuela.com)](https://www.elcolombiano.com/internacional/busqueda-personas-desparecidas-terremoto-venezuela-contacto-PC38188315) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Tiempo (Colombia) — 'Lanzan plataforma para reportar y localizar desaparecidos: así puede acceder'](https://www.eltiempo.com/mundo/venezuela/lanzan-plataforma-para-reportar-y-localizar-personas-desaparecidas-tras-los-terremotos-en-venezuela-asi-puede-acceder-3566961) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [CNN en Español — 'Los terremotos impulsan una ola de plataformas digitales para buscar desaparecidos'](https://cnnespanol.cnn.com/2026/06/25/venezuela/terremoto-plataformas-buscar-desaparecidos-orix) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [Telemundo — Live blog terremotos Venezuela (cifras de muertos/heridos/desaparecidos)](https://www.telemundo.com/noticias/noticias-telemundo/desastres-naturales/live-blog/dos-terremotos-magnitud-superior-7-sacuden-venezuela-segundos-rcna351682) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Comercio (Perú) — Terremoto en Venezuela EN VIVO (tracker de cifras)](https://elcomercio.pe/mundo/venezuela/terremoto-en-venezuela-en-vivo-ultimas-noticias-muertos-heridos-desaparecidos-danos-y-escenas-de-panico-en-caracas-usgs-temblor-valencia-montalban-noticia/) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [NBC News — Live blog Venezuela earthquakes](https://www.nbcnews.com/world/venezuela/live-blog/live-updates-venezuela-earthquakes-rescue-aid-trump-delcy-caracas-rcna351701) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [CBC — Live story: Venezuela earthquakes (deaths, survivors, recovery)](https://www.cbc.ca/news/world/livestory/venezuela-earthquakes-deaths-survivors-recovery-aftermath-search-9.7248333) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [El Español — Live blog terremoto Venezuela (desaparecidos españoles y cifras consulares)](https://www.elespanol.com/mundo/america/20260625/ultima-hora-terremotos-venezuela-informa-muertos-heridos/1003744299146_10.html) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [Listado consolidado de hospitales y clínicas habilitados (TalCual)](https://talcualdigital.com/estos-son-los-hospitales-y-clinicas-que-estan-atendiendo-a-afectados-por-terremotos/) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [Cronica.uno - cobertura de hospitales y listas de heridos (medio de verificacion)](https://cronica.uno/familias-recorren-hospitales-caracas-lesionados-desaparecidos-terremotos/) | medio | 🟡 HTML | — | 📰 Verif. medio |
| [Caracas Chronicles - 'Key Information About Venezuela's State of Emergency' (medio diaspora EN/ES)](https://www.caracaschronicles.com/2026/06/25/key-information-about-venezuelas-state-of-emergency/) | medio | 🟡 HTML | `https://www.caracaschronicles.com/feed/` | 📰 Verif. medio |

### red_social (3)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Alianza Por Venezuela (@alianzaxvenezuela) - Instagram](https://www.instagram.com/alianzaxvenezuela/) | red_social | 🔴 Manual | — | 📰 Verif. medio |
| [Meta / Facebook Crisis Response - Terremoto Venezuela 2026 (Safety Check)](https://www.facebook.com/crisisresponse/) | red_social | 🔴 Manual | — | 🏛️ Oficial |
| [TikTok - cobertura terremoto Venezuela (cuentas de noticias/alertas)](https://www.tiktok.com/tag/terremotovenezuela) | red_social | 🔴 Manual | — | 📰 Verif. medio |

### mensajeria (1)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Patrón de SCAM: cuentas de WhatsApp secuestradas, grupos falsos de donaciones y 'desaparecidos' (regla anti-scam, no fuente)](https://efectococuyo.com/cocuyo-chequea/tacticas-estafas-digitales-mas-comunes/) | mensajeria | 🔴 Manual | `N/A — señal NEGATIVA para el filtro de ingesta, no una fuente a ingerir.` | ⚠️ SCAM? |

### hospital (2)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [Hospital Domingo Luciani (El Llanito) - listas de heridos y menores no acompanados](https://www.eluniversal.com.mx/mundo/ninos-llegan-solos-a-hospitales-tras-terremotos-en-venezuela-familias-buscan-a-desaparecidos-en-listas-de-heridos/) | hospital | 🔴 Manual | — | 📰 Verif. medio |
| [Hospitales de campana de La Guaira (respuesta de emergencia, incl. apoyo Brasil)](https://www.elnacional.com/2026/06/brasil-anuncia-el-envio-de-un-hospital-de-campana-a-venezuela-tras-terremotos/) | hospital | 🔴 Manual | — | 📰 Verif. medio |

### foro (1)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [r/vzla y r/Venezuela (subreddits de la diaspora venezolana)](https://www.reddit.com/r/vzla/) | foro | 🟢 API/JSON | `https://www.reddit.com/r/vzla/new.json` | 🤝 Comunitario |

### otro (1)

| Fuente | Tipo | Acceso | Feed/API | Confianza |
|---|---|---|---|---|
| [UCAB — Universidad Catolica Andres Bello (Voluntariado UCAB / Extension Social)](https://extensionsocial.ucab.edu.ve/) | otro | 🔴 Manual | — | 🏛️ Oficial |

---

**Leyenda de acceso:** 🟢 automatizable (API/PFIF) · 🟡 semi (HTML/formulario) · 🔴 manual · ⚪ desconocido
**Confianza:** 🏛️ oficial · 📰 medio verificado · 🤝 comunitario · ⚠️ posible scam

Los adaptadores de las fuentes con feed están en `fuentes/` (opt-in con
`HABILITAR_FUENTES_REALES=1`). Para sumar una fuente, ver [CONTRIBUIR.md](CONTRIBUIR.md).
