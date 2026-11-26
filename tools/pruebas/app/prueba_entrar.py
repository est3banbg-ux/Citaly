"""La app del dueño abre con sesión iniciada y muestra la agenda sin errores."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio

with Banco() as b:
    datos, usuario = negocio()
    p = b.abrir("/app/", datos, usuario, espera=2500)
    b.ok("Entra y carga el negocio", p.evaluate("()=>!!B&&B.name") == "Taller Prueba", p.errs)
    b.ok("Muestra la pantalla principal", p.evaluate("()=>{var m=document.getElementById('main');return !!m&&!m.hidden}"))
    b.ok("Sin errores de JavaScript al entrar", not p.errs, p.errs[:3])
    p2 = b.abrir("/app/", {}, None, espera=1500)
    b.ok("Sin sesión muestra la pantalla de entrar", p2.evaluate("()=>{var m=document.getElementById('auth');return !!m&&!m.hidden}"), p2.errs)
    b.ok("Sin errores de JavaScript sin sesión", not p2.errs, p2.errs[:3])
