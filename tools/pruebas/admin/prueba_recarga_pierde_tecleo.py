"""ARREGLADO (era pendiente de la revisión Opus): si el negocio cambia por fuera (la app del dueño guarda biz, p. ej. un cliente) con la
ficha abierta y SIN cambios, la ficha se recarga sola (openEd → lee fotos → edRender). Lo que Esteban teclee mientras
esa lectura llega se pierde: el formulario se redibuja con el valor viejo, pero queda "Cambios sin guardar".
Además la recarga sube la pantalla al inicio (window.scrollTo(0,0)) cada vez que el dueño usa su app.
Arreglo: no recargar si el foco está en un campo / DIRTY cambió durante la lectura; conservar el scroll."""
from ayuda import Banco, nuevo

LENTO = """(function(){var w=setInterval(function(){if(typeof db==='undefined')return;clearInterval(w);var _g=db.collection;db.collection=function(path){var c=_g.call(db,path);
if(/\\/fotos$/.test(path)){var ob=c.orderBy;c.orderBy=function(){var q=ob.apply(c,arguments),g=q.get;q.get=function(){window.__FOTOS_N=(window.__FOTOS_N||0)+1;return new Promise(function(r){setTimeout(r,window.__FOTOS_MS||0)}).then(function(){return g.call(q)})};return q}}return c}},5)})();"""
with Banco() as b:
    p = nuevo(b, hash_="negocio/b_full", espera=2200, antes=LENTO)
    p.evaluate("()=>{document.querySelector('#ed .a-sec[data-sec=\"web\"]').open=true;window.scrollTo(0,900)}"); p.wait_for_timeout(200)
    y0 = p.evaluate("()=>scrollY")
    p.evaluate("()=>db.doc('biz/b_full').set({clientes:[{n:'x'}]},{merge:true})"); p.wait_for_timeout(800)
    b.ok("Si la app del dueño guarda, la ficha no sube la pantalla", p.evaluate("()=>scrollY") > 0, (y0, p.evaluate("()=>scrollY")))
    p.evaluate("()=>{window.__FOTOS_MS=800;db.doc('biz/b_full').set({clientes:[{n:'y'}]},{merge:true})}"); p.wait_for_timeout(100)
    p.evaluate("()=>{const e=document.getElementById('wTg');e.value='Escrito por Esteban';e.dispatchEvent(new Event('input',{bubbles:true}))}"); p.wait_for_timeout(1500)
    v = p.evaluate("()=>[document.getElementById('wTg').value,UI.isDirty()]")
    b.ok("Lo que se teclea mientras la ficha se recarga no se pierde", v[0] == "Escrito por Esteban", v)
    b.ok("Al refrescarse no vuelve a leer las fotos (el link no cambió)", p.evaluate("()=>window.__FOTOS_N") == 1, p.evaluate("()=>window.__FOTOS_N"))
    # U1: con cambios sin guardar, un cambio de afuera NO recarga la ficha: avisa y conserva lo escrito
    p.evaluate("()=>{const e=document.getElementById('wTg');e.value='Cambio de Esteban';e.dispatchEvent(new Event('input',{bubbles:true}));e.blur()}"); p.wait_for_timeout(200)
    p.evaluate("()=>db.doc('biz/b_full').set({clientes:[{n:'z'}]},{merge:true})"); p.wait_for_timeout(800)
    v = p.evaluate("()=>[document.getElementById('wTg').value,UI.isDirty(),document.getElementById('fWarn').textContent,window.__FOTOS_N]")
    b.ok("U1: con cambios sin guardar no recarga: conserva lo escrito y avisa", v[0] == "Cambio de Esteban" and v[1] and "cambió" in v[2] and v[3] == 1, v)
    # con foco en un campo (sin cambios todavía) tampoco recarga
    p.evaluate("()=>{location.hash='#negocios'}"); p.wait_for_timeout(300)
    p.evaluate("()=>{window.__CQ=[true];location.hash='#negocio/b_paga'}"); p.wait_for_timeout(900)
    p.evaluate("()=>{document.querySelector('#ed .a-sec[data-sec=\"datos\"]').open=true;document.getElementById('eA').focus()}")
    n0 = p.evaluate("()=>window.__FOTOS_N")
    p.evaluate("()=>db.doc('biz/b_paga').set({addr:'Afuera'},{merge:true})"); p.wait_for_timeout(500)
    v = p.evaluate("()=>[document.activeElement.id,document.getElementById('fWarn').textContent]")
    b.ok("Con el cursor en un campo no recarga (no se pierde el foco) y avisa", v[0] == "eA" and "cambió" in v[1], v)
    p.evaluate("()=>document.activeElement.blur()"); p.wait_for_timeout(500)
    b.ok("Al soltar el campo sin haber cambiado nada, se refresca con lo nuevo", p.evaluate("()=>document.getElementById('eA').value") == "Afuera" and p.evaluate("()=>window.__FOTOS_N") == n0)
