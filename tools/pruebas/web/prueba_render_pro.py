"""Página pública del negocio (/w/), plantilla Pro (la de por defecto): se arma sin errores con todo tipo de datos y planes.
En cada variante: sin errores de JS, sin 'undefined'/'NaN'/'null' visibles y sin desborde horizontal en 360/400/768/1280 px."""
from ayuda_web import Banco, armar, abrir, revisar
from variantes import VARIANTES

LAYOUT = None  # sin layout = Pro (lo normal)
OTROS_PLANES = ("básico", "12 fotos", "fotos antes/después", "todo lleno (reseñas, preguntas, promo, videos…)")

with Banco() as b:
    for nombre, v in VARIANTES:
        p = abrir(b, armar(tier="nitro", layout=LAYOUT, **dict(v)))
        revisar(b, p, "%s · nitro · %s" % (LAYOUT or "pro", nombre))
        if nombre == "básico":
            b.ok("%s: usa la plantilla Pro" % (LAYOUT or "pro"), p.evaluate("()=>document.documentElement.dataset.th === 'pro'"))
        p.context.close()
    for tier in ("arranque", "turbo"):
        for nombre, v in VARIANTES:
            if nombre in OTROS_PLANES:
                p = abrir(b, armar(tier=tier, layout=LAYOUT, **dict(v)))
                revisar(b, p, "%s · %s · %s" % (LAYOUT or "pro", tier, nombre))
                p.context.close()
