#!/usr/bin/env python3
"""Corre todas las pruebas de Citaly:  python3 tools/pruebas/correr.py  [app|reservas|web|admin ...]
Termina con código 1 si alguna falla. Correr SIEMPRE antes de subir cambios a main."""
import glob, os, subprocess, sys
aqui = os.path.dirname(os.path.abspath(__file__))
carpetas = sys.argv[1:] or sorted(d for d in os.listdir(aqui) if os.path.isdir(os.path.join(aqui, d)) and d not in ("comun", "__pycache__"))
mal = []
for c in carpetas:
    for f in sorted(glob.glob(os.path.join(aqui, c, "prueba_*.py"))):
        print("\n━━ %s/%s" % (c, os.path.basename(f)))
        if subprocess.run([sys.executable, f], cwd=aqui).returncode:
            mal.append("%s/%s" % (c, os.path.basename(f)))
print("\n" + ("❌ FALLARON: " + ", ".join(mal) if mal else "✅ TODAS LAS PRUEBAS PASARON"))
sys.exit(1 if mal else 0)
