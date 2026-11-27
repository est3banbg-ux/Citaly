# Webhook de Polar (activa el plan solo cuando alguien paga con tarjeta)

Es opcional: sin esto, registrás el pago a mano en el panel (botón Cobrar).

1. Firebase → Configuración del proyecto → Cuentas de servicio → "Generar nueva clave privada". Se baja un .json. No lo compartas.
2. Cloudflare (gratis) → Workers → Crear → pegá el contenido de `worker.js` → Implementar.
3. En el Worker → Configuración → Variables y secretos (tipo Secreto):
   - `FB_PROJECT` = citaly-cb101
   - `FB_CLIENT_EMAIL` = el `client_email` del .json
   - `FB_PRIVATE_KEY` = el `private_key` del .json (completo)
   - `POLAR_WEBHOOK_SECRET` = lo de abajo (paso 4)
4. Polar → Settings → Webhooks → Add endpoint → URL del Worker, evento `order.paid`. Copiá el "secret" y pegalo en el paso 3.
5. Probá con una compra de prueba: el negocio debe pasar a "Al día" y aparecer el pago.

El plan se detecta por el nombre del producto en Polar (debe contener Arranque, Turbo o Nitro) y el cliente por su correo: tiene que ser el mismo con el que entra a Citaly. Si no coincide, el pago queda en Cobros → "Pagos de Polar sin cuenta".


---
## Asistente con IA (ruta /ia del mismo Worker)
Lo usan los clientes en la app (Ajustes → Asistente con IA). Límite por día: Turbo 5, Nitro 30, prueba gratis 10; Arranque no.

1. Vuelve a pegar el `worker.js` nuevo en Cloudflare → Implementar.
2. En el Worker → Variables y secretos agrega:
   - `ANTHROPIC_API_KEY` (Secreto) = tu llave de la consola de Anthropic. Ponla un límite de gasto mensual en la consola.
   - (`FB_API_KEY` ya no hace falta)
   - Opcional `IA_MODEL` (Texto) para cambiar el modelo (por defecto `claude-haiku-5-5`, el más barato).
3. En `cfg.js` completa `iaUrl` con la dirección del Worker terminada en `/ia`.
4. Prueba: entra a la app con un negocio Turbo/Nitro → Ajustes → Asistente con IA → "Mejorar mi portada".

Cada uso queda contado en la colección `ia` de Firestore (negocio + día). Si se pasa del gasto, baja los límites en `IA_LIM` del worker.

## Aviso por correo (respaldo)
1. Crea cuenta gratis en resend.com → API Keys → Create (permiso "Sending access") y copia la llave.
2. En el Worker → Variables y secretos agrega `RESEND_KEY` (secreto). Opcional: `MAIL_FROM` = `Citaly <avisos@tudominio.com>` (requiere dominio verificado en Resend; sin esto envía desde onboarding@resend.dev).
3. Vuelve a desplegar `worker.js`. Cada dueño activa su correo en Ajustes → Avisos de reservas.


## Llenar un negocio con los mensajes del cliente (ruta /importar del mismo Worker, solo admin)
En el panel /admin, al editar o crear un negocio, el cuadro "✨ Llenar con los mensajes del cliente" lee lo que el dueño te escribió por WhatsApp y llena servicios, precios, horario, dirección y textos de la web. No guarda nada hasta que toques Guardar.

1. Vuelve a pegar el `worker.js` nuevo en Cloudflare → Implementar. Usa `ANTHROPIC_API_KEY`, `FB_PROJECT` y la cuenta de servicio que ya tienes.
2. Agrega la variable `ADMIN_EMAIL` (tipo Texto) con el correo con el que entras al admin. Sin ella, /importar responde error. Opcional: `IMPORT_MODEL` (por defecto `claude-sonnet-5-5`).
3. Solo responde si entras al admin con la cuenta del admin; cualquier otra recibe error.


