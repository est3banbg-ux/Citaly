"""ARREGLADO (era pendiente de la revisión Opus): Guardar la ficha pisa el plan que cambió por fuera.
Ficha de un negocio en prueba abierta con un cambio sin guardar; entra el pago de Polar (subs pasa a plan "mensual",
tier, price…). Sale el aviso "Este negocio cambió…", pero Guardar igual escribe subs.plan = "trial" encima.
Resultado: plan "trial" + status "active" (no cuenta en el ingreso fijo, pub queda con cap de Nitro).
Lo mismo pasa en el admin clásico (sin aviso). Arreglo: al guardar un negocio que ya existe, escribir plan/total/demo
en subs SOLO si se cambió el selector de plan (o leer SUBS[bid] al guardar)."""
from ayuda import Banco, nuevo

SET = """window.__set=function(sel,v){var e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))};"""
with Banco() as b:
    p = nuevo(b, hash_="negocio/b_tend", espera=2200, antes=SET)
    p.evaluate("()=>__set('#eA','Zona nueva')"); p.wait_for_timeout(100)
    p.evaluate("()=>db.doc('subs/b_tend').set({plan:'mensual',tier:'arranque',status:'active',price:500,months:1,until:TS.fromMillis(Date.now()+31*864e5)},{merge:true})")
    p.wait_for_timeout(600)
    b.ok("Sale el aviso de que el negocio cambió", "cambió" in p.text_content("#fWarn"))
    p.evaluate("()=>document.getElementById('eGo').click()"); p.wait_for_timeout(1500)
    s = p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB['subs/b_tend']))")
    b.ok("Guardar no pisa el plan que puso el pago (sigue 'mensual')", s.get("plan") == "mensual", s)
    b.ok("Sí guardó la dirección", p.evaluate("()=>window.__DB['biz/b_tend'].addr") == "Zona nueva")
