# CLAUDE.md · Citaly (citalyapp.com)

*Contexto para Claude Code. Actualizado 27 nov 2026. Si este archivo choca con el código, manda el código (y se corrige este archivo).*

## 1. Qué es Citaly
- Plataforma de citas para muchos negocios, enfocada en negocios de carros (detailing, lavacar, pulido, polarizado, talleres, refrigeración) y abierta a otros (barbería, salón, uñas, spa, consultorio, otro).
- Cada negocio **se registra solo** en `citalyapp.com/app/?nuevo=1` y recibe: app de agenda, clientes, gastos y números; página web propia (`citalyapp.com/<slug>`) y página de reservas (`citalyapp.com/<slug>/reservar`).
- Dueño: Esteban Bolaños. Repo público `est3banbg-ux/Citaly`, GitHub Pages. Meta: que cada negocio se configure y edite solo, sin depender de Esteban.
- GlassStudioCR (el negocio real de Esteban) **no se toca**. En Citaly hay una copia demo (`/glassstudiocr`, fotos en `demo/glassstudiocr/`).

## 2. Precios vigentes (los únicos válidos)
| Plan | Mes | Notas |
|---|---|---|
| Prueba gratis | ₡0 | 7 días, sin tarjeta (`trialDays: 7`) |
| 🚗 Arranque | ₡4.900 (US$9) | Promo **₡500/mes los primeros 3 meses, SOLO en Arranque** (US$1) |
| ⚡ Turbo | ₡9.900 (US$19) | Sin promo |
| 🚀 Nitro | ₡19.900 (US$35) | Sin promo |

- Cobro con tarjeta por **Polar** (`payLink` de cada plan en `cfg.js`) o **SINPE 6320-4942** (Esteban Bolaños García). Sin contrato; se sube o baja de plan cuando quiera.
- Extra en `cfg.js`: `addons.waauto` (recordatorios automáticos por WhatsApp, ₡2.900) y `addons.ia` (bot con IA, `soon: true`, **en pausa**).
- ⚠️ **El modelo viejo NO EXISTE**: ₡150.000–₡250.000 de instalación + ₡30.000/mes, el nombre "Citali", el script en Python y el 50 % de adelanto. Nunca usarlo en textos, cálculos ni mensajes (la descripción del proyecto en claude.ai todavía lo trae: ignorarla en eso).
- ⚠️ Restos del modelo viejo en el código: `cfg.js` → `setup`, `promoCupos`, `modFrom`, `price: 0`, `payLink`/`payLinkUsd` vacíos (comentario de TiloPay). No se usan para cobrar; no tomarlos como precios.
- ⚠️ `README.md` está desactualizado: dice "₡9.900/mes después de la promo". Lo correcto es lo de la tabla.

### Qué trae cada plan (de `cfg.js` y `app/index.html`)
| | Prueba | Arranque | Turbo | Nitro |
|---|---|---|---|---|
| Funciones | todo (tier = nitro) | básicas | `web, dom, ref, gastos` | + `insumos, dominio, waauto, prioridad` |
| Equipo (`staff`) | — | 1 | 5 | 99 |
| Servicios (`svcMax`) | — | 10 | 40 | 200 |
| Fotos / reseñas / preguntas (`LIMS`) | 12 | 3 | 8 | 12 |
| Videos en la web (`LIMS.vid`) | **6** | 6 | 12 | 24 |
| Estilos de página (`EST_MIN`) | todos | Clásico | + `glass`, `fresco` | + `atrevido`, `elegante` |
| Asistente IA por día | 10 | 0 | 5 | 30 |

En la app, `tier()` devuelve `nitro` durante la prueba; `lim("vid")` devuelve 6 en prueba. El admin repite la regla de videos (`[6,12,24]`).

