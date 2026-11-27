"""Páginas por rubro (/para/ y /para/<tipo>/, las genera tools/gen-para.mjs) y /descargar/.
Usan el mismo diseño y el mismo script que la página de venta; aquí se revisa que eso no las rompa."""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, RAIZ

TIPOS = ["detailing", "lavacar", "pulido", "polarizado", "taller"]
ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
INSTAGRAM = IPHONE + " Instagram 330.0.0"


def faltantes(p, carpeta):
    """Archivos y enlaces locales de la página que no existen en el repo."""
    refs = p.evaluate("[...document.querySelectorAll('[href],[src],source[srcset]')].map(e=>e.getAttribute('href')||e.getAttribute('src')||e.getAttribute('srcset'))")
    mal = []
    for r in refs:
        if not r or re.match(r"^(https?:|#|data:|mailto:|tel:)", r):
            continue
        ruta = r.split("?")[0].split("#")[0]
        if not ruta:
            continue
        f = os.path.normpath(os.path.join(RAIZ, ruta.lstrip("/")) if ruta.startswith("/") else os.path.join(RAIZ, carpeta, ruta))
        if not (os.path.exists(f) or os.path.exists(os.path.join(f, "index.html"))):
            mal.append(r)
    return mal


def abrir_como(b, ruta, agente):
    """Abre la página con el navegador de un celular en particular (para /descargar/)."""
    ctx = b.nav.new_context(viewport={"width": 390, "height": 844}, has_touch=True, user_agent=agente, locale="es-CR")
    p = ctx.new_page()
    p.errs = []
    p.on("pageerror", lambda e: p.errs.append(str(e)))
    local = "127.0.0.1:%d" % b.puerto
    p.route("**/*", lambda r: r.continue_() if local in r.request.url else r.abort())
    p.goto(b.base + ruta)
    p.wait_for_timeout(600)
    return p


