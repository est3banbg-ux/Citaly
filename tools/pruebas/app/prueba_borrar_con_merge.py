"""ERROR: saveBiz() guarda biz/{id} con set(..., {merge:true}). Con merge, Firestore MEZCLA los mapas anidados:
una llave que la app quitó del mapa NO se borra en la base. Dos casos que el dueño puede hacer:

1) Agenda → día cerrado para reservas en línea → «Abrir este día» cuando hay OTRO día cerrado también:
   el día sigue cerrado en biz/U1.cierre. La app vuelve a leerlo y lo muestra cerrado, y en el próximo
   guardado de cualquier ajuste pub/{slug} se reescribe con el día cerrado: los clientes no pueden reservar.
2) Estilo de tu página → «volver al color único» (quita web.pal): la paleta sigue en biz/U1.web.pal y vuelve.

(El Firestore falso imita el merge de Firestore real para mapas con llaves.)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D1, D2 = dia(3), dia(5)


def reabrir(p):
    """Estado de la base tal como quedó (para volver a abrir la app con eso)."""
    return p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB,(k,v)=>v&&v._ms!=null&&Object.keys(v).length===1?{__ts:v._ms}:v))")

with Banco() as b:
    # --- 1) Reabrir un día cerrado
    datos, usuario = negocio(cierre={D1: 0, D2: 0})
    datos["pub/prueba"]["cierre"] = {D1: 0, D2: 0}
    p = abrir_app(b, datos, usuario)
    p.evaluate("d=>{SEL=d;go('agenda');renderAg();document.getElementById('cdGo').click()}", D1)
    p.wait_for_timeout(300)
    hay = p.evaluate("()=>!!document.getElementById('cdO')")
    p.evaluate("()=>document.getElementById('cdO').click()")
    p.wait_for_timeout(800)
    biz = p.evaluate("()=>window.__DB['biz/U1'].cierre")
    b.ok("Reabrir un día: hay botón «Abrir este día»", hay)
    b.ok("Reabrir un día: se borra de biz/U1.cierre", D1 not in biz, biz)
    # el dueño vuelve a abrir la app otro día (lee lo que quedó en la base)
    p = abrir_app(b, reabrir(p), usuario, plan=None)
    b.ok("Reabrir un día: al volver a entrar a la app el día sigue abierto", p.evaluate("d=>cierreDe(d)===null", D1), p.evaluate("()=>B.cierre"))
    # cualquier otro guardado reescribe pub con lo que la app tiene en B
    p.evaluate("()=>{openSet('neg');document.getElementById('nS').click()}")
    p.wait_for_timeout(800)
    pub = p.evaluate("()=>window.__DB['pub/prueba'].cierre")
    b.ok("Reabrir un día: después de guardar otro ajuste, la página pública sigue con el día abierto", D1 not in pub, pub)

    # --- 2) Quitar la paleta de colores
    datos, usuario = negocio(web={"estilo": "", "pal": {"a": "#ff0000", "h": "#00ff00", "bg": "", "pm": "dark", "n": "Mía"}})
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>openSet('est')")
    p.wait_for_timeout(300)
    hay = p.evaluate("()=>!!document.getElementById('pcX')")
    p.evaluate("()=>document.getElementById('pcX').click()")
    p.wait_for_timeout(800)
    web = p.evaluate("()=>window.__DB['biz/U1'].web")
    b.ok("Color único: hay botón para quitar la paleta", hay)
    b.ok("Color único: la paleta se borra de biz/U1.web", "pal" not in web, web)
    p = abrir_app(b, reabrir(p), usuario, plan=None)
    b.ok("Color único: al volver a entrar, la app no la muestra", not p.evaluate("()=>(B.web||{}).pal"), p.evaluate("()=>(B.web||{}).pal"))
    p.evaluate("()=>{openSet('neg');document.getElementById('nS').click()}")
    p.wait_for_timeout(800)
    b.ok("Color único: después de guardar otro ajuste, la página pública sigue sin paleta", "pal" not in p.evaluate("()=>window.__DB['pub/prueba'].web"), p.evaluate("()=>window.__DB['pub/prueba'].web"))
