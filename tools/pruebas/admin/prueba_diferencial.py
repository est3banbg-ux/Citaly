"""Diferencial de escrituras: la MISMA edición hecha en el admin clásico (admin/) y en el nuevo (admin/nuevo/)
debe escribir lo mismo en Firestore (rutas, operación, opciones como merge/mergeFields y contenido).
Mismos datos falsos, mismo usuario admin y reloj congelado, así que no hace falta normalizar fechas.

Diferencias a propósito (se comparan aparte):
1. Al guardar, el nuevo CONSERVA en cada servicio hot (destacado), g (grupo) y re (cada cuánto vuelve), que pone la
   app del dueño; el clásico los borraba. Se compara sin esos campos y se revisa que el nuevo los conserve.
2. G1: en un negocio que ya existe, si no se tocó el selector de plan, el nuevo escribe en subs solo name y email
   (merge); el clásico reescribía plan/total/demo/until y podía pisar un pago que entró mientras editaba.
3. G2: negocio sin subs: el nuevo crea la prueba gratis (C.trialDays) y el clásico el plan "standard" del modelo viejo.
En el nuevo, Guardar se toca solo si la barra Guardar está visible (como lo haría Esteban); para "guardar sin
cambios" primero se escribe y se borra una letra (la barra aparece y los datos quedan iguales)."""
import json, os, sys
from ayuda import Banco, clasico, nuevo, datos, norm, errores, pilas, T0

AYUDA = """window.__set=function(sel,v){var e=document.querySelector(sel);if(!e)throw new Error("no encontré "+sel);if(e.type==="checkbox")e.checked=!!v;else e.value=v;
  e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))};
window.__click=function(sel){var e=document.querySelector(sel);if(!e)throw new Error("no encontré "+sel);e.click()};"""


def abrir_ficha(id_):
    return {"viejo": [("js", "openEd(%s)" % json.dumps(id_)), ("w", 700)],
            "nuevo": [("js", "location.hash='#negocio/%s'" % id_), ("w", 900)]}


GUARDAR = [("js", "__click('#eGo')"), ("w", 1400)]
GUARDAR_N = [("js", "if(document.getElementById('fSave').hidden)throw new Error('la barra Guardar no está visible');__click('#eGo')"), ("w", 1400)]
TOCAR = ("js", "var e=document.getElementById('eA'),v=e.value;__set('#eA',v+'x');__set('#eA',v)")
PLAN = {"plan avanzado: pasar a demo · viejo"}   # casos donde sí se tocó el selector de plan


def ed(id_, *edicion, tocar=False):
    """Abrir la ficha, hacer la edición (mismos ids en los dos) y guardar."""
    a = abrir_ficha(id_)
    return {"viejo": a["viejo"] + list(edicion) + GUARDAR, "nuevo": a["nuevo"] + ([TOCAR] if tocar else []) + list(edicion) + GUARDAR_N}


def boton(id_, viejo_sel, nuevo_sel, pq=None, cq=None, espera=1200):
    """Acción con botón: en el clásico desde la lista; en el nuevo desde la ficha."""
    pre = ([("pq", pq)] if pq else []) + ([("cq", cq)] if cq else [])
    return {"viejo": pre + [("js", "__click('%s')" % viejo_sel), ("w", espera)],
            "nuevo": abrir_ficha(id_)["nuevo"] + pre + [("js", "__click('%s')" % nuevo_sel), ("w", espera)]}


def S(js):
    return ("js", js)


CASOS = []
# 1. Guardar sin cambiar nada, con negocios de formas distintas
for i in ("b_nuevo", "b_full", "b_viejo", "b_paga", "b_pausa", "b_demo", "b_tvenc", "b_late"):
    CASOS.append(("guardar sin cambios · " + i, ed(i, tocar=True)))
