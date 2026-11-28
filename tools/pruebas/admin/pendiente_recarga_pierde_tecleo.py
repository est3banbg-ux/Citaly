"""PENDIENTE (revisión Opus): si el negocio cambia por fuera (la app del dueño guarda biz, p. ej. un cliente) con la
ficha abierta y SIN cambios, la ficha se recarga sola (openEd → lee fotos → edRender). Lo que Esteban teclee mientras
esa lectura llega se pierde: el formulario se redibuja con el valor viejo, pero queda "Cambios sin guardar".
Además la recarga sube la pantalla al inicio (window.scrollTo(0,0)) cada vez que el dueño usa su app.
Arreglo: no recargar si el foco está en un campo / DIRTY cambió durante la lectura; conservar el scroll."""
from ayuda import Banco, nuevo

LENTO = """(function(){var w=setInterval(function(){if(typeof db==='undefined')return;clearInterval(w);var _g=db.collection;db.collection=function(path){var c=_g.call(db,path);
if(/\\/fotos$/.test(path)){var ob=c.orderBy;c.orderBy=function(){var q=ob.apply(c,arguments),g=q.get;q.get=function(){return new Promise(function(r){setTimeout(r,window.__FOTOS_MS||0)}).then(function(){return g.call(q)})};return q}}return c}},5)})();"""
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