## 3. Mapa del repo
| Carpeta / archivo | Para qué |
|---|---|
| `index.html` | Página de venta de citalyapp.com (planes, calculadora, registro) |
| `app/` | App del dueño (PWA). `index.html` (~2.100 líneas: vistas agenda, clientes, números, ajustes), `apariencia.js`/`temas.js` (Mi apariencia), `frases.js` (frase del día), `novedades.js` (a mano) y `novedades-auto.js` (generado), `sw.js` (red primero, caché solo sin red), `manifest.json` |
| `r/` | Página de reservas y "Mi cita" (`/r/?n=<slug>`, `&go=1` salta directo al formulario, `&cita=<tk>` abre Mi cita, `&ref=` referido) |
| `w/` | Página web del negocio (`/w/?n=<slug>`). Plantilla **Pro** por defecto; `web.layout === "clasica"` usa la Clásica; `web.estilo` = tema |
| `404.html` | Enrutador: `/<slug>` → `/w/?n=<slug>`; `/<slug>/reservar` o `/<slug>/r` → `/r/?n=<slug>`. Slug válido: `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$` |
| `/<slug>/` (carpetas en la raíz) | **Generadas** por `seo.yml`: `index.html` (copia de `w/` con slug fijo, título, OG, JSON-LD y contenido en el HTML), `reservar.html` (puente con vista previa → `/r/?n=<slug>`), `og.jpg` (1200×630). No editarlas a mano |
| `admin/` | Panel de Esteban: `index.html` (negocios, quién entra, web, fotos, cobros) y `extra.js` (cobros, métricas, prospectos, reporte, notas, etiquetas, mensajes) |
| `para/` | Páginas de venta por rubro: `/para/` (hub), `detailing`, `lavacar`, `pulido`, `polarizado`, `taller`. Generadas con `tools/gen-para.mjs` (a mano) |
| `descargar/`, `android/`, `.well-known/assetlinks.json` | Descarga de la app (APK Android + guía iPhone) y verificación TWA |
| `webhook/` | Cloudflare Worker `bitter-brook-9ee2` (`worker.js`, `worker.min.js`, `LEEME.md`). **Lo publica Esteban a mano** |
| `tools/` | Generadores y pruebas (ver abajo). `seo-slugs.json`, `seo-lastmod.json`, `seo-noindex.json`, `og-hash.json`, `para-lastmod.json` |
| `cfg.js` | Config compartida (`CITALY`): Firebase, planes, addons, `mods`, tipos de negocio, plantillas, portadas, íconos, `fz`, paletas |
| `firestore.rules` | Reglas de Firestore. **Se pegan a mano en Firebase** (las publica Esteban) |
| `docs/` | `OPERACION.md` (uptime, respaldos, Blaze), `GOOGLE-BUSINESS.md` (enlace de citas en GBP) |
| `demo/`, `img/` | Demo GlassStudioCR; capturas, `img/ic/` (íconos de servicio en PNG), `img/planes/`, `og-citaly.png` |

### `cfg.js` en corto
- `plans` (arriba), `monthly {promo:500, promoMonths:3, std:4900}`, `promoPlan: "arranque"`, `usd`, `addons`.
- `mods`: módulos que se encienden por negocio desde el admin: `vehiculo` (precio según vehículo) e `insumos` (en Nitro viene encendido). Para uno nuevo: registrarlo aquí y revisar `modOn(B, "clave")` en la app/página.
- `types`: `barberia, salon, unas, lavacar, detailing, pulido, polarizado, autos, taller, refri, spa, salud, otro` (con `car: true` en los de carros). Servicio = `[nombre, precio, minutos, ícono, 1 si cambia por vehículo]`.
- `tpl`: frase, descripción, preguntas y "cada cuánto vuelve" por tipo. `covers`: portadas Unsplash por tipo; **`refri` no tiene** y cae en `otro` (foto genérica: es la prioridad 1).
- Íconos: `icons` (SVG `i:`), `imgIcons`/`iconNames` (PNG `img:`), `iconGroups`, `iconTypeGroups`, `iconKw`, `pickHtml`. Íconos predeterminados por tipo de negocio, **no emojis**.
- `CITALY.fz(q, texto)`: búsqueda con sinónimos y errores de tipeo. Todo buscador nuevo la usa.
- `iaUrl` y `pushUrl` apuntan al Worker. `wa: "50661506610"` = WhatsApp de Citaly (soporte).

