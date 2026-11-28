"""Admin nuevo · Ficha del negocio: secciones, ids del editor clásico (los usan automatizaciones), cambios sin
guardar (barra Guardar, aviso al salir), Guardar deja E===null, rutas ../../, uso real, link que no abre,
bloqueo de cobros con cambios pendientes y recarga directa en #negocio/<id>."""
from urllib.parse import urlparse
from ayuda import Banco, nuevo, datos, errores, T0

IDS = ["eN", "eT", "eW", "eA", "eE", "eTm", "eLg", "eLb", "eLf", "eC", "eCc", "eSv", "eSvA", "eH", "eZ", "eZa", "eZw", "wTg", "wBl", "wPr", "wPn", "wFt", "wAb", "wSn", "wHn",
       "wFq", "wFqA", "wRv", "wRvA", "wGr", "wIg", "wFb", "wTt", "wEm", "wVd", "ePh", "ePhA", "ePhF", "md_vehiculo", "md_insumos", "vehCfg", "eVh", "eVhA", "pPl", "pTo", "pMon",
       "impT", "impGo", "eErr", "eGo", "eX", "eX2"] + ["ha%d" % d for d in range(7)] + ["hb%d" % d for d in range(7)]
SECS = ["datos", "svc", "hor", "web", "fotos", "equipo", "mods", "plan", "notas", "peligro"]

