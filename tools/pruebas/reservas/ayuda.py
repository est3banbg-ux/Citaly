"""Ayudas para las pruebas de la página de reservas (r/index.html).

- reloj(...)        : JS para `antes=` que fija la hora del navegador (hora de Costa Rica, UTC-6).
- negocio_cr(...)   : negocio de prueba abierto los 7 días, con la suscripción vigente según el reloj falso.
- activar_reglas(p) : imita en el navegador las reglas reales de firestore.rules para un cliente SIN sesión
                      (crear vs. sobrescribir un cupo, campos permitidos, "Mi cita", etc.). Lo que las reglas
                      rechazarían responde permission-denied y queda anotado en window.__NEGADO.
- reservar(...)     : hace clic como un cliente: servicios -> día y hora -> datos -> confirmar.

No toca comun/ (lo usan otros); si algo de aquí sirve a todos, convendría pasarlo a comun/base.py.
"""
import calendar, datetime, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from comun.base import negocio

# Martes 8 de enero de 2030, 7:00 am en Costa Rica: fecha fija para que nada dependa del día real.
BASE = datetime.datetime(2030, 1, 8, 7, 0)


def ms_cr(dt):
    """Milisegundos UTC de una fecha/hora local de Costa Rica (UTC-6, sin horario de verano)."""
    return (calendar.timegm(dt.timetuple()) + 6 * 3600) * 1000


def reloj(dt=BASE):
    """JS que corre antes de la página y hace que `new Date()` / `Date.now()` arranquen en `dt` (hora CR)."""
    return """(function(){var R=Date,off=%d-R.now();
function D(){if(!(this instanceof D))return new R(R.now()+off).toString();var a=[].slice.call(arguments);
 if(!a.length)return new R(R.now()+off);return new (Function.prototype.bind.apply(R,[null].concat(a)))()}
D.prototype=R.prototype;D.now=function(){return R.now()+off};D.UTC=R.UTC;D.parse=R.parse;window.Date=D;
window.__AVANZAR=function(m){off+=m};})();""" % ms_cr(dt)


def f(dt):
    return dt.strftime("%Y-%m-%d")


def dia(n, base=BASE):
    """AAAA-MM-DD de la fecha base + n días."""
    return f(base + datetime.timedelta(days=n))


def ts_rel(base=BASE, dias=0):
    return {"__ts": ms_cr(base + datetime.timedelta(days=dias))}


def negocio_cr(base=BASE, sub=None, **extra):
    """Negocio abierto lunes a domingo 8:00-17:00, cada 30 min, sin anticipación, suscripción vigente."""
    horas = [{"on": True, "a": "08:00", "b": "17:00"} for _ in range(7)]
    kw = dict(hours=horas, lead=0, ahead=14, slot=30)
    kw.update(extra)
    datos, usuario = negocio(**kw)
    datos["subs/U1"] = sub or {"status": "trial", "until": ts_rel(base, 5)}
    if "lanes" in extra:
        datos["biz/U1"]["lanes"] = extra["lanes"]
    return datos, usuario


