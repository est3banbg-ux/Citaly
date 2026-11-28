"""Admin nuevo · todas las vistas: a 360 px nada se sale de la pantalla; en compu (1280 px) menú lateral y
Negocios en dos paneles; sin errores en consola en ninguna vista; áreas de toque, foco visible y movimiento
reducido; y carga lenta de los archivos (Firebase responde antes de que lleguen ui.js / extra.js)."""
from ayuda import Banco, nuevo, clasico, errores

VISTAS = ["hoy", "negocios", "negocio/b_full", "negocio/b_viejo", "negocio/nuevo", "plata/cobros", "plata/vence", "plata/metricas", "plata/reporte",
          "prospectos", "mas", "mas/respuestas", "mas/enlaces", "mas/demos"]
DESBORDE = """()=>{const vw=document.documentElement.clientWidth,bad=[];
  document.querySelectorAll('body *').forEach(e=>{if(e.closest('.a-skip,[hidden]'))return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    if(r.right>vw+1||r.left<-1){let a=e.parentElement,ok=false;while(a&&a!==document.body){const s=getComputedStyle(a);if(/(auto|scroll|hidden)/.test(s.overflowX)){ok=true;break}a=a.parentElement}
      if(!ok)bad.push(e.tagName+'.'+String(e.className).slice(0,30)+'#'+e.id+' '+Math.round(r.left)+'→'+Math.round(r.right))}});
  return {sw:document.documentElement.scrollWidth,vw:vw,bad:bad.slice(0,6)}}"""
ABRIR_TODO = "()=>{document.querySelectorAll('#ed details').forEach(x=>x.open=true)}"
TOQUE = """()=>[...document.querySelectorAll('#nav a, .a-task a.t, .a-b, .a-chips button, .a-tabs a, #ed .a-sec>summary, .a-q a, .a-q button, .a-row, .a-menu a, .a-menu button, .a-fab, .a-pp')]
  .filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return [e.className||e.tagName,Math.round(r.width),Math.round(r.height)]}).filter(x=>x[1]<44&&x[2]<44||x[2]<40)"""

