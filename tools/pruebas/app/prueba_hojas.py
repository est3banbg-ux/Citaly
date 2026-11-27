"""Todas las hojas de Ajustes (claves de openSet y de los botones [data-s]) en plan Arranque, Turbo y Prueba gratis:
se abren sin error de JS, con contenido y sin HTML desbalanceado (el vigía de ayuda.py revisa cada innerHTML).
En Arranque, las funciones de Turbo/Nitro muestran la oferta de subir de plan y «Ver planes» abre Mi plan."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, html_mal, abierta, texto_hoja

CLAVES = "neg svc veh hor look res web dom ref fot vid est ia stp why dep mode gcal help inst ntf waa rev faq plan nov welcome".split()
TURBO = {"dom", "ref", "ia", "stp", "why", "dep"}   # FEAT en app/index.html

with Banco() as b:
    datos0, usuario = negocio()
    p = abrir_app(b, datos0, usuario, "prueba")
    botones = set(p.evaluate("()=>Array.from(document.querySelectorAll('[data-s]')).map(e=>e.dataset.s)"))
    b.ok("Todas las claves de los botones [data-s] están en esta prueba", botones <= set(CLAVES), sorted(botones - set(CLAVES)))

    for plan in ("arranque", "turbo", "prueba"):
        datos, usuario = negocio(mods={"vehiculo": True}, veh=[{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 3000}], home=True, zones=[{"n": "Heredia", "fee": 0}],
                                 web={"reviews": [{"n": "Ana", "t": "Bien"}], "faqs": [{"q": "¿Dónde?", "a": "Aquí"}], "videos": [{"u": "https://youtu.be/abcdefghijk"}]}, rev="https://g.page/r/x")
        p = abrir_app(b, datos, usuario, plan)
        b.ok("[%s] entra sin errores" % plan, not p.errs, p.errs[:2])
        malas = []
        for k in CLAVES:
            n0 = len(p.errs)
            p.evaluate("k=>{closeSheet(true);openSet(k)}", k)
            p.wait_for_timeout(250)
            txt = texto_hoja(p) if abierta(p) else ""
            bloqueada = p.evaluate("()=>!!document.getElementById('upGo')")
            if p.errs[n0:] or len(txt.strip()) < 30:
                malas.append((k, p.errs[n0:][:1], txt[:40]))
            if plan == "arranque" and k in TURBO and not bloqueada:
                malas.append((k, "no ofrece subir de plan"))
            if plan != "arranque" and k in TURBO and bloqueada:
                malas.append((k, "bloqueada en " + plan))
        b.ok("[%s] las %d hojas se abren con contenido y sin errores" % (plan, len(CLAVES)), not malas, malas)
        b.ok("[%s] ninguna hoja mete HTML desbalanceado" % plan, not html_mal(p), html_mal(p)[:3])

        # otras hojas que no salen por openSet
        extra = []
        for nombre, js in (("equipo", "()=>document.getElementById('teamRow').click()"), ("insumos", "()=>document.getElementById('insRow').click()"),
                           ("cierre de caja", "()=>cierreSheet(ymd(new Date()))"), ("nuevo cliente", "()=>cliForm(null)"), ("varios clientes", "()=>cliBulk()"),
                           ("nueva cita", "()=>openJob(null,{})"), ("nuevo gasto", "()=>document.getElementById('addExp').click()"), ("favoritos", "()=>favSheet()")):
            n0 = len(p.errs)
            p.evaluate("()=>closeSheet(true)")
            p.evaluate(js)
            p.wait_for_timeout(250)
            if p.errs[n0:] or not abierta(p) or len(texto_hoja(p).strip()) < 20:
                extra.append((nombre, p.errs[n0:][:1]))
        b.ok("[%s] equipo, insumos, cierre, clientes, cita, gasto y favoritos abren sin errores" % plan, not extra, extra)
        b.ok("[%s] sin HTML desbalanceado en esas hojas" % plan, not html_mal(p), html_mal(p)[:3])

    # Arranque: la oferta lleva a «Mi plan»; equipo e insumos también ofrecen subir
    datos, usuario = negocio()
    p = abrir_app(b, datos, usuario, "arranque")
    p.evaluate("()=>openSet('dom')"); p.wait_for_timeout(200)
    t = texto_hoja(p)
    p.evaluate("()=>document.getElementById('upGo').click()"); p.wait_for_timeout(700)
    b.ok("Arranque: domicilio dice «plan Turbo» y «Ver planes» abre Mi plan", "Turbo" in t and "Mi plan" in texto_hoja(p), texto_hoja(p)[:60])
    for nombre, js, plan_need in (("Equipo", "()=>document.getElementById('teamRow').click()", "Turbo"), ("Insumos", "()=>document.getElementById('insRow').click()", "Nitro"), ("Cierre de caja", "()=>cierreSheet(ymd(new Date()))", "Turbo")):
        p.evaluate("()=>closeSheet(true)"); p.evaluate(js); p.wait_for_timeout(250)
        b.ok("Arranque: %s ofrece el plan %s" % (nombre, plan_need), p.evaluate("()=>!!document.getElementById('upGo')") and plan_need in texto_hoja(p), texto_hoja(p)[:80])
    p.evaluate("()=>{closeSheet(true);openSet('svc')}"); p.wait_for_timeout(250)
    b.ok("Arranque: en servicios, «Avisarme cuando toque volver» está bloqueado", p.evaluate("()=>[...document.querySelectorAll('#sv select[data-k=\"re\"]')].every(s=>s.disabled)"))
    p.evaluate("()=>{closeSheet(true);openSet('res')}"); p.wait_for_timeout(250)
    b.ok("Arranque: en reglas, los cupos a la misma hora están bloqueados", p.evaluate("()=>document.getElementById('rC').disabled"))
    b.ok("Arranque: sin errores al tocar funciones bloqueadas", not p.errs, p.errs[:2])