REGLAS_JS = r"""
window.__NEGADO=[];
(function(){
 var db=window.db,orig=db.batch.bind(db),BID="U1";
 function D(){return window.__DB}
 function ms(v){if(v==null)return null;if(typeof v.toMillis==="function")return v.toMillis();if(v.__fv==="ts")return Date.now();return +v}
 function isTs(v){return !!v&&(typeof v.toMillis==="function"||v.__fv==="ts")}
 function srvNow(v){return !!v&&v.__fv==="ts"}
 function citaTs(f,t){var p=String(f).split("-"),h=String(t).split(":");return Date.UTC(+p[0],+p[1]-1,+p[2])+((+h[0])*60+(+h[1])+360)*60000}
 function str(v,n){return typeof v==="string"&&Array.from(v).length<=n}
 function only(o,ks){return Object.keys(o||{}).every(function(k){return ks.indexOf(k)>=0})}
 function subOk(){var s=D()["subs/"+BID];return !!s&&s.status!=="suspended"&&ms(s.until)>Date.now()}
 function J(v){return JSON.stringify(v&&typeof v.toMillis==="function"?{ts:v.toMillis()}:v)}
 function changed(d,o){var ks={},out=[];Object.keys(d||{}).concat(Object.keys(o||{})).forEach(function(k){ks[k]=1});Object.keys(ks).forEach(function(k){if(J((d||{})[k])!==J((o||{})[k]))out.push(k)});return out}
 function afterState(ops){var A=Object.assign({},D());ops.forEach(function(o){var p=o[1];
   if(o[0]==="delete")delete A[p];else if(o[0]==="set")A[p]=o[3]&&o[3].merge?Object.assign({},A[p]||{},o[2]):Object.assign({},o[2]);
   else A[p]=Object.assign({},A[p]||{},o[2])});return A}
 function selfJob(A,jid){var a=A["biz/"+BID+"/jobs/"+jid];return typeof jid==="string"&&!!a&&srvNow(a.chgAt)&&a.key===a.tk}
 function selfEdit(o,d){var now=Date.now();
   if(!(o.web===true&&("tk" in o)&&d.key===o.tk))return "selfEdit: falta tk o key distinta";
   var ch=changed(d,o);if(!only(ch.reduce(function(m,k){m[k]=1;return m},{}),["date","time","st","key","chg","chgAt"]))return "selfEdit: cambia campos no permitidos "+ch;
   if(!srvNow(d.chgAt))return "selfEdit: chgAt no es la hora del servidor";
   if(!(o.st==="Por confirmar"||o.st==="Confirmada"))return "selfEdit: la cita está en estado "+o.st;
   if(!(citaTs(o.date,o.time)>now+12*36e5))return "selfEdit: faltan menos de 12 h";
   if(d.chg==="cancelada"&&d.st==="Cancelada"&&d.date===o.date&&d.time===o.time)return "";
   if(d.chg==="movida"&&d.st==="Por confirmar"&&str(d.date,10)&&str(d.time,5)&&citaTs(d.date,d.time)>now+2*36e5)return "";
   return "selfEdit: cambio no válido"}
 function check(op,A){var p=op[1],v=op[2],B=D(),o=B[p],seg=p.split("/"),now=Date.now();
   if(seg[0]!=="biz"||seg[1]!==BID||seg.length!==4)return "ruta no permitida sin sesión: "+p;
   var col=seg[2],id=seg[3],d=A[p];
   if(col==="jobs"){
     if(op[0]==="delete")return "jobs: borrar es solo del dueño";
     if(o!=null){if(op[0]==="set"&&!(op[3]&&op[3].merge))return "jobs: sobrescribir una cita que ya existe";return selfEdit(o,d)}
     if(op[0]==="update")return "jobs: no existe";
     if(!subOk())return "jobs: suscripción vencida o suspendida";
     if(!(d.web===true&&d.st==="Por confirmar"))return "jobs: web/st";
     if(!str(d.cli,60))return "jobs: cli";if(!str(d.tel,15))return "jobs: tel";if(!str(d.note,400))return "jobs: note";
     if(typeof d.total!=="number"||!(d.total>=0&&d.total<1e7))return "jobs: total "+d.total;
     if(!Array.isArray(d.items)||d.items.length>10)return "jobs: items";
     if(!(typeof d.date==="string"&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d.date)))return "jobs: date";
     if(!/^[0-9]{6,20}$/.test(id))return "jobs: id "+id;
     if(!(typeof d.time==="string"&&/^[0-9]{2}:[0-9]{2}$/.test(d.time)))return "jobs: time";
     var h=A["biz/"+BID+"/holds/"+d.tel];if(!h||h.job!==id)return "jobs: falta el hold de ese teléfono";
     return ""}
   if(col==="slots"){
     if(op[0]==="delete"){if(o==null)return "";return selfJob(A,o.job)?"":"slots: borrar cupo de otra cita "+id}
     if(o!=null)return "slots: el cupo "+id+" ya está ocupado (update solo del dueño)";
     if(op[0]==="update")return "slots: update";
     if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{4}(_[1-9])?$/.test(id))return "slots: id "+id;
     if(id.length!==15&&!(+id.split("_")[2]<((B["biz/"+BID]||{}).lanes||1)))return "slots: carril "+id+" fuera de los cupos";
     if(!only(d,["date","t","job","at"]))return "slots: campos "+Object.keys(d);
     if(!str(d.job,30))return "slots: job";
     var jj=A["biz/"+BID+"/jobs/"+d.job];if(!jj||jj.date!==d.date)return "slots: la cita no es de ese día";
     return ""}
   if(col==="holds"){
     if(op[0]==="delete"){if(o==null)return "";return selfJob(A,o.job)?"":"holds: borrar el hold de otra cita ("+o.job+")"}
     if(!(o==null||ms(o.until)<now))return "holds: ese teléfono ya tiene una cita pendiente";
     if(!only(d,["job","until","at"]))return "holds: campos";
     if(!isTs(d.until)||ms(d.until)>now+100*864e5)return "holds: until";
     return ""}
   if(col==="mine"){
     if(op[0]==="delete")return "mine: borrar es solo del dueño";
     if(o!=null){var ch=changed(d,o);if(!ch.every(function(k){return ["date","time","st","upd"].indexOf(k)>=0}))return "mine: cambia "+ch;
       return (d.st==="activa"||d.st==="cancelada")?"":"mine: st"}
     if(op[0]==="update")return "mine: no existe";
     if(!(id.length>=20&&id.length<=40))return "mine: token corto";
     if(!subOk())return "mine: suscripción";
     if(!only(d,["job","cli","tel","date","time","dur","items","total","zone","st","at"]))return "mine: campos "+Object.keys(d);
     if(!(str(d.job,30)&&str(d.cli,60)&&str(d.tel,15)))return "mine: job/cli/tel";
     return d.st==="activa"?"":"mine: st"}
   return "colección no permitida sin sesión: "+col}
 db.batch=function(){var ops=[],bt;bt={set:function(r,v,o){ops.push(["set",r.path,v,o]);return bt},update:function(r,v){ops.push(["update",r.path,v]);return bt},delete:function(r){ops.push(["delete",r.path]);return bt},
   commit:function(){var A=afterState(ops),bad=[];ops.forEach(function(o){var m=check(o,A);if(m)bad.push(m)});
     if(bad.length){window.__NEGADO.push(bad);var e=new Error("permission-denied");e.code="permission-denied";return Promise.reject(e)}
     var real=orig();ops.forEach(function(o){if(o[0]==="set")real.set(db.doc(o[1]),o[2],o[3]);else if(o[0]==="update")real.update(db.doc(o[1]),o[2]);else real.delete(db.doc(o[1]))});return real.commit()}};
 return bt};
})();
"""


