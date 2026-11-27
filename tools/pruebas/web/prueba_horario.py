"""Página pública (/w/): resumen del horario y estado "Atendiendo ahora / Cerrado", con la hora de Costa Rica fijada
(no depende del día ni de la hora en que se corra)."""
from ayuda_web import Banco, armar, abrir, cr_ms


def H(*dias):
    """7 días empezando en DOMINGO; cada uno (a, b) o None si cierra."""
    return [{"on": x is not None, "a": (x or ("08:00", "17:00"))[0], "b": (x or ("08:00", "17:00"))[1]} for x in dias]


N = ("08:00", "17:00")
RESUMEN = [
    ("parejo lun–sáb", H(None, N, N, N, N, N, N), "lun a sáb 8 am – 5 pm"),
    ("sábado distinto", H(None, N, N, N, N, N, ("08:00", "12:00")), "lun a vie 8 am – 5 pm · sáb 8 am – 12 pm"),
    ("cierra miércoles", H(None, N, N, None, N, N, N), "lun a mar 8 am – 5 pm · jue a sáb 8 am – 5 pm"),
    ("toda la semana", H(N, N, N, N, N, N, N), "lun a dom 8 am – 5 pm"),
    ("medias horas", H(("09:00", "13:30"), ("07:30", "17:30"), ("07:30", "17:30"), None, None, None, None), "lun a mar 7:30 am – 5:30 pm · dom 9 am – 1:30 pm"),
    ("mediodía", H(None, ("12:00", "18:00"), None, None, None, None, None), "lun 12 pm – 6 pm"),
]

# (día de enero 2030, hora, minuto) → estado esperado. 2030-01-07 es lunes; 12 sábado; 13 domingo.
ESTADO = [
    ((7, 7, 59), False, "Cerrado ahora · abre hoy 8 am"),
    ((7, 8, 0), True, "Atendiendo ahora · hoy hasta las 5 pm"),
    ((7, 16, 59), True, "Atendiendo ahora · hoy hasta las 5 pm"),
    ((7, 17, 0), False, "Cerrado ahora · abre mañana 8 am"),
    ((7, 23, 59), False, "Cerrado ahora · abre mañana 8 am"),
    ((8, 0, 0), False, "Cerrado ahora · abre hoy 8 am"),
    ((12, 18, 0), False, "Cerrado ahora · abre el lunes 8 am"),
    ((13, 10, 0), False, "Cerrado ahora · abre mañana 8 am"),
]

with Banco() as b:
    for lay in (None, "clasica"):
        L = lay or "pro"
        for nombre, h, esperado in RESUMEN:
            p = abrir(b, armar(layout=lay, hours=h))
            sel = ".pr-hours" if not lay else ".contact"
            vis = p.inner_text(sel) if p.locator(sel).count() else ""
            b.ok("%s · %s: resumen '%s'" % (L, nombre, esperado), p.evaluate("()=>hoursSummary(P.hours)") == esperado and all(x in vis for x in esperado.split(" · ")),
                 [p.evaluate("()=>hoursSummary(P.hours)"), vis[:150]])
            p.context.close()

        p = abrir(b, armar(layout=lay, hours=H(None, None, None, None, None, None, None)))
        b.ok(L + " · todo cerrado: sin resumen ni estado", p.evaluate("()=>hoursSummary(P.hours)") == "" and p.locator(".pr-status,.badge").count() == 0)
        b.ok(L + " · todo cerrado: sin errores", not p.errs, p.errs[:3])
        p.context.close()

    # Estado en la plantilla Pro
    for (d, hh, mm), abierto, txt in ESTADO:
        p = abrir(b, armar(hours=H(None, N, N, N, N, N, N)), ahora=cr_ms(2030, 1, d, hh, mm))
        st = p.locator(".pr-status")
        real = st.inner_text() if st.count() else None
        b.ok("pro · %02d/01 %02d:%02d → '%s'" % (d, hh, mm, txt), real == txt and ("on" in st.get_attribute("class").split()) == abierto, real)
        p.context.close()

    # Clásica: "Abierto ahora" solo dentro del horario, y resalta el día de hoy
    for (d, hh, mm), abierto, _ in ESTADO:
        p = abrir(b, armar(layout="clasica", hours=H(None, N, N, N, N, N, N)), ahora=cr_ms(2030, 1, d, hh, mm))
        badge = p.inner_text(".badge")
        hoy = p.inner_text(".hours .li.today").split("\n")[0]
        dia = {7: "Lunes", 8: "Martes", 12: "Sábado", 13: "Domingo"}[d]
        b.ok("clásica · %02d/01 %02d:%02d: %s y resalta %s" % (d, hh, mm, "abierto" if abierto else "sin 'Abierto ahora'", dia),
             badge.startswith("Abierto ahora") == abierto and hoy == dia, [badge, hoy])
        p.context.close()
