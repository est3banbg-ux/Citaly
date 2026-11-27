"""ERROR: si una cita tiene un servicio que después se renombró (o se borró) en «Servicios y precios», al abrir
la cita y guardar cualquier cambio (una nota, la hora, el estado) ese servicio desaparece de items/lines de la
cita. El total queda igual, pero el historial del cliente y «Servicios más vendidos» pierden el servicio.
Causa: saveJob() reconstruye las líneas con lines(), que solo conserva las que coinciden con B.services."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D = dia(2)
with Banco() as b:
    datos, usuario = negocio(services=[{"id": "s1", "n": "Lavado", "p": 8000, "d": 60, "ic": "✨"}, {"id": "s2", "n": "Pulido de focos (par)", "p": 15000, "d": 60, "ic": "✨"}])
    datos["biz/U1/jobs/W1"] = {"id": "W1", "cli": "Ana", "tel": "88881111", "items": ["Lavado", "Pulido de focos"], "lines": [{"n": "Lavado", "p": 8000}, {"n": "Pulido de focos", "p": 15000}],
                               "date": D, "time": "09:00", "dur": 120, "sub": 23000, "disc": 0, "fee": 0, "total": 23000, "st": "Confirmada", "at": 1}
    p = abrir_app(b, datos, usuario)
    p.evaluate("()=>{openJob(JOBS.filter(x=>x._id==='W1')[0])}"); p.wait_for_timeout(300)
    p.evaluate("()=>{document.getElementById('jN').value='Trae las llaves';document.getElementById('jSave').click()}"); p.wait_for_timeout(700)
    x = p.evaluate("()=>window.__DB['biz/U1/jobs/W1']")
    b.ok("Agregar una nota no borra «Pulido de focos» de la cita", x["items"] == ["Lavado", "Pulido de focos"], x["items"])
    b.ok("Las líneas siguen sumando el total", sum(l["p"] for l in x["lines"]) == x["total"] == 23000, [x["lines"], x["total"]])
