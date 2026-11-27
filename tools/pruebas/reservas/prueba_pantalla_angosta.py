"""Pantalla angosta (360 x 640): en cada paso de la reserva y de 'Mi cita' no hay desborde horizontal y el botón
Siguiente/Confirmar se ve completo dentro de la pantalla. Con nombres largos (con espacios), vehículo y domicilio."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1 = dia(1)
L = "con encerado premium, aspirado interior profundo y lavado de motor incluido"
MIDE = """(sel)=>{var w=document.documentElement.clientWidth,out=[];
 document.querySelectorAll('body *').forEach(function(e){var r=e.getBoundingClientRect();
   if(r.width&&r.right>w+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.days,.cats,.tl,.mapc,.cf'))out.push((e.id||e.className||e.tagName)+':'+Math.round(r.right))});
 var n=sel&&document.querySelector(sel),nb=n?n.getBoundingClientRect():null;
 return {sw:document.documentElement.scrollWidth,w:w,fuera:out.slice(0,4),boton:nb?(nb.left>=0&&nb.right<=w&&nb.top>=0&&nb.bottom<=innerHeight&&nb.height>30):null}}"""

with Banco() as b:
    def ver(p, paso, sel="#nx"):
        r = p.evaluate(MIDE, sel)
        b.ok("360 px · %s: sin desborde horizontal" % paso, r["sw"] <= r["w"] and not r["fuera"], r)
        if sel:
            b.ok("360 px · %s: el botón se ve completo" % paso, r["boton"], r)

    datos, _ = negocio_cr(name="Lavacar y Detailing " + L[:30], addr="San José, " + L, home=True, zones=[{"n": "Zona " + L, "fee": 2000}],
                          mods={"vehiculo": True}, veh=[{"n": "Sedán o hatchback", "x": 0}, {"n": "SUV o camioneta grande", "x": 5000}, {"n": "Pick-up o 4x4", "x": 8000}],
                          services=[{"id": "s%d" % i, "n": "Servicio " + L, "p": 150000, "d": 480 if i == 0 else 30, "g": "Grupo %d de servicios" % (i % 3), "vx": True} for i in range(8)],
                          dep={"tel": "83204942", "amt": 5000})
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(), ancho=360, alto=640); activar_reglas(p)
    ver(p, "portada", "#go1")
    ir_a_servicios(p); ver(p, "vehículo")
    p.click('#vehs [data-v="1"]'); siguiente(p); elegir_servicios(p, [0]); ver(p, "servicios")
    siguiente(p); p.select_option("#zsel", "0"); p.fill("#ad", "Casa 14, portón negro"); ver(p, "ubicación")
    siguiente(p, 600); ver(p, "día y hora")
    elegir_dia_hora(p, D1, "08:00"); siguiente(p); ver(p, "tus datos")
    llenar_datos(p, nombre="María Fernanda Rodríguez Villalobos"); siguiente(p); ver(p, "resumen")
    confirmar(p)
    b.ok("360 px: la reserva se completa", p.locator("#ok").is_visible())
    ver(p, "¡Listo!", "#okWa")

    tk = list(jobs(p).values())[0]["tk"]
    p = abrir_cita(b, estado(p), tk=tk, ancho=360, alto=640)
    ver(p, "Mi cita", "#mcMove")
    p.click("#mcMove"); p.wait_for_timeout(600); p.locator("#mhrs button").first.click(); p.wait_for_timeout(200)
    ver(p, "Mi cita · mover", None)
    p.locator("#mGo").scroll_into_view_if_needed()
    ver(p, "Mi cita · mover (al bajar)", "#mGo")
    b.ok("360 px sin errores de JS", not p.errs, p.errs[:3])