## Links cortos de video (ruta /enlace del mismo Worker)
Cuando un dueño o el admin pega un link corto de TikTok (vm.tiktok.com…) o de Facebook (fb.watch), esta ruta lo convierte en el link completo para poder incrustar el video. Solo funciona con sesión iniciada y solo abre esos sitios.

1. Vuelve a pegar el `worker.js` nuevo en Cloudflare → Implementar. No necesita variables nuevas.


## Recordatorios automáticos por WhatsApp (rutas /wa/… y el cron del mismo Worker)
Citaly le escribe solo al cliente final desde **un número de Citaly** (API oficial de WhatsApp de Meta): confirmación cuando reserva y recordatorio el día antes (entre 4 y 8 p. m., hora del país del negocio). Cada dueño lo enciende en Ajustes → Recordatorios automáticos. Lo tienen Nitro (150 mensajes al mes), la prueba gratis (20 en total) y quien tenga el extra (`subs/{negocio}.waauto = true`, 150). **Sin `WA_TOKEN` el Worker no manda nada y todo lo demás funciona igual.**

### 1. En Meta (una sola vez)
1. Un número nuevo que no tenga WhatsApp activo (chip prepago).
2. developers.facebook.com → la app de Citaly → agregar el producto **WhatsApp** → registrar el número (llega un código por SMS o llamada) y ponerle de nombre «Citaly».
3. En la cuenta de WhatsApp Business: agregar la **tarjeta** para el cobro de mensajes (≈ US$0,0113 por mensaje a Costa Rica).
4. Configuración del negocio → Usuarios del sistema → crear uno con permiso `whatsapp_business_messaging` sobre la cuenta de WhatsApp → **Generar token** que no venza.
5. WhatsApp Manager → Plantillas de mensajes → crear estas 3, categoría **Utilidad**, idioma **Español (es)**. Los nombres deben quedar exactos:

| Nombre | Texto del cuerpo | Botón |
|---|---|---|
| `reserva_recibida` | `Hola {{1}} 👋 Recibimos tu reserva en *{{2}}* para el {{3}}. Para ver los detalles, cambiarla o cancelarla, toca el botón. Este es un mensaje automático.` | «Ir al sitio web», texto `Ver mi cita`, URL **dinámica** `https://citalyapp.com/r/?wa={{1}}` |
| `cita_recordatorio` | `Hola {{1}}, te recordamos tu cita en *{{2}}*: {{3}}. Si no puedes llegar, cámbiala o cancélala con el botón. ¡Te esperamos! Este es un mensaje automático.` | el mismo |
| `cita_recordatorio_simple` | `Hola {{1}}, te recordamos tu cita en *{{2}}*: {{3}}. Si no puedes llegar, avísale al negocio con tiempo. ¡Te esperamos! Este es un mensaje automático.` | sin botón |

   Ejemplos que pide Meta: `{{1}}` = Ana · `{{2}}` = Car Keyss Detailing · `{{3}}` = mañana viernes 4 de diciembre a las 10:00 am · botón = `https://citalyapp.com/r/?wa=car-keyss.abcdefghijkmnpqrstuvwxyz` (si el formulario pide solo la parte variable: `car-keyss.abcdefghijkmnpqrstuvwxyz`). Sin promociones ni precios en el texto: si Meta lo clasifica como «marketing» cuesta unas 6 veces más.

### 2. En Cloudflare (Worker → Configuración → Variables y secretos)
- `WA_TOKEN` (Secreto) = el token del paso 4.
- `WA_PHONE_ID` (Texto) = el «Identificador de número de teléfono» (WhatsApp → Configuración de la API). No es el número.
- `WA_APP_SECRET` (Secreto) = la «Clave secreta de la app» (Configuración de la app → Básica).
- `WA_VERIFY` (Secreto) = cualquier palabra larga inventada (se repite en el paso 3).
- Opcionales: `WA_LANG` (si las plantillas quedaron en otro español, por ejemplo `es_MX`), `WA_API` (versión de la API, por defecto `v25.0`), `WA_DIA_MAX` (máximo de mensajes al día en toda la plataforma, por defecto 300) y `WA_PRUEBA_DIA` (máximo al día entre todas las pruebas gratis, por defecto 60).
- **Cron aparte para los recordatorios (hacerlo desde el primer día):** Disparadores → agregar un cron `*/10 * * * *`, y la variable `WA_CRON` (Texto) con ese mismo texto exacto. Así los recordatorios no compiten con los correos por el límite de llamadas de Cloudflare.
Después, volver a pegar `worker.js` → Implementar.

