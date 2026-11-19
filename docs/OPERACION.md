# Citaly: operación, respaldos y crecimiento

## Aviso si algo se cae
`.github/workflows/uptime.yml` revisa cada 30 min la web, la app, la reserva y Firebase. Si falla, GitHub te escribe al correo. Para probarlo: GitHub → Actions → "Uptime Citaly" → Run workflow.

## Respaldos (hacer ANTES de tener clientes de pago)
1. Firebase Console → Firestore → pestaña **Disaster recovery** → programar copia **diaria**, retención 7 días. Requiere plan Blaze (se paga solo lo que se usa; con pocos clientes son centavos).
2. Mientras tanto, copia manual: Firebase Console → Firestore → Import/Export → exportar a un bucket.
3. Guarda el código en GitHub (ya está): cada cambio es una versión a la que puedes volver (`git revert`).
4. NO guardes respaldos de datos en el repositorio ni en Actions: el repo es público y ahí están los datos de tus clientes.

## Cuándo pasar a plan Blaze
- Al llegar a ~50–100 negocios activos, o antes si Firebase avisa que te acercas a la cuota gratis (Firebase Console → Uso).
- Pon un **presupuesto con alerta** (Google Cloud Billing → Budgets) en US$10 para que te avise por correo.

## Fotos
Hoy las fotos viven dentro de Firestore (≤600 KB cada una, máx. 12 por negocio). Con muchos clientes conviene moverlas a Firebase Storage. Es un cambio de código, avísame cuando pasen de ~100 negocios.

## Riesgo principal
Un error en el código afecta a todos los clientes a la vez. Por eso cada cambio se prueba antes de subirlo y se puede revertir con un clic en GitHub.