CASOS.append(("G2 sin subs: guardar crea la prueba gratis", ed("b_nosub", tocar=True)))
# 2. Ediciones del editor
CASOS += [
    ("nombre, tipo y WhatsApp · viejo", ed("b_viejo", S("__set('#eN','Lavacar El Roble CR')"), S("__set('#eT','detailing')"), S("__set('#eW','8888-3399')"))),
    ("recién registrado: dejarlo listo", ed("b_nuevo", S("__set('#eT','pulido')"), S("__set('#wTg','Focos como nuevos')"), S("__set('#wBl','Pulido a domicilio.')"))),
    ("servicios: agregar, editar y borrar · completo", ed("b_full", S("__click('#eSvA')"),
        S("var n=document.querySelectorAll('#eSv [data-k=\"n\"]');__set('#eSv [data-k=\"n\"][data-i=\"'+(n.length-1)+'\"]','Encerado')"),
        S("var n=document.querySelectorAll('#eSv [data-k=\"p\"]');__set('#eSv [data-k=\"p\"][data-i=\"'+(n.length-1)+'\"]','12000')"),
        S("__set('#eSv [data-k=\"p\"][data-i=\"0\"]','16000')"), S("__set('#eSv [data-k=\"d\"][data-i=\"0\"]','120')"), S("__click('#eSv [data-rm=\"1\"]')"))),
    ("horario · pausado", ed("b_pausa", S("__click('[data-hd=\"0\"]')"), S("__set('#ha0','09:00')"), S("__set('#hb0','12:00')"), S("__click('[data-hd=\"6\"]')"))),
    ("textos de la web y preguntas · demo", ed("b_demo", S("__set('#wTg','Brillo que dura')"), S("__set('#wBl','Demo para prospectos.')"), S("__set('#wAb','Historia inventada.')"),
        S("__set('#wFt','Rápido\\nGarantía')"), S("__click('#wFqA')"), S("__set('#wFq [data-k=\"q\"][data-i=\"0\"]','¿Cuánto dura?')"), S("__set('#wFq [data-k=\"a\"][data-i=\"0\"]','Una hora.')"),
        S("__click('#wRvA')"), S("__set('#wRv [data-k=\"t\"][data-i=\"0\"]','Muy bueno')"), S("__set('#wVd','https://www.youtube.com/watch?v=dQw4w9WgXcQ Demo')"))),
    ("equipo: cambiar correos · completo", ed("b_full", S("__set('#eTm','otro@ejemplo.test\\nmas@ejemplo.test')"))),
    ("domicilio: activar y zona · plan pago", ed("b_paga", S("__set('#eH',true)"), S("__click('#eZa')"), S("__set('#eZ [data-k=\"n\"][data-i=\"0\"]','Cartago')"), S("__set('#eZ [data-k=\"fee\"][data-i=\"0\"]','4000')"))),
    ("domicilio: apagar · completo", ed("b_full", S("__set('#eH',false)"))),
    ("módulo vehículo · plan pago", ed("b_paga", S("__set('#md_vehiculo',true)"), ("w", 100), S("__set('#eSv [data-k=\"vx\"][data-i=\"0\"]',true)"), ("w", 100),
        S("var v=document.querySelector('#eSv [data-vpi]');if(v){v.value='70000';v.dispatchEvent(new Event('input',{bubbles:true}))}"))),
    ("módulo vehículo apagado y logo quitado · completo", ed("b_full", S("__set('#md_vehiculo',false)"), S("__click('#eLr')"), S("__click('#eC [data-c=\"#1f8a4c\"]')"))),
    ("fotos: mover y quitar · completo", ed("b_full", S("__click('#ePh [data-up=\"1\"]')"), S("__set('#ePh [data-i=\"0\"]','Nuevo texto')"), S("__click('#ePh [data-rm=\"1\"]')"))),
    ("plan avanzado: pasar a demo · viejo", ed("b_viejo", S("__set('#pPl','demo')"))),
]
# 3. Crear negocio nuevo (formulario) y con la demo de GlassStudioCR
NUEVO = [S("__set('#eN','Lavacar Prueba Nueva')"), ("w", 300), S("__set('#eT','lavacar')"), S("__set('#eW','88001122')"), S("__set('#eE','nuevo@ejemplo.test')"),
         S("__set('#wTg','Lavamos bien')"), S("__set('#eTm','equipo1@ejemplo.test')")]
CASOS.append(("crear negocio nuevo", {"viejo": [S("__click('#newB')"), ("w", 300)] + NUEVO + GUARDAR + [("w", 400)],
                                       "nuevo": [S("__click('#newB')"), ("w", 500)] + NUEVO + GUARDAR_N + [("w", 400)]}))
