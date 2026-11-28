"""Admin nuevo · pantalla Hoy: cada tipo de tarea sale cuando debe y no cuando no, ordenadas por urgencia,
posponer 1 día (se guarda en el aparato), estado vacío, tarjeta de plata y contadores iguales al clásico."""
import json
from ayuda import Banco, nuevo, clasico, datos, errores, ts, T0, DIA, H_REG, H_PROPIO

TAREAS = "()=>[...document.querySelectorAll('#hoyL .a-task')].map(t=>({t:t.querySelector('.t').textContent,p:t.querySelector('p').textContent,b:[...t.querySelectorAll('.a-bt [data-h],.a-bt a')].map(x=>x.textContent.trim()||x.getAttribute('aria-label'))}))"

with Banco() as b:
    p = nuevo(b, espera=2000)
    T = p.evaluate(TAREAS)
    nombres = [t["t"] for t in T]
    b.ok("Hoy: salen las 6 tareas esperadas en orden de urgencia",
         nombres == ["Lavacar Express Norte", "Barbería Corte Fino", "Cliente Tarjeta", "Refri y Aire Pura", "Pulidos La Esquina", "Lavacar Aurora"], nombres)
    por = {t["t"]: t for t in T}
    b.ok("Hoy: mensualidad vencida dice cuándo venció", "venció hace 3 días" in por["Lavacar Express Norte"]["p"], por.get("Lavacar Express Norte"))
    b.ok("Hoy: prueba vencida sin plan", "Su prueba terminó hace 2 días" in por["Barbería Corte Fino"]["p"])
    b.ok("Hoy: pago de Polar sin cuenta, con Buscar negocio", "Polar" in por["Cliente Tarjeta"]["p"] and "Buscar negocio" in por["Cliente Tarjeta"]["b"], por.get("Cliente Tarjeta"))
    b.ok("Hoy: prueba que termina en 2 días", "termina en 2 días" in por["Refri y Aire Pura"]["p"])
    b.ok("Hoy: recién registrado y lo que le falta", "Se registró ayer" in por["Pulidos La Esquina"]["p"] and "servicios" in por["Pulidos La Esquina"]["p"] and "Dejarla lista" in por["Pulidos La Esquina"]["b"], por.get("Pulidos La Esquina"))
    b.ok("Hoy: prospecto para dar seguimiento", "no ha respondido" in por["Lavacar Aurora"]["p"])
    b.ok("Hoy: no salen los que están bien, pausados, demos ni viejos", not set(nombres) & {"Detailing Las Brisas", "Polarizados Sol", "Taller Don Beto", "Demo Brillo Total", "Lavacar El Roble", "Uñas Bella", "Detailing Pura Vida", "Taller Los Pinos"})
    b.ok("Hoy: botones de cobro solo donde toca", "Registrar pago" in por["Lavacar Express Norte"]["b"] and "Registrar pago" not in por["Pulidos La Esquina"]["b"] and "Registrar pago" not in por["Lavacar Aurora"]["b"])
    b.ok("Hoy: subtítulo con la cantidad", "6 cosas para hoy" in p.text_content("#hoySub"), p.text_content("#hoySub"))
    # Escribirle: abre WhatsApp con el mensaje listo de "mensualidad vencida"
    p.evaluate("()=>{[...document.querySelectorAll('#hoyL .a-task')][0].querySelector('[data-h=\"wa\"]').click()}")
    op = p.evaluate("()=>window.__OPENED")
    b.ok("Hoy: Escribirle abre WhatsApp al número del negocio con el mensaje de vencida", op and "phone=50688888888" in op[-1] and "venci" in json.loads(json.dumps(op[-1])).lower().replace("%c3%b3", "ó"), op[-1:] if op else op)
    p.evaluate("()=>{[...document.querySelectorAll('#hoyL .a-task')][0].querySelector('[data-h=\"cp\"]').click()}")
    p.wait_for_timeout(200)
    cp = p.evaluate("()=>window.__COPIADO")
    b.ok("Hoy: Copiar copia el mismo mensaje", cp and "venció" in cp[-1], cp)
    # Plata y contadores iguales a los del clásico
    hp = p.text_content("#hoyPlata")
    n = p.evaluate("()=>[...document.querySelectorAll('#hoyN b')].map(x=>+x.textContent)")
    pv = clasico(b, espera=2000)
    kp = pv.evaluate("()=>Object.fromEntries([...document.querySelectorAll('#kpis .kpi')].map(k=>[k.querySelector('span').textContent,k.querySelector('b').textContent]))")
    b.ok("Hoy: ingreso fijo igual al del clásico", kp["Ingreso fijo al mes"] in hp, (kp, hp))
    b.ok("Hoy: cobrado este mes igual al del clásico", kp["Cobrado este mes"] in hp, (kp, hp))
    b.ok("Hoy: meta de Métricas (adm/_cfg)", "₡100" in hp, hp)
    b.ok("Hoy: contadores (nuevos 7 días, en prueba, pagando)", n == [2, int(kp["En prueba gratis"]), int(kp["Negocios activos"])], (n, kp))
    # Posponer
    p.evaluate("()=>{[...document.querySelectorAll('#hoyL .a-task')][1].querySelector('[data-h=\"posp\"]').click()}")
    p.wait_for_timeout(200)
    T2 = [t["t"] for t in p.evaluate(TAREAS)]
    ls = p.evaluate("()=>JSON.parse(localStorage.getItem('cz_adm_posp')||'{}')")
    b.ok("Posponer: la tarea se va de la lista", "Barbería Corte Fino" not in T2 and len(T2) == 5, T2)
    b.ok("Posponer: queda guardado 1 día en el aparato", list(ls.values()) == [T0 + DIA], ls)
    b.ok("Posponer: avisa cuántas hay pospuestas", "1 pospuesta" in p.text_content("#hoyL"))
    p.evaluate("()=>document.querySelector('[data-h=\"showp\"]').click()")
    b.ok("Posponer: se pueden ver otra vez", "Barbería Corte Fino" in [t["t"] for t in p.evaluate(TAREAS)])
    p.reload(); p.wait_for_timeout(1800)
    b.ok("Posponer: sigue pospuesta al recargar", "Barbería Corte Fino" not in [t["t"] for t in p.evaluate(TAREAS)])
    b.ok("Hoy: sin errores", not errores(p), errores(p)[:3])

    # Casos borde
    d = datos()
    d["subs/b_tvenc"]["until"] = ts(-20)                       # prueba vencida hace mucho: resumen, no tarea
    d["subs/b_tend"]["until"] = ts(0, horas=5)                   # termina hoy
    d["subs/b_paga"]["until"] = ts(5)                            # mensualidad que vence en 5 días: no es tarea de Hoy
    d["biz/b_nuevo"].update({"services": [{"id": "s1", "n": "Focos", "p": 15000, "d": 60, "ic": "✨"}], "onb": {"hor": True}, "logo": "data:image/png;base64,AAAA", "tagline": "Hola", "blurb": "Algo"})  # ya tiene lo básico
    d["biz/b_demo"]["created"] = ts(0)                            # demo nueva: no
    d["leads/l1"]["upd"] = T0 - 1 * DIA                           # escrito ayer: todavía no
    del d["payments/p4"]
    p = nuevo(b, d, espera=2000, antes="localStorage.setItem('cz_adm_links',JSON.stringify({'unas-bella':{s:'falta',at:%d}}))" % T0)
    T = p.evaluate(TAREAS)
    nombres = [t["t"] for t in T]
    b.ok("Borde: prueba vencida hace 20 días no es tarea pero se resume", "Barbería Corte Fino" not in nombres and "más de 2 semanas" in p.text_content("#hoyL"), nombres)
    b.ok("Borde: prueba que termina hoy dice 'hoy'", any(t["t"] == "Refri y Aire Pura" and "termina hoy" in t["p"] for t in T), T)
    b.ok("Borde: mensualidad que vence en 5 días no sale en Hoy", "Polarizados Sol" not in nombres)
    b.ok("Borde: recién registrado con lo básico no sale", "Pulidos La Esquina" not in nombres)
    b.ok("Borde: demo nueva no sale", "Demo Brillo Total" not in nombres)
    b.ok("Borde: prospecto escrito ayer todavía no", "Lavacar Aurora" not in nombres)
    b.ok("Borde: link de reservas que no abre (de Revisar links) sale con Arreglar", any(t["t"] == "Uñas Bella" and "Arreglar" in t["b"] for t in T), T)

    # Estado vacío
    d = {k: v for k, v in datos().items() if k.startswith(("biz/b_full", "subs/b_full", "pub/detailing", "adm/"))}
    p = nuevo(b, d, espera=2000)
    b.ok("Vacío: mensaje amable cuando no hay nada", p.locator("#hoyL .a-ok").count() == 1 and "Todo al día" in p.text_content("#hoyL") and "todo al día" in p.text_content("#hoySub"), p.text_content("#hoyL"))
    b.ok("Vacío: sin errores", not errores(p), errores(p)[:3])

    # U5: el corte de 14 días de "prueba vencida": 13 días sale como tarea, 15 días va al resumen
    for dias, sale in ((13, True), (15, False)):
        d = datos(); d["subs/b_tvenc"]["until"] = ts(-dias)
        p = nuevo(b, d, espera=1800)
        nombres = [t["t"] for t in p.evaluate(TAREAS)]
        b.ok("U5: prueba vencida hace %d días %s" % (dias, "sale en Hoy" if sale else "no sale (va al resumen)"),
             ("Barbería Corte Fino" in nombres) == sale and ("más de 2 semanas" in p.text_content("#hoyL")) != sale, nombres)
