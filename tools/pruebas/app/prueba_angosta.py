"""Pantalla angosta (360 px): las vistas principales y las hojas más usadas no se salen de lado
(document.documentElement.scrollWidth <= innerWidth), con datos largos (nombres y servicios largos)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, negocio, abrir_app, dia

D = dia(0, saltar_domingo=False)
LARGO = "Lavado premium con descontaminado y encerado de alta duración"
with Banco() as b:
    datos, usuario = negocio(name="Detailing y Lavacar Los Hermanos Rodríguez Premium", services=[{"id": "s1", "n": LARGO, "p": 125000, "d": 240, "ic": "✨"}, {"id": "s2", "n": "Pulido", "p": 15000, "d": 90, "ic": "✨"}],
                             mods={"vehiculo": True}, veh=[{"n": "Sedán o hatchback", "x": 0}, {"n": "SUV grande o pick-up 4x4", "x": 5000}], home=True, zones=[{"n": "San Rafael de Alajuela centro", "fee": 3000}])
    datos["biz/U1/jobs/J1"] = {"id": "J1", "cli": "María Fernanda de los Ángeles Rodríguez", "tel": "88881111", "items": [LARGO], "lines": [{"n": LARGO, "p": 125000}], "date": D, "time": "09:00", "dur": 240, "total": 125000, "st": "Confirmada", "at": 1, "ubic": "https://maps.google.com/?q=9.99,-84.11"}
    datos["biz/U1/exp/E1"] = {"desc": "Productos de limpieza y microfibras importadas", "amt": 45000, "date": D, "cat": "Materiales", "at": 1}
    for plan in ("arranque", "prueba"):
        p = abrir_app(b, datos, usuario, plan, ancho=360)
        malas = []
        for v in ("agenda", "clientes", "numeros", "ajustes"):
            p.evaluate("v=>go(v)", v); p.wait_for_timeout(250)
            w = p.evaluate("()=>[document.documentElement.scrollWidth,innerWidth]")
            if w[0] > w[1]:
                malas.append((v, w))
        b.ok("[%s] 360 px: agenda, clientes, números y ajustes sin desborde horizontal" % plan, not malas, malas)
        malas = []
        for nombre, js in (("cita", "()=>openJob(JOBS[0])"), ("nueva cita", "()=>openJob(null,{})"), ("servicios", "()=>openSet('svc')"), ("vehículos", "()=>openSet('veh')"),
                           ("domicilio", "()=>openSet('dom')"), ("horario", "()=>openSet('hor')"), ("reglas", "()=>openSet('res')"), ("portada", "()=>openSet('web')"),
                           ("mi plan", "()=>openSet('plan')"), ("cliente", "()=>openCli(clients()[0])"), ("nuevo cliente", "()=>cliForm(null)")):
            p.evaluate("()=>closeSheet(true)"); p.evaluate(js); p.wait_for_timeout(250)
            w = p.evaluate("()=>[document.documentElement.scrollWidth,innerWidth,document.getElementById('shC').scrollWidth,document.getElementById('shC').clientWidth]")
            if w[0] > w[1] or w[2] > w[3] + 1:
                malas.append((nombre, w))
        b.ok("[%s] 360 px: las hojas más usadas no se salen de lado" % plan, not malas, malas)
        b.ok("[%s] 360 px: sin errores" % plan, not p.errs, p.errs[:2])
