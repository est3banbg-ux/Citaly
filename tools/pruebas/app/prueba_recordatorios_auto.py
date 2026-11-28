"""Recordatorios automáticos por WhatsApp (Ajustes → «Recordatorios automáticos», data-s="waa").
Los manda el Worker; la app solo guarda biz.waAuto {on,conf,rem}, muestra el uso (/wa/uso) y pide una prueba (/wa/prueba).
- Plan que no lo incluye (Arranque): candado «Viene incluido en Nitro», «Ver planes», «Pedir el extra» (salvo en la app de
  Play Store, donde no se muestran precios) y nada de interruptor. Ninguna llamada a /wa/.
- Nitro: se enciende, guarda waAuto correcto (set con merge), muestra «37 de 150» de /wa/uso, la prueba avisa con toast.
- /wa/uso con live:false: aviso «Muy pronto» y el interruptor y la prueba deshabilitados. Si falla la red: «—» sin errores.
- Prueba gratis: «Son 20 mensajes para que lo veás funcionar». Extra (subs.waauto) en Arranque: sin candado.
- En cada cita: marcas por waC / waR+waRd / waE y por lo que contestó el cliente con los botones del recordatorio (waA + waAd),
  y guardar la cita no borra esos campos.
- Con la función apagada (el caso de todos hoy) la app no llama nunca a /wa/."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia, html_mal, esperar, texto_hoja, PLANES, ts

HOY = dia(0, saltar_domingo=False)
OTRO = dia(1, saltar_domingo=False)
# guarda cada fetch (url y cuerpo) para saber si la app llamó al Worker
ESPIA = "window.__FETCH=[];(function(){var f=window.fetch;window.fetch=function(u,o){window.__FETCH.push([String(u),o&&o.body||''])" \
        ";return f.apply(this,arguments)}})();"
WA = "()=>window.__FETCH.filter(x=>/\\/wa\\//.test(x[0]))"


def cita(i, **k):
    j = {"id": i, "cli": "Cliente " + i, "tel": "8811 22" + i[-2:], "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}],
         "date": HOY, "time": "%02d:00" % (8 + int(i[-1])), "dur": 60, "sub": 8000, "disc": 0, "fee": 0, "total": 8000, "veh": "", "ubic": "", "addr": "",
         "zone": "", "how": "", "note": "", "st": "Confirmada", "web": True, "src": "web", "at": 1, "upd": 1}
    j.update(k)
    return j


def datos(**biz):
    d, u = negocio(**biz)
    return d, u


def worker(p, uso=None, prueba=None):
    """Simula el Worker. uso/prueba: dict de respuesta, o "red" para que falle la conexión."""
    def resp(x):
        return lambda r: r.abort() if x == "red" else r.fulfill(status=200, content_type="application/json", body=json.dumps(x))
    if uso is not None:
        p.route("**/wa/uso", resp(uso))
    if prueba is not None:
        p.route("**/wa/prueba", resp(prueba))


def abrir_hoja(p):
    p.evaluate("()=>{closeSheet(true);openSet('waa')}")
    p.wait_for_timeout(500)


def waauto(b, p):
    w = [x for x in b.escrituras(p, "biz/U1") if x[1] == "biz/U1" and x[2] and "waAuto" in x[2]]
    return w


USO = {"ok": True, "live": True, "plan": "nitro", "max": 150, "n": 37, "on": False}

with Banco() as b:
    # ---------- 1) Arranque: candado, sin interruptor, sin llamadas ----------
    d, u = datos()
    p = abrir_app(b, d, u, "arranque", antes=ESPIA)
    b.ok("[arranque] la fila de Ajustes existe y trae el candado «Nitro»",
         p.evaluate("()=>{var r=document.querySelector('.set[data-s=\"waa\"]');return !!r&&/Nitro/.test((r.querySelector('.lk')||{}).textContent||'')}"))
    abrir_hoja(p)
    t = texto_hoja(p)
    b.ok("[arranque] la hoja explica y muestra la vista previa con el nombre del negocio",
         "Recordatorios automáticos por WhatsApp" in t and "te recordamos tu cita en Taller Prueba" in t and "↩ Confirmo" in t and "↩ No puedo ir" in t and "Ver mi cita" not in t, t[:400])
    b.ok("[arranque] candado «Viene incluido en Nitro» y botón «Ver planes»", "Viene incluido en" in t and "Nitro" in t and p.evaluate("()=>!!document.getElementById('waPl')"), t[:400])
    b.ok("[arranque] no hay interruptor ni botón de prueba", p.evaluate("()=>!document.getElementById('waaOn')&&!document.getElementById('waaT')"))
    href = p.evaluate("()=>(document.getElementById('waEx')||{}).href||''")
    b.ok("[arranque] «Pedir el extra» abre WhatsApp a soporte con el mensaje listo",
         "50661506610" in href and "quiero agregar los recordatorios automáticos a mi plan. Mi negocio es Taller Prueba." in __import__("urllib.parse").parse.unquote(href), href[:200])
    b.ok("[arranque] el extra muestra su precio y los 150 mensajes", "2" in t and "900 al mes" in t.replace("\xa0", " ").replace(".", " ") and "150 mensajes" in t, t)
    p.evaluate("()=>document.getElementById('waPl').click()"); p.wait_for_timeout(500)
    b.ok("[arranque] «Ver planes» abre los planes", p.evaluate("()=>/Turbo/.test(document.getElementById('shC').textContent)&&/Nitro/.test(document.getElementById('shC').textContent)&&!document.getElementById('waLk')"))
    b.ok("[arranque] ninguna llamada a /wa/", p.evaluate(WA) == [], p.evaluate(WA))
    b.ok("[arranque] sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
    p.context.close()

    # Arranque en la app de Play Store: sin precio ni «Pedir el extra»
    d, u = datos()
    p = abrir_app(b, d, u, "arranque", antes=ESPIA + "try{localStorage.setItem('citaly_play','1')}catch(e){};")
    abrir_hoja(p)
    t = texto_hoja(p)
    b.ok("[arranque · Play Store] candado y «Ver planes», pero sin precio ni «Pedir el extra»",
         p.evaluate("()=>!!document.getElementById('waPl')&&!document.getElementById('waEx')") and "₡" not in t and "agregalo" not in t, t[:300])
    p.context.close()

    # Arranque con el extra activado por el admin (subs.waauto): lo tiene, sin candado
    d, u = datos()
    d["subs/U1"] = dict(PLANES["arranque"], waauto=True)
    p = abrir_app(b, d, u, None, antes=ESPIA)
    worker(p, uso=dict(USO, plan="extra"))
    b.ok("[arranque + extra] la fila no trae candado", p.evaluate("()=>!document.querySelector('.set[data-s=\"waa\"] .lk')"))
    abrir_hoja(p)
    b.ok("[arranque + extra] hay interruptor y uso", p.evaluate("()=>!!document.getElementById('waaOn')&&!document.getElementById('waLk')") and esperar(p, "()=>/37 de 150/.test(document.getElementById('waaU').textContent)"))
    p.context.close()

    # ---------- 2) Nitro: apagado → encender → casillas → prueba ----------
    d, u = datos()
    p = abrir_app(b, d, u, "nitro", antes=ESPIA)
    worker(p, uso=USO, prueba={"ok": True, "to": "…8888"})
    b.ok("[nitro] al abrir la app no se llama a /wa/", p.evaluate(WA) == [], p.evaluate(WA))
    b.ok("[nitro] la fila no trae candado", p.evaluate("()=>!document.querySelector('.set[data-s=\"waa\"] .lk')"))
    abrir_hoja(p)
    b.ok("[nitro] apagado: interruptor sin marcar y sin casillas", p.evaluate("()=>{var x=document.getElementById('waaOn');return !!x&&!x.checked&&!x.disabled&&!document.getElementById('waaC')}"))
    b.ok("[nitro] muestra el uso que devuelve /wa/uso: «37 de 150 mensajes este mes»", esperar(p, "()=>document.getElementById('waaU').textContent==='37 de 150 mensajes este mes'"),
         p.evaluate("()=>document.getElementById('waaU').textContent"))
    c = p.evaluate(WA)
    b.ok("[nitro] /wa/uso se llama con el idToken de la sesión", len(c) == 1 and c[0][0].endswith("/wa/uso") and c[0][0].startswith("https://bitter-brook-9ee2") and json.loads(c[0][1]) == {"idToken": "token-falso"}, c)
    b.ok("[nitro] no dice nada de la prueba gratis", "En tu prueba" not in texto_hoja(p))
    p.evaluate("()=>document.getElementById('waaOn').click()"); p.wait_for_timeout(400)
    w = waauto(b, p)
    b.ok("[nitro] encender guarda waAuto {on:true, conf:true, rem:true} con set+merge", len(w) == 1 and w[0][0] == "set" and w[0][2] == {"waAuto": {"on": True, "conf": True, "rem": True}}, w)
    b.ok("[nitro] y queda en la base y en B", p.evaluate("()=>JSON.stringify(window.__DB['biz/U1'].waAuto)+JSON.stringify(B.waAuto)") == '{"on":true,"conf":true,"rem":true}' * 2)
    b.ok("[nitro] el resto del negocio sigue igual", p.evaluate("()=>window.__DB['biz/U1'].name==='Taller Prueba'&&window.__DB['biz/U1'].services.length===2"))
    b.ok("[nitro] encendido: aparecen las dos casillas marcadas", p.evaluate("()=>document.getElementById('waaC').checked&&document.getElementById('waaR').checked"))
    p.evaluate("()=>document.getElementById('waaC').click()"); p.wait_for_timeout(400)
    b.ok("[nitro] quitar «Confirmación cuando reserva» guarda conf:false", waauto(b, p)[-1][2] == {"waAuto": {"on": True, "conf": False, "rem": True}}, waauto(b, p)[-1])
    b.ok("[nitro] encendido cuenta para recomendar Nitro", p.evaluate("()=>usedFeats().some(f=>/Recordatorios automáticos/.test(f.n)&&f.k==='nitro')&&recPlan()==='nitro'"))
    b.ok("[nitro] la fila de Ajustes dice «Encendidos»", "Encendidos" in p.evaluate("()=>document.getElementById('waaN').textContent"))
    p.evaluate("()=>document.getElementById('waaT').click()")
    b.ok("[nitro] «Enviarme una prueba» llama /wa/prueba y avisa a qué número", esperar(p, "()=>/te mandamos la prueba/.test(document.getElementById('toast').textContent)&&/8888/.test(document.getElementById('toast').textContent)"),
         p.evaluate("()=>document.getElementById('toast').textContent"))
    for err, frase in (("limite", "3 pruebas"), ("tope", "mensajes de este mes"), ("tel", "Mi negocio"), ("no_config", "conectando"), ("wa", "no aceptó"), ("plan", "no incluye"), ("sesion", "sesión")):
        p.unroute("**/wa/prueba"); worker(p, prueba={"error": err})
        p.evaluate("()=>{document.getElementById('toast').textContent='';document.getElementById('waaT').click()}")
        b.ok("[nitro] prueba con error «%s»: lo explica" % err, esperar(p, "()=>document.getElementById('toast').textContent.indexOf(%s)>=0" % json.dumps(frase)),
             p.evaluate("()=>document.getElementById('toast').textContent"))
    p.unroute("**/wa/prueba"); worker(p, prueba="red")
    p.evaluate("()=>{document.getElementById('toast').textContent='';document.getElementById('waaT').click()}")
    b.ok("[nitro] prueba sin internet: «Sin conexión» y el botón vuelve", esperar(p, "()=>/Sin conexión/.test(document.getElementById('toast').textContent)&&!document.getElementById('waaT').disabled"))
    p.evaluate("()=>document.getElementById('waaOn').click()"); p.wait_for_timeout(400)
    b.ok("[nitro] apagar guarda on:false y conserva las casillas", waauto(b, p)[-1][2] == {"waAuto": {"on": False, "conf": False, "rem": True}}, waauto(b, p)[-1])
    b.ok("[nitro] apagado ya no cuenta para la recomendación", p.evaluate("()=>!usedFeats().some(f=>/Recordatorios automáticos/.test(f.n))"))
    b.ok("[nitro] sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
    p.context.close()

    # Nitro: si /wa/uso falla, «—» y nada se rompe
    d, u = datos()
    p = abrir_app(b, d, u, "nitro", antes=ESPIA)
    worker(p, uso="red")
    abrir_hoja(p); p.wait_for_timeout(300)
    b.ok("[nitro · sin red] el uso muestra «—» y el interruptor sigue disponible",
         p.evaluate("()=>document.getElementById('waaU').textContent==='—'&&!document.getElementById('waaOn').disabled"))
    b.ok("[nitro · sin red] sin errores de JS", not p.errs, p.errs[:2])
    p.context.close()

    # ---------- 3) live:false: aviso y todo deshabilitado ----------
    d, u = datos()
    p = abrir_app(b, d, u, "nitro", antes=ESPIA)
    worker(p, uso=dict(USO, live=False, n=0))
    abrir_hoja(p)
    esperar(p, "()=>!!document.getElementById('waaLive')")
    b.ok("[live:false] aviso «Muy pronto: estamos terminando de conectar WhatsApp»", "Muy pronto: estamos terminando de conectar WhatsApp" in texto_hoja(p))
    b.ok("[live:false] interruptor y prueba deshabilitados", p.evaluate("()=>document.getElementById('waaOn').disabled&&document.getElementById('waaT').disabled"))
    p.evaluate("()=>document.getElementById('waaOn').click()"); p.wait_for_timeout(300)
    b.ok("[live:false] tocarlo no guarda nada", not waauto(b, p), waauto(b, p))
    p.context.close()

    # ---------- 4) Prueba gratis ----------
    d, u = datos()
    p = abrir_app(b, d, u, "prueba", antes=ESPIA)
    worker(p, uso=dict(USO, plan="prueba", max=20, n=3))
    abrir_hoja(p)
    b.ok("[prueba] «Son 20 mensajes para que lo veás funcionar»", "Son 20 mensajes para que lo veás funcionar" in texto_hoja(p), texto_hoja(p)[-300:])
    b.ok("[prueba] uso «3 de 20»", esperar(p, "()=>document.getElementById('waaU').textContent==='3 de 20 mensajes de tu prueba'"))
    p.context.close()

    # ---------- 4b) Plan vencido, pausado o demo: igual que el Worker, no lo tiene ----------
    for nombre, sub in (("prueba vencida", {"status": "trial", "until": ts(-1)}), ("plan pausado", {"status": "suspended", "tier": "nitro", "until": ts(20)}), ("cuenta demo", {"status": "active", "tier": "nitro", "demo": True, "until": ts(20)})):
        d, u = datos(waAuto={"on": True})
        d["subs/U1"] = sub
        p = abrir_app(b, d, u, "", antes=ESPIA)
        b.ok("[%s] waPlan() vacío: sin interruptor" % nombre, p.evaluate("()=>waPlan()===''"))
        p.context.close()
    # Arranque con el extra: la función no se cuenta como «de Nitro» al recomendar plan
    d, u = datos(waAuto={"on": True})
    d["subs/U1"] = {"status": "active", "tier": "arranque", "waauto": True, "until": ts(20)}
    p = abrir_app(b, d, u, "", antes=ESPIA)
    b.ok("[extra] Arranque con el extra: lo tiene y no se le dice que es de Nitro", p.evaluate("()=>waPlan()==='extra'&&!usedFeats().some(f=>/Recordatorios automáticos/.test(f.n))"))
    p.context.close()

    # ---------- 5) Marcas en la cita ----------
    d, u = datos(waAuto={"on": True})
    d["biz/U1/jobs/701"] = cita("701", waC=1700000000000)
    d["biz/U1/jobs/702"] = cita("702", waC=1700000000000, waR=1700000100000, waRd=HOY)
    d["biz/U1/jobs/703"] = cita("703", waR=1700000100000, waRd=OTRO)               # recordatorio de otra fecha (la movieron): no cuenta
    d["biz/U1/jobs/704"] = cita("704", waE="tope")
    d["biz/U1/jobs/705"] = cita("705", waC=1700000000000, waE="tel")
    d["biz/U1/jobs/706"] = cita("706", waC=1700000000000, waR=1700000100000, waRd=HOY, waE="error")  # ya salieron los dos: sin aviso
    d["biz/U1/jobs/707"] = cita("707", waE="error")
    d["biz/U1/jobs/708"] = cita("708", web=False, src="app")                       # cita de siempre: nada nuevo
    d["biz/U1/jobs/711"] = cita("711", waC=1700000000000, waR=1700000100000, waRd=HOY, waA="si", waAt=1700000200000, waAd=HOY + " 09:00")   # tocó «Confirmo»
    d["biz/U1/jobs/712"] = cita("712", waR=1700000100000, waRd=HOY, waA="no", waAt=1700000200000, waAd=HOY + " 10:00")                      # tocó «No puedo ir»
    d["biz/U1/jobs/713"] = cita("713", waR=1700000100000, waRd=HOY, waA="si", waAt=1700000200000, waAd=HOY + " 08:00")                      # confirmó, pero después le cambiaron la hora
    d["biz/U1/jobs/714"] = cita("714", waA="tal vez", waAd=HOY + " 12:00")                                                                 # dato raro: no se muestra
    p = abrir_app(b, d, u, "nitro", antes=ESPIA)
    M = """(id)=>waMarks(JOBS.find(x=>x._id===id)).map(m=>m[1])"""
    K = """(id)=>[].map.call(document.querySelectorAll('.job[data-id="'+id+'"] .wamk'),x=>x.textContent)"""
    b.ok("[cita] waC → «✓ Confirmación automática enviada»", p.evaluate(M, "701") == ["✓ Confirmación automática enviada"], p.evaluate(M, "701"))
    b.ok("[cita] waC + waR del mismo día → las dos marcas", p.evaluate(M, "702") == ["✓ Confirmación automática enviada", "✓ Recordatorio automático enviado"], p.evaluate(M, "702"))
    b.ok("[cita] recordatorio de otra fecha no cuenta", p.evaluate(M, "703") == [], p.evaluate(M, "703"))
    b.ok("[cita] waE tope → «se acabaron los mensajes»", p.evaluate(M, "704") == ["No salió el WhatsApp automático: se acabaron los mensajes"], p.evaluate(M, "704"))
    b.ok("[cita] waC + waE tel → marca y aviso «número no válido»", p.evaluate(M, "705") == ["✓ Confirmación automática enviada", "No salió el WhatsApp automático: el número del cliente no es válido o no tiene WhatsApp"], p.evaluate(M, "705"))
    b.ok("[cita] si ya salieron los dos, waE no se muestra", p.evaluate(M, "706") == ["✓ Confirmación automática enviada", "✓ Recordatorio automático enviado"], p.evaluate(M, "706"))
    b.ok("[cita] waE error → «WhatsApp no lo aceptó»", p.evaluate(M, "707") == ["No salió el WhatsApp automático: WhatsApp no lo aceptó"], p.evaluate(M, "707"))
    b.ok("[cita] una cita sin esos campos no muestra nada", p.evaluate(M, "708") == [] and p.evaluate(K, "708") == [])
    b.ok("[cita] el cliente tocó «Confirmo» → va primero «✅ El cliente confirmó que llega»", p.evaluate(M, "711") == ["✅ El cliente confirmó que llega", "✓ Confirmación automática enviada", "✓ Recordatorio automático enviado"], p.evaluate(M, "711"))
    b.ok("[cita] el cliente tocó «No puedo ir» → «⚠️ El cliente avisó que no puede llegar»", p.evaluate(M, "712") == ["⚠️ El cliente avisó que no puede llegar", "✓ Recordatorio automático enviado"], p.evaluate(M, "712"))
    b.ok("[cita] si después le cambiaron la hora, la respuesta vieja ya no se muestra", p.evaluate(M, "713") == ["✓ Recordatorio automático enviado"], p.evaluate(M, "713"))
    b.ok("[cita] una respuesta con un dato raro no se muestra", p.evaluate(M, "714") == [] and p.evaluate(K, "714") == [], p.evaluate(M, "714"))
    b.ok("[agenda] tarjeta: «✅ Confirmó que llega», sola y en verde", p.evaluate(K, "711") == ["✅ Confirmó que llega"] and p.evaluate("()=>!document.querySelector('.job[data-id=\"711\"] .wamk').classList.contains('wbad')"), p.evaluate(K, "711"))
    b.ok("[agenda] tarjeta: «⚠️ Avisó que no puede llegar», como aviso", p.evaluate(K, "712") == ["⚠️ Avisó que no puede llegar"] and p.evaluate("()=>document.querySelector('.job[data-id=\"712\"] .wamk').classList.contains('wbad')"), p.evaluate(K, "712"))
    b.ok("[agenda] tarjeta: marca corta de confirmación", p.evaluate(K, "701") == ["✓ Confirmación automática enviada"], p.evaluate(K, "701"))
    b.ok("[agenda] tarjeta: las dos en una línea", p.evaluate(K, "702") == ["✓ Confirmación y recordatorio enviados"], p.evaluate(K, "702"))
    b.ok("[agenda] tarjeta: aviso corto cuando no salió", p.evaluate(K, "704") == ["No salió el WhatsApp automático"] and p.evaluate(K, "705") == ["✓ Confirmación automática enviada", "No salió el WhatsApp automático"], [p.evaluate(K, "704"), p.evaluate(K, "705")])
    b.ok("[agenda] tarjeta: sin marca si el recordatorio era de otra fecha", p.evaluate(K, "703") == [])
    b.ok("[cita] siguen los botones manuales de WhatsApp", p.evaluate("()=>document.querySelector('.job[data-id=\"702\"]').closest('.jc').querySelector('.ja .btn.wa').textContent.indexOf('Recordar')>=0"))
    p.evaluate("()=>openJob(JOBS.find(x=>x._id==='705'))"); p.wait_for_timeout(400)
    b.ok("[cita · detalle] muestra las marcas", p.evaluate("()=>document.getElementById('jWa').innerText") == "✓ Confirmación automática enviada\nNo salió el WhatsApp automático: el número del cliente no es válido o no tiene WhatsApp",
         p.evaluate("()=>(document.getElementById('jWa')||{}).innerText"))
    b.ok("[cita · detalle] siguen los botones manuales", p.evaluate("()=>!!document.querySelector('#shC [data-wa=\"rec\"]')"))
    p.evaluate("()=>{document.getElementById('jN').value='Nota nueva';document.getElementById('jSave').click()}"); p.wait_for_timeout(800)
    j = p.evaluate("()=>window.__DB['biz/U1/jobs/705']")
    b.ok("[cita] guardar la cita no borra waC ni waE", j.get("note") == "Nota nueva" and j.get("waC") == 1700000000000 and j.get("waE") == "tel", j)
    p.evaluate("()=>openJob(JOBS.find(x=>x._id==='708'))"); p.wait_for_timeout(400)
    b.ok("[cita · detalle] cita sin campos: sin marcas", p.evaluate("()=>!document.getElementById('jWa')"))
    p.evaluate("()=>closeSheet(true)")
    wj = [x for x in b.escrituras(p, "biz/U1/jobs") if x[2] and any(k in x[2] for k in ("waC", "waR", "waRd", "waE"))]
    b.ok("[cita] la app nunca escribe waC/waR/waRd/waE", not wj, wj[:2])
    b.ok("[cita] sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
    p.context.close()

    # ---------- 6) Función apagada: la app no llama nunca a /wa/ ----------
    d, u = datos()
    d["biz/U1/jobs/801"] = cita("801")
    p = abrir_app(b, d, u, "nitro", antes=ESPIA)
    for v in ("agenda", "clientes", "numeros", "ajustes", "agenda"):
        p.evaluate("v=>{closeSheet(true);document.querySelector('nav.tabs [data-v=\"'+v+'\"]').click()}", v); p.wait_for_timeout(300)
    for k in ("neg", "svc", "ntf", "plan", "mode"):
        p.evaluate("k=>{closeSheet(true);openSet(k)}", k); p.wait_for_timeout(250)
    p.evaluate("()=>{closeSheet(true);openJob(JOBS.find(x=>x._id==='801'))}"); p.wait_for_timeout(400)
    p.evaluate("()=>document.getElementById('jSave').click()"); p.wait_for_timeout(800)
    b.ok("[apagado] usar la app (vistas, ajustes, citas) no hace ninguna llamada a /wa/", p.evaluate(WA) == [], p.evaluate(WA))
    b.ok("[apagado] no aparece waAuto en el negocio ni marcas en la agenda", p.evaluate("()=>!('waAuto' in window.__DB['biz/U1'])&&!document.querySelector('.wamk,#jWa')"))
    b.ok("[apagado] no cuenta para la recomendación de plan", p.evaluate("()=>!usedFeats().some(f=>/Recordatorios automáticos/.test(f.n))"))
    b.ok("[apagado] sin errores de JS", not p.errs, p.errs[:2])
    p.context.close()