def activar_reglas(p):
    p.evaluate("()=>{" + REGLAS_JS + "}")


def negado(p):
    return p.evaluate("()=>window.__NEGADO||[]")


def poner(p, ruta, datos):
    """Otro cliente (u otro teléfono) escribe directo en la base, sin pasar por esta página."""
    p.evaluate("([r,d])=>{window.__DB[r]=d}", [ruta, datos])


def ir_a_servicios(p):
    p.click("#go1"); p.wait_for_timeout(300)


def elegir_servicios(p, indices):
    for i in indices:
        p.click('#svcs .svc[data-i="%d"]' % i); p.wait_for_timeout(120)


def siguiente(p, t=400):
    p.click("#nx"); p.wait_for_timeout(t)


def elegir_dia_hora(p, d, hora):
    p.click('#days button[data-d="%s"]' % d); p.wait_for_timeout(250)
    p.click('#hrs button[data-t="%s"]' % hora); p.wait_for_timeout(150)


def llenar_datos(p, nombre="Ana Pérez", tel="8888 7777", nota=""):
    p.fill("#cli", nombre); p.fill("#tel", tel)
    if nota:
        p.fill("#nt", nota)
    p.wait_for_timeout(100)


def confirmar(p, t=900):
    p.evaluate("()=>{T0=0}")  # el freno anti-robots pide 6 s desde que abrió la página
    p.click("#nx"); p.wait_for_timeout(t)


