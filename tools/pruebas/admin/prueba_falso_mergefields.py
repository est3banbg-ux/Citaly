"""ARREGLADO (era pendiente de la revisión Opus): el Firebase falso NO implementa set(..., {mergeFields:[…]}): lo trata
como set sin merge y BORRA los demás campos. Firestore real los conserva. El admin guarda pub/<link> con mergeFields,
así que después de Guardar el estado en memoria de pub (tier, lanes, dep, ntf, cap.fot…) no se parece al real y
ninguna prueba puede ver si el admin pisa o conserva esos campos. (También: plain() convierte undefined en null,
así que una escritura con undefined —que Firestore real rechaza— pasa sin aviso.)
Arreglo en comun/firebase-falso.js: en apply(), si opt.mergeFields, copiar solo esas rutas; y si algún valor es
undefined, rechazar la escritura como Firestore."""
from ayuda import Banco, nuevo

with Banco() as b:
    p = nuevo(b, hash_="hoy", espera=1500)
    p.evaluate("()=>db.doc('pub/x').set({a:1,b:2,c:{d:1,e:2}})")
    p.evaluate("()=>db.doc('pub/x').set({a:9,c:{d:5}},{mergeFields:['a','c.d']})"); p.wait_for_timeout(100)
    r = p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB['pub/x']))")
    b.ok("mergeFields conserva los campos no listados (como Firestore real)", r == {"a": 9, "b": 2, "c": {"d": 5, "e": 2}}, r)
    ok = p.evaluate("()=>db.doc('pub/y').set({a:undefined}).then(()=>false,()=>true)")
    b.ok("Una escritura con undefined se rechaza (como Firestore real)", ok)
