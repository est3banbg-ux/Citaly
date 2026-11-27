"""Ayudas para las pruebas de la app del dueño (solo para tools/pruebas/app/).

- PLANES: suscripciones de prueba por plan.
- VIGIA: JS que se inyecta antes de la página y revisa TODO el HTML que la app mete con innerHTML /
  insertAdjacentHTML: si hay más etiquetas que cierran que las que abren (o al revés), lo anota en
  window.__HTMLMAL con la función que lo hizo. Así se detectan errores como el </div> de más en
  "Servicios y precios" (nov 2026), que no se ven leyendo el código.
- abrir_app(b, datos, usuario, plan): abre /app/ con el vigía puesto y espera a que cargue el negocio.
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio, ts, dia  # noqa: F401

PLANES = {
    "arranque": {"status": "active", "tier": "arranque", "until": ts(20)},
    "turbo": {"status": "active", "tier": "turbo", "until": ts(20)},
    "nitro": {"status": "active", "tier": "nitro", "until": ts(20)},
    "prueba": {"status": "trial", "until": ts(5)},
}

VIGIA = r"""
(function(){
  window.__HTMLMAL=[];
  var TAGS=["div","span","button","label","details","summary","ul","li","section","select","table","tr","td","textarea","a","p","b","small","form","nav","header","footer","h2","h3"];
  function revisar(h,donde){
    if(typeof h!=="string"||h.length<5)return;
    var s=h.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi,"<textarea></textarea>").replace(/<!--[\s\S]*?-->/g,"");
    s=s.replace(/"[^"]*"/g,'""');
    var mal=[];
    TAGS.forEach(function(t){
      var a=(s.match(new RegExp("<"+t+"(?=[\\s>/])","gi"))||[]).length,c=(s.match(new RegExp("</"+t+"\\s*>","gi"))||[]).length;
      if(a!==c)mal.push(t+": abre "+a+" / cierra "+c);
    });
    if(mal.length){var st=(new Error().stack||"").split("\n").slice(2,6).map(function(x){return x.trim()}).join(" | ");
      window.__HTMLMAL.push({donde:donde,mal:mal.join(", "),pila:st,trozo:h.slice(0,160)})}
  }
  var d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
  Object.defineProperty(Element.prototype,"innerHTML",{configurable:true,get:d.get,set:function(v){revisar(v,"#"+(this.id||this.className||this.tagName));return d.set.call(this,v)}});
  var ia=Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML=function(p,v){revisar(v,"adj #"+(this.id||this.tagName));return ia.call(this,p,v)};
  window.confirm=function(){return true};
  window.__PROMPTS=[];window.prompt=function(m,d){window.__PROMPTS.push(m);return window.__PROMPT_RESP!==undefined?window.__PROMPT_RESP:d};
  window.alert=function(m){(window.__ALERTS=window.__ALERTS||[]).push(m)};
})();
"""


def abrir_app(b, datos, usuario, plan="prueba", espera=2200, ancho=400, antes=""):
    datos = dict(datos)
    if plan:
        datos["subs/U1"] = PLANES[plan]
    p = b.abrir("/app/", datos, usuario, espera=espera, ancho=ancho, antes=VIGIA + antes)
    return p


def html_mal(p):
    """Lista de inserciones de HTML con etiquetas desbalanceadas (ignora las conocidas en IGNORAR)."""
    return p.evaluate("()=>window.__HTMLMAL||[]")


def esperar(p, cond_js, ms=3000):
    """Espera hasta que la expresión JS sea verdadera (sin esperas fijas frágiles)."""
    try:
        p.wait_for_function(cond_js, timeout=ms)
        return True
    except Exception:
        return False


def abierta(p):
    return p.evaluate("()=>document.getElementById('sh').classList.contains('on')")


def texto_hoja(p):
    return p.evaluate("()=>document.getElementById('shC').innerText")


def escribir(p, sel, valor, idx=0, raiz="#shC"):
    """Pone `valor` en el input `sel` (dentro de la hoja) y dispara input+change."""
    return p.evaluate("""([s,v,i])=>{var e=document.querySelectorAll(s)[i];if(!e)return false;e.value=v;
      e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true}""", [raiz + " " + sel, valor, idx])


def clic(p, sel, idx=0, raiz="#shC"):
    return p.evaluate("([s,i])=>{var e=document.querySelectorAll(s)[i];if(!e)return false;e.click();return true}", [(raiz + " " + sel).strip(), idx])


def ultima(b, p, ruta, campo=None):
    """Datos de la última escritura a `ruta` (exacta) que contiene `campo`."""
    w = [x for x in b.escrituras(p, ruta) if x[1] == ruta and x[0] != "delete" and x[2] and (campo is None or campo in x[2])]
    return w[-1][2] if w else None
