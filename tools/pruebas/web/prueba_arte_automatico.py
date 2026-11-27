"""Logo y portada automáticos (cfg.js: C.autoLogo / C.autoCover) para negocios sin logo ni fotos.
- Sin logo: sale el logo dibujado (símbolo del rubro + iniciales) en la web, en reservas y en la app.
- Rubro sin foto propia (refrigeración): la portada es el dibujo. Rubros con foto: sigue la foto real, y el dibujo se puede elegir.
- Si el negocio tiene logo o portada propios, esos mandan. Nombres raros o colores inválidos no rompen nada."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio, ts

TIPOS = ["barberia", "salon", "unas", "lavacar", "detailing", "pulido", "polarizado", "autos", "taller", "refri", "spa", "salud", "otro", "inventado",
         "__proto__", "constructor", "toString", "hasOwnProperty", "valueOf", ""]
PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
CARGA = """async (srcs)=>{const r=[];for(const s of srcs){const i=new Image();i.src=s;try{await i.decode();r.push(i.naturalWidth)}catch(e){r.push(0)}}return r}"""

with Banco() as b:
    datos, usuario = negocio(type="refri", name="Refrigeración Cruz", color="#2563eb", logo="")
    p = b.abrir("/w/?n=prueba", datos, espera=2200)
    # Todos los rubros: SVG bien formado y que el navegador lo pueda pintar
    r = p.evaluate("""async (T)=>{const mal=[];for(const t of T){for(const [k,svg] of [["logo",C.art.logo("Taller <b>&\\"x' Ñandú",t,"#ea580c")],["portada",C.art.cover(t,"#ea580c")]]){
        const d=new DOMParser().parseFromString(svg,"image/svg+xml");if(d.querySelector("parsererror")){mal.push(t+" "+k+" mal formado");continue}
        const i=new Image();i.src=C.art.uri(svg);try{await i.decode()}catch(e){mal.push(t+" "+k+" no se pinta")}}}return mal}""", TIPOS)
    b.ok("Los 13 rubros (y uno desconocido) dan logo y portada que el navegador puede pintar", r == [], r)
    r = p.evaluate("""()=>["no-es-color","",null,"#fff","#000000","red"].map(c=>{try{return /^<svg/.test(C.art.cover("lavacar",c))&&/^<svg/.test(C.art.logo("X","lavacar",c))}catch(e){return false}})""")
    b.ok("Colores inválidos, blanco o negro no rompen el dibujo", all(r), r)
    r = p.evaluate("""()=>[C.art.ini("Fjmotors"),C.art.ini("Kenny's Detailing"),C.art.ini("GlassStudioCR"),C.art.ini("Lavacar y Detailing de Heredia"),C.art.ini("🚗"),C.art.ini(""),C.art.ini("<script>alert(1)</script>")]""")
    b.ok("Iniciales: dos letras con sentido y nunca símbolos", r[:6] == ["FJ", "KD", "GS", "LD", "C", "C"] and r[6].isalnum(), r)
    b.ok("El logo dibujado no mete el nombre del negocio (solo iniciales)", "alert" not in p.evaluate("""()=>C.art.logo("<script>alert(1)</script>","taller","#123456")"""))

    # Página web Pro: sin logo y rubro sin foto propia
    src = p.evaluate("""()=>({logo:[...document.querySelectorAll("header img, .pr-nav img, nav img")].map(i=>i.src)[0]||"",fav:document.getElementById("fav").href,
        port:[...document.querySelectorAll("img")].map(i=>i.src).filter(s=>s.indexOf("data:image/svg")===0&&s.length>6000)[0]||""})""")
    b.ok("Web Pro sin logo: en el encabezado sale el logo dibujado", src["logo"].startswith("data:image/svg+xml"), src["logo"][:60])
    b.ok("Web Pro sin logo: el ícono de la pestaña sigue siendo el de Citaly (Safari no pinta íconos SVG)", "favicon-32.png" in src["fav"], src["fav"][:60])
    b.ok("Refrigeración sin fotos: la portada es el dibujo del rubro", src["port"].startswith("data:image/svg+xml"))
    b.ok("Logo y portada dibujados se ven (cargan)", all(x > 0 for x in p.evaluate(CARGA, [src["logo"], src["port"]])))
    b.ok("Web Pro sin errores", not p.errs, p.errs[:2])

    r = p.evaluate("""()=>[C.coverOf("lavacar","",1200,"#0891b2"),C.coverOf("lavacar","auto",1200,"#0891b2"),C.coverOf("refri","",1200,"#2563eb"),C.coverOf("refri","none",1200,"#2563eb"),C.coverOf("refri",C.covers.otro[0],1200,"#2563eb")].map(x=>x.slice(0,30))""")
    b.ok("Rubro con foto real: sigue la foto por defecto; «auto» da el dibujo; «sin foto» y una foto elegida se respetan",
         r[0].startswith("https://images.unsplash.com") and r[1].startswith("data:image/svg") and r[2].startswith("data:image/svg") and r[3] == "" and r[4].startswith("https://images.unsplash.com"), r)

    r = p.evaluate("""()=>["", "inventado", undefined, "__proto__"].map(t=>C.coverOf(t,"",1200,"#2563eb").slice(0,27))""")
    b.ok("Negocio sin rubro o con rubro desconocido: sigue con la foto de siempre", all(x == "https://images.unsplash.com" for x in r), r)

    # Clásica
    d2, _ = negocio(type="refri", name="Refrigeración Cruz", color="#2563eb", logo="", web={"tpl": "clasica", "layout": "clasica", "style": "clasica"})
    p = b.abrir("/w/?n=prueba", d2, espera=2200)
    b.ok("En cualquier plantilla sin logo sale el logo dibujado y no hay errores", p.evaluate("()=>[...document.querySelectorAll('img')].some(i=>i.src.indexOf('data:image/svg+xml')===0)") and not p.errs, p.errs[:2])

    # Con logo y portada propios: mandan los del negocio
    d3, _ = negocio(type="refri", name="Con Logo", logo=PIXEL, web={"cover": PIXEL})
    p = b.abrir("/w/?n=prueba", d3, espera=2200)
    b.ok("Con logo y portada propios no se usa ningún dibujo", not p.evaluate("()=>[...document.querySelectorAll('img')].some(i=>i.src.indexOf('data:image/svg+xml')===0)") and not p.errs, p.errs[:2])

    # Reservas
    p = b.abrir("/r/?n=prueba", datos, espera=2000)
    lg = p.evaluate("()=>(document.querySelector('#lg img')||{}).src||''")
    b.ok("Reservas sin logo: sale el logo dibujado y carga", lg.startswith("data:image/svg+xml") and p.evaluate(CARGA, [lg])[0] > 0 and not p.errs, p.errs[:2])

    # App del dueño: avatar y selector de portada
    for tipo, defecto in (("refri", True), ("lavacar", False)):
        d4, u4 = negocio(type=tipo, name="Negocio Prueba", color="#0891b2", logo="")
        p = b.abrir("/app/", d4, u4, espera=2300)
        b.ok("App (%s): el avatar muestra el logo dibujado" % tipo, p.evaluate("()=>((document.querySelector('#av img')||{}).src||'').indexOf('data:image/svg+xml')===0"))
        p.evaluate("()=>openSet('web')"); p.wait_for_timeout(500)
        est = p.evaluate("()=>{var a=document.querySelector('#cvW [data-cv=auto]');return a?[a.getAttribute('aria-pressed'),document.querySelectorAll('#cvW [aria-pressed=true]').length]:null}")
        b.ok("App (%s): el dibujo aparece como opción de portada%s" % (tipo, " y es la de fábrica" if defecto else " sin ser la de fábrica"), est == ["true" if defecto else "false", 1], est)
        if not defecto:
            p.evaluate("()=>{document.querySelector('#cvW [data-cv=auto]').click()}"); p.wait_for_timeout(200)
            p.evaluate("()=>document.getElementById('ptSv').click()"); p.wait_for_timeout(600)
            b.ok("App: elegir el dibujo lo guarda y lo publica", p.evaluate("()=>[window.__DB['biz/U1'].web.cover,window.__DB['pub/prueba'].web.cover]") == ["auto", "auto"])
            p.evaluate("()=>openSet('web')"); p.wait_for_timeout(400)
            p.evaluate("()=>{document.querySelectorAll('#cvW [data-cv]')[1].click()}"); p.wait_for_timeout(200)
            p.evaluate("()=>document.getElementById('ptSv').click()"); p.wait_for_timeout(600)
            b.ok("App: volver a la foto de fábrica deja la portada en automático", p.evaluate("()=>window.__DB['biz/U1'].web.cover") == "")
        b.ok("App (%s) sin errores" % tipo, not p.errs, p.errs[:2])
