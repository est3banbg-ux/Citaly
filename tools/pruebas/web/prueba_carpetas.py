"""Carpetas estáticas por negocio (citalyapp.com/<slug>/, generadas por tools/gen-seo.mjs).
Cada una es una copia de w/index.html con título, descripción, Open Graph, JSON-LD y un resumen ya escritos (para Google),
y con el slug del negocio puesto por defecto. Se verifica que carguen sin errores y lleven a la página/reserva de SU negocio."""
import json, os, re
from ayuda_web import Banco, armar, abrir

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MANIF = json.load(open(os.path.join(RAIZ, "tools", "seo-slugs.json"), encoding="utf-8"))
W = open(os.path.join(RAIZ, "w", "index.html"), encoding="utf-8").read()
VER_CFG = re.search(r'src="\.\./cfg\.js\?v=([^"]+)"', W).group(1)


def datos_para(slug, **k):
    d = armar(**k)
    pub = d.pop("pub/prueba")
    d["pub/" + slug] = dict(pub, slug=slug, name="Negocio " + slug)
    return d


with Banco() as b:
    # Revisión de todas las carpetas del manifiesto (sin navegador)
    for slug in MANIF:
        f = os.path.join(RAIZ, slug, "index.html")
        if not b.ok("%s/: existe la carpeta con index.html" % slug, os.path.isfile(f)):
            continue
        s = open(f, encoding="utf-8").read()
        ok = ('get("n")||%s)' % json.dumps(slug) in s and '<link rel="canonical" href="https://citalyapp.com/%s/">' % slug in s
              and '<meta property="og:url" content="https://citalyapp.com/%s/">' % slug in s and 'src="../cfg.js?v=' in s)
        b.ok("%s/: slug por defecto, canonical y og:url apuntan a su negocio" % slug, ok)
        v = re.search(r'src="\.\./cfg\.js\?v=([^"]+)"', s)
        if v and v.group(1) != VER_CFG:
            print("   ⚠️  %s/ usa cfg.js?v=%s y w/ usa v=%s (se regenera cada 6 h con el workflow SEO)" % (slug, v.group(1), VER_CFG))

    # En el navegador: 4 carpetas, con plantilla Pro y Clásica
    for slug in ("fjmotors", "kenny-s-detailing", "glassstudiocr", "carlab"):
        for lay in (None, "clasica"):
            L = "%s/ · %s" % (slug, lay or "pro")
            p = abrir(b, datos_para(slug, layout=lay), ruta="/%s/" % slug)
            b.ok(L + ": carga sin errores de JS", not p.errs, p.errs[:3])
            b.ok(L + ": muestra la página del negocio y esconde el resumen para Google",
                 p.evaluate("()=>!document.getElementById('page').hidden&&document.getElementById('load').hidden&&document.getElementById('nf').hidden"))
            b.ok(L + ": el título pasa a ser el del negocio", p.title() == "Negocio " + slug, p.title())
            res = sorted(set(p.evaluate("()=>[...document.querySelectorAll('#page a[href*=\"/r/\"]')].map(a=>a.getAttribute('href'))")))
            b.ok(L + ": Agendar lleva a /r/?n=%s&go=1" % slug, res == ["/r/?n=%s&go=1" % slug], res)
            b.ok(L + ": un solo JSON-LD (el pre-escrito)", p.locator('script[type="application/ld+json"]').count() == 1)
            b.ok(L + ": trae Open Graph para compartir", p.locator('meta[property="og:title"]').count() == 1)
            p.context.close()

    # Si el negocio ya no existe, la carpeta muestra "No encontramos esta página"
    p = abrir(b, armar(), ruta="/fjmotors/")
    b.ok("fjmotors/ sin datos: muestra no encontrado sin errores", p.evaluate("()=>!document.getElementById('nf').hidden") and not p.errs)
    p.context.close()
