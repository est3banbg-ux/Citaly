"""Números y gastos: agregar/editar/borrar un gasto (Turbo), totales del mes (ingresos = citas atendidas,
ganancia = ingresos - gastos), cierre del día con citas pagadas y que en Arranque «+ Agregar» gasto ofrece subir de plan."""
import datetime, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, html_mal, escribir, clic

HOY = datetime.date.today()
D1 = HOY.replace(day=1).isoformat()
T = HOY.isoformat()


def job(i, fecha, st, total, extra=None):
    j = {"id": i, "cli": "Cliente " + i, "tel": "8888%04d" % len(i), "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": total}], "date": fecha, "time": "09:00", "dur": 60, "sub": total, "disc": 0, "fee": 0, "total": total, "st": st, "at": 1}
    j.update(extra or {})
    return j


def num(txt):
    return int(re.sub(r"\D", "", txt) or 0)


def stats(p):
    return p.evaluate("()=>{var o={};document.querySelectorAll('#stats .stat').forEach(s=>{o[s.querySelector('span').textContent]=s.querySelector('b').textContent});return o}")


with Banco() as b:
    datos, usuario = negocio()
    datos["biz/U1/jobs/A"] = job("A", D1, "Lista", 10000)
    datos["biz/U1/jobs/B"] = job("B", T, "Lista", 25000, {"pays": [{"m": "SINPE", "a": 15000, "at": 0}, {"m": "Efectivo", "a": 10000, "at": 0}]})
    datos["biz/U1/jobs/C"] = job("C", T, "Confirmada", 7000)
    datos["biz/U1/jobs/D"] = job("D", T, "Cancelada", 99000)
    datos["biz/U1/exp/E1"] = {"desc": "Productos", "amt": 3000, "date": D1, "cat": "Materiales", "at": 1}
    p = abrir_app(b, datos, usuario, "turbo")
    p.evaluate("()=>go('numeros')"); p.wait_for_timeout(400)
    s = stats(p)
    b.ok("Números: ingresos del mes = citas atendidas (10.000 + 25.000)", num(s.get("Ingresos", "")) == 35000, s)
    b.ok("Números: gastos del mes 3.000 y ganancia 32.000", num(s.get("Gastos", "")) == 3000 and num(s.get("Ganancia del mes", "")) == 32000, s)
    b.ok("Números: 2 citas atendidas y por cobrar agendado 7.000 (no cuenta la cancelada)", num(s.get("Citas atendidas", "")) == 2 and num(s.get("Por cobrar (agendado)", "")) == 7000, s)

    # Agregar gasto desde la pantalla
    clic(p, "#addExp", raiz=""); p.wait_for_timeout(200)
    escribir(p, "#eD", "Gasolina"); escribir(p, "#eA", "5000"); clic(p, "#eS"); p.wait_for_timeout(600)
    ex = [v for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("biz/U1/exp/") and v.get("desc") == "Gasolina"]
    b.ok("Gasto nuevo: se guarda en biz/U1/exp con monto y fecha de hoy", len(ex) == 1 and ex[0]["amt"] == 5000 and ex[0]["date"] == T, ex)
    p.wait_for_timeout(200)
    s = stats(p)
    b.ok("Gasto nuevo: los totales se actualizan solos (gastos 8.000, ganancia 27.000)", num(s.get("Gastos", "")) == 8000 and num(s.get("Ganancia del mes", "")) == 27000, s)
    b.ok("Gasto nuevo: aparece en la lista de gastos", "Gasolina" in p.evaluate("()=>document.getElementById('exps').innerText"))
    # Editar y borrar
    p.evaluate("()=>{var e=[...document.querySelectorAll('#exps .li')].find(x=>x.innerText.indexOf('Gasolina')>=0);e.click()}"); p.wait_for_timeout(200)
    escribir(p, "#eA", "6000"); clic(p, "#eS"); p.wait_for_timeout(600)
    b.ok("Editar gasto: cambia el monto sin duplicarlo", [v["amt"] for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("biz/U1/exp/") and v.get("desc") == "Gasolina"] == [6000])
    p.evaluate("()=>{var e=[...document.querySelectorAll('#exps .li')].find(x=>x.innerText.indexOf('Gasolina')>=0);e.click()}"); p.wait_for_timeout(200)
    clic(p, "#eX"); p.wait_for_timeout(600)
    b.ok("Borrar gasto: desaparece", not [k for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("biz/U1/exp/") and v.get("desc") == "Gasolina"])
    clic(p, "#addExp", raiz=""); p.wait_for_timeout(200); escribir(p, "#eD", "Nada"); clic(p, "#eS"); p.wait_for_timeout(200)
    b.ok("Gasto: sin monto muestra el error y no escribe", "monto" in p.evaluate("()=>document.getElementById('eErr').textContent") and not [1 for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("biz/U1/exp/") and v.get("desc") == "Nada"])
    p.evaluate("()=>closeSheet(true)")

    # Cierre del día (agenda): cobrado por método
    p.evaluate("d=>{SEL=d;go('agenda');renderAg()}", T); p.wait_for_timeout(300)
    t = re.sub(r"[\s.\u202f\u00a0]", "", p.evaluate("()=>document.getElementById('dsum').innerText"))
    b.ok("Cierre del día: muestra SINPE 15.000 y Efectivo 10.000", "SINPE₡15000" in t and "Efectivo₡10000" in t, t)
    b.ok("Cierre del día: muestra por cobrar 7.000 de la confirmada", "Porcobrar₡7000" in t, t)
    b.ok("Números: sin errores", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])

    # Arranque: gastos es de Turbo
    datos, usuario = negocio()
    p = abrir_app(b, datos, usuario, "arranque")
    p.evaluate("()=>go('numeros')"); p.wait_for_timeout(300)
    clic(p, "#addExp", raiz=""); p.wait_for_timeout(300)
    b.ok("Arranque: «+ Agregar» gasto ofrece subir a Turbo", p.evaluate("()=>!!document.getElementById('upGo')") and "Turbo" in p.evaluate("()=>document.getElementById('shC').innerText"))
    b.ok("Arranque: números sin errores", not p.errs, p.errs[:2])
