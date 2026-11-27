# Pruebas automáticas de Citaly

Abren las páginas **reales** del repo en un Chrome sin ventana, con un Firebase falso en memoria.
No usan internet ni tocan datos de clientes.

```
python3 tools/pruebas/correr.py            # todas
python3 tools/pruebas/correr.py reservas   # solo una carpeta
python3 tools/pruebas/app/prueba_servicios.py
```

Regla: **correrlas todas antes de subir cambios a main.** Si algo falla, no se publica.

- `comun/base.py` — `Banco` (servidor local + Chrome), `negocio()` (negocio de prueba), `ts()`, `dia()`.
- `comun/firebase-falso.js` — Firestore/Auth falsos. `window.__WRITES` = lo que la página escribió; `window.__DB` = estado final.
- `app/` app del dueño · `reservas/` página de reservas y "Mi cita" · `web/` página pública del negocio · `venta/` página de venta (index.html de la raíz), páginas por rubro `/para/` y `/descargar/`.
- Archivos `prueba_*.py` deben pasar siempre. `pendiente_*.py` = error conocido todavía sin arreglar (no los corre `correr.py`).

Con `TEMA=laca` (o `perla`) delante, las pruebas de siempre corren con ese tema premium de la app ya puesto:
`TEMA=laca python3 tools/pruebas/correr.py app`. Sirve para comprobar que el tema no rompe nada.

Necesita Python con Playwright y Chrome (`/usr/bin/google-chrome`, o variable `CHROME`).
Cada error que se arregle debe dejar aquí una prueba que lo habría detectado.
