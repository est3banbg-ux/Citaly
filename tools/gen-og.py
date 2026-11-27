#!/usr/bin/env python3
"""Crea la imagen de vista previa (la que sale al compartir el link por WhatsApp, Facebook o TikTok) de cada negocio:
citalyapp.com/<slug>/og.jpg, de 1200×630.

La corre .github/workflows/seo.yml después de tools/gen-seo.mjs, que deja la lista de negocios en tools/.og-jobs.json.
Solo vuelve a dibujar la imagen de un negocio cuando cambian sus datos (nombre, frase, color, logo o foto).

Uso:  python3 tools/gen-og.py [ruta/a/og-jobs.json]
"""
import base64, hashlib, io, json, os, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
JOBS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "tools", ".og-jobs.json")
HASHES = os.path.join(RAIZ, "tools", "og-hash.json")
FUENTE = os.path.join(RAIZ, "tools", "fonts", "DMSans.ttf")
W, H, M = 1200, 630, 68
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")


def fuente(tam, peso=700):
    try:
        f = ImageFont.truetype(FUENTE, tam)
        try:
            f.set_variation_by_axes([min(40, max(9, tam)), peso])
        except Exception:
            pass
        return f
    except Exception:
        for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
            if os.path.exists(p):
                return ImageFont.truetype(p, tam)
        return ImageFont.load_default()


def limpio(s, n=200):
    """Quita emojis y símbolos que la letra no trae (saldrían como cuadritos)."""
    s = "".join(c for c in str(s or "").replace("₡", "¢") if c == " " or 0x21 <= ord(c) <= 0x7E or 0xA1 <= ord(c) <= 0x17F or c in "‘’“”–—·…•")
    return re.sub(r"\s+", " ", s).strip()[:n]


