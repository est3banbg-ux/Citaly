"""Página pública (/w/): todos los estilos, modos claro/oscuro, paleta propia y tipos de negocio se arman sin errores."""
from ayuda_web import Banco, armar, abrir, revisar, fotos

PAL = {"a": "#112233", "h": "#ffeeaa", "bg": "#000000", "pm": "light"}

with Banco() as b:
    for lay in (None, "clasica"):
        for est in ("", "glass", "atrevido", "elegante", "fresco", "inventado"):
            for modo in ("", "light", "dark"):
                web = {"estilo": est}
                if est == "glass":
                    web["pal"] = PAL
                d = armar(layout=lay, web=web, fotos=fotos(2), color="#000000" if modo == "dark" else "#ffffff")
                antes = ("localStorage.setItem('citaly_mode','%s');" % modo) if modo else "localStorage.removeItem('citaly_mode');"
                p = abrir(b, d, antes=antes)
                revisar(b, p, "%s · estilo '%s' · modo '%s'" % (lay or "pro", est, modo or "auto"), anchos=(360, 1280))
                p.context.close()

    for t in ["barberia", "salon", "unas", "spa", "salud", "consultorio", "lavacar", "detailing", "pulido", "polarizado", "refri", "autos", "taller", "otro", "inexistente", None]:
        for lay in (None, "clasica"):
            p = abrir(b, armar(layout=lay, type=t))
            revisar(b, p, "tipo %s · %s" % (t, lay or "pro"), anchos=(360,))
            p.context.close()

    # El botón de modo claro/oscuro de la plantilla Pro cambia el modo y lo recuerda
    p = abrir(b, armar(), antes="localStorage.removeItem('citaly_mode');")
    antes = p.evaluate("()=>document.documentElement.dataset.pm")
    p.click("#prMode"); p.wait_for_timeout(200)
    despues = p.evaluate("()=>[document.documentElement.dataset.pm, localStorage.getItem('citaly_mode')]")
    b.ok("Pro: el botón de modo cambia claro/oscuro y lo guarda", despues[0] != antes and despues[1] == despues[0], [antes, despues])
    b.ok("Pro: modo sin errores", not p.errs, p.errs[:3])
