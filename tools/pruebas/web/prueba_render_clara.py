"""Página pública del negocio (/w/), plantilla Clara (web.layout = "clara", o ?plantilla=clara solo para ver).
- Se arma sin errores con las 30 variantes de datos y los 3 planes: sin errores de JS, sin 'undefined'/'NaN'/'null'
  visibles y sin desborde horizontal en 360/400/768/1280 px.
- Todos los botones de reservar van a la página de reservas; si la mensualidad venció, está suspendida o las reservas
  están apagadas, caen a WhatsApp.
- La tarjetita de reseñas solo sale si el negocio tiene reseñas; el promedio de estrellas solo si sus reseñas traen estrellas.
- Un negocio sin web.layout sigue en Pro; ?plantilla=… cambia la vista sin escribir nada.
- Los casos de inyección de prueba_seguridad.py también con Clara."""
from ayuda_web import Banco, armar, abrir, revisar, fotos, PNG
from variantes import VARIANTES
from prueba_seguridad import revisar_seguridad

OTROS_PLANES = ("básico", "12 fotos", "fotos antes/después", "todo lleno (reseñas, preguntas, promo, videos…)", "40 servicios")
CERRADAS = ("suscripción vencida", "suscripción suspendida", "sin suscripción", "reservas en línea apagadas")
RESERVA = "/r/?n=prueba&go=1"
BOTONES = "()=>[...document.querySelectorAll('#page a.cl-cta,#page a.cl-pill,#page .cl-sv a.go')].map(a=>a.getAttribute('href'))"


def botones(b, p, nombre, abierta, wa=True):
    h = p.evaluate(BOTONES)
    b.ok(nombre + ": hay botones de reservar", len(h) >= 3, h)
    if abierta:
        b.ok(nombre + ": todos los botones de reservar van a la página de reservas", all(x == RESERVA for x in h), [x for x in h if x != RESERVA][:3])
    else:
        malos = [x for x in h if not (x.startswith("https://api.whatsapp.com/send?phone=50688888888&text=") if wa else x in ("#",))]
        b.ok(nombre + ": sin reservas en línea, los botones caen a WhatsApp", not malos, malos[:3])
        b.ok(nombre + ": ningún enlace a la página de reservas", not p.evaluate("()=>[...document.querySelectorAll('#page a[href*=\"/r/\"]')].length"))


