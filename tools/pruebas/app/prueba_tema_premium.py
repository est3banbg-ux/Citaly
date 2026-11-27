"""Temas premium de la app (Laca y Perla), en «Mi apariencia» → Temas → Premium. Turbo en adelante.
- Prueba gratis, Turbo y Nitro: se pueden elegir; ponen las clases tm-prem / tm-laca / tm-perla y se guardan en biz.uiAp.
- Arranque: salen con candado «Desde Turbo»; tocarlos abre los planes y no cambia nada. Si el negocio lo traía
  guardado (de la prueba), queda guardado pero se ve el diseño normal.
- Con el tema puesto la app sigue igual: se crea una cita, se marca atendida (y pasa el brillo .p-done),
  los atajos conservan su ícono (favAll lee el emoji con .textContent) y no hay desborde ni errores.
- Al volver a un tema de siempre se quitan las clases, los emojis vuelven a ser texto y la barra del sistema recupera su color.
- Casos que encontró la revisión de Opus (27 nov 2026): el plan cambia con la app abierta; en la pantalla de entrar el botón
  de Google no se pinta de morado; en compu los botones de cada cita quedan todos a la vista (con mouse no se puede deslizar);
  si otra persona del equipo marca la cita, aquí no brilla; y en Arranque el tema guardado no se asoma ni un instante."""
import os, sys
os.environ.pop("TEMA", None)   # esta prueba elige el tema ella misma: no debe arrancar con uno puesto (TEMA=laca correr.py app)
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia, html_mal, esperar

HOY = dia(0, saltar_domingo=False)
GUARDADO = lambda **k: "try{localStorage.setItem('citaly_ap',JSON.stringify(%s))}catch(e){};" % str(dict(k)).replace("'", '"')
EST = """()=>{var r=document.documentElement;return {cl:r.className,modo:r.getAttribute('data-mode'),on:PREM.on(),
  bg:getComputedStyle(r).getPropertyValue('--bg').trim(),lupa:document.getElementById('srTop').textContent,
  pi:document.querySelectorAll('#srTop .pi').length,ancho:r.scrollWidth-innerWidth,ico:!!document.getElementById('premIco'),
  barra:(document.querySelector('meta[name="theme-color"]')||{}).content}}"""
VIGILA = "window.__ASOMO=0;new MutationObserver(function(){if(document.documentElement.classList.contains('tm-prem'))window.__ASOMO++}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});"


def datos():
    d, u = negocio()
    d["biz/U1/jobs/902"] = {"id": "902", "cli": "Beto Remoto", "tel": "8822 3344", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}],
                            "date": HOY, "time": "16:00", "dur": 60, "sub": 8000, "disc": 0, "fee": 0, "total": 8000, "veh": "", "ubic": "", "addr": "", "zone": "",
                            "how": "", "note": "", "st": "Confirmada", "web": False, "src": "app", "at": 2, "upd": 2}
    d["biz/U1/jobs/901"] = {"id": "901", "cli": "Ana Premium", "tel": "8811 2233", "items": ["Lavado básico"], "lines": [{"n": "Lavado básico", "p": 8000}],
                            "date": HOY, "time": "10:00", "dur": 60, "sub": 8000, "disc": 0, "fee": 0, "total": 8000, "veh": "", "ubic": "", "addr": "", "zone": "",
                            "how": "", "note": "", "st": "Confirmada", "web": False, "src": "app", "at": 1, "upd": 1}
    return d, u


def hoja_temas(p):
    p.evaluate("()=>{closeSheet(true);APA.sheet('t')}")
    p.wait_for_timeout(300)


def elegir(p, sel):
    p.evaluate("s=>document.querySelector(s).click()", sel)
    p.wait_for_timeout(450)


def ver(p, v):
    p.evaluate("v=>{closeSheet(true);document.querySelector('nav.tabs [data-v=\"'+v+'\"]').click()}", v)
    p.wait_for_timeout(500)


