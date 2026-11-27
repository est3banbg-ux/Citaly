"""404.html: el enrutador de citalyapp.com/<slug>.
GitHub Pages sirve 404.html para toda ruta que no existe; aquí se simula eso respondiendo la ruta con 404.html
y se mira a dónde redirige."""
import os
from ayuda_web import Banco

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
H404 = open(os.path.join(RAIZ, "404.html"), encoding="utf-8").read()

CASOS = [
    ("/taller-x", "/w/?n=taller-x"),
    ("/taller-x/", "/w/?n=taller-x"),
    ("/taller-x/reservar", "/r/?n=taller-x"),
    ("/taller-x/reservar/", "/r/?n=taller-x"),
    ("/taller-x/r", "/r/?n=taller-x"),
    ("/taller-x/reservar?cita=abc123", "/r/?n=taller-x&cita=abc123"),
    ("/taller-x/reservar/?cita=abc123&ref=k3x9z1", "/r/?n=taller-x&cita=abc123&ref=k3x9z1"),
    ("/taller-x?ref=k3x9z1", "/w/?n=taller-x&ref=k3x9z1"),
    ("/taller-x#videos", "/w/?n=taller-x#videos"),
    ("/Taller-X/Reservar?cita=AbC", "/r/?n=taller-x&cita=AbC"),
    ("/TALLER-X", "/w/?n=taller-x"),
    ("/taller-x/otra/cosa", "/w/?n=taller-x"),
    ("/taller-x/reservar/de/mas", "/r/?n=taller-x"),
    ("/mi--taller-2", "/w/?n=mi--taller-2"),
    ("/abc", "/w/?n=abc"),
    ("/a" * 1 + "b" * 39, "/w/?n=a" + "b" * 39),
    # no válidos → al inicio
    ("/ab", "/"),
    ("/-taller", "/"),
    ("/taller-", "/"),
    ("/caf%C3%A9", "/"),
    ("/taller_x", "/"),
    ("/taller.x", "/"),
    ("/a" + "b" * 40, "/"),
    ("//", "/"),
]

with Banco() as b:
    ctx = b.nav.new_context()
    p = ctx.new_page()
    p.on("pageerror", lambda e: errs.append(str(e)))
    errs = []

    def responder(r):
        u = r.request.url.replace(b.base, "")
        if u.startswith(("/w/", "/r/")) or u in ("/", ""):
            r.fulfill(body="<!doctype html><title>destino</title>", content_type="text/html")
        else:
            r.fulfill(body=H404, content_type="text/html", status=404)
    p.route("**/*", responder)
    for ruta, destino in CASOS:
        p.goto(b.base + ruta)
        p.wait_for_timeout(250)
        final = p.url.replace(b.base, "")
        b.ok("%s → %s" % (ruta, destino), final == destino, final)
    b.ok("enrutador sin errores de JS", not errs, errs[:3])
    ctx.close()

    # Las rutas reales del sitio existen como carpetas con index.html (GitHub Pages las sirve sin pasar por 404.html)
    for d in ("app", "r", "w", "admin", "para", "descargar", "para/detailing"):
        b.ok("la ruta real /%s/ existe (no la toma el enrutador)" % d, os.path.isfile(os.path.join(RAIZ, d, "index.html")))
