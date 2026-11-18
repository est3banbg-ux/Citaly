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
  o.addEventListener("click",function(e){var x=e.target.closest("[data-i]");if(!x)return;window.open(waUrl(b.wa,L[+x.getAttribute("data-i")][1]),"_blank");o.remove()})}

/* ---------- pestañas ---------- */
var TABS={neg:"Negocios",cob:"Cobros",met:"Métricas",pro:"Prospectos",rep:"Reporte"};
function cobrosList(){var out={late:[],soon:[],trialEnd:[],trialLate:[],ok:0};
  rowsOf().forEach(function(x){var s=x.s;if(!s||s.demo||s.status==="suspended"||!monthly(s))return;var d=daysTo(untilMs(s)),o={id:x.id,b:x.b,s:s,d:d};
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
function renderTab(){badge();if(TAB==="cob")rCob();else if(TAB==="met")rMet();else if(TAB==="pro")rPro();else if(TAB==="rep")rRep()}

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
  if(k==="wa"){window.open(waUrl(l.wa,pitch(l)),"_blank");if(l.st==="nuevo")setLead(id,{st:"escrito"});return}
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
    +(s&&!s.demo?'<button class="btn sm ghost" data-x="pf" data-id="'+id+'">📆 Plan / fecha</button>':"")+'<button class="btn sm ghost" data-x="msg" data-id="'+id+'">💬 Mensajes</button>';
  ac.insertAdjacentHTML("beforeend",h)})}
function saveAdm(id,o){return db.doc("adm/"+id).set(o,{merge:true}).then(function(){toast("Guardado ✓")},function(er){toast(er.message)})}
function parseDate(v){v=String(v||"").trim();var m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)||null,d;
  if(m)d=new Date(+m[1],+m[2]-1,+m[3],23,59);else{m=v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);if(!m)return 0;d=new Date(+m[3],+m[2]-1,+m[1],23,59)}
  return isNaN(d.getTime())?0:d.getTime()}
$("list").addEventListener("click",function(e){var x=e.target.closest("[data-x]");if(!x)return;var k=x.getAttribute("data-x"),id=x.getAttribute("data-id"),b=BIZ[id]||{},a=ADM[id]||{},s=SUBS[id];
  if(k==="msg"){openMsgs(id);return}
  if(k==="note"){var v=prompt("Nota privada sobre "+(b.name||"este negocio")+" (solo la ves vos)",a.note||"");if(v!=null)saveAdm(id,{note:v.trim().slice(0,300)});return}
  if(k==="tag"){var t=prompt("Etiquetas separadas por coma (ej: lavacar, vip, moroso)",(a.tags||[]).join(", "));if(t==null)return;
    saveAdm(id,{tags:t.split(",").map(function(z){return z.trim().toLowerCase().slice(0,20)}).filter(Boolean).slice(0,8)});return}
  if(k==="pf"&&s){var TK=["arranque","turbo","nitro"],cur=Math.max(0,TK.indexOf(s.tier||"arranque"))+1,
      q=prompt("Plan de "+(b.name||"")+"\n"+TK.map(function(z,i){return (i+1)+" = "+C.plans[z].n}).join("\n")+"\n(Cancelar = no cambiar)",cur);if(q==null)return;
    var tk=TK[Math.min(2,Math.max(0,(+q||cur)-1))],cd=untilMs(s),f=prompt("Activo hasta (AAAA-MM-DD o DD/MM/AAAA).\nHoy está hasta el "+(cd?fd(cd):"—")+". Vacío = no cambiar.","");if(f==null)return;
    var o={tier:tk};if(f.trim()){var t2=parseDate(f);if(!t2){toast("Fecha no válida");return}o.until=TS.fromMillis(t2)}
    db.doc("subs/"+id).set(o,{merge:true}).then(function(){toast("Plan actualizado ✓")},function(er){toast(er.message)})}});

/* ---------- enganche con el script principal ---------- */
var _listen=listen,_render=render,_rp=renderPays;
listen=function(){var fresh=!listening;_listen();if(!fresh)return;
  db.collection("adm").onSnapshot(function(s){ADM={};s.forEach(function(d){ADM[d.id]=d.data()});render()},function(e){console.error(e)});
  db.collection("leads").onSnapshot(function(s){LEADS=s.docs.map(function(d){var x=d.data();x.id=d.id;return x});renderTab()},function(e){console.error(e)})};
render=function(){_render();decorate();renderTab()};
renderPays=function(){_rp();renderTab()};
})();
