"""Clientes: agregar a mano, «Varios» (pegar lista), buscar por nombre/teléfono/placa, «Les toca volver»
(clientes fijos y servicios con aviso de renovación) y que la lista privada no se publique en pub/."""
import datetime, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, html_mal, escribir, clic


def hace(dias):
    return (datetime.date.today() - datetime.timedelta(days=dias)).isoformat()


def lista(p):
    return p.evaluate("()=>Array.from(document.querySelectorAll('#cList .cl b')).map(e=>e.textContent)")


def buscar(p, q):
    p.evaluate("q=>{var e=document.getElementById('cq');e.value=q;e.dispatchEvent(new Event('input'))}", q)
    return lista(p)


with Banco() as b:
    datos, usuario = negocio()
    datos["biz/U1/jobs/J1"] = {"id": "J1", "cli": "Carlos Mora", "tel": "88881111", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}], "date": hace(10), "time": "09:00", "dur": 60, "total": 8000, "st": "Lista", "at": 1}
    p = abrir_app(b, datos, usuario, "prueba")
    p.evaluate("()=>go('clientes')"); p.wait_for_timeout(300)
    b.ok("Clientes: el cliente de una cita aparece solo", lista(p) == ["Carlos Mora"], lista(p))

    # Agregar a mano (negocio de carros: pide placa y carro)
    p.evaluate("()=>document.getElementById('cAdd').click()"); p.wait_for_timeout(200)
    escribir(p, "#kN", "José Núñez"); escribir(p, "#kT", "7777-2222"); escribir(p, "#kPl", "bcd123"); escribir(p, "#kCar", "Hilux gris")
    clic(p, '#kC [data-c="30"]'); clic(p, "#kSave"); p.wait_for_timeout(600)
    cl = p.evaluate("()=>window.__DB['biz/U1'].clis")
    b.ok("Agregar a mano: guarda nombre, número limpio, placa en mayúscula, carro y cada cuánto", cl and cl[0]["n"] == "José Núñez" and cl[0]["tel"] == "77772222" and cl[0]["pl"] == "BCD123" and cl[0]["car"] == "Hilux gris" and cl[0]["cada"] == 30, cl)
    b.ok("Agregar a mano: aparece en la lista", "José Núñez" in lista(p), lista(p))
    b.ok("La lista de clientes NO se publica en pub/prueba", "clis" not in p.evaluate("()=>window.__DB['pub/prueba']"))
    # Duplicado por número
    p.evaluate("()=>document.getElementById('cAdd').click()"); p.wait_for_timeout(200)
    escribir(p, "#kN", "Otro José"); escribir(p, "#kT", "77772222"); clic(p, "#kSave"); p.wait_for_timeout(300)
    b.ok("Agregar a mano: no deja repetir un número", "Ya tienes a «José Núñez»" in p.evaluate("()=>document.getElementById('kErr').textContent") and len(p.evaluate("()=>window.__DB['biz/U1'].clis")) == 1)
    p.evaluate("()=>closeSheet(true)")

    # Varios: pegar lista
    p.evaluate("()=>document.getElementById('cBulk').click()"); p.wait_for_timeout(200)
    txt = "Juan Pérez 8888 3333\nMaría Rodríguez 7777-4444\n+506 6000 5555 Pedro Solís\nSolo Nombre\nJuan Pérez 8888 3333\nJosé repetido 7777 2222\n\n"
    p.evaluate("t=>{var e=document.getElementById('bkT');e.value=t;e.dispatchEvent(new Event('input'))}", txt)
    r = p.evaluate("()=>[document.getElementById('bkS').textContent,document.getElementById('bkM').textContent]")
    b.ok("Varios: cuenta 4 nuevos y 1 que ya estaba", r[0] == "Agregar 4 clientes" and "1 ya estaban" in r[1], r)
    p.evaluate("()=>{document.getElementById('bkR').value='60';document.getElementById('bkS').click()}"); p.wait_for_timeout(600)
    cl = p.evaluate("()=>window.__DB['biz/U1'].clis")
    got = [(c["n"], c["tel"], c["cada"]) for c in cl]
    b.ok("Varios: guarda nombre y número de cada línea (con +506, guiones y sin número)", got[:4] == [("Juan Pérez", "88883333", 60), ("María Rodríguez", "77774444", 60), ("Pedro Solís", "60005555", 60), ("Solo Nombre", "", 60)] and len(cl) == 5, got)

    # Buscar
    p.evaluate("()=>{CF='all';go('clientes')}"); p.wait_for_timeout(200)
    b.ok("Buscar por nombre sin tilde encuentra «José Núñez»", "José Núñez" in buscar(p, "jose nunez"), lista(p))
    b.ok("Buscar por parte del número", buscar(p, "3333") == ["Juan Pérez"], lista(p))
    b.ok("Buscar por número con guion", buscar(p, "8888-1111") == ["Carlos Mora"], lista(p))
    b.ok("Buscar por placa (minúscula, con guion)", buscar(p, "bcd-12") == ["José Núñez"], lista(p))
    b.ok("Buscar algo que no existe muestra el aviso", buscar(p, "zzzz") == [] and "No encontramos" in p.evaluate("()=>document.getElementById('cList').innerText"))
    buscar(p, "")
    b.ok("Sin errores en Clientes", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])

    # Les toca volver: cliente fijo (cada 30 días) que vino hace 40, y servicio con aviso a los 2 meses (Turbo)
    for plan in ("turbo", "arranque"):
        svcs = [{"id": "s1", "n": "Lavado básico", "p": 8000, "d": 60, "ic": "✨"}, {"id": "s2", "n": "Cerámico", "p": 90000, "d": 240, "ic": "✨", "re": 2}]
        datos, usuario = negocio(services=svcs, clis=[{"id": "c1", "n": "Ana Fija", "tel": "88884444", "cada": 30, "svc": "Lavado básico", "prox": ""}])
        datos["biz/U1/jobs/A1"] = {"id": "A1", "cli": "Ana Fija", "tel": "88884444", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}], "date": hace(40), "time": "09:00", "dur": 60, "total": 8000, "st": "Lista", "at": 1}
        datos["biz/U1/jobs/R1"] = {"id": "R1", "cli": "Roberto Cerámico", "tel": "88885555", "items": ["Cerámico"], "lines": [{"n": "Cerámico", "p": 90000}], "date": hace(75), "time": "09:00", "dur": 240, "total": 90000, "st": "Lista", "at": 1}
        datos["biz/U1/jobs/N1"] = {"id": "N1", "cli": "Nuevo Reciente", "tel": "88886666", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}], "date": hace(5), "time": "09:00", "dur": 60, "total": 8000, "st": "Lista", "at": 1}
        p = abrir_app(b, datos, usuario, plan)
        p.evaluate("()=>go('clientes')"); p.wait_for_timeout(300)
        chips = p.evaluate("()=>document.getElementById('cF').innerText")
        b.ok("Les toca (%s): aparece el filtro «Les toca · 1» por la clienta fija" % plan, "Les toca · 1" in chips, chips)
        p.evaluate("()=>document.querySelector('#cF [data-f=\"toca\"]').click()"); p.wait_for_timeout(200)
        t = p.evaluate("()=>document.getElementById('cList').innerText")
        b.ok("Les toca (%s): el filtro muestra a Ana con «Le tocaba hace N días» (1 mes después de su visita de hace 40 días)" % plan, lista(p) == ["Ana Fija"] and re.search(r"Le tocaba hace (9|10) días", t), [lista(p), t[:200]])
        p.evaluate("()=>document.querySelector('#cF [data-f=\"all\"]').click()"); p.wait_for_timeout(200)
        t = p.evaluate("()=>document.getElementById('cList').innerText")
        if plan == "turbo":
            b.ok("Toca volver (Turbo): Roberto sale con «Le toca volver: Cerámico»", "Le toca volver: Cerámico" in t, t[:300])
        else:
            b.ok("Toca volver (Arranque): sin el aviso de renovación (es de Turbo)", "Le toca volver: Cerámico" not in t, t[:300])
        b.ok("Les toca (%s): sin errores" % plan, not p.errs, p.errs[:2])
