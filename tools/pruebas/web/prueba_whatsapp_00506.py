"""PENDIENTE (falla hoy): WhatsApp guardado con prefijo internacional 00 ("00506 8888 7777").
La app lo acepta (solo pide 8 dígitos o más), pero la página arma phone=0050688887777 (WhatsApp pide el número
sin 00 ni +) y muestra "0050688887777" en vez de 8888-7777."""
from urllib.parse import urlparse, parse_qs
from ayuda_web import Banco, armar, abrir, hrefs

with Banco() as b:
    for lay in (None, "clasica"):
        p = abrir(b, armar(layout=lay, wa="00506 8888 7777"))
        nums = sorted(set(parse_qs(urlparse(h).query).get("phone", [""])[0] for h in hrefs(p, "#page a") if "whatsapp" in (h or "")))
        b.ok("%s: WhatsApp '00506 8888 7777' → 50688887777" % (lay or "pro"), nums == ["50688887777"], nums)
        b.ok("%s: se muestra 8888-7777" % (lay or "pro"), "8888-7777" in p.inner_text("#page"))
        p.context.close()
