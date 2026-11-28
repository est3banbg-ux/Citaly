"""Admin nuevo · zona horaria: la interfaz cuenta días, meses y fechas en hora de Costa Rica (UTC-6) aunque la compu
esté en otra zona (aquí Madrid, 7 h adelante), cerca de la medianoche de CR del último día del mes.
"Hoy", "termina mañana", la fecha de la mensualidad vencida, "Cobrado en nov / este mes" y la píldora de la lista
deben salir igual en Madrid que en Costa Rica, y la píldora debe coincidir con Hoy."""
import calendar, datetime
from ayuda import Banco, nuevo, H_PROPIO

def cr(y, m, d, h, mi=0):
    """ms de una hora de Costa Rica (UTC-6)."""
    return (calendar.timegm(datetime.datetime(y, m, d, h, mi).timetuple()) + 6 * 3600) * 1000

T1 = cr(2026, 11, 30, 23, 30)          # lunes 30 nov, 11:30 p. m. en CR = martes 1 dic, 6:30 a. m. en Madrid
SV = [{"id": "s1", "n": "Lavado", "p": 5000, "d": 60, "ic": "✨"}]
D = {"biz/z1": {"name": "Prueba Mañana", "slug": "prueba-manana", "type": "lavacar", "wa": "88881111", "created": {"__ts": cr(2026, 11, 20, 9)}, "services": SV, "hours": H_PROPIO, "tagline": "x"},
     "subs/z1": {"plan": "trial", "status": "trial", "until": {"__ts": cr(2026, 12, 1, 10)}},
     "biz/z2": {"name": "Paga Bien", "slug": "paga-bien", "type": "lavacar", "wa": "88882222", "created": {"__ts": cr(2026, 10, 1, 9)}, "services": SV, "hours": H_PROPIO, "tagline": "x"},
     "subs/z2": {"plan": "mensual", "tier": "arranque", "status": "active", "price": 500, "until": {"__ts": cr(2026, 12, 20, 10)}},
     "biz/z3": {"name": "Vencido Ayer", "slug": "vencido-ayer", "type": "lavacar", "wa": "88883333", "created": {"__ts": cr(2026, 9, 1, 9)}, "services": SV, "hours": H_PROPIO, "tagline": "x"},
     "subs/z3": {"plan": "mensual", "tier": "arranque", "status": "active", "price": 500, "until": {"__ts": cr(2026, 11, 29, 20)}},
     "payments/p1": {"biz": "z2", "name": "Paga Bien", "amt": 500, "at": cr(2026, 11, 15, 10), "type": "mes"},
     "payments/p2": {"biz": "z3", "name": "Vencido Ayer", "amt": 4900, "at": cr(2026, 10, 31, 20), "type": "mes"}}
LEER = """()=>({sub:document.getElementById('hoySub').textContent,plata:document.getElementById('hoyPlata').textContent,
  tareas:[...document.querySelectorAll('#hoyL .a-task')].map(t=>t.querySelector('.t').textContent+' | '+t.querySelector('p').textContent),
  pill:[...document.querySelectorAll('#list .a-row')].map(r=>r.querySelector('.m b').textContent+' | '+r.querySelector('.a-pill').textContent).sort(),
  plaSub:document.getElementById('plaSub').textContent})"""

with Banco() as b:
    res = {}
    for z in ("America/Costa_Rica", "Europe/Madrid"):
        p = nuevo(b, D, hash_="hoy", t0=T1, zona=z, espera=1800)
        res[z] = p.evaluate(LEER)
        b.ok("[%s] la compu está en esa zona" % z, p.evaluate("()=>Intl.DateTimeFormat().resolvedOptions().timeZone") == z)
    m, c = res["Europe/Madrid"], res["America/Costa_Rica"]
    b.ok("Madrid: el saludo dice lunes 30 de noviembre (día de Costa Rica)", m["sub"].startswith("Lunes 30 de noviembre"), m["sub"])
    t = [x for x in m["tareas"] if x.startswith("Prueba Mañana")]
    b.ok("Madrid: la prueba termina 'mañana (mar 1 dic)'", t and "termina mañana (mar 1 dic)" in t[0], m["tareas"])
    v = [x for x in m["tareas"] if x.startswith("Vencido Ayer")]
    b.ok("Madrid: la mensualidad vencida muestra la fecha de CR (29 nov)", v and "(29 nov 2026)" in v[0], m["tareas"])
    b.ok("Madrid: 'Cobrado en nov' cuenta el pago del 15 de noviembre", "Cobrado en nov: ₡500" in m["plata"].replace("\xa0", " "), m["plata"])
    b.ok("Madrid: 'este mes' en Plata igual que en CR", m["plaSub"] == c["plaSub"] and "este mes ₡500" in m["plaSub"].replace("\xa0", " "), (m["plaSub"], c["plaSub"]))
    b.ok("Madrid: la píldora dice 'mañana', igual que Hoy", "Prueba Mañana | Prueba · mañana" in m["pill"], m["pill"])
    b.ok("Madrid y Costa Rica muestran exactamente lo mismo", m == c, (m, c))
