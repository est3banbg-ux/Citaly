"""ERROR: 'Mi cita' no deja cancelar si el apartado del teléfono (holds/<tel>) ya es de OTRA cita del mismo cliente.
Al cancelar, la página siempre borra holds/<tel>; firestore.rules solo permite borrarlo si es de la cita que se
está cambiando (selfJob), así que el servidor rechaza TODO el lote y la cita sigue activa con sus cupos tomados.
Cómo pasa en la vida real (todo con clics): reserva A para mañana, la mueve desde su link a la otra semana
(el apartado no se mueve y vence mañana), pasado mañana reserva B con el mismo número (ya se permite) y luego
quiere cancelar A: "No se pudo cancelar. Si faltan menos de 12 horas...", aunque falten días.
Se reproduce con la imitación de firestore.rules (ayuda.REGLAS_JS). Arreglado el 26 nov 2026. Arreglo en el reporte."""
import datetime, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

SUB = {"status": "active", "until": ts_rel(BASE, 30)}
H = lambda d, h: datetime.datetime.strptime(d + " %02d:00" % h, "%Y-%m-%d %H:%M")

with Banco() as b:
    datos, _ = negocio_cr(sub=SUB)
    # 1) Martes 7:00: reserva A para el miércoles 9:00
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    reservar(p, [0], dia(1), "09:00")
    A = list(jobs(p))[0]; tkA = jobs(p)[A]["tk"]
    # 2) La mueve desde su link al domingo 10:00
    p = abrir_cita(b, estado(p), tk=tkA)
    mover(p, dia(5), "10:00")
    b.ok("Control: A quedó movida al domingo", estado(p)["biz/U1/mine/" + tkA]["date"] == dia(5) and not negado(p), negado(p))
    # 3) Jueves 7:00: reserva B (el apartado de A venció el miércoles 10:00)
    p = b.abrir("/r/?n=prueba", estado(p), antes=reloj(H(dia(2), 7))); activar_reglas(p)
    reservar(p, [1], dia(3), "09:00")
    b.ok("Control: B se reservó con el mismo número", p.locator("#ok").is_visible() and len(jobs(p)) == 2, negado(p))
    # 4) Jueves 8:00: quiere cancelar A (faltan 3 días)
    p = abrir_cita(b, estado(p), ahora=H(dia(2), 8), tk=tkA)
    cancelar(p)
    db = estado(p)
    b.ok("Cancelar A: confirma 'Tu cita quedó cancelada'", "quedó cancelada" in txt(p, "#mcb"), negado(p))
    b.ok("Cancelar A: la cita queda cancelada y sus cupos libres", db["biz/U1/jobs/" + A]["st"] == "Cancelada" and not slots_de(p, A), [db["biz/U1/jobs/" + A]["st"], slots_de(p, A)])
    b.ok("Cancelar A: no muestra 'No se pudo cancelar'", "No se pudo cancelar" not in txt(p, "#mcb"), txt(p, "#mcb")[:160])
