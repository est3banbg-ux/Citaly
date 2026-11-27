"""Horas que se ofrecen: nunca una que choque con algo ocupado, que termine después del cierre, que caiga en la
pausa o que ya pasó hoy. La hora del navegador se fija (hora de Costa Rica) para no depender del día real."""
import datetime, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D0, D1, D2 = dia(0), dia(1), dia(2)
LIB = "async ([d,pk])=>{S.pick=pk;await loadBusy();return freeStarts(d)}"
CADA30 = ["%02d:%02d" % (m // 60, m % 60) for m in range(480, 1020, 30)]  # 8:00 ... 16:30


def a_las(h, mi, dias=0):
    return BASE.replace(hour=h, minute=mi) + datetime.timedelta(days=dias)


def libres(b, d, pk=(0,), ahora=BASE, **extra):
    datos, _ = negocio_cr(base=ahora, **extra)
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(ahora), espera=900)
    return p, p.evaluate(LIB, [d, list(pk)])


with Banco() as b:
    # Hora actual y anticipación
    _, L = libres(b, D0, ahora=a_las(7, 0))
    b.ok("7:00 am: hoy se ofrece todo desde las 8:00 hasta las 4:00 (60 min)", L == CADA30[:-1], L)
    _, L = libres(b, D0, ahora=a_las(10, 10))
    b.ok("10:10 am: hoy la primera es 10:30 (nada que ya pasó)", L[0] == "10:30" and "10:00" not in L, L[:3])
    _, L = libres(b, D0, ahora=a_las(10, 10), lead=2)
    b.ok("10:10 am con 2 h de anticipación: la primera es 12:30", L[0] == "12:30", L[:3])
    p, L = libres(b, D0, ahora=a_las(16, 40))
    b.ok("4:40 pm: hoy ya no hay horas", L == [], L)
    b.ok("4:40 pm: la portada avisa que ya cerró por hoy", "Ya cerramos por hoy" in txt(p, "#land"))
    b.ok("4:40 pm: el día de hoy sale deshabilitado", p.evaluate("()=>document.querySelector('#days button').disabled"))
    p, L = libres(b, D0, ahora=a_las(23, 55))
    b.ok("11:55 pm: hoy no hay nada", L == [], L)
    L1 = p.evaluate(LIB, [D1, [0]])
    b.ok("11:55 pm: mañana sale completo desde las 8:00", L1 == CADA30[:-1], L1)
    _, L = libres(b, D1, ahora=a_las(23, 55), lead=10)
    b.ok("11:55 pm con 10 h de anticipación: mañana empieza a las 10:00", L[0] == "10:00", L[:3])
    p, L = libres(b, D0, ahora=a_las(23, 59))
    p.evaluate("()=>__AVANZAR(120000)")  # pasan 2 minutos: ya es el día siguiente
    b.ok("Pasando la medianoche, la fecha de hoy cambia", p.evaluate("()=>ymd(new Date())") == D1)

    # Duración vs cierre (17:00)
    _, L = libres(b, D1, pk=(1,))
    b.ok("90 min: la última es 3:30 (termina a las 5:00 en punto)", L[-1] == "15:30", L[-2:])
    _, L = libres(b, D1, pk=(0, 1))
    b.ok("150 min: la última es 2:30", L[-1] == "14:30", L[-2:])

    # Cada cuánto (slot)
    for sl, esp in ((60, ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]),
                    (90, ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30"]), (120, ["08:00", "10:00", "12:00", "14:00", "16:00"])):
        _, L = libres(b, D1, slot=sl)
        b.ok("Cada %d min: %s" % (sl, ", ".join(esp)), L == esp, L)

    # Pausa (almuerzo)
    _, L = libres(b, D1, pk=(1,), brk={"a": "12:00", "b": "13:00"})
    b.ok("Pausa 12-1 con 90 min: nada que se meta en la pausa (10:30 sí, 11:00 no)", "10:30" in L and not [t for t in L if "10:30" < t < "13:00"], L)
    _, L = libres(b, D1, brk={"a": "12:00", "b": "13:00"}, slot=60)
    b.ok("Pausa 12-1 cada hora: 11:00 y luego 13:00", "11:00" in L and "12:00" not in L and "13:00" in L, L)

    # Última hora para empezar
    _, L = libres(b, D1, last="14:00")
    b.ok("Última reserva 2:00 pm: nada después", L[-1] == "14:00", L[-2:])

    # Ocupado a la mitad
    datos, _ = negocio_cr()
    datos["biz/U1/slots/%s_1000" % D1] = {"date": D1, "t": "1000", "job": "J9"}
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(), espera=900)
    L = p.evaluate(LIB, [D1, [1]])
    b.ok("Ocupado 10:00: con 90 min no salen 9:00, 9:30 ni 10:00; 8:30 y 10:30 sí", "08:30" in L and "10:30" in L and not {"09:00", "09:30", "10:00"} & set(L), L)
    L = p.evaluate(LIB, [D1, [0, 1]])
    b.ok("Ocupado 10:00: dos servicios seguidos (150 min) no pasan por encima (8:00 no, 10:30 sí)", "08:00" not in L and "08:30" not in L and "10:30" in L, L)

    # Días cerrados
    horas = [{"on": True, "a": "08:00", "b": "17:00"} for _ in range(7)]
    horas[(BASE + datetime.timedelta(days=2)).isoweekday() % 7] = {"on": False, "a": "08:00", "b": "17:00"}
    p, L = libres(b, D2, hours=horas)
    b.ok("Día de la semana cerrado: no hay horas y dice cerrado", L == [] and "cerrado" in txt(p, '#days button[data-d="%s"]' % D2).lower(), L)
    p, L = libres(b, D1, cierre={D1: 0})
    b.ok("Cierre del día completo (cierre=0): sin horas", L == [] and p.evaluate("(d)=>document.querySelector('#days button[data-d=\"'+d+'\"]').disabled", D1))
    _, L = libres(b, D1, cierre={D1: 12})
    b.ok("Cierre desde las 12: la última de 60 min es 11:00", L[-1] == "11:00", L[-2:])

    # Días hacia adelante
    p, _ = libres(b, D1, ahead=3)
    b.ok("Hasta 3 días adelante: salen 4 días (hoy + 3)", p.locator("#days button").count() == 4)

    # Zona que solo se atiende ciertos días
    sab = next(i for i in range(7) if (BASE + datetime.timedelta(days=i)).isoweekday() == 6)
    datos, _ = negocio_cr(home=True, zones=[{"n": "Cartago", "fee": 3000, "days": [6]}])
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(), espera=900)
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p); p.select_option("#zsel", "0"); p.fill("#ad", "Cartago centro"); siguiente(p, 600)
    on = p.evaluate("()=>Array.from(document.querySelectorAll('#days button:not([disabled])')).map(b=>b.dataset.d)")
    b.ok("Zona solo sábados: solo se pueden elegir sábados", on and all(datetime.date.fromisoformat(x).isoweekday() == 6 for x in on) and dia(sab) in on, on)
    b.ok("Zona solo sábados: los otros días dicen 'no vamos'", "no vamos" in txt(p, "#days").lower())

    # Lo que se ve en pantalla calza con lo calculado
    datos, _ = negocio_cr(brk={"a": "12:00", "b": "13:00"})
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(a_las(13, 10)), espera=900)
    ir_a_servicios(p); elegir_servicios(p, [0]); siguiente(p, 600)
    b.ok("En pantalla: hoy (1:10 pm) se auto-elige y arranca a la 1:30", p.get_attribute('#days button[data-d="%s"]' % D0, "aria-pressed") == "true" and p.locator("#hrs button").first.inner_text() == "1:30 pm",
         p.locator("#hrs button").all_inner_texts()[:3])
    b.ok("Sin errores de JS", not p.errs, p.errs[:3])
