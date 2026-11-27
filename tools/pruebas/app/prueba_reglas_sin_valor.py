"""ERROR (negocios viejos sin `lead`/`ahead` en biz): la página pública usa lead=2 h y ahead=21 días (pubOf),
pero «Reglas de reserva» muestra «Sin mínimo» y «7 días» (la primera opción). Si el dueño entra solo a cambiar
otra cosa (p. ej. «cada cuánto se ofrecen horas») y guarda, sin saberlo deja reservar sin anticipación y
recorta la agenda en línea de 21 a 7 días."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app

with Banco() as b:
    datos, usuario = negocio()
    for k in ("lead", "ahead"):
        del datos["biz/U1"][k]
        del datos["pub/prueba"][k]
    p = abrir_app(b, datos, usuario, "prueba")
    pub = p.evaluate("()=>window.__DB['pub/prueba']")
    b.ok("(control) la página pública usa 2 h de anticipación y 21 días", pub.get("lead") == 2 and pub.get("ahead") == 21, [pub.get("lead"), pub.get("ahead")])
    p.evaluate("()=>openSet('res')"); p.wait_for_timeout(300)
    sel = p.evaluate("()=>[document.getElementById('rL').value,document.getElementById('rA').value]")
    b.ok("Reglas: muestra la anticipación que de verdad usa la página (2 horas)", sel[0] == "2", sel)
    b.ok("Reglas: muestra los días adelante que de verdad usa la página (21)", sel[1] == "21", sel)
    p.evaluate("()=>{var e=document.getElementById('rP');e.value='60';e.dispatchEvent(new Event('change'));document.getElementById('rS').click()}")
    p.wait_for_timeout(700)
    pub = p.evaluate("()=>window.__DB['pub/prueba']")
    b.ok("Cambiar solo «cada cuánto» no cambia la anticipación ni los días de la página", pub.get("lead") == 2 and pub.get("ahead") == 21 and pub.get("slot") == 60, [pub.get("lead"), pub.get("ahead"), pub.get("slot")])
