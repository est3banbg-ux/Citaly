"""PENDIENTE (revisión Opus): si el negocio cambia MIENTRAS la ficha se está abriendo (openEd toma BIZ[id] y luego
espera la lectura de fotos), la ficha se dibuja con los datos viejos pero SIG se calcula con los nuevos (edRender →
sigOf), así que no recarga ni avisa. Si Esteban cambia algo y guarda, borra sin aviso lo que el dueño acababa de
guardar desde su app (aquí: la frase). Arreglo: calcular la firma en openEd con el mismo BIZ/SUBS que se usó para
armar E (o comparar al terminar la lectura y recargar)."""
from ayuda import Banco, nuevo

LENTO = """(function(){var w=setInterval(function(){if(typeof db==='undefined')return;clearInterval(w);var _g=db.collection;db.collection=function(path){var c=_g.call(db,path);
if(/\\/fotos$/.test(path)){var ob=c.orderBy;c.orderBy=function(){var q=ob.apply(c,arguments),g=q.get;q.get=function(){return new Promise(function(r){setTimeout(r,window.__FOTOS_MS||0)}).then(function(){return g.call(q)})};return q}}return c}},5)})();"""
with Banco() as b:
    p = nuevo(b, hash_="negocios", espera=2200, antes=LENTO)
    p.evaluate("()=>{window.__FOTOS_MS=800;location.hash='#negocio/b_full'}"); p.wait_for_timeout(150)
    p.evaluate("()=>db.doc('biz/b_full').set({tagline:'Frase nueva del dueño'},{merge:true})"); p.wait_for_timeout(1500)
    st = p.evaluate("()=>[E&&E.tagline,document.getElementById('wTg').value,document.getElementById('fWarn').textContent]")
    b.ok("La ficha muestra lo último que guardó el dueño (o avisa)", st[1] == "Frase nueva del dueño" or "cambió" in st[2], st)
    p.evaluate("()=>{const e=document.getElementById('eA');e.value='Otra dirección';e.dispatchEvent(new Event('input',{bubbles:true}))}")
    p.evaluate("()=>document.getElementById('eGo').click()"); p.wait_for_timeout(1500)
    b.ok("Guardar no borra la frase que puso el dueño", p.evaluate("()=>window.__DB['biz/b_full'].tagline") == "Frase nueva del dueño", p.evaluate("()=>window.__DB['biz/b_full'].tagline"))
