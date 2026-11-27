"""'Mi cita' (/r/?n=prueba&cita=<código>): ver, cambiar día/hora (libera los cupos viejos y toma los nuevos),
cancelar (libera todo), límite de 12 h, código inválido, cita cancelada o pasada. Con imitación de firestore.rules."""
import datetime, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1, D2, D3 = dia(1), dia(2), dia(3)

with Banco() as b:
    # Ver
    datos = con_cita(D2, "09:00", 60)
    p = abrir_cita(b, datos)
    t = txt(p, "#mcb")
    b.ok("Ver: muestra saludo, día, hora, servicio y total", "Hola Ana" in t and "10 de enero" in t and "9 am" in t and "Lavado básico" in t and "₡8 000" in t, t[:200])
    b.ok("Ver: ofrece cambiar y cancelar", p.locator("#mcMove").is_visible() and p.locator("#mcCancel").is_visible())

    # Cambiar a otro día
    mover(p, D3, "10:00")
    db = estado(p)
    b.ok("Cambiar: confirma el cambio en pantalla", "cambiamos tu cita" in txt(p, "#mcb"), txt(p, "#mcb")[:120])
    b.ok("Cambiar: libera 9:00/9:30 del día viejo y toma 10:00/10:30 del nuevo", slots_de(p) == [D3 + "_1000", D3 + "_1030"], slots_de(p))
    j = db["biz/U1/jobs/" + JOB]
    b.ok("Cambiar: la cita queda en el nuevo día, Por confirmar, marcada como movida", j["date"] == D3 and j["time"] == "10:00" and j["st"] == "Por confirmar" and j["chg"] == "movida" and j["key"] == TK, j)
    m = db["biz/U1/mine/" + TK]
    b.ok("Cambiar: 'Mi cita' queda con el nuevo día y sigue activa", m["date"] == D3 and m["time"] == "10:00" and m["st"] == "activa", m)
    b.ok("Cambiar: las reglas reales lo aceptarían", not negado(p), negado(p))
    p.click("#mOk"); p.wait_for_timeout(300)
    b.ok("Cambiar: 'Ver mi cita' muestra la hora nueva", "10 am" in txt(p, "#mcb") and "11 de enero" in txt(p, "#mcb"), txt(p, "#mcb")[:120])

    # Cambiar dentro del mismo día, encima de su propia hora (9:00 -> 9:30 con 60 min)
    p = abrir_cita(b, con_cita(D2, "09:00", 60))
    p.click("#mcMove"); p.wait_for_timeout(600)
    p.click('#mdays button[data-d="%s"]' % D2); p.wait_for_timeout(250)
    hs = p.evaluate("()=>Array.from(document.querySelectorAll('#mhrs button')).map(b=>b.dataset.t)")
    b.ok("Mover: su propia hora no cuenta como ocupada (ofrece 8:30 y 9:30) pero no repite 9:00", "08:30" in hs and "09:30" in hs and "09:00" not in hs, hs)
    p.click('#mhrs button[data-t="09:30"]'); p.wait_for_timeout(150); p.click("#mGo"); p.wait_for_timeout(900)
    b.ok("Mover 9:00→9:30: queda 9:30 y 10:00, se borra 9:00", slots_de(p) == [D2 + "_0930", D2 + "_1000"] and not negado(p), [slots_de(p), negado(p)])

    # No ofrece horas ocupadas por otro ni a menos de 2 h
    datos = con_cita(D2, "09:00", 60)
    datos["biz/U1/slots/%s_1100" % D2] = {"date": D2, "t": "1100", "job": "OTRA"}
    p = abrir_cita(b, datos, ahora=BASE.replace(hour=6, minute=50))
    p.click("#mcMove"); p.wait_for_timeout(600)
    b.ok("Mover: hoy no ofrece nada antes de 2 h (ahora 6:50 → desde 9:00)", p.evaluate("(d)=>freeFor(d)", dia(0))[0] == "09:00", p.evaluate("(d)=>freeFor(d)", dia(0))[:3])
    L = p.evaluate("(d)=>freeFor(d)", D2)
    b.ok("Mover: no ofrece 10:30 ni 11:00 si otro tiene las 11:00", "10:30" not in L and "11:00" not in L and "10:00" in L and "11:30" in L, L)

    # Mover con cupos: su cita está en el cupo 2
    datos = con_cita(D2, "09:00", 60, carril="_1", lanes=2)
    datos["biz/U1/slots/%s_0900" % D2] = {"date": D2, "t": "0900", "job": "OTRA"}
    datos["biz/U1/slots/%s_0930" % D2] = {"date": D2, "t": "0930", "job": "OTRA"}
    p = abrir_cita(b, datos)
    mover(p, D2, "09:30")
    b.ok("Cupos: mover 9:00→9:30 reutiliza su cupo 2 y toma 10:00", slots_de(p, JOB) == [D2 + "_0930_1", D2 + "_1000"] and slots_de(p, "OTRA") == [D2 + "_0900", D2 + "_0930"] and not negado(p), [slots_de(p), negado(p)])

    # Si alguien toma la hora nueva mientras decide
    p = abrir_cita(b, con_cita(D2, "09:00", 60))
    p.click("#mcMove"); p.wait_for_timeout(600)
    p.click('#mdays button[data-d="%s"]' % D3); p.wait_for_timeout(250); p.click('#mhrs button[data-t="10:00"]'); p.wait_for_timeout(150)
    poner(p, "biz/U1/slots/%s_1030" % D3, {"date": D3, "t": "1030", "job": "OTRA"})
    p.click("#mGo"); p.wait_for_timeout(900)
    b.ok("Mover y le ganan la hora: avisa y no cambia nada", "se acabe de ocupar" in txt(p, "#mer") and slots_de(p, JOB) == [D2 + "_0900", D2 + "_0930"] and estado(p)["biz/U1/mine/" + TK]["date"] == D2, [txt(p, "#mer"), slots_de(p)])
    b.ok("Mover y le ganan la hora: recarga y ya no ofrece 10:00", "10:00" not in p.evaluate("()=>Array.from(document.querySelectorAll('#mhrs button')).map(b=>b.dataset.t)"))

    # Cancelar
    datos = con_cita(D2, "09:00", 90)
    datos["biz/U1/slots/%s_1100" % D2] = {"date": D2, "t": "1100", "job": "OTRA"}
    p = abrir_cita(b, datos)
    cancelar(p)
    db = estado(p)
    b.ok("Cancelar: confirma en pantalla", "quedó cancelada" in txt(p, "#mcb"), txt(p, "#mcb")[:80])
    b.ok("Cancelar: libera sus 3 cupos y no toca los de otro", slots_de(p) == [D2 + "_1100"], slots_de(p))
    b.ok("Cancelar: borra el apartado del teléfono", "biz/U1/holds/88887777" not in db)
    b.ok("Cancelar: cita Cancelada y 'Mi cita' cancelada", db["biz/U1/jobs/" + JOB]["st"] == "Cancelada" and db["biz/U1/jobs/" + JOB]["chg"] == "cancelada" and db["biz/U1/mine/" + TK]["st"] == "cancelada")
    b.ok("Cancelar: reglas OK", not negado(p), negado(p))
    p = abrir_cita(b, db)
    b.ok("Cita ya cancelada: lo dice y ofrece reservar otra", "Cita cancelada" in txt(p, "#mcb") and not p.locator("#mcMove").count() and p.locator("a[href*='go=1']").count() == 1)

    # Límite de 12 h
    ahora = datetime.datetime.strptime(D2 + " 09:00", "%Y-%m-%d %H:%M") - datetime.timedelta(hours=11, minutes=59)
    p = abrir_cita(b, con_cita(D2, "09:00", 60), ahora=ahora)
    b.ok("A menos de 12 h: no deja cambiar ni cancelar y manda a WhatsApp", not p.locator("#mcMove").count() and not p.locator("#mcCancel").count() and "menos de 12 horas" in txt(p, "#mcb"))
    ahora = datetime.datetime.strptime(D2 + " 09:00", "%Y-%m-%d %H:%M") - datetime.timedelta(hours=12, minutes=5)
    p = abrir_cita(b, con_cita(D2, "09:00", 60), ahora=ahora)
    b.ok("A 12 h 5 min: todavía deja cambiar", p.locator("#mcMove").count() == 1)
    p.click("#mcMove"); p.wait_for_timeout(500)
    p.evaluate("()=>__AVANZAR(10*60000)")  # pasan 10 minutos mientras decide
    p.click('#mdays button[data-d="%s"]' % D3); p.wait_for_timeout(250); p.click('#mhrs button[data-t="10:00"]'); p.wait_for_timeout(150)
    p.click("#mGo"); p.wait_for_timeout(900)
    b.ok("Si mientras decide ya faltan menos de 12 h, el servidor lo rechaza y lo explica", "menos de 12 horas" in txt(p, "#mer") and slots_de(p, JOB) == [D2 + "_0900", D2 + "_0930"], [txt(p, "#mer"), negado(p)])
    ahora = datetime.datetime.strptime(D2 + " 10:30", "%Y-%m-%d %H:%M")
    p = abrir_cita(b, con_cita(D2, "09:00", 60, sub={"status": "trial", "until": ts_rel(BASE, 9)}), ahora=ahora)
    b.ok("Cita que ya pasó: lo dice", "ya pasó" in txt(p, "#mcb"))

    # Códigos malos
    p = abrir_cita(b, con_cita(D2), tk="zzzzzzzzzzzzzzzzzzzzzzzz")
    b.ok("Código que no existe: 'No encontramos esta cita'", "No encontramos esta cita" in txt(p, "#mcb"))
    p = abrir_cita(b, con_cita(D2), tk="abc", negar=["biz/U1/mine/abc"])
    b.ok("Código corto (las reglas niegan la lectura): 'No encontramos esta cita'", "No encontramos esta cita" in txt(p, "#mcb"))
    p = abrir_cita(b, con_cita(D2), tk=TK.upper() + "%20")
    b.ok("Código en mayúsculas (o con un espacio al final) se limpia y abre la cita", "Hola Ana" in txt(p, "#mcb"), txt(p, "#mcb")[:80])
    b.ok("Mi cita sin errores de JS", not p.errs, p.errs[:3])
