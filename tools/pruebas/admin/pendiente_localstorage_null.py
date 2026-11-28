"""PENDIENTE (revisión Opus): si localStorage trae cz_adm_posp = "null" (o un número), tareas() hace posp[o.k] sobre
null, render() revienta en cada cambio y el admin queda inservible (Hoy y Negocios en blanco) hasta borrar el
localStorage. ls() solo atrapa JSON inválido, no tipos raros. Arreglo: ls(k,d) que devuelva d si el tipo no coincide."""
from ayuda import Banco, nuevo

with Banco() as b:
    p = nuevo(b, hash_="negocios", espera=2200, antes="localStorage.setItem('cz_adm_posp','null');localStorage.setItem('cz_adm_lnk','5');")
    b.ok("Con localStorage raro no hay errores de JS", not p.errs, p.errs[:2])
    b.ok("Con localStorage raro la lista de negocios se dibuja", p.locator("#list .a-row").count() >= 5, p.locator("#list .a-row").count())
