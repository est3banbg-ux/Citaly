"""Vista previa del link de cada negocio (lo que sale al compartirlo por WhatsApp, Facebook o TikTok).
Corre el generador real (tools/gen-seo.mjs + tools/gen-og.py) sobre una copia del repo con negocios de prueba y verifica:
- citalyapp.com/<slug>/ y citalyapp.com/<slug>/reservar traen título, descripción e imagen propios (Open Graph);
- la imagen <slug>/og.jpg existe, mide 1200×630 y pesa poco;
- /<slug>/reservar lleva a la página de reservas de siempre conservando ?ref=, ?cita= y #;
- nombres con <, comillas o emojis no rompen nada."""
import base64, io, json, os, re, shutil, subprocess, sys, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, RAIZ, negocio
from PIL import Image


def foto(color, tam=(900, 700), fmt="WEBP"):
    b = io.BytesIO(); Image.new("RGB", tam, color).save(b, fmt)
    return "data:image/%s;base64,%s" % (fmt.lower(), base64.b64encode(b.getvalue()).decode())


def metas(html):
    m = dict(re.findall(r'<meta (?:property|name)="((?:og|twitter):[^"]+)" content="([^"]*)"', html))
    m["title"] = re.search(r"<title>([^<]*)</title>", html).group(1)
    return m


tmp = tempfile.mkdtemp(prefix="citaly-og-")
try:
    for x in ("w", "r", "tools/fonts"):
        shutil.copytree(os.path.join(RAIZ, x), os.path.join(tmp, x))
    for x in ("cfg.js", "404.html", "sitemap.xml", "tools/gen-seo.mjs", "tools/gen-og.py", "tools/seo-noindex.json"):
        if os.path.exists(os.path.join(RAIZ, x)):
            shutil.copy(os.path.join(RAIZ, x), os.path.join(tmp, x))
    svc = [{"n": "Lavado", "p": 8000, "d": 60}, {"n": "Pulido", "p": 15000, "d": 90}, {"n": "Encerado", "p": 5000, "d": 30}]
    RARO = 'Taller <Nuevo> & "Hijos" 🚗'
    fx = [
        {"slug": "con-portada", "name": "Con Portada", "type": "detailing", "tagline": "Tu carro como nuevo", "color": "#a67c1e", "logo": foto("#222", (256, 256)), "services": svc, "web": {"cover": foto("#3355aa")}, "_fotos": 0},
        {"slug": "con-foto", "name": RARO, "type": "taller", "tagline": "Mecánica rápida", "color": "#e11d48", "services": svc, "_fotos": 2, "_foto": foto("#118844", (800, 1600)), "_fotoBa": True, "addr": "Heredia"},
        {"slug": "solo-logo", "name": "Solo Logo", "type": "lavacar", "color": "#16a34a", "logo": foto("#fff", (256, 256), "PNG"), "services": svc, "_fotos": 0},
        {"slug": "sin-nada", "name": "Lavacar y Detailing Hermanos Badilla Rodríguez de Alajuela", "type": "lavacar", "color": "no-es-color", "services": svc[:1], "_fotos": 0},
    ]
    json.dump(fx, open(os.path.join(tmp, "fx.json"), "w"))
    env = dict(os.environ, SEO_FIXTURE=os.path.join(tmp, "fx.json"))
    g1 = subprocess.run(["node", "tools/gen-seo.mjs"], cwd=tmp, env=env, capture_output=True, text=True)
    g2 = subprocess.run([sys.executable, "tools/gen-og.py"], cwd=tmp, capture_output=True, text=True)

    with Banco(raiz=tmp) as b:
        b.ok("El generador de páginas corre sin errores", g1.returncode == 0, g1.stderr[-400:])
        b.ok("El generador de imágenes corre sin errores", g2.returncode == 0, g2.stderr[-400:])
        for n in fx:
            s = n["slug"]
            web = open(os.path.join(tmp, s, "index.html"), encoding="utf-8").read()
            res = open(os.path.join(tmp, s, "reservar.html"), encoding="utf-8").read()
            mw, mr = metas(web), metas(res)
            img = "https://citalyapp.com/%s/og.jpg?v=" % s
            b.ok(s + ": la página web trae imagen propia de vista previa", mw.get("og:image", "").startswith(img) and mw.get("twitter:card") == "summary_large_image", mw)
            b.ok(s + ": el link de reservas trae título, descripción e imagen", mr["title"].startswith("Agenda tu cita en ") and len(mr.get("og:description", "")) > 40
                 and mr.get("og:image") == mw.get("og:image") and mr.get("og:url") == "https://citalyapp.com/%s/reservar" % s, mr)
            b.ok(s + ": el link de reservas no compite en Google con la página del negocio", 'name="robots" content="noindex,follow"' in res and 'rel="canonical" href="https://citalyapp.com/%s/"' % s in res)
            f = os.path.join(tmp, s, "og.jpg")
            ok = os.path.isfile(f)
            im = Image.open(f) if ok else None
            b.ok(s + ": la imagen es JPG de 1200×630 y pesa menos de 300 KB", ok and im.format == "JPEG" and im.size == (1200, 630) and os.path.getsize(f) < 300_000, ok and (im.size, os.path.getsize(f)))
        raro = open(os.path.join(tmp, "con-foto", "reservar.html"), encoding="utf-8").read()
        b.ok("Nombre con <, comillas y emoji sale escapado en la vista previa", "<Nuevo>" not in raro and "&lt;Nuevo&gt;" in raro and '"Hijos"' not in raro)

        g3 = subprocess.run([sys.executable, "tools/gen-og.py"], cwd=tmp, capture_output=True, text=True)
        b.ok("Si nada cambió, no se vuelve a dibujar ninguna imagen", "redibujadas: 0" in g3.stdout, g3.stdout[-200:])
        fx[2]["tagline"] = "Ahora con frase"
        json.dump(fx, open(os.path.join(tmp, "fx.json"), "w"))
        subprocess.run(["node", "tools/gen-seo.mjs"], cwd=tmp, env=env, capture_output=True, text=True)
        g4 = subprocess.run([sys.executable, "tools/gen-og.py"], cwd=tmp, capture_output=True, text=True)
        b.ok("Si cambia un negocio, solo se redibuja la suya y cambia el ?v= del link", "redibujadas: 1" in g4.stdout and "vista previa: solo-logo" in g4.stdout, g4.stdout[-300:])

        # En el navegador: /<slug>/reservar manda a la página de reservas real, conservando lo que traiga el link
        datos, _ = negocio(slug="con-portada", name="Con Portada")
        datos["pub/con-portada"] = datos.pop("pub/prueba")
        p = b.abrir("/con-portada/reservar.html?ref=ana&cita=tok123#x", datos, espera=1800)
        b.ok("Reservar: lleva a /r/ del negocio conservando ?ref, ?cita y #", p.url.endswith("/r/?n=con-portada&ref=ana&cita=tok123#x"), p.url)
        p = b.abrir("/con-portada/reservar.html", datos, espera=1800)
        b.ok("Reservar sin parámetros: abre la página de reservas del negocio sin errores", p.url.endswith("/r/?n=con-portada") and "Con Portada" in p.inner_text("body") and not p.errs, [p.url, p.errs[:2]])
        p = b.abrir("/con-portada/", datos, espera=1800)
        b.ok("La página web del negocio sigue cargando sin errores", "Con Portada" in p.inner_text("body") and not p.errs, p.errs[:2])
finally:
    shutil.rmtree(tmp, ignore_errors=True)
