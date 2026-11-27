"""Página pública (/w/): título de la pestaña, descripción, datos para Google (JSON-LD) y negocio que no existe.
Estado de Open Graph: /w/ NO tiene etiquetas og: (WhatsApp/Facebook no ven el nombre al compartir /w/?n=…);
las carpetas estáticas por negocio (citalyapp.com/<slug>/) sí las traen. Esta prueba fija ese estado."""
import json
from ayuda_web import Banco, armar, abrir

with Banco() as b:
    for lay in (None, "clasica"):
        L = lay or "pro"
        p = abrir(b, armar(layout=lay, tagline="Brillo que se nota", blurb="Detailing a domicilio en Heredia"))
        b.ok(L + ": título = nombre · frase", p.title() == "Taller Prueba · Brillo que se nota", p.title())
        b.ok(L + ": descripción = texto corto del negocio", p.evaluate("()=>document.querySelector('meta[name=description]').content") == "Detailing a domicilio en Heredia")
        ld = json.loads(p.evaluate("()=>document.querySelector('script[type=\"application/ld+json\"]').textContent"))
        b.ok(L + ": JSON-LD con nombre, url /<slug>/, teléfono y dirección",
             ld.get("name") == "Taller Prueba" and ld.get("url", "").endswith("/prueba/") and ld.get("telephone") == "+50688888888" and ld.get("address") == "San José centro", ld)
        b.ok(L + ": un solo bloque JSON-LD", p.locator('script[type="application/ld+json"]').count() == 1)
        og = p.evaluate("()=>[...document.querySelectorAll('meta[property^=\"og:\"]')].map(m=>m.getAttribute('property'))")
        b.ok(L + ": /w/ no trae etiquetas Open Graph (estado conocido)", og == [], og)
        p.context.close()

        p = abrir(b, armar(layout=lay, web={"seo": "Texto para Google"}, tagline=""))
        b.ok(L + ": sin frase el título es solo el nombre; la descripción usa el texto SEO",
             p.title() == "Taller Prueba" and p.evaluate("()=>document.querySelector('meta[name=description]').content") == "Texto para Google", p.title())
        p.context.close()

        p = abrir(b, armar(layout=lay, tagline="", blurb=""))
        b.ok(L + ": sin textos la descripción es 'Reserva tu cita en <nombre>'", p.evaluate("()=>document.querySelector('meta[name=description]').content") == "Reserva tu cita en Taller Prueba")
        p.context.close()

    # Negocio que no existe / link sin negocio / mayúsculas
    for ruta in ("/w/?n=no-existe", "/w/", "/w/?n="):
        p = abrir(b, armar(), ruta=ruta)
        b.ok("%s: muestra 'No encontramos esta página' sin errores" % ruta,
             p.evaluate("()=>!document.getElementById('nf').hidden&&document.getElementById('page').hidden&&document.getElementById('load').hidden") and not p.errs, p.errs[:2])
        p.context.close()
    p = abrir(b, armar(), ruta="/w/?n=PRUEBA")
    b.ok("/w/?n=PRUEBA: encuentra el negocio aunque venga en mayúsculas", p.title() == "Taller Prueba" and p.locator('a[href="/r/?n=prueba&go=1"]').count() > 0)
    p.context.close()
    p = abrir(b, armar(), negar=["pub/"])
    b.ok("Sin internet / error al leer: avisa que no se pudo cargar", "No se pudo cargar" in p.inner_text("#nf") and not p.errs)
    p.context.close()
    # si no se puede leer la suscripción o las fotos, la página igual sale
    for neg in (["subs/"], ["pub/prueba/fotos"]):
        p = abrir(b, armar(), negar=neg)
        b.ok("Si falla la lectura de %s la página igual se muestra" % neg[0], p.evaluate("()=>!document.getElementById('page').hidden") and not p.errs)
        p.context.close()