with Banco() as b:
    for v in VISTAS:
        p = nuevo(b, hash_=v, ancho=360, alto=740, espera=1900)
        if v.startswith("negocio/"):
            p.evaluate(ABRIR_TODO); p.wait_for_timeout(200)
        if v == "mas/enlaces":
            p.evaluate("()=>document.querySelector('[data-l=\"chk\"]').click()"); p.wait_for_timeout(500)
        r = p.evaluate(DESBORDE)
        b.ok("[360 px · %s] nada se sale de la pantalla" % v, r["sw"] <= r["vw"] and not r["bad"], r)
        t = p.evaluate(TOQUE)
        b.ok("[360 px · %s] botones de al menos 44 px" % v, not t, t[:5])
        b.ok("[360 px · %s] sin errores en consola" % v, not errores(p), errores(p)[:3])
        nav = p.evaluate("()=>{const a=document.querySelector('#nav a[aria-current=\"page\"]');return a&&a.dataset.v}")
        b.ok("[360 px · %s] la barra de abajo marca la sección" % v, nav == ("negocios" if v.startswith("negocio") else v.split("/")[0]), nav)
        p.context.close()
    # Enlaces: Revisar links marca el que no abre
    p = nuevo(b, hash_="mas/enlaces", espera=1800)
    p.click('[data-l="chk"]'); p.wait_for_timeout(800)
    txt = p.text_content("#masEnl")
    b.ok("Enlaces: Revisar links marca 'No abre' en el negocio sin página", "No abre" in txt and "1 con problema" in txt, txt[:400])
    b.ok("Enlaces: muestra el link …/r/?n=<link>&go=1", "citalyapp.com/r/?n=detailing-las-brisas&go=1" in txt)
    p.click('[data-l="cp"][data-s="polarizados-sol"]'); p.wait_for_timeout(150)
    b.ok("Enlaces: copiar da el link completo", p.evaluate("()=>window.__COPIADO.slice(-1)[0]") == "https://citalyapp.com/r/?n=polarizados-sol&go=1")
    b.ok("Enlaces: Abrir va a ../../r/", p.evaluate("()=>document.querySelector('#masEnl a[href*=\"r/?n=polarizados-sol\"]').href").endswith("/r/?n=polarizados-sol&go=1"))
    # Compu
    for v in ("hoy", "negocios", "negocio/b_full", "plata/cobros", "prospectos", "mas"):
        p = nuevo(b, hash_=v, ancho=1280, alto=800, espera=1900, movil=False)
        g = p.evaluate("""()=>{const n=document.getElementById('nav').getBoundingClientRect(),m=document.getElementById('contenido').getBoundingClientRect(),l=document.querySelector('.a-listpane').getBoundingClientRect(),f=document.getElementById('fichaPane').getBoundingClientRect();
          return {navW:Math.round(n.width),navH:Math.round(n.height),mainL:Math.round(m.left),lR:Math.round(l.right),fL:Math.round(f.left),lW:Math.round(l.width),fW:Math.round(f.width),sw:document.documentElement.scrollWidth}}""")
        b.ok("[1280 · %s] menú lateral a la izquierda" % v, g["navW"] >= 200 and g["navH"] >= 700 and g["mainL"] >= g["navW"], g)
        if v.startswith("negocio"):
            b.ok("[1280 · %s] Negocios en dos paneles (lista | ficha)" % v, g["lW"] > 300 and g["fW"] > 500 and g["lR"] <= g["fL"], g)
        b.ok("[1280 · %s] sin desborde" % v, g["sw"] <= 1280, g)
        b.ok("[1280 · %s] sin errores" % v, not errores(p), errores(p)[:3])
    # atajo "/" para buscar
    p.keyboard.press("/"); p.wait_for_timeout(300)
    b.ok("Compu: '/' lleva a Negocios y enfoca el buscador", p.evaluate("()=>location.hash==='#negocios'&&document.activeElement.id==='q'"))
    # foco visible con teclado
    p.keyboard.press("Tab"); p.wait_for_timeout(100)
    b.ok("Foco visible con teclado", p.evaluate("()=>{const e=document.activeElement,s=getComputedStyle(e);return e!==document.body&&(s.outlineStyle!=='none'||s.boxShadow!=='none')}"))
    # movimiento reducido
    p = nuevo(b, hash_="negocios", espera=200, antes="window.__AUTH_DELAY=1500;", reducir=True)
    b.ok("Movimiento reducido: los esqueletos no se animan", p.evaluate("()=>{const s=document.querySelector('.a-skel');return !!s&&getComputedStyle(s).animationName==='none'}"))
    # carga lenta: Firebase responde antes de que lleguen los archivos
    for lento in ({"**/ui.js*": 600}, {"**/extra.js*": 600}):
        p = nuevo(b, hash_="hoy", espera=3500, lento=lento)
        st = p.evaluate("()=>({leads:LEADS.length,adm:Object.keys(ADM).length,tareas:document.querySelectorAll('#hoyL .a-task').length})")
        b.ok("Carga lenta de %s: igual carga notas, prospectos y tareas" % list(lento)[0], st["leads"] == 3 and st["adm"] == 2 and st["tareas"] == 6, st)
        b.ok("Carga lenta de %s: sin errores" % list(lento)[0], not errores(p), errores(p)[:3])
    # el clásico sigue abriendo igual (no se tocó)
    p = clasico(b, espera=1800)
    b.ok("Admin clásico: abre y lista los negocios", p.locator("#list .biz").count() == 10 and not errores(p), errores(p)[:3])

    # 360 px con TODAS las secciones de la ficha abiertas (y filas de zonas, preguntas, reseñas y vehículos)
    FICHA360 = """()=>{document.querySelectorAll('#ed details').forEach(x=>x.open=true);['eZa','wFqA','wRvA','eVhA'].forEach(i=>{const b=document.getElementById(i);b&&b.click()});
      const vw=document.documentElement.clientWidth,bad=[];
      document.querySelectorAll('#ed *').forEach(e=>{if(e.closest('[hidden]'))return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;if(r.right>vw+1||r.left<-1)bad.push(e.tagName+'.'+String(e.className).slice(0,20)+'#'+e.id+' '+Math.round(r.right))});
      const T=e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]};
      const small=[...document.querySelectorAll('#ed button,#ed summary,#ed a,#ed label.toggle,#ed label.small,#ed select')].filter(e=>e.offsetParent!==null).map(e=>[e.tagName+'.'+String(e.className).slice(0,20)+'#'+e.id].concat(T(e))).filter(x=>x[1]<44||x[2]<44);
      const times=[...document.querySelectorAll('.hrow input')].map(i=>i.clientWidth);
      return {bad:bad.slice(0,6),small:small.slice(0,8),tmin:Math.min.apply(null,times)}}"""
    for h in ("negocio/b_full", "negocio/b_viejo", "negocio/nuevo"):
        p = nuevo(b, hash_=h, ancho=360, alto=740, espera=1900)
        r = p.evaluate(FICHA360); p.wait_for_timeout(200)
        b.ok("[360 · %s · todo abierto] nada se sale de la pantalla" % h, not r["bad"], r["bad"])
        b.ok("[360 · %s · todo abierto] botones, casillas y selectores de al menos 44 px" % h, not r["small"], r["small"])
        b.ok("[360 · %s · todo abierto] las horas caben completas (no '07:00 A')" % h, r["tmin"] >= 110, r["tmin"])
        b.ok("[360 · %s · todo abierto] sin errores" % h, not errores(p), errores(p)[:3])
        p.context.close()