def color(hexa, defecto=(47, 140, 255)):
    m = re.match(r"^#?([0-9a-fA-F]{6})$", str(hexa or "").strip())
    if not m:
        return defecto
    v = m.group(1)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def mezcla(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def brillo(c):
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255


def imagen(src):
    """Abre una imagen desde data:image/...;base64 o https://. Devuelve None si no se puede."""
    try:
        if not isinstance(src, str) or not src:
            return None
        if src.startswith("data:image/"):
            raw = base64.b64decode(src.split(",", 1)[1])
        elif src.startswith("https://"):
            with urllib.request.urlopen(urllib.request.Request(src, headers={"User-Agent": "citaly-og"}), timeout=15) as r:
                raw = r.read(6_000_000)
        else:
            return None
        im = Image.open(io.BytesIO(raw))
        im.load()
        return ImageOps.exif_transpose(im)
    except Exception:
        return None


def partir(d, texto, f, ancho, max_lineas):
    """Parte el texto en renglones que quepan en `ancho`. Devuelve None si no cabe en max_lineas."""
    lineas, act = [], ""
    for pal in texto.split(" "):
        pr = (act + " " + pal).strip()
        if d.textlength(pr, font=f) <= ancho:
            act = pr
        else:
            if not act or d.textlength(pal, font=f) > ancho:
                return None
            lineas.append(act); act = pal
    if act:
        lineas.append(act)
    return lineas if len(lineas) <= max_lineas else None


def ajustar(d, texto, ancho, tamanos, peso, max_lineas):
    for t in tamanos:
        f = fuente(t, peso)
        ls = partir(d, texto, f, ancho, max_lineas)
        if ls:
            return f, ls, t
    f = fuente(tamanos[-1], peso)
    pals, ls, act = texto.split(" "), [], ""
    for pal in pals:  # último recurso: recorta con puntos suspensivos
        pr = (act + " " + pal).strip()
        if d.textlength(pr, font=f) <= ancho:
            act = pr
        elif len(ls) < max_lineas - 1 and act:
            ls.append(act); act = pal
        else:
            if not act:
                act = pal
            break
    while act and d.textlength(act + "…", font=f) > ancho:
        act = act[:-1]
    ls.append((act + "…") if act else "…")
    return f, ls, tamanos[-1]


def degradado_h(ancho, alto, a0, a1, corte=1.0):
    """Capa negra-azulada con transparencia que va de a0 (izquierda) a a1 (en `corte` del ancho)."""
    g = Image.new("L", (256, 1))
    g.putdata([round(255 * (a0 + (a1 - a0) * min(1, (x / 255) / corte) ** 1.15)) for x in range(256)])
    capa = Image.new("RGBA", (ancho, alto), (7, 11, 20, 255))
    capa.putalpha(g.resize((ancho, alto), Image.BILINEAR))
    return capa


def recuadro_logo(logo, lado, radio):
    """Logo dentro de un cuadro redondeado blanco (los logos suelen venir con fondo propio)."""
    base = Image.new("RGBA", (lado, lado), (255, 255, 255, 255))
    lg = ImageOps.contain(logo.convert("RGBA"), (lado, lado), Image.LANCZOS)
    if lg.size == (lado, lado):
        base = lg
    else:
        base.alpha_composite(lg, ((lado - lg.width) // 2, (lado - lg.height) // 2))
    masc = Image.new("L", (lado * 2, lado * 2), 0)
    ImageDraw.Draw(masc).rounded_rectangle((0, 0, lado * 2 - 1, lado * 2 - 1), radio * 2, fill=255)
    base.putalpha(masc.resize((lado, lado), Image.LANCZOS))
    return base


def tarjeta(j):
    nombre = limpio(j.get("name"), 60) or j["slug"]
    frase = limpio(j.get("tagline"), 110)
    col = color(j.get("color"))
    foto, logo = imagen(j.get("img")), imagen(j.get("logo"))
    oscuro = mezcla(col, (7, 11, 20), 0.86)

    if foto is not None:
        foto = foto.convert("RGB")
        if j.get("ba") and foto.height > foto.width * 1.3:  # collage antes/después apilado: se usa el «después»
            foto = foto.crop((0, foto.height // 2, foto.width, foto.height))
        im = ImageOps.fit(foto, (W, H), Image.LANCZOS, centering=(0.5, 0.45)).convert("RGBA")
        im.alpha_composite(degradado_h(W, H, 0.94, 0.10, 0.82))
        ancho_txt = 700
    else:
        im = Image.new("RGBA", (W, H), oscuro + (255,))
        luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dl = ImageDraw.Draw(luz)
        dl.ellipse((W - 560, -260, W + 240, 540), fill=mezcla(col, (255, 255, 255), 0.05) + (150,))
        dl.ellipse((W - 380, H - 250, W + 160, H + 290), fill=mezcla(col, (7, 11, 20), 0.25) + (170,))
        dl.ellipse((-300, H - 200, 260, H + 360), fill=col + (60,))
        im.alpha_composite(luz.filter(ImageFilter.GaussianBlur(90)))
        im.alpha_composite(degradado_h(W, H, 0.55, 0.0, 0.7))
        ancho_txt = 640 if logo is not None else 760
        if logo is not None:
            lado = 300
            sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(sombra).rounded_rectangle((W - M - lado + 4, (H - lado) // 2 + 18, W - M + 4, (H + lado) // 2 + 18), 56, fill=(0, 0, 0, 120))
            im.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(26)))
            im.alpha_composite(recuadro_logo(logo, lado, 56), (W - M - lado, (H - lado) // 2))
        else:
            ini = (re.sub(r"[^A-Za-zÀ-ÿ0-9]", "", nombre)[:1] or "C").upper()
            capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            dc = ImageDraw.Draw(capa)
            cx, cy, r = W - M - 150, H // 2, 150
            dc.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, 26), outline=(255, 255, 255, 70), width=3)
            fi = fuente(190, 800)
            bb = dc.textbbox((0, 0), ini, font=fi)
            dc.text((cx - (bb[0] + bb[2]) / 2, cy - (bb[1] + bb[3]) / 2), ini, font=fi, fill=(255, 255, 255, 235))
            im.alpha_composite(capa)

    d = ImageDraw.Draw(im)
    # Bloque de texto: (logo chico) + nombre + frase + botón, centrado en vertical
    f_n, l_n, t_n = ajustar(d, nombre, ancho_txt, [92, 82, 72, 64, 56, 50], 800, 2)
    alto_n = round(t_n * 1.08) * len(l_n)
    f_f, l_f, t_f = (ajustar(d, frase, ancho_txt, [34, 31, 28], 500, 2) if frase else (None, [], 0))
    alto_f = round(t_f * 1.32) * len(l_f)
    logo_chico = logo is not None and foto is not None
    alto = (96 + 30 if logo_chico else 0) + alto_n + (20 + alto_f if l_f else 0) + 40 + 72
    y = max(M - 8, (H - 44 - alto) // 2)
    if logo_chico:
        im.alpha_composite(recuadro_logo(logo, 96, 24), (M, y)); y += 96 + 30
        d = ImageDraw.Draw(im)
    for ln in l_n:
        d.text((M - 3, y - round(t_n * 0.16)), ln, font=f_n, fill=(255, 255, 255, 255)); y += round(t_n * 1.08)
    if l_f:
        y += 20
        for ln in l_f:
            d.text((M, y - round(t_f * 0.1)), ln, font=f_f, fill=(226, 232, 242, 255)); y += round(t_f * 1.32)
    y += 40
    # Botón «Agenda tu cita en línea» con el color del negocio
    boton = col if brillo(col) > 0.16 else mezcla(col, (255, 255, 255), 0.35)
    tinta = (255, 255, 255) if brillo(boton) < 0.62 else (10, 14, 24)
    f_b = fuente(30, 700)
    txt = "Agenda tu cita en línea"
    wb = round(d.textlength(txt, font=f_b)) + 34 + 34 + 46
    d.rounded_rectangle((M, y, M + wb, y + 72), 36, fill=boton + (255,))
    bb = d.textbbox((0, 0), txt, font=f_b)
    d.text((M + 34, y + 36 - (bb[1] + bb[3]) / 2), txt, font=f_b, fill=tinta + (255,))
    ax, ay = M + wb - 34 - 22, y + 36  # flechita
    d.line((ax, ay, ax + 22, ay), fill=tinta + (255,), width=4)
    d.line((ax + 12, ay - 10, ax + 22, ay, ax + 12, ay + 10), fill=tinta + (255,), width=4, joint="curve")
    # Pie: el link
    d.text((M, H - 58), "citalyapp.com/" + j["slug"], font=fuente(23, 500), fill=(255, 255, 255, 165))
    return im.convert("RGB")


def main():
    jobs = json.load(open(JOBS, encoding="utf-8"))
    viejos = json.load(open(HASHES, encoding="utf-8")) if os.path.exists(HASHES) else {}
    nuevos, hechos = {}, 0
    for j in jobs:
        slug = j.get("slug", "")
        if not SLUG_RE.match(slug) or not os.path.isdir(os.path.join(RAIZ, slug)):
            continue
        destino = os.path.join(RAIZ, slug, "og.jpg")
        v = j.get("v") or hashlib.sha1(json.dumps(j, sort_keys=True).encode()).hexdigest()[:10]
        nuevos[slug] = v
        if viejos.get(slug) == v and os.path.exists(destino):
            continue
        if j.get("fail"):  # no se pudo leer la foto esta vez: no se anota, para reintentar en la próxima corrida
            nuevos.pop(slug)
            if os.path.exists(destino):
                continue  # se queda la imagen anterior
        try:
            im = tarjeta(j)
        except Exception as e:  # un negocio con datos raros no frena a los demás
            print("AVISO vista previa", slug, repr(e))
            nuevos.pop(slug, None)  # se reintenta en la próxima corrida
            if os.path.exists(destino):
                continue
            im = tarjeta({"slug": slug, "name": j.get("name"), "color": j.get("color")})  # tarjeta simple
        im.save(destino, "JPEG", quality=86, optimize=True, progressive=True)
        hechos += 1
        print("vista previa:", slug)
    with open(HASHES, "w", encoding="utf-8") as f:
        f.write(json.dumps(dict(sorted(nuevos.items())), indent=1) + "\n")
    print("imágenes de vista previa:", len(nuevos), "· redibujadas:", hechos)


if __name__ == "__main__":
    main()
