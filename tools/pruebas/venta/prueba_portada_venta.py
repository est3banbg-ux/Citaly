"""Página de venta (index.html de la raíz): la portada 50/50, la demo de reserva, la calculadora y los planes.
Cubre los dos errores que encontró la revisión antes de publicarla (27 nov 2026):
  1. Arrastrar la foto con el dedo (no la perilla) dejaba la cinta pegada.
  2. Doble toque en «Reservar» llevaba la demo a un paso 4 con el celular en blanco."""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, RAIZ

VAL = "document.getElementById('perilla').getAttribute('aria-valuenow')*1"


def dedo(p, puntos):
    """Toques de verdad (CDP), como un dedo en el celular."""
    cdp = p.context.new_cdp_session(p)
    x, y = puntos[0]
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y, "id": 1}]})
    for x, y in puntos[1:]:
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y, "id": 1}]})
        p.wait_for_timeout(16)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    p.wait_for_timeout(150)


with Banco() as b:
    for nombre, ancho, alto, movil in (("celular", 390, 844, True), ("compu", 1440, 900, False)):
        p = b.abrir("/", ancho=ancho, alto=alto, movil=movil, espera=2600)
        b.ok("%s: sin errores de JavaScript" % nombre, not p.errs, p.errs)
        b.ok("%s: nada se sale de la pantalla" % nombre, not p.evaluate("document.documentElement.scrollWidth>innerWidth"))
        b.ok("%s: un solo h1" % nombre, p.locator("h1").count() == 1)
        b.ok("%s: sigue el ancla #precio (la usan las páginas /para/)" % nombre, p.locator("#precio").count() == 1)
        b.ok("%s: la cinta queda al centro al terminar la pasada" % nombre, 45 <= p.evaluate(VAL) <= 55, p.evaluate(VAL))

        # planes: salen de cfg.js, no escritos a mano
        esperado = p.evaluate("""(()=>{const C=CITALY,f=n=>"₡"+String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,".");
            return Object.keys(C.plans).map(k=>k===C.promoPlan?f(C.monthly.promo):f(C.plans[k].crc))})()""")
        visto = p.evaluate("[...document.querySelectorAll('#plans .precio b')].map(e=>e.textContent)")
        b.ok("%s: los precios de los planes son los de cfg.js" % nombre, visto == esperado and len(visto) == 3, (visto, esperado))
        p.locator('[data-cur="usd"]').click()
        usd = p.evaluate("[...document.querySelectorAll('#plans .precio b')].map(e=>e.textContent)")
        b.ok("%s: en dólares cambia a US$" % nombre, all(u.startswith("US$") for u in usd), usd)

        # archivos y enlaces locales
        refs = p.evaluate("""[...document.querySelectorAll('[href],[src],source[srcset]')].map(e=>e.getAttribute('href')||e.getAttribute('src')||e.getAttribute('srcset'))""")
        faltan = []
        for r in refs:
            if not r or re.match(r"^(https?:|#|data:|mailto:|tel:)", r):
                continue
            ruta = r.split("?")[0].split("#")[0]
            f = os.path.join(RAIZ, ruta)
            if ruta and not (os.path.exists(f) or os.path.exists(os.path.join(f, "index.html"))):
                faltan.append(r)
        b.ok("%s: todos los archivos y enlaces locales existen" % nombre, not faltan, faltan)
        wa = p.evaluate("[...document.querySelectorAll('.wa-demo,#ftWa')].map(a=>[a.target,a.href])")
        b.ok("%s: WhatsApp abre en otra pestaña y con el número de Citaly" % nombre, wa and all(t == "_blank" and "50661506610" in h for t, h in wa), wa)

        # preguntas frecuentes = las del JSON-LD
        ld = json.loads(p.evaluate("document.querySelector('script[type=\"application/ld+json\"]').textContent"))
        faq = [g for g in ld.get("@graph", [ld]) if g.get("@type") == "FAQPage"]
        if faq:
            b.ok("%s: las preguntas visibles son las del FAQPage" % nombre,
                 [q["name"] for q in faq[0]["mainEntity"]] == p.evaluate("[...document.querySelectorAll('.dudas summary')].map(e=>e.textContent)"))

        # demo de reserva
        p.locator("#demo").scroll_into_view_if_needed()
        for sel in ('[data-veh="2"]', '[data-svc="1"]', "#sig", '[data-hora="1"]'):
            p.locator(sel).click()
            p.wait_for_timeout(120)
        p.evaluate("(()=>{const s=document.getElementById('sig');s.click();s.click();s.click()})()")
        p.wait_for_timeout(400)
        b.ok("%s: tres toques seguidos en «Reservar» se quedan en el paso 3" % nombre, p.evaluate("document.getElementById('pant').dataset.paso") == "3")
        aviso = p.inner_text("#notiTxt")
        b.ok("%s: el aviso trae servicio, vehículo y precio, sin puntos dobles" % nombre, "Pick-up" in aviso and "₡20.000" in aviso and ".." not in aviso, aviso)
        b.ok("%s: aparece el aviso que le llega al dueño" % nombre, p.locator("#llega.si .noti").is_visible())
        p.locator(".otra").click()
        p.wait_for_timeout(200)
        b.ok("%s: «Hacer otra reserva» vuelve al paso 1 sin servicio" % nombre, p.evaluate("document.getElementById('pant').dataset.paso") == "1" and p.locator("#sig").is_disabled())

        # calculadora
        p.locator("#cP").fill("99999999")
        p.locator("#cR").evaluate("el=>{el.value=30;el.dispatchEvent(new Event('input'))}")
        b.ok("%s: la calculadora con un monto enorme no se sale" % nombre, not p.evaluate("document.documentElement.scrollWidth>innerWidth"), p.inner_text("#cT"))

        if movil:
            p.evaluate("scrollTo(0,0)")
            p.wait_for_timeout(300)
            c = p.locator("#carro").bounding_box()
            y = c["y"] + c["height"] * 0.8
            antes = p.evaluate(VAL)
            dedo(p, [(300, y)] + [(300, y + d) for d in range(4, 60, 6)])
            b.ok("celular: bajar con el dedo sobre la foto no mueve la cinta", p.evaluate(VAL) == antes, (antes, p.evaluate(VAL)))
            dedo(p, [(300, y)] + [(x, y + 1) for x in range(290, 79, -10)])
            fin = p.evaluate(VAL)
            b.ok("celular: arrastrar la foto con el dedo lleva la cinta hasta el dedo", abs(fin - 80 / ancho * 100) <= 4, fin)
        else:
            p.evaluate("scrollTo(0,0)")
            p.locator("#perilla").focus()
            p.keyboard.press("End")
            der = p.evaluate(VAL)
            p.keyboard.press("Home")
            b.ok("compu: la cinta se mueve con el teclado (Inicio y Fin)", der > 90 and p.evaluate(VAL) < 10, (der, p.evaluate(VAL)))
        b.ok("%s: sigue sin errores de JavaScript al final" % nombre, not p.errs, p.errs)
        p.context.close()
