"""Registro de un negocio nuevo (/app/?nuevo=1): sin sesión (correo + contraseña) y con sesión de Google sin negocio.
Verifica lo que escribe en biz/{uid}, pub/{slug} y subs/{uid}, y el slug con tildes, espacios y símbolos."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from ayuda import Banco, VIGIA, html_mal

SLUG_OK = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")  # lo que exigen firestore.rules (pub create) y 404.html


def registrar(b, nombre, tipo="detailing", usuario=None, datos=None, correo="nuevo@prueba.test"):
    p = b.abrir("/app/?nuevo=1", datos or {}, usuario, espera=1500, antes=VIGIA)
    p.evaluate("""([n,t,c,u])=>{document.querySelector('#suT [data-k="'+t+'"]').click();
      document.getElementById('suN').value=n;document.getElementById('suP').value='Dueño de Prueba';
      document.getElementById('suW').value='8888 7777';
      if(!u){document.getElementById('suE').value=c;document.getElementById('suK').value='secreta123'}
      document.getElementById('suGo').click()}""", [nombre, tipo, correo, bool(usuario)])
    p.wait_for_timeout(2500)
    return p


def doc(p, ruta):
    return p.evaluate("r=>window.__DB[r]||null", ruta)


with Banco() as b:
    # 1) Sin sesión: crea la cuenta con correo y el negocio
    p = registrar(b, "Brillo Total Detailing")
    uid = "UNUEVO"
    biz, sub = doc(p, "biz/" + uid), doc(p, "subs/" + uid)
    b.ok("Registro: muestra el formulario sin errores", not p.errs, p.errs[:3])
    b.ok("Registro: crea biz con nombre, tipo, WhatsApp y slug", biz and biz["name"] == "Brillo Total Detailing" and biz["type"] == "detailing" and biz["wa"] == "88887777" and biz["slug"] == "brillo-total-detailing", biz and {k: biz.get(k) for k in ("name", "type", "wa", "slug")})
    b.ok("Registro: trae servicios de ejemplo con id, precio y duración", biz and len(biz["services"]) > 0 and all(s.get("id") and s.get("d") and "p" in s for s in biz["services"]))
    b.ok("Registro: horario lunes a sábado", biz and [h["on"] for h in biz["hours"]] == [False, True, True, True, True, True, True])
    pub = doc(p, "pub/brillo-total-detailing")
    b.ok("Registro: crea pub/slug apuntando al negocio", pub and pub["biz"] == uid and pub["name"] == "Brillo Total Detailing", pub and pub.get("biz"))
    b.ok("Registro: crea la prueba gratis (subs trial, ~7 días)", sub and sub["status"] == "trial" and sub["plan"] == "trial" and sub["total"] == 0 and sub["demo"] is False)
    b.ok("Registro: subs solo tiene los campos que permiten las reglas", sub and set(sub) <= {"name", "email", "plan", "status", "total", "demo", "start", "until"}, sorted(sub or {}))
    b.ok("Registro: entra a la app al terminar", p.evaluate("()=>document.getElementById('main').classList.contains('on')"))
    p.wait_for_timeout(800)
    pub = doc(p, "pub/brillo-total-detailing")
    b.ok("Registro: al entrar, pub queda con el plan de la prueba (nitro)", pub and pub["tier"] == "nitro", pub and pub.get("tier"))
    b.ok("Registro: sin errores de JS ni HTML roto", not p.errs and not html_mal(p), [p.errs[:2], html_mal(p)[:2]])

    # 2) Con sesión de Google pero sin negocio: va directo al formulario (sin pedir correo/contraseña)
    p = b.abrir("/app/", {}, {"uid": "UG", "email": "google@prueba.test"}, espera=1500, antes=VIGIA)
    vis = p.evaluate("()=>[document.getElementById('signup').classList.contains('on'),document.getElementById('suMail').hidden,document.getElementById('suPw').hidden]")
    b.ok("Con Google sin negocio: muestra el registro sin correo ni contraseña", vis == [True, True, True], vis)
    p = registrar(b, "Lavacar Ñandú", tipo="lavacar", usuario={"uid": "UG", "email": "google@prueba.test"})
    biz = doc(p, "biz/UG")
    b.ok("Con Google: crea el negocio con su uid y su correo", biz and biz["email"] == "google@prueba.test" and biz["slug"] == "lavacar-nandu", biz and biz.get("slug"))
    b.ok("Con Google: crea subs/UG", doc(p, "subs/UG") is not None)

    # 3) Slugs con tildes, espacios, símbolos y repetidos
    casos = [("  Detailing   José & Hnos!!  ", "detailing-jose-hnos"), ("Árbol Ñ Ü", "arbol-n-u"), ("AB", "ab-cr"), ("Admin", "admin-1"), ("¡¡¡!!!", "mi-negocio")]
    for nombre, esperado in casos:
        p = registrar(b, nombre)
        biz = doc(p, "biz/UNUEVO")
        sl = biz and biz["slug"]
        b.ok("Slug de %r es %r y es válido" % (nombre, esperado), sl == esperado and SLUG_OK.match(sl or "") and doc(p, "pub/" + esperado), sl)
    # slug ocupado: usa -2
    p = registrar(b, "Taller Prueba", datos={"pub/taller-prueba": {"biz": "OTRO", "name": "Otro"}})
    biz = doc(p, "biz/UNUEVO")
    b.ok("Slug ocupado: usa taller-prueba-2 y no pisa el del otro negocio", biz and biz["slug"] == "taller-prueba-2" and doc(p, "pub/taller-prueba")["biz"] == "OTRO", biz and biz.get("slug"))

    # 4) Validaciones del formulario
    p = b.abrir("/app/?nuevo=1", {}, None, espera=1500, antes=VIGIA)
    msgs = p.evaluate("""()=>{var e=document.getElementById('suErr'),o=[];document.getElementById('suGo').click();o.push(e.textContent);
      document.querySelector('#suT [data-k="detailing"]').click();document.getElementById('suGo').click();o.push(e.textContent);
      document.getElementById('suN').value='Mi Taller';document.getElementById('suP').value='Ana Mora';document.getElementById('suE').value='a@b.co';document.getElementById('suW').value='8888';
      document.getElementById('suGo').click();o.push(e.textContent);return o}""")
    b.ok("Registro: pide tipo, nombre y WhatsApp de 8 dígitos", "tipo" in msgs[0] and "nombre" in msgs[1] and "8 dígitos" in msgs[2], msgs)
    b.ok("Registro: si falta algo no escribe nada", not p.evaluate("()=>window.__WRITES.length"))
