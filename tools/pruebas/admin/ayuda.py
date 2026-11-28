"""Ayudas para las pruebas del panel del admin (admin/ = clásico, admin/nuevo/ = nuevo).

- T0: hora fija (ms). La página corre con el reloj congelado en T0 (Date.now() y new Date() sin argumentos),
  así el clásico y el nuevo escriben exactamente lo mismo y "Hoy" sale igual en cada corrida.
- datos(): ~10 negocios inventados en estados distintos, pagos, prospectos y notas (nada real).
- ADMIN: usuario administrador (el correo se lee de cfg.js al correr: no queda escrito en el repo).
- abrir(b, ruta, ...): abre la página con el Firebase falso, el reloj fijo y prompt/confirm/open de mentira.
  window.__PQ = respuestas para prompt() (en orden); window.__CQ = respuestas para confirm() (por defecto true).
- norm(writes): pone nombres fijos a los ids automáticos (AUTO1, AUTO2…) para poder comparar.
"""
import base64, json, os, re, struct, sys, time, zlib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import Banco, RAIZ  # noqa: F401

CFG = open(os.path.join(RAIZ, "cfg.js"), encoding="utf-8").read()
ADMIN = {"uid": "ADM1", "email": re.search(r'admin:\s*"([^"]+)"', CFG).group(1), "displayName": "Esteban Prueba"}
OTRO = {"uid": "X9", "email": "alguien@ejemplo.test", "displayName": "Otra Persona"}
DIA = 86400000
# Mediodía de hoy en Costa Rica (UTC-6): así "hoy", "mañana" y "este mes" no cambian según la hora a la que se corra.
_cr = int(time.time()) - 6 * 3600
T0 = ((_cr // 86400) * 86400 + 12 * 3600 + 6 * 3600) * 1000


def ts(dias=0, horas=0):
    return {"__ts": T0 + int(dias * DIA) + horas * 3600000}


def png(r, g, b, n=8):
    raw = b"".join(b"\x00" + bytes([r, g, b]) * n for _ in range(n))
    def ch(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n" + ch(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 2, 0, 0, 0)) + ch(b"IDAT", zlib.compress(raw)) + ch(b"IEND", b"")
    return "data:image/png;base64," + base64.b64encode(data).decode()


LOGO1, LOGO2, FOTO1, FOTO2 = png(123, 92, 255), png(255, 138, 91), png(40, 40, 60, 16), png(200, 190, 230, 16)
H_REG = [{"on": d >= 1 and d <= 6, "a": "08:00", "b": "17:00"} for d in range(7)]          # horario con que nace un registro
H_PROPIO = [{"on": False, "a": "08:00", "b": "12:00"}] + [{"on": True, "a": "07:00", "b": "16:00"} for _ in range(5)] + [{"on": True, "a": "08:00", "b": "13:00"}]

RELOJ = """(function(){var F=%d,_D=Date;function D(a,b,c,d,e,f,g){var n=arguments.length,x=n===0?new _D(F):n===1?new _D(a):new _D(a,b,c===undefined?1:c,d||0,e||0,f||0,g||0);if(!(this instanceof D))return x.toString();return x}
D.prototype=_D.prototype;D.now=function(){return F};D.UTC=_D.UTC;D.parse=_D.parse;window.Date=D})();
window.__PQ=[];window.__PROMPTS=[];window.prompt=function(m,d){window.__PROMPTS.push(String(m));return window.__PQ.length?window.__PQ.shift():(d==null?"":String(d))};
window.__CQ=[];window.__CONFIRMS=[];window.confirm=function(m){window.__CONFIRMS.push(String(m));return window.__CQ.length?window.__CQ.shift():true};
window.__COPIADO=[];try{Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:function(t){window.__COPIADO.push(String(t));return Promise.resolve()}}})}catch(e){}
window.__PILAS=[];window.addEventListener("error",function(e){window.__PILAS.push(String(e.error&&e.error.stack||e.message).slice(0,600))});
window.__OPENED=[];window.open=function(u){window.__OPENED.push(String(u));return null};window.alert=function(){};
"""


def datos():
    """Negocios inventados en estados distintos. Devuelve el dict para window.__DATA."""
    d = {}
    def neg(i, biz, sub, pub=True, fotos=()):
        d["biz/" + i] = biz
        if sub is not None:
            d["subs/" + i] = sub
        if pub and biz.get("slug"):
            d["pub/" + biz["slug"]] = {"biz": i, "name": biz.get("name"), "services": biz.get("services", [])}
        for n, f in enumerate(fotos):
            d["pub/%s/fotos/f%d" % (biz["slug"], n + 1)] = f
    # 1. recién registrado solo, casi vacío (prueba)
    neg("b_nuevo", {"name": "Pulidos La Esquina", "slug": "pulidos-la-esquina", "type": "pulido", "wa": "88881111", "email": "esquina@ejemplo.test", "self": True,
                    "owner": "Mario Rojas", "created": ts(-1), "hours": H_REG, "services": [], "web": {}, "onb": {"cuenta": True}, "color": "#6c4cf5"},
        {"name": "Pulidos La Esquina", "email": "esquina@ejemplo.test", "plan": "trial", "status": "trial", "total": 0, "demo": False, "start": ts(-1), "until": ts(6)})
    # 2. completo, con precio por vehículo y campos que pone la app (hot, g, re, slot, lanes, cierre…)
    neg("b_full", {"name": "Detailing Las Brisas", "slug": "detailing-las-brisas", "type": "detailing", "wa": "88882222", "email": "brisas@ejemplo.test", "team": ["ayudante@ejemplo.test"],
                   "owner": "Ana Solís", "created": ts(-20), "logo": LOGO1, "color": "#0d7a85", "addr": "Heredia centro", "home": True,
                   "zones": [{"n": "Heredia", "fee": 0}, {"n": "Alajuela", "fee": 3000}], "hours": H_PROPIO, "mods": {"vehiculo": True, "insumos": False},
                   "veh": [{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 5000}],
                   "services": [{"id": "s1", "n": "Lavado premium", "p": 15000, "d": 90, "ic": "img:lavados", "vx": True, "vp": [{"n": "SUV", "p": 20000}], "hot": True, "g": "Lavados", "re": 30},
                                {"id": "s2", "n": "Pulido de focos", "p": 20000, "d": 120, "ic": "✨", "g": "Pulidos"}],
                   "tagline": "Tu carro como nuevo", "blurb": "Detailing a domicilio en Heredia.", "promo": "10% la primera vez",
                   "web": {"promoNote": "Solo en línea", "feats": "Domicilio\nProductos premium", "about": "Somos un equipo pequeño.", "svcNote": "", "homeNote": "Vamos a tu casa",
                           "faqs": [{"q": "¿Llegan a Alajuela?", "a": "Sí, con un extra."}], "reviews": [{"t": "Excelente", "n": "Laura M.", "src": "Google"}],
                           "videos": [{"u": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "c": "Antes y después"}], "ig": "instagram.com/brisas", "fb": "", "tt": "", "email": "", "greview": "",
                           "layout": "clasica", "estilo": "glass"},
                   "slot": 60, "fixed": ["08:00", "10:00"], "lanes": 2, "cierre": {"on": True}, "open": True, "ahead": 30, "lead": 4, "showPrices": False, "askHow": True,
                   "onb": {"cuenta": True, "hor": True, "svc": True, "look": True}},
        {"name": "Detailing Las Brisas", "email": "brisas@ejemplo.test", "plan": "mensual", "tier": "turbo", "status": "active", "price": 9900, "months": 2, "leftPromo": True, "total": 0, "demo": False, "until": ts(20)},
        fotos=[{"img": FOTO1, "cap": "Después", "i": 0}, {"img": FOTO2, "cap": "Antes", "i": 1, "ba": True}])
    # 3. viejo, del modelo de instalación, con campos que ya no se usan (se deben conservar)
    neg("b_viejo", {"name": "Lavacar El Roble", "slug": "lavacar-el-roble", "type": "lavacar", "wa": "50688883333", "email": "roble@ejemplo.test", "created": ts(-200),
                    "owner": "Carlos Mora", "goal": 50000, "notes": [{"t": "vieja"}], "ins": [{"n": "Jabón", "q": 3}], "legadoX": {"a": 1},
                    "services": [{"n": "Lavado sencillo", "p": 5000, "d": 45, "ic": "🚗", "desc": "Por fuera"}], "hours": H_PROPIO, "tagline": "Lavamos rápido", "color": "#b3392f"},
        {"name": "Lavacar El Roble", "email": "roble@ejemplo.test", "plan": "standard", "total": 150000, "demo": False, "status": "active", "until": ts(36500)})
    # 4. plan pago (Arranque con promo)
    neg("b_paga", {"name": "Polarizados Sol", "slug": "polarizados-sol", "type": "polarizado", "wa": "88884444", "email": "sol@ejemplo.test", "created": ts(-40), "logo": LOGO2,
                   "services": [{"id": "s1", "n": "Polarizado completo", "p": 60000, "d": 240, "ic": "🕶️"}], "hours": H_PROPIO, "tagline": "Frescura total", "blurb": "Polarizado con garantía."},
        {"name": "Polarizados Sol", "email": "sol@ejemplo.test", "plan": "mensual", "tier": "arranque", "status": "active", "price": 500, "months": 1, "total": 0, "demo": False, "until": ts(25)})
    # 5. pausado
    neg("b_pausa", {"name": "Taller Don Beto", "slug": "taller-don-beto", "type": "taller", "wa": "88885555", "email": "beto@ejemplo.test", "created": ts(-90),
                    "services": [{"id": "s1", "n": "Diagnóstico", "p": 10000, "d": 60, "ic": "🔧"}], "hours": H_PROPIO, "tagline": "Su taller de confianza"},
        {"name": "Taller Don Beto", "email": "beto@ejemplo.test", "plan": "mensual", "tier": "arranque", "status": "suspended", "price": 4900, "months": 4, "total": 0, "demo": False, "until": ts(-10)})
    # 6. demo
    neg("b_demo", {"name": "Demo Brillo Total", "slug": "demo-brillo-total", "type": "detailing", "wa": "88886666", "email": "", "created": ts(-5),
                   "services": [{"id": "s1", "n": "Lavado", "p": 8000, "d": 60, "ic": "✨"}], "hours": H_PROPIO, "tagline": "Brillo que se nota"},
        {"name": "Demo Brillo Total", "email": "", "plan": "standard", "total": 0, "demo": True, "status": "active", "until": ts(36500)})
    # 7. prueba vencida hace 2 días
    neg("b_tvenc", {"name": "Barbería Corte Fino", "slug": "barberia-corte-fino", "type": "barberia", "wa": "88887777", "email": "fino@ejemplo.test", "self": True, "created": ts(-9),
                    "services": [{"id": "s1", "n": "Corte", "p": 6000, "d": 30, "ic": "✂️"}], "hours": H_REG, "onb": {"hor": True}},
        {"name": "Barbería Corte Fino", "email": "fino@ejemplo.test", "plan": "trial", "status": "trial", "total": 0, "demo": False, "until": ts(-2)})
    # 8. mensualidad vencida hace 3 días
    neg("b_late", {"name": "Lavacar Express Norte", "slug": "lavacar-express-norte", "type": "lavacar", "wa": "88888888", "email": "norte@ejemplo.test", "created": ts(-70),
                   "services": [{"id": "s1", "n": "Lavado", "p": 7000, "d": 45, "ic": "🚗"}], "hours": H_PROPIO, "tagline": "Rápido y limpio", "logo": LOGO2},
        {"name": "Lavacar Express Norte", "email": "norte@ejemplo.test", "plan": "mensual", "tier": "turbo", "status": "active", "price": 9900, "months": 3, "leftPromo": True, "total": 0, "demo": False, "until": ts(-3)})
    # 9. prueba que termina en 2 días (registrado hace 5)
    neg("b_tend", {"name": "Refri y Aire Pura", "slug": "refri-y-aire-pura", "type": "refri", "wa": "88889999", "email": "pura@ejemplo.test", "self": True, "created": ts(-5),
                   "services": [{"id": "s1", "n": "Mantenimiento", "p": 25000, "d": 120, "ic": "❄️"}], "hours": H_REG, "onb": {"hor": True}, "tagline": "Aire limpio", "blurb": "Refrigeración a domicilio."},
        {"name": "Refri y Aire Pura", "email": "pura@ejemplo.test", "plan": "trial", "status": "trial", "total": 0, "demo": False, "until": ts(2)})
    # 10. sin documento de mensualidad (subs) y sin página pública
    neg("b_nosub", {"name": "Uñas Bella", "slug": "unas-bella", "type": "unas", "wa": "88880000", "email": "bella@ejemplo.test", "created": ts(-30),
                    "services": [{"id": "s1", "n": "Manicure", "p": 8000, "d": 60, "ic": "💅"}], "hours": H_PROPIO, "tagline": "Uñas bellas"}, None, pub=False)
    # pagos, prospectos, notas
    d["payments/p1"] = {"biz": "b_full", "name": "Detailing Las Brisas", "amt": 9900, "at": T0 - 10 * DIA, "type": "mes", "what": "Mensualidad"}
    d["payments/p2"] = {"biz": "b_paga", "name": "Polarizados Sol", "amt": 500, "at": T0 - 5 * DIA, "type": "mes", "what": "Mensualidad"}
    d["payments/p3"] = {"biz": "b_viejo", "name": "Lavacar El Roble", "amt": 75000, "at": T0 - 200 * DIA, "type": "setup", "plan": "standard"}
    d["payments/p4"] = {"name": "Cliente Tarjeta", "amt": 4900, "at": T0 - 1 * DIA, "type": "mes", "what": "Arranque", "src": "polar"}
    d["leads/l1"] = {"name": "Lavacar Aurora", "wa": "87771111", "note": "Lo vi en TikTok", "st": "escrito", "at": T0 - 6 * DIA, "upd": T0 - 5 * DIA}
    d["leads/l2"] = {"name": "Detailing Pura Vida", "wa": "87772222", "note": "", "st": "nuevo", "at": T0 - 1 * DIA, "upd": T0 - 1 * DIA}
    d["leads/l3"] = {"name": "Taller Los Pinos", "wa": "", "note": "", "st": "cerrado", "at": T0 - 20 * DIA, "upd": T0 - 15 * DIA}
    d["own/brisas@ejemplo.test"] = {"biz": "b_full", "rol": "dueño", "name": "Detailing Las Brisas"}
    d["own/ayudante@ejemplo.test"] = {"biz": "b_full", "rol": "equipo", "name": "Detailing Las Brisas"}
    d["adm/b_full"] = {"note": "Pidió precios por tamaño", "tags": ["vip", "detailing"]}
    d["adm/_cfg"] = {"goal": 100000}
    # citas de b_full (uso real)
    for n in range(6):
        d["biz/b_full/jobs/j%d" % n] = {"date": time.strftime("%Y-%m-%d", time.localtime((T0 - (n * 4 + 1) * DIA) / 1000)), "time": "09:00", "st": "Cancelada" if n == 5 else "Lista", "cli": "Cliente %d" % n}
    return d


def abrir(b, ruta, d=None, usuario=ADMIN, ancho=400, alto=850, espera=1800, antes="", movil=True, lento=None, reducir=False, t0=None, zona="America/Costa_Rica"):
    p = b.abrir(ruta, d if d is not None else datos(), usuario, ancho=ancho, alto=alto, espera=espera, antes=(RELOJ % (t0 or T0)) + antes + ";", movil=movil, lento=lento, reducir=reducir, zona=zona)
    return p


def pilas(p):
    """Errores de JS con su pila (para encontrar de dónde vienen)."""
    return p.evaluate("()=>window.__PILAS||[]")


def nuevo(b, d=None, hash_="", **kw):
    return abrir(b, "/admin/nuevo/" + (("#" + hash_) if hash_ else ""), d, **kw)


def clasico(b, d=None, antes="", **kw):
    # El clásico tiene una carrera al cargar (si Firebase responde antes de que llegue extra.js no carga notas ni
    # prospectos). Como en la vida real Firebase tarda un poco, aquí se le dan 150 ms para que la prueba sea estable.
    return abrir(b, "/admin/", d, antes="window.__AUTH_DELAY=150;" + antes, **kw)


def norm(ws):
    """Ids automáticos (auto3lz…) → AUTO1, AUTO2… en orden de aparición."""
    m = {}
    def f(s):
        return re.sub(r"auto\d+[0-9a-z]+", lambda x: m.setdefault(x.group(0), "AUTO%d" % (len(m) + 1)), s)
    return json.loads(f(json.dumps(ws, ensure_ascii=False, sort_keys=True)))


def errores(p):
    """Errores de JS y de consola, sin contar recursos bloqueados a propósito (fuentes de Google, etc.)."""
    return p.errs + [c for c in p.consola if "Failed to load resource" not in c and "net::ERR" not in c]
