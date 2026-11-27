"""PENDIENTE (falla hoy): el dueño pone como dirección el link de Google Maps (lo que da el botón "Compartir").
Es muy común: en la app el campo dice "Dirección o zona" y no impide pegar un link.
- Clásica: la página se puede mover de lado en el celular (desborde horizontal de ~40 px en 360 px).
- Pro: el dato rápido dice "📍 https://maps.app.goo.gl/".
- Ambas: "Cómo llegar" busca en Google Maps el TEXTO del link + ", Costa Rica" en vez de abrir el link."""
from ayuda_web import Banco, armar, abrir, JS_DESBORDE, hrefs

LINK = "https://maps.app.goo.gl/9xQ2bVvUuJkK3mZp8"

with Banco() as b:
    for lay in (None, "clasica"):
        L = lay or "pro"
        p = abrir(b, armar(layout=lay, addr=LINK), ancho=360)
        d = p.evaluate(JS_DESBORDE)
        sw = p.evaluate("()=>document.documentElement.scrollWidth")
        b.ok(L + ": con link de Maps como dirección no hay desborde horizontal en 360 px", not d and sw <= 360, [sw, d[:2]])
        mapa = [h for h in hrefs(p, "#page a") if "maps" in (h or "")]
        b.ok(L + ": 'Cómo llegar' abre el link de Maps del negocio", mapa and mapa[0] == LINK, mapa)
        if not lay:
            st = p.evaluate("()=>document.querySelector('.pr-stat:nth-child(2)').innerText")
            b.ok("pro: el dato rápido no muestra un pedazo de link", "http" not in st, st)
        p.context.close()
