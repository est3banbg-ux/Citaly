"""ERROR: en 'Mi cita', al cambiar el día, no se respetan los días que el negocio atiende cada zona
(zones[].days). Al reservar, un cliente de Cartago (solo sábados) solo puede elegir sábados; pero desde su link
puede moverla a un martes o miércoles y el negocio termina con una cita en una zona a la que ese día no va.
Arreglado el 26 nov 2026. Arreglo: en freeFor(), descartar los días fuera de la zona de la cita (MC.zone) (ver reporte)."""
import datetime, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

sab = [dia(i) for i in range(15) if (BASE + datetime.timedelta(days=i)).isoweekday() == 6]

with Banco() as b:
    datos = con_cita(sab[0], "09:00", 60, mine_extra={"zone": "Cartago"}, job_extra={"zone": "Cartago"},
                     home=True, zones=[{"n": "Heredia", "fee": 0}, {"n": "Cartago", "fee": 3000, "days": [6]}])
    # Al reservar: solo sábados (esto sí funciona)
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p); p.select_option("#zsel", "1"); p.fill("#ad", "Cartago centro"); siguiente(p, 600)
    on = p.evaluate("()=>Array.from(document.querySelectorAll('#days button:not([disabled])')).map(b=>b.dataset.d)")
    b.ok("Reservar en Cartago: solo sábados (control)", on and set(on) <= set(sab), on)
    # Al mover desde 'Mi cita'
    p = abrir_cita(b, datos)
    p.click("#mcMove"); p.wait_for_timeout(600)
    on = p.evaluate("()=>Array.from(document.querySelectorAll('#mdays button:not([disabled])')).map(b=>b.dataset.d)")
    b.ok("Mi cita en Cartago: al cambiar solo deja elegir sábados", on and set(on) <= set(sab), [d for d in on if d not in sab])
