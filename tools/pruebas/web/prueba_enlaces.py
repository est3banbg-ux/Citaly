"""Página pública (/w/): los botones que venden llevan al lugar correcto.
- Con reservas en línea: todo "Agendar/Reservar" va a /r/?n=<slug>&go=1 (la página de reservas del MISMO negocio).
- Sin reservas en línea (vencida, suspendida o apagada): van a WhatsApp con mensaje (y el servicio en cada tarjeta Pro).
- WhatsApp: número de Costa Rica bien armado aunque el dueño lo escriba con +506, guiones, espacios o paréntesis.
- Teléfono visible, mapa, redes, correo y "Hecho con Citaly"."""
from urllib.parse import urlparse, parse_qs
from ayuda_web import Banco, armar, abrir, hrefs

LIBRO = "/r/?n=prueba&go=1"


def wa_de(h):
    """('50688887777', 'texto') de un link de WhatsApp, o None."""
    u = urlparse(h or "")
    if u.netloc not in ("api.whatsapp.com", "wa.me"):
        return None
    q = parse_qs(u.query)
    return ((q.get("phone") or [u.path.strip("/")])[0], (q.get("text") or [""])[0])


with Banco() as b:
    for lay in (None, "clasica"):
        L = lay or "pro"
        # 1) Con reservas en línea
        p = abrir(b, armar(layout=lay))
        bot = p.evaluate("""()=>[...document.querySelectorAll('#page a')].filter(a=>/Agendar|Reservar/i.test(a.innerText)).map(a=>a.getAttribute('href'))""")
        b.ok(L + ": hay botones de Agendar/Reservar", len(bot) >= 3, bot)
        b.ok(L + ": todos los Agendar/Reservar llevan a la reserva del negocio", bot and all(h == LIBRO for h in bot), sorted(set(bot)))
        b.ok(L + ": los botones de reservar abren en la misma pestaña", p.evaluate("()=>[...document.querySelectorAll('#page a[href^=\"/r/\"]')].every(a=>!a.target)"))
        was = [wa_de(h) for h in hrefs(p, "#page a") if wa_de(h)]
        b.ok(L + ": hay botones de WhatsApp", len(was) >= 2, was)
        b.ok(L + ": WhatsApp al 506 + número, con saludo con el nombre del negocio", all(w[0] == "50688888888" and "Taller Prueba" in w[1] for w in was), was[:2])
        b.ok(L + ": los links de WhatsApp abren en otra pestaña", p.evaluate("()=>[...document.querySelectorAll('#page a[href*=\"whatsapp\"]')].every(a=>a.target==='_blank'&&/noopener/.test(a.rel))"))
        b.ok(L + ": el número se ve como 8888-8888", "8888-8888" in p.inner_text("#page"))
        mapa = [h for h in hrefs(p, "#page a") if "google.com/maps" in (h or "")]
        b.ok(L + ": 'Cómo llegar' busca la dirección en Google Maps", mapa and "query=San%20Jos%C3%A9%20centro%2C%20Costa%20Rica" in mapa[0], mapa)
        hecho = [h for h in hrefs(p, "footer a") if "desde=" in (h or "")]
        b.ok(L + ": 'Hecho con Citaly' lleva a la página del tipo de negocio", hecho == ["/para/detailing/?desde=prueba"], hecho)
        b.ok(L + ": sin errores de JS", not p.errs, p.errs[:3])
        p.context.close()

        # 2) Formas de escribir el WhatsApp
        for wa in ("88887777", "+506 8888-7777", "506-8888-7777", "8888 7777", "(506) 8888 7777", "+50688887777"):
            p = abrir(b, armar(layout=lay, wa=wa))
            nums = sorted(set(w[0] for w in (wa_de(h) for h in hrefs(p, "#page a")) if w))
            b.ok("%s: WhatsApp '%s' → 50688887777" % (L, wa), nums == ["50688887777"], nums)
            b.ok("%s: WhatsApp '%s' se muestra 8888-7777" % (L, wa), "8888-7777" in p.inner_text("#page"))
            ld = p.evaluate("()=>JSON.parse(document.querySelector('script[type=\"application/ld+json\"]').textContent).telephone")
            b.ok("%s: datos para Google con teléfono +50688887777 ('%s')" % (L, wa), ld == "+50688887777", ld)
            p.context.close()

        # 3) Sin reservas en línea: todo va a WhatsApp
        for nombre, extra in (("vencida", dict(sub="active", sub_dias=-2)), ("suspendida", dict(sub="suspended")), ("reservas apagadas", dict(open=False)), ("sin suscripción", dict(sub=None))):
            p = abrir(b, armar(layout=lay, **extra))
            res = hrefs(p, '#page a[href^="/r/"]')
            b.ok("%s · %s: ningún botón manda a reservar en línea" % (L, nombre), not res, res)
            ag = p.evaluate("""()=>[...document.querySelectorAll('#page a')].filter(a=>/Agendar/i.test(a.innerText)).map(a=>a.getAttribute('href'))""")
            b.ok("%s · %s: los 'Agendar' van a WhatsApp con mensaje para agendar" % (L, nombre),
                 ag and all(wa_de(h) and wa_de(h)[0] == "50688888888" and "agendar" in wa_de(h)[1] for h in ag), ag[:3])
            if not lay:
                svc = [wa_de(h)[1] for h in hrefs(p, ".pr-plan a") if wa_de(h)]
                b.ok("pro · %s: cada tarjeta de servicio pide ese servicio por WhatsApp" % nombre,
                     svc == ["Hola Taller Prueba, quiero agendar: Lavado básico", "Hola Taller Prueba, quiero agendar: Pulido de focos"], svc)
            b.ok("%s · %s: sin errores de JS" % (L, nombre), not p.errs, p.errs[:3])
            p.context.close()

        # 4) Redes, correo y reseñas de Google
        web = {"ig": "instagram.com/taller", "fb": "https://facebook.com/taller", "tt": "www.tiktok.com/@taller", "greview": "https://g.page/r/abc/review", "email": "hola@taller.cr",
               "reviews": [{"n": "Ana", "t": "Muy bien"}]}
        p = abrir(b, armar(layout=lay, web=web))
        todos = hrefs(p, "#page a")
        for u in ("https://instagram.com/taller", "https://facebook.com/taller", "https://www.tiktok.com/@taller", "https://g.page/r/abc/review", "mailto:hola@taller.cr"):
            b.ok("%s: enlace %s" % (L, u), u in todos, [h for h in todos if h and not h.startswith(("#", "/r/", "https://api.whatsapp"))])
        p.context.close()

        # 5) A domicilio: no hay "Cómo llegar"; sí las zonas
        p = abrir(b, armar(layout=lay, home=True, zones=[{"n": "Heredia"}, {"n": "Cartago", "fee": 3000}, {"n": "Grecia", "ask": True}]))
        t = p.inner_text("#page")
        b.ok(L + ": a domicilio no muestra 'Cómo llegar'", "Cómo llegar" not in t)
        b.ok(L + ": zonas con gratis / +₡3 000 / consultar", all(x in t.lower() for x in ("heredia", "gratis", "+₡3 000", "consultar")), t[:200])
        p.context.close()
