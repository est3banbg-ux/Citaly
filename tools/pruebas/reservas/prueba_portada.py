"""Portada de la página de reservas: estado «Abierto / Cerrado» que no se contradice con «Ya cerramos por hoy», logo con aire
cuando no hay foto de portada, titular con el mismo resaltado de la web sin dejar pasar HTML, promo que lleva a reservar,
y textos de acento que se leen bien aunque el color del negocio sea muy claro o muy oscuro."""
import datetime, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import *
from comun.base import Banco

HOY = BASE.date()
A_LAS = lambda h, m=0: reloj(datetime.datetime(HOY.year, HOY.month, HOY.day, h, m))
EST = """()=>{var g=function(i){return document.getElementById(i)},c=document.querySelector('.cls');
 return {st:g('st').hidden?null:g('stT').textContent,on:g('st').classList.contains('on'),cls:c?c.textContent:null}}"""
# contraste (WCAG) entre el color de un elemento y el fondo de la página, con los colores ya resueltos por el navegador
CONTRASTE = """(sel)=>{var c=document.createElement('canvas');c.width=c.height=1;var x=c.getContext('2d',{willReadFrequently:true});
 function rgb(v){x.clearRect(0,0,1,1);x.fillStyle='#000';x.fillStyle=v;x.fillRect(0,0,1,1);var d=x.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]]}
 function L(a){a=a.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
 var e=document.querySelector(sel),a=L(rgb(getComputedStyle(e).color)),b=L(rgb(getComputedStyle(document.body).backgroundColor));
 return Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100}"""

