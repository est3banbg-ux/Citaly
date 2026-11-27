"""Link corto de los WhatsApp automáticos y línea de permiso.
- /r/?wa=<slug>.<tk> abre «Mi cita» igual que /r/?n=<slug>&cita=<tk> (mover y cancelar funcionan igual, con las reglas reales).
- /r/?wa=<slug> abre la página de reservas normal de ese negocio.
- ?n= / ?cita= siguen funcionando y mandan si vienen los dos formatos.
- En el último paso, junto a «Confirmar cita», se ve la línea «Al confirmar aceptas recibir por WhatsApp la confirmación y el recordatorio
  de tu cita por WhatsApp.» sin tapar nada ni mover el botón, también a 320 px."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1, D2, D3 = dia(1), dia(2), dia(3)
PERMISO = "Al confirmar aceptas recibir por WhatsApp la confirmación y el recordatorio de tu cita, del negocio o de Citaly en su nombre."


def abrir(b, ruta, datos, **kw):
    p = b.abrir(ruta, datos, antes=reloj(), espera=1500, **kw)
    activar_reglas(p)
    return p


with Banco() as b:
    datos = con_cita(D2, "09:00", 60)
    largo = txt(abrir(b, "/r/?n=prueba&cita=" + TK, datos), "#mcb")
    p = abrir(b, "/r/?wa=prueba." + TK, datos)
    corto = txt(p, "#mcb")
    b.ok("?wa=slug.tk abre «Mi cita»", p.locator("#mc").is_visible() and not p.locator("#land").is_visible() and "Hola Ana" in corto, corto[:150])
    b.ok("?wa=slug.tk muestra lo mismo que ?n=&cita=", corto == largo, [corto[:120], largo[:120]])
    b.ok("?wa=slug.tk ofrece cambiar y cancelar", p.locator("#mcMove").is_visible() and p.locator("#mcCancel").is_visible())
    mover(p, D3, "10:00")
    db = estado(p)
    b.ok("?wa=slug.tk: mover funciona igual (cupos, cita y Mi cita) y las reglas lo aceptan",
         slots_de(p) == [D3 + "_1000", D3 + "_1030"] and db["biz/U1/jobs/" + JOB]["date"] == D3 and db["biz/U1/mine/" + TK]["date"] == D3 and not negado(p), [slots_de(p), negado(p)])
    p = abrir(b, "/r/?wa=PRUEBA." + TK.upper(), con_cita(D2, "09:00", 60))
    b.ok("?wa= en mayúsculas también abre «Mi cita»", "Hola Ana" in txt(p, "#mcb"))
    p = abrir(b, "/r/?wa=prueba." + TK, con_cita(D2, "09:00", 60))
    cancelar(p)
    b.ok("?wa=slug.tk: cancelar funciona igual", estado(p)["biz/U1/jobs/" + JOB]["st"] == "Cancelada" and not negado(p), negado(p))
    p = abrir(b, "/r/?wa=prueba.codigomalo1234567890xx", con_cita(D2, "09:00", 60))
    b.ok("?wa= con un código que no existe: «No encontramos esta cita»", "No encontramos esta cita" in txt(p, "#mcb"), txt(p, "#mcb")[:80])

    # ?wa=slug sin código: reservas normales
    p = abrir(b, "/r/?wa=prueba", con_cita(D2, "09:00", 60))
    b.ok("?wa=slug abre la página de reservas del negocio", p.locator("#land").is_visible() and p.locator("#mc").is_hidden() and "Taller Prueba" in txt(p, "#nm"), txt(p, "body")[:120])
    p = abrir(b, "/r/?wa=prueba.", con_cita(D2, "09:00", 60))
    b.ok("?wa=slug. (punto sin código) también abre reservas", p.locator("#land").is_visible() and p.locator("#mc").is_hidden())
    p = abrir(b, "/r/?wa=noexiste", con_cita(D2, "09:00", 60))
    b.ok("?wa= de un negocio que no existe: «No encontramos este negocio»", p.locator("#nf").is_visible())

    # ?n= y ?cita= mandan
    p = abrir(b, "/r/?n=prueba&wa=otro." + TK, con_cita(D2, "09:00", 60))
    b.ok("?n= manda sobre ?wa= (y el código de otro negocio no se usa)", p.locator("#land").is_visible() and p.locator("#mc").is_hidden())
    p = abrir(b, "/r/?n=prueba&cita=" + TK + "&wa=prueba.otrocodigo1234567890", con_cita(D2, "09:00", 60))
    b.ok("?cita= manda sobre el código de ?wa=", "Hola Ana" in txt(p, "#mcb"), txt(p, "#mcb")[:80])
    p = abrir(b, "/r/?n=prueba", con_cita(D2, "09:00", 60))
    b.ok("?n= solo sigue abriendo reservas", p.locator("#land").is_visible() and p.locator("#mc").is_hidden())
    b.ok("sin errores de JS", not p.errs, p.errs[:2])

    # Línea de permiso en el último paso, a 320 y 400 px
    for ancho, alto in ((320, 568), (400, 850)):
        datos, _ = negocio_cr()
        p = abrir(b, "/r/?n=prueba", datos, ancho=ancho, alto=alto)
        ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p, 600)
        elegir_dia_hora(p, D1, "09:00"); siguiente(p)
        llenar_datos(p); siguiente(p)
        b.ok("%d px · último paso: dice «Confirmar cita»" % ancho, txt(p, "#nx") == "Confirmar cita", txt(p, "#nx"))
        b.ok("%d px · la línea de permiso está visible" % ancho, p.locator("#waOk").is_visible() and txt(p, "#waOk") == PERMISO, txt(p, "#s-sum")[-200:])
        p.evaluate("()=>window.scrollTo(0,document.documentElement.scrollHeight)"); p.wait_for_timeout(300)
        r = p.evaluate("""()=>{var a=document.getElementById('waOk').getBoundingClientRect(),n=document.getElementById('nx').getBoundingClientRect(),
          bar=document.getElementById('bar').getBoundingClientRect(),w=document.documentElement.clientWidth;
          return {debajo:a.bottom<=bar.top+1,dentro:a.left>=0&&a.right<=w,sw:document.documentElement.scrollWidth,w:w,
                  boton:n.left>=0&&n.right<=w&&n.top>=0&&n.bottom<=innerHeight&&n.height>30}}""")
        b.ok("%d px · al bajar, la línea queda a la vista (no detrás de la barra del botón) y no se sale" % ancho, r["debajo"] and r["dentro"] and r["sw"] <= r["w"], r)
        b.ok("%d px · el botón Confirmar se ve completo" % ancho, r["boton"], r)
        confirmar(p)
        b.ok("%d px · la reserva se completa igual" % ancho, p.locator("#ok").is_visible() and len(jobs(p)) == 1 and not negado(p), negado(p))
        b.ok("%d px · sin errores de JS" % ancho, not p.errs, p.errs[:2])