### Firestore (proyecto `citaly-cb101`, de `firestore.rules`)
| Colección | Qué guarda | Quién |
|---|---|---|
| `pub/{slug}` | Perfil público del negocio (nombre, servicios, web, logo, `biz` = id del negocio) | lee todo el mundo; crea el dueño al registrarse; edita dueño/equipo; borra admin |
| `pub/{slug}/fotos/{fid}` | Fotos de la web (dentro de Firestore, ≤600 KB) | lee todo el mundo; escribe dueño/admin |
| `biz/{bid}` | Datos privados del negocio (`bid` = uid del dueño en registro propio). `mods` al crearse solo puede traer `vehiculo` | dueño, equipo, admin |
| `biz/{bid}/jobs` | Citas. El cliente crea (`web: true`, `st: "Por confirmar"`) si `subOk`; puede mover/cancelar con su `tk` hasta 12 h antes | dueño + cliente con link |
| `biz/{bid}/slots` | Bloques ocupados de 30 min sin datos personales (`dia_HHMM`, `_k` = cupo extra según `lanes`) | lee todo el mundo |
| `biz/{bid}/holds/{tel}` | Freno para que un número no aparte muchas citas | |
| `biz/{bid}/mine/{tk}` | Resumen "Mi cita" (link secreto, tk ≥ 20) | |
| `biz/{bid}/push`, `exp` | Tokens de avisos al celular; gastos | dueño |
| `own/{correo}` | Quién entra a qué negocio `{biz, rol: "dueño"/"equipo"}`. El dueño agrega/quita su equipo | |
| `subs/{bid}` | Mensualidad: `plan` (`trial`/`mensual`), `tier`, `status` (`trial`/`active`/`suspended`), `until`, `months`, `leftPromo`, `demo`, `price` | lectura pública de uno; escribe admin; el registro crea la prueba |
| `payments`, `adm`, `leads` | Pagos, notas/etiquetas internas, prospectos | solo admin |
| `ia` | Conteo de usos del asistente por negocio y día | lo escribe el Worker (cuenta de servicio) |

- Admin = el correo de `CITALY.admin` / `isAdmin()` en las reglas, con correo verificado.
- Slugs reservados: lista `reservedSlug()` en las reglas = la de `app/index.html`. `tools/gen-seo.mjs` además reserva `tools`.
- Ojo: el comentario de las reglas y el README dicen "prueba de máximo 31 días", pero la regla real de `subs` limita `until` a **8 días** desde el registro.

### Worker `bitter-brook-9ee2` (`webhook/worker.js`)
Rutas: `POST /` webhook de Polar `order.paid` (activa el plan por id de referencia o correo; detecta Arranque/Turbo/Nitro por el nombre del producto; aplica la promo), `/ia` (asistente), `/importar` (admin: llenar negocio con mensajes del cliente), `/enlace` (links cortos de TikTok/FB), `/push` (FCM), `/ack`, `/ics/...`, `/baja/...` (baja de correos). `scheduled` = correos automáticos con Resend (demo, prepara tu web, fin de prueba, resumen semanal, máx. 40 por corrida). Variables en `webhook/LEEME.md`.

## 4. Infra
- GitHub Pages: **push a `main` = publicado en ~60 s**. Dominio citalyapp.com (DNS en Hostinger, `CNAME`).
- Firebase Auth + Firestore (`citaly-cb101`). Correos con Resend (citalyapp.com verificado).
- Workflows (`.github/workflows/`):
  - `seo.yml`: cada 3 h (min 17) y a mano. `node tools/gen-seo.mjs` + `python3 tools/gen-og.py` → carpetas `/<slug>/`, `sitemap.xml`. Lanzar a mano: `gh api -X POST repos/est3banbg-ux/Citaly/actions/workflows/seo.yml/dispatches -f ref=main`.
  - `novedades.yml`: en cada push a main, `tools/gen_novedades.py` arma `app/novedades-auto.js` con las líneas de commit `Novedad: emoji | Título | Texto`.
  - `apk.yml`: a mano; APK/AAB con Bubblewrap (TWA `com.citalyapp.app`), release `android-latest`.
  - `uptime.yml`: cada 30 min revisa web, app, `/r/`, `/w/`, `cfg.js` y Firestore.
