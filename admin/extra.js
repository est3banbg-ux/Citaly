/* Citaly · panel del admin — extras: cobros, métricas, prospectos, reporte, notas, etiquetas y mensajes.
   Se carga después del script principal y usa sus variables y funciones globales (BIZ, SUBS, PAYS, db, C…). */
var ADM={},LEADS=[],TAB="neg",LF="todos";
(function(){
"use strict";
var ST=["nuevo","escrito","respondió","demo","cerrado","perdido"];
var STN={nuevo:"Nuevo",escrito:"Escrito",respondió:"Respondió",demo:"Demo enviada",cerrado:"Cerrado ✓",perdido:"Perdido"};
var STEPS=["cuenta","hor","svc","look","prueba","share"];
var DAY=864e5;

/* ---------- utilidades ---------- */
function ms(x){return x&&x.toMillis?x.toMillis():(+x||0)}
function daysTo(t){return Math.ceil((t-Date.now())/DAY)}
function ago(t){var d=Math.floor((Date.now()-t)/DAY);return d<=0?"hoy":d===1?"ayer":"hace "+d+" días"}
function first(b){return String(b&&b.owner||"").split(" ")[0]}
function pct(a,b){return b?Math.round(a*100/b)+"%":"–"}
function tierName(s){return (C.plans[(s&&s.tier)||"arranque"]||{}).n||"Arranque"}
function expect(s){var tk=(s&&s.tier)||"arranque",mo=+(s&&s.months)||0;
  var promo=tk===C.promoPlan&&!(s&&s.leftPromo)&&mo<C.monthly.promoMonths;
  return promo?C.monthly.promo:((C.plans[tk]||{}).crc||0)}
function sheet(title,html){var o=document.createElement("div");o.className="shOv";
  o.innerHTML='<div class="sh"><div class="between" style="margin-bottom:6px"><b style="font-size:17px">'+title+'</b><button class="btn sm ghost" data-x="1" style="width:auto;margin:0">Cerrar</button></div>'+html+'</div>';
  o.onclick=function(e){if(e.target===o||(e.target.getAttribute&&e.target.getAttribute("data-x")))o.remove()};document.body.appendChild(o);return o}
function rowsOf(){return Object.keys(BIZ).map(function(id){return {id:id,b:BIZ[id],s:SUBS[id]||null}})}
function stepsDone(b){var o=(b&&b.onb)||{};return STEPS.filter(function(k){return o[k]}).length}
function csv(rows){return "﻿"+rows.map(function(r){return r.map(function(v){v=String(v==null?"":v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(";")}).join("\r\n")}
function download(name,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}

/* abrir WhatsApp: en el celular con el esquema de la app (un toque, sin pasar por la página web) */
function goWa(u){if(u.indexOf("whatsapp://")===0)location.href=u;else window.open(u,"_blank")}
function askWa(wa,msg){var o=sheet("Avisarle por WhatsApp",'<p class="mute small" style="margin:0 0 10px">Se abre WhatsApp con el mensaje listo para enviar.</p><a class="btn wa" id="waGo" href="'+esc(waUrl(wa,msg))+'">💬 Abrir WhatsApp</a><button class="btn alt" data-x="1">Ahora no</button>');
  o.querySelector("#waGo").addEventListener("click",function(){setTimeout(function(){o.remove()},400)})}

/* ---------- mensajes de WhatsApp listos ---------- */
function msgs(b,s){var n=first(b),nm=b.name||"tu negocio",hi="¡Hola"+(n?" "+n:"")+"! 👋 ",u=s?untilMs(s):0,f=u?fd(u):"",
  pay="SINPE Móvil al "+C.sinpe+" a nombre de "+C.sinpeName+", o con tarjeta desde tu app en Planes",m=s?expect(s):C.monthly.promo;
  return [
   ["👋 Bienvenida",hi+"Te escribe Esteban de Citaly. Vi que creaste la cuenta de "+nm+". ¿Te ayudo a dejarla lista? En 10 minutos tu página de reservas queda funcionando."],
   ["⏰ Recordar cobro",hi+"Te recuerdo que tu Citaly de "+nm+(f?" vence el "+f:" está por vencer")+". Para renovar ("+crc(m)+"): "+pay+". Después me mandás el comprobante por aquí. ¡Gracias! 🙌"],
   ["⚠️ Mensualidad vencida",hi+"Tu mensualidad de Citaly de "+nm+(f?" venció el "+f:" está vencida")+". Para que tu página siga recibiendo reservas: "+pay+" ("+crc(m)+"). Cualquier duda, aquí estoy."],
   ["🎁 Termina la prueba",hi+"Tu prueba gratis de Citaly termina"+(f?" el "+f:" pronto")+". Si querés seguir, el plan Arranque cuesta "+crc(C.monthly.promo)+" los primeros "+C.monthly.promoMonths+" meses y después "+crc(C.monthly.std)+". Lo activás en tu app, en Planes. ¿Te ayudo?"],
   ["✅ Pago recibido",hi+"Recibimos tu pago ✅ Tu Citaly queda activo"+(f?" hasta el "+f:"")+". ¡Muchas gracias! 🙌"],
   ["⭐ Pedir reseña",hi+"¿Cómo te ha ido con Citaly? Si te ha servido, ¿me regalás una reseña corta? Me ayuda un montón 🙏"],
   ["🔄 Reactivar",hi+"Vi que tu Citaly de "+nm+" está pausado. ¿Querés que lo reactivemos? Te ayudo con lo que necesités."]]}
function openMsgs(id){var b=BIZ[id],s=SUBS[id];if(!b)return;if(!b.wa){toast("Este negocio no tiene WhatsApp guardado");return}
  var L=msgs(b,s),o=sheet("Mensajes para "+esc(b.name||"")+"",L.map(function(m,i){return '<button class="btn alt" data-i="'+i+'">'+m[0]+'</button>'}).join(""));
  o.addEventListener("click",function(e){var x=e.target.closest("[data-i]");if(!x)return;goWa(waUrl(b.wa,L[+x.getAttribute("data-i")][1]));o.remove()})}

/* ---------- pestañas ---------- */
var TABS={neg:"Negocios",cob:"Cobros",met:"Métricas",pro:"Prospectos",rep:"Reporte",resp:"Respuestas"};
function cobrosList(){var out={late:[],soon:[],trialEnd:[],trialLate:[],ok:0};
  rowsOf().forEach(function(x){var s=x.s;if(!s||s.demo||s.status==="suspended"||!monthly(s))return;var d=untilMs(s)<Date.now()?-1:daysTo(untilMs(s)),o={id:x.id,b:x.b,s:s,d:d};
    if(s.plan==="trial"){if(d<0)out.trialLate.push(o);else if(d<=3)out.trialEnd.push(o);else out.ok++}
    else{if(d<0)out.late.push(o);else if(d<=7)out.soon.push(o);else out.ok++}});
  ["late","soon","trialEnd","trialLate"].forEach(function(k){out[k].sort(function(a,b){return a.d-b.d})});return out}
function unmatched(){return PAYS.filter(function(p){return p.src==="polar"&&!p.biz})}
function followUps(){var t=Date.now();return LEADS.filter(function(l){return l.st==="escrito"&&t-ms(l.upd||l.at)>2*DAY}).length}
function badge(){var c=cobrosList(),n=c.late.length+c.soon.length+c.trialEnd.length+c.trialLate.length+unmatched().length,f=followUps();
  Array.prototype.forEach.call($("tabs").children,function(b){var k=b.getAttribute("data-t"),x=TABS[k];if(k==="cob"&&n)x+=" ("+n+")";if(k==="pro"&&f)x+=" ("+f+")";if(b.textContent!==x)b.textContent=x})}
$("tabs").onclick=function(e){var b=e.target.closest("button");if(!b)return;TAB=b.getAttribute("data-t");
  Array.prototype.forEach.call(this.children,function(x){x.setAttribute("aria-pressed",x===b)});
  Object.keys(TABS).forEach(function(k){$("t-"+k).hidden=k!==TAB});renderTab();window.scrollTo(0,0)};
function renderTab(){badge();if(TAB==="cob")rCob();else if(TAB==="met")rMet();else if(TAB==="pro")rPro();else if(TAB==="rep")rRep();else if(TAB==="resp")rResp()}

/* ---------- COBROS ---------- */
function cobRow(o,kind){var b=o.b,s=o.s,when=o.d<0?"venció "+ago(untilMs(s)):o.d===0?"vence hoy":"vence en "+o.d+" d ("+fd(untilMs(s))+")";
  var plan=s.plan==="trial"?"Prueba gratis":tierName(s)+" · "+crc(s.price||expect(s))+"/mes";
  return '<div class="row2"><div class="m"><b>'+esc(b.name||"(sin nombre)")+'</b><span>'+esc(plan)+' · '+when+'</span></div><div class="bt">'
   +(b.wa?'<button class="btn sm wa" data-c="msg" data-id="'+o.id+'">💬</button>':"")
   +'<button class="btn sm ghost" data-c="pay" data-id="'+o.id+'">💸 Cobrar</button></div></div>'}
function cobBlock(t,arr,kind){return '<div class="card"><h2 style="margin-bottom:2px">'+t+' <span class="pill '+(kind==="bad"?"bad":"warn")+'">'+arr.length+'</span></h2>'+(arr.length?arr.map(function(o){return cobRow(o,kind)}).join(""):'<p class="mute small" style="margin:6px 0 0">Nadie por aquí 🎉</p>')+'</div>'}
function rCob(){var c=cobrosList(),um=unmatched(),h='<p class="mute small" style="margin:0 0 10px">Lo que hay que cobrar o renovar. "Cobrar" registra el pago y "💬" abre WhatsApp con el mensaje listo.</p>'
  +cobBlock("Mensualidad vencida",c.late,"bad")+cobBlock("Vencen en 7 días",c.soon,"warn")+cobBlock("Pruebas que terminan (≤ 3 días)",c.trialEnd,"warn")+cobBlock("Prueba vencida (sin pagar)",c.trialLate,"bad");
  if(um.length)h+='<div class="card"><h2 style="margin-bottom:2px">Pagos de Polar sin cuenta <span class="pill bad">'+um.length+'</span></h2><p class="mute small" style="margin:2px 0 6px">Pagaron con un correo que no coincide con ningún negocio. Búscalos y regístrales la mensualidad a mano.</p>'
    +um.map(function(p){return '<div class="row2"><div class="m"><b>'+esc(p.name||"")+'</b><span>'+fd(p.at)+' · '+esc(p.what||"")+'</span></div><b>'+crc(p.amt)+'</b></div>'}).join("")+'</div>';
  h+='<p class="mute small">Al día sin acción: <b>'+c.ok+'</b> negocio'+(c.ok===1?"":"s")+'.</p>';$("t-cob").innerHTML=h}
$("t-cob").onclick=function(e){var x=e.target.closest("[data-c]");if(!x)return;var id=x.getAttribute("data-id"),k=x.getAttribute("data-c");
  if(k==="msg"){openMsgs(id);return}
  if(k==="pay"){var fake=document.createElement("button");fake.setAttribute("data-a","pay");fake.setAttribute("data-id",id);$("list").onclick({target:fake})}};

/* ---------- MÉTRICAS ---------- */
function goalOf(){return +(ADM._cfg&&ADM._cfg.goal)||300000}
function mrrNow(){var m=0;rowsOf().forEach(function(x){var s=x.s;if(s&&s.plan==="mensual"&&state(s)==="active"&&!late(s))m+=+s.price||0});return m}
function rMet(){var rows=rowsOf().filter(function(x){return x.s&&!x.s.demo&&x.b}),selfs=rows.filter(function(x){return x.b.self}),t30=Date.now()-30*DAY;
  var r30=selfs.filter(function(x){return ms(x.b.created)>=t30}),
      done=selfs.filter(function(x){return x.b.onb&&x.b.onb.done}).length,
      mid=selfs.filter(function(x){return stepsDone(x.b)>=3}).length,
      pay=rows.filter(function(x){return x.s.plan==="mensual"}).length,
      mrr=mrrNow(),goal=goalOf(),pg=Math.min(100,Math.round(mrr*100/goal)),avg=Math.round((mrr/Math.max(1,rows.filter(function(x){return x.s.plan==="mensual"&&state(x.s)==="active"}).length))||C.monthly.std),
      need=Math.max(0,Math.ceil((goal-mrr)/(avg||C.monthly.std)));
  var h='<div class="card"><div class="between"><h2 style="margin:0">Meta de ingreso fijo</h2><button class="btn sm ghost" data-m="goal">Cambiar</button></div>'
   +'<div style="margin:10px 0 6px;display:flex;justify-content:space-between;font-size:14px"><b>'+crc(mrr)+'</b><span class="mute">meta '+crc(goal)+'/mes</span></div><div class="bar"><i style="width:'+pg+'%"></i></div>'
   +'<p class="mute small" style="margin:8px 0 0">'+(need?"Faltan unos <b>"+need+"</b> cliente"+(need===1?"":"s")+" de pago (promedio "+crc(avg)+"/mes).":"¡Meta cumplida! 🎉")+'</p></div>';
  // cobrado por mes
  var now=new Date(),months=[],mx=1;for(var i=5;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1),e=new Date(d.getFullYear(),d.getMonth()+1,1);
    var tot=PAYS.filter(function(p){return p.at>=d.getTime()&&p.at<e.getTime()}).reduce(function(a,p){return a+(+p.amt||0)},0);months.push([MN[d.getMonth()],tot]);mx=Math.max(mx,tot)}
  h+='<div class="card"><h2>Cobrado por mes</h2><div class="bars">'+months.map(function(m){return '<div class="br"><span class="mute">'+m[0]+'</span><div class="bar"><i style="width:'+Math.round(m[1]*100/mx)+'%"></i></div><b style="text-align:right">'+crc(m[1])+'</b></div>'}).join("")+'</div></div>';
  // embudo
  h+='<div class="card funnel"><h2>Embudo de registros</h2><p class="mute small" style="margin:0 0 4px">Personas que se registraron solas (últimos 30 días: <b>'+r30.length+'</b>).</p>'
   +fr("Se registraron",selfs.length,selfs.length)+fr("Hicieron 3+ primeros pasos",mid,selfs.length)+fr("Terminaron los primeros pasos",done,selfs.length)+fr("Pagan mensualidad",pay,Math.max(1,selfs.length))+'</div>';
  // por rescatar
  var low=selfs.filter(function(x){var st=state(x.s);return st==="trial"&&Date.now()-ms(x.b.created)>2*DAY&&stepsDone(x.b)<4}).sort(function(a,b){return stepsDone(a.b)-stepsDone(b.b)});
  h+='<div class="card"><h2 style="margin-bottom:2px">Cuentas por rescatar <span class="pill warn">'+low.length+'</span></h2><p class="mute small" style="margin:2px 0 6px">En prueba, con más de 2 días y menos de 4 primeros pasos hechos. Un mensaje a tiempo las salva.</p>'
   +(low.length?low.map(function(x){return '<div class="row2"><div class="m"><b>'+esc(x.b.name||"")+'</b><span>'+stepsDone(x.b)+'/6 pasos · se registró '+ago(ms(x.b.created))+'</span></div><div class="bt">'+(x.b.wa?'<button class="btn sm wa" data-m="msg" data-id="'+x.id+'">💬</button>':"")+'</div></div>'}).join(""):'<p class="mute small" style="margin:6px 0 0">Nadie atascado.</p>')+'</div>';
  $("t-met").innerHTML=h}
function fr(l,n,tot){return '<div class="fr"><div><span>'+l+'</span><b>'+n+' · '+pct(n,tot)+'</b></div><div class="bar"><i style="width:'+(tot?Math.round(n*100/tot):0)+'%"></i></div></div>'}
$("t-met").onclick=function(e){var x=e.target.closest("[data-m]");if(!x)return;var k=x.getAttribute("data-m");
  if(k==="msg"){openMsgs(x.getAttribute("data-id"));return}
  if(k==="goal"){var v=prompt("¿Cuánto querés ganar al mes con Citaly? (₡)",goalOf());if(v==null)return;v=Math.round(+String(v).replace(/[^\d]/g,""));if(!(v>0)){toast("Escribí un monto válido");return}
    db.doc("adm/_cfg").set({goal:v},{merge:true}).then(function(){toast("Meta guardada ✓")},function(er){toast(er.message)})}};

/* ---------- PROSPECTOS ---------- */
function pitch(l){var n=l.name||"su negocio";return "Hola, ¿qué tal? 👋 Vi "+n+" y noté que las citas las llevan por chat. Armé Citaly: un sistema de reservas para negocios de carros donde sus clientes agendan solos desde un link, con recordatorios automáticos por WhatsApp. Tiene prueba gratis de "+(C.trialDays||7)+" días, sin tarjeta. ¿Le muestro cómo se vería para "+n+"? 🚗 citalyapp.com"}
function needsFu(l){return l.st==="escrito"&&Date.now()-ms(l.upd||l.at)>2*DAY}
function rPro(){var cnt={todos:LEADS.length};ST.forEach(function(k){cnt[k]=LEADS.filter(function(l){return l.st===k}).length});var fu=followUps();
  var h='<div class="card"><h2>Nuevo prospecto</h2><label for="lN">Negocio</label><input id="lN" maxlength="60" placeholder="Ej: Lavacar El Brillo"><div class="grid2"><div><label for="lW">WhatsApp</label><input id="lW" inputmode="tel" maxlength="15" placeholder="8888 8888"></div><div><label for="lT">Nota</label><input id="lT" maxlength="120" placeholder="Ej: lo vi en Instagram"></div></div><div style="height:10px"></div><button class="btn" data-p="add">+ Guardar prospecto</button></div>'
   +'<div class="chips" id="lf" style="margin:12px 0">'+["todos"].concat(ST).map(function(k){return '<button class="chip" data-f2="'+k+'" aria-pressed="'+(LF===k)+'">'+(k==="todos"?"Todos":STN[k])+' '+cnt[k]+'</button>'}).join("")+'</div>'
   +(fu?'<p class="small" style="margin:0 0 8px"><b>'+fu+'</b> para dar seguimiento (escritos hace más de 2 días sin respuesta).</p>':"");
  var L=LEADS.filter(function(l){return LF==="todos"||l.st===LF}).sort(function(a,b){return (needsFu(b)-needsFu(a))||(ms(b.upd||b.at)-ms(a.upd||a.at))});
  h+=L.length?L.map(function(l){return '<div class="biz"><div class="hd"><div class="m"><b>'+esc(l.name||"")+'</b><span>'+esc(l.wa||"sin WhatsApp")+' · '+ago(ms(l.upd||l.at))+'</span></div><span class="pill '+(l.st==="cerrado"?"ok":l.st==="perdido"?"bad":"warn")+'">'+STN[l.st||"nuevo"]+'</span></div>'
    +(l.note?'<p class="note">'+esc(l.note)+'</p>':"")+(needsFu(l)?'<p class="small" style="margin:8px 0 0;color:var(--bad)"><b>Dar seguimiento</b></p>':"")
    +'<div class="ac">'+(l.wa?'<button class="btn sm wa" data-p="wa" data-id="'+l.id+'">💬 Escribir</button>':"")+'<button class="btn sm" data-p="next" data-id="'+l.id+'">'+nextLabel(l)+'</button><button class="btn sm ghost" data-p="st" data-id="'+l.id+'">Estado</button><button class="btn sm ghost" data-p="note" data-id="'+l.id+'">📝</button><button class="btn sm danger" data-p="del" data-id="'+l.id+'">🗑️</button></div></div>'}).join(""):'<div class="card mute" style="text-align:center">Todavía no hay prospectos aquí.</div>';
  $("t-pro").innerHTML=h}
function nextLabel(l){var i=ST.indexOf(l.st||"nuevo");return i>=3?"Marcar cerrado":"→ "+STN[ST[i+1]]}
function leadById(id){return LEADS.filter(function(l){return l.id===id})[0]}
function setLead(id,o){o.upd=Date.now();return db.doc("leads/"+id).set(o,{merge:true}).catch(function(er){toast(er.message)})}
$("t-pro").onclick=function(e){var f=e.target.closest("[data-f2]");if(f){LF=f.getAttribute("data-f2");rPro();return}
  var x=e.target.closest("[data-p]");if(!x)return;var k=x.getAttribute("data-p"),id=x.getAttribute("data-id"),l=id?leadById(id):null;
  if(k==="add"){var n=$("lN").value.trim();if(!n){toast("Escribí el nombre del negocio");return}var w=$("lW").value.trim();
    db.collection("leads").add({name:n.slice(0,60),wa:w,note:$("lT").value.trim().slice(0,120),st:"nuevo",at:Date.now(),upd:Date.now()}).then(function(){toast("Prospecto guardado ✓")},function(er){toast(er.message)});return}
  if(!l)return;
  if(k==="wa"){goWa(waUrl(l.wa,pitch(l)));if(l.st==="nuevo")setLead(id,{st:"escrito"});return}
  if(k==="next"){var i=ST.indexOf(l.st||"nuevo");setLead(id,{st:i>=3?"cerrado":ST[i+1]});return}
  if(k==="st"){var o=sheet("Estado de "+esc(l.name||""),ST.map(function(s){return '<button class="btn alt" data-s="'+s+'">'+STN[s]+'</button>'}).join(""));
    o.addEventListener("click",function(ev){var y=ev.target.closest("[data-s]");if(!y)return;setLead(id,{st:y.getAttribute("data-s")});o.remove()});return}
  if(k==="note"){var v=prompt("Nota sobre "+(l.name||"este prospecto"),l.note||"");if(v!=null)setLead(id,{note:v.trim().slice(0,120)});return}
  if(k==="del"&&confirm("¿Borrar a "+(l.name||"este prospecto")+"?"))db.doc("leads/"+id).delete().catch(function(er){toast(er.message)})};

/* ---------- REPORTE ---------- */
var TYPEN={setup:"Instalación",saldo:"Saldo",mes:"Mensualidad"};
function typeOf(p){return TYPEN[p.type]||p.what||"Extra"}
function monthRange(v){var p=String(v||"").split("-"),y=+p[0],m=+p[1]-1;return [new Date(y,m,1).getTime(),new Date(y,m+1,1).getTime()]}
function rRep(){var cur=($("rM")&&$("rM").value)||(new Date().getFullYear()+"-"+pad(new Date().getMonth()+1)),r=monthRange(cur);
  var L=PAYS.filter(function(p){return p.at>=r[0]&&p.at<r[1]}).sort(function(a,b){return a.at-b.at}),tot=L.reduce(function(a,p){return a+(+p.amt||0)},0),by={};
  L.forEach(function(p){var k=typeOf(p);by[k]=(by[k]||0)+(+p.amt||0)});
  var h='<div class="card"><h2>Reporte para el contador</h2><label for="rM">Mes</label><input id="rM" type="month" value="'+cur+'"><div style="height:10px"></div>'
   +'<div class="grid2"><button class="btn" data-r="mes">⬇️ Descargar este mes</button><button class="btn alt" data-r="all">⬇️ Descargar todo</button></div>'
   +'<p class="mute small" style="margin:10px 0 0">Se baja como archivo para Excel (separado por punto y coma). Los cobros con tarjeta que cobra Polar vienen en dólares; si ya los registraste aquí se muestran en colones. Para IVA y facturación, consultá con tu contador.</p></div>'
   +'<div class="kpi big" style="margin-bottom:10px"><span>Total del mes</span><b>'+crc(tot)+'</b></div>'
   +(Object.keys(by).length?'<div class="card"><h2>Por tipo</h2>'+Object.keys(by).map(function(k){return '<div class="li"><span>'+esc(k)+'</span><b>'+crc(by[k])+'</b></div>'}).join("")+'</div>':"")
   +'<div class="card"><h2>Pagos ('+L.length+')</h2>'+(L.length?L.map(function(p){return '<div class="li"><span>'+esc(p.name||"")+' <span class="pill">'+esc(typeOf(p))+'</span><br><span class="mute small">'+fd(p.at)+(p.src==="polar"?" · Polar":"")+'</span></span><b>'+crc(p.amt)+'</b></div>'}).join(""):'<p class="mute small" style="margin:0">No hay pagos este mes.</p>')+'</div>';
  $("t-rep").innerHTML=h}
function repCsv(list){return csv([["Fecha","Negocio","Tipo","Detalle","Monto (CRC)","Monto (USD)","Origen"]].concat(list.sort(function(a,b){return a.at-b.at}).map(function(p){var d=new Date(p.at);
  return [d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()),p.name||"",typeOf(p),p.what||"",Math.round(+p.amt||0),p.usd!=null?p.usd:"",p.src==="polar"?"Polar":"Manual"]})))}
$("t-rep").onchange=function(e){if(e.target.id==="rM")rRep()};
$("t-rep").onclick=function(e){var x=e.target.closest("[data-r]");if(!x)return;
  if(x.getAttribute("data-r")==="mes"){var v=$("rM").value,r=monthRange(v);download("citaly-pagos-"+v+".csv",repCsv(PAYS.filter(function(p){return p.at>=r[0]&&p.at<r[1]})))}
  else download("citaly-pagos-todo.csv",repCsv(PAYS.slice()))};

/* ---------- Negocios: notas, etiquetas, plan/fecha, mensajes ---------- */
function decorate(){var cards=document.querySelectorAll("#list .biz");Array.prototype.forEach.call(cards,function(c){var e=c.querySelector(".ac [data-id]");if(!e)return;var id=e.getAttribute("data-id"),a=ADM[id]||{},ac=c.querySelector(".ac");
  if(c.querySelector(".exx"))return;var ex=document.createElement("div");ex.className="exx";
  ex.innerHTML=((a.tags||[]).length?'<div>'+a.tags.map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join("")+'</div>':"")+(a.note?'<p class="note">📝 '+esc(a.note)+'</p>':"");
  ac.parentNode.insertBefore(ex,ac);
  var s=SUBS[id],h='<button class="btn sm ghost" data-x="note" data-id="'+id+'">📝 Nota</button><button class="btn sm ghost" data-x="tag" data-id="'+id+'">🏷️ Etiquetas</button>'
    +(s&&!s.demo?'<button class="btn sm ghost" data-x="pf" data-id="'+id+'">📆 Plan / fecha</button>':"")+'<button class="btn sm ghost" data-x="msg" data-id="'+id+'">💬 Mensajes</button><button class="btn sm danger" data-x="del" data-id="'+id+'">🗑️ Eliminar</button>';
  ac.insertAdjacentHTML("beforeend",h)})}
function saveAdm(id,o){return db.doc("adm/"+id).set(o,{merge:true}).then(function(){toast("Guardado ✓")},function(er){toast(er.message)})}
function parseDate(v){v=String(v||"").trim();var m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)||null,d;
  if(m)d=new Date(+m[1],+m[2]-1,+m[3],23,59);else{m=v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);if(!m)return 0;d=new Date(+m[3],+m[2]-1,+m[1],23,59)}
  return isNaN(d.getTime())?0:d.getTime()}
$("list").addEventListener("click",function(e){var x=e.target.closest("[data-x]");if(!x)return;var k=x.getAttribute("data-x"),id=x.getAttribute("data-id"),b=BIZ[id]||{},a=ADM[id]||{},s=SUBS[id];
  if(k==="msg"){openMsgs(id);return}
  if(k==="del"){delBiz(id);return}
  if(k==="note"){var v=prompt("Nota privada sobre "+(b.name||"este negocio")+" (solo la ves vos)",a.note||"");if(v!=null)saveAdm(id,{note:v.trim().slice(0,300)});return}
  if(k==="tag"){var t=prompt("Etiquetas separadas por coma (ej: lavacar, vip, moroso)",(a.tags||[]).join(", "));if(t==null)return;
    saveAdm(id,{tags:t.split(",").map(function(z){return z.trim().toLowerCase().slice(0,20)}).filter(Boolean).slice(0,8)});return}
  if(k==="pf"&&s){var TK=["arranque","turbo","nitro"],cur=Math.max(0,TK.indexOf(s.tier||"arranque"))+1,
      q=prompt("Plan de "+(b.name||"")+"\n"+TK.map(function(z,i){return (i+1)+" = "+C.plans[z].n}).join("\n")+"\n(Cancelar = no cambiar)",cur);if(q==null)return;
    var tk=TK[Math.min(2,Math.max(0,(+q||cur)-1))],cd=untilMs(s),f=prompt("Activo hasta (AAAA-MM-DD o DD/MM/AAAA).\nHoy está hasta el "+(cd?fd(cd):"—")+". Vacío = no cambiar.","");if(f==null)return;
    var o={tier:tk};if(f.trim()){var t2=parseDate(f);if(!t2){toast("Fecha no válida");return}o.until=TS.fromMillis(t2)}
    db.doc("subs/"+id).set(o,{merge:true}).then(function(){toast("Plan actualizado ✓")},function(er){toast(er.message)})}});

/* ---------- eliminar negocios (y todas sus demos) ---------- */
function wipeCol(path){return db.collection(path).get().then(function(s){var ds=s.docs.slice(),run=function(){if(!ds.length)return Promise.resolve();var bt=db.batch();ds.splice(0,400).forEach(function(d){bt.delete(d.ref||db.doc(path+"/"+d.id))});return bt.commit().then(run)};return run()})}
function wipe(id){var b=BIZ[id]||{},slug=b.slug,subs=["jobs","slots","holds","mine","exp"],mails=[];
  [b.email].concat(b.team||[]).forEach(function(m){m=String(m||"").toLowerCase();if(m&&mails.indexOf(m)<0)mails.push(m)});
  return Promise.all(subs.map(function(c){return wipeCol("biz/"+id+"/"+c)}))
   .then(function(){return slug?wipeCol("pub/"+slug+"/fotos"):0})
   .then(function(){return Promise.all(mails.map(function(m){return db.doc("own/"+m).get().then(function(d){return d.exists&&d.data().biz===id?db.doc("own/"+m).delete():0})}))})
   .then(function(){var bt=db.batch();if(slug)bt.delete(db.doc("pub/"+slug));bt.delete(db.doc("subs/"+id));bt.delete(db.doc("adm/"+id));bt.delete(db.doc("biz/"+id));return bt.commit()})}
function delBiz(id){var b=BIZ[id]||{},nm=b.name||"este negocio";
  var v=prompt("Vas a ELIMINAR "+nm+" con sus citas, clientes y página. No se puede deshacer.\nLos pagos registrados se conservan para tu reporte.\n\nEscribí BORRAR para confirmar:");
  if(v==null)return;if(v.trim().toUpperCase()!=="BORRAR"){toast("No se eliminó (escribí BORRAR)");return}
  toast("Eliminando…");wipe(id).then(function(){toast("Eliminado ✓")},function(e){toast("No se pudo: "+e.message)})}
function delDemos(){var ids=rowsOf().filter(function(x){return x.s&&x.s.demo}).map(function(x){return x.id});
  if(!ids.length){toast("No hay demos");return}
  var v=prompt("Vas a ELIMINAR "+ids.length+" cuenta"+(ids.length===1?"":"s")+" demo con todos sus datos. No se puede deshacer.\n\nEscribí BORRAR para confirmar:");
  if(v==null)return;if(v.trim().toUpperCase()!=="BORRAR"){toast("No se eliminó (escribí BORRAR)");return}
  toast("Eliminando "+ids.length+"…");ids.reduce(function(p,id){return p.then(function(){return wipe(id)})},Promise.resolve()).then(function(){toast("Demos eliminadas ✓")},function(e){toast("No se pudo: "+e.message)})}
function demoBar(){var l=$("list");if(!l||document.getElementById("demoBar"))return;if(F!=="demo")return;
  var d=document.createElement("button");d.id="demoBar";d.className="btn danger";d.style.marginBottom="10px";d.textContent="🗑️ Eliminar todas las demos";d.onclick=delDemos;l.parentNode.insertBefore(d,l)}

/* ---------- enganche con el script principal ---------- */
var _listen=listen,_render=render,_rp=renderPays;
listen=function(){var fresh=!listening;_listen();if(!fresh)return;
  db.collection("adm").onSnapshot(function(s){ADM={};s.forEach(function(d){ADM[d.id]=d.data()});render()},function(e){console.error(e)});
  db.collection("leads").onSnapshot(function(s){LEADS=s.docs.map(function(d){var x=d.data();x.id=d.id;return x});renderTab()},function(e){console.error(e)})};
render=function(){_render();var o=document.getElementById('demoBar');if(o&&F!=='demo')o.remove();decorate();demoBar();renderTab()};
renderPays=function(){_rp();renderTab()};
})();


