"""ARREGLADO (era pendiente de la revisión Opus): negocio SIN documento subs → la ficha preselecciona "Standard · ₡150 000 (modelo viejo)"
con "Total acordado 150000", y Guardar crea subs {plan:"standard", total:150000, until:+100 años}: el modelo viejo
(prohibido) y una deuda falsa de ₡150 000 en Plata/"Con saldo". Igual que el clásico, pero contradice la regla
"planes del modelo viejo solo para quien ya los tiene". Arreglo: sin subs, no ofrecer planes viejos y al guardar
sin tocar el selector no escribir plan/total (o crear la prueba como en un negocio nuevo)."""
from ayuda import Banco, nuevo

with Banco() as b:
    p = nuevo(b, hash_="negocio/b_nosub", espera=2200)
    ops = p.evaluate("()=>[...document.querySelectorAll('#pPl option')].map(o=>o.value)")
    b.ok("Sin subs: no se ofrecen planes del modelo viejo", not any(o in ("promo", "standard", "pers") for o in ops), ops)
    p.evaluate("()=>{const e=document.getElementById('eA');e.value='Barrio';e.dispatchEvent(new Event('input',{bubbles:true}))}")
    p.evaluate("()=>document.getElementById('eGo').click()"); p.wait_for_timeout(1500)
    s = p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB['subs/b_nosub']||null))")
    b.ok("Guardar no crea un subs del modelo viejo ni una deuda de instalación", not s or (s.get("plan") not in ("promo", "standard", "pers") and not s.get("total")), s)
