"""Datos «sucios» de un negocio viejo (sin web, sin mods, sin hours, sin veh/zones/team, servicios sin id ni ícono,
precio como texto, citas sin lines/dur/st, clientes y gastos incompletos): la app no revienta en ninguna vista
ni hoja, y al guardar Servicios los arregla (id, precio numérico)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, abrir_app, html_mal, ts, dia, abierta

D = dia(1)
CLAVES = "neg svc veh hor look res web dom ref fot vid est ia stp why dep mode gcal help inst ntf rev faq plan".split()
VIEJO = {"name": "Lavacar Viejo", "slug": "viejo", "type": "lavacar", "wa": "88887777", "color": "#2f8cff",
         "services": [{"n": "Lavado", "p": "8000", "d": "60"}, {"n": "Pulido sin precio"}, {"n": "Encerado", "p": 5000, "d": 45, "ic": ""}]}
CASOS = {
    "sin nada opcional": {},
    "campos en null": {"web": None, "mods": None, "hours": None, "veh": None, "zones": None, "team": None, "clis": None, "cierre": None, "onb": None},
    "horario incompleto": {"hours": [{"on": True}, {}, {"on": True, "a": "08:00"}]},
    "tipo de negocio que ya no existe": {"type": "barberia-vieja"},
}

with Banco() as b:
    for nombre, extra in CASOS.items():
        biz = dict(VIEJO, **extra)
        datos = {"biz/U1": biz, "pub/viejo": {"biz": "U1", "name": biz["name"]}, "subs/U1": {"status": "trial", "until": ts(5)},
                 "biz/U1/jobs/J1": {"cli": "Sin datos", "date": D, "time": "10:00"},
                 "biz/U1/jobs/J2": {"cli": "Vieja lista", "tel": "88880000", "date": dia(-20, saltar_domingo=False), "time": "08:00", "st": "Lista", "total": "9000", "items": ["Lavado"]},
                 "biz/U1/jobs/J3": {"id": "J3", "cli": "Sin hora", "date": D},
                 "biz/U1/exp/E1": {"desc": "Algo", "amt": "1500"}}
        biz["clis"] = biz.get("clis") if "clis" in extra else [{"n": "Cliente suelto"}, {"tel": "88889999"}, {"id": "c1", "n": "Fijo", "cada": "30"}]
        p = abrir_app(b, datos, {"uid": "U1", "email": "viejo@prueba.test"}, plan=None, espera=2500)
        b.ok("[%s] entra a la app" % nombre, p.evaluate("()=>document.getElementById('main').classList.contains('on')"), p.errs[:2])
        mal = []
        for v in ("agenda", "clientes", "numeros", "ajustes"):
            n0 = len(p.errs); p.evaluate("v=>go(v)", v); p.wait_for_timeout(200)
            if p.errs[n0:]:
                mal.append((v, p.errs[n0:][:1]))
        for k in CLAVES:
            n0 = len(p.errs); p.evaluate("k=>{closeSheet(true);openSet(k)}", k); p.wait_for_timeout(150)
            if p.errs[n0:] or not abierta(p):
                mal.append((k, p.errs[n0:][:1]))
        for js in ("()=>openJob(JOBS.filter(j=>j._id==='J1')[0])", "()=>openJob(JOBS.filter(j=>j._id==='J3')[0])", "()=>openJob(null,{})", "()=>openCli(clients()[0])", "()=>cliForm(CLIS()[0])"):
            n0 = len(p.errs); p.evaluate("()=>closeSheet(true)"); p.evaluate(js); p.wait_for_timeout(150)
            if p.errs[n0:]:
                mal.append((js, p.errs[n0:][:1]))
        b.ok("[%s] todas las vistas y hojas abren sin errores de JS" % nombre, not mal and not p.errs, mal or p.errs[:2])
        b.ok("[%s] sin HTML desbalanceado" % nombre, not html_mal(p), html_mal(p)[:2])
        # Guardar servicios arregla los datos
        p.evaluate("()=>{closeSheet(true);openSet('svc')}"); p.wait_for_timeout(250)
        n = p.evaluate("()=>document.querySelectorAll('#sv > .svcrow').length")
        p.evaluate("()=>document.getElementById('svS').click()"); p.wait_for_timeout(600)
        sv = p.evaluate("()=>window.__DB['biz/U1'].services")
        b.ok("[%s] servicios: muestra las 3 filas" % nombre, n == 3, n)
        b.ok("[%s] servicios: al guardar quedan con id, precio y duración numéricos" % nombre, sv and len(sv) == 3 and all(s.get("id") for s in sv) and [s["p"] for s in sv] == [8000, 0, 5000] and [s["d"] for s in sv] == [60, 60, 45], sv)
        b.ok("[%s] servicios: los ids no se repiten" % nombre, sv and len(set(s["id"] for s in sv)) == 3, sv and [s["id"] for s in sv])
        b.ok("[%s] guardar: sin errores" % nombre, not p.errs, p.errs[:2])
