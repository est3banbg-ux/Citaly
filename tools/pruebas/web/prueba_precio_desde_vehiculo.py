"""PENDIENTE (falla hoy): plantilla Pro, dato rápido "precio desde".
Si el dueño puso un precio propio por tipo de vehículo MÁS BAJO que el precio base (ej. Sedán ₡12 000 con base ₡15 000),
la tarjeta del servicio dice "desde ₡12 000" pero el dato de arriba dice "₡15 000 precio desde": precio inicial más caro que el real."""
from ayuda_web import Banco, armar, abrir

with Banco() as b:
    d = armar(mods={"vehiculo": True}, veh=[{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 5000}],
              services=[{"id": "s1", "n": "Pulido", "p": 15000, "d": 60, "vx": True, "vp": [{"n": "Sedán", "p": 12000}]},
                        {"id": "s2", "n": "Lavado", "p": 20000, "d": 60}])
    p = abrir(b, d)
    tarjeta = p.evaluate("()=>document.querySelector('.pr-amt').innerText.replace(/\\s+/g,' ')")
    dato = p.evaluate("()=>document.querySelector('.pr-stat').innerText.replace(/\\s+/g,' ')")
    b.ok("la tarjeta dice desde ₡12 000", tarjeta == "desde ₡12 000", tarjeta)
    b.ok("el dato 'precio desde' coincide con el precio más bajo real (₡12 000)", dato.startswith("₡12 000"), dato)