with Banco() as b:
    # ---------- 1) Prueba gratis: se pueden elegir y todo sigue funcionando ----------
    d, u = datos()
    p = abrir_app(b, d, u, "prueba")
    e = p.evaluate(EST)
    b.ok("[prueba] sin elegir nada: diseño de siempre, sin estilos ni íconos del tema", "tm-prem" not in e["cl"] and e["on"] == "" and e["pi"] == 0 and not e["ico"], e)
    BARRA0 = e["barra"]
    hoja_temas(p)
    b.ok("[prueba] Mi apariencia ofrece Laca y Perla", p.evaluate("()=>[].map.call(document.querySelectorAll('#prG [data-pm]'),x=>x.dataset.pm).join()") == "laca,perla")
    b.ok("[prueba] sin candado y avisa que en la prueba se puede usar", p.evaluate("()=>!document.querySelector('#prG .lk')&&/en tu prueba/.test(document.getElementById('prN').textContent)"))
    elegir(p, '#prG [data-pm="laca"]')
    e = p.evaluate(EST)
    b.ok("[prueba] Laca: clases, modo oscuro y fondo de laca", "tm-prem" in e["cl"] and "tm-laca" in e["cl"] and e["modo"] == "dark" and e["on"] == "laca" and e["bg"] == "#07060c", e)
    b.ok("[prueba] Laca: la lupa es un ícono pero el emoji sigue como texto", e["pi"] == 1 and e["lupa"] == "🔍", e)
    b.ok("[prueba] Laca: la barra del sistema toma el color del tema", e["barra"] == "#07060c", e["barra"])
    b.ok("[prueba] Laca: se guarda en el negocio (uiAp.pack)", (p.evaluate("()=>(window.__DB['biz/U1'].uiAp||{}).pack") == "laca"))
    b.ok("[prueba] Laca: el mosaico queda marcado", p.evaluate("()=>document.querySelector('#prG [data-pm=\"laca\"]').getAttribute('aria-pressed')") == "true")
    for v in ("agenda", "clientes", "numeros", "ajustes"):
        ver(p, v)
        b.ok("[prueba] Laca · %s: sin desborde horizontal" % v, p.evaluate("()=>document.documentElement.scrollWidth-innerWidth") <= 0)
    b.ok("[prueba] Laca: los atajos conservan su ícono", p.evaluate("()=>{var s=document.querySelectorAll('#favBar .fch span');return s.length>2&&[].every.call(s,x=>x.textContent.trim().length>0)}"),
         p.evaluate("()=>[].map.call(document.querySelectorAll('#favBar .fch span'),x=>x.textContent).join('|')"))
    # crear una cita con el tema puesto
    ver(p, "agenda")
    p.evaluate("""f=>{openJob(null,{date:f});document.getElementById('jC').value='Cliente Laca';
      document.querySelector('#jS [data-n="Pulido de focos"]').click();
      var h=document.getElementById('jH');h.value='14:00';h.dispatchEvent(new Event('change'));document.getElementById('jSave').click()}""", HOY)
    p.wait_for_timeout(700)
    b.ok("[prueba] Laca: se crea una cita", p.evaluate("()=>Object.values(window.__DB).some(j=>j&&j.cli==='Cliente Laca'&&j.total===15000)"))
    # marcar atendida: cambia en la base y pasa el brillo
    p.evaluate("""()=>{var s=document.querySelector('.job[data-id="901"]').closest('.jc').querySelector('.ja select');s.value='Lista';s.dispatchEvent(new Event('change',{bubbles:true}))}""")
    p.wait_for_timeout(500)
    pregunta = p.evaluate("()=>document.getElementById('sh').classList.contains('on')")
    b.ok("[prueba] Laca: con la hoja de pago abierta el brillo espera", (not pregunta) or p.evaluate("()=>!document.querySelector('.p-done')"), pregunta)
    p.evaluate("()=>closeSheet(true)")
    brillo = esperar(p, "()=>!!document.querySelector('.jc.p-done .job[data-id=\"901\"]')", 1500)
    b.ok("[prueba] Laca: marcar atendida guarda «Lista»", p.evaluate("()=>window.__DB['biz/U1/jobs/901'].st") == "Lista")
    b.ok("[prueba] Laca: al marcar atendida pasa el brillo por la tarjeta", brillo)
    p.wait_for_timeout(1500)
    b.ok("[prueba] Laca: el brillo se quita solo", p.evaluate("()=>!document.querySelector('.p-done')"))
    # Perla y vuelta al diseño de siempre
    hoja_temas(p); elegir(p, '#prG [data-pm="perla"]')
    e = p.evaluate(EST)
    b.ok("[prueba] Perla: clases y modo claro", "tm-perla" in e["cl"] and "tm-laca" not in e["cl"] and e["modo"] == "light" and e["bg"] == "#eceef4", e)
    elegir(p, '#thG [data-th]')
    e = p.evaluate(EST)
    b.ok("[prueba] al elegir un color básico se quita el premium y vuelven los emojis", "tm-prem" not in e["cl"] and e["on"] == "" and e["pi"] == 0 and e["lupa"] == "🔍", e)
    b.ok("[prueba] y la barra del sistema vuelve a su color", e["barra"] == BARRA0, [e["barra"], BARRA0])
    # otra persona del equipo marca una cita desde otro celular: aquí no brilla ni vibra
    hoja_temas(p); elegir(p, '#prG [data-pm="laca"]'); ver(p, "agenda")
    p.wait_for_timeout(4300)
    p.evaluate("()=>db.doc('biz/U1/jobs/902').update({st:'Lista'})")
    p.wait_for_timeout(1300)
    b.ok("[prueba] Laca: una cita marcada desde otro celular se actualiza sin brillo", p.evaluate("()=>!!document.querySelector('.job.st-Lista[data-id=\"902\"]')&&!document.querySelector('.p-done')"))
    # el plan cambia con la app abierta
    p.evaluate("()=>db.doc('subs/U1').update({status:'active',tier:'arranque'})"); p.wait_for_timeout(600)
    e = p.evaluate(EST)
    b.ok("[prueba → arranque] con la app abierta: se quita el tema y sus íconos", "tm-prem" not in e["cl"] and e["on"] == "" and e["pi"] == 0 and e["barra"] == BARRA0, e)
    p.evaluate("()=>db.doc('subs/U1').update({tier:'turbo'})"); p.wait_for_timeout(600)
    e = p.evaluate(EST)
    b.ok("[arranque → turbo] con la app abierta: vuelve el tema que tenía guardado", "tm-laca" in e["cl"] and e["pi"] == 1, e)
    b.ok("[prueba] sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
    p.context.close()

    # ---------- 2) Turbo y Nitro: el tema guardado se aplica al abrir ----------
    for plan, tema, modo in (("turbo", "laca", "dark"), ("nitro", "perla", "light")):
        d, u = datos()
        p = abrir_app(b, d, u, plan, antes=GUARDADO(pack=tema))
        e = p.evaluate(EST)
        b.ok("[%s] %s guardado: se ve al abrir" % (plan, tema), "tm-" + tema in e["cl"] and e["modo"] == modo and e["ancho"] <= 0, e)
        b.ok("[%s] con foto de fondo propia del tema" % plan, "tm-foto" in e["cl"])
        b.ok("[%s] sin errores de JS ni HTML roto" % plan, not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
        p.context.close()

    # el fondo que eligió el dueño se respeta
    d, u = datos()
    p = abrir_app(b, d, u, "turbo", antes=GUARDADO(pack="laca", bg="mesh2"))
    e = p.evaluate(EST)
    b.ok("[turbo] Laca con un fondo elegido por el dueño: no le pone la foto del tema", "tm-laca" in e["cl"] and "tm-foto" not in e["cl"], e)
    p.context.close()

    # en compu
    d, u = datos()
    p = abrir_app(b, d, u, "nitro", ancho=1366, antes=GUARDADO(pack="laca"))
    e = p.evaluate(EST)
    b.ok("[nitro · compu] Laca: sin desborde ni errores", "tm-laca" in e["cl"] and e["ancho"] <= 0 and not p.errs, [e, p.errs[:2]])
    fuera = p.evaluate("""()=>{var out=[];[].forEach.call(document.querySelectorAll('.jc .ja'),function(f){var r=f.getBoundingClientRect();
      [].forEach.call(f.children,function(x){var q=x.getBoundingClientRect();if(q.width&&(q.right>r.right+1||q.left<r.left-1))out.push(x.textContent.trim())})});return out}""")
    b.ok("[nitro · compu] Laca: todos los botones de cada cita quedan a la vista", p.evaluate("()=>document.querySelectorAll('.jc .ja > *').length") > 3 and not fuera, fuera)
    p.context.close()

    # pantalla de entrar con el tema guardado (sesión cerrada): los botones de Google y Facebook conservan su estilo
    p = abrir_app(b, {}, None, None, antes=GUARDADO(pack="perla"))
    g = p.evaluate("()=>{var x=document.querySelector('.gbtn');if(!x)return null;var c=getComputedStyle(x);return [c.backgroundImage,document.documentElement.className]}")
    b.ok("[entrar] con Perla guardado: el botón de Google no se pinta con el degradado", g is not None and g[0] == "none", g)
    b.ok("[entrar] sin errores de JS", not p.errs, p.errs[:2])
    p.context.close()

    # ---------- 3) Arranque: con candado ----------
    d, u = datos()
    p = abrir_app(b, d, u, "arranque", antes=GUARDADO(pack="laca") + "try{localStorage.setItem('citaly_pmok','0')}catch(e){};" + VIGILA)
    e = p.evaluate(EST)
    b.ok("[arranque] el tema guardado no se asoma ni un instante al abrir", p.evaluate("()=>window.__ASOMO") == 0, p.evaluate("()=>window.__ASOMO"))
    b.ok("[arranque] Laca guardado de la prueba: se ve el diseño normal", "tm-prem" not in e["cl"] and e["on"] == "" and e["pi"] == 0, e)
    b.ok("[arranque] pero la elección no se borra", p.evaluate("()=>JSON.parse(localStorage.getItem('citaly_ap')).pack") == "laca")
    b.ok("[arranque] y queda anotado en el celular que el plan no lo trae", p.evaluate("()=>localStorage.getItem('citaly_pmok')") == "0")
    hoja_temas(p)
    b.ok("[arranque] los dos mosaicos traen el candado «Desde Turbo»", p.evaluate("()=>document.querySelectorAll('#prG .lk').length") == 2)
    b.ok("[arranque] ninguno aparece como elegido", p.evaluate("()=>!document.querySelector('#prG [aria-pressed=true]')"))
    elegir(p, '#prG [data-pm="perla"]')
    e = p.evaluate(EST)
    b.ok("[arranque] tocar uno no cambia el diseño", "tm-prem" not in e["cl"] and e["on"] == "", e)
    b.ok("[arranque] y abre los planes", p.evaluate("()=>document.getElementById('sh').classList.contains('on')&&/Turbo/.test(document.getElementById('shC').textContent)&&!document.getElementById('prG')"))
    b.ok("[arranque] sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:1]])
    p.context.close()