CASOS.append(("crear demo con GlassStudioCR", {"viejo": [S("__click('#newB')"), ("w", 300), S("__click('#eDemo')"), ("w", 1500), S("__set('#eS','glass-demo-x')"), ("w", 700)] + GUARDAR,
                                                "nuevo": [S("location.hash='#negocio/nuevo'"), ("w", 500), S("__click('#eDemo')"), ("w", 1500), S("__set('#eS','glass-demo-x')"), ("w", 700)] + GUARDAR_N}))
# 4. Cobros y estado
CASOS += [
    ("registrar mensualidad · plan pago", boton("b_paga", '#list [data-a="pay"][data-id="b_paga"]', '#ed [data-u="pay"]', pq=["1", "500"])),
    ("registrar mensualidad cambiando a Nitro · prueba", boton("b_tend", '#list [data-a="pay"][data-id="b_tend"]', '#ed [data-u="pay"]', pq=["3", "19900"])),
    ("registrar mensualidad · demo", boton("b_demo", '#list [data-a="pay"][data-id="b_demo"]', '#ed [data-u="pay"]', pq=["2", "9900"])),
    ("registrar pago de saldo · viejo", boton("b_viejo", '#list [data-a="pay"][data-id="b_viejo"]', '#ed [data-u="pay"]', pq=["75000"])),
    ("registrar pago extra · sin plan", boton("b_nosub", '#list [data-a="pay"][data-id="b_nosub"]', '#ed [data-u="pay"]', pq=["40000", "Módulo"])),
    ("pausar · plan pago", boton("b_paga", '#list [data-a="off"][data-id="b_paga"]', '#ed [data-u="off"]')),
    ("reactivar · pausado", boton("b_pausa", '#list [data-a="on"][data-id="b_pausa"]', '#ed [data-u="on"]')),
    ("plan y fecha · completo", boton("b_full", '#list [data-x="pf"][data-id="b_full"]', '#ed [data-u="pf"]', pq=["3", "2026-12-31"])),
    ("promos por correo · completo", boton("b_full", '#list [data-a="promo"][data-id="b_full"]', '#ed [data-u="promo"]')),
    ("nota · completo", boton("b_full", '#list [data-x="note"][data-id="b_full"]', '#ed [data-u="note"]', pq=["Llamar el lunes"])),
    ("etiquetas · viejo", boton("b_viejo", '#list [data-x="tag"][data-id="b_viejo"]', '#ed [data-u="tag"]', pq=["Moroso, VIP ,lavacar"])),
    ("borrar negocio demo", boton("b_demo", '#list [data-x="del"][data-id="b_demo"]', '#ed [data-u="del"]', pq=["BORRAR"], espera=1500)),
    ("borrar negocio completo (citas, fotos, equipo)", boton("b_full", '#list [data-x="del"][data-id="b_full"]', '#ed [data-u="del"]', pq=["BORRAR"], espera=1800)),
    ("borrar: sin escribir BORRAR no borra", boton("b_paga", '#list [data-x="del"][data-id="b_paga"]', '#ed [data-u="del"]', pq=["borra"])),
    ("cobrar desde Cobros (viejo) / desde Hoy (nuevo)", {"viejo": [("pq", ["2", "9900"]), S("__click('#tabs [data-t=\"cob\"]')"), ("w", 300), S("__click('#t-cob [data-c=\"pay\"][data-id=\"b_late\"]')"), ("w", 1000)],
                                                          "nuevo": [("pq", ["2", "9900"]), S("location.hash='#hoy'"), ("w", 400), S("var t=[...document.querySelectorAll('#hoyL .a-task')].find(x=>x.textContent.indexOf('Express Norte')>=0);t.querySelector('[data-h=\"pay\"]').click()"), ("w", 1000)]}),
    ("cobrar desde Cobros en los dos", {"viejo": [("pq", ["3", "19900"]), S("__click('#tabs [data-t=\"cob\"]')"), ("w", 300), S("__click('#t-cob [data-c=\"pay\"][data-id=\"b_tend\"]')"), ("w", 1000)],
                                         "nuevo": [("pq", ["3", "19900"]), S("location.hash='#plata/cobros'"), ("w", 400), S("__click('#t-cob [data-c=\"pay\"][data-id=\"b_tend\"]')"), ("w", 1000)]}),
    ("meta de ingreso", {"viejo": [("pq", ["150000"]), S("__click('#tabs [data-t=\"met\"]')"), ("w", 300), S("__click('#t-met [data-m=\"goal\"]')"), ("w", 800)],
                         "nuevo": [("pq", ["150000"]), S("location.hash='#plata/metricas'"), ("w", 400), S("__click('#t-met [data-m=\"goal\"]')"), ("w", 800)]}),
    ("eliminar todas las demos", {"viejo": [("pq", ["BORRAR"]), S("__click('#f [data-f=\"demo\"]')"), ("w", 300), S("__click('#demoBar')"), ("w", 1500)],
                                  "nuevo": [("pq", ["BORRAR"]), S("location.hash='#mas/demos'"), ("w", 400), S("__click('#masDem [data-d=\"del\"]')"), ("w", 1500)]}),
]
# 5. Prospectos
PRO_V = [S("__click('#tabs [data-t=\"pro\"]')"), ("w", 300)]
PRO_N = [S("location.hash='#prospectos'"), ("w", 400)]
NUEVO_P = [S("__set('#lN','Lavacar Nuevo Sol')"), S("__set('#lW','87001234')"), S("__set('#lT','Lo vi en Facebook')"), S("__click('[data-p=\"add\"]')"), ("w", 700)]
MOVER = [S("__click('#t-pro [data-p=\"next\"][data-id=\"l2\"]')"), ("w", 600), S("__click('#t-pro [data-p=\"next\"][data-id=\"l2\"]')"), ("w", 600)]
CASOS += [
    ("prospecto: crear y mover", {"viejo": PRO_V + NUEVO_P + MOVER, "nuevo": PRO_N + NUEVO_P + MOVER}),
    ("prospecto: nota, estado y borrar", {"viejo": PRO_V + [("pq", ["Volver a escribir"]), S("__click('#t-pro [data-p=\"note\"][data-id=\"l1\"]')"), ("w", 500), S("__click('#t-pro [data-p=\"st\"][data-id=\"l3\"]')"), ("w", 200), S("__click('.shOv [data-s=\"perdido\"]')"), ("w", 500), S("__click('#t-pro [data-p=\"del\"][data-id=\"l2\"]')"), ("w", 600)],
                                          "nuevo": PRO_N + [("pq", ["Volver a escribir"]), S("__click('#t-pro [data-p=\"note\"][data-id=\"l1\"]')"), ("w", 500), S("__click('#t-pro [data-p=\"st\"][data-id=\"l3\"]')"), ("w", 200), S("__click('.shOv [data-s=\"perdido\"]')"), ("w", 500), S("__click('#t-pro [data-p=\"del\"][data-id=\"l2\"]')"), ("w", 600)]}),
    ("prospecto: escribir por WhatsApp (nuevo→escrito)", {"viejo": PRO_V + [S("__click('#t-pro [data-p=\"wa\"][data-id=\"l2\"]')"), ("w", 600)], "nuevo": PRO_N + [S("__click('#t-pro [data-p=\"wa\"][data-id=\"l2\"]')"), ("w", 600)]}),
]