with Banco() as b:
    # ----- estado del negocio -----
    d, _ = negocio_cr(web={"layout": "clara"})
    p = b.abrir("/r/?n=prueba", d, antes=A_LAS(9)); e = p.evaluate(EST)
    b.ok("9 am, abre 8 a 5: dice «Abierto · hoy hasta las 5 pm» y no «Ya cerramos»", e["st"] == "Abierto · hoy hasta las 5 pm" and e["on"] and e["cls"] is None, e)
    b.ok("9 am: sin errores", not p.errs, p.errs[:3]); p.context.close()
    p = b.abrir("/r/?n=prueba", d, antes=A_LAS(7)); e = p.evaluate(EST)
    b.ok("7 am: «Cerrado · abre hoy 8 am»", e["st"] == "Cerrado · abre hoy 8 am" and not e["on"], e); p.context.close()
    p = b.abrir("/r/?n=prueba", d, antes=A_LAS(19)); e = p.evaluate(EST)
    b.ok("7 pm (ya cerró): un solo aviso, «Ya cerramos por hoy · agenda para mañana»", e["st"] is None and e["cls"] and "agenda para mañana" in e["cls"], e); p.context.close()
    d2, _ = negocio_cr(web={"layout": "clara"}, lead=2)
    p = b.abrir("/r/?n=prueba", d2, antes=A_LAS(16)); e = p.evaluate(EST)
    b.ok("4 pm con 2 h de anticipación (ya no queda hora hoy): sale «Ya cerramos por hoy» y NO «Abierto»", e["cls"] and "Ya cerramos por hoy" in e["cls"] and e["st"] is None, e); p.context.close()
    d3, _ = negocio_cr(web={"layout": "clara"}, cierre={dia(0): 13})
    d3["pub/prueba"]["cierre"] = {dia(0): 13}
    p = b.abrir("/r/?n=prueba", d3, antes=A_LAS(9)); e = p.evaluate(EST)
    b.ok("Hoy se cierra temprano (1 pm): «Abierto · hoy hasta las 1 pm»", e["st"] == "Abierto · hoy hasta las 1 pm", e); p.context.close()
    d4, _ = negocio_cr(web={"layout": "clara"}, hours=[])
    p = b.abrir("/r/?n=prueba", d4, antes=A_LAS(9)); e = p.evaluate(EST)
    b.ok("Sin horario guardado: no muestra estado y no se cae", e["st"] is None and not p.errs, (e, p.errs[:2])); p.context.close()
    d5, _ = negocio_cr(web={"layout": "clara"}, sub={"status": "suspended", "until": ts_rel(BASE, 5)}, promo="2x1 en lavado")
    p = b.abrir("/r/?n=prueba", d5, antes=A_LAS(9)); e = p.evaluate(EST)
    pr = p.evaluate("()=>{var m=document.getElementById('pm');return [m.hidden,m.classList.contains('fijo'),m.getAttribute('aria-disabled')]}")
    p.evaluate("()=>document.getElementById('pm').click()"); p.wait_for_timeout(200)
    b.ok("Reservas pausadas: sin estado «Abierto» y la promo se ve pero no abre la reserva", e["st"] is None and pr == [False, True, "true"] and not p.locator("#flow").is_visible(), (e, pr)); p.context.close()

    # ----- logo y portada -----
    d, _ = negocio_cr(web={"layout": "clara", "cover": "none"})
    p = b.abrir("/r/?n=prueba", d, antes=A_LAS(9))
    y = p.evaluate("()=>document.getElementById('lg').getBoundingClientRect().top")
    b.ok("Sin foto de portada: el logo no queda pegado al borde de arriba", y >= 18 and not p.locator("#cov").is_visible(), y); p.context.close()

    # ----- titular, promo y XSS -----
    feo = '<img src=x onerror="window.__XSS=1"> Brillo <b>total</b> garantizado'
    for lay, sel in (("clara", "#tg em"), ("pro", "#tg .hl"), ("clasica", "#tg .hl")):
        d, _ = negocio_cr(web={"layout": lay}, tagline="Carros como nuevos sin salir de casa", promo="2x1 en lavado")
        p = b.abrir("/r/?n=prueba", d, antes=A_LAS(9))
        b.ok("%s: el titular resalta el final («de casa») como en la web" % lay, txt(p, sel).lower() == "de casa" and "carros como nuevos" in txt(p, "#tg").lower(), txt(p, "#tg"))
        p.click("#pm"); p.wait_for_timeout(400)
        b.ok("%s: tocar la promo lleva al primer paso de la reserva" % lay, p.locator("#flow").is_visible() and "Servicios" in txt(p, "#pt"), txt(p, "#pt"))
        b.ok("%s: sin errores" % lay, not p.errs, p.errs[:3]); p.context.close()
        d, _ = negocio_cr(web={"layout": lay}, tagline=feo, name="Taller <i>X</i>", promo=feo, addr=feo)
        p = b.abrir("/r/?n=prueba", d, antes=A_LAS(9))
        r = p.evaluate("()=>[!!window.__XSS,document.querySelectorAll('#land img:not([alt]),#land #tg img,#land #tg b:not(:empty),#land .perks img,#land #toWeb i').length,document.getElementById('tg').textContent.indexOf('<img')>=0]")
        b.ok("%s: HTML en el nombre, titular, promo o dirección sale como texto" % lay, r == [False, 0, True], r); p.context.close()

    # ----- textos de acento legibles (paso «Servicios»: etiqueta del paso y «Agregar otro carro») -----
    CASOS = [("Clara amarilla", "clara", "#f5c518", "", ""), ("Clara casi blanca", "clara", "#f4f4f0", "", ""), ("Clara amarilla en oscuro", "clara", "#f5c518", "", "dark"),
             ("Clara casi negra en oscuro", "clara", "#0b0b0b", "", "dark"), ("Pro clara (fresco) amarilla", "pro", "#f5c518", "fresco", ""),
             ("Pro clara (elegante) verde claro", "pro", "#22c55e", "elegante", ""), ("Pro clara naranja", "pro", "#ff8a00", "atrevido", ""),
             ("Pro oscura casi negra", "pro", "#0b0b0b", "", ""), ("Pro oscura azul marino", "pro", "#0a1f5c", "", ""), ("Pro oscura amarilla", "pro", "#f5c518", "", "")]
    for nombre, lay, color, estilo, modo in CASOS:
        d, _ = negocio_cr(web={"layout": lay, "estilo": estilo}, color=color)
        p = b.abrir("/r/?n=prueba&go=1", d, antes=A_LAS(9) + (";try{localStorage.setItem('citaly_mode','%s')}catch(e){}" % modo if modo else ""), espera=900)
        c1, c2 = p.evaluate(CONTRASTE, "#pt"), p.evaluate(CONTRASTE, "#s-svc h2")
        b.ok("%s: «Paso 1 de 3» se lee (contraste %.1f, mínimo 4.5)" % (nombre, c1), c1 >= 4.5, c1)
        b.ok("%s: el título del paso se lee (contraste %.1f)" % (nombre, c2), c2 >= 7, c2)
        p.click('#svcs .svc[data-i="0"]'); p.wait_for_timeout(350)
        c3 = p.evaluate("""()=>{var c=document.createElement('canvas');c.width=c.height=1;var x=c.getContext('2d',{willReadFrequently:true});
          function rgb(v){x.clearRect(0,0,1,1);x.fillStyle='#000';x.fillStyle=v;x.fillRect(0,0,1,1);var d=x.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]]}
          function L(a){a=a.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
          var s=getComputedStyle(document.getElementById('nx')),a=L(rgb(s.color)),b=L(rgb(s.backgroundColor));return Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100}""")
        b.ok("%s: el botón «Siguiente» se lee (contraste %.1f, mínimo 3)" % (nombre, c3), c3 >= 3, c3)
        b.ok("%s: sin errores" % nombre, not p.errs, p.errs[:3]); p.context.close()