- `gen-seo.mjs`: indexa si hay ≥3 servicios **y** al menos una señal (1 foto, logo propio, 30 palabras propias o zonas/dirección); lo que ya estaba en el sitemap no baja salvo cierre, suspensión o `seo-noindex.json` (hoy: `ortiz-detailing`, `mariachi-coyoche`, `refrigeracion-cruz`). Tiene frenos: no borra si llegan <50 % de negocios ni des-indexa >30 % de golpe. Para redibujar todas las `og.jpg` tras un cambio de diseño, subir `OGV`. Prueba local con `SEO_FIXTURE=archivo.json`. Un arreglo en `w/` llega a las copias en la siguiente corrida.
  - (El plan SEO de claude.ai pedía logo + 4 fotos + 80 palabras; el código usa los criterios de arriba.)

## 5. Cómo probar y publicar
1. Cambiar en una rama o localmente. Nada de commit/push a `main` sin visto bueno.
2. Correr las pruebas: `python3 tools/pruebas/correr.py` (todas) o `correr.py reservas` / `app` / `web`. Abren las páginas reales en Chrome sin ventana (Playwright) con Firebase falso (`comun/firebase-falso.js`); no tocan datos reales. `pendiente_*.py` = error conocido sin arreglar (no se corre).
3. Cada error arreglado deja un `prueba_*.py` que lo habría detectado.
4. Vista previa para Esteban (capturas en celular y compu) + **revisión de Opus**. Solo con el visto bueno de los dos se sube a `main`.
5. Después de publicar: si tocaste `w/`, lanzar `seo.yml` o esperar la corrida; si tocaste `cfg.js` con precios/planes, correr `node tools/gen-para.mjs`.
6. Commits con línea `Novedad: ...` si el cambio lo ve el dueño en la app.

## 6. Reglas que no se rompen
1. Una función que pide un cliente se hace **general y opcional para todos**, sin dañar a los negocios que ya funcionan.
2. Antes de publicar: vista previa + revisión de Opus; a `main` solo con visto bueno de ambos.
3. Correr `tools/pruebas` antes de publicar; una prueba por cada error arreglado.
4. Archivos temporales subidos al repo (logos, fotos para cargar desde el admin) se borran apenas se usan (commits "tmp:" / "Quitar ...").
5. Nunca tocar datos de clientes reales sin que Esteban lo pida.
6. Lo que solo Esteban puede hacer (pegar el Worker en Cloudflare, publicar reglas de Firebase, DNS en Hostinger, iniciar sesión) se le deja **abierto y listo para copiar y pegar**.
7. Buscadores entienden sinónimos y errores de tipeo (`CITALY.fz`).
8. Íconos de servicio predeterminados por tipo de negocio, no emojis.
9. Cambios de diseño visibles en páginas de clientes: primero una **imagen de propuesta** para que Esteban apruebe.
10. "Promos a tus clientes" y los correos de promo son internos: los clientes no los ven.
11. GlassStudioCR real no se toca; en Citaly solo la demo.
12. Fotos, portadas y material mantienen la paleta de la marca.
13. Nunca inventar precios ni garantías en páginas de negocios; lo que el negocio no llenó se esconde o usa los textos de `tpl`.
14. Repo público: nada de datos de clientes, respaldos ni secretos en el repo.

## 7. Clientes (27 nov)
- **Car keyss Detailing**: primer cliente, prueba hasta el **30 nov** → convertir a plan pago.
- **Carwash Isabi (Luis)**, a domicilio (`carwash-isabi-a-domicilio`): de su pedido salieron "Mis clientes / clientes fijos"; pidió horario que rota por semana. Reportó que su link de reserva dice "No encontramos este negocio" (sale cuando no existe `pub/<slug>` del slug del link).
- **Refrigeración Cruz** (prueba hasta ~1 dic, en noindex), **MJ Auto Detailing** (Jose, esperando precios por tamaño), **Ema's Garage Detailing** (revisar cupos por hora), **FJ Motors**, **Kenny's Detailing**, **Os_carwash** (`os-carwash`).
- ~20 pruebas más (ver carpetas `/<slug>/` y `tools/seo-slugs.json`). Objetivo de alianza: **Ortiz Detailer** (`ortiz-detailing` es demo con textos de GlassStudioCR, en noindex).

