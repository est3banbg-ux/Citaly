#!/usr/bin/env python3
"""Recordatorios automáticos por WhatsApp (Worker). Corre el worker.js real en Node con internet falso."""
import os, subprocess, sys
aqui = os.path.dirname(os.path.abspath(__file__))
sys.exit(subprocess.run(["node", os.path.join(aqui, "recordatorios_wa.mjs")]).returncode)
