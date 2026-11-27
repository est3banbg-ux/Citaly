"""Agenda y citas desde la app del dueño: crear (1 y 2 servicios), mover de hora y de día, cancelar,
eliminar (y deshacer), marcar atendida. Verifica que biz/U1/jobs y biz/U1/slots queden coherentes."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia, html_mal, esperar

D = dia(2)
D2 = next(dia(k) for k in range(3, 6) if dia(k) != D)
SVCS = [{"id": "s1", "n": "Lavado", "p": 8000, "d": 60, "ic": "✨"}, {"id": "s2", "n": "Pulido", "p": 15000, "d": 90, "ic": "✨"},
        {"id": "s3", "n": "Encerado", "p": 5000, "d": 30, "ic": "✨"}, {"id": "s4", "n": "Motor", "p": 7000, "d": 45, "ic": "✨"}]


def slots(p, job=None):
    return sorted(k.split("/")[-1] for k, v in p.evaluate("()=>window.__DB").items()
                  if k.startswith("biz/U1/slots/") and (job is None or str(v.get("job")) == str(job)))


def job(p, jid):
    return p.evaluate("id=>window.__DB['biz/U1/jobs/'+id]||null", jid)


def jobs(p):
    return {k.split("/")[-1]: v for k, v in p.evaluate("()=>window.__DB").items() if k.startswith("biz/U1/jobs/")}


def nueva(p, cli, servicios, fecha, hora):
    p.evaluate("""([c,ss,f,h])=>{openJob(null,{date:f});
      document.getElementById('jC').value=c;
      ss.forEach(n=>document.querySelector('#jS [data-n="'+n+'"]').click());
      var d=document.getElementById('jD');d.value=f;d.dispatchEvent(new Event('change'));
      var hh=document.getElementById('jH');hh.value=h;hh.dispatchEvent(new Event('change'));
      document.getElementById('jSave').click()}""", [cli, servicios, fecha, hora])
    p.wait_for_timeout(700)
    return [k for k, v in jobs(p).items() if v.get("cli") == cli][0]


def abrir_cita(p, jid):
    p.evaluate("id=>{closeSheet(true);openJob(JOBS.filter(x=>x._id===id)[0])}", jid)
    p.wait_for_timeout(300)


with Banco() as b:
    datos, usuario = negocio(services=SVCS)
    p = abrir_app(b, datos, usuario)

    # 1) Cita con 1 servicio
    j1 = nueva(p, "Cliente Uno", ["Lavado"], D, "08:00")
    x = job(p, j1)
    b.ok("Cita de 1 servicio: guarda cliente, servicio, precio y duración", x and x["items"] == ["Lavado"] and x["total"] == 8000 and x["dur"] == 60 and x["date"] == D and x["time"] == "08:00", x)
    b.ok("Cita de 1 servicio: bloquea 2 medias horas (8:00 y 8:30)", slots(p, j1) == [D + "_0800", D + "_0830"], slots(p, j1))

    # 2) Cita con 2 servicios: 90 + 30 = 120 min
    j2 = nueva(p, "Cliente Dos", ["Pulido", "Encerado"], D, "10:00")
    x = job(p, j2)
    b.ok("Cita de 2 servicios: suma precios y duración", x and x["items"] == ["Pulido", "Encerado"] and x["total"] == 20000 and x["dur"] == 120, x)
    b.ok("Cita de 2 servicios: bloquea de 10:00 a 11:30", slots(p, j2) == [D + "_1000", D + "_1030", D + "_1100", D + "_1130"], slots(p, j2))

    # 3) Mover de hora: libera las viejas y bloquea las nuevas
    abrir_cita(p, j2)
    p.evaluate("()=>{var h=document.getElementById('jH');h.value='13:00';h.dispatchEvent(new Event('change'));document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    b.ok("Mover de hora: la cita queda a la 1:00", job(p, j2)["time"] == "13:00", job(p, j2))
    b.ok("Mover de hora: libera 10:00-11:30 y bloquea 13:00-14:30", slots(p, j2) == [D + "_1300", D + "_1330", D + "_1400", D + "_1430"], slots(p, j2))

    # 4) Mover de día
    abrir_cita(p, j2)
    p.evaluate("d=>{var e=document.getElementById('jD');e.value=d;e.dispatchEvent(new Event('change'));var h=document.getElementById('jH');h.value='13:00';document.getElementById('jSave').click()}", D2)
    p.wait_for_timeout(700)
    b.ok("Mover de día: libera el día viejo y bloquea el nuevo", slots(p, j2) == [D2 + "_1300", D2 + "_1330", D2 + "_1400", D2 + "_1430"] and job(p, j2)["date"] == D2, slots(p, j2))

    # 5) Cambiar duración desde el selector
    abrir_cita(p, j1)
    p.evaluate("()=>{var e=document.getElementById('jDu');e.value='90';e.dispatchEvent(new Event('change'));document.getElementById('jH').value='08:00';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    b.ok("Alargar a 90 min bloquea una media hora más", slots(p, j1) == [D + "_0800", D + "_0830", D + "_0900"] and job(p, j1)["dur"] == 90, slots(p, j1))

    # 6) Cancelar: libera las horas
    abrir_cita(p, j1)
    p.evaluate("()=>{document.getElementById('jE').value='Cancelada';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    b.ok("Cancelar: queda Cancelada y libera las horas", job(p, j1)["st"] == "Cancelada" and slots(p, j1) == [], slots(p, j1))

    # 7) Reactivar la cancelada: vuelve a bloquear
    abrir_cita(p, j1)
    p.evaluate("()=>{document.getElementById('jE').value='Confirmada';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    b.ok("Reactivar una cancelada vuelve a bloquear sus horas", slots(p, j1) == [D + "_0800", D + "_0830", D + "_0900"], slots(p, j1))

    # 8) Marcar atendida: queda Lista con doneAt, conserva las horas
    abrir_cita(p, j1)
    p.evaluate("()=>document.getElementById('jDone').click()")
    p.wait_for_timeout(900)
    x = job(p, j1)
    b.ok("Marcar atendida: estado Lista y fecha de atendida", x["st"] == "Lista" and x.get("doneAt"), x.get("st"))
    b.ok("Marcar atendida: no toca las horas bloqueadas", slots(p, j1) == [D + "_0800", D + "_0830", D + "_0900"], slots(p, j1))

    # 9) Eliminar: borra la cita y sus horas; deshacer la recupera
    p.evaluate("()=>closeSheet(true)")
    abrir_cita(p, j2)
    p.evaluate("()=>document.getElementById('jDel').click()")
    p.wait_for_timeout(700)
    b.ok("Eliminar: borra la cita y libera sus horas", job(p, j2) is None and slots(p, j2) == [], slots(p, j2))
    b.ok("Eliminar no toca las horas de otras citas", slots(p, j1) == [D + "_0800", D + "_0830", D + "_0900"], slots(p))
    hay_deshacer = p.evaluate("()=>{var t=document.getElementById('toast');var bt=t&&t.querySelector('button');if(bt){bt.click();return true}return false}")
    p.wait_for_timeout(800)
    b.ok("Deshacer eliminar recupera la cita y vuelve a bloquear", hay_deshacer and job(p, j2) is not None and slots(p, j2) == [D2 + "_1300", D2 + "_1330", D2 + "_1400", D2 + "_1430"], [hay_deshacer, slots(p, j2)])

    # 10) Cambiar de día y de semana en la agenda
    r = p.evaluate("""()=>{closeSheet(true);go('agenda');document.getElementById('today').click();var a=document.getElementById('wT').textContent;
      document.getElementById('wN').click();var b=document.getElementById('wT').textContent;
      document.getElementById('wP').click();document.getElementById('wP').click();var c=document.getElementById('wT').textContent;
      document.getElementById('today').click();var d=document.getElementById('wT').textContent;
      var dias=document.querySelectorAll('#week button');if(dias[2])dias[2].click();
      return [a,b,c,d,document.getElementById('dT').textContent]}""")
    b.ok("La agenda cambia de semana (‹ › y Hoy) sin errores", r[0] != r[1] and r[1] != r[2] and r[3] == r[0] and r[4] and not p.errs, [r, p.errs[:2]])
    b.ok("Sin HTML roto en la agenda ni en las citas", not html_mal(p), html_mal(p)[:2])
    b.ok("Sin errores de JavaScript", not p.errs, p.errs[:3])

    # 11) Cita que viene de la web: se ve en la agenda y se puede confirmar sin perder datos
    datos, usuario = negocio(services=SVCS)
    datos["biz/U1/jobs/W1"] = {"id": "W1", "cli": "Ana Web", "tel": "88881111", "items": ["Lavado"], "lines": [{"n": "Lavado", "p": 8000}], "date": D, "time": "09:00",
                               "dur": 60, "sub": 8000, "disc": 0, "fee": 2000, "total": 10000, "st": "Por confirmar", "web": True, "src": "web", "at": 1, "zone": "Heredia", "veh": "Hilux"}
    for t in ("0900", "0930"):
        datos["biz/U1/slots/%s_%s" % (D, t)] = {"date": D, "t": t, "job": "W1", "at": 1}
    p = abrir_app(b, datos, usuario)
    p.evaluate("d=>{SEL=d;go('agenda');renderAg()}", D)
    p.wait_for_timeout(300)
    b.ok("Cita web: aparece en la agenda del día", "Ana Web" in p.evaluate("()=>document.getElementById('v-agenda').innerText"))
    abrir_cita(p, "W1")
    b.ok("Cita web: avisa que reservó desde el link", "Reservó desde tu link" in p.evaluate("()=>document.getElementById('shC').innerText"))
    p.evaluate("()=>{document.getElementById('jE').value='Confirmada';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    x = job(p, "W1")
    b.ok("Cita web confirmada: conserva web, domicilio, zona, vehículo y total", x["st"] == "Confirmada" and x["web"] is True and x["fee"] == 2000 and x["total"] == 10000 and x["zone"] == "Heredia" and x["veh"] == "Hilux", x)
    b.ok("Cita web confirmada: conserva sus horas", slots(p, "W1") == [D + "_0900", D + "_0930"], slots(p, "W1"))
    b.ok("Cita web: sin errores de JavaScript", not p.errs, p.errs[:3])

    # 12) Cupos (Turbo, 2 a la vez): dos citas a la misma hora usan carriles distintos; cancelar una libera solo la suya
    datos, usuario = negocio(services=SVCS, lanes=2)
    p = abrir_app(b, datos, usuario, "turbo")
    a = nueva(p, "Cupo Uno", ["Lavado"], D, "09:00")
    c = nueva(p, "Cupo Dos", ["Lavado"], D, "09:00")
    b.ok("Cupos: la segunda cita a la misma hora usa el carril _1", slots(p, a) == [D + "_0900", D + "_0930"] and slots(p, c) == [D + "_0900_1", D + "_0930_1"], [slots(p, a), slots(p, c)])
    abrir_cita(p, a)
    p.evaluate("()=>{document.getElementById('jE').value='Cancelada';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    b.ok("Cupos: cancelar la primera libera solo sus horas", slots(p) == [D + "_0900_1", D + "_0930_1"], slots(p))
    abrir_cita(p, c)
    p.evaluate("()=>{var h=document.getElementById('jH');h.value='09:30';document.getElementById('jSave').click()}")
    p.wait_for_timeout(700)
    s = slots(p, c)
    b.ok("Cupos: mover la segunda deja exactamente 2 bloques suyos (9:30 y 10:00)", len(s) == 2 and sorted(x.split("_")[1] for x in s) == ["0930", "1000"] and slots(p) == s, s)
    b.ok("Cupos: sin errores", not p.errs, p.errs[:2])
