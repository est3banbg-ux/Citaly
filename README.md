# Citaly

Sistema de citas para negocios de carros (lavacars, detailing, pulido, polarizado). Cada negocio se registra solo desde la página ("Prueba gratis" → citalyapp.com/app/?nuevo=1) con 7 días gratis, luego promo de ₡500/mes los primeros 3 meses y después ₡9.900/mes (US$1 y US$19 fuera de Costa Rica). Paga con SINPE o con tarjeta (links en cfg.js). El admin también puede crear negocios desde /admin y registra las mensualidades.

- `index.html`: página de venta (citalyapp.com)
- `app/`: app de cada negocio (citalyapp.com/app)
- `w/`: página web de cada negocio (citalyapp.com/nombre-del-negocio, vía `404.html`)
- `r/`: página de reservas (citalyapp.com/nombre-del-negocio/reservar)
- `demo/`: logo y fotos de la demo de GlassStudioCR
- `admin/`: panel del admin: crear y editar negocios, quién entra (correos), web, fotos y cobros
- `cfg.js`: mensualidad (fundadores y normal), días de prueba, tipos de negocio con servicios de ejemplo, SINPE, WhatsApp y datos de Firebase
- `firestore.rules`: reglas de seguridad (pegarlas en Firebase → Firestore → Reglas). Permiten que una persona con correo confirmado cree SU negocio con prueba de máximo 31 días.