def reservar(p, indices, d, hora, nombre="Ana Pérez", tel="8888 7777", nota=""):
    """Flujo sin vehículo ni domicilio: servicios -> día/hora -> datos -> confirmar."""
    ir_a_servicios(p); elegir_servicios(p, indices); siguiente(p, 600)
    elegir_dia_hora(p, d, hora); siguiente(p)
    llenar_datos(p, nombre, tel, nota); siguiente(p)
    confirmar(p)


def slots_de(p, job=None):
    db = p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB))")
    return sorted(k.split("/")[-1] for k, v in db.items() if k.startswith("biz/U1/slots/") and (job is None or str(v.get("job")) == str(job)))


def _ts(v):
    if isinstance(v, dict):
        if set(v) == {"_ms"}:
            return {"__ts": v["_ms"]}
        return {k: _ts(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_ts(x) for x in v]
    return v


def estado(p):
    """Estado final de la base, listo para volver a abrir otra página con él (las fechas quedan como {"__ts": ms})."""
    return _ts(p.evaluate("()=>JSON.parse(JSON.stringify(window.__DB))"))


def jobs(p):
    return {k.split("/")[-1]: v for k, v in estado(p).items() if k.startswith("biz/U1/jobs/")}


LIBRES = "async (d)=>{await loadBusy();return freeStarts(d)}"


def txt(p, sel):
    """Texto visible con los espacios duros (los de ₡23 000) cambiados por espacios normales."""
    return p.inner_text(sel).replace("\xa0", " ").replace(" ", " ")


TK = "abcdefghijkmnpqrstuvwx23"  # código de "Mi cita" de 24 letras, como los que genera la página
JOB = "1894000000000"


def con_cita(d, t="09:00", dur=60, mine_extra=None, job_extra=None, carril="", **kw):
    """Negocio con una cita web ya hecha (job + cupos + hold + mine), lista para abrir /r/?n=prueba&cita=TK."""
    datos, _ = negocio_cr(**kw)
    datos["biz/U1/jobs/" + JOB] = dict({"id": JOB, "cli": "Ana Pérez", "tel": "88887777", "date": d, "time": t, "dur": dur, "st": "Por confirmar",
                                        "web": True, "tk": TK, "items": ["Lavado básico"], "total": 8000, "note": ""}, **(job_extra or {}))
    datos["biz/U1/mine/" + TK] = dict({"job": JOB, "cli": "Ana Pérez", "tel": "88887777", "date": d, "time": t, "dur": dur,
                                       "items": ["Lavado básico"], "total": 8000, "zone": "", "st": "activa"}, **(mine_extra or {}))
    s = int(t[:2]) * 60 + int(t[3:])
    for k in range(0, dur, 30):
        m = s + k
        sid = "%s_%02d%02d%s" % (d, m // 60, m % 60, carril)
        datos["biz/U1/slots/" + sid] = {"date": d, "t": sid[11:15], "job": JOB}
    datos["biz/U1/holds/88887777"] = {"job": JOB, "until": {"__ts": ms_cr(datetime.datetime.strptime(d + " " + t, "%Y-%m-%d %H:%M")) + dur * 60000}}
    return datos


def abrir_cita(b, datos, ahora=BASE, tk=TK, **kw):
    p = b.abrir("/r/?n=prueba&cita=" + tk, datos, antes=reloj(ahora), espera=1500, **kw)
    activar_reglas(p)
    return p


def mover(p, d, hora):
    p.click("#mcMove"); p.wait_for_timeout(600)
    p.click('#mdays button[data-d="%s"]' % d); p.wait_for_timeout(250)
    p.click('#mhrs button[data-t="%s"]' % hora); p.wait_for_timeout(150)
    p.click("#mGo"); p.wait_for_timeout(900)


def cancelar(p):
    p.click("#mcCancel"); p.wait_for_timeout(300); p.click("#cY"); p.wait_for_timeout(900)