## 8. Prioridades y pendientes
Orden dado por Esteban el 27 nov:
0. **Soporte a clientes**: lo que mande Esteban va primero.
1. Logo y portada automáticos por rubro para quien se registra sin logo ni fotos (hoy `refri` y otros caen en portada genérica).
2. Rediseño de la página del negocio (portada, tipografía, fotos, secciones): 2–3 propuestas en imagen antes de tocar código.
3. Página de venta de citalyapp.com.
4. Material de marca: portadas para redes, tarjetas para compartir, íconos.

Después: horario que rota por semana (Carwash Isabi), editor de página por plan tipo Shopify (Arranque básico → Turbo → Nitro; se guardan datos, no código), diseñador con IA, subir videos (cuidar costo de almacenamiento).

Pendientes técnicos:
- `auth.citalyapp.com`: CNAME ya en Hostinger, falta verificar en Firebase (login Google/Facebook en celular).
- Link "Mi cita" no refleja cambios de servicios o total hechos por el dueño (requiere cambiar reglas de `mine`, las publica Esteban).
- `gen-seo.mjs` baja toda la colección `pub` en cada corrida (con logos/portadas en data URI): pedir solo los campos necesarios cuando crezcan los negocios.
- Clientes del negocio a su propia colección para que el equipo no se pise (hoy el último que guarda gana). Requiere reglas nuevas.
- Placa y carro dentro de cada cita; buscador general que encuentre por placa.
- Bot de WhatsApp con IA: **en pausa** (medir costo de Meta por mensaje antes). App nativa con Capacitor: en pausa, retomar ~**2 dic**.
- Fotos en Firestore: pasar a Storage cerca de ~100 negocios; respaldos diarios requieren plan Blaze (`docs/OPERACION.md`).

**En progreso, sin publicar (no es tuyo si no te lo asignaron):** pestaña "Enlaces" en el admin (`admin/index.html`, `admin/extra.js`, cambios sin commit): lista todos los links de reserva `/r/?n=<slug>&go=1` con copiar/abrir y avisa si falta `pub/<slug>` (caso Carwash Isabi). No tocar esos cambios sin que lo pidan.

## 9. Últimos cambios (git log, 24–27 nov)
- **27 nov**: vista previa del link de cada negocio (WhatsApp, Facebook, TikTok) con `og.jpg` por negocio; arreglo del texto que se montaba sobre el link con nombres de dos renglones.
- **26 nov**: revisión a fondo de app, reservas y web (15 arreglos, 2 graves de citas encimadas) con pruebas; banco de pruebas con Chrome + Firebase falso; arreglo de Servicios y precios (solo el primero se podía editar); **horas exactas** en reservas (con horas exactas manda la hora que eligió el dueño, aunque el servicio termine después del cierre); temporales de FJ Motors subidos y borrados.
- **25 nov**: páginas `/para/` (detailing, lavacar, pulido, polarizado, taller) y hub; SEO con contenido en el HTML, criterios de indexación, frenos, lastmod, pie "Hecho con Citaly" (`?desde=`); noindex a mariachi-coyoche, refrigeracion-cruz y ortiz-detailing; Clientes: agregar propios, clientes fijos (semana, 15, 22 días, mes, año), placa, carro, dónde vive, varios servicios, "¿cada cuánto vuelve?"; subir contactos `.vcf`; APK primero en Android.
- **24 nov**: APK Android (TWA) y página `/descargar`; Novedades automáticas desde commits; Mi apariencia (18 temas, fondos, foto propia); agenda (día libre, frase del día); inicio móvil; tipo Refrigeración y aire + "Por cotizar" con total 0; respuestas rápidas; límites por plan en la página pública, plan recomendado al terminar la prueba, cupos en Turbo, Turbo hasta 40 servicios; reglas de `slots` con menos lecturas; temporales de Kenny's subidos y borrados.

## 10. Cómo hablarle a Esteban
- Español de Costa Rica, corto y claro. Lee desde el celular.
- **Primero el resultado**, después lo que falta.
- Mensajes para clientes: listos para copiar a WhatsApp, tono tico y amable.
- Pasos manuales solo cuando no hay otra forma, abiertos y listos para copiar y pegar (con el enlace exacto de dónde pegarlos).
- Al terminar: qué se hizo, cómo se probó, qué quedó pendiente y el mensaje para el cliente si aplica.
