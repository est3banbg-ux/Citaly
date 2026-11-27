"""Reglas de reserva → "Solo a las horas que yo elija" (P.fixed): el cliente solo ve esas horas,
el dueño las puede configurar, y los negocios que no lo usan siguen igual."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio, dia

FIJAS = ["08:00", "10:30", "13:30", "15:30"]
LIBRES = "async (d)=>{S.pick=[0];await loadBusy();return freeStarts(d)}"

with Banco() as b:
    d1, d2 = dia(2), dia(3)
    datos, usuario = negocio(fixed=FIJAS, brk={"a": "12:00", "b": "13:00"})
    datos["biz/U1/slots/%s_1030" % d1] = {"date": d1, "t": "1030", "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos)
    b.ok("Solo salen las horas elegidas y la ocupada no sale", p.evaluate(LIBRES, d1) == ["08:00", "13:30", "15:30"], p.evaluate(LIBRES, d1))
    b.ok("Un día libre muestra las 4 horas", p.evaluate(LIBRES, d2) == FIJAS, p.evaluate(LIBRES, d2))
    p = b.abrir("/r/?n=prueba", datos)
    p.click("#go1"); p.wait_for_timeout(400); p.click('#svcs .svc[data-i="0"]'); p.wait_for_timeout(300); p.click("#nx"); p.wait_for_timeout(500)
    p.click('#days button[data-d="%s"]' % d1); p.wait_for_timeout(400)
    b.ok("En pantalla el cliente ve solo esas horas", p.locator("#hrs button").all_inner_texts() == ["8 am", "1:30 pm", "3:30 pm"], p.locator("#hrs button").all_inner_texts())
    b.ok("Reservas sin errores", not p.errs, p.errs[:3])

    # Decisión de producto: con horas exactas manda la hora de INICIO que eligió el dueño. No se filtra por
    # almuerzo ni por terminar después del cierre (un turno de 3:30 pm se ofrece aunque el servicio dure 2 h).
    datos2, _ = negocio(fixed=["08:00", "11:30", "15:30"], brk={"a": "12:00", "b": "13:00"})
    p = b.abrir("/r/?n=prueba", datos2)
    b.ok("Horas exactas: se ofrecen tal cual las eligió el dueño (aunque crucen almuerzo o cierre)", p.evaluate("async (d)=>{S.pick=[1];await loadBusy();return freeStarts(d)}", d2) == ["08:00", "11:30", "15:30"])

    datos0, _ = negocio(brk={"a": "12:00", "b": "13:00"})
    datos0["biz/U1/slots/%s_1030" % d1] = {"date": d1, "t": "1030", "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos0)
    esperado = ["08:00", "08:30", "09:00", "09:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"]
    b.ok("Sin horas exactas: cada 30 min, respetando almuerzo y ocupadas", p.evaluate(LIBRES, d1) == esperado, p.evaluate(LIBRES, d1))

    mia = dict(datos); mia["biz/U1/mine/tok123"] = {"job": "J1", "cli": "Ana Pérez", "tel": "88887777", "date": d1, "time": "08:00", "dur": 60, "items": [], "total": 8000, "st": "activa"}
    mia["biz/U1/slots/%s_0800" % d1] = {"date": d1, "t": "0800", "job": "J1"}
    p = b.abrir("/r/?n=prueba&cita=tok123", mia, espera=2500)
    p.click("text=Cambiar día u hora"); p.wait_for_timeout(800)
    b.ok("Mi cita: al mover solo ofrece las horas exactas libres", p.evaluate("(d)=>freeFor(d)", d1) == ["13:30", "15:30"], p.errs)

    # App del dueño
    datos, usuario = negocio()
    p = b.abrir("/app/", datos, usuario, espera=2200)
    p.evaluate("()=>openSet('res')"); p.wait_for_timeout(400)
    b.ok("App: aparece la opción y el cuadro empieza oculto", "Solo a las horas que yo elija" in p.locator("#rP option").all_inner_texts() and p.locator("#rFw").is_hidden())
    p.select_option("#rP", "fix"); p.fill("#rF", ""); p.click("#rS"); p.wait_for_timeout(300)
    b.ok("App: vacío no guarda", not [w for w in b.escrituras(p, "biz/U1") if w[2] and "fixed" in w[2]])
    p.fill("#rF", "8:00, 10:30, 1:30, 3:30"); p.click("#rS"); p.wait_for_timeout(500)
    b.ok("App: guarda las horas (1:30 y 3:30 son de la tarde)", p.evaluate("()=>window.__DB['biz/U1'].fixed") == FIJAS, p.evaluate("()=>window.__DB['biz/U1'].fixed"))
    b.ok("App: las publica en la página de reservas", p.evaluate("()=>window.__DB['pub/prueba'].fixed") == FIJAS)
    p.evaluate("()=>openSet('res')"); p.wait_for_timeout(400)
    b.ok("App: al reabrir recuerda opción y horas", p.input_value("#rP") == "fix" and p.input_value("#rF") == "8:00 am, 10:30 am, 1:30 pm, 3:30 pm", p.input_value("#rF"))
    p.select_option("#rP", "60"); p.click("#rS"); p.wait_for_timeout(500)
    b.ok("App: al volver a 'cada hora' se quitan", p.evaluate("()=>[window.__DB['biz/U1'].fixed.length,window.__DB['biz/U1'].slot]") == [0, 60])
    b.ok("App sin errores", not p.errs, p.errs[:3])