with Banco() as b:
    for nombre, v in VARIANTES:
        v = dict(v)
        # sin web no hay dónde guardar layout: se ve con la vista previa
        ruta = "/w/?n=prueba&plantilla=clara" if "web" in v.get("quitar", ()) else "/w/?n=prueba"
        p = abrir(b, armar(tier="nitro", layout="clara", **v), ruta=ruta)
        n = "clara · nitro · " + nombre
        revisar(b, p, n)
        b.ok(n + ": usa la plantilla Clara", p.evaluate("()=>document.documentElement.dataset.th==='clara' && document.getElementById('page').className==='cl'"))
        botones(b, p, n, nombre not in CERRADAS, wa="sin wa" != nombre)
        revs = [r for r in (v.get("web") or {}).get("reviews", []) if r.get("t")]
        tiene = p.evaluate("()=>({rc:!!document.querySelector('.cl-rc'),rv:document.querySelectorAll('.cl-rv').length})")
        b.ok(n + ": reseñas solo si el negocio las puso", tiene["rv"] == len(revs) and (tiene["rc"] <= bool(revs)), tiene)
        p.context.close()
    for tier in ("arranque", "turbo"):
        for nombre, v in VARIANTES:
            if nombre in OTROS_PLANES:
                p = abrir(b, armar(tier=tier, layout="clara", **dict(v)), ruta="/w/?n=prueba&plantilla=clara")
                revisar(b, p, "clara · %s · %s" % (tier, nombre))
                p.context.close()

    # Tarjetita de reseñas: con reseñas sin estrellas no se inventa ningún promedio; con estrellas, el promedio real
    F = fotos(3)
    p = abrir(b, armar(layout="clara", fotos=F, web={"reviews": [{"n": "Ana", "t": "Muy bien"}, {"n": "Luis", "t": "Excelente"}]}))
    rc = p.evaluate("()=>{const r=document.querySelector('.cl-rc');return r?r.innerText:''}")
    b.ok("reseñas sin estrellas: la tarjetita dice cuántas hay", "2 reseñas" in rc, rc)
    b.ok("reseñas sin estrellas: no se inventa un promedio ni estrellas", "de 5" not in p.evaluate("()=>document.body.innerText") and not p.evaluate("()=>document.querySelector('.cl-stars')"))
    p.context.close()
    p = abrir(b, armar(layout="clara", fotos=F, web={"reviews": [{"n": "Ana", "t": "Muy bien", "s": 5}, {"n": "Luis", "t": "Bien", "s": 4}, {"t": "Sin nota"}]}))
    rc = p.evaluate("()=>{const r=document.querySelector('.cl-rc');return r?r.innerText:''}")
    b.ok("reseñas con estrellas: promedio calculado de las suyas (4,5 de 5)", "4,5 de 5" in rc, rc)
    p.context.close()
    p = abrir(b, armar(layout="clara", fotos=F))
    b.ok("sin reseñas: no hay tarjetita de reseñas ni sección", not p.evaluate("()=>document.querySelector('.cl-rc,#resenas')"))
    p.context.close()

    # Fila de 3 fotos chicas solo con fotos suficientes
    p = abrir(b, armar(layout="clara", fotos=fotos(2)))
    b.ok("2 fotos: sin fila de fotos chicas", not p.evaluate("()=>document.querySelector('.cl-mini')"))
    p.context.close()
    p = abrir(b, armar(layout="clara", fotos=fotos(5)))
    b.ok("5 fotos: foto grande + 3 chicas", p.evaluate("()=>document.querySelectorAll('.cl-mini button').length") == 3 and p.evaluate("()=>!!document.querySelector('.cl-big img')"))
    p.evaluate("()=>document.querySelector('.cl-mini button').click()")
    b.ok("5 fotos: tocar una foto chica la abre en grande", p.evaluate("()=>document.getElementById('lb').classList.contains('on')"))
    p.context.close()

    # Sin fotos ni logo: logo y portada dibujados
    p = abrir(b, armar(layout="clara", type="refri", logo="", web={}))
    r = p.evaluate("()=>({lg:(document.querySelector('.cl-lg img')||{}).src||'',cov:(document.querySelector('.cl-big img')||{}).src||''})")
    b.ok("sin fotos ni logo: usa logo dibujado", r["lg"].startswith("data:image/svg"), r["lg"][:40])
    b.ok("sin fotos ni logo: usa portada dibujada", r["cov"].startswith("data:image/svg"), r["cov"][:40])
    p.context.close()

    # Qué plantilla se usa
    for lay, esperado in ((None, "pro"), ("pro", "pro"), ("clasica", "clasica"), ("clara", "clara"), ("rara", "pro")):
        p = abrir(b, armar(layout=lay))
        th = p.evaluate("()=>({cl:document.getElementById('page').className,th:document.documentElement.dataset.th||''})")
        real = "clara" if th["cl"] == "cl" else "pro" if th["cl"] == "pr" else "clasica"
        b.ok("web.layout=%s → %s" % (lay, esperado), real == esperado, th)
        p.context.close()
    for lay, q, esperado in ((None, "clara", "cl"), ("clasica", "clara", "cl"), ("clara", "pro", "pr"), ("clara", "clasica", ""), (None, "xyz", "pr")):
        p = abrir(b, armar(layout=lay), ruta="/w/?n=prueba&plantilla=" + q)
        b.ok("vista previa ?plantilla=%s con layout %s" % (q, lay), p.evaluate("()=>document.getElementById('page').className") == esperado)
        b.ok("vista previa ?plantilla=%s no escribe nada" % q, not b.escrituras(p))
        p.context.close()

    # Modo oscuro: se puede cambiar y no se rompe
    p = abrir(b, armar(layout="clara", fotos=fotos(4), web={"reviews": [{"n": "Ana", "t": "Muy bien"}]}))
    p.evaluate("()=>document.getElementById('clMode').click()")
    p.wait_for_timeout(200)
    revisar(b, p, "clara · modo oscuro")
    b.ok("modo oscuro: se activa y se recuerda", p.evaluate("()=>document.documentElement.dataset.pm==='dark' && localStorage.getItem('citaly_mode')==='dark'"))
    p.context.close()

    # Colores del negocio: texto del botón con buen contraste en cualquier color
    JS_CONTRASTE = """()=>{const L=c=>{const m=c.match(/\\d+(\\.\\d+)?/g).map(Number).slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]};
      const b=document.querySelector('.cl-hero .cl-cta'),s=getComputedStyle(b),x=L(s.backgroundColor),y=L(s.color),bg=L(getComputedStyle(document.body).backgroundColor);
      return {r:(Math.max(x,y)+.05)/(Math.min(x,y)+.05),f:(Math.max(x,bg)+.05)/(Math.min(x,bg)+.05)}}"""
    for col in ("#a67c1e", "#2563eb", "#e11d48", "#111827", "#facc15", "#ffffff"):
        for modo in ("light", "dark"):
            p = abrir(b, armar(layout="clara", color=col), antes="try{localStorage.setItem('citaly_mode','%s')}catch(e){}" % modo)
            r = p.evaluate(JS_CONTRASTE)
            b.ok("color %s · %s: texto del botón legible (≥3:1)" % (col, modo), r["r"] >= 3, r)
            b.ok("color %s · %s: el botón se distingue del fondo" % (col, modo), r["f"] >= 1.25, r)
            p.context.close()

    for lay in ("clara",):
        revisar_seguridad(b, lay)