def correr(b, cual, pasos):
    p = (clasico if cual == "viejo" else nuevo)(b, datos(), antes=AYUDA, espera=1600)
    p.evaluate("()=>{window.__WRITES.length=0;window.__WOPTS.length=0}")
    fallo = None
    for paso in pasos:
        try:
            if paso[0] == "js":
                p.evaluate("()=>{" + paso[1] + "}")
            elif paso[0] == "w":
                p.wait_for_timeout(paso[1])
            elif paso[0] == "pq":
                p.evaluate("q=>{window.__PQ=q}", paso[1])
            elif paso[0] == "cq":
                p.evaluate("q=>{window.__CQ=q}", paso[1])
        except Exception as e:
            fallo = str(e).split("\n")[0] + " · pantalla: " + p.evaluate("()=>[location.hash,(document.getElementById('t-pro')||{}).innerHTML||''].join(' | ').slice(0,700)")
            break
    w = p.evaluate("()=>window.__WRITES.map(function(x,i){return [x[0],x[1],x[2],window.__WOPTS[i]]})")
    extra = p.evaluate("()=>({err:(document.getElementById('eErr')||{}).textContent||'',opened:window.__OPENED,E:typeof E==='undefined'?'?':E===null,prompts:window.__PROMPTS})")
    return p, norm(w), extra, fallo


