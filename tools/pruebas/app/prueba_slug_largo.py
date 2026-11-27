"""ERROR: slugify() corta el slug a 40 letras DESPUÉS de quitar los guiones de las puntas. Si la letra 40 cae
en un guion, el slug termina en "-" (ej. "Pulido de Focos y Parabrisas Costa Rica San José" →
"pulido-de-focos-y-parabrisas-costa-rica-"). Ese slug no cumple ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$:
- firestore.rules (pub create) lo rechaza → el registro falla con "No se pudo crear el negocio".
- 404.html lo rechaza → citalyapp.com/<slug>/reservar manda al inicio.
(El Firestore falso no aplica reglas, así que aquí se revisa el slug que la app intenta crear.)"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, VIGIA

SLUG_OK = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
with Banco() as b:
    for nombre in ("Pulido de Focos y Parabrisas Costa Rica San José", "Lavacar y Detailing Profesional de Heredia - Centro"):
        p = b.abrir("/app/?nuevo=1", {}, None, espera=1500, antes=VIGIA)
        p.evaluate("""n=>{document.querySelector('#suT [data-k="pulido"]').click();
          document.getElementById('suN').value=n;document.getElementById('suP').value='Dueño de Prueba';
          document.getElementById('suW').value='8888 7777';document.getElementById('suE').value='x@prueba.test';document.getElementById('suK').value='secreta123';
          document.getElementById('suGo').click()}""", nombre)
        p.wait_for_timeout(2500)
        sl = (p.evaluate("()=>window.__DB['biz/UNUEVO']") or {}).get("slug", "")
        b.ok("Nombre largo %r: el slug %r cumple la regla de firestore.rules y 404.html" % (nombre, sl), SLUG_OK.match(sl), sl)
        b.ok("Slug directo de slugify() sin guion al final", not p.evaluate("n=>slugify(n)", nombre).endswith("-"), p.evaluate("n=>slugify(n)", nombre))
