"""Reserva de punta a punta haciendo clic como un cliente: servicio -> día y hora -> datos -> confirmar.
Revisa lo que se escribe (cita, cupos de 30 min, hold del teléfono, "Mi cita") y que total, duración y horas
bloqueadas calcen. Todas las escrituras pasan por una imitación de firestore.rules (cliente sin sesión)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1 = dia(1)


def una(p):
    js = jobs(p)
    return (list(js.items()) or [(None, {})])[0]


with Banco() as b:
    # 1) Un servicio
    datos, _ = negocio_cr()
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    reservar(p, [0], D1, "09:00", nombre="  Ana Pérez  ", tel="8888-7777", nota="Portón negro")
    jid, j = una(p)
    db = estado(p)
    b.ok("1 servicio: sale la pantalla de ¡Listo!", p.locator("#ok").is_visible())
    b.ok("1 servicio: la cita se guarda con lo elegido",
         j.get("date") == D1 and j.get("time") == "09:00" and j.get("total") == 8000 and j.get("dur") == 60 and j.get("items") == ["Lavado básico"]
         and j.get("st") == "Por confirmar" and j.get("web") is True and j.get("cli") == "Ana Pérez" and j.get("tel") == "88887777" and j.get("note") == "Portón negro", j)
    b.ok("1 servicio: bloquea 9:00 y 9:30 a nombre de esa cita", slots_de(p, jid) == [D1 + "_0900", D1 + "_0930"] and slots_de(p) == slots_de(p, jid), slots_de(p))
    h = db.get("biz/U1/holds/88887777", {})
    b.ok("1 servicio: el teléfono queda apartado hasta que termina la cita (10:00)", h.get("job") == jid and h.get("until", {}).get("__ts") == ms_cr(BASE.replace(day=9, hour=10)), h)
    tk = j.get("tk", "")
    m = db.get("biz/U1/mine/" + tk, {})
    b.ok("1 servicio: 'Mi cita' se crea con el mismo código que la cita", len(tk) == 24 and m.get("job") == jid and m.get("st") == "activa" and m.get("date") == D1 and m.get("time") == "09:00", m)
    b.ok("1 servicio: el link de 'Mi cita' se muestra y lleva el código", p.locator("#mylink").is_visible() and p.input_value("#mlv").endswith("?n=prueba&cita=" + tk))
    wa = p.get_attribute("#okWa", "href") or ""
    b.ok("1 servicio: el WhatsApp de aviso va al negocio y lleva el link", "phone=50688888888" in wa and tk in wa, wa[:200])
    b.ok("1 servicio: las reglas reales aceptarían todas las escrituras", not negado(p), negado(p))
    b.ok("1 servicio: sin errores de JS", not p.errs, p.errs[:3])

    # 2) Varios servicios: suma precio y duración
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    ir_a_servicios(p); elegir_servicios(p, [0, 1])
    b.ok("Varios: la barra suma ₡23 000 y 2 h 30 min", txt(p, "#tot") == "₡23 000" and "2 h 30 min" in txt(p, "#tl"), [txt(p, "#tot"), txt(p, "#tl")])
    siguiente(p, 600); elegir_dia_hora(p, D1, "14:00"); siguiente(p); llenar_datos(p); siguiente(p)
    b.ok("Varios: el resumen muestra total y duración", "₡23 000" in txt(p, "#sum") and "2 h 30 min" in txt(p, "#sum"), txt(p, "#sum"))
    confirmar(p)
    jid, j = una(p)
    b.ok("Varios: la cita guarda total 23000 y 150 min", j.get("total") == 23000 and j.get("dur") == 150 and len(j.get("lines", [])) == 2, j)
    b.ok("Varios: bloquea de 2:00 a 4:30 (5 cupos)", slots_de(p, jid) == [D1 + "_" + t for t in ("1400", "1430", "1500", "1530", "1600")], slots_de(p))
    b.ok("Varios: reglas OK", not negado(p), negado(p))

    # 3) Servicios de 15 y 45 min, y uno de 8 horas
    svc = [{"id": "a", "n": "Revisión rápida", "p": 3000, "d": 15}, {"id": "b", "n": "Encerado", "p": 9000, "d": 45},
           {"id": "c", "n": "Tratamiento cerámico", "p": 150000, "d": 480}]
    datos3, _ = negocio_cr(services=svc)
    p = b.abrir("/r/?n=prueba", datos3, antes=reloj()); activar_reglas(p)
    reservar(p, [0], D1, "08:00")
    jid, j = una(p)
    b.ok("15 min: ocupa un solo cupo de 30", slots_de(p, jid) == [D1 + "_0800"] and j.get("dur") == 30, [slots_de(p), j.get("dur")])
    p = b.abrir("/r/?n=prueba", datos3, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [0, 1])
    b.ok("15 + 45 min: la barra dice 1 h", "1 h" in txt(p, "#tl"), txt(p, "#tl"))
    b.ok("15 + 45 min: cada 30 min hasta las 4:00", p.evaluate("(d)=>freeStarts(d)", D1)[-1] == "16:00")
    p = b.abrir("/r/?n=prueba", datos3, antes=reloj()); activar_reglas(p)
    ir_a_servicios(p); elegir_servicios(p, [2])
    b.ok("8 horas: solo se ofrecen 8:00, 8:30 y 9:00 (para terminar a las 5)", p.evaluate("(d)=>freeStarts(d)", D1) == ["08:00", "08:30", "09:00"], p.evaluate("(d)=>freeStarts(d)", D1))
    siguiente(p, 600); elegir_dia_hora(p, D1, "09:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("8 horas: bloquea 16 cupos de 9:00 a 4:30", len(slots_de(p, jid)) == 16 and slots_de(p, jid)[-1] == D1 + "_1630", slots_de(p))
    b.ok("8 horas: reglas OK", not negado(p), negado(p))

    # 4) Precio 0 = Por cotizar
    datos4, _ = negocio_cr(services=[{"id": "q", "n": "Diagnóstico", "p": 0, "d": 60}])
    p = b.abrir("/r/?n=prueba", datos4, antes=reloj()); activar_reglas(p)
    b.ok("Por cotizar: en la lista de precios dice Consultar", "Consultar" in txt(p, "#prices"))
    ir_a_servicios(p); elegir_servicios(p, [0])
    b.ok("Por cotizar: la barra dice Por cotizar", txt(p, "#tot") == "Por cotizar", txt(p, "#tot"))
    siguiente(p, 600); elegir_dia_hora(p, D1, "10:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("Por cotizar: se guarda total 0 y las reglas lo aceptan", j.get("total") == 0 and not negado(p), [j.get("total"), negado(p)])

    # 5) Categorías (g)
    svc5 = [{"id": "a", "n": "Lavado", "p": 5000, "d": 30, "g": "Lavados"}, {"id": "b", "n": "Encerado", "p": 9000, "d": 30, "g": "Lavados"},
            {"id": "c", "n": "Focos", "p": 15000, "d": 60, "g": "Vidrios"}]
    p = b.abrir("/r/?n=prueba", negocio_cr(services=svc5)[0], antes=reloj()); activar_reglas(p)
    ir_a_servicios(p)
    b.ok("Categorías: se ven las pestañas y solo los de la primera", p.locator("#svcs .cat").count() == 2 and p.locator("#svcs .svc").count() == 2)
    elegir_servicios(p, [0]); p.click('#svcs [data-cat="Vidrios"]'); p.wait_for_timeout(150); elegir_servicios(p, [2])
    b.ok("Categorías: lo elegido en otra pestaña se mantiene (₡20 000)", txt(p, "#tot") == "₡20 000" and txt(p, '#svcs [data-cat="Lavados"] .bd') == "1", txt(p, "#tot"))
    siguiente(p, 600); elegir_dia_hora(p, D1, "08:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("Categorías: la cita lleva los 2 servicios y 90 min → 3 cupos", j.get("items") == ["Lavado", "Focos"] and len(slots_de(p, jid)) == 3, [j.get("items"), slots_de(p)])

    # 6) Módulo de vehículo: extra x, servicios con vx y precio propio por tamaño (vp)
    svc6 = [{"id": "a", "n": "Lavado", "p": 8000, "d": 60, "vx": True}, {"id": "b", "n": "Cerámico", "p": 20000, "d": 90, "vx": True, "vp": [{"n": "SUV", "p": 30000}]},
            {"id": "c", "n": "Focos", "p": 10000, "d": 30}]
    datos6, _ = negocio_cr(mods={"vehiculo": True}, veh=[{"n": "Sedán o hatchback", "x": 0}, {"n": "SUV", "x": 5000}], services=svc6)
    p = b.abrir("/r/?n=prueba", datos6, antes=reloj()); activar_reglas(p)
    ir_a_servicios(p)
    b.ok("Vehículo: primero pide el tipo", "Tu vehículo" in txt(p, "#pt"))
    siguiente(p)
    b.ok("Vehículo: sin elegir no avanza", "elige el tipo" in txt(p, "#er"), txt(p, "#er"))
    p.fill("#vmod", "Toyota RAV4 2020"); p.wait_for_timeout(200)
    b.ok("Vehículo: detecta SUV por el modelo", p.get_attribute('#vehs [data-v="1"]', "aria-pressed") == "true")
    siguiente(p); elegir_servicios(p, [0, 1, 2])
    b.ok("Vehículo: SUV suma +5000 al lavado, usa ₡30 000 en cerámico y deja focos igual (₡53 000)", txt(p, "#tot") == "₡53 000", txt(p, "#tot"))
    p.click("#addCarB"); p.wait_for_timeout(300); p.click('#vehs [data-v="0"]'); p.wait_for_timeout(100); siguiente(p); elegir_servicios(p, [0])
    b.ok("Vehículo: segundo carro (sedán) suma ₡8 000 → ₡61 000", txt(p, "#tot") == "₡61 000" and "2 carros" in txt(p, "#tl"), [txt(p, "#tot"), txt(p, "#tl")])
    siguiente(p, 600); elegir_dia_hora(p, D1, "08:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("Vehículo: la cita guarda 61000, 4 h y los dos carros", j.get("total") == 61000 and j.get("dur") == 240 and j.get("veh", "").startswith("SUV · Toyota RAV4 2020 + Sedán"), [j.get("total"), j.get("dur"), j.get("veh")])
    b.ok("Vehículo: 8 cupos (8:00 a 11:30) y reglas OK", len(slots_de(p, jid)) == 8 and not negado(p), [slots_de(p), negado(p)])

    # 7) A domicilio con zonas y costo extra + adelanto por SINPE
    zonas = [{"n": "Heredia", "fee": 0}, {"n": "Cartago", "fee": 3000}, {"n": "Grecia", "ask": True}]
    datos7, _ = negocio_cr(home=True, zones=zonas, dep={"tel": "83204942", "amt": 5000, "name": "Taller"})
    p = b.abrir("/r/?n=prueba", datos7, antes=reloj()); activar_reglas(p)
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p)
    b.ok("Domicilio: pide la zona", "Ubicación" in txt(p, "#pt"))
    siguiente(p)
    b.ok("Domicilio: sin zona no avanza", "elige tu zona" in txt(p, "#er"), txt(p, "#er"))
    p.select_option("#zsel", "-2"); p.wait_for_timeout(150); siguiente(p)
    b.ok("Domicilio: 'mi zona no aparece' no deja seguir", "no la cubrimos" in txt(p, "#er"), txt(p, "#er"))
    p.select_option("#zsel", "1"); p.fill("#ad", "Del parque 200 m norte"); p.wait_for_timeout(150)
    b.ok("Domicilio: Cartago suma ₡3 000 (₡11 000)", txt(p, "#tot") == "₡11 000", txt(p, "#tot"))
    siguiente(p, 600); elegir_dia_hora(p, D1, "11:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("Domicilio: la cita guarda zona, costo y dirección", j.get("zone") == "Cartago" and j.get("fee") == 3000 and j.get("total") == 11000 and j.get("addr") == "Del parque 200 m norte", j)
    b.ok("Adelanto: se muestra el monto y el SINPE", p.locator("#okDep").is_visible() and "₡5 000" in txt(p, "#okDep") and "83204942" in txt(p, "#okDep"), txt(p, "#okDep"))
    b.ok("Domicilio: reglas OK", not negado(p), negado(p))
    datos7b, _ = negocio_cr(home=True, zones=zonas, dep={"tel": "83204942", "pct": 50})
    p = b.abrir("/r/?n=prueba", datos7b, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [1]); siguiente(p); p.select_option("#zsel", "2"); p.fill("#ad", "Grecia centro")
    b.ok("Zona 'consultar': no suma costo (₡15 000)", txt(p, "#tot") == "₡15 000", txt(p, "#tot"))
    siguiente(p, 600); elegir_dia_hora(p, D1, "11:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    b.ok("Adelanto 50%: ₡7 500", "₡7 500" in txt(p, "#okDep"), txt(p, "#okDep"))

    # 8) Cupos por hora (lanes=2)
    datos8, _ = negocio_cr(lanes=2)
    datos8["biz/U1/jobs/J9"] = {"date": D1}
    datos8["biz/U1/slots/%s_0900" % D1] = {"date": D1, "t": "0900", "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos8, antes=reloj()); activar_reglas(p)
    ir_a_servicios(p); elegir_servicios(p, [0])
    b.ok("Cupos: con 1 de 2 ocupado, las 9:00 se siguen ofreciendo", "09:00" in p.evaluate(LIBRES, D1))
    siguiente(p, 600); elegir_dia_hora(p, D1, "09:00"); siguiente(p); llenar_datos(p); siguiente(p); confirmar(p)
    jid, j = una(p)
    b.ok("Cupos: usa el segundo cupo de las 9:00 y el primero de las 9:30", slots_de(p, [k for k in jobs(p) if k != "J9"][0]) == [D1 + "_0900_1", D1 + "_0930"], slots_de(p))
    b.ok("Cupos: reglas OK (carril menor que los cupos)", not negado(p), negado(p))
    p = b.abrir("/r/?n=prueba", estado(p), antes=reloj())
    p.evaluate("()=>{S.pick=[0]}")
    b.ok("Cupos: con los 2 ocupados las 9:00 ya no salen", "09:00" not in p.evaluate(LIBRES, D1) and "08:30" not in p.evaluate(LIBRES, D1), p.evaluate(LIBRES, D1))

    # 9) Más servicios que el tope de 10 por cita
    datos9, _ = negocio_cr(services=[{"id": "s%d" % i, "n": "Servicio %d" % i, "p": 1000, "d": 30} for i in range(12)])
    p = b.abrir("/r/?n=prueba", datos9, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, range(11)); siguiente(p)
    b.ok("Tope: con 11 servicios no deja avanzar", "máximo 10" in txt(p, "#er") and "Servicios" in txt(p, "#pt"), txt(p, "#er"))
    elegir_servicios(p, [10]); siguiente(p, 600)
    b.ok("Tope: con 10 sí avanza", "Día y hora" in txt(p, "#pt"))
    b.ok("Sin errores de JS en todo", not p.errs, p.errs[:3])
