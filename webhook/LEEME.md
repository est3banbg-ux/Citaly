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
