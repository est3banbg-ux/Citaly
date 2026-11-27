"""Editores con filas (como «Servicios y precios», donde un </div> de más dejaba fuera a todas las filas menos la primera).
Para cada editor, con 5 filas: (a) todas son hijas del contenedor correcto, (b) editar la fila 3 y borrar la 2 se
guarda en biz/U1 y en pub/prueba, (c) agregar una fila nueva funciona, (d) al reabrir la hoja se ve lo guardado.
Editores: tipos de vehículo, zonas a domicilio, reseñas, preguntas frecuentes, pasos, por qué elegirte, servicios
(nombre y precio), horario, videos, fotos y equipo."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, html_mal, escribir, clic

with Banco() as b:

    def fila_editor(nombre, datos_extra, clave, cont, fila, campo, rm, agregar, guardar, leer_biz, leer_pub, plan="prueba", nuevo_val="Fila NUEVA", otros=None):
        datos, usuario = negocio(**datos_extra)
        p = abrir_app(b, datos, usuario, plan)
        p.evaluate("k=>openSet(k)", clave)
        p.wait_for_timeout(400)
        r = p.evaluate("""([c,f,k,rm])=>({filas:document.querySelectorAll(c+' > '+f).length,campos:document.querySelectorAll(c+' '+k).length,
            quitar:document.querySelectorAll(c+' '+rm).length,todos:document.querySelectorAll('#shC '+k).length})""", [cont, fila, campo, rm])
        b.ok(nombre + ": las 5 filas están dentro de " + cont, r["filas"] == 5 and r["campos"] == 5 and r["quitar"] == 5 and r["todos"] == 5, r)
        escribir(p, campo, "Tercera EDITADA", 2, raiz=cont)
        clic(p, rm, 1, raiz=cont)
        n = p.evaluate("([c,f])=>document.querySelectorAll(c+' > '+f).length", [cont, fila])
        b.ok(nombre + ": ✕/Quitar en la fila 2 la quita", n == 4, n)
        clic(p, agregar)
        n2 = p.evaluate("([c,f])=>document.querySelectorAll(c+' > '+f).length", [cont, fila])
        escribir(p, campo, nuevo_val, n2 - 1, raiz=cont)
        for k, v in (otros or {}).items():  # campos obligatorios de la fila nueva
            escribir(p, k, v, n2 - 1, raiz=cont)
        b.ok(nombre + ": «Agregar» suma una fila", n2 == 5, n2)
        clic(p, guardar)
        p.wait_for_timeout(700)
        bz, pb = p.evaluate("()=>[window.__DB['biz/U1'],window.__DB['pub/prueba']]")
        vb, vp = leer_biz(bz), leer_pub(pb)
        esperado = ["Fila 1", "Tercera EDITADA", "Fila 4", "Fila 5", nuevo_val]
        b.ok(nombre + ": se guarda en biz/U1 (editada, borrada y nueva)", vb == esperado, vb)
        b.ok(nombre + ": se publica igual en pub/prueba", vp == esperado, vp)
        p.evaluate("k=>{closeSheet(true);openSet(k)}", clave)
        p.wait_for_timeout(400)
        vis = p.evaluate("([c,k])=>Array.from(document.querySelectorAll(c+' '+k)).map(e=>e.value)", [cont, campo])
        b.ok(nombre + ": al reabrir muestra lo guardado", vis == esperado, vis)
        b.ok(nombre + ": sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])

    cinco = ["Fila %d" % i for i in range(1, 6)]
    # Tipos de vehículo
    fila_editor("Tipos de vehículo", {"mods": {"vehiculo": True}, "veh": [{"n": n, "x": 1000 * i} for i, n in enumerate(cinco)]}, "veh",
                "#vh", ".svcrow", '[data-k="n"]', "[data-rm]", "#vhA", "#vhS", lambda z: [v["n"] for v in z["veh"]], lambda z: [v["n"] for v in z["veh"]])
    # Zonas a domicilio (Turbo)
    for plan in ("turbo", "prueba"):
        fila_editor("Zonas a domicilio (%s)" % plan, {"home": True, "zones": [{"n": n, "fee": 1000 * i} for i, n in enumerate(cinco)]}, "dom",
                    "#zl", ".zc", '[data-k="n"]', "[data-rm]", "#zA", "#dSv", lambda z: [v["n"] for v in z["zones"]], lambda z: [v["n"] for v in z["zones"]], plan=plan)
    # Listas de la web
    fila_editor("Reseñas", {"web": {"reviews": [{"n": n, "t": "Muy bien " + n} for n in cinco]}}, "rev", "#leB", ".card", '[data-k="n"]', "[data-rm]", "#leA", "#leS",
                lambda z: [v.get("n") for v in z["web"]["reviews"]], lambda z: [v.get("n") for v in z["web"]["reviews"]], otros={'[data-k="t"]': "Excelente"})
    fila_editor("Preguntas frecuentes", {"web": {"faqs": [{"q": n, "a": "Resp " + n} for n in cinco]}}, "faq", "#leB", ".card", '[data-k="q"]', "[data-rm]", "#leA", "#leS",
                lambda z: [v.get("q") for v in z["web"]["faqs"]], lambda z: [v.get("q") for v in z["web"]["faqs"]], otros={'[data-k="a"]': "Sí"})
    fila_editor("Por qué elegirte", {"web": {"why": [{"q": n, "a": "Desc " + n} for n in cinco]}}, "why", "#leB", ".card", '[data-k="q"]', "[data-rm]", "#leA", "#leS",
                lambda z: [v.get("q") for v in z["web"]["why"]], lambda z: [v.get("q") for v in z["web"]["why"]], otros={'[data-k="a"]': "Porque sí"})
    # Servicios (completa prueba_servicios: precio, publicación y reabrir)
    fila_editor("Servicios", {"services": [{"id": "s%d" % i, "n": n, "p": 1000, "d": 60, "ic": "✨"} for i, n in enumerate(cinco)]}, "svc", "#sv", ".svcrow", '[data-k="n"]', "[data-rm]", "#svA", "#svS",
                lambda z: [v["n"] for v in z["services"]], lambda z: [v["n"] for v in z["services"]])

    # Pasos: máximo 4 (con 4 no se puede agregar; al quitar uno vuelve a salir «Agregar»)
    datos, usuario = negocio(web={"steps": [{"q": "Paso %d" % i, "a": "D%d" % i} for i in range(1, 5)]})
    p = abrir_app(b, datos, usuario, "turbo")
    p.evaluate("()=>openSet('stp')"); p.wait_for_timeout(300)
    r = p.evaluate("()=>[document.querySelectorAll('#leB > .card').length,!!document.getElementById('leA')]")
    b.ok("Pasos: 4 filas en #leB y sin «Agregar» al llegar al máximo", r == [4, False], r)
    escribir(p, '[data-k="q"]', "Paso 3 EDITADO", 2, raiz="#leB"); clic(p, "[data-rm]", 1, raiz="#leB"); clic(p, "#leA")
    escribir(p, '[data-k="q"]', "Paso nuevo", 3, raiz="#leB"); escribir(p, '[data-k="a"]', "Desc", 3, raiz="#leB"); clic(p, "#leS")
    p.wait_for_timeout(700)
    v = [x["q"] for x in p.evaluate("()=>window.__DB['biz/U1'].web.steps")]
    vp = [x["q"] for x in p.evaluate("()=>window.__DB['pub/prueba'].web.steps")]
    b.ok("Pasos: guarda editado, borrado y nuevo en biz y pub", v == vp == ["Paso 1", "Paso 3 EDITADO", "Paso 4", "Paso nuevo"], [v, vp])

    # Horario: apagar el sábado, cambiar el martes, prender el domingo
    datos, usuario = negocio()
    p = abrir_app(b, datos, usuario, "arranque")
    p.evaluate("()=>openSet('hor')"); p.wait_for_timeout(300)
    b.ok("Horario: 7 filas con su botón y sus 2 horas", p.evaluate("()=>document.querySelectorAll('#shC .hrow [data-hd]').length===7&&document.querySelectorAll('#shC .hrow input[type=time]').length>=14"))
    p.evaluate("""()=>{document.querySelector('[data-hd="6"]').click();document.querySelector('[data-hd="0"]').click();
      var a=document.getElementById('ha2');a.value='09:30';var z=document.getElementById('hb2');z.value='15:00';
      document.getElementById('ha0').value='10:00';document.getElementById('hb0').value='14:00';document.getElementById('hS').click()}""")
    p.wait_for_timeout(700)
    h = p.evaluate("()=>window.__DB['biz/U1'].hours")
    hp = p.evaluate("()=>window.__DB['pub/prueba'].hours")
    b.ok("Horario: guarda sábado cerrado, domingo abierto y martes 9:30-3:00", h == hp and h[6]["on"] is False and h[0] == {"on": True, "a": "10:00", "b": "14:00"} and h[2] == {"on": True, "a": "09:30", "b": "15:00"}, h)
    p.evaluate("()=>{closeSheet(true);openSet('hor')}"); p.wait_for_timeout(300)
    b.ok("Horario: al reabrir se ve lo guardado", p.evaluate("()=>document.getElementById('ha2').value==='09:30'&&document.querySelector('[data-hd=\"6\"]').getAttribute('aria-pressed')==='false'"))
    p.evaluate("()=>{document.getElementById('ha1').value='17:00';document.getElementById('hb1').value='08:00';document.getElementById('hS').click()}"); p.wait_for_timeout(400)
    b.ok("Horario: no deja guardar si el cierre es antes de la apertura", "Revisa las horas" in p.evaluate("()=>document.getElementById('hE').textContent"))

    # Videos: 5 líneas, quitar la 2, cambiar el título de la 3, agregar una
    vids = [{"u": "https://www.youtube.com/watch?v=abcdefghij%d" % i, "c": "Fila %d" % (i + 1)} for i in range(5)]
    datos, usuario = negocio(web={"videos": vids})
    p = abrir_app(b, datos, usuario, "prueba")
    p.evaluate("()=>openSet('vid')"); p.wait_for_timeout(300)
    t = p.evaluate("()=>document.getElementById('vdT').value").split("\n")
    b.ok("Videos: muestra las 5 líneas", len(t) == 5, t)
    t[2] = vids[2]["u"] + " Tercera EDITADA"; del t[1]; t.append("https://youtu.be/zzzzzzzzzzz Fila NUEVA")
    p.evaluate("v=>{document.getElementById('vdT').value=v;document.getElementById('vdS').click()}", "\n".join(t))
    p.wait_for_timeout(900)
    v = [x.get("c") for x in p.evaluate("()=>window.__DB['biz/U1'].web.videos")]
    vp = [x.get("c") for x in p.evaluate("()=>window.__DB['pub/prueba'].web.videos")]
    b.ok("Videos: guarda editado, borrado y nuevo en biz y pub", v == vp == ["Fila 1", "Tercera EDITADA", "Fila 4", "Fila 5", "Fila NUEVA"], [v, vp, p.evaluate("()=>document.getElementById('vdE')&&document.getElementById('vdE').textContent")])
    b.ok("Videos: sin errores", not p.errs, p.errs[:2])

    # Fotos (colección pub/prueba/fotos): 5 fotos, quitar la 2, texto en la 3, mover la 4 antes
    img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    datos, usuario = negocio()
    for i in range(5):
        datos["pub/prueba/fotos/f%d" % i] = {"img": img, "cap": "Fila %d" % (i + 1), "i": i}
    p = abrir_app(b, datos, usuario, "prueba")
    p.evaluate("()=>openSet('fot')"); p.wait_for_timeout(600)
    r = p.evaluate("()=>[document.querySelectorAll('#fotB [data-c]').length,document.querySelectorAll('#fotB [data-rm]').length]")
    b.ok("Fotos: las 5 fotos tienen su texto y su ✕ dentro de #fotB", r == [5, 5], r)
    escribir(p, "[data-c]", "Tercera EDITADA", 2, raiz="#fotB"); clic(p, "[data-rm]", 1, raiz="#fotB")
    p.wait_for_timeout(100)
    clic(p, "#fotS")
    p.wait_for_timeout(900)
    fs = sorted((v["i"], v["cap"]) for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("pub/prueba/fotos/"))
    b.ok("Fotos: guarda el texto editado, borra la 2 y reordena", fs == [(0, "Fila 1"), (1, "Tercera EDITADA"), (2, "Fila 4"), (3, "Fila 5")], fs)
    p.evaluate("()=>{closeSheet(true);openSet('fot')}"); p.wait_for_timeout(600)
    vis = p.evaluate("()=>Array.from(document.querySelectorAll('#fotB [data-c]')).map(e=>e.value)")
    b.ok("Fotos: al reabrir se ve lo guardado", vis == ["Fila 1", "Tercera EDITADA", "Fila 4", "Fila 5"], vis)
    b.ok("Fotos: sin errores", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])

    # Equipo (Turbo: hasta 4 personas más): agregar y quitar a la segunda
    datos, usuario = negocio(team=["a@x.co", "b@x.co", "c@x.co"])
    for e in ("a@x.co", "b@x.co", "c@x.co"):
        datos["own/" + e] = {"biz": "U1", "rol": "equipo", "name": ""}
    p = abrir_app(b, datos, usuario, "turbo")
    p.evaluate("()=>{go('ajustes');document.getElementById('teamRow').click()}"); p.wait_for_timeout(300)
    b.ok("Equipo: muestra las 3 personas con su «Quitar»", p.evaluate("()=>document.querySelectorAll('#shC [data-rm]').length") == 3)
    escribir(p, "#tmE", "Nuevo@X.co"); clic(p, "#tmAdd"); p.wait_for_timeout(500)
    clic(p, "[data-rm]", 1); p.wait_for_timeout(500)
    t = p.evaluate("()=>window.__DB['biz/U1'].team")
    own = sorted(k for k in p.evaluate("()=>Object.keys(window.__DB)") if k.startswith("own/"))
    b.ok("Equipo: agrega (en minúscula) y quita a la segunda", t == ["a@x.co", "c@x.co", "nuevo@x.co"] and own == ["own/a@x.co", "own/c@x.co", "own/nuevo@x.co"], [t, own])
    b.ok("Equipo: la hoja se redibuja con 3 personas", p.evaluate("()=>document.querySelectorAll('#shC [data-rm]').length") == 3)
    b.ok("Equipo: sin errores", not p.errs, p.errs[:2])
