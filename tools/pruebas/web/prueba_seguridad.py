"""Página pública (/w/): lo que escribe el dueño (o alguien que se le meta a la cuenta) sale escapado.
Nombre, servicios, reseñas, textos, pies de foto con <script>, "><img onerror>, comillas y emojis no ejecutan nada;
logo, fotos, portada y links de video/redes con javascript: o URLs raras no se inyectan."""
from ayuda_web import Banco, armar, abrir, PNG

X = '<script>window.__xss=1</script>"><img src=x onerror="window.__xss=2">\'"`😀'
J = "javascript:window.__xss=3"
WEB = {"reviews": [{"n": X, "t": X, "src": X}], "faqs": [{"q": X, "a": X}], "why": [{"q": X, "a": X}], "steps": [{"q": X, "a": X}],
       "about": X, "aboutTitle": X, "feats": X + "\n" + X, "email": X, "promoNote": X, "seo": X,
       "videos": [{"u": J, "c": X}, {"u": "https://www.youtube.com/watch?v=dQw4w9WgXcQ\"><img src=x onerror=window.__xss=4>", "c": X},
                  {"u": "https://www.tiktok.com/@a/video/7301234567890123456", "c": X}, {"u": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "c": X}],
       "ig": J, "fb": "https://x.com/\"><img src=x onerror=window.__xss=5>", "tt": "tiktok.com/@a\" onmouseover=\"window.__xss=6", "greview": J,
       "svcTitle": X, "svcSub": X, "svcNote": X, "galTitle": X, "galSub": X, "stepsTitle": X, "whyTitle": X, "zonesTitle": X, "revTitle": X,
       "faqTitle": X, "ctaTitle": X, "ctaSub": X, "chipsTitle": X, "homeNote": X,
       "cover": "https://evil.example/x.jpg\" onerror=\"window.__xss=7", "pal": {"a": "#ff0000\"><script>", "h": X}}
FOTOS = [{"img": "javascript:window.__xss=8", "cap": X, "i": 0}, {"img": PNG + '" onerror="window.__xss=9', "cap": X, "i": 1},
         {"img": PNG, "cap": X, "i": 2}, {"img": PNG, "cap": X, "i": 3, "ba": True}]
SVCS = [{"id": "s1", "n": X, "p": 5000, "d": 60, "ic": X, "desc": X, "g": X, "vx": True},
        {"id": "s2", "n": X, "p": 1000, "d": 30, "ic": 'data:image/png;base64,AAAA" onerror="window.__xss=10', "g": "Otro"}]

REVISA = """()=>({xss:window.__xss||0,
  scripts:document.querySelectorAll('#page script').length,
  on:[...document.querySelectorAll('#page *, #lb *')].flatMap(e=>[...e.attributes].filter(a=>/^on/i.test(a.name)).map(a=>e.tagName+' '+a.name)),
  js:[...document.querySelectorAll('[href],[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(u=>/^\\s*javascript:/i.test(u||'')),
  imgs:[...document.querySelectorAll('#page img')].map(i=>i.getAttribute('src')).filter(s=>s&&!/^(data:image\\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\\/=]+|\\/img\\/|https:\\/\\/(images\\.unsplash\\.com|i\\.ytimg\\.com)\\/)/.test(s)),
  iframes:[...document.querySelectorAll('iframe')].map(f=>f.getAttribute('src')),
  fav:document.getElementById('fav').getAttribute('href'),
  texto:document.body.innerText})"""

with Banco() as b:
    for lay in (None, "clasica"):
        for sub in ("trial", "suspended"):
            L = "%s · %s" % (lay or "pro", sub)
            d = armar(layout=lay, sub=sub, name=X, tagline=X, blurb=X, promo=X, addr=X, logo=J, color='red;background:url("javascript:alert(1)")',
                      home=(sub == "suspended"), zones=[{"n": X, "fee": 2000, "days": [1, 3]}], mods={"vehiculo": True}, veh=[{"n": X, "x": 1000}],
                      services=SVCS, web=WEB, fotos=FOTOS)
            p = abrir(b, d, espera=1300)
            p.mouse.move(200, 300)
            # abrir videos y foto en grande, mover comparador: nada de eso debe ejecutar código
            p.evaluate("()=>{const t=document.querySelector('#trabajos .tabs [data-t=\"v\"]');t&&t.click()}")
            for i in range(4):
                p.evaluate("(i)=>{const v=document.querySelectorAll('.vf')[i];v&&!v.querySelector('iframe')&&v.click()}", i)
            p.evaluate("()=>{const t=document.querySelector('#trabajos .tabs [data-t=\"f\"]');t&&t.click();const g=document.querySelector('#gal button');g&&g.click()}")
            p.wait_for_timeout(700)
            r = p.evaluate(REVISA)
            b.ok(L + ": no se ejecutó ningún código inyectado", r["xss"] == 0, r["xss"])
            b.ok(L + ": no hay <script> dentro de la página", r["scripts"] == 0, r["scripts"])
            onok = [x for x in r["on"] if x not in ("BUTTON onclick",)]
            b.ok(L + ": no hay atributos on* inyectados", not onok, onok)
            b.ok(L + ": ningún enlace/imagen con javascript:", not r["js"], r["js"])
            b.ok(L + ": las imágenes solo son data:image, /img/ o fotos conocidas", not r["imgs"], [s[:80] for s in r["imgs"]])
            b.ok(L + ": los videos incrustados son solo de YouTube/TikTok con ID limpio",
                 all(u.startswith(("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "https://www.tiktok.com/embed/v2/7301234567890123456")) for u in r["iframes"]) and len(r["iframes"]) >= 2, r["iframes"])
            b.ok(L + ": el logo con javascript: no se usa como ícono", not r["fav"].startswith("javascript"), r["fav"])
            b.ok(L + ": el nombre con código se ve como texto (escapado)", "<script>window.__xss=1</script>" in r["texto"] and "😀" in r["texto"])
            b.ok(L + ": el título de la pestaña lleva el texto tal cual, sin ejecutar", p.title().startswith("<script>"), p.title()[:40])
            b.ok(L + ": sin errores de JS", not p.errs, p.errs[:3])
            p.context.close()
