"""Página pública (/w/): sección "Trabajos": comparador antes/después, fotos en grande, pestañas, "ver más" y topes por plan."""
from ayuda_web import Banco, armar, abrir, fotos, VIDEOS

POS = "()=>[...document.querySelectorAll('.pr-ba')].map(x=>[x.style.getPropertyValue('--pos'),x.querySelector('input').value,getComputedStyle(x.querySelector('.pr-after')).clipPath])"

with Banco() as b:
    # 1) Comparador con UNA sola foto antes/después (sale en la portada y en Trabajos)
    p = abrir(b, armar(fotos=fotos(1, ba=True)), ancho=400)
    b.ok("1 foto antes/después: hay comparador en portada y en Trabajos", p.locator(".pr-ba").count() == 2, p.locator(".pr-ba").count())
    b.ok("1 foto antes/después: ids de los deslizadores no se repiten", p.evaluate("()=>{const a=[...document.querySelectorAll('.pr-ba input')].map(i=>i.id);return new Set(a).size===a.length}"))
    b.ok("1 foto antes/después: las dos capas tienen la foto", p.evaluate("()=>[...document.querySelectorAll('.pr-lay')].every(l=>/^url\\(\"data:image/.test(l.style.backgroundImage))"))
    ba = p.locator("#trabajos .pr-ba").first
    ba.scroll_into_view_if_needed()
    bb = ba.bounding_box()
    p.touchscreen.tap(bb["x"] + bb["width"] * 0.2, bb["y"] + bb["height"] / 2); p.wait_for_timeout(200)
    v = p.evaluate(POS)[1]
    b.ok("Comparador: tocar a la izquierda mueve la línea (~20%)", 15 <= int(v[1]) <= 25 and v[0] == v[1] + "%", v)
    p.mouse.move(bb["x"] + bb["width"] * 0.3, bb["y"] + bb["height"] / 2); p.mouse.down()
    p.mouse.move(bb["x"] + bb["width"] * 0.9, bb["y"] + bb["height"] / 2, steps=8); p.mouse.up(); p.wait_for_timeout(150)
    v = p.evaluate(POS)[1]
    b.ok("Comparador: arrastrar hacia la derecha la mueve (~90%) y recorta el 'después'", 85 <= int(v[1]) <= 95 and v[2] == "inset(0px 0px 0px %s%%)" % v[1], v)
    p.focus("#trabajos .pr-ba input"); p.keyboard.press("ArrowLeft"); p.wait_for_timeout(100)
    b.ok("Comparador: se puede mover con el teclado", int(p.evaluate(POS)[1][1]) == int(v[1]) - 1, p.evaluate(POS))
    b.ok("Comparador de la portada no se movió", p.evaluate(POS)[0][1] == "55")
    b.ok("Comparador sin errores", not p.errs, p.errs[:3])
    p.context.close()

    # 2) Fotos en grande (lightbox)
    p = abrir(b, armar(fotos=fotos(4)))
    p.click("#gal .pr-car >> nth=2"); p.wait_for_timeout(200)
    b.ok("Foto en grande: se abre con su texto", p.evaluate("()=>[document.getElementById('lb').classList.contains('on'),document.getElementById('lbP').textContent]") == [True, "Trabajo 3"])
    p.keyboard.press("Escape")
    b.ok("Foto en grande: Escape la cierra", not p.evaluate("()=>document.getElementById('lb').classList.contains('on')"))
    p.click("#gal .pr-car >> nth=0"); p.wait_for_timeout(150); p.click("#lbX")
    b.ok("Foto en grande: la X la cierra", not p.evaluate("()=>document.getElementById('lb').classList.contains('on')"))
    p.context.close()
    p = abrir(b, armar(layout="clasica", fotos=fotos(4)))
    p.click("#gal button >> nth=1"); p.wait_for_timeout(200)
    b.ok("Clásica: foto en grande se abre", p.evaluate("()=>[document.getElementById('lb').classList.contains('on'),document.getElementById('lbP').textContent]") == [True, "Trabajo 2"])
    p.context.close()

    # 3) Topes por plan, "ver más" y pestañas (fotos 3/8/12, videos 6/12/24)
    tope = {"arranque": (3, 6), "turbo": (8, 12), "nitro": (12, 24)}
    for tier, (tf, tv) in tope.items():
        p = abrir(b, armar(tier=tier, fotos=fotos(15), web={"videos": (VIDEOS * 5)[:30]}))
        nf, nv = p.locator("#gal .pr-car").count(), p.locator("#vids .vid").count()
        b.ok("%s: muestra hasta %d fotos y %d videos" % (tier, tf, tv), (nf, nv) == (tf, tv), (nf, nv))
        vis = "(s)=>[...document.querySelectorAll(s)].filter(x=>x.offsetParent).length"
        b.ok("%s: al inicio se ven hasta 6 fotos" % tier, p.evaluate(vis, "#gal .pr-car") == min(6, tf))
        if tf > 6:
            p.click("#fMore"); p.wait_for_timeout(100)
            b.ok("%s: 'Ver más fotos' muestra las %d" % (tier, tf), p.evaluate(vis, "#gal .pr-car") == tf)
        p.click('#trabajos .tabs [data-t="v"]'); p.wait_for_timeout(100)
        b.ok("%s: pestaña Videos muestra los videos y esconde las fotos" % tier, p.evaluate(vis, "#vids .vid") == 6 and p.evaluate("()=>document.getElementById('tbF').hidden"))
        if tv > 6:
            p.click("#vMore"); p.wait_for_timeout(100)
        else:
            b.ok("%s: sin botón 'Ver más videos' si son 6 o menos" % tier, p.locator("#vMore").count() == 0)
        b.ok("%s: se ven los %d videos" % (tier, tv), p.evaluate(vis, "#vids .vid") == tv)
        b.ok("%s: sin errores" % tier, not p.errs, p.errs[:3])
        p.context.close()

    # 4) Tocar un video lo incrusta; #videos abre la pestaña de videos
    for lay in (None, "clasica"):
        p = abrir(b, armar(layout=lay, fotos=fotos(2), web={"videos": VIDEOS}), ruta="/w/?n=prueba#videos")
        b.ok("%s: con #videos abre la pestaña de videos" % (lay or "pro"), p.evaluate("()=>document.getElementById('tbF').hidden&&!document.getElementById('tbV').hidden"))
        etiquetas = p.locator("#vids .pn").all_inner_texts()
        b.ok("%s: cada video dice de dónde es" % (lay or "pro"), etiquetas == ["TikTok", "Instagram", "YouTube", "YouTube", "YouTube", "Facebook", "Facebook"], etiquetas)
        p.click("#vids .vf >> nth=0"); p.wait_for_timeout(200)
        src = p.evaluate("()=>document.querySelector('#vids iframe')&&document.querySelector('#vids iframe').getAttribute('src')")
        b.ok("%s: tocar el video lo incrusta" % (lay or "pro"), src == "https://www.tiktok.com/embed/v2/7301234567890123456", src)
        b.ok("%s: videos sin errores" % (lay or "pro"), not p.errs, p.errs[:3])
        p.context.close()

    # 5) Trabajos primero en videos si el dueño lo eligió
    p = abrir(b, armar(fotos=fotos(2), web={"videos": VIDEOS, "trabFirst": "videos"}))
    b.ok("trabFirst=videos: arranca en la pestaña Videos", p.evaluate("()=>document.getElementById('tbF').hidden&&!document.getElementById('tbV').hidden"))
    p.context.close()
