"""Novedades: el panel abre, muestra Lo nuevo, Próximamente y Arreglos con los textos escritos a mano,
sin «undefined» ni HTML roto, y Próximamente no menciona cosas internas (admin)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app

with Banco() as b:
    datos, usuario = negocio()
    p = abrir_app(b, datos, usuario, "turbo")
    n = p.evaluate("()=>({v:CITALY_NEWS.v,it:CITALY_NEWS.items.length,fx:CITALY_NEWS.fixes.length,so:CITALY_NEWS.soon.length})")
    b.ok("Novedades: hay novedades, arreglos y próximamente", n["it"] >= 40 and n["fx"] >= 20 and n["so"] >= 8, n)
    p.evaluate("()=>newsSheet()"); p.wait_for_timeout(400)
    # Solo se ven las 5 más nuevas; las demás quedan detrás de «Mostrar más»: se lee todo el contenido
    t = p.evaluate("()=>document.getElementById('nBody').textContent")
    b.ok("Lo nuevo: sale Horas exactas (aunque esté en «Mostrar más»)", "Horas exactas para reservar" in t, t[:300])
    p.click("#ntS"); p.wait_for_timeout(200); t = p.inner_text("#nBody")
    b.ok("Próximamente: sale Horario que cambia por semana", "Horario que cambia por semana" in t, t[:300])
    b.ok("Próximamente: no habla del admin", "admin" not in t.lower(), t)
    ok_fx = p.evaluate("()=>!!document.getElementById('ntF')")
    if ok_fx:
        p.click("#ntF"); p.wait_for_timeout(200); t = p.inner_text("#nBody")
        b.ok("Arreglos: sale el de Servicios y precios", "solo se podía editar o borrar el primer servicio" in t, t[:300])
    b.ok("Arreglos: pestaña visible", ok_fx)
    h = p.inner_html("#sh")
    b.ok("Sin undefined/NaN en el panel", "undefined" not in h and "NaN" not in h)
