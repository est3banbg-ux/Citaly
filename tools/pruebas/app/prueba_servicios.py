"""Servicios y precios: se puede editar y borrar CUALQUIER servicio (error del 24-26 nov 2026: sobraba un </div>
y solo el primero se podía tocar), y el tope del plan no bloquea editar ni borrar."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, negocio, ts

def svcs(n):
    return [{"id": "s%d" % i, "n": "Servicio %d" % (i + 1), "p": 1000 * (i + 1), "d": 60, "ic": "✨"} for i in range(n)]

CASOS = [("Arranque con 12 (pasa el tope de 10)", {"status": "active", "tier": "arranque", "until": ts(20)}, 12, {}),
         ("Arranque con 10", {"status": "active", "tier": "arranque", "until": ts(20)}, 10, {}),
         ("Prueba gratis con 12", {"status": "trial", "until": ts(5)}, 12, {}),
         ("Con precio por vehículo", {"status": "trial", "until": ts(5)}, 12, {"mods": {"vehiculo": True}, "veh": [{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 5000}]})]

with Banco() as b:
    for nombre, sub, n, extra in CASOS:
        datos, usuario = negocio(services=svcs(n), **extra)
        datos["subs/U1"] = sub
        p = b.abrir("/app/", datos, usuario, espera=2200)
        p.evaluate("()=>openSet('svc')"); p.wait_for_timeout(400)
        r = p.evaluate("""()=>{var q=s=>document.querySelectorAll(s);var o={filas:q('#sv > .svcrow').length,nombres:q('#sv [data-k="n"]').length,quitar:q('#sv [data-rm]').length};
          q('#sv [data-pk]')[3].click(); o.icono=!!document.querySelector('#sv .icpk'); q('#sv [data-pk]')[3].click();
          var i=q('#sv [data-k="n"]'); i[0].value='Primero EDITADO'; i[0].dispatchEvent(new Event('input',{bubbles:true}));
          i[5].value='Sexto EDITADO'; i[5].dispatchEvent(new Event('input',{bubbles:true}));
          q('#sv [data-rm]')[1].click(); o.tras=q('#sv > .svcrow').length; document.getElementById('svS').click(); return o}""")
        p.wait_for_timeout(500)
        b.ok(nombre + ": todas las filas están dentro de la lista", r["filas"] == n and r["nombres"] == n and r["quitar"] == n, r)
        b.ok(nombre + ": el botón ✕ quita la fila", r["tras"] == n - 1, r)
        b.ok(nombre + ": abre el selector de íconos", r["icono"], r)
        w = [x for x in b.escrituras(p, "biz/U1") if x[2] and "services" in x[2]]
        nombres = [s["n"] for s in w[-1][2]["services"]] if w else []
        b.ok(nombre + ": guarda los cambios de cualquier fila", len(nombres) == n - 1 and nombres[0] == "Primero EDITADO" and "Sexto EDITADO" in nombres and "Servicio 2" not in nombres, nombres[:7])
        b.ok(nombre + ": sin errores", not p.errs, p.errs[:3])
    # No deja AGREGAR por encima del tope, pero sí guardar lo que ya había
    datos, usuario = negocio(services=svcs(10)); datos["subs/U1"] = {"status": "active", "tier": "arranque", "until": ts(20)}
    p = b.abrir("/app/", datos, usuario, espera=2200)
    p.evaluate("()=>openSet('svc')"); p.wait_for_timeout(400)
    p.evaluate("""()=>{document.getElementById('svA').click();var i=document.querySelectorAll('#sv [data-k="n"]');i[10].value='El once';i[10].dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('svS').click()}""")
    p.wait_for_timeout(900)
    b.ok("Arranque: al agregar el servicio 11 ofrece subir de plan y no guarda", p.locator("#upGo").count() == 1 and not [x for x in b.escrituras(p, "biz/U1") if x[2] and "services" in x[2]])
