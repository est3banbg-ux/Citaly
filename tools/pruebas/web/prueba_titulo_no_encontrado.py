"""PENDIENTE (falla hoy): cuando el negocio no existe (link mal escrito, negocio borrado) la página dice
"No encontramos esta página" pero la pestaña se queda diciendo "Cargando…" para siempre."""
from ayuda_web import Banco, armar, abrir

with Banco() as b:
    for ruta in ("/w/?n=no-existe", "/w/"):
        p = abrir(b, armar(), ruta=ruta)
        b.ok("%s: se muestra 'No encontramos'" % ruta, p.evaluate("()=>!document.getElementById('nf').hidden"))
        b.ok("%s: la pestaña no se queda en 'Cargando…'" % ruta, "Cargando" not in p.title(), p.title())
        p.context.close()