EXISTEN = {k.split("/")[1] for k in datos() if k.startswith("subs/")}


def g1(ws, nombre):
    """El guardado del clásico escribía plan/total/demo/until en subs; el nuevo (sin tocar el plan) solo name/email."""
    if nombre in PLAN:
        return ws
    out = []
    for w in ws:
        if w[0] == "set" and w[1].startswith("subs/") and w[1][5:] in EXISTEN and isinstance(w[2], dict) and "name" in w[2] and "plan" in w[2]:
            w = [w[0], w[1], {k: v for k, v in w[2].items() if k in ("name", "email")}, w[3]]
        out.append(w)
    return out


def sin_hgr(ws):
    """Quita hot/g/re de los servicios (lo único que el nuevo conserva a propósito)."""
    def f(x):
        if isinstance(x, dict):
            return {k: (([{kk: vv for kk, vv in s.items() if kk not in ("hot", "g", "re")} if isinstance(s, dict) else s for s in v]) if k == "services" and isinstance(v, list) else f(v)) for k, v in x.items()}
        if isinstance(x, list):
            return [f(y) for y in x]
        return x
    return f(ws)


def primera_dif(a, b):
    for i in range(max(len(a), len(b))):
        x = a[i] if i < len(a) else None
        y = b[i] if i < len(b) else None
        if x != y:
            return "escritura #%d\n   viejo: %s\n   nuevo: %s" % (i, json.dumps(x, ensure_ascii=False)[:600], json.dumps(y, ensure_ascii=False)[:600])
    return ""


