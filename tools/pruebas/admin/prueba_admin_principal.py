"""El admin principal es el nuevo: /admin/ lleva a /admin/nuevo/ conservando el lugar (#negocio/…), y el de antes
sigue abriendo en /admin/clasico/ con sus rutas bien (cfg.js, estilos, links a la web del negocio)."""
from ayuda import Banco, nuevo, clasico, datos, errores

with Banco() as b:
    p = nuevo(b, espera=1500)
    base = p.url.split("/admin/")[0]
    p.goto(base + "/admin/#negocios"); p.wait_for_timeout(2500)
    b.ok("/admin/ lleva al admin nuevo", "/admin/nuevo/" in p.url, p.url)
    b.ok("/admin/ conserva el lugar (#negocios)", p.url.endswith("#negocios"), p.url)
    b.ok("El admin nuevo carga con negocios", p.evaluate("()=>typeof BIZ!=='undefined'&&Object.keys(BIZ).length>0"))
    b.ok("Admin nuevo: sin errores", not errores(p), errores(p)[:3])
    p.context.close()

    c = clasico(b, espera=2000)
    b.ok("El clásico abre en /admin/clasico/", "/admin/clasico/" in c.url, c.url)
    b.ok("Clásico: carga cfg.js y lista negocios", c.evaluate("()=>typeof CITALY!=='undefined'&&document.querySelectorAll('#list .biz').length>0"))
    hrefs = c.evaluate("()=>[...document.querySelectorAll('#list .biz a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.indexOf('..')===0).slice(0,6)")
    b.ok("Clásico: los links a la web y reservas salen dos niveles arriba", bool(hrefs) and all(h.startswith("../../") for h in hrefs), hrefs)
    css = c.evaluate("()=>[...document.styleSheets].some(s=>(s.href||'').endsWith('/style.css'))")
    b.ok("Clásico: carga su hoja de estilos", css)
    b.ok("Clásico: sin errores", not errores(c), errores(c)[:3])
