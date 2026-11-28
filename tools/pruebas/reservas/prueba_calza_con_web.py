"""La página de reservas (/r/) se ve SIEMPRE igual que la página web del negocio (/w/): misma plantilla (Clara, Pro o
Clásica), mismos colores, mismo claro/oscuro y misma letra. Abre las dos páginas con el mismo negocio y compara los colores
ya calculados por el navegador. Si alguien cambia los colores en /w/ y se olvida de /r/ (o al revés), esto falla.

También revisa el color propio de reservas (web.rpal, lo pone el dueño en la app): cambia SOLO reservas, y sin él todo
vuelve a ser igual que la web."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco, negocio

LEER = """()=>{var d=document.documentElement,e=document.createElement("i"),o={},k;document.body.appendChild(e);
 var T={bg:"var(--bg)",card:"var(--card)",ink:"var(--ink)",mute:"var(--mute)",line:"var(--line)",acc:"var(--acc)",soft:"var(--soft)",
  cta:"var(--cta,var(--acc))",ctaink:"var(--ctaink,var(--accink,#fff))",hair:"var(--hair,var(--line))",acct:"var(--acct,var(--acc))",
  mark:"var(--mark,transparent)",soft2:"var(--soft2,var(--soft))",hi:"var(--hi,var(--acc))"};
 for(k in T){e.style.color="";e.style.color=T[k];o[k]=getComputedStyle(e).color}e.remove();
 var b=getComputedStyle(document.body),h=document.querySelector("h1"),c=document.querySelector(".cl-cta,.pr-cta,#go1"),cc=c?getComputedStyle(c):null,sk=null;
 try{sk=JSON.parse(localStorage.getItem("citaly_sk:prueba")||"null")}catch(x){}
 return {v:o,th:d.getAttribute("data-th")||"",pm:d.getAttribute("data-pm")||"",fondo:b.backgroundColor,texto:b.color,letra:b.fontFamily.split(",")[0],
  titular:h?getComputedStyle(h).fontFamily.split(",")[0]:"",boton:cc?[cc.backgroundColor,cc.color]:null,sk:sk}}"""

BASE_ = ["bg", "card", "ink", "mute", "line", "acc", "soft", "cta", "ctaink"]
CLAVES = {"clara": BASE_ + ["hair", "acct", "mark", "soft2"], "pro": BASE_ + ["hair", "hi"], "clasica": BASE_}
PAL_OSC = {"a": "#c0392b", "h": "#f1c40f", "bg": "#2c3e50", "pm": "dark", "n": "Prueba"}
PAL_CLA = {"a": "#0d7a85", "h": "#e07a20", "bg": "#0d7a85", "pm": "light", "n": "Prueba"}
# (nombre, plantilla o None = la de fábrica de los negocios viejos (Pro), color, extra de web, modo que guardó el visitante)
CASOS = [
    ("Clara azul", "clara", "#1597c9", {}, ""),
    ("Clara azul con tema glass guardado (el caso de Pulidos El Negro)", "clara", "#1597c9", {"estilo": "glass"}, ""),
    ("Clara, visitante en modo oscuro", "clara", "#1597c9", {}, "dark"),
    ("Clara, visitante en modo claro", "clara", "#1597c9", {}, "light"),
    ("Clara amarilla (color muy claro)", "clara", "#f5c518", {}, ""),
    ("Clara casi negra", "clara", "#0b0b0b", {}, ""),
    ("Clara casi negra en oscuro", "clara", "#0b0b0b", {}, "dark"),
    ("Clara blanca", "clara", "#ffffff", {}, ""),
    ("Clara con colores de marca", "clara", "#1597c9", {"pal": PAL_OSC}, ""),
    ("Clara con colores de marca en oscuro", "clara", "#1597c9", {"pal": PAL_CLA}, "dark"),
    ("Clara con color mal escrito", "clara", "azul", {}, ""),
    ("Pro de fábrica (sin plantilla guardada)", None, "#1597c9", {}, ""),
    ("Pro azul", "pro", "#1597c9", {}, ""),
    ("Pro, visitante en modo claro", "pro", "#1597c9", {}, "light"),
    ("Pro con tema fresco (clara)", "pro", "#e0457b", {"estilo": "fresco"}, ""),
    ("Pro con tema elegante, visitante en oscuro", "pro", "#1f2937", {"estilo": "elegante"}, "dark"),
    ("Pro casi negra", "pro", "#0b0b0b", {}, ""),
    ("Pro amarilla", "pro", "#f5c518", {}, ""),
    ("Pro con colores de marca oscuros", "pro", "#1597c9", {"pal": PAL_OSC}, ""),
    ("Pro con colores de marca claros", "pro", "#1597c9", {"pal": PAL_CLA}, ""),
    ("Pro con colores de marca claros, visitante en oscuro", "pro", "#1597c9", {"pal": PAL_CLA}, "dark"),
    ("Clásica sin tema", "clasica", "#1f8a4c", {}, ""),
    ("Clásica sin tema, visitante en oscuro", "clasica", "#1f8a4c", {}, "dark"),
    ("Clásica glass", "clasica", "#1597c9", {"estilo": "glass"}, ""),
    ("Clásica atrevido", "clasica", "#e07a20", {"estilo": "atrevido"}, ""),
    ("Clásica elegante", "clasica", "#b3392f", {"estilo": "elegante"}, ""),
    ("Clásica fresco", "clasica", "#2563eb", {"estilo": "fresco"}, ""),
    ("Pro con color mal escrito", "pro", "azul", {}, ""),
    ("Clásica con color mal escrito", "clasica", "azul marino", {"estilo": "glass"}, ""),
    ("Pro con color por nombre (red)", "pro", "red", {}, ""),
    ("Pro con color corto (#0af)", "pro", "#0af", {}, ""),
]


def datos_de(lay, color, web):
    w = dict(web)
    if lay:
        w["layout"] = lay
    return negocio(color=color, web=w, tagline="Carros como nuevos sin salir de casa")[0]


def modo_js(m):
    return "try{localStorage.setItem('citaly_mode','%s')}catch(e){}" % m if m else ""


with Banco() as b:
    def leer(ruta, d, modo="", antes=""):
        p = b.abrir(ruta, d, antes=modo_js(modo) + antes, espera=650)
        r = p.evaluate(LEER); r["errs"] = list(p.errs); p.context.close()
        return r

    def distinto(w, r, lay):
        dif = ["%s: web %s / reservas %s" % (k, w["v"][k], r["v"][k]) for k in CLAVES[lay] if w["v"][k] != r["v"][k]]
        for k in ("th", "pm", "fondo", "texto", "letra", "titular"):
            if w[k] != r[k]:
                dif.append("%s: web %s / reservas %s" % (k, w[k], r[k]))
        if lay != "clasica" and w["boton"] != r["boton"]:
            dif.append("botón Agendar: web %s / reservas %s" % (w["boton"], r["boton"]))
        return dif

    for nombre, lay, color, web, modo in CASOS:
        d = datos_de(lay, color, web); fam = lay or "pro"
        w, r = leer("/w/?n=prueba", d, modo), leer("/r/?n=prueba", d, modo)
        dif = distinto(w, r, fam)
        b.ok("%s: reservas calza con la web" % nombre, not dif and not w["errs"] and not r["errs"], dif[:5] or w["errs"][:2] or r["errs"][:2])
        if fam != "clasica":
            b.ok("%s: usa la plantilla %s" % (nombre, fam), w["th"] == fam == r["th"] and r["pm"] in ("light", "dark"), (w["th"], r["th"], r["pm"]))
        # lo que cada página guarda para pintar la siguiente visita sin parpadeo tiene que ser lo mismo
        sw, sr = w["sk"] or {}, r["sk"] or {}
        igual = sw.get("th") == sr.get("th") and sw.get("pm") == sr.get("pm") and all(sr.get("v", {}).get(k) == v for k, v in sw.get("v", {}).items())
        b.ok("%s: la web deja guardados los mismos colores que usa reservas" % nombre, bool(sw) and igual, (sw, sr))

    # Color mal escrito: las dos páginas caen al color de fábrica en vez de quedar sin fondo ni botones
    for lay in ("pro", "clasica"):
        r = leer("/r/?n=prueba", datos_de(lay, "azul", {}))
        b.ok("%s con color mal escrito: usa el color de fábrica y se ve bien" % lay, r["v"]["acc"] == "rgb(108, 76, 245)" and r["fondo"] not in ("rgba(0, 0, 0, 0)", ""), (r["v"]["acc"], r["fondo"]))

    # Paso a paso de la reserva y "¡Listo!": mismos colores que la portada
    d = datos_de("clara", "#1597c9", {})
    p = b.abrir("/r/?n=prueba&go=1", d, espera=900)
    a = p.evaluate(LEER); p.click('#svcs .svc[data-i="0"]'); p.wait_for_timeout(300)
    nx = p.evaluate("()=>{var c=getComputedStyle(document.getElementById('nx'));return [c.backgroundColor,c.color]}")
    b.ok("Dentro de la reserva: mismo fondo y botón Siguiente con el color del botón de la web", a["fondo"] == "rgb(247, 245, 240)" and nx == [a["v"]["cta"], a["v"]["ctaink"]], (a["fondo"], nx, a["v"]["cta"]))
    b.ok("Dentro de la reserva: sin errores", not p.errs, p.errs[:3]); p.context.close()

    # ===== Color propio de reservas (web.rpal) =====
    base = leer("/w/?n=prueba", datos_de("clara", "#1597c9", {}))
    d = datos_de("clara", "#1597c9", {"rpal": {"a": "#d92d3a", "pm": ""}})
    w, r = leer("/w/?n=prueba", d), leer("/r/?n=prueba", d)
    b.ok("Otro color para reservas: la web no cambia", w["v"] == base["v"] and w["th"] == "clara", (w["v"]["acc"], base["v"]["acc"]))
    b.ok("Otro color para reservas: reservas usa ese color", r["v"]["acc"] == "rgb(217, 45, 58)" and r["boton"][0] == "rgb(217, 45, 58)", (r["v"]["acc"], r["boton"]))
    b.ok("Otro color para reservas: misma plantilla, fondo y letra que la web", (r["th"], r["pm"], r["fondo"], r["letra"], r["titular"]) == (w["th"], w["pm"], w["fondo"], w["letra"], w["titular"]), (r["th"], r["pm"], r["fondo"]))
    b.ok("Otro color para reservas: la web no deja colores guardados (reservas los calcula)", not w["sk"], w["sk"])

    d = datos_de("clara", "#1597c9", {"rpal": {"a": "", "pm": "dark"}})
    w, r = leer("/w/?n=prueba", d), leer("/r/?n=prueba", d)
    b.ok("Reservas con fondo oscuro: la web sigue clara y reservas sale oscura", w["pm"] == "light" and r["pm"] == "dark" and r["fondo"] == "rgb(14, 16, 19)", (w["pm"], r["pm"], r["fondo"]))
    b.ok("Reservas con fondo oscuro: conserva el color de la marca", r["v"]["acc"] == base["v"]["acc"], (r["v"]["acc"], base["v"]["acc"]))
    r = leer("/r/?n=prueba", d, "light")
    b.ok("Reservas con fondo oscuro: si el visitante eligió modo claro, manda el visitante", r["pm"] == "light", r["pm"])

    d = datos_de("pro", "#1597c9", {"pal": PAL_OSC, "rpal": {"a": "#1f8a4c", "pm": "light"}})
    w, r = leer("/w/?n=prueba", d), leer("/r/?n=prueba", d)
    b.ok("Pro con otro color y fondo claro para reservas", w["pm"] == "dark" and r["pm"] == "light" and r["th"] == "pro" and r["v"]["acc"] == "rgb(31, 138, 76)", (w["pm"], r["pm"], r["v"]["acc"]))

    d = datos_de("clasica", "#1597c9", {"estilo": "glass", "rpal": {"a": "#d92d3a", "pm": ""}})
    w, r = leer("/w/?n=prueba", d), leer("/r/?n=prueba", d)
    b.ok("Clásica con otro color para reservas: mismo tema, otro color", r["th"] == "glass" == w["th"] and r["v"]["acc"] == "rgb(217, 45, 58)" and w["v"]["acc"] == "rgb(21, 151, 201)", (r["th"], r["v"]["acc"], w["v"]["acc"]))

    for malo in ({"a": "rojo", "pm": "negro"}, "rojo", {"a": "#d92d3a;background:url(x)"}, {}):
        d = datos_de("clara", "#1597c9", {"rpal": malo})
        r = leer("/r/?n=prueba", d)
        b.ok("Color de reservas mal guardado (%s): se ignora y queda igual que la web" % json.dumps(malo)[:28], r["v"] == base["v"] and r["pm"] == base["pm"] and not r["errs"], (r["v"]["acc"], r["errs"][:2]))

    # ===== Sin parpadeo: los colores guardados se ponen antes de que lleguen los datos =====
    # (se abre sin negocio, se guarda en el navegador y se recarga: así lo guardado ya está cuando arranca la página)
    def con_guardado(guardar):
        p = b.abrir("/r/?n=prueba", {}, espera=300)
        p.evaluate("(g)=>{for(var k in g)localStorage.setItem(k,g[k])}", guardar); p.reload(); p.wait_for_timeout(500)
        return p

    sk = json.dumps(base["sk"])
    p = con_guardado({"citaly_sk:prueba": sk}); r = p.evaluate(LEER)
    b.ok("Colores guardados: se aplican antes de cargar el negocio", r["th"] == "clara" and r["pm"] == "light" and r["fondo"] == base["fondo"] and r["v"]["cta"] == base["v"]["cta"], (r["th"], r["fondo"]))
    b.ok("Colores guardados: sin errores", not p.errs, p.errs[:3]); p.context.close()
    p = con_guardado({"citaly_sk:prueba": sk, "citaly_mode": "dark"}); r = p.evaluate(LEER)
    b.ok("Colores guardados en modo claro: no se usan si el visitante ahora va en oscuro", r["th"] == "" and r["pm"] == "", (r["th"], r["pm"])); p.context.close()
    feo = json.dumps({"th": "clara\"><img>", "pm": "light", "m": "", "v": {"--cta": "red;background:url(//x)", "--bg": "#000000", "color": "#fff", "--acc": "#12ab34"}})
    p = con_guardado({"citaly_sk:prueba": feo})
    st = p.evaluate("()=>{var d=document.documentElement;return [d.getAttribute('data-th'),d.style.getPropertyValue('--cta'),d.style.getPropertyValue('--acc'),d.style.color,d.style.getPropertyValue('--bg')]}")
    b.ok("Colores guardados dañados: solo pasan colores bien escritos y nada más", st == [None, "", "#12ab34", "", ""], st)
    b.ok("Colores guardados dañados: sin errores", not p.errs, p.errs[:3]); p.context.close()
    p = con_guardado({"citaly_sk:prueba": "{esto no es json"})
    b.ok("Colores guardados ilegibles: la página abre normal", not p.errs and p.locator("#nf").is_visible(), p.errs[:3]); p.context.close()