SOLO = os.environ.get("SOLO", "")
with Banco() as b:
    for nombre, pasos in CASOS:
        if SOLO and SOLO not in nombre:
            continue
        pv, wv, xv, fv = correr(b, "viejo", pasos["viejo"])
        pn, wn, xn, fn = correr(b, "nuevo", pasos["nuevo"])
        b.ok("[%s] los pasos corren en los dos" % nombre, not fv and not fn, "viejo: %s · nuevo: %s" % (fv, fn))
        if nombre.startswith("G2"):
            sv = [x for x in wv if x[1] == "subs/b_nosub"]
            sn = [x for x in wn if x[1] == "subs/b_nosub"]
            b.ok("[%s] el clásico escribía el modelo viejo (standard, ₡150.000, 100 años)" % nombre, sv and sv[0][2].get("plan") == "standard" and sv[0][2].get("total") == 150000, sv)
            d = sn[0][2] if sn else {}
            b.ok("[%s] el nuevo crea la prueba gratis de %d días, sin total" % (nombre, 7), d.get("plan") == "trial" and d.get("status") == "trial" and "total" not in d and d.get("until", {}).get("__ts") == T0 + 7 * 86400000, d)
            b.ok("[%s] lo demás (biz, pub sin el tope de videos, own) igual" % nombre, [x for x in wv if not x[1].startswith(("subs/", "pub/"))] == [x for x in wn if not x[1].startswith(("subs/", "pub/"))])
            b.ok("[%s] el nuevo sin errores de JS" % nombre, not errores(pn), errores(pn)[:3])
            pv.context.close(); pn.context.close()
            continue
        a, c = sin_hgr(g1(wv, nombre)), sin_hgr(wn)
        b.ok("[%s] mismas escrituras (%d)" % (nombre, len(wv)), a == c, primera_dif(a, c))
        b.ok("[%s] mismos avisos y preguntas" % nombre, xv["err"] == xn["err"] and xv["prompts"] == xn["prompts"], (xv["err"], xn["err"], xv["prompts"], xn["prompts"]))
        b.ok("[%s] el nuevo sin errores de JS" % nombre, not errores(pn), (errores(pn)[:2], pilas(pn)[:1]))
        if nombre.startswith("guardar sin cambios · b_full") or nombre.startswith("servicios"):
            sv = [x for x in wv if x[1] == "biz/b_full"][0][2]["services"]
            sn = [x for x in wn if x[1] == "biz/b_full"][0][2]["services"]
            src = {x["id"]: x for x in datos()["biz/b_full"]["services"]}
            okn = all(all(x.get(k) == src[x["id"]].get(k) for k in ("hot", "g", "re")) for x in sn if x["id"] in src) and any(x["id"] in src for x in sn)
            okv = not any(k in x for x in sv for k in ("hot", "g", "re"))
            b.ok("[%s] el nuevo conserva hot/g/re en TODOS los servicios y el clásico los borra" % nombre, okn and okv, (sv, sn))
        if nombre in ("guardar sin cambios · b_nuevo", "guardar sin cambios · b_tvenc"):
            b.ok("[%s] no guarda si falta lo básico (los dos, mismo mensaje)" % nombre, not wv and xn["err"], xn["err"])
        if nombre.startswith("guardar sin cambios") and nombre not in ("guardar sin cambios · b_nuevo", "guardar sin cambios · b_tvenc"):
            b.ok("[%s] sí escribió (biz, pub y subs)" % nombre, any(x[1].startswith("biz/") for x in wn) and any(x[1].startswith("pub/") for x in wn) and any(x[1].startswith("subs/") for x in wn), [x[1] for x in wn][:6])
            b.ok("[%s] Guardar deja E===null en el nuevo" % nombre, xn["E"] is True, xn["E"])
            subn = [x for x in wn if x[1].startswith("subs/")]
            b.ok("[%s] G1: subs solo con nombre y correo (merge), sin plan/total/demo/until" % nombre, subn and all(set(x[2]) <= {"name", "email"} and x[3] == {"merge": True} for x in subn), subn)
        if nombre == "guardar sin cambios · b_viejo":
            bz = [x for x in wn if x[1] == "biz/b_viejo"][0]
            b.ok("[%s] guarda con merge (no borra goal, notes, ins ni campos viejos)" % nombre, bz[3] == {"merge": True} and not any(k in bz[2] for k in ("goal", "notes", "ins", "legadoX")), bz[3])
        if nombre == "crear negocio nuevo":
            b.ok("[%s] creó biz, pub, subs y own" % nombre, sorted(set(x[1].split("/")[0] for x in wn)) == ["biz", "own", "pub", "subs"], [x[1] for x in wn])
            b.ok("[%s] al final abre la web con la ruta correcta (los dos viven dos niveles adentro: ../../)" % nombre, xv["opened"] == ["../../lavacar-prueba-nueva"] and xn["opened"] == ["../../lavacar-prueba-nueva"], (xv["opened"], xn["opened"]))
        if nombre == "crear demo con GlassStudioCR":
            lg = [x for x in wn if x[1].startswith("biz/")]
            b.ok("[%s] el nuevo carga logo y fotos de ../../demo (no quedan vacíos)" % nombre, lg and str(lg[0][2].get("logo", "")).startswith("data:image/") and len([x for x in wn if "/fotos/" in x[1]]) == 2, [x[1] for x in wn])
        if nombre.startswith("registrar mensualidad · plan pago"):
            b.ok("[hallazgo] el clásico falla al ofrecer el WhatsApp después del pago (askWa no existe ahí)", any("askWa" in e for e in pv.errs), pv.errs[:2])
            b.ok("[%s] el nuevo sí ofrece avisarle por WhatsApp" % nombre, pn.locator("#waGo").count() == 1)
        if nombre.startswith("borrar: sin escribir"):
            b.ok("[%s] no escribió nada" % nombre, not wv and not wn)
        if nombre == "borrar negocio completo (citas, fotos, equipo)":
            rutas = [x[1] for x in wn]
            b.ok("[%s] borró citas, fotos, equipo, pub, subs, adm y biz" % nombre, all(any(r.startswith(pre) for r in rutas) for pre in ("biz/b_full/jobs/", "pub/detailing-las-brisas/fotos/", "own/", "pub/detailing-las-brisas", "subs/b_full", "adm/b_full", "biz/b_full")), rutas)
        pv.context.close()
        pn.context.close()
