"""Admin nuevo · Negocios: filtros y contadores con la misma lógica que el clásico, buscador con errores de tipeo
(nombre, link, correo, teléfono, equipo, etiquetas y notas), orden, barrita de "qué tan lista está" y preferencias."""
from ayuda import Banco, nuevo, clasico, errores

FILTROS = ["all", "trial", "active", "late", "owe", "suspended", "demo"]
NOMBRES_N = "()=>[...document.querySelectorAll('#list .a-row .m b')].map(x=>x.textContent)"
NOMBRES_V = "()=>[...document.querySelectorAll('#list .biz .m b')].map(x=>x.textContent)"

with Banco() as b:
    pv = clasico(b, espera=2000)
    p = nuevo(b, hash_="negocios", espera=2000)
    for f in FILTROS:
        pv.evaluate("f=>document.querySelector('#f [data-f=\"'+f+'\"]').click()", f)
        p.evaluate("f=>document.querySelector('#f [data-f=\"'+f+'\"]').click()", f)
        pv.wait_for_timeout(150); p.wait_for_timeout(150)
        v, n = sorted(pv.evaluate(NOMBRES_V)), sorted(p.evaluate(NOMBRES_N))
        cnt = p.evaluate("f=>+document.querySelector('#f [data-f=\"'+f+'\"] i').textContent", f)
        b.ok("Filtro %s: mismos negocios que el clásico (%d)" % (f, len(v)), v == n and len(v) > 0, (v, n))
        b.ok("Filtro %s: el contador coincide" % f, cnt == len(n), (cnt, len(n)))
        b.ok("Filtro %s: aria-pressed solo en el elegido" % f, p.evaluate("f=>[...document.querySelectorAll('#f button')].every(x=>(x.getAttribute('aria-pressed')==='true')===(x.dataset.f===f))", f))
    # Estados (píldora) iguales a los del clásico
    for f in ("all",):
        pv.evaluate("()=>document.querySelector('#f [data-f=\"all\"]').click()"); p.evaluate("()=>document.querySelector('#f [data-f=\"all\"]').click()")
    pills_v = pv.evaluate("()=>Object.fromEntries([...document.querySelectorAll('#list .biz')].map(c=>[c.querySelector('.m b').textContent,c.querySelector('.hd > .pill').textContent]))")
    pills_n = p.evaluate("()=>Object.fromEntries([...document.querySelectorAll('#list .a-row')].map(c=>[c.querySelector('.m b').textContent,c.querySelector('.a-pill').textContent]))")
    b.ok("Píldoras: mismo estado que el clásico en cada negocio", pills_v == pills_n, (pills_v, pills_n))
    # Buscador: mismos resultados que el clásico, con errores de tipeo
    for q in ("lavacr", "brisas", "88884444", "vip", "ayudante@", "precios por tamano", "corte fino", "polarisado"):
        pv.fill("#q", q); p.fill("#q", q); pv.wait_for_timeout(150); p.wait_for_timeout(150)
        v, n = sorted(pv.evaluate(NOMBRES_V)), sorted(p.evaluate(NOMBRES_N))
        b.ok("Buscar '%s': mismos resultados que el clásico (%d)" % (q, len(n)), v == n and len(n) > 0, (v, n))
    pv.fill("#q", ""); p.fill("#q", "zzzzqqq"); p.wait_for_timeout(150)
    b.ok("Buscar sin resultados: mensaje claro", "Nada con ese filtro" in p.text_content("#list"))
    p.fill("#q", ""); p.wait_for_timeout(100)
    # Orden
    p.select_option("#srt", "name"); p.wait_for_timeout(150)
    nm = p.evaluate(NOMBRES_N)
    b.ok("Orden por nombre", nm == sorted(nm, key=lambda s: s.lower().replace("ñ", "n~")), nm)
    p.select_option("#srt", "due"); p.wait_for_timeout(150)
    nm = p.evaluate(NOMBRES_N)
    b.ok("Orden 'vence primero': vencidos y próximos arriba", nm[:4] == ["Lavacar Express Norte", "Barbería Corte Fino", "Refri y Aire Pura", "Pulidos La Esquina"], nm[:5])
    p.select_option("#srt", "new"); p.wait_for_timeout(150)
    nm = p.evaluate(NOMBRES_N)
    b.ok("Orden 'más nuevos' (igual que el clásico)", nm == pv.evaluate(NOMBRES_V), (nm, pv.evaluate(NOMBRES_V)))
    # Barrita de avance
    BAR = "n=>{const r=[...document.querySelectorAll('#list .a-row')].find(x=>x.querySelector('.m b').textContent===n);return [...r.querySelectorAll('.a-pg i')].map(i=>i.className||'-').join(',')}"
    b.ok("Barrita: completo sin abrir = 5 listos + fotos sin saber", p.evaluate(BAR, "Detailing Las Brisas") == "k,k,k,k,u,k", p.evaluate(BAR, "Detailing Las Brisas"))
    b.ok("Barrita: recién registrado casi vacío = solo datos", p.evaluate(BAR, "Pulidos La Esquina") == "k,-,-,-,u,-", p.evaluate(BAR, "Pulidos La Esquina"))
    b.ok("Barrita: viejo sin logo ni descripción", p.evaluate(BAR, "Lavacar El Roble") == "k,k,k,-,u,-", p.evaluate(BAR, "Lavacar El Roble"))
    b.ok("Barrita: tiene texto para lectores de pantalla", "de 6 pasos" in (p.get_attribute("#list .a-pg", "aria-label") or ""))
    p.evaluate("()=>{location.hash='#negocio/b_full'}"); p.wait_for_timeout(900)
    p.evaluate("()=>{location.hash='#negocios'}"); p.wait_for_timeout(400)
    b.ok("Barrita: al abrir la ficha ya sabe las fotos (6 de 6)", p.evaluate(BAR, "Detailing Las Brisas") == "k,k,k,k,k,k", p.evaluate(BAR, "Detailing Las Brisas"))
    # Preferencias guardadas
    p.evaluate("()=>document.querySelector('#f [data-f=\"trial\"]').click()"); p.select_option("#srt", "name"); p.wait_for_timeout(100)
    p.reload(); p.wait_for_timeout(1800)
    b.ok("Preferencias: filtro y orden se recuerdan al recargar", p.evaluate("()=>[F,document.getElementById('srt').value]") == ["trial", "name"])
    b.ok("Preferencias: fotos conocidas se recuerdan", p.evaluate("()=>JSON.parse(localStorage.getItem('cz_adm_fotos'))['b_full']") == 2)
    # Nuevo negocio
    p.click("#newB"); p.wait_for_timeout(500)
    b.ok("+ Nuevo negocio abre la ficha en blanco", p.evaluate("()=>location.hash==='#negocio/nuevo'&&E&&E.id===null&&!!document.getElementById('eN')&&!!document.getElementById('eDemo')"))
    b.ok("Negocios: sin errores", not errores(p), errores(p)[:3])
    # Lista mientras carga: esqueletos
    p = nuevo(b, hash_="negocios", espera=200, antes="window.__AUTH_DELAY=1500;")
    b.ok("Mientras carga: esqueletos, no 'no hay negocios'", p.locator("#list .a-skel").count() >= 3 and "Todavía no hay" not in p.text_content("#list"))
    p.wait_for_timeout(2200)
    b.ok("Después de cargar: la lista", p.locator("#list .a-row").count() == 10)
