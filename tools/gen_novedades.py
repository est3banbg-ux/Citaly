#!/usr/bin/env python3
"""Genera app/novedades-auto.js a partir de los mensajes de commit.

Convención: cualquier línea del mensaje de commit con el formato
    Novedad: <emoji> | <Título corto> | <Texto de 1-2 frases>
agrega una novedad (el emoji puede faltar -> se usa 🆕). Varias líneas = varias novedades.
La fecha es la del commit en hora de Costa Rica (UTC-6, sin horario de verano).

Uso:  python3 tools/gen_novedades.py [--ref main] [--out app/novedades-auto.js]
Solo usa la biblioteca estándar de Python 3.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))  # America/Costa_Rica, sin DST
MAX_ITEMS = 60
DEFAULT_EMOJI = "\U0001F195"  # 🆕
HEADER = "/* Generado automáticamente por tools/gen_novedades.py. No editar a mano. */\n"
LINE_RE = re.compile(r"^\s*[-*>]?\s*Novedad\s*:\s*(.+?)\s*$", re.IGNORECASE)
FS, RS = "\x1f", "\x00"  # separador de campos / de commits (git log -z)


def git(repo, *args):
    return subprocess.run(["git", "-C", repo, *args], check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout


def resolve_ref(repo, ref):
    for cand in (ref, "origin/" + ref, "HEAD"):
        r = subprocess.run(["git", "-C", repo, "rev-parse", "--verify", "-q", cand + "^{commit}"],
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        if r.returncode == 0:
            return cand
    return None


def looks_like_emoji(s):
    # Sin letras ni dígitos y corto: lo tratamos como emoji/ícono.
    return 0 < len(s) <= 12 and not any(ch.isalnum() for ch in s)


def parse_line(body):
    parts = [p.strip() for p in body.split(" | ")]
    if len(parts) >= 3 and (parts[0] == "" or looks_like_emoji(parts[0])):
        ic, t, x = parts[0] or DEFAULT_EMOJI, parts[1], " | ".join(parts[2:])
    elif len(parts) >= 2:
        ic, t, x = DEFAULT_EMOJI, parts[0], " | ".join(parts[1:])
    else:
        ic, t, x = DEFAULT_EMOJI, parts[0], ""
    if not t:
        return None
    return ic, t, x


def collect(repo, ref):
    raw = git(repo, "log", ref, "-z", "--format=%H" + FS + "%h" + FS + "%ct" + FS + "%B")
    text = raw.decode("utf-8", errors="replace")
    items, seen, version = [], set(), None
    for rec in text.split(RS):
        if not rec.strip():
            continue
        fields = rec.lstrip("\n").split(FS, 3)
        if len(fields) < 4:
            continue
        _full, short, ts, msg = fields
        d = datetime.fromtimestamp(int(ts), CR_TZ).strftime("%Y-%m-%d")
        found = False
        for line in msg.splitlines():
            m = LINE_RE.match(line)
            if not m:
                continue
            parsed = parse_line(m.group(1))
            if not parsed:
                continue
            ic, t, x = parsed
            found = True
            key = (t.casefold(), d)
            if key in seen:
                continue
            seen.add(key)
            items.append({"d": d, "ic": ic, "t": t, "x": x})
        if found and version is None:
            version = short  # git log va del más nuevo al más viejo
    # Orden estable: más nuevo primero (fecha desc; dentro del mismo día, orden de git log)
    items.sort(key=lambda it: it["d"], reverse=True)
    return version or "0", items[:MAX_ITEMS]


def render(version, items):
    j = lambda s: json.dumps(s, ensure_ascii=False)
    objs = ",".join("{d:%s,ic:%s,t:%s,x:%s}" % (j(i["d"]), j(i["ic"]), j(i["t"]), j(i["x"]))
                    for i in items)
    return HEADER + "var CITALY_NEWS_AUTO={v:%s,items:[%s]};\n" % (j(version), objs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--ref", default="main")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    out = a.out or os.path.join(a.repo, "app", "novedades-auto.js")
    ref = resolve_ref(a.repo, a.ref)
    version, items = collect(a.repo, ref) if ref else ("0", [])
    content = render(version, items)
    try:
        with open(out, "r", encoding="utf-8", newline="") as f:
            if f.read() == content:
                print("Sin cambios (%d novedades, v=%s)" % (len(items), version))
                return 0
    except FileNotFoundError:
        pass
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Escrito %s (%d novedades, v=%s)" % (out, len(items), version))
    return 0


if __name__ == "__main__":
    sys.exit(main())
