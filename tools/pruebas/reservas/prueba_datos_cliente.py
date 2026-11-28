"""Datos del cliente: nombre, WhatsApp (corto, con guiones, con +506), campo trampa para robots, freno de 6 s,
y textos con <script>, comillas y emojis en el cliente, el negocio y los servicios: todo debe salir escapado."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1 = dia(1)
X = '"><img src=x onerror="window.__XSS=1">\'<script>window.__XSS=2</script> 🚗&amp;'


def a_datos(p):
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p, 600); elegir_dia_hora(p, D1, "09:00"); siguiente(p)


with Banco() as b:
    datos, _ = negocio_cr()
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    a_datos(p)
    for nombre, tel, falta in (("", "88887777", "escribe tu nombre"), ("A", "88887777", "escribe tu nombre"), ("   ", "88887777", "escribe tu nombre"),
                               ("Ana", "", "WhatsApp"), ("Ana", "8888", "WhatsApp"), ("Ana", "888877776", "WhatsApp"), ("Ana", "1888 7777", "WhatsApp"),
                               ("Ana", "9888 7777", "WhatsApp")):
        p.fill("#cli", nombre); p.fill("#tel", tel); siguiente(p, 150)
        b.ok("Datos: nombre %r tel %r → no avanza (%s)" % (nombre, tel, falta), falta in txt(p, "#er") and "Tus datos" in txt(p, "#pt"), [txt(p, "#er"), txt(p, "#pt")])
    for tel in ("8888-7777", "+506 8888 7777", "(506) 8888-7777", "2222 3333", "50688887777"):
        p.fill("#cli", "Ana"); p.fill("#tel", tel); siguiente(p, 150)
        ok = "Último paso" in txt(p, "#pt")
        b.ok("Datos: tel %r se acepta" % tel, ok, txt(p, "#er"))
        if ok:
            p.click("#bk"); p.wait_for_timeout(150)

    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    reservar(p, [0], D1, "09:00", tel="+506 8888-7777")
    j = list(jobs(p).values())[0]
    b.ok("+506 con guiones se guarda como 88887777 (cita y apartado)", j["tel"] == "88887777" and "biz/U1/holds/88887777" in estado(p), j["tel"])

    # Freno anti-robots y campo trampa
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    # T0 = momento en que abrió la página. Se pone "ahora" para que la prueba no dependa de cuánto tarda el banco en llegar al resumen.
    a_datos(p); llenar_datos(p); siguiente(p); p.evaluate("()=>{T0=Date.now()}"); p.click("#nx"); p.wait_for_timeout(500)
    b.ok("Freno de 6 s: si confirma muy rápido pide tocar otra vez y no guarda", "toca Confirmar otra vez" in txt(p, "#er") and not jobs(p), txt(p, "#er"))
    p.wait_for_timeout(100); p.evaluate("()=>{T0=0}"); p.click("#nx"); p.wait_for_timeout(800)
    b.ok("Freno de 6 s: al tocar de nuevo sí guarda", len(jobs(p)) == 1)
    p = b.abrir("/r/?n=prueba", datos, antes=reloj())
    a_datos(p); llenar_datos(p); p.evaluate("()=>{document.getElementById('website').value='spam'}"); siguiente(p); confirmar(p)
    b.ok("Campo trampa lleno (robot): muestra ¡Listo! pero no guarda nada", p.locator("#ok").is_visible() and not b.escrituras(p, "biz/"))

    # Datos guardados en el teléfono para la próxima
    p.evaluate("()=>localStorage.setItem('citaly_cli',JSON.stringify({n:'Luis Mora',t:'8777 6666'}))")
    p.goto(b.base + "/r/?n=prueba"); p.wait_for_timeout(1200)
    a_datos(p)
    b.ok("Recuerda nombre y WhatsApp de la reserva anterior", p.input_value("#cli") == "Luis Mora" and p.input_value("#tel") == "8777 6666")

    # Textos peligrosos en todas partes
    datos, _ = negocio_cr(name="Taller " + X, addr="Calle " + X, tagline="T " + X, blurb="B " + X, promo="P " + X,
                          services=[{"id": "s1", "n": "Lavado " + X, "p": 8000, "d": 60, "ic": X, "g": "Cat " + X}, {"id": "s2", "n": "Otro", "p": 0, "d": 30, "g": "Otra"}],
                          home=True, zones=[{"n": "Zona " + X, "fee": 2000}], mods={"vehiculo": True}, veh=[{"n": "Sedán " + X, "x": 0}, {"n": "SUV", "x": 5000}],
                          dep={"tel": "8888" + X, "amt": 5000, "name": X, "note": X})
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    b.ok("XSS portada: nada se ejecuta y el nombre se ve tal cual", p.evaluate("()=>window.__XSS") is None and X.strip() in txt(p, "#nm"), txt(p, "#nm"))
    ir_a_servicios(p); p.click('#vehs [data-v="0"]'); p.fill("#vmod", "Hilux " + X); p.wait_for_timeout(150); siguiente(p)
    elegir_servicios(p, [0]); siguiente(p); p.select_option("#zsel", "0"); p.fill("#ad", X); siguiente(p, 600)
    elegir_dia_hora(p, D1, "09:00"); siguiente(p); llenar_datos(p, nombre="Ana " + X[:40], nota=X); siguiente(p)
    b.ok("XSS resumen: se ve el texto, no hay <img> ni <script> inyectados", "onerror" in txt(p, "#sum") and not p.locator("#sum img, #sum script, #flow script").count(), txt(p, "#sum")[:200])
    confirmar(p)
    b.ok("XSS: la reserva sale bien y nada se ejecutó", p.locator("#ok").is_visible() and p.evaluate("()=>window.__XSS") is None and not negado(p), negado(p))
    b.ok("XSS: sin <img>/<script> inyectados en la pantalla final", not p.locator("#ok img[src='x'], #ok script, #okDep img").count())
    j = list(jobs(p).values())[0]
    b.ok("XSS: el nombre y la nota se guardan tal cual (recortados a 60/300)", j["cli"] == ("Ana " + X[:40]).strip()[:60] and j["note"] == X, [j["cli"], j["note"]])
    wa = p.get_attribute("#okWa", "href")
    b.ok("XSS: el link de WhatsApp va codificado (sin comillas sueltas)", '"' not in wa and "<" not in wa, wa[:120])
    tk = j.get("tk")
    p2 = abrir_cita(b, estado(p), tk=tk)
    b.ok("XSS en 'Mi cita': nada se ejecuta y se ve el texto", p2.evaluate("()=>window.__XSS") is None and "Lavado" in txt(p2, "#mcb") and not p2.locator("#mcb img[src='x']").count(), txt(p2, "#mcb")[:100])
    b.ok("Sin errores de JS", not p.errs and not p2.errs, (p.errs + p2.errs)[:3])
