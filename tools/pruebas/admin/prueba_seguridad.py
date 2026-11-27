"""Admin nuevo · seguridad: quien no es admin no ve nada ni carga datos; nombres, notas, etiquetas, prospectos,
pagos, links y fotos con HTML/<script> no ejecutan nada (todo escapado; imágenes con la misma validación que el
clásico, safeImg). Los íconos de servicio los dibuja C.ico de cfg.js (igual que el clásico y la app): se revisa que
no metan atributos ni comillas."""
from ayuda import Banco, nuevo, datos, errores, OTRO, png

X = '<script>window.__xss=1</script>"><img src=x onerror="window.__xss=2">\'"`😀'
J = "javascript:window.__xss=3"
VISTAS = ["hoy", "negocios", "negocio/b_x", "plata/cobros", "plata/vence", "plata/metricas", "plata/reporte", "prospectos", "mas/enlaces", "mas/demos", "mas/respuestas"]
REVISA = """()=>({xss:window.__xss||0,
  on:[...document.querySelectorAll('body *')].flatMap(e=>[...e.attributes].filter(a=>/^on/i.test(a.name)).map(a=>e.tagName+' '+a.name)),
  js:[...document.querySelectorAll('[href],[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(u=>/^\\s*javascript:/i.test(u||'')),
  imgs:[...document.querySelectorAll('#main img:not(.ico-img)')].map(i=>i.getAttribute('src')).filter(s=>s&&!/^(data:image\\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\\/=]+|https:\\/\\/[\\w.-]+\\/[^"'<>\\s]*|\\.\\.\\/\\.\\.\\/(demo|img)\\/[\\w\\/.-]+)$/.test(s)),
  ico:[...document.querySelectorAll('#main img.ico-img')].map(i=>i.getAttribute('src')).filter(s=>/["'<>]/.test(s||'')),
  scripts:[...document.querySelectorAll('#main script')].length})"""

with Banco() as b:
    # Quien no es admin
    p = nuevo(b, usuario=OTRO, espera=1800)
    st = p.evaluate("()=>({main:document.getElementById('main').hidden,login:document.getElementById('login').hidden,nav:document.getElementById('nav').hidden,err:document.getElementById('lErr').textContent,biz:Object.keys(BIZ).length,leads:typeof LEADS==='undefined'?0:LEADS.length,out:document.getElementById('out2').hidden})")
    b.ok("No admin: no ve el panel ni la navegación", st["main"] and st["nav"] and not st["login"], st)
    b.ok("No admin: le dice que esa cuenta no es la del admin", "no es la de administrador" in st["err"], st["err"])
    b.ok("No admin: no se cargan negocios ni prospectos", st["biz"] == 0 and st["leads"] == 0, st)
    b.ok("No admin: puede salir de esa cuenta", not st["out"])
    p.evaluate("()=>{location.hash='#negocio/b_full'}"); p.wait_for_timeout(500)
    b.ok("No admin: ni con el link directo a una ficha", p.evaluate("()=>document.getElementById('main').hidden&&E===null"))
    b.ok("No admin: sin errores", not errores(p), errores(p)[:3])
    p = nuevo(b, usuario=None, espera=1500)
    b.ok("Sin sesión: botón de entrar con Google y nada más", p.evaluate("()=>!document.getElementById('login').hidden&&document.getElementById('main').hidden&&document.getElementById('out2').hidden"))

    # Inyección de HTML
    d = datos()
    d["biz/b_x"] = {"name": X, "slug": 'x"><img src=x onerror=window.__xss=4>', "type": X, "wa": "88112233", "email": X, "team": [X], "owner": X, "addr": X, "created": d["biz/b_nuevo"]["created"],
                    "logo": J, "tagline": X, "blurb": X, "promo": X, "hours": d["biz/b_full"]["hours"], "home": True, "zones": [{"n": X, "fee": 1}],
                    "services": [{"id": "s1", "n": X, "p": 1000, "d": 60, "ic": X, "g": X}, {"id": "s2", "n": "Bien", "p": 1000, "d": 60, "ic": 'data:image/png;base64,AAAA" onerror="window.__xss=5'}],
                    "web": {"about": X, "feats": X, "faqs": [{"q": X, "a": X}], "reviews": [{"t": X, "n": X, "src": X}], "videos": [{"u": J, "c": X}], "ig": J, "fb": X, "pal": {"a": X, "n": X}}}
    d["subs/b_x"] = {"name": X, "plan": "trial", "status": "trial", "until": d["subs/b_tend"]["until"]}
    d["pub/x\"><img src=x onerror=window.__xss=4>/fotos/f1"] = {"img": J, "cap": X, "i": 0}
    d["pub/x\"><img src=x onerror=window.__xss=4>/fotos/f2"] = {"img": png(1, 2, 3) + '" onerror="window.__xss=6', "cap": X, "i": 1}
    d["biz/b_full"]["logo"] = "https://evil.example/x.jpg\" onerror=\"window.__xss=7"
    d["adm/b_x"] = {"note": X, "tags": [X, "ok"]}
    d["leads/lx"] = {"name": X, "wa": X, "note": X, "st": "escrito", "at": 1, "upd": 1}
    d["payments/px"] = {"name": X, "amt": 100, "at": d["payments/p4"]["at"], "src": "polar", "what": X}
    d["biz/b_demo"]["name"] = X
    for v in VISTAS:
        p = nuevo(b, d, hash_=v, espera=1800)
        if v.startswith("negocio/"):
            p.evaluate("()=>{document.querySelectorAll('#ed details').forEach(x=>x.open=true)}")
            p.evaluate("()=>document.querySelector('#ed [data-u=\"msg\"]').click()"); p.wait_for_timeout(200)
        if v == "hoy":
            p.evaluate("()=>{const t=[...document.querySelectorAll('#hoyL .a-task')];t.forEach(x=>{})}")
        p.mouse.move(100, 300); p.wait_for_timeout(300)
        r = p.evaluate(REVISA)
        b.ok("[%s] nada se ejecutó" % v, r["xss"] == 0, r)
        b.ok("[%s] sin atributos on…" % v, not r["on"], r["on"][:5])
        b.ok("[%s] sin links javascript:" % v, not r["js"], r["js"][:5])
        b.ok("[%s] imágenes solo con direcciones válidas" % v, not r["imgs"], r["imgs"][:3])
        b.ok("[%s] íconos de servicio sin comillas ni etiquetas" % v, not r["ico"], r["ico"][:3])
        b.ok("[%s] sin errores" % v, not errores(p), errores(p)[:3])
    p = nuevo(b, d, hash_="negocios", espera=1800)
    p.fill("#q", "<script>"); p.wait_for_timeout(200)
    b.ok("Buscar texto con <script>: se muestra escapado", p.evaluate("()=>window.__xss||0") == 0 and "<script>" in p.text_content("#list"), p.text_content("#list")[:200])
