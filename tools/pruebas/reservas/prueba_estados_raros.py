"""Estados raros: negocio que no existe, mensualidad vencida/suspendida/sin registro, reservas pausadas,
sin servicios, sin horario y con campos faltantes. Nada debe reventar ni quedarse cargando."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco


def vis(p):
    return {i: p.locator("#" + i).is_visible() for i in ("load", "nf", "land", "closed", "go1")}


with Banco() as b:
    datos, _ = negocio_cr()
    p = b.abrir("/r/?n=otro-negocio", datos, antes=reloj())
    b.ok("No existe: dice que no lo encontramos", vis(p)["nf"] and not vis(p)["load"] and not vis(p)["land"], vis(p))
    p = b.abrir("/r/", datos, antes=reloj())
    b.ok("Sin ?n=: dice que no lo encontramos", vis(p)["nf"], vis(p))
    p = b.abrir("/r/?n=PRUEBA", datos, antes=reloj())
    b.ok("Slug en mayúsculas: igual abre", vis(p)["land"] and vis(p)["go1"], vis(p))
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(), negar=["pub/"])
    b.ok("Error al leer: mensaje de internet, no se queda cargando", vis(p)["nf"] and "internet" in txt(p, "#nf"), vis(p))

    for nombre, sub in (("vencida", {"status": "active", "until": ts_rel(BASE, -1)}), ("suspendida", {"status": "suspended", "until": ts_rel(BASE, 10)})):
        d, _ = negocio_cr(sub=sub)
        p = b.abrir("/r/?n=prueba", d, antes=reloj())
        b.ok("Mensualidad %s: portada visible, reservas pausadas y WhatsApp" % nombre, vis(p)["land"] and vis(p)["closed"] and not vis(p)["go1"] and "api.whatsapp.com" in (p.get_attribute("#waC", "href") or ""), vis(p))
    d, _ = negocio_cr(); del d["subs/U1"]
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    b.ok("Sin documento de mensualidad: reservas pausadas", vis(p)["closed"] and not vis(p)["go1"], vis(p))
    d, _ = negocio_cr(open=False)
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    b.ok("El dueño pausó las reservas (open=false): pausadas", vis(p)["closed"] and not vis(p)["go1"], vis(p))
    d, _ = negocio_cr(sub={"status": "active", "until": ts_rel(BASE, -1)})
    p = b.abrir("/r/?n=prueba&go=1", d, antes=reloj())
    b.ok("Vencida con ?go=1: no se salta la pausa", not p.locator("#flow").is_visible(), vis(p))

    d, _ = negocio_cr(services=[])
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    ir_a_servicios(p); siguiente(p)
    b.ok("Sin servicios: lo explica y no deja avanzar", "todavía no tiene servicios" in txt(p, "#svcs") and "Servicios" in txt(p, "#pt"))

    d, _ = negocio_cr(hours=[{"on": False, "a": "08:00", "b": "17:00"} for _ in range(7)])
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p, 600)
    b.ok("Todo cerrado: ningún día se puede elegir y ofrece WhatsApp", p.locator("#days button:not([disabled])").count() == 0 and "WhatsApp" in txt(p, "#hEmpty"))
    siguiente(p)
    b.ok("Todo cerrado: no deja avanzar", "elige el día" in txt(p, "#er"), txt(p, "#er"))

    d, _ = negocio_cr()
    pub = d["pub/prueba"]
    for k in ("hours", "mods", "zones", "veh", "slot", "lead", "ahead", "brk", "last", "cierre", "fixed", "color", "logo", "addr", "web"):
        pub.pop(k, None)
    pub["services"] = [{"n": "Servicio sin id ni duración", "p": 5000}]
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p, 600)
    b.ok("Sin horario ni mods ni zonas: carga, deja elegir el servicio y avisa que no hay horas", "Día y hora" in txt(p, "#pt") and "WhatsApp" in txt(p, "#hEmpty"), txt(p, "#pt"))

    d, _ = negocio_cr()
    d["pub/prueba"]["services"] = [{"n": "Sin id", "p": 7000}, {"n": "Otro sin id", "p": 3000, "d": 30}]
    p = b.abrir("/r/?n=prueba", d, antes=reloj()); activar_reglas(p)
    reservar(p, [0, 1], dia(1), "08:00")
    j = list(jobs(p).values())
    b.ok("Servicios sin id ni duración: se reserva con 60 min por defecto (90 en total)", j and j[0]["total"] == 10000 and j[0]["dur"] == 90 and not negado(p), j)

    d, _ = negocio_cr(mods={"vehiculo": True}, veh=[])
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    ir_a_servicios(p)
    b.ok("Módulo de vehículo encendido pero sin tipos: no pide vehículo", "Servicios" in txt(p, "#pt"), txt(p, "#pt"))
    d, _ = negocio_cr(home=True, zones=[])
    p = b.abrir("/r/?n=prueba", d, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p)
    b.ok("Domicilio sin zonas: no muestra la lista de zonas", "Ubicación" in txt(p, "#pt") and not p.locator("#zW").is_visible())
    siguiente(p)
    b.ok("Domicilio sin zonas: pide dirección", "dirección" in txt(p, "#er"), txt(p, "#er"))
    b.ok("Estados raros sin errores de JS", not p.errs, p.errs[:3])
