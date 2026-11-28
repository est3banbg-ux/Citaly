"""Estilo de tu página → «Tu página de reservas»: de fábrica va «Igual que mi página web» (no se guarda nada y /r/ copia
el diseño de la web). El dueño puede ponerle otro color y otro fondo SOLO a reservas (web.rpal) y volver a dejarla igual.
Lo guardado llega limpio a la página pública (pub/{slug}.web.rpal) y al quitarlo se borra de verdad."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app


def reabrir(p):
    return p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB,(k,v)=>v&&v._ms!=null&&Object.keys(v).length===1?{__ts:v._ms}:v))")


VER = """()=>{var g=function(i){return document.getElementById(i)},b=document.querySelectorAll('#rpB [data-rp]');
 return {hay:!!g('rpB'),web:b[0]?b[0].textContent:'',otro:b[1]?b[1].textContent:'',abierto:g('rpX')?!g('rpX').hidden:null,color:g('rpA')?g('rpA').value:'',fondo:g('rpM')?g('rpM').value:'',
  muestra:g('rpV')?g('rpV').innerHTML.length>50:false,link:g('rpL')?g('rpL').getAttribute('href'):''}}"""

with Banco() as b:
    datos, usuario = negocio(web={"layout": "clara", "estilo": ""}, color="#1597c9")
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>openSet('est')"); p.wait_for_timeout(300)
    v = p.evaluate(VER)
    b.ok("De fábrica: la hoja de estilo trae «Tu página de reservas»", v["hay"], v)
    b.ok("De fábrica: marcada «Igual que mi página web» y sin colores a la vista", "✓" in v["web"] and "✓" not in v["otro"] and v["abierto"] is False, v)
    b.ok("De fábrica: enlace para ver la página de reservas", v["link"].endswith("/r/?n=prueba"), v["link"])

    # elegir otro color y fondo oscuro
    p.evaluate("()=>document.querySelector('#rpB [data-rp=otro]').click()"); p.wait_for_timeout(150)
    v = p.evaluate(VER)
    b.ok("«Con otro color»: se abren el color, el fondo y la muestra", v["abierto"] is True and v["muestra"] and v["color"] == "#1597c9", v)
    p.evaluate("()=>{var a=document.getElementById('rpA');a.value='#D92D3A';a.dispatchEvent(new Event('input',{bubbles:true}));var m=document.getElementById('rpM');m.value='dark';m.dispatchEvent(new Event('change',{bubbles:true}))}")
    b.ok("«Con otro color»: la muestra usa el color elegido", "#d92d3a" in p.evaluate("()=>document.getElementById('rpV').innerHTML").lower())
    p.evaluate("()=>document.getElementById('rpS').click()"); p.wait_for_timeout(800)
    web, pub = p.evaluate("()=>window.__DB['biz/U1'].web"), p.evaluate("()=>window.__DB['pub/prueba'].web")
    b.ok("Guardar: queda en el negocio (web.rpal)", web.get("rpal") == {"a": "#d92d3a", "pm": "dark"}, web)
    b.ok("Guardar: llega a la página pública", pub.get("rpal") == {"a": "#d92d3a", "pm": "dark"}, pub)
    b.ok("Guardar: no toca el diseño ni el color de la web", web.get("layout") == "clara" and p.evaluate("()=>window.__DB['biz/U1'].color") == "#1597c9" and "pal" not in web, web)
    b.ok("Guardar: sin errores", not p.errs, p.errs[:3])

    # volver a entrar: se acuerda; y se puede dejar otra vez igual que la web
    p = abrir_app(b, reabrir(p), usuario, plan=None)
    p.evaluate("()=>openSet('est')"); p.wait_for_timeout(300)
    v = p.evaluate(VER)
    b.ok("Al volver a entrar: marcada «Con otro color» con lo guardado", "✓" in v["otro"] and "✓" not in v["web"] and v["abierto"] is True and v["color"] == "#d92d3a" and v["fondo"] == "dark", v)
    p.evaluate("()=>document.querySelector('#rpB [data-rp=web]').click()"); p.wait_for_timeout(800)
    web, pub = p.evaluate("()=>window.__DB['biz/U1'].web"), p.evaluate("()=>window.__DB['pub/prueba'].web")
    b.ok("«Igual que mi página web»: el color propio se borra del negocio", "rpal" not in web, web)
    b.ok("«Igual que mi página web»: se borra de la página pública", "rpal" not in pub, pub)
    p = abrir_app(b, reabrir(p), usuario, plan=None)
    b.ok("«Igual que mi página web»: al volver a entrar sigue sin color propio", not p.evaluate("()=>(B.web||{}).rpal"), p.evaluate("()=>(B.web||{}).rpal"))

    # mismo color y mismo fondo que la web: no hay nada que guardar y lo dice
    p.evaluate("()=>openSet('est')"); p.wait_for_timeout(300)
    p.evaluate("()=>{document.querySelector('#rpB [data-rp=otro]').click();document.getElementById('rpS').click()}"); p.wait_for_timeout(500)
    b.ok("Mismo color y fondo que la web: avisa y no guarda nada", "mismo color" in p.evaluate("()=>document.getElementById('rpE').textContent") and "rpal" not in p.evaluate("()=>window.__DB['pub/prueba'].web"), p.evaluate("()=>window.__DB['pub/prueba'].web"))
    # solo el fondo: se guarda SOLO el fondo (sin color), para que reservas siga con los colores de la web
    p.evaluate("()=>{var m=document.getElementById('rpM');m.value='dark';m.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('rpS').click()}"); p.wait_for_timeout(800)
    b.ok("Solo cambiar el fondo: guarda el fondo y ningún color", p.evaluate("()=>window.__DB['pub/prueba'].web.rpal") == {"a": "", "pm": "dark"}, p.evaluate("()=>window.__DB['pub/prueba'].web"))

    # con colores de marca (web.pal): el selector arranca con el color que de verdad se ve en la web, no con el color viejo del negocio
    PAL = {"a": "#c0392b", "h": "#f1c40f", "bg": "#2c3e50", "pm": "dark", "n": "Mía"}
    datos, usuario = negocio(web={"layout": "clara", "estilo": "", "pal": PAL}, color="#1597c9")
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>openSet('est')"); p.wait_for_timeout(300)
    p.evaluate("()=>document.querySelector('#rpB [data-rp=otro]').click()"); p.wait_for_timeout(150)
    b.ok("Con colores de marca: el selector arranca con el color de la web", p.evaluate(VER)["color"] == "#c0392b", p.evaluate(VER)["color"])
    p.evaluate("()=>{var m=document.getElementById('rpM');m.value='dark';m.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('rpS').click()}"); p.wait_for_timeout(800)
    web = p.evaluate("()=>window.__DB['pub/prueba'].web")
    b.ok("Con colores de marca: cambiar solo el fondo no pisa el color ni los resaltados", web.get("rpal") == {"a": "", "pm": "dark"} and web.get("pal", {}).get("h") == "#f1c40f", web)

    # datos dañados en la base: a la página pública no llega basura
    datos, usuario = negocio(web={"layout": "pro", "rpal": {"a": "rojo", "pm": "negro", "x": "<img src=x onerror=alert(1)>"}})
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>openSet('est')"); p.wait_for_timeout(300)
    v = p.evaluate(VER)
    b.ok("Color propio dañado: la hoja abre y lo trata como «Igual que mi página web»", v["hay"] and "✓" in v["web"] and v["abierto"] is False, v)
    p.evaluate("()=>{openSet('neg');document.getElementById('nS').click()}"); p.wait_for_timeout(800)
    b.ok("Color propio dañado: no se publica", "rpal" not in p.evaluate("()=>window.__DB['pub/prueba'].web"), p.evaluate("()=>window.__DB['pub/prueba'].web"))
    datos, usuario = negocio(web={"layout": "pro", "rpal": {"a": "#ABCDEF", "pm": "", "x": "<b>"}})
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>{openSet('neg');document.getElementById('nS').click()}"); p.wait_for_timeout(800)
    b.ok("Color propio con campos de más: se publica solo color y fondo", p.evaluate("()=>window.__DB['pub/prueba'].web.rpal") == {"a": "#abcdef", "pm": ""}, p.evaluate("()=>window.__DB['pub/prueba'].web"))
    b.ok("Sin errores de JavaScript", not p.errs, p.errs[:3])
