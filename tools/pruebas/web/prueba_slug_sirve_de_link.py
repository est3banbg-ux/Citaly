"""El slug que arma app/index.html (slugify) siempre sirve como link público citalyapp.com/<slug>.
Antes, slugify() quitaba los guiones de las puntas ANTES de cortar a 40 letras, y un nombre largo podía dar un slug que
terminaba en "-" (ej. "Lavacar y Detailing Hermanos Rodriguezz Alajuela" → "lavacar-y-detailing-hermanos-rodriguezz-").
Ese slug no cumplía ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$ (el mismo patrón de 404.html y de firestore.rules para pub/):
la regla rechazaba crear pub/<slug> (el registro fallaba) y el enrutador mandaba el link al inicio."""
import os, re
from ayuda_web import Banco

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
APP = open(os.path.join(RAIZ, "app", "index.html"), encoding="utf-8").read()
SLUGIFY = re.search(r"function slugify\(s\)\{.*?\n", APP).group(0)
PATRON = re.search(r"if\(!(/\^.*?\$/)\.test\(p\)\)", open(os.path.join(RAIZ, "404.html"), encoding="utf-8").read()).group(1)
NOMBRES = ["Lavacar y Detailing Hermanos Rodriguezz Alajuela", "Taller Mecánico Automotriz Hermanos Solano y Asociados",
           "Detailing Profesional de Lujo San José Escazú Santa Ana", "Car Wash & Detailing El Profe 24/7 de Barrio Escalante"]

with Banco() as b:
    p = b.nav.new_page()
    p.set_content("<html></html>")
    p.evaluate("()=>{" + SLUGIFY + ";window.slugify=slugify;window.RX=" + PATRON + "}")
    for n in NOMBRES:
        s = p.evaluate("(n)=>slugify(n)", n)
        b.ok("'%s' → slug '%s' sirve como link" % (n, s), p.evaluate("(s)=>RX.test(s)", s), s)
