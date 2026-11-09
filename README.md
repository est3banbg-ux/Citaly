# Citaly

Servicio llave en mano: a cada negocio le montamos su página web, su página de reservas y su app de agenda. El admin crea cada negocio desde /admin.

- `index.html`: página de venta (citalyapp.com)
- `app/`: app de cada negocio (citalyapp.com/app)
- `w/`: página web de cada negocio (citalyapp.com/nombre-del-negocio, vía `404.html`)
- `r/`: página de reservas (citalyapp.com/nombre-del-negocio/reservar)
- `demo/`: logo y fotos de la demo de GlassStudioCR
- `admin/`: panel del admin: crear y editar negocios, quién entra (correos), web, fotos y cobros
- `cfg.js`: precio, días de prueba, SINPE, WhatsApp y datos de Firebase
- `firestore.rules`: reglas de seguridad (pegarlas en Firebase → Firestore → Reglas)
