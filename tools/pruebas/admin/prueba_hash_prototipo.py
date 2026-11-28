"""ARREGLADO (era pendiente de la revisión Opus): #negocio/constructor (o __proto__, toString…) abre una ficha fantasma ("Object"):
openFicha usa BIZ[t] y BIZ es un objeto normal, así que encuentra propiedades del prototipo. Si se llenara y guardara,
escribiría biz/constructor y pub/undefined. Arreglo: Object.prototype.hasOwnProperty.call(BIZ,t) en openFicha/render."""
from ayuda import Banco, nuevo

with Banco() as b:
    for h in ("constructor", "__proto__", "toString"):
        p = nuevo(b, hash_="negocio/" + h, espera=2000)
        b.ok("#negocio/%s no abre ninguna ficha" % h, p.evaluate("()=>E===null&&location.hash==='#negocios'"), p.evaluate("()=>[location.hash,E&&E.name]"))
        p.context.close()