/* ---------- RESPUESTAS RAPIDAS (copiar y pegar) ---------- */
var RQ="";
function rcrc(n){return "\u20a1"+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,".")}
function respBase(){var C=CITALY,P=C.plans,PM=C.monthly.promoMonths,PR=rcrc(C.monthly.promo),S="https://citalyapp.com/app/",T=C.trialDays||7;
  return [
  ["Lo b\u00e1sico","\u00bfQu\u00e9 es Citaly?","Citaly es una app para que tu negocio reciba reservas solo, las 24 horas. Tus clientes entran a tu link, eligen servicio, d\u00eda y hora, y la cita te llega a la agenda. As\u00ed dej\u00e1s de contestar mil mensajes para agendar \ud83d\udcc5 Pod\u00e9s verla aqu\u00ed: "+S],
  ["Lo b\u00e1sico","\u00bfC\u00f3mo funciona?","Es muy sencillo:\n1\ufe0f\u20e3 Te registr\u00e1s y eleg\u00eds tu tipo de negocio (ya viene con servicios de ejemplo).\n2\ufe0f\u20e3 Ajust\u00e1s tus precios, horario y fotos.\n3\ufe0f\u20e3 Compart\u00eds tu link de reservas por WhatsApp, Instagram o donde quieras.\n4\ufe0f\u20e3 Tus clientes reservan solos y vos ves todo en tu agenda, con sus datos y su historial.\nNo ten\u00e9s que instalar nada raro: se usa desde el celular como cualquier app."],
  ["Lo b\u00e1sico","\u00bfPara qu\u00e9 tipo de negocio sirve?","Est\u00e1 pensada sobre todo para negocios de carros (lavacar, detailing, pulido, polarizado, taller), pero tambi\u00e9n funciona para barber\u00edas, salones, u\u00f1as, spa y consultorios. Cada tipo ya trae sus servicios e \u00edconos listos para que arranqu\u00e9s r\u00e1pido."],
  ["Lo b\u00e1sico","\u00bfNecesito instalar algo o saber de tecnolog\u00eda?","No. Se usa desde el navegador del celular y la pod\u00e9s guardar en la pantalla de inicio como una app. Adem\u00e1s todo es guiado paso a paso y viene prearmado, as\u00ed que no ten\u00e9s que configurar desde cero."],
  ["Lo b\u00e1sico","\u00bfMis clientes tienen que descargar una app?","No. Tus clientes solo abren tu link, reservan en un minuto y listo. Sin descargar nada ni crear cuenta."],
  ["Lo b\u00e1sico","\u00bfPuedo ver c\u00f3mo se ve antes de pagar?","S\u00ed \ud83d\ude4c Ten\u00e9s "+T+" d\u00edas de prueba gratis para usarla con todas las funciones. Te registr\u00e1s vos solo aqu\u00ed: "+S],
  ["Precios","\u00bfCu\u00e1nto cuesta?","Tenemos 3 planes:\n\ud83d\ude97 "+P.arranque.n+": "+rcrc(P.arranque.crc)+"/mes (para quien trabaja solo)\n\u26a1 "+P.turbo.n+": "+rcrc(P.turbo.crc)+"/mes (negocios con equipo)\n\ud83d\ude80 "+P.nitro.n+": "+rcrc(P.nitro.crc)+"/mes (para crecer en serio)\nY Arranque tiene promo: los primeros "+PM+" meses pag\u00e1s solo "+PR+" al mes."],
  ["Precios","\u00bfQu\u00e9 incluye el plan Arranque?","Incluye: sitio de reservas 24/7 con precio por veh\u00edculo, agenda por d\u00eda y semana, hasta "+P.arranque.svcMax+" servicios, clientes con el historial de cada carro, recordatorios por WhatsApp con un toque y tu propia p\u00e1gina web que vos edit\u00e1s. Cuesta "+rcrc(P.arranque.crc)+"/mes (los primeros "+PM+" meses "+PR+")."],
  ["Precios","\u00bfCu\u00e1l es la diferencia entre Arranque, Turbo y Nitro?","\u2022 "+P.arranque.n+": para trabajar solo, lo esencial para recibir reservas.\n\u2022 "+P.turbo.n+": suma equipo (hasta "+P.turbo.staff+" personas), hasta "+P.turbo.svcMax+" servicios, varios clientes a la misma hora, m\u00e1s estilos de p\u00e1gina y adelanto por SINPE para asegurar la reserva.\n\u2022 "+P.nitro.n+": todo lo anterior, equipo ilimitado, todos los estilos de p\u00e1gina, control de insumos y el asistente con IA con 30 usos al d\u00eda.\nPod\u00e9s empezar en Arranque y subir cuando lo necesit\u00e9s."],
  ["Precios","\u00bfLa promo de "+PR+" es para todos los planes?","La promo de "+PR+" al mes por los primeros "+PM+" meses es solo para el plan Arranque. Turbo y Nitro se pagan completos desde el primer mes. Despu\u00e9s de los "+PM+" meses, Arranque pasa a "+rcrc(P.arranque.crc)+"/mes."],
  ["Precios","\u00bfTengo que pagar algo para empezar?","No. La prueba de "+T+" d\u00edas es gratis, te registr\u00e1s sin pagar nada. Si te gusta, eleg\u00eds tu plan y segu\u00eds."],
  ["Pagos","\u00bfC\u00f3mo se paga?","Pod\u00e9s pagar con tarjeta (desde cualquier pa\u00eds) o por SINPE M\u00f3vil. Si es SINPE, me mand\u00e1s el comprobante por WhatsApp y te activo el plan."],
  ["Pagos","Datos para pagar por SINPE","SINPE M\u00f3vil: "+C.sinpe+" a nombre de "+C.sinpeName+". Cuando pag\u00e9s, mandame el comprobante por este mismo chat con el nombre de tu negocio y te activo el plan apenas lo vea \u2705"],
  ["Pagos","\u00bfCobran por cada reserva?","No. Pag\u00e1s solo tu mensualidad del plan, sin comisi\u00f3n por cita ni por cliente."],
  ["Reservas y clientes","\u00bfC\u00f3mo reservan mis clientes?","Les mand\u00e1s tu link (por WhatsApp, Instagram, Facebook, en tu bio\u2026). Ah\u00ed eligen servicio, d\u00eda y hora libre y confirman con su nombre y n\u00famero. La cita aparece en tu agenda y te avisa."],
  ["Reservas y clientes","\u00bfC\u00f3mo me avisa cuando entra una reserva?","Te llega el aviso en el celular (y, si lo activ\u00e1s, tambi\u00e9n por correo). Pod\u00e9s activar las notificaciones desde Ajustes y la app te ayuda paso a paso, incluso en iPhone y Huawei."],
  ["Reservas y clientes","Mis precios cambian seg\u00fan el tama\u00f1o del veh\u00edculo","\u00a1Claro! Eso ya lo trae la app, solo hay que configurarlo en 2 pasos \ud83d\ude4c\n1\ufe0f\u20e3 Entr\u00e1 a Ajustes \u2192 Tipos de veh\u00edculo y ponele a cada tipo cu\u00e1nto suma sobre el precio de sed\u00e1n. Ejemplo: Sed\u00e1n vac\u00edo (precio base), SUV \u20a13.000, Pick-up \u20a15.000, 4x4 \u20a16.000. Guard\u00e1.\n2\ufe0f\u20e3 Entr\u00e1 a Servicios y precios y, en cada servicio que cambie por tama\u00f1o, marc\u00e1 la casilla \ud83d\ude99 El precio cambia seg\u00fan el veh\u00edculo. Guard\u00e1.\nAs\u00ed tu cliente elige su veh\u00edculo al reservar y ve el precio correcto. No hace falta crear un servicio por cada veh\u00edculo. Si me pas\u00e1s tus precios por tama\u00f1o, te lo dejo listo yo."],
  ["Reservas y clientes","\u00bfPuedo cobrar un adelanto para asegurar la cita?","S\u00ed, con el plan Turbo o Nitro pod\u00e9s pedir un adelanto por SINPE al reservar para que no te dejen botado."],
  ["Reservas y clientes","\u00bfPuedo ponerle mis precios, fotos y logo?","S\u00ed. Cambi\u00e1s servicios, precios, duraciones, horario, fotos de tus trabajos, rese\u00f1as, preguntas frecuentes y tu logo cuando quer\u00e9s, vos solo, sin depender de nadie."],
  ["Reservas y clientes","\u00bfQu\u00e9 pasa si el cliente quiere cambiar o cancelar?","Cuando reserva recibe un link para cambiar o cancelar su cita solo hasta 12 horas antes, y vos ves el cambio en tu agenda."],
  ["Reservas y clientes","\u00bfFunciona con varios empleados?","S\u00ed. Turbo incluye hasta "+P.turbo.staff+" personas de equipo y Nitro es ilimitado."],
  ["Dudas comunes","Ya uso otro sistema (AgendaPro, etc.)","Te entiendo. Citaly hace lo mismo pero m\u00e1s sencillo y mucho m\u00e1s barato (desde "+PR+" los primeros "+PM+" meses), y est\u00e1 hecho para negocios de aqu\u00ed. Prob\u00e1la "+T+" d\u00edas gratis y compar\u00e1s vos mismo, sin compromiso."],
  ["Dudas comunes","No tengo tiempo para configurarla","Justamente por eso existe: ya viene prearmada seg\u00fan tu tipo de negocio. En 10 minutos dej\u00e1s listo tu link. Y si te atascás, escribime por WhatsApp y te ayudo."],
  ["Dudas comunes","Me da pena / no soy bueno con la tecnología","Tranquilo \ud83d\ude0a Est\u00e1 hecha para que cualquiera la use desde el celular, paso a paso. Y cualquier duda me escrib\u00eds y te ayudo."],
  ["Dudas comunes","\u00bfPuedo cancelar cuando quiera?","Pod\u00e9s dejar de usarla cuando quer\u00e1s, y mientras tanto tus datos siguen guardados en tu cuenta. Cualquier duda sobre tu plan escribime y lo resolvemos."],
  ["Dudas comunes","\u00bfMis datos y los de mis clientes est\u00e1n seguros?","S\u00ed. Todo se guarda en tu cuenta y solo vos, tu equipo y el soporte de Citaly tienen acceso a tus clientes y tu agenda."],
  ["Soporte","\u00bfC\u00f3mo la instalo en el celular?","Abr\u00ed "+S+" en el navegador. En Android: men\u00fa \u22ee \u2192 \u00abInstalar app\u00bb. En iPhone (Safari): bot\u00f3n compartir \u2192 \u00abAgregar a pantalla de inicio\u00bb. Queda con su \u00edcono como cualquier app."],
  ["Soporte","\u00bfC\u00f3mo creo mi cuenta?","Entr\u00e1 a https://citalyapp.com, toc\u00e1 el bot\u00f3n para empezar gratis, eleg\u00ed tu tipo de negocio y entr\u00e1 con tu correo, Google o Facebook. La app te va guiando."],
  ["Soporte","No me llegan los avisos de reservas","Revis\u00e1 en Ajustes \u2192 Notificaciones que est\u00e9n activadas y que el celular permita notificaciones para la app. Si segu\u00eds sin recibirlas escribime por WhatsApp con el modelo de tu celular y lo arreglamos."]
  ]}