with Banco() as b:
    p = nuevo(b, hash_="negocio/b_full", espera=2200)
    falta = p.evaluate("ids=>ids.filter(i=>!document.getElementById(i))", IDS)
    b.ok("Ficha: están todos los ids del editor clásico", not falta, falta)
    b.ok("Ficha: estado E del negocio abierto", p.evaluate("()=>E&&E.id==='b_full'&&E.name==='Detailing Las Brisas'"))
    b.ok("Ficha: servicios con data-i/data-k", p.locator('#eSv [data-i="0"][data-k="n"]').count() == 1)
    secs = p.evaluate("()=>[...document.querySelectorAll('#ed .a-sec')].map(d=>d.dataset.sec)")
    b.ok("Ficha: secciones plegables en orden", secs == SECS, secs)
    b.ok("Ficha: cerradas al abrir", p.evaluate("()=>[...document.querySelectorAll('#ed .a-sec')].every(d=>!d.open)"))
    b.ok("Ficha: tarjeta de llenar con IA arriba", p.evaluate("()=>{const a=document.querySelector('#ed .a-ia'),s=document.querySelector('#ed .a-sec');return !!a&&!!(a.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING)}"))
    b.ok("Ficha: qué le falta (6 de 6)", "6 de 6" in p.text_content("#ed .a-card .a-t"), p.text_content("#ed .a-card .a-t"))
    b.ok("Ficha: plan y cobros", "Turbo" in p.text_content("#fPlan") and p.locator('#fPlan [data-u="pay"]').count() == 1, p.text_content("#fPlan"))
    b.ok("Modelo viejo: un negocio mensual no ve los planes de instalación", p.evaluate("()=>[...document.querySelectorAll('#pPl option')].map(o=>o.value).join(',')") == "trial,mensual,demo")
    b.ok("Ficha: no hay barra Guardar sin cambios", p.evaluate("()=>document.getElementById('fSave').hidden"))
    # rutas
    base = b.base
    hrefs = p.evaluate("()=>[...document.querySelectorAll('#ed .a-q a')].map(a=>a.href)")
    b.ok("Rutas: Ver web y Reservas apuntan a la raíz del sitio", hrefs == [base + "/detailing-las-brisas", base + "/r/?n=detailing-las-brisas"], hrefs)
    b.ok("Rutas: admin clásico es ../clasico/", p.evaluate("()=>[...document.querySelectorAll('#v-mas a')].find(a=>a.textContent.indexOf('clásico')>=0).href") == base + "/admin/clasico/")
    b.ok("Rutas: cfg.js y style.css se cargan desde la raíz", p.evaluate("()=>typeof CITALY==='object'&&[...document.styleSheets].some(s=>(s.href||'').endsWith('/style.css'))"))
    b.ok("Rutas: noindex", p.get_attribute('meta[name="robots"]', "content") == "noindex")
    p.click('#ed [data-u="copy"]'); p.wait_for_timeout(200)
    b.ok("Copiar link de reservas: citalyapp.com/<link>/reservar", p.evaluate("()=>window.__COPIADO.slice(-1)[0]") == "https://citalyapp.com/detailing-las-brisas/reservar")
    # uso real (una lectura acotada al abrir)
    p.wait_for_timeout(300)
    b.ok("Uso real: última cita y citas en 30 días (sin las canceladas)", "Última cita" in p.text_content("#fUse") and "5 citas" in p.text_content("#fUse"), p.text_content("#fUse"))
    # qué le falta → abre la sección
    p.click('#ed .a-ck[data-go="svc"]'); p.wait_for_timeout(300)
    b.ok("Qué le falta: tocar un paso abre su sección", p.evaluate("()=>document.querySelector('#ed .a-sec[data-sec=\"svc\"]').open"))
    # cambios sin guardar
    p.click('#ed .a-sec[data-sec="web"] > summary'); p.wait_for_timeout(100)
    p.fill("#wTg", "Otra frase"); p.wait_for_timeout(100)
    b.ok("Cambios: aparece la barra Guardar", p.evaluate("()=>!document.getElementById('fSave').hidden&&UI.isDirty()"))
    p.evaluate("()=>{window.__CQ=[false]}")
    p.evaluate("()=>{location.hash='#hoy'}"); p.wait_for_timeout(400)
    b.ok("Cambios: al salir pregunta y si digo que no se queda", p.evaluate("()=>location.hash==='#negocio/b_full'&&E&&E.id==='b_full'&&document.getElementById('wTg').value==='Otra frase'"), p.evaluate("()=>[location.hash,window.__CONFIRMS]"))
    b.ok("Cambios: la pregunta menciona cambios sin guardar", "sin guardar" in (p.evaluate("()=>window.__CONFIRMS.slice(-1)[0]") or ""))
    p.evaluate("()=>{window.__CQ=[]}")
    # con cambios no deja cobrar (evita que Guardar pise el plan)
    p.evaluate("()=>{window.__PROMPTS.length=0;window.__WRITES.length=0}")
    p.click('#fPlan [data-u="pay"]'); p.wait_for_timeout(300)
    b.ok("Cambios: con cambios pendientes no deja registrar pago", p.evaluate("()=>window.__PROMPTS.length===0&&window.__WRITES.length===0") and "guardá" in p.text_content("#toast").lower())
    # guardar
    p.click("#eGo"); p.wait_for_timeout(1400)
    b.ok("Guardar: E===null y vuelve a la lista", p.evaluate("()=>E===null&&location.hash==='#negocios'&&document.getElementById('ed').hidden"), p.evaluate("()=>[E,location.hash]"))
    b.ok("Guardar: se guardó la frase", p.evaluate("()=>window.__DB['biz/b_full'].tagline") == "Otra frase")
    # salir sin cambios no pregunta; Cerrar con cambios sí
    p.evaluate("()=>{location.hash='#negocio/b_full'}"); p.wait_for_timeout(900)
    n0 = p.evaluate("()=>window.__CONFIRMS.length")
    p.click("#eX"); p.wait_for_timeout(300)
    b.ok("Cerrar sin cambios: no pregunta y deja E===null", p.evaluate("n=>window.__CONFIRMS.length===n&&E===null&&location.hash==='#negocios'", n0))
    # registrar mensualidad sin cambios: la ficha se actualiza sola con el plan nuevo
    p.evaluate("()=>{location.hash='#negocio/b_paga'}"); p.wait_for_timeout(900)
    p.evaluate("()=>{window.__PQ=['1','500']}")
    antes_txt = p.text_content("#fPlan")
    p.click('#fPlan [data-u="pay"]'); p.wait_for_timeout(1500)
    b.ok("Cobrar desde la ficha: la ficha se actualiza con la nueva fecha", p.text_content("#fPlan") != antes_txt and p.evaluate("()=>E&&E.id==='b_paga'") and p.evaluate("()=>window.__DB['subs/b_paga'].months") == 2, p.text_content("#fPlan"))
    b.ok("Cobrar desde la ficha: ofrece avisar por WhatsApp", p.locator("#waGo").count() == 1)
    p.evaluate("()=>document.querySelector('.shOv').remove()")
    # negocio sin página pública: aviso con Volver a publicar
    p.evaluate("()=>{location.hash='#negocio/b_nosub'}"); p.wait_for_timeout(1000)
    b.ok("Link que no abre: avisa en la ficha", "no abre" in p.text_content("#fWarnPub") and p.locator("#fRepub").count() == 1, p.text_content("#fWarnPub"))
    p.click("#fRepub"); p.wait_for_timeout(1400)
    b.ok("Volver a publicar = Guardar: crea pub/<link>", p.evaluate("()=>!!window.__DB['pub/unas-bella']&&window.__DB['pub/unas-bella'].biz==='b_nosub'"))
    # id que no existe
    p.evaluate("()=>{location.hash='#negocio/no-existe'}"); p.wait_for_timeout(500)
    b.ok("Ficha de un id que no existe: vuelve a la lista", p.evaluate("()=>location.hash==='#negocios'&&E===null"))
    b.ok("Ficha: sin errores", not errores(p), errores(p)[:3])

    # Recargar directo en la ficha
    p = nuevo(b, hash_="negocio/b_viejo", espera=2200)
    b.ok("Recarga en #negocio/<id>: abre la ficha", p.evaluate("()=>E&&E.id==='b_viejo'&&!document.getElementById('ed').hidden"))
    b.ok("Modelo viejo: un negocio que ya está en Standard lo conserva en el selector", p.evaluate("()=>[...document.querySelectorAll('#pPl option')].map(o=>o.value).join(',')") == "trial,mensual,standard,demo" and p.evaluate("()=>document.getElementById('pPl').value") == "standard")
    b.ok("Ficha vieja: muestra lo pagado de la instalación", "Pagó" in p.text_content("#fPlan") and "debe" in p.text_content("#fPlan"), p.text_content("#fPlan"))
    p.go_back(); p.wait_for_timeout(300)
    # Atrás del navegador
    p = nuevo(b, hash_="negocios", espera=2000)
    p.click('#list a[href="#negocio/b_full"]'); p.wait_for_timeout(900)
    p.go_back(); p.wait_for_timeout(500)
    b.ok("Atrás: de la ficha vuelve a la lista (E===null)", p.evaluate("()=>location.hash==='#negocios'&&E===null"))
    p.go_forward(); p.wait_for_timeout(900)
    b.ok("Adelante: vuelve a la ficha", p.evaluate("()=>E&&E.id==='b_full'"))
    # Nuevo negocio: validación abre la sección y muestra el error en la barra
    p.evaluate("()=>{location.hash='#negocio/nuevo'}"); p.wait_for_timeout(500)
    p.evaluate("()=>{document.querySelectorAll('#ed .a-sec').forEach(d=>d.open=false)}")
    p.click("#eGo"); p.wait_for_timeout(500)
    b.ok("Nuevo: al faltar el nombre abre Datos y muestra el error", p.evaluate("()=>document.querySelector('#ed .a-sec[data-sec=\"datos\"]').open") and "nombre" in p.text_content("#eErr"), p.text_content("#eErr"))
    b.ok("Nuevo: no escribió nada", not p.evaluate("()=>window.__WRITES.length"))
    b.ok("Al crear solo se ofrece prueba gratis o demo (M3: sin mensualidad regalada)", p.evaluate("()=>[...document.querySelectorAll('#pPl option')].map(o=>o.value).join(',')") == "trial,demo")
    b.ok("Ficha (2): sin errores", not errores(p), errores(p)[:3])

    # Compu: la fila del negocio abierto queda marcada
    p = nuevo(b, hash_="negocio/b_full", espera=2200, ancho=1280, alto=800, movil=False)
    b.ok("Compu: lista y ficha a la vez, fila marcada", p.evaluate("()=>document.querySelector('#list a[aria-current=\"true\"]').getAttribute('href')==='#negocio/b_full'&&document.querySelector('.a-listpane').offsetWidth>0&&!document.getElementById('ed').hidden"))

    # U9: tocar un día del horario muestra la barra Guardar; abrir/cerrar una sección no
    p = nuevo(b, hash_="negocio/b_full", espera=2000)
    p.click('#ed .a-sec[data-sec="hor"] > summary'); p.click('#ed .a-sec[data-sec="web"] > summary'); p.click('#ed .a-sec[data-sec="web"] > summary'); p.wait_for_timeout(150)
    b.ok("U9: abrir y cerrar secciones no muestra la barra Guardar", p.evaluate("()=>document.getElementById('fSave').hidden&&!UI.isDirty()"))
    p.click('[data-hd="0"]'); p.wait_for_timeout(150)
    b.ok("U9: tocar un día del horario sí muestra la barra Guardar", p.evaluate("()=>!document.getElementById('fSave').hidden&&UI.isDirty()"))
    # U6: el aviso del navegador al cerrar o recargar con cambios sin guardar
    av = p.evaluate("()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented}")
    b.ok("U6: con cambios, cerrar o recargar la página avisa (beforeunload)", av is True)
    p.evaluate("()=>{window.__CQ=[true];location.hash='#negocios'}"); p.wait_for_timeout(300)
    av = p.evaluate("()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented}")
    b.ok("U6: sin cambios no avisa", av is False)
    # G2 y M4: negocio sin subs
    p.evaluate("()=>{location.hash='#negocio/b_nosub'}"); p.wait_for_timeout(1000)
    b.ok("G2: sin subs preselecciona Prueba gratis (solo prueba o demo)", p.evaluate("()=>document.getElementById('pPl').value") == "trial" and p.evaluate("()=>[...document.querySelectorAll('#pPl option')].map(o=>o.value).join(',')") == "trial,demo")
    btn = p.evaluate("()=>[...document.querySelectorAll('#fPlan .a-bt button')].map(x=>x.textContent)")
    b.ok("M4: sin plan, el botón principal es Poner en prueba gratis y el extra queda aparte", btn[:2] == ["Poner en prueba gratis", "Cobrar un extra"] and "a-b pri" in p.evaluate("()=>document.querySelector('#fPlan [data-u=\"mensNone\"]').className"), btn)
    p.evaluate("()=>{window.__PROMPTS.length=0;window.__WRITES.length=0}")
    p.click('#fPlan [data-u="mensNone"]'); p.wait_for_timeout(300)
    b.ok("M4: sin plan, el botón principal no cobra el módulo de ₡40.000: guía a crear la prueba", p.evaluate("()=>window.__PROMPTS.length===0&&window.__WRITES.length===0") and "prueba gratis" in p.text_content("#toast") and p.evaluate("()=>document.querySelector('#ed .a-sec[data-sec=\"plan\"]').open"))
    b.ok("Ficha (3): sin errores", not errores(p), errores(p)[:3])
