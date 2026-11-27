"""Plantilla Clara de la página web, desde la app del dueño:
- En «Estilo de tu página» se puede elegir Clara en todos los planes; guarda web.layout = "clara" en biz y lo publica en pub.
- Se puede volver a Pro o Clásica cuando quiera, sin perder tema, paleta, portada, reseñas ni nada más de la web.
- Registro de negocios nuevos: con cfg.layoutNuevos vacío no se escribe web.layout (nacen en Pro, como siempre);
  con "clara" nacen con web.layout = "clara" en biz y en pub."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, VIGIA, negocio, abrir_app, html_mal


def doc(p, ruta):
    return p.evaluate("r=>window.__DB[r]||null", ruta)


def registrar(b, layout_nuevos):
    p = b.abrir("/app/?nuevo=1", {}, None, espera=1500, antes=VIGIA)
    p.evaluate("""(l)=>{CITALY.layoutNuevos=l;document.querySelector('#suT [data-k="detailing"]').click();
      document.getElementById('suN').value='Brillo Nuevo';document.getElementById('suP').value='Dueño de Prueba';
      document.getElementById('suW').value='8888 7777';document.getElementById('suE').value='nuevo@prueba.test';document.getElementById('suK').value='secreta123';
      document.getElementById('suGo').click()}""", layout_nuevos)
    p.wait_for_timeout(2800)
    return p


def elegir(p, lay):
    p.evaluate("()=>{closeSheet(true);openSet('est')}")
    p.wait_for_timeout(250)
    p.evaluate("l=>document.querySelector('#estL [data-l=\"'+l+'\"]').click()", lay)
    p.wait_for_timeout(600)


WEB0 = {"estilo": "glass", "pal": {"a": "#a67c1e", "h": "#d9b25a", "bg": "#1a1408", "pm": "dark", "n": "Dorado"}, "cover": "auto",
        "reviews": [{"n": "Ana", "t": "Excelente"}], "faqs": [{"q": "¿Dónde?", "a": "Aquí"}], "about": "Somos un taller", "ig": "instagram.com/x"}

with Banco() as b:
    # 1) cfg.js trae la constante vacía: nadie cambia de diseño por publicarla
    p = b.abrir("/w/?n=nada", {}, None, espera=600)
    b.ok("cfg.js: los negocios nuevos nacen con la Clara (decisión de Esteban, 27 nov 2026)", p.evaluate("()=>CITALY.layoutNuevos") == "clara")
    p.context.close()

    # 2) Registro con layoutNuevos vacío: no escribe web.layout
    p = registrar(b, "")
    biz, pub = doc(p, "biz/UNUEVO"), doc(p, "pub/brillo-nuevo")
    b.ok("Registro (layoutNuevos vacío): biz y pub creados", biz and pub, [bool(biz), bool(pub)])
    b.ok("Registro (layoutNuevos vacío): biz.web no trae layout (queda en Pro)", biz and "layout" not in biz["web"], biz and biz.get("web", {}).get("layout"))
    b.ok("Registro (layoutNuevos vacío): pub.web no trae layout", pub and "layout" not in pub["web"], pub and pub.get("web", {}).get("layout"))
    b.ok("Registro (layoutNuevos vacío): sin errores", not p.errs and not html_mal(p), p.errs[:2])
    p.context.close()

    # 3) Registro con layoutNuevos = "clara": nace con la Clara
    p = registrar(b, "clara")
    biz, pub = doc(p, "biz/UNUEVO"), doc(p, "pub/brillo-nuevo")
    b.ok("Registro (layoutNuevos clara): biz.web.layout = clara", biz and biz["web"].get("layout") == "clara", biz and biz.get("web", {}).get("layout"))
    b.ok("Registro (layoutNuevos clara): pub.web.layout = clara", pub and pub["web"].get("layout") == "clara", pub and pub.get("web", {}).get("layout"))
    b.ok("Registro (layoutNuevos clara): el resto de la web de fábrica sigue igual (estilo, preguntas)", biz and biz["web"].get("estilo") == "glass" and len(biz["web"].get("faqs", [])) > 0)
    b.ok("Registro (layoutNuevos clara): sin errores", not p.errs and not html_mal(p), p.errs[:2])
    p.context.close()

    # 4) Dueño existente: elige Clara y vuelve a Pro / Clásica sin perder nada (en todos los planes)
    for plan in ("arranque", "turbo", "nitro", "prueba"):
        datos, usuario = negocio(web=dict(WEB0))
        p = abrir_app(b, datos, usuario, plan)
        p.evaluate("()=>{closeSheet(true);openSet('est')}")
        p.wait_for_timeout(250)
        op = p.evaluate("()=>{const x=document.querySelector('#estL [data-l=\"clara\"]');return x?x.innerText:''}")
        b.ok("[%s] la hoja Estilo ofrece la Clara" % plan, "Clara" in op and "Turbo" not in op and "Nitro" not in op, op)
        b.ok("[%s] hay enlace para ver la Clara sin cambiar nada" % plan, "plantilla=clara" in (p.evaluate("()=>{const a=document.getElementById('estPrevC');return a?a.href:''}") or ""))
        recorrido = []
        for lay in ("clara", "pro", "clara", "clasica", "clara", "pro"):
            elegir(p, lay)
            biz, pub = doc(p, "biz/U1"), doc(p, "pub/prueba")
            w = dict(biz["web"]); lw = w.pop("layout", None)
            otros = {k: v for k, v in w.items() if k in WEB0}
            recorrido.append((lay, lw, pub["web"].get("layout"), otros == WEB0))
        b.ok("[%s] ida y vuelta Clara ⇄ Pro ⇄ Clásica: guarda y publica web.layout" % plan, all(x[0] == x[1] == x[2] for x in recorrido), recorrido)
        b.ok("[%s] ida y vuelta: no se pierde tema, paleta, portada, reseñas ni textos" % plan, all(x[3] for x in recorrido), [(x[0], doc(p, "biz/U1")["web"]) for x in recorrido if not x[3]][:1])
        p.evaluate("()=>{closeSheet(true);openSet('est')}")
        p.wait_for_timeout(250)
        b.ok("[%s] la hoja marca el diseño activo" % plan, "✓" in p.evaluate("()=>document.querySelector('#estL [data-l=\"pro\"]').innerText"))
        b.ok("[%s] sin errores de JS ni HTML roto" % plan, not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])
        p.context.close()

    # 5) Lo publicado lo respeta la página: con clara en pub, /w/ muestra la Clara; datos viejos con layout raro siguen en Pro
    datos, usuario = negocio(web=dict(WEB0, layout="clara"))
    p = b.abrir("/w/?n=prueba", datos, None, espera=1200)
    b.ok("Página con pub.web.layout=clara usa la Clara", p.evaluate("()=>document.getElementById('page').className") == "cl")
    p.context.close()
