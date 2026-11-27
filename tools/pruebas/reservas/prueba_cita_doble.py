"""Cita doble: otro cliente toma la hora entre que esta persona cargó la página y toca Confirmar.
Con la imitación de firestore.rules, escribir un cupo que ya existe se rechaza (como en el servidor real).
La página debe avisar, volver a 'Día y hora' con las horas al día y no dejar nada a medias."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

D1 = dia(1)


def hasta_resumen(p, idx, hora, tel="8888 7777"):
    ir_a_servicios(p); elegir_servicios(p, idx); siguiente(p, 600)
    elegir_dia_hora(p, D1, hora); siguiente(p); llenar_datos(p, tel=tel); siguiente(p)


def otro_toma(p, *horas, job="999"):
    poner(p, "biz/U1/jobs/" + job, {"date": D1})
    for h in horas:
        poner(p, "biz/U1/slots/%s_%s" % (D1, h.split("_")[0]) + ("_" + h.split("_")[1] if "_" in h else ""), {"date": D1, "t": h[:4], "job": job})


with Banco() as b:
    # 1) Le quitan la hora de en medio (9:30) de una cita de 90 min que empieza a las 9:00
    datos, _ = negocio_cr()
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [1], "09:00")
    otro_toma(p, "0930")
    confirmar(p, 1500)
    b.ok("Choque a la mitad: no muestra ¡Listo!", not p.locator("#ok").is_visible())
    b.ok("Choque a la mitad: avisa que alguien tomó la hora", "alguien acaba de tomar esa hora" in txt(p, "#er"), txt(p, "#er"))
    b.ok("Choque a la mitad: vuelve a 'Día y hora'", "Día y hora" in txt(p, "#pt"), txt(p, "#pt"))
    hs = p.locator("#hrs button").all_inner_texts()
    b.ok("Choque a la mitad: ya no ofrece 8:30, 9:00 ni 9:30", not {"8:30 am", "9 am", "9:30 am"} & set(hs) and "8 am" in hs and "10 am" in hs, hs)
    b.ok("Choque a la mitad: no quedó ninguna cita ni cupo de este cliente", list(jobs(p)) == ["999"] and slots_de(p) == [D1 + "_0930"] and "biz/U1/holds/88887777" not in estado(p))
    b.ok("Choque a la mitad: el botón vuelve a estar activo", p.locator("#nx").is_enabled() and txt(p, "#nx") == "Siguiente")
    # ... y puede reservar otra hora sin recargar
    elegir_dia_hora(p, D1, "10:00"); siguiente(p); siguiente(p); confirmar(p, 1200)
    nuevos = [k for k in jobs(p) if k != "999"]
    b.ok("Después del aviso, elige 10:00 y la reserva sale bien", p.locator("#ok").is_visible() and len(nuevos) == 1 and slots_de(p, nuevos[0]) == [D1 + "_1000", D1 + "_1030", D1 + "_1100"], slots_de(p))
    b.ok("Choque a la mitad: sin errores de JS", not p.errs, p.errs[:3])

    # 2) Le quitan la primera hora
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [0], "09:00")
    otro_toma(p, "0900")
    confirmar(p, 1500)
    b.ok("Choque al inicio: avisa y no guarda nada", "alguien acaba de tomar" in txt(p, "#er") and list(jobs(p)) == ["999"], txt(p, "#er"))

    # 3) Con 2 cupos: si le ganan el primer cupo, reintenta solo en el segundo
    datos2, _ = negocio_cr(lanes=2)
    p = b.abrir("/r/?n=prueba", datos2, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [0], "09:00")
    otro_toma(p, "0900")
    confirmar(p, 2500)
    nuevos = [k for k in jobs(p) if k != "999"]
    b.ok("Cupos: le ganaron el cupo 1 y la cita entra en el cupo 2 sin molestar al cliente", p.locator("#ok").is_visible() and len(nuevos) == 1 and slots_de(p, nuevos[0]) == [D1 + "_0900_1", D1 + "_0930"], slots_de(p))

    # 4) Con 2 cupos y los 2 tomados
    p = b.abrir("/r/?n=prueba", datos2, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [0], "09:00")
    otro_toma(p, "0900", "0900_1")
    confirmar(p, 2500)
    b.ok("Cupos llenos: avisa que tomaron la hora y no guarda nada", "alguien acaba de tomar" in txt(p, "#er") and list(jobs(p)) == ["999"], [txt(p, "#er"), list(jobs(p))])

    # 5) Mismo teléfono con una cita pendiente (hold vigente)
    datos5, _ = negocio_cr()
    datos5["biz/U1/holds/88887777"] = {"job": "111", "until": ts_rel(BASE, 3)}
    p = b.abrir("/r/?n=prueba", datos5, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [0], "09:00")
    confirmar(p, 1500)
    b.ok("Mismo teléfono con cita pendiente: explica y no guarda nada", "ya tienes una cita pendiente" in txt(p, "#er") and not jobs(p), txt(p, "#er"))
    # hold vencido: sí deja
    datos5["biz/U1/holds/88887777"] = {"job": "111", "until": ts_rel(BASE, -1)}
    p = b.abrir("/r/?n=prueba", datos5, antes=reloj()); activar_reglas(p)
    reservar(p, [0], D1, "09:00")
    b.ok("Mismo teléfono con la cita anterior ya pasada: sí reserva", p.locator("#ok").is_visible() and not negado(p), negado(p))

    # 6) Sin internet / sin permiso al guardar
    p = b.abrir("/r/?n=prueba", datos, antes=reloj(), negar=["biz/U1/jobs"])
    reservar(p, [0], D1, "09:00")
    b.ok("Si no se puede guardar: no muestra ¡Listo! y da un mensaje", not p.locator("#ok").is_visible() and "No pudimos confirmar tu cita" in txt(p, "#er"), txt(p, "#er"))

    # 7) Doble toque en Confirmar: una sola cita
    p = b.abrir("/r/?n=prueba", datos, antes=reloj()); activar_reglas(p)
    hasta_resumen(p, [0], "09:00")
    p.evaluate("()=>{T0=0;var b=document.getElementById('nx');b.click();b.click();b.click()}"); p.wait_for_timeout(1200)
    b.ok("Doble toque en Confirmar: se guarda una sola cita", len(jobs(p)) == 1 and not negado(p), [list(jobs(p)), negado(p)])
