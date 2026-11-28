"""Segunda revisión Opus: (A) con el selector de plan tocado y cambios sin guardar, si entra un pago por fuera, Guardar
no pisa el plan (E.stale). (B) Si el link del negocio cambia por fuera, la ficha no se recarga sola (habría que volver a
leer las fotos): avisa. (C) El aviso de «cambió» y el del link roto van en cajas aparte. (D) Sin plan: el botón principal
dice lo que hace (prueba gratis) y deja la ficha lista para guardar."""
from ayuda import Banco, nuevo, errores

SET = """window.__set=function(sel,v){var e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))};"""
PAGO = "()=>db.doc('subs/b_tend').set({plan:'mensual',tier:'arranque',status:'active',price:500,months:1,until:TS.fromMillis(Date.now()+31*864e5)},{merge:true})"
with Banco() as b:
    p = nuevo(b, hash_="negocio/b_tend", espera=2200, antes=SET)
    p.evaluate("()=>__set('#pPl','trial')"); p.evaluate("()=>__set('#eA','Zona A')"); p.wait_for_timeout(100)
    b.ok("A: tocar el plan lo marca como tocado", p.evaluate("()=>E.planTouched===true"))
    p.evaluate(PAGO); p.wait_for_timeout(700)
    b.ok("A: la ficha queda marcada como vieja", p.evaluate("()=>E.stale===true"))
    p.evaluate("()=>{window.__CQ=[true];document.getElementById('eGo').click()}"); p.wait_for_timeout(1500)
    s = p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB['subs/b_tend']))")
    b.ok("A: Guardar no pisa el plan pagado (mensual / active)", s.get("plan") == "mensual" and s.get("status") == "active" and s.get("tier") == "arranque", s)
    b.ok("A: sí guardó la dirección", p.evaluate("()=>window.__DB['biz/b_tend'].addr") == "Zona A")
    p.context.close()

    p = nuevo(b, hash_="negocio/b_tend", espera=2200, antes=SET)
    n0 = p.evaluate("()=>(window.__READS||[]).length")
    p.evaluate("()=>db.doc('biz/b_tend').set({slug:'otro-link-nuevo'},{merge:true})"); p.wait_for_timeout(700)
    b.ok("B: link cambiado por fuera → avisa en vez de recargar sola", p.evaluate("()=>E.stale===true") and "cambió" in p.text_content("#fWarn"), p.text_content("#fWarn")[:80])
    b.ok("B: la ficha sigue con el link que tenía abierta", p.evaluate("()=>E.slug") != "otro-link-nuevo")
    b.ok("C: hay una caja aparte para el aviso del link", p.evaluate("()=>!!document.getElementById('fWarnPub')&&document.getElementById('fWarnPub')!==document.getElementById('fWarn')"))
    b.ok("B: sin errores", not errores(p), errores(p)[:3])
    p.context.close()

    p = nuevo(b, hash_="negocio/b_nosub", espera=2200, antes=SET)
    bt = p.evaluate("()=>{var x=document.querySelector('#ed [data-u=\"mensNone\"]');return x?x.textContent:null}")
    b.ok("D: sin plan, el botón principal dice «Poner en prueba gratis»", bt == "Poner en prueba gratis", bt)
    p.evaluate("()=>document.querySelector('#ed [data-u=\"mensNone\"]').click()"); p.wait_for_timeout(300)
    b.ok("D: deja la barra Guardar a la vista", p.evaluate("()=>{var s=document.getElementById('fSave');return !!s&&!s.hidden}"))
    p.evaluate("()=>document.getElementById('eGo').click()"); p.wait_for_timeout(1500)
    s = p.evaluate("()=>{var x=window.__DB['subs/b_nosub'];return x?JSON.parse(JSON.stringify(x)):null}")
    b.ok("D: al guardar queda en prueba gratis, sin total ni modelo viejo", bool(s) and s.get("plan") == "trial" and s.get("status") == "trial" and "total" not in s, s)
    b.ok("D: sin errores", not errores(p), errores(p)[:3])
