"""El enlace para entrar a la app dice «Iniciar sesión» (antes «Entrar») en la página de venta, las páginas por rubro,
/descargar/ y la pantalla de inicio de sesión de la app. Como el texto es más largo, aquí se revisa que el menú de arriba
siga cabiendo en UNA línea, sin encimarse ni salirse, desde el celular más angosto hasta la compu.
Ojo: aquí no hay internet, así que la página se dibuja con la letra de repuesto del sistema y no con Figtree/Bricolage.
La de repuesto es más ancha, o sea que la prueba es más exigente que un celular de verdad."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco

MENU = """()=>{const h=document.querySelector('header.menu'),k=[...h.querySelectorAll('a')].filter(a=>a.offsetParent).map(a=>{const r=a.getBoundingClientRect();const g=document.createRange();g.selectNodeContents(a);return {t:a.textContent.trim(),l:r.left,r:r.right,n:new Set([...g.getClientRects()].map(q=>Math.round(q.top))).size}});
  return {k:k,ancho:innerWidth,sale:document.documentElement.scrollWidth>innerWidth}}"""
BOTONES = "()=>[...document.querySelectorAll('button,a')].filter(x=>x.offsetParent).map(x=>({t:x.textContent.trim().replace(/\\s+/g,' '),h:Math.round(x.getBoundingClientRect().height)}))"

with Banco() as b:
    for ruta in ("/", "/para/", "/para/detailing/", "/descargar/"):
        for ancho in (320, 359, 360, 390, 429, 430, 768, 860, 1280):
            p = b.abrir(ruta, ancho=ancho, alto=800, movil=ancho < 860, espera=500)
            m = p.evaluate(MENU)
            k, e = m["k"], "%s a %d px" % (ruta, ancho)
            ini = [x for x in k if x["t"] == "Iniciar sesión"]
            b.ok("%s: el menú dice «Iniciar sesión» (y ya no «Entrar»)" % e, len(ini) == 1 and not any(x["t"] == "Entrar" for x in k), [x["t"] for x in k])
            b.ok("%s: «Iniciar sesión» va en una sola línea" % e, bool(ini) and ini[0]["n"] == 1, ini)
            b.ok("%s: nada del menú se encima ni se sale" % e, not m["sale"] and all(k[i]["r"] <= k[i + 1]["l"] + 0.5 for i in range(len(k) - 1)) and all(x["r"] <= m["ancho"] + 0.5 for x in k),
                 [(x["t"], round(x["l"]), round(x["r"])) for x in k])
            p.context.close()

    # ---- la app: pantalla de inicio de sesión
    for ancho in (320, 390):
        p = b.abrir("/app/", {}, None, ancho=ancho, alto=820, espera=2200)
        bt = p.evaluate(BOTONES)
        tx = [x["t"] for x in bt]
        e = "app a %d px" % ancho
        b.ok("%s: los botones dicen «Iniciar sesión»" % e, all(t in tx for t in ("Iniciar sesión con Google", "Iniciar sesión con Facebook", "Iniciar sesión")), tx)
        b.ok("%s: ningún botón dice «Entrar»" % e, not any("Entrar" in t for t in tx), [t for t in tx if "Entrar" in t])
        b.ok("%s: Google y Facebook van en una sola línea" % e, all(x["h"] <= 54 for x in bt if x["t"] in ("Iniciar sesión con Google", "Iniciar sesión con Facebook")), [x for x in bt if "con " in x["t"]])
        b.ok("%s: nada se sale de la pantalla" % e, not p.evaluate("document.documentElement.scrollWidth>innerWidth") and not p.errs, p.errs)
        p.context.close()
    p = b.abrir("/app/?nuevo=1", {}, None, ancho=390, alto=820, espera=2200)
    tx = [x["t"] for x in p.evaluate(BOTONES)]
    b.ok("app (crear cuenta): «¿Ya tenés cuenta?» lleva a «Iniciar sesión»", "Iniciar sesión" in tx and not any("Entrar" in t for t in tx), tx)
    p.context.close()
