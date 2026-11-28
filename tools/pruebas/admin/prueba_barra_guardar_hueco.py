"""ARREGLADO (era pendiente de la revisión Opus, M2): en el celular, con cambios sin guardar, entre la barra Guardar y la barra de abajo queda
una franja de 3 px donde se asoma el contenido. Causa: .a-save usa bottom: var(--navh)=64px, pero la barra .a-nav mide
61 px (4 + 52 + 4 de padding + 1 de borde). Arreglo: --navh:61px, o min-height de .a-nav = var(--navh) con box-sizing,
o .a-save{bottom:calc(var(--navh) - 3px…)}; mejor: que la barra de abajo tenga altura fija = --navh."""
from ayuda import Banco, nuevo

with Banco() as b:
    for w in (360, 390):
        p = nuevo(b, hash_="negocio/b_full", espera=2200, ancho=w, alto=740)
        p.click('#ed .a-sec[data-sec="web"] > summary'); p.fill("#wTg", "x"); p.wait_for_timeout(200)
        # con el teclado abierto (foco en el campo) la barra de abajo se esconde y Guardar baja al borde
        k = p.evaluate("()=>[getComputedStyle(document.getElementById('nav')).display,Math.round(innerHeight-document.getElementById('fSave').getBoundingClientRect().bottom)]")
        b.ok("%d px: con el teclado abierto se esconde la barra de abajo y Guardar queda al borde" % w, k == ["none", 0], k)
        p.evaluate("()=>document.activeElement.blur()"); p.wait_for_timeout(200)
        r = p.evaluate("()=>{const n=document.getElementById('nav').getBoundingClientRect(),s=document.getElementById('fSave').getBoundingClientRect();return n.top-s.bottom}")
        b.ok("%d px: la barra Guardar queda pegada a la barra de abajo (sin hueco)" % w, abs(r) < 0.5, "hueco de %s px" % r)
