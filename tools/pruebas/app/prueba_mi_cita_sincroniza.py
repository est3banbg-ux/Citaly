"""Si el dueño mueve, cancela o elimina desde la app una cita que el cliente reservó por la web, el link
«Mi cita» del cliente (mine/{tk}) se actualiza. Antes la app nunca tocaba mine/ y el cliente seguía viendo
la fecha vieja como activa (arreglado el 26 nov 2026). Y si mine/ no existe, la cita igual se guarda."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D, D2 = dia(2), dia(4)
TK = "tok" + "a" * 21


def datos_con_cita(con_mine=True):
    datos, usuario = negocio()
    datos["biz/U1/jobs/J1"] = {"id": "J1", "cli": "Ana Web", "tel": "88887777", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}],
                               "date": D, "time": "09:00", "dur": 60, "sub": 8000, "disc": 0, "total": 8000, "st": "Por confirmar", "web": True, "tk": TK, "at": 1}
    for t in ("0900", "0930"):
        datos["biz/U1/slots/%s_%s" % (D, t)] = {"date": D, "t": t, "job": "J1"}
    if con_mine:
        datos["biz/U1/mine/" + TK] = {"job": "J1", "cli": "Ana Web", "tel": "88887777", "date": D, "time": "09:00", "dur": 60, "items": ["Lavado básico"], "total": 8000, "st": "activa", "at": 1}
    return datos, usuario


def mine(p):
    return p.evaluate("k=>window.__DB['biz/U1/mine/'+k]||null", TK)


def abrir_cita(p):
    p.evaluate("()=>{closeSheet(true);openJob(JOBS.filter(x=>x._id==='J1')[0])}"); p.wait_for_timeout(300)


def poner(p, sel, val):
    p.evaluate("([s,v])=>{var e=document.getElementById(s);e.value=v;e.dispatchEvent(new Event('change'))}", [sel, val])


with Banco() as b:
    datos, usuario = datos_con_cita()
    p = abrir_app(b, datos, usuario)
    abrir_cita(p); poner(p, "jD", D2); poner(p, "jH", "14:00"); p.evaluate("()=>document.getElementById('jSave').click()"); p.wait_for_timeout(800)
    j = p.evaluate("()=>window.__DB['biz/U1/jobs/J1']")
    b.ok("La cita se movió en la agenda", j["date"] == D2 and j["time"] == "14:00", j)
    m = mine(p)
    b.ok("El link del cliente muestra el día y la hora nuevos", m["date"] == D2 and m["time"] == "14:00" and m["st"] == "activa", m)
    b.ok("No se pierden los demás datos del link", m["cli"] == "Ana Web" and m["job"] == "J1" and m["total"] == 8000, m)

    abrir_cita(p); poner(p, "jE", "Cancelada"); p.evaluate("()=>document.getElementById('jSave').click()"); p.wait_for_timeout(800)
    b.ok("Al cancelar en la app, el link del cliente queda cancelado", mine(p)["st"] == "cancelada", mine(p))
    abrir_cita(p); poner(p, "jE", "Confirmada"); p.evaluate("()=>document.getElementById('jSave').click()"); p.wait_for_timeout(800)
    b.ok("Al reactivarla, el link vuelve a estar activo", mine(p)["st"] == "activa", mine(p))
    b.ok("Sin errores", not p.errs, p.errs[:3])

    datos, usuario = datos_con_cita()
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>delJob(JOBS.filter(x=>x._id==='J1')[0])"); p.wait_for_timeout(800)
    b.ok("Al eliminar la cita, el link del cliente queda cancelado", p.evaluate("()=>!window.__DB['biz/U1/jobs/J1']") and mine(p)["st"] == "cancelada", mine(p))

    datos, usuario = datos_con_cita(con_mine=False)
    p = abrir_app(b, datos, usuario)
    abrir_cita(p); poner(p, "jD", D2); poner(p, "jH", "14:00"); p.evaluate("()=>document.getElementById('jSave').click()"); p.wait_for_timeout(800)
    j = p.evaluate("()=>window.__DB['biz/U1/jobs/J1']")
    b.ok("Si el link no existe, la cita igual se guarda y no se crea nada raro", j["date"] == D2 and mine(p) is None and not p.errs, [j, mine(p), p.errs])