with Banco() as b:
    cfg = None
    # ---- /para/<tipo>/
    for t in TIPOS:
        for nombre, ancho, alto, movil in (("celular", 390, 844, True), ("compu", 1440, 900, False)):
            if nombre == "compu" and t not in ("detailing", "taller"):
                continue   # en compu basta con dos; en celular van todas
            p = b.abrir("/para/%s/" % t, ancho=ancho, alto=alto, movil=movil, espera=2600)
            e = "%s (%s)" % (t, nombre)
            b.ok("%s: sin errores de JavaScript" % e, not p.errs, p.errs)
            b.ok("%s: nada se sale de la pantalla" % e, not p.evaluate("document.documentElement.scrollWidth>innerWidth"))
            b.ok("%s: un solo h1 y sigue el ancla #planes" % e, p.locator("h1").count() == 1 and p.locator("#planes").count() == 1)
            b.ok("%s: la cinta de la portada queda al centro" % e, 45 <= p.evaluate("document.getElementById('perilla').getAttribute('aria-valuenow')*1") <= 55)
            b.ok("%s: archivos y enlaces locales existen" % e, not faltantes(p, "para/" + t), faltantes(p, "para/" + t))
            b.ok("%s: los botones de registro dicen de qué página vienen" % e, p.locator('a[href="/app/?nuevo=1&desde=para-%s"]' % t).count() >= 4)
            if cfg is None:
                cfg = b.abrir("/", espera=1500).evaluate("""({promo:CITALY.monthly.promo,planes:Object.keys(CITALY.plans).map(k=>CITALY.plans[k].crc),
                    tipos:Object.fromEntries(Object.keys(CITALY.types).map(k=>[k,(CITALY.types[k].svc||[]).map(s=>[s[0],s[1]])]))})""")
            f = lambda n: "₡" + re.sub(r"\B(?=(\d{3})+(?!\d))", ".", str(n))
            b.ok("%s: los precios de los planes son los de cfg.js" % e,
                 p.evaluate("[...document.querySelectorAll('#planes .precio b')].map(x=>x.textContent)") == [f(cfg["promo"])] + [f(x) for x in cfg["planes"][1:]])
            # la demo usa los servicios de ejemplo de ese rubro
            nombres = p.evaluate("[...document.querySelectorAll('#servs .serv b')].map(x=>x.textContent)")
            b.ok("%s: la demo trae los servicios de ejemplo del rubro" % e, nombres == [s[0] for s in cfg["tipos"][t]][:4], nombres)
            p.locator("#demo").scroll_into_view_if_needed()
            cambia = any(len(set(x)) > 1 for x in p.evaluate("CITALY_DEMO.svc.map(s=>s.p)"))
            b.ok("%s: la demo pregunta el vehículo solo si algún precio cambia por vehículo" % e, p.locator("#vehs").is_visible() == cambia)
            for sel in (['[data-veh="0"]'] if cambia else []) + ['[data-svc="0"]', "#sig", '[data-hora="0"]', "#sig"]:
                p.locator(sel).click()
                p.wait_for_timeout(120)
            aviso = p.inner_text("#notiTxt")
            b.ok("%s: la demo se completa y el aviso trae el servicio y su precio de cfg.js" % e,
                 p.evaluate("document.getElementById('pant').dataset.paso") == "3" and cfg["tipos"][t][0][0] in aviso and f(cfg["tipos"][t][0][1]) in aviso, aviso)
            b.ok("%s: si no se pregunta el vehículo, el aviso no lo menciona" % e, cambia or not re.search("Sedán|SUV|Pick-up", aviso), aviso)
            # barra fija de abajo (dos botones): cabe en el celular y no sale en compu
            p.locator("#planes").scroll_into_view_if_needed()
            p.wait_for_timeout(700)
            cajas = p.evaluate("[...document.querySelectorAll('#pega .btn')].map(x=>{const r=x.getBoundingClientRect();return [r.left,r.right,r.height,getComputedStyle(x.parentNode).display]})")
            if movil:
                b.ok("%s: los dos botones de la barra de abajo caben en la pantalla, en un renglón" % e,
                     len(cajas) == 2 and all(c[0] >= 0 and c[1] <= ancho and c[2] <= 60 for c in cajas) and p.locator("#pega").get_attribute("class").find("ya") >= 0, cajas)
            else:
                b.ok("%s: la barra de abajo no sale en compu" % e, all(c[3] == "none" for c in cajas), cajas)
            b.ok("%s: sigue sin errores de JavaScript" % e, not p.errs, p.errs)
            p.context.close()

    # ---- /para/ (índice)
    for nombre, ancho, alto, movil in (("celular", 390, 844, True), ("compu", 1440, 900, False)):
        p = b.abrir("/para/", ancho=ancho, alto=alto, movil=movil, espera=1500)
        e = "índice (%s)" % nombre
        b.ok("%s: sin errores de JavaScript" % e, not p.errs, p.errs)
        b.ok("%s: nada se sale de la pantalla" % e, not p.evaluate("document.documentElement.scrollWidth>innerWidth"))
        b.ok("%s: enlaza a los 5 rubros" % e, all(p.locator('.rubros-l a[href="/para/%s/"]' % t).count() >= 1 for t in TIPOS))
        b.ok("%s: archivos y enlaces locales existen" % e, not faltantes(p, "para"), faltantes(p, "para"))
        p.context.close()

    # ---- /descargar/
    p = abrir_como(b, "/descargar/", ANDROID)
    b.ok("descargar (Android): sin errores de JavaScript", not p.errs, p.errs)
    b.ok("descargar (Android): abre en la pestaña de Android, sin el aviso de computadora",
         p.locator("#pA").is_visible() and not p.locator("#pI").is_visible() and not p.locator("#pc").is_visible())
    b.ok("descargar (Android): el botón baja el APK", (p.get_attribute("#dl", "href") or "").endswith("/android-latest/citaly.apk"))
    b.ok("descargar (Android): los 5 pasos", p.locator("#pA .pasos li").count() == 5)
    b.ok("descargar (Android): nada se sale de la pantalla", not p.evaluate("document.documentElement.scrollWidth>innerWidth"))
    b.ok("descargar (Android): archivos y enlaces locales existen", not faltantes(p, "descargar"), faltantes(p, "descargar"))
    b.ok("descargar (Android): WhatsApp de ayuda con el número de Citaly", "50661506610" in (p.get_attribute("#wa", "href") or ""))
    p.locator("#tI").click()
    b.ok("descargar (Android): se puede pasar a la pestaña de iPhone", p.locator("#pI").is_visible() and not p.locator("#pA").is_visible())
    p.context.close()
    p = abrir_como(b, "/descargar/", IPHONE)
    b.ok("descargar (iPhone): abre de una vez en la pestaña de iPhone, con sus 5 pasos",
         p.locator("#pI").is_visible() and p.locator("#pI .pasos li").count() == 5 and not p.locator("#inapp").is_visible())
    p.context.close()
    p = abrir_como(b, "/descargar/", INSTAGRAM)
    b.ok("descargar (dentro de Instagram): avisa que hay que abrir en Safari", p.locator("#inapp").is_visible())
    p.context.close()
    p = abrir_como(b, "/descargar/#iphone", ANDROID)
    b.ok("descargar (#iphone): el enlace directo abre la pestaña de iPhone", p.locator("#pI").is_visible())
    p.context.close()
    p = b.abrir("/descargar/", ancho=1440, alto=900, movil=False, espera=600)
    b.ok("descargar (compu): avisa que hay que abrirla desde el celular", p.locator("#pc").is_visible() and not p.errs, p.errs)
    p.context.close()
