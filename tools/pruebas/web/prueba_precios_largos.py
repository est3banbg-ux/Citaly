"""ERROR: en la plantilla Pro, un servicio con un precio larguísimo (8 o 9 cifras, a 48 px) ensanchaba su tarjeta más que
la pantalla: en un celular de 360 px la tarjeta se salía de lado (se veía cortada), y con 2 o 3 tarjetas pasaba también
en 700 y 960 px. Solo se notaba con la letra real (Bricolage), que es más ancha que la del banco de pruebas.

Ahora las columnas no crecen más que la pantalla y la letra del precio se achica lo justo para que el precio quepa
entero en su tarjeta, en un solo renglón. Los precios normales siguen en 48 px."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda_web import *

LARGO = "Lavacar y Detailing Profesional Hermanos Rodríguez Pérez de Alajuela Centro"
PEGADO = "Supercalifragilisticoespialidosoextralargosinespacios"
ANCHOS = (320, 360, 400, 700, 768, 960, 1280)
MIDE = """()=>{var w=document.documentElement.clientWidth,o={w:w,tarjeta:0,precio:0,nombre:0,partido:0,recorte:0,letra:[]};
 document.querySelectorAll('.pr-plan').forEach(function(c){var r=c.getBoundingClientRect(),s=c.querySelector('.pr-amt span'),h=c.querySelector('h3');
   o.tarjeta=Math.max(o.tarjeta,Math.round(r.right-(w-19)),Math.round(19-r.left));
   if(h)o.nombre=Math.max(o.nombre,Math.round(h.getBoundingClientRect().right-(r.right-24)));
   if(s){var q=s.getBoundingClientRect(),f=parseFloat(getComputedStyle(s).fontSize);o.precio=Math.max(o.precio,Math.round(q.right-(r.right-24)));if(q.height>f*1.4)o.partido++;o.letra.push(Math.round(f));
     /* la caja del precio no puede recortarlo ni pintarle un fondo (pasó al ponerle una clase que ya era del logo) */
     var a=s.parentNode,k=getComputedStyle(a),ar=a.getBoundingClientRect();if(k.overflow!=='visible'||k.backgroundColor!=='rgba(0, 0, 0, 0)'||ar.width<q.width-1||ar.height<q.height-1)o.recorte++}});
 return o}"""
CASOS = [("1 servicio de 9 cifras", [123456789]), ("2 servicios de 9 cifras", [123456789, 987654321]), ("3 servicios de 9 cifras", [123456789, 987654321, 555555555]),
         ("3 servicios de 8 cifras", [12500000, 25000000, 87500000]), ("3 servicios de 7 cifras", [1250000, 2500000, 8750000]), ("4 servicios de 9 cifras", [888888888] * 4)]

with Banco() as b:
    for nombre, precios in CASOS:
        svcs = [{"id": "s%d" % i, "n": LARGO if i == 0 else PEGADO if i == 1 else "Pulido %d" % i, "p": p, "d": 60} for i, p in enumerate(precios)]
        p = b.abrir("/w/?n=prueba", armar(layout="pro", services=svcs), espera=700)
        mal = {}
        for w in ANCHOS:
            p.set_viewport_size({"width": w, "height": 850}); p.wait_for_timeout(120)
            r = p.evaluate(MIDE)
            if r["tarjeta"] > 0 or r["precio"] > 0 or r["nombre"] > 0 or r["partido"] or r["recorte"]:
                mal[w] = r
        b.ok("%s: la tarjeta no se sale de la pantalla y el precio y el nombre caben adentro, enteros, en 320 a 1280 px" % nombre, not mal, mal)
        b.ok("%s: sin errores" % nombre, not p.errs, p.errs[:3]); p.context.close()

    # con «desde» (precio según vehículo): el precio largo también cabe
    p = b.abrir("/w/?n=prueba", armar(layout="pro", mods={"vehiculo": True}, veh=[{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 5000000}],
                                      services=[{"id": "s1", "n": "Blindaje", "p": 123456789, "d": 60, "vx": True}, {"id": "s2", "n": "PPF", "p": 98765432, "d": 60, "vx": True}]), espera=700)
    mal = {}
    for w in ANCHOS:
        p.set_viewport_size({"width": w, "height": 850}); p.wait_for_timeout(120)
        r = p.evaluate(MIDE)
        if r["tarjeta"] > 0 or r["precio"] > 0 or r["partido"] or r["recorte"]:
            mal[w] = r
    b.ok("Con «desde» y precio de 9 cifras: cabe en la tarjeta en todos los anchos", not mal and "desde" in p.inner_text(".pr-amt"), mal); p.context.close()

    # los precios de todos los días no cambian: 48 px en celular, tableta y compu
    p = b.abrir("/w/?n=prueba", armar(layout="pro", services=[{"id": "s1", "n": "Lavado", "p": 8000, "d": 60}, {"id": "s2", "n": "Pulido de focos", "p": 15000, "d": 45},
                                                               {"id": "s3", "n": "Cerámico", "p": 350000, "d": 480}, {"id": "s4", "n": "Diagnóstico", "p": 0, "d": 30}]), espera=700)
    mal = {}
    for w in (360, 400, 700, 768, 960, 1280):
        p.set_viewport_size({"width": w, "height": 850}); p.wait_for_timeout(120)
        r = p.evaluate(MIDE)
        if r["letra"] != [48, 48, 48, 30] or r["tarjeta"] > 0 or r["precio"] > 0 or r["recorte"]:
            mal[w] = r
    b.ok("Precios normales (₡8 000, ₡15 000, ₡350 000 y «Consultar»): misma letra de siempre (48 px y 30 px)", not mal, mal)
    b.ok("Precios normales: sin errores", not p.errs, p.errs[:3]); p.context.close()