### 3. Para que lleguen las respuestas de los clientes y los avisos de «no entregado»
Al número de avisos no lo lee nadie. Para que lo que conteste el cliente le llegue al dueño (aviso al celular y correo, máximo 3 por hora por cliente), el cliente reciba una respuesta automática, y para saber cuándo un mensaje no se pudo entregar (se le quita el ✓ a la cita y se devuelve a la cuenta): en la app de Meta → WhatsApp → Configuración → **Webhook**: URL `https://bitter-brook-9ee2.citalyapp-cr.workers.dev/wa/meta`, token de verificación = el valor de `WA_VERIFY`, y suscribirse al campo **messages**.

### 4. Probar
En la app, con un negocio Nitro o en prueba: Ajustes → Recordatorios automáticos → «Enviarme una prueba». Después hacer una reserva real en la página del negocio con tu propio número.

### Frenos contra abuso (para cuidar la plata y que Meta no bloquee el número)
- Solo se le escribe a números **del país del negocio**.
- Un mismo número recibe como mucho **3 mensajes al día** entre todos los negocios.
- Un negocio manda como mucho **50 al día**; toda la plataforma, **300 al día** (`WA_DIA_MAX`); todas las pruebas gratis juntas, **60 al día** (`WA_PRUEBA_DIA`). Si se llega al de la plataforma o al de las pruebas, llega un correo al admin.
- La prueba gratis tiene 20 mensajes **en total** (no se renuevan al cambiar de mes). Las cuentas demo no mandan.
- A los nombres del cliente y del negocio se les quitan links y teléfonos antes de mandarlos.
- Cada mensaje tiene un candado: aunque la página avise dos veces o algo falle a medio camino, no sale repetido.

### Datos que guarda
- En la cita: `waC` (confirmación enviada), `waR` + `waRd` (recordatorio enviado y para qué fecha), `waE` (por qué no salió: `tope`, `tel`, `error`, `freno`), `waRt` y `waRn` (internos: último intento y cuántos van).
- Colección `wa/` (solo la escribe el Worker; desde la app no se puede leer, no hace falta tocar las reglas de Firebase): `{negocio}_{AAAA-MM}` o `{negocio}_prueba` = mensajes del plan; `c_…`, `r_…`, `p_…` = candado de cada mensaje; `t_{número}_{día}`, `d_{negocio}_{día}`, `_dia_{día}`, `_diap_{día}` = cuentas de los frenos.
- `waTo/{número}`: a qué negocio y cita pertenece el último aviso a ese número, con el primer nombre del cliente (para pasarle las respuestas al dueño).
- `biz/{negocio}.waDay`: día para el que ya salieron todos los recordatorios (para no volver a leer sus citas).
- Limpieza (opcional, recomendado): en Firebase → Firestore → TTL, crear una política para la colección `wa` y otra para `waTo`, las dos con el campo `exp`. Así los candados, las cuentas por día y los números se borran solos (a los 45 y 30 días).

### Límite de Cloudflare y volumen
El plan gratis de Workers permite unas 50 llamadas por corrida y cada recordatorio usa 4. Con el cron aparte de cada 10 minutos salen unos 10 por corrida (unos 300 por tarde). Sin el cron aparte, los recordatorios usan lo que dejen libre los correos de esa hora. Para más volumen, pasar a Workers de pago. Si una corrida se queda sin llamadas no pasa nada: la siguiente continúa donde quedó y nunca repite un mensaje.
