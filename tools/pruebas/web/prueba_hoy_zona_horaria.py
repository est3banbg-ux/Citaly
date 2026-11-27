"""PENDIENTE (falla hoy): plantilla Clásica, tabla de horario. El día resaltado como "hoy" sale del reloj del
celular del visitante, no de la hora de Costa Rica (el resto de la página sí usa la hora de Costa Rica).
Ej.: lunes 8 pm en Costa Rica, visitante con el celular en hora de España (ya es martes allá): resalta "Martes"."""
import json
from ayuda_web import Banco, armar, reloj, cr_ms
import comun.base as cb

with Banco() as b:
    for tz in ("America/Costa_Rica", "Europe/Madrid"):
        ctx = b.nav.new_context(viewport={"width": 400, "height": 850}, locale="es-CR", timezone_id=tz)
        p = ctx.new_page()
        js = "window.__DATA=%s;window.__USER=null;window.__DENY=[];%s\n%s" % (json.dumps(armar(layout="clasica")), reloj(cr_ms(2030, 1, 7, 20)), cb.FALSO)
        p.route("**/*", lambda r: r.continue_() if "127.0.0.1" in r.request.url else r.abort())
        p.route("**/firebase-app-compat.js", lambda r: r.fulfill(body=js, content_type="text/javascript"))
        p.route("**/firebase-firestore-compat.js", lambda r: r.fulfill(body="", content_type="text/javascript"))
        p.goto(b.base + "/w/?n=prueba"); p.wait_for_timeout(1000)
        hoy = p.inner_text(".hours .li.today").split("\n")[0]
        b.ok("celular en %s, lunes 8 pm en Costa Rica: resalta Lunes" % tz, hoy == "Lunes", hoy)
        ctx.close()