function respMine(){try{return JSON.parse(localStorage.getItem("cz_resp")||"[]")}catch(e){return[]}}
function respSave(a){try{localStorage.setItem("cz_resp",JSON.stringify(a))}catch(e){toast("No se pudo guardar en este navegador")}}
function rResp(force){var fm=$("rForm");if(!force&&fm&&!fm.hidden)return;var base=respBase().map(function(x){return {g:x[0],q:x[1],a:x[2]}}),mine=respMine().map(function(x,i){return {g:"Mis respuestas",q:x.q,a:x.a,own:i}}),all=mine.concat(base),
  L=all.map(function(x){return [x,RQ?CITALY.fz(RQ,x.q+" "+x.g+" "+x.a):1]}).filter(function(x){return x[1]>0});
  if(RQ)L.sort(function(a,b){return b[1]-a[1]});
  var h='<input id="rq" type="search" placeholder="Buscar pregunta: precio, sinpe, instalar\u2026" value="'+esc(RQ)+'" style="margin:0 0 12px"><button class="btn ghost" id="rNew" style="margin-bottom:12px">+ Agregar mi propia respuesta</button><div id="rForm" hidden class="card" style="margin-bottom:12px"><label>Pregunta</label><input id="rfQ" maxlength="80"><label>Respuesta (lo que se copia)</label><textarea id="rfA" rows="5" maxlength="1200"></textarea><button class="btn" id="rSave" style="margin-top:8px">Guardar</button></div>';
  var last="";
  if(!L.length)h+='<p class="mute">No encontr\u00e9 esa pregunta. Prob\u00e1 con otra palabra.</p>';
  L.forEach(function(x){var o=x[0],i=all.indexOf(o);if(!RQ&&o.g!==last){h+='<h3 style="margin:16px 0 8px">'+esc(o.g)+'</h3>';last=o.g}
    h+='<div class="card" style="margin-bottom:10px"><b>'+esc(o.q)+'</b><p style="white-space:pre-wrap;margin:6px 0 10px;line-height:1.5;font-size:14px">'+esc(o.a)+'</p><button class="btn" data-rc="'+i+'">\ud83d\udccb Copiar respuesta</button>'+(o.own!=null?' <button class="btn ghost" data-rd="'+o.own+'" style="margin-top:6px">Borrar</button>':'')+'</div>'});
  $("t-resp").innerHTML=h;window.__rall=all;var q=$("rq");if(RQ){q.focus();q.setSelectionRange(RQ.length,RQ.length)}}
function copyTxt(t){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);return new Promise(function(ok,no){var a=document.createElement("textarea");a.value=t;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();try{document.execCommand("copy")?ok():no()}catch(e){no(e)}a.remove()})}
$("t-resp").addEventListener("input",function(e){if(e.target.id==="rq"){RQ=e.target.value;rResp(true)}});
$("t-resp").addEventListener("click",function(e){var c=e.target.closest("[data-rc]"),d=e.target.closest("[data-rd]");
  if(c){var o=window.__rall[+c.dataset.rc];copyTxt(o.a).then(function(){toast("Copiado \u2705 Peg\u00e1lo en WhatsApp")}).catch(function(){toast("No se pudo copiar, seleccion\u00e1 el texto")});return}
  if(d){var a=respMine();a.splice(+d.dataset.rd,1);respSave(a);rResp(true);return}
  if(e.target.id==="rNew"){$("rForm").hidden=!$("rForm").hidden;return}
  if(e.target.id==="rSave"){var q=$("rfQ").value.trim(),t=$("rfA").value.trim();if(!q||!t){toast("Escrib\u00ed la pregunta y la respuesta");return}var m=respMine();m.unshift({q:q,a:t});respSave(m);rResp(true);toast("Guardada")}});
