"""Variantes de datos de un negocio para las pruebas de render de /w/ (no es una prueba)."""
from ayuda_web import PNG, VIDEOS, fotos

LARGO = "Lavacar y Detailing Profesional Hermanos Rodríguez Pérez de Alajuela Centro"
SVC40 = [{"id": "s%d" % i, "n": "Servicio número %d de la lista" % i, "p": 1000 * i, "d": 30 + i, "ic": "✨"} for i in range(40)]
WEB_LLENA = {
    "reviews": [{"n": "Ana Mora", "t": "Excelente trabajo, quedó como nuevo", "src": "Google"}, {"t": "Reseña sin nombre"}, {"n": "", "t": "Nombre vacío"}],
    "faqs": [{"q": "¿Cuánto dura?", "a": "Más o menos 1 hora.\nDepende del carro."}, {"q": "Sin respuesta"}],
    "why": [{"q": "Rápido", "a": "En 1 hora"}], "steps": [{"q": "Elige", "a": "tu servicio"}, {"q": "Reserva", "a": "tu hora"}],
    "about": "Somos un taller familiar.\nDesde 2010 en Alajuela.", "aboutTitle": "Quiénes somos", "feats": "Calidad garantizada\nProductos premium\n\n",
    "videos": VIDEOS, "ig": "instagram.com/taller", "fb": "https://facebook.com/taller", "tt": "tiktok.com/@taller",
    "greview": "https://g.page/r/abc/review", "email": "taller@correo.cr", "promoNote": "Solo este mes", "svcNote": "Precios con IVA",
}
ZONAS = [{"n": "Heredia"}, {"n": "Cartago", "fee": 3000}, {"n": "Grecia", "ask": True, "days": [1, 3]}, {"n": "San Ramón", "fee": 5000, "days": [6, 0]}]
VEH = dict(mods={"vehiculo": True}, veh=[{"n": "Sedán", "x": 0}, {"n": "SUV", "x": 5000}, {"n": "Pick-up", "x": 8000}],
           services=[{"id": "s1", "n": "Lavado", "p": 8000, "d": 60, "vx": True},
                     {"id": "s2", "n": "Pulido", "p": 15000, "d": 60, "vx": True, "vp": [{"n": "SUV", "p": 20000}]},
                     {"id": "s3", "n": "Focos", "p": 0, "d": 60}])

VARIANTES = [
    ("básico", {}),
    ("con logo", dict(logo=PNG)),
    ("3 fotos", dict(fotos=fotos(3))),
    ("fotos antes/después", dict(fotos=fotos(2, ba=True, cap="Antes y después"))),
    ("1 sola foto antes/después", dict(fotos=fotos(1, ba=True))),
    ("12 fotos", dict(fotos=fotos(12))),
    ("fotos normales + antes/después", dict(fotos=fotos(5) + [dict(f, ba=True, i=10 + k) for k, f in enumerate(fotos(2))])),
    ("todo lleno (reseñas, preguntas, promo, videos…)", dict(web=WEB_LLENA, promo="2x1 en lavado", fotos=fotos(4))),
    ("solo videos", dict(web={"videos": VIDEOS})),
    ("a domicilio con zonas", dict(home=True, zones=ZONAS)),
    ("a domicilio sin zonas", dict(home=True, zones=[])),
    ("precio 0 (Consultar)", dict(services=[{"id": "s1", "n": "Diagnóstico", "p": 0, "d": 60}])),
    ("precios por vehículo", VEH),
    ("sin mostrar precios", dict(showPrices=False)),
    ("grupos y destacados", dict(services=[{"id": "s1", "n": "Lavado", "p": 5000, "d": 30, "g": "Lavados", "hot": True, "desc": "Por fuera\nPor dentro"}, {"id": "s2", "n": "Focos", "p": 9000, "d": 45, "g": "Focos"}, {"id": "s3", "n": "Otro", "p": 100, "d": 30}])),
    ("nombres larguísimos", dict(name=LARGO, tagline=LARGO, blurb=LARGO * 3, addr=LARGO, promo=LARGO, services=[{"id": "s1", "n": LARGO, "p": 123456789, "d": 600}])),
    ("1 servicio", dict(services=[{"id": "s1", "n": "Lavado", "p": 5000, "d": 30}])),
    ("40 servicios", dict(services=SVC40)),
    ("sin web", dict(quitar=("web",))),
    ("sin mods", dict(quitar=("mods", "veh"))),
    ("sin hours", dict(quitar=("hours",))),
    ("sin wa", dict(quitar=("wa",))),
    ("sin addr", dict(quitar=("addr",))),
    ("services vacío", dict(services=[])),
    ("casi sin datos", dict(quitar=("web", "mods", "hours", "wa", "addr", "services", "veh", "zones", "color", "logo", "type", "name"))),
    ("todo cerrado", dict(hours=[{"on": False, "a": "08:00", "b": "17:00"}] * 7)),
    ("suscripción vencida", dict(sub="active", sub_dias=-2)),
    ("suscripción suspendida", dict(sub="suspended")),
    ("sin suscripción", dict(sub=None)),
    ("reservas en línea apagadas", dict(open=False)),
]
