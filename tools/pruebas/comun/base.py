"""Base común de las pruebas de Citaly.

Abre las páginas REALES del repo (app/, r/, w/, admin/) en un Chrome sin ventana, con un
Firebase falso en memoria (comun/firebase-falso.js). No toca internet ni datos reales.

Uso mínimo:
    from comun.base import Banco, ts, dia
    with Banco() as b:
        p = b.abrir("/r/?n=prueba", datos={...})
        b.ok("nombre de la prueba", condicion, "detalle opcional")
    # al salir imprime el resumen y termina con código 1 si algo falló
"""
import datetime, functools, http.server, json, os, sys, threading, time
from playwright.sync_api import sync_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FALSO = open(os.path.join(os.path.dirname(__file__), "firebase-falso.js"), encoding="utf-8").read()
# TEMA=laca (o perla): abre todas las páginas con ese tema premium de la app ya elegido, para correr
# las pruebas de siempre con el tema puesto (python3 tools/pruebas/correr.py app, con TEMA=laca delante).
TEMA = os.environ.get("TEMA")
CHROME = os.environ.get("CHROME") or next((c for c in ("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser") if os.path.exists(c)), None)


def ts(dias=0, horas=0):
    """Marca de tiempo de Firestore relativa a ahora (para subs.until, etc.)."""
    return {"__ts": int((time.time() + dias * 86400 + horas * 3600) * 1000)}


def dia(mas=0, saltar_domingo=True):
    """Fecha AAAA-MM-DD de hoy + `mas` días (brinca domingo si se pide)."""
    d = datetime.date.today() + datetime.timedelta(days=mas)
    while saltar_domingo and d.weekday() == 6:
        d += datetime.timedelta(days=1)
    return d.isoformat()


class _Silencio(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


class Banco:
    def __init__(self, raiz=RAIZ, nombre=None):
        self.raiz, self.res, self.nombre = raiz, [], nombre or os.path.basename(sys.argv[0])

    def __enter__(self):
        self.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Silencio, directory=self.raiz))
        self.puerto = self.srv.server_address[1]
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.pw = sync_playwright().start()
        self.nav = self.pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        return self

    def __exit__(self, et, ev, tb):
        try:
            self.nav.close(); self.pw.stop(); self.srv.shutdown()
        except Exception:
            pass
        if et is None:
            self.resumen()
        return False

    @property
    def base(self):
        return "http://127.0.0.1:%d" % self.puerto

    def abrir(self, ruta, datos=None, usuario=None, ancho=400, alto=850, espera=1200, antes="", negar=None, movil=True, lento=None, reducir=False):
        """Abre `ruta` (ej. "/app/") con `datos` en el Firestore falso y `usuario` con sesión (o None).
        `antes`: JS extra que corre antes que la página. Devuelve la página; p.errs junta los errores de JS.
        `lento`: {patrón: ms} para que ciertos archivos tarden en llegar. `reducir`: prefers-reduced-motion."""
        ctx = self.nav.new_context(viewport={"width": ancho, "height": alto}, has_touch=movil, locale="es-CR", timezone_id="America/Costa_Rica", reduced_motion="reduce" if reducir else "no-preference")
        p = ctx.new_page()
        p.errs, p.consola = [], []
        p.on("pageerror", lambda e: p.errs.append(str(e)))
        p.on("console", lambda m: p.consola.append(m.text) if m.type == "error" else None)
        if TEMA:
            antes = "try{localStorage.setItem('citaly_ap',JSON.stringify({pack:%s}))}catch(e){};" % json.dumps(TEMA) + antes
        js = "window.__DATA=%s;window.__USER=%s;window.__DENY=%s;%s\n%s" % (
            json.dumps(datos or {}), json.dumps(usuario), json.dumps(negar or []), antes, FALSO)
        local = "127.0.0.1:%d" % self.puerto
        p.route("**/*", lambda r: r.continue_() if local in r.request.url else r.abort())
        p.route("**/firebase-app-compat.js", lambda r: r.fulfill(body=js, content_type="text/javascript"))
        for x in ("auth", "firestore", "messaging", "storage", "functions"):
            p.route("**/firebase-%s-compat.js" % x, lambda r: r.fulfill(body="", content_type="text/javascript"))
        for pat, ms in (lento or {}).items():
            p.route(pat, (lambda espera_ms: lambda r: (time.sleep(espera_ms / 1000.0), r.continue_()))(ms))
        p.goto(self.base + ruta)
        p.wait_for_timeout(espera)
        return p

    def escrituras(self, p, prefijo=""):
        """Lo que la página escribió: lista de [op, ruta, datos], filtrada por prefijo de ruta."""
        return [w for w in p.evaluate("window.__WRITES") if w[1].startswith(prefijo)]

    def ok(self, nombre, cond, detalle=""):
        self.res.append((nombre, bool(cond), str(detalle)))
        print(("✅ " if cond else "❌ ") + nombre + ((" — " + str(detalle)[:300]) if detalle and not cond else ""))
        return bool(cond)

    def resumen(self):
        bien = sum(1 for _, o, _ in self.res if o)
        print("\n%s: %d de %d bien" % (self.nombre, bien, len(self.res)))
        if bien != len(self.res):
            sys.exit(1)


def negocio(**extra):
    """Negocio de prueba completo: devuelve (datos, usuario). Sirve para app/, r/ y w/."""
    horas = [{"on": False, "a": "08:00", "b": "17:00"}] + [{"on": True, "a": "08:00", "b": "17:00"} for _ in range(6)]
    biz = {"name": "Taller Prueba", "slug": "prueba", "type": "detailing", "wa": "88888888", "addr": "San José centro", "email": "dueno@prueba.test",
           "color": "#2f8cff", "logo": "", "hours": horas, "slot": 30, "lead": 0, "ahead": 14, "home": False, "zones": [], "mods": {}, "veh": [],
           "services": [{"id": "s1", "n": "Lavado básico", "p": 8000, "d": 60, "ic": "✨"}, {"id": "s2", "n": "Pulido de focos", "p": 15000, "d": 90, "ic": "✨"}],
           "onb": {"hor": True, "svc": True, "look": True}, "web": {}}
    biz.update(extra)
    pub = dict(biz, biz="U1", tier="nitro")
    datos = {"biz/U1": biz, "pub/prueba": pub, "subs/U1": {"status": "trial", "until": ts(dias=5)}}
    return datos, {"uid": "U1", "email": "dueno@prueba.test"}
