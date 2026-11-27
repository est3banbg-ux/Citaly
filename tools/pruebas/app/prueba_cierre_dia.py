"""Agenda → «Cerrar este día para reservas en línea»: todo el día o desde una hora; se guarda en biz/U1.cierre y en
pub/prueba.cierre, y la agenda lo muestra cerrado. (Reabrir un día con OTRO día cerrado falla: ver pendiente_borrar_con_merge.py)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D1, D2 = dia(2), dia(4)
with Banco() as b:
    datos, usuario = negocio()
    p = abrir_app(b, datos, usuario, "arranque")
    p.evaluate("d=>{SEL=d;go('agenda');renderAg()}", D1); p.wait_for_timeout(200)
    b.ok("Día abierto: el botón ofrece cerrarlo", "Cerrar este día" in p.evaluate("()=>document.getElementById('cdBox').innerText"))
    p.evaluate("()=>document.getElementById('cdGo').click()"); p.wait_for_timeout(200)
    p.evaluate("()=>{document.getElementById('cdH').value='0';document.getElementById('cdS').click()}"); p.wait_for_timeout(700)
    b.ok("Cerrar todo el día: queda en biz y en pub con 0", p.evaluate("d=>window.__DB['biz/U1'].cierre[d]===0&&window.__DB['pub/prueba'].cierre[d]===0", D1), p.evaluate("()=>window.__DB['pub/prueba'].cierre"))
    p.evaluate("d=>{SEL=d;renderAg()}", D1); p.wait_for_timeout(200)
    b.ok("Cerrar todo el día: la agenda lo muestra cerrado", "Cerrado para reservas en línea" in p.evaluate("()=>document.getElementById('cdBox').innerText"))
    p.evaluate("d=>{SEL=d;renderAg();document.getElementById('cdGo').click()}", D2); p.wait_for_timeout(200)
    p.evaluate("()=>{document.getElementById('cdH').value='13';document.getElementById('cdS').click()}"); p.wait_for_timeout(700)
    c = p.evaluate("()=>window.__DB['pub/prueba'].cierre")
    b.ok("Cerrar otro día desde la 1 pm: guarda 13 y conserva el primero", c.get(D2) == 13 and c.get(D1) == 0, c)
    p.evaluate("d=>{SEL=d;renderAg()}", D2); p.wait_for_timeout(200)
    b.ok("Cerrado desde la 1 pm: la agenda lo dice", "desde las" in p.evaluate("()=>document.getElementById('cdBox').innerText"))
    p.evaluate("d=>{SEL=d;renderAg()}", dia(-3, saltar_domingo=False)); p.wait_for_timeout(200)
    b.ok("Días pasados: no ofrece cerrar", p.evaluate("()=>document.getElementById('cdBox').innerHTML") == "")
    b.ok("Sin errores", not p.errs, p.errs[:2])
