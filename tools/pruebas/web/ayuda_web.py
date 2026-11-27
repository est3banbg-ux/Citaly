"""Ayudas para las pruebas de la página pública del negocio (/w/).
No es una prueba (correr.py solo corre prueba_*.py)."""
import copy, datetime, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio, ts  # noqa: F401  (se re-exportan)

# PNG de 1x1 (no hay red en el banco)
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
PNG2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

VIDEOS = [
    {"u": "https://www.tiktok.com/@taller/video/7301234567890123456", "c": "TikTok 1"},
    {"u": "https://www.instagram.com/reel/Cabc123XYZ/", "c": "Reel"},
    {"u": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "c": "YouTube"},
    {"u": "https://youtu.be/dQw4w9WgXcQ", "c": "YouTube corto"},
    {"u": "https://www.youtube.com/shorts/dQw4w9WgXcQ", "c": "Short"},
    {"u": "https://www.facebook.com/reel/1234567890123", "c": "Reel FB"},
    {"u": "https://www.facebook.com/watch/?v=1234567890123", "c": "Video FB"},
]

CAP = {"arranque": {"fot": 3, "vid": 6}, "turbo": {"fot": 8, "vid": 12}, "nitro": {"fot": 12, "vid": 24}}

# Fecha/hora falsa (para que nada dependa del día en que se corre). `ms` en UTC.
def reloj(ms):
    return """(function(){var T=%d,R=Date;function D(){var a=[].slice.call(arguments);if(!(this instanceof D))return new R(T).toString();
return a.length?new (Function.prototype.bind.apply(R,[null].concat(a)))():new R(T)}
D.prototype=R.prototype;D.now=function(){return T};D.UTC=R.UTC;D.parse=R.parse;window.Date=D})();""" % ms

def cr_ms(anio, mes, dia, h, m=0):
    """Milisegundos de una hora de Costa Rica (UTC-6, sin horario de verano)."""
    return int((datetime.datetime(anio, mes, dia, h, m, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=6)).timestamp() * 1000)

# 2030-01-07 es lunes; 2030-01-06 domingo; 2030-01-12 sábado
LUNES = (2030, 1, 7)


def armar(tier="nitro", layout=None, fotos=None, sub="trial", sub_dias=36500, quitar=(), **extra):
    """Datos de Firestore para /w/?n=prueba. `extra` va a biz y pub (como negocio()).
    `fotos`: lista de dicts {img,cap,i,ba}. `sub`: 'trial'|'active'|'suspended'|None (sin doc)."""
    web = extra.pop("web", {})
    if layout:
        web = dict(web, layout=layout)
    datos, _ = negocio(web=web, **extra)
    pub = datos["pub/prueba"]
    pub["tier"] = tier
    pub["cap"] = dict(CAP.get(tier, CAP["nitro"]))
    for k in quitar:
        pub.pop(k, None)
        datos["biz/U1"].pop(k, None)
    if sub is None:
        del datos["subs/U1"]
    else:
        datos["subs/U1"] = {"status": sub, "until": ts(dias=sub_dias)}
    for n, f in enumerate(fotos or []):
        datos["pub/prueba/fotos/f%02d" % n] = dict({"i": n}, **f)
    return datos


def fotos(n, ba=False, cap="Trabajo"):
    return [{"img": PNG if k % 2 == 0 else PNG2, "cap": "%s %d" % (cap, k + 1) if cap else "", "i": k, "ba": ba} for k in range(n)]


JS_TEXTO_MALO = """()=>{const t=document.body.innerText;const m=t.match(/\\b(undefined|NaN|null)\\b|\\[object Object\\]/g);return m||[]}"""

JS_ATRIB_MALO = """()=>{const out=[];document.querySelectorAll('#page *').forEach(e=>{for(const a of e.attributes){if(/\\b(undefined|NaN)\\b|\\[object Object\\]/.test(a.value)&&a.name!=='d')out.push(e.tagName+' '+a.name+'='+a.value.slice(0,80))}});return out.slice(0,5)}"""

# Elementos visibles que se salen del ancho de la pantalla (sin contar los que un padre recorta a propósito)
JS_DESBORDE = """()=>{const W=document.documentElement.clientWidth,out=[];
const skip=e=>e.closest('.pr-marq,.pr-sky,.pr-track,.lb,.pr-dock,.dock,svg');
document.querySelectorAll('#page *').forEach(e=>{if(skip(e))return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
 if(r.right<=W+1&&r.left>=-1)return;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.position==='fixed')return;
 let a=e.parentElement,clip=false;while(a&&a!==document.body&&a.id!=='page'){const s=getComputedStyle(a);if(s.overflowX!=='visible'||s.overflow!=='visible'){const ar=a.getBoundingClientRect();if(ar.right<=W+1&&ar.left>=-1){clip=true;break}}a=a.parentElement}
 if(!clip)out.push((e.tagName+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)).slice(0,50)+' ['+Math.round(r.left)+','+Math.round(r.right)+'] '+(e.innerText||'').slice(0,40))});
return out.slice(0,6)}"""


def revisar(b, p, nombre, anchos=(360, 400, 768, 1280)):
    """Sin errores de JS, sin textos rotos y sin desborde horizontal en varios anchos."""
    b.ok(nombre + ": sin errores de JS", not p.errs, p.errs[:3])
    b.ok(nombre + ": la página se mostró", p.evaluate("()=>!document.getElementById('page').hidden"))
    malo = p.evaluate(JS_TEXTO_MALO)
    b.ok(nombre + ": sin undefined/NaN/null en el texto", not malo, malo)
    malo = p.evaluate(JS_ATRIB_MALO)
    b.ok(nombre + ": sin undefined/NaN en atributos", not malo, malo)
    malos = {}
    for w in anchos:
        p.set_viewport_size({"width": w, "height": 850})
        p.wait_for_timeout(120)
        d = p.evaluate(JS_DESBORDE)
        sw = p.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
        if d or sw > 1:
            malos[w] = (sw, d)
    b.ok(nombre + ": sin desborde horizontal en 360/400/768/1280", not malos, malos)


def hrefs(p, sel):
    return p.evaluate("(s)=>[...document.querySelectorAll(s)].map(a=>a.getAttribute('href'))", sel)


LUNES_10 = cr_ms(2030, 1, 7, 10)  # lunes 7 de enero de 2030, 10:00 en Costa Rica


def abrir(b, datos, ruta="/w/?n=prueba", ahora=LUNES_10, antes="", **kw):
    """Abre la página con la hora fija (`ahora`, ms) para que nada dependa del día en que se corre."""
    kw.setdefault("espera", 900)
    return b.abrir(ruta, datos, antes=reloj(ahora) + antes, **kw)
