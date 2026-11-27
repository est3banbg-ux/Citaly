"""ERROR (cita doble): la página revisa y aparta cupos de 30 min contando desde la hora de inicio, no desde la
cuadrícula :00/:30. Si una hora de inicio no cae en :00 o :30 (horas exactas como 8:45, apertura 7:45 o
descanso que termina 12:45, todos permitidos por la app), se ofrecen horas que se montan sobre citas ya hechas
y las reglas del servidor no lo frenan porque los cupos tienen otro nombre (0845 en vez de 0830/0900).
Arreglado el 26 nov 2026. Arreglo: alinear los cupos a :00/:30 en mBlocks/blocks/freeStarts (ver reporte)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1 = dia(1)
LIB = "async ([d,pk])=>{S.pick=pk;await loadBusy();return freeStarts(d)}"


def m(t):
    return int(t[:2]) * 60 + int(t[3:])


def choques(ofrecidas, dur, ocupados):
    """Horas ofrecidas cuyo rato [inicio, inicio+dur) pisa algún cupo ocupado [b, b+30)."""
    occ = [m(k[11:13] + ":" + k[13:15]) for k in ocupados]
    return [t for t in ofrecidas if any(m(t) < o + 30 and o < m(t) + dur for o in occ)]


def citas_que_se_pisan(db):
    js = [(v["time"], v["dur"]) for k, v in db.items() if k.startswith("biz/U1/jobs/") and v.get("date") == D1]
    return [(a, b2) for i, a in enumerate(js) for b2 in js[i + 1:] if m(a[0]) < m(b2[0]) + b2[1] and m(b2[0]) < m(a[0]) + a[1]]


with Banco() as b:
    # A) Horas exactas 8:00 y 8:45: dos clientes por la web terminan con citas encimadas
    datos, _ = negocio_cr(fixed=["08:00", "08:45", "15:30"])
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    reservar(p, [0], D1, "08:00", tel="88887777")  # 8:00 a 9:00
    p2 = b.abrir("/r/?n=prueba", estado(p), antes=reloj()); activar_reglas(p2)
    L = p2.evaluate(LIB, [D1, [0]])
    b.ok("Horas exactas: con 8:00-9:00 ocupado no se ofrece 8:45", "08:45" not in L, L)
    p3 = b.abrir("/r/?n=prueba", estado(p), antes=reloj()); activar_reglas(p3)
    if "08:45" in L:
        reservar(p3, [0], D1, "08:45", tel="87776666")
    b.ok("Horas exactas: nunca quedan dos citas encimadas", not citas_que_se_pisan(estado(p3)), citas_que_se_pisan(estado(p3)))

    # B) Abre a las 7:45 y el dueño tiene una cita de 8:00 a 9:00
    datos, _ = negocio_cr(hours=[{"on": True, "a": "07:45", "b": "17:00"} for _ in range(7)])
    occ = [D1 + "_0800", D1 + "_0830"]
    for k in occ:
        datos["biz/U1/slots/" + k] = {"date": D1, "t": k[-4:], "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    L = p.evaluate(LIB, [D1, [0]])
    b.ok("Apertura 7:45: no ofrece horas que pisen la cita de 8:00-9:00", not choques(L, 60, occ), choques(L, 60, occ))

    # C) Descanso de 12:00 a 12:45 y una cita a la 1:00
    datos, _ = negocio_cr(brk={"a": "12:00", "b": "12:45"})
    occ = [D1 + "_1300"]
    datos["biz/U1/slots/" + occ[0]] = {"date": D1, "t": "1300", "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    L = p.evaluate(LIB, [D1, [0]])
    b.ok("Descanso hasta 12:45: no ofrece 12:45 ni 1:15 encima de la cita de la 1:00", not choques(L, 60, occ), choques(L, 60, occ))

    # D) Mi cita: mover a 8:45 encima de otra de 8:00-9:00
    datos = con_cita(dia(2), "10:00", 60, fixed=["08:00", "08:45", "10:00"])
    datos["biz/U1/slots/%s_0800" % D1] = {"date": D1, "t": "0800", "job": "J9"}
    datos["biz/U1/slots/%s_0830" % D1] = {"date": D1, "t": "0830", "job": "J9"}
    p = abrir_cita(b, datos)
    p.click("#mcMove"); p.wait_for_timeout(600)
    L = p.evaluate("(d)=>freeFor(d)", D1)
    b.ok("Mi cita: al mover no ofrece 8:45 encima de 8:00-9:00", "08:45" not in L, L)
