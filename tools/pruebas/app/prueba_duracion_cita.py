"""ERROR: al abrir y guardar una cita cuya duración no está en la lista DURS de la app (p. ej. 210 o 270 min,
que la página de reservas sí genera al sumar 2 servicios: 90+120), el selector de duración queda vacío y al
guardar la cita pasa a durar 60 min y se LIBERAN las horas siguientes (otra persona puede reservarlas).
Pasa con solo confirmar la cita o cambiarle el estado."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D = dia(2)
with Banco() as b:
    for dur in (210, 270, 600):
        datos, usuario = negocio(services=[{"id": "s1", "n": "Lavado", "p": 8000, "d": 90, "ic": "✨"}, {"id": "s2", "n": "Pulido", "p": 15000, "d": 120, "ic": "✨"}])
        n = -(-dur // 30)
        bloques = ["%02d%02d" % divmod(8 * 60 + 30 * i, 60) for i in range(n)]
        datos["biz/U1/jobs/W1"] = {"id": "W1", "cli": "Ana Web", "tel": "88881111", "items": ["Lavado", "Pulido"], "lines": [{"n": "Lavado", "p": 8000}, {"n": "Pulido", "p": 15000}],
                                   "date": D, "time": "08:00", "dur": dur, "sub": 23000, "disc": 0, "fee": 0, "total": 23000, "st": "Por confirmar", "web": True, "src": "web", "at": 1}
        for t in bloques:
            datos["biz/U1/slots/%s_%s" % (D, t)] = {"date": D, "t": t, "job": "W1", "at": 1}
        p = abrir_app(b, datos, usuario)
        p.evaluate("()=>{openJob(JOBS.filter(x=>x._id==='W1')[0])}")
        p.wait_for_timeout(300)
        sel = p.evaluate("()=>document.getElementById('jDu').value")
        b.ok("Cita de %d min: el selector muestra su duración" % dur, sel == str(dur), "selector=%r" % sel)
        p.evaluate("()=>{document.getElementById('jE').value='Confirmada';document.getElementById('jSave').click()}")
        p.wait_for_timeout(700)
        x = p.evaluate("()=>window.__DB['biz/U1/jobs/W1']")
        quedan = sorted(k for k in p.evaluate("()=>Object.keys(window.__DB)") if k.startswith("biz/U1/slots/"))
        b.ok("Cita de %d min: al confirmarla conserva la duración" % dur, x["dur"] == dur, "dur guardada=%s" % x["dur"])
        b.ok("Cita de %d min: al confirmarla no libera sus horas" % dur, len(quedan) == n, "quedan %d de %d bloques" % (len(quedan), n))
