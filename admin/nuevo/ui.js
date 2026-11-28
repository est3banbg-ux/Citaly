/* Citaly · admin nuevo — INTERFAZ.
   Va después de nucleo.js y antes de extra.js (extra.js envuelve render y renderPays, como en el clásico).
   Aquí solo se dibuja y se navega: todo lo que escribe en Firestore lo hacen las funciones del núcleo y de
   extra.js, llamadas tal cual (act() simula el toque en los mismos botones del clásico).
   Lecturas nuevas (siempre a pedido, nunca al cargar): uso real (≤50 citas al abrir una ficha), si existe
   pub/<link> (1 documento al abrir una ficha) y "Revisar links" en Más → Enlaces (1 documento por negocio). */
"use strict";
var UI=(function(){
var DAY=864e5,VIEWS=["hoy","negocios","plata","prospectos","mas"],B0=BIZ,S0=SUBS;
var R={v:"hoy",a:""},LAST="#hoy",CUR=null,OSIG={},KEEP=null,WANT=null,REOP=null,DIRTY=false,SIG="",OPEN={},PREV="",PEND=null,USE={},PUB={},CHK=false,SHOWP=false,HT=[];
var K={posp:"cz_adm_posp",sort:"cz_adm_sort",fot:"cz_adm_fotos",lnk:"cz_adm_links",f:"cz_adm_filtro"};
var DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function ls(k,d){try{var v=localStorage.getItem(k);if(v==null)return d;v=JSON.parse(v);
  if(d!==null&&typeof d==="object"){if(!v||typeof v!=="object"||Array.isArray(v)!==Array.isArray(d))return d}else if(typeof v!==typeof d)return d;return v}catch(e){return d}}
function has(o,k){return o!=null&&Object.prototype.hasOwnProperty.call(o,k)}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var FOT=ls(K.fot,{});if(!FOT||typeof FOT!=="object")FOT={};
/* Links que el clásico no reservaba y ya son páginas del sitio (las reglas de Firestore reservan los mismos). */
["para","descargar","android","tools"].forEach(function(x){if(RESERVED.indexOf(x)<0)RESERVED.push(x)});

/* ---------- utilidades ---------- */
function tms(x){return x&&x.toMillis?x.toMillis():(+x||0)}
function loaded(){return BIZ!==B0&&SUBS!==S0}
function cap(s){s=String(s||"");return s.charAt(0).toUpperCase()+s.slice(1)}
/* Fechas en la interfaz: siempre hora de Costa Rica (UTC-6, sin horario de verano), aunque la compu esté en otra zona.
   crD(ms) devuelve un Date que se lee con getUTC*. No cambia cómo se escriben las fechas en Firestore. */
var CRO=6*3600e3;
function crD(ms){return new Date((ms==null?Date.now():ms)-CRO)}
function crDay(ms){var d=crD(ms);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())}
function diasCal(ms){return Math.round((crDay(ms)-crDay(Date.now()))/DAY)}
function hoyLargo(){var d=crD();return cap(DIAS[d.getUTCDay()])+" "+d.getUTCDate()+" de "+MESES[d.getUTCMonth()]}
function diaCorto(ms){var d=crD(ms);return DIAS[d.getUTCDay()].slice(0,3)+" "+d.getUTCDate()+" "+MN[d.getUTCMonth()]}
function fdC(ms){var d=crD(ms);return d.getUTCDate()+" "+MN[d.getUTCMonth()]+" "+d.getUTCFullYear()}
function ymdC(ms){var d=crD(ms);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
function mesIni(){var d=crD();return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)+CRO}
function fdS(ymdS){var p=String(ymdS||"").split("-");return p.length===3?(+p[2])+" "+MN[(+p[1]-1)%12]:esc(ymdS)}
function imgSrc(u){u=safeImg(u);return /^\.\.\//.test(u)?"../"+u:u}
function ini(n){var w=String(n||"").trim().split(/\s+/).filter(Boolean),a=Array.from(w[0]||"?")[0]||"?",b=w[1]?Array.from(w[1])[0]||"":"";return (a+b).toUpperCase()}
function avHtml(b){var src=b&&b.logo?imgSrc(b.logo):"";return '<span class="a-av" aria-hidden="true">'+(src?'<img alt="" src="'+esc(src)+'">':esc(ini(b&&b.name)))+'</span>'}
function enc(s){return esc(encodeURIComponent(String(s||"")))}
function rowsAll(){return Object.keys(BIZ).map(function(i){return {id:i,s:SUBS[i]||null,b:BIZ[i]}})}
function saving(){var g=$("eGo");return !!(g&&g.disabled)}
function webUrl(slug){return (C.site||"https://citalyapp.com")+"/"+slug}
function resUrl(slug){return (C.site||"https://citalyapp.com")+"/r/?n="+encodeURIComponent(slug)+"&go=1"}
var ICO={wa:'<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg>',web:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  cal:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'};

/* ---------- misma lógica de estados y filtros que el admin clásico ---------- */
function pillOf(id){var s=SUBS[id]||null,st=state(s),tot=totalOf(s),paid=paidOf(id),due=Math.max(0,tot-paid),u=untilMs(s),dl=diasCal(u);
  return st==="demo"?["z","Demo"]:st==="trial"?(u>Date.now()?[dl<=3?"warn":"","Prueba · "+(dl<=0?"hoy":dl===1?"mañana":dl+" d")]:["bad","Prueba vencida"]):late(s)?["bad","Vencido"]:s&&s.plan==="mensual"&&st==="active"?["ok","Al día"]:st==="suspended"?["bad","Pausado"]:st==="none"?["bad","Sin plan"]:due>0?["warn","Saldo "+crc(due)]:["ok","Pagado"]}
function passF(f,x){var st=state(x.s);if(f==="late")return late(x.s);if(f==="owe")return st!=="demo"&&Math.max(0,totalOf(x.s)-paidOf(x.id))>0;return f==="all"||st===f}
function searchText(x){return [x.b.name,x.b.email,x.b.slug,x.b.wa,(x.b.team||[]).join(" "),(typeof ADM!=="undefined"&&ADM[x.id]?(ADM[x.id].tags||[]).join(" ")+" "+(ADM[x.id].note||""):"")].join(" ")}
function planTxt(b,s){var st=state(s);if(!s)return "Sin plan";if(s.demo)return "Demo (no se cobra)";
  return s.plan==="mensual"?(C.plans[s.tier||"arranque"]||{}).n+" · "+crc(s.price||0)+"/mes":s.plan==="trial"?"Prueba gratis"+(b&&b.self?" (se registró solo)":""):PLANS[s.plan]?PLANS[s.plan].n:(st==="active"?"Activo":"—")}

/* ---------- qué tan lista está (6 pasos, solo con lo que ya está cargado) ----------
   datos: nombre, tipo, WhatsApp (8+ dígitos) y link · servicios: al menos uno con nombre y precio > 0 ·
   horario: en los que se registraron solos, que lo hayan tocado (paso "hor" de la app o distinto del que trae el
   registro); en los creados por el admin, algún día abierto · logo · fotos: la cantidad solo se sabe al abrir la
   ficha (se recuerda en este aparato; si nunca se abrió, queda "sin saber") · textos: frase + descripción o "sobre nosotros". */
function defHours(h){return Array.isArray(h)&&h.length===7&&h.every(function(x,d){return x&&!!x.on===(d>=1&&d<=6)&&x.a==="08:00"&&x.b==="17:00"})}
function pasos(b,id){var hrs=b.hours||[],w=b.web||{},fo=FOT[id];
  return [{k:"datos",n:"Datos del negocio",v:"Completar",ok:!!(String(b.name||"").trim()&&b.type&&telN(b.wa).length>=8&&b.slug)},
    {k:"svc",n:"Servicios y precios",v:"Agregar",ok:(b.services||[]).some(function(s){return s&&String(s.n||"").trim()&&+s.p>0})},
    {k:"hor",n:"Horario",v:"Poner",ok:b.self?!!(b.onb&&b.onb.hor)||(hrs.some(function(h){return h&&h.on})&&!defHours(hrs)):hrs.some(function(h){return h&&h.on})},
    {k:"datos",n:"Logo",v:"Subir",ok:!!b.logo},
    {k:"fotos",n:"Fotos",v:"Subir",ok:fo==null?null:fo>0},
    {k:"web",n:"Textos de la página",v:"Escribir",ok:!!(String(b.tagline||"").trim()&&(String(b.blurb||"").trim()||String(w.about||"").trim()))}]}
function pgHtml(P){var k=P.filter(function(p){return p.ok}).length;return '<span class="a-pg" role="img" aria-label="Lista: '+k+' de 6 pasos">'+P.map(function(p){return '<i class="'+(p.ok?"k":p.ok===null?"u":"")+'"></i>'}).join("")+'</span>'}

/* ---------- acciones: los mismos botones del clásico ---------- */
function act(kind,k,id){var l=$("list"),b=document.createElement("button");b.hidden=true;b.setAttribute(kind==="a"?"data-a":"data-x",k);b.setAttribute("data-id",id);l.appendChild(b);try{b.click()}finally{b.remove()}}
function actP(k,id){var box=$("t-pro"),b=document.createElement("button");b.hidden=true;b.setAttribute("data-p",k);b.setAttribute("data-id",id);box.appendChild(b);try{b.click()}finally{b.remove()}}
function guard(){if(E&&DIRTY){toast("Primero guardá o descartá los cambios de la ficha");return false}return true}
function msgOf(id,n){var b=BIZ[id],s=SUBS[id];return b?AX.msgs(b,s)[n][1]:""}
function waGo(id,n){var b=BIZ[id];if(!b||!b.wa){toast("Este negocio no tiene WhatsApp guardado");return}AX.goWa(waUrl(b.wa,msgOf(id,n)))}
function copy(t,ok){copyTxt(t).then(function(){toast(ok||"Copiado ✓")},function(){toast("No se pudo copiar")})}

/* ---------- navegación por hash ---------- */
function parse(){var h=(location.hash||"").replace(/^#\/?/,"");try{h=decodeURIComponent(h)}catch(e){}h=h||"hoy";var i=h.indexOf("/");return {v:i<0?h:h.slice(0,i),a:i<0?"":h.slice(i+1)}}
function nav(h,replace){if(replace){history.replaceState(null,"",h);route()}else if(location.hash===h)route();else location.hash=h}
function dropEd(){E=null;CUR=null;DIRTY=false;SIG="";WANT=null;REOP=null;var ed=$("ed");ed.innerHTML="";ed.hidden=true;ed.classList.remove("dirty");$("split").classList.remove("ficha")}
function route(){var r=parse(),tgt=r.v==="negocio"?(r.a||"nuevo"):null;
  if(E){var same=tgt!=null&&((E.id&&tgt===E.id)||(!E.id&&tgt==="nuevo"));
    if(!same){if(DIRTY&&!confirm("Tenés cambios sin guardar en "+(E.name||"este negocio")+". ¿Salir sin guardar?")){history.replaceState(null,"",LAST);return}dropEd()}}
  if(tgt==null)WANT=null;
  var v=r.v==="negocio"?"negocios":r.v;if(VIEWS.indexOf(v)<0){v="hoy";r={v:"hoy",a:""}}
  var changed=R.v!==v||R.a!==r.a;R={v:v,a:r.a,raw:r.v};LAST=location.hash||"#hoy";
  VIEWS.forEach(function(x){$("v-"+x).hidden=x!==v});
  Array.prototype.forEach.call(document.querySelectorAll("#nav a"),function(a){if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  if(v==="plata"){var sb=["cobros","vence","metricas","reporte"].indexOf(r.a)>=0?r.a:"cobros";R.a=sb;TAB={cobros:"cob",metricas:"met",reporte:"rep"}[sb]||"neg";
    $("t-cob").hidden=$("pPays").hidden=sb!=="cobros";$("vence").hidden=sb!=="vence";$("t-met").hidden=sb!=="metricas";$("t-rep").hidden=sb!=="reporte";
    Array.prototype.forEach.call(document.querySelectorAll("#plTabs a"),function(a){a.setAttribute("aria-selected",a.dataset.s===sb)})}
  else if(v==="prospectos")TAB="pro";
  else if(v==="mas"){var ms=["respuestas","enlaces","demos"].indexOf(r.a)>=0?r.a:"";TAB=ms==="respuestas"?"resp":"neg";$("masMenu").hidden=!!ms;$("masSub").hidden=!ms;$("masResp").hidden=ms!=="respuestas";$("masEnl").hidden=ms!=="enlaces";$("masDem").hidden=ms!=="demos"}
  else TAB="neg";
  if(r.v==="negocio")openFicha(tgt);else $("split").classList.remove("ficha");
  render();
  if(changed&&!(r.v==="negocio"&&E)){window.scrollTo(0,0)}}
function openFicha(t){$("split").classList.add("ficha");WANT=t;
  if(t==="nuevo"){if(E&&!E.id){$("ed").hidden=false}else openEd(null);return}
  if(!loaded()){PEND=t;return}
  if(!has(BIZ,t)){toast("No encontré ese negocio");nav("#negocios",true);return}
  if(E&&E.id===t){$("ed").hidden=false;return}
  openEd(t)}

/* openEd arma E con BIZ/SUBS del momento en que se llama: la firma se toma en ese mismo momento (G3). */
var _openEd=openEd;openEd=function(id,f){if(id)OSIG[id]=sigOf(id);return _openEd(id,f)};

/* ---------- RENDER (reemplaza la lista del clásico; extra.js lo envuelve) ---------- */
render=function(){
  if(PEND&&loaded()){var p=PEND;PEND=null;if(parse().v==="negocio"&&parse().a===p)openFicha(p)}
  try{lsSet(K.f,F)}catch(e){}
  badges();renderHoy();renderNeg();renderVence();renderMas();fichaSync();
  var pa=$("plaSub"),all=PAYS.reduce(function(a,p){return a+(+p.amt||0)},0);if(pa)pa.textContent="Cobrado en total "+crc(all)+" · este mes "+crc(monCobrado());
  if(typeof LEADS!=="undefined"){var fu=AX.followUps();$("proSub").textContent=LEADS.length+" prospecto"+(LEADS.length===1?"":"s")+(fu?" · "+fu+" para dar seguimiento":"")}};
function monCobrado(){var m=mesIni();return PAYS.filter(function(p){return p.at>=m}).reduce(function(a,p){return a+(+p.amt||0)},0)}
function badges(){if(typeof AX==="undefined"||!loaded())return;var c=AX.cobrosList(),n=c.late.length+c.soon.length+c.trialEnd.length+c.trialLate.length+AX.unmatched().length,f=AX.followUps();
  var a=$("nPla"),b=$("nPro");a.hidden=!n;a.textContent=n;a.setAttribute("aria-label",n+" por cobrar");b.hidden=!f;b.textContent=f;b.setAttribute("aria-label",f+" para seguimiento")}

/* ---------- HOY ---------- */
function tareas(){var out=[],now=Date.now(),c=AX.cobrosList(),posp=ls(K.posp,{}),old=0,lk=ls(K.lnk,{});
  function add(o){o.posp=(+posp[o.k]||0)>now;out.push(o)}
  c.late.forEach(function(o){var s=o.s,u=untilMs(s);add({k:"late:"+o.id,id:o.id,u:100,w:u,dot:"r",t:o.b.name,p:"Su mensualidad venció "+AX.ago(u)+" ("+fdC(u)+"). "+AX.tierName(s)+" · "+crc(s.price||AX.expect(s))+"/mes.",wa:2,pay:1,open:"Abrir ficha"})});
  c.trialLate.forEach(function(o){var u=untilMs(o.s);if(now-u>14*DAY){old++;return}add({k:"tlate:"+o.id,id:o.id,u:90,w:-u,dot:"r",t:o.b.name,p:"Su prueba terminó "+AX.ago(u)+" y no ha escogido plan. Su página ya no recibe reservas.",wa:3,pay:1,open:"Abrir ficha"})});
  AX.unmatched().forEach(function(p){add({k:"polar:"+(p.at||0)+":"+(+p.amt||0),u:85,w:p.at||0,dot:"y",t:p.name||"Pago sin nombre",p:"Pagó "+crc(p.amt)+" con tarjeta (Polar) el "+fdC(p.at)+" con un correo que no coincide con ningún negocio. Buscalo y registrale la mensualidad a mano.",polar:p})});
  c.trialEnd.forEach(function(o){var u=untilMs(o.s),d=diasCal(u);add({k:"tend:"+o.id,id:o.id,u:80-Math.max(0,d),w:u,dot:d<=1?"r":"o",t:o.b.name,p:"Su prueba termina "+(d<=0?"hoy":d===1?"mañana":"en "+d+" días")+" ("+diaCorto(u)+"). Todavía no escoge plan.",wa:3,pay:1,open:"Abrir ficha"})});
  rowsAll().forEach(function(x){var b=x.b;if(b&&b.slug&&lk[b.slug]&&lk[b.slug].s==="falta"&&!(x.s&&x.s.demo))add({k:"lnk:"+x.id,id:x.id,u:70,w:0,dot:"y",t:b.name,p:"Su link de reservas no abre: falta la página pública. Abrí la ficha y tocá Guardar para volver a publicarla.",open:"Arreglar",wa:-1})});
  rowsAll().forEach(function(x){var b=x.b,cr=tms(b&&b.created);if(!b||(x.s&&(x.s.demo||x.s.status==="suspended"))||!cr||now-cr>3*DAY)return;
    var miss=pasos(b,x.id).filter(function(p){return p.ok===false&&p.n!=="Fotos"}).map(function(p){return p.n==="Datos del negocio"?"datos":p.n==="Textos de la página"?"textos":p.n.split(" ")[0].toLowerCase()});
    if(miss.length)add({k:"new:"+x.id,id:x.id,u:60,w:-cr,dot:"p",t:b.name,p:"Se registró "+AX.ago(cr)+". Le falta: "+(miss.length>1?miss.slice(0,-1).join(", ")+" y "+miss[miss.length-1]:miss[0])+".",wa:0,open:"Dejarla lista"})});
  if(typeof LEADS!=="undefined")LEADS.filter(AX.needsFu).forEach(function(l){var t=tms(l.upd||l.at);add({k:"lead:"+l.id,lead:l,u:50,w:t,dot:"y",t:l.name||"Prospecto",p:"Le escribiste "+AX.ago(t)+" y no ha respondido. Toca darle seguimiento."})});
  out.sort(function(a,b){return (b.u-a.u)||(a.w-b.w)});return {L:out,old:old}}
function renderHoy(){if(typeof AX==="undefined")return;
  if(!loaded()){$("hoyL").innerHTML='<div class="a-skel"></div><div class="a-skel"></div><div class="a-skel"></div>';return}
  var u=auth.currentUser,nm=String(u&&u.displayName||"").trim().split(/\s+/)[0];$("hoyT").textContent="Hola"+(nm?", "+nm:"");
  var T=tareas(),vis=T.L.filter(function(t){return !t.posp}),pp=T.L.length-vis.length,show=SHOWP?T.L:vis;HT=show;
  $("hoySub").textContent=hoyLargo()+" · "+(vis.length?vis.length+(vis.length===1?" cosa":" cosas")+" para hoy":"todo al día");
  var mrr=AX.mrrNow(),goal=AX.goalOf(),pg=Math.min(100,Math.round(mrr*100/goal)),m=crD();
  $("hoyPlata").innerHTML='<div class="a-money"><small>Ingreso fijo al mes</small><b class="big">'+crc(mrr)+'</b><div class="a-bar" role="progressbar" aria-label="Avance hacia la meta" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pg+'"><i style="width:'+pg+'%"></i></div><div class="a-two"><span>Meta: <b>'+crc(goal)+'</b></span><span>Cobrado en '+MN[m.getUTCMonth()]+': <b>'+crc(monCobrado())+'</b></span></div></div>';
  var h=show.length?show.map(function(t,i){var b=t.id?BIZ[t.id]:null,bt="";
      if(b&&t.wa>=0&&b.wa)bt+='<button type="button" class="a-b wa" data-h="wa" data-i="'+i+'">Escribirle</button><button type="button" class="a-b ic" data-h="cp" data-i="'+i+'" aria-label="Copiar el mensaje" title="Copiar el mensaje">'+ICO.copy+'</button>';
      if(t.pay&&b)bt+='<button type="button" class="a-b" data-h="pay" data-i="'+i+'">Registrar pago</button>';
      if(t.open&&b){var pri=t.k.indexOf("new:")===0||t.k.indexOf("lnk:")===0;bt=pri?'<a class="a-b pri" href="#negocio/'+enc(t.id)+'">'+t.open+'</a>'+bt:bt+'<a class="a-b" href="#negocio/'+enc(t.id)+'">'+t.open+'</a>'}
      if(t.polar)bt+='<button type="button" class="a-b pri" data-h="find" data-i="'+i+'">Buscar negocio</button><a class="a-b" href="#plata/cobros">Ver cobros</a>';
      if(t.lead)bt+=(t.lead.wa?'<button type="button" class="a-b wa" data-h="lwa" data-i="'+i+'">Escribirle</button>':"")+'<a class="a-b" href="#prospectos">Ver prospectos</a>';
      var pp='<button type="button" class="a-pp" data-h="posp" data-i="'+i+'" aria-pressed="'+!!t.posp+'" aria-label="'+(t.posp?"Traer de vuelta: ":"Posponer 1 día: ")+esc(t.t||"")+'" title="'+(t.posp?"Traer de vuelta":"Posponer 1 día")+'">'+ICO.clock+'</button>';
      return '<div class="a-task'+(t.posp?" pp":"")+'"><i class="dot d-'+t.dot+'" aria-hidden="true"></i><div class="m"><div class="a-th">'+(b?'<a class="t" href="#negocio/'+enc(t.id)+'">'+esc(t.t||"(sin nombre)")+'</a>':'<b class="t">'+esc(t.t||"(sin nombre)")+'</b>')+pp+'</div><p>'+esc(t.p)+'</p>'+(bt?'<div class="a-bt">'+bt+'</div>':"")+'</div></div>'}).join("")
    :'<div class="a-ok"><b>Todo al día</b>No hay nada urgente. Buen momento para escribirle a un prospecto.</div>';
  if(pp)h+='<p class="a-more">'+pp+' pospuesta'+(pp===1?"":"s")+' hasta mañana · <button type="button" class="a-b q" data-h="showp">'+(SHOWP?"Ocultarlas":"Verlas")+'</button></p>';
  if(T.old)h+='<p class="a-more">Y '+T.old+' prueba'+(T.old===1?"":"s")+' que venció hace más de 2 semanas: <a href="#plata/cobros">ver en Cobros</a>.</p>';
  $("hoyL").innerHTML=h;
  var now=Date.now(),L=rowsAll(),n7=L.filter(function(x){return !(x.s&&x.s.demo)&&now-tms(x.b.created)<=7*DAY}).length,tr=L.filter(function(x){return state(x.s)==="trial"}).length,ac=L.filter(function(x){return state(x.s)==="active"}).length;
  $("hoyN").innerHTML='<a href="#negocios" data-sf="all"><b>'+n7+'</b><span>Nuevos, 7 días</span></a><a href="#negocios" data-sf="trial"><b>'+tr+'</b><span>En prueba</span></a><a href="#negocios" data-sf="active"><b>'+ac+'</b><span>Pagando</span></a>'}
function hoyClick(e){var x=e.target.closest("[data-h]");var sf=e.target.closest("[data-sf]");if(sf){F=sf.getAttribute("data-sf");if(F==="all"){$("srt").value="new";lsSet(K.sort,"new")}return}
  if(!x)return;var k=x.getAttribute("data-h");if(k==="showp"){SHOWP=!SHOWP;render();return}
  var t=HT[+x.getAttribute("data-i")];if(!t)return;
  if(k==="wa")waGo(t.id,t.wa);
  else if(k==="cp")copy(msgOf(t.id,t.wa),"Mensaje copiado ✓ Pegalo en WhatsApp");
  else if(k==="pay"){if(guard())act("a","pay",t.id)}
  else if(k==="find"){$("q").value=t.polar.name||"";F="all";nav("#negocios");setTimeout(function(){$("q").focus()},60)}
  else if(k==="lwa")actP("wa",t.lead.id);
  else if(k==="posp"){var p=ls(K.posp,{}),now=Date.now();Object.keys(p).forEach(function(z){if(+p[z]<now)delete p[z]});if(t.posp)delete p[t.k];else p[t.k]=now+DAY;lsSet(K.posp,p);toast(t.posp?"Volvió a la lista":"Pospuesta hasta mañana");render()}}

/* ---------- NEGOCIOS ---------- */
var FL=[["all","Todos"],["trial","En prueba"],["active","Pagando"],["late","Vencidos"],["owe","Con saldo"],["suspended","Pausados"],["demo","Demos"]];
function renderNeg(){var L=rowsAll(),q=$("q").value.trim().toLowerCase(),srt=$("srt").value,fa=document.activeElement,fk=fa&&fa.parentNode===$("f")?fa.getAttribute("data-f"):null;
  $("f").innerHTML=FL.map(function(f){var n=loaded()?L.filter(function(x){return passF(f[0],x)}).length:"";return '<button type="button" data-f="'+f[0]+'" aria-pressed="'+(F===f[0])+'">'+f[1]+(n!==""?' <i>'+n+'</i>':"")+'</button>'}).join("");
  if(fk){var nb=$("f").querySelector('[data-f="'+fk+'"]');if(nb)nb.focus()}
  if(!loaded()){$("list").innerHTML='<div class="a-skel"></div><div class="a-skel"></div><div class="a-skel"></div><div class="a-skel"></div>';$("negSub").textContent="Cargando…";return}
  var V=L.filter(function(x){return passF(F,x)&&(!q||CITALY.fz(q,searchText(x))>0)});
  var due=function(x){return monthly(x.s)&&x.s.status!=="suspended"&&untilMs(x.s)?untilMs(x.s):Infinity};
  V.sort(srt==="name"?function(a,b){return String(a.b.name||"").localeCompare(String(b.b.name||""),"es")}:srt==="due"?function(a,b){return (due(a)-due(b))||0}:function(a,b){return tms(b.b.created)-tms(a.b.created)});
  $("negSub").textContent=L.length+" en total"+(V.length!==L.length?" · "+V.length+" en la lista":"");
  $("list").innerHTML=V.length?V.map(rowHtml).join(""):'<div class="a-ok">'+(L.length?"Nada con ese filtro o búsqueda.":"Todavía no hay negocios. Tocá <b>+ Nuevo negocio</b>.")+'</div>'}
function rowHtml(x){var b=x.b,pl=pillOf(x.id),t=(C.types[b.type]||{}).n||"Sin tipo";
  return '<a class="a-row" href="#negocio/'+enc(x.id)+'"'+(E&&E.id===x.id?' aria-current="true"':"")+'>'+avHtml(b)+'<span class="m"><b>'+esc(b.name||"(sin nombre)")+'</b><span class="s">'+esc(t)+' · '+(b.slug?"/"+esc(b.slug):"sin link")+'</span>'+pgHtml(pasos(b,x.id))+'</span><span class="a-pill '+pl[0]+'">'+esc(pl[1])+'</span></a>'}

/* ---------- PLATA: vencen pronto (próximos 14 días) ---------- */
function renderVence(){if(typeof AX==="undefined"||!loaded())return;var now=Date.now(),L=AX.rowsOf().filter(function(x){var s=x.s;if(!s||s.demo||s.status==="suspended"||!monthly(s))return false;var u=untilMs(s);return u>=now&&u<=now+14*DAY}).sort(function(a,b){return untilMs(a.s)-untilMs(b.s)});
  $("vence").innerHTML='<div class="card a-old"><h2>Vencen en los próximos 14 días <span class="pill warn">'+L.length+'</span></h2>'+(L.length?L.map(function(x){var s=x.s,u=untilMs(s),d=diasCal(u);
    return '<div class="row2"><div class="m"><b>'+esc(x.b.name||"(sin nombre)")+'</b><span>'+esc(s.plan==="trial"?"Prueba gratis":AX.tierName(s)+" · "+crc(s.price||AX.expect(s))+"/mes")+' · '+diaCorto(u)+' ('+(d<=0?"hoy":d===1?"mañana":"en "+d+" d")+')</span></div><div class="bt">'+(x.b.wa?'<button class="btn sm wa" data-v="msg" data-id="'+esc(x.id)+'" aria-label="Mensajes de WhatsApp">💬</button>':"")+'<button class="btn sm ghost" data-v="pay" data-id="'+esc(x.id)+'">Cobrar</button></div></div>'}).join(""):'<p class="mute small" style="margin:6px 0 0">Nada vence en estos 14 días.</p>')+'</div>'}

/* ---------- MÁS: enlaces y demos ---------- */
function renderMas(){if(R.v!=="mas"||!loaded())return;if(R.a==="enlaces")renderEnl();else if(R.a==="demos")renderDem()}
function renderEnl(){var ck=ls(K.lnk,{}),mal=function(x){var c=ck[x.b.slug];return c&&c.s!=="ok"&&c.s!=="err"?0:1},L=rowsAll().filter(function(x){return x.b.slug}).sort(function(a,b){return (mal(a)-mal(b))||String(a.b.name||"").localeCompare(String(b.b.name||""),"es")}),bad=0,okn=0,seen=0;
  var rows=L.map(function(x){var c=ck[x.b.slug],st=c&&c.s,pl="";if(st){seen++;if(st==="ok")okn++;else bad++}
    pl=st==="ok"?'<span class="a-pill ok">Abre</span>':st==="falta"?'<span class="a-pill bad">No abre</span>':st==="otro"?'<span class="a-pill bad">Es de otro</span>':st==="err"?'<span class="a-pill z">Sin revisar</span>':"";
    return '<div class="a-lk"><div class="m"><b>'+esc(x.b.name||"(sin nombre)")+'</b><span>citalyapp.com/r/?n='+esc(x.b.slug)+'&amp;go=1</span></div>'+pl+'<button type="button" class="a-b" data-l="cp" data-s="'+esc(x.b.slug)+'" aria-label="Copiar link de '+esc(x.b.name||"")+'">Copiar</button><a class="a-b" target="_blank" rel="noopener" href="../../r/?n='+enc(x.b.slug)+'&amp;go=1" aria-label="Abrir link de '+esc(x.b.name||"")+'">Abrir</a></div>'}).join("");
  var nos=rowsAll().filter(function(x){return !x.b.slug}).length;
  $("masEnl").innerHTML='<h1>Enlaces de reserva</h1><p class="a-sub">El link que se comparte: citalyapp.com/r/?n=<i>link</i>&amp;go=1. "Revisar links" mira si la página de cada negocio existe (lee un documento por negocio, solo cuando lo tocás).</p>'
    +'<div class="a-bt"><button type="button" class="a-b pri" data-l="chk"'+(CHK?" disabled":"")+'>'+(CHK?"Revisando…":"Revisar links")+'</button><button type="button" class="a-b" data-l="all">Copiar todos</button></div>'
    +'<p class="a-use" id="enlRes">'+(seen?okn+" abren bien"+(bad?" · <b style=\"color:var(--bad)\">"+bad+" con problema</b>":"")+" (última revisión en este aparato)":"Todavía no se han revisado.")+(nos?" · "+nos+" sin link":"")+'</p><div class="a-card">'+(rows||'<p class="mute small">No hay negocios con link.</p>')+'</div>'}
function checkLinks(){if(CHK)return;CHK=true;renderEnl();var L=rowsAll().filter(function(x){return x.b.slug}),ck={},i=0;
  function one(){if(i>=L.length)return Promise.resolve();var x=L[i++],s=x.b.slug;return db.doc("pub/"+s).get().then(function(d){ck[s]={s:!d.exists?"falta":(d.data()||{}).biz===x.id?"ok":"otro",at:Date.now()}},function(){ck[s]={s:"err",at:Date.now()}}).then(one)}
  Promise.all([one(),one(),one(),one()]).then(function(){CHK=false;lsSet(K.lnk,ck);var b=Object.keys(ck).filter(function(k){return ck[k].s!=="ok"}).length;toast(b?b+" link"+(b===1?"":"s")+" con problema":"Todos los links abren ✓");render()})}
function renderDem(){var L=rowsAll().filter(function(x){return x.s&&x.s.demo}).sort(function(a,b){return tms(b.b.created)-tms(a.b.created)});
  $("masDem").innerHTML='<h1>Demos</h1><p class="a-sub">Cuentas de muestra para enseñarle a un prospecto. No se cobran.</p><div class="a-bt"><button type="button" class="a-b pri" data-d="new">+ Nueva demo</button>'+(L.length?'<button type="button" class="a-b red" data-d="del">Eliminar todas las demos</button>':"")+'</div>'
    +(L.length?L.map(rowHtml).join(""):'<div class="a-ok">No hay demos.</div>')}

/* ---------- FICHA (editor) ---------- */
function tg(id,on,lab){return '<label class="toggle"><input type="checkbox" id="'+id+'"'+(on?" checked":"")+' aria-label="'+esc(lab)+'"><span></span></label>'}
function S(k,title,sum,inner,cls){return '<details class="a-sec'+(cls?" "+cls:"")+'" data-sec="'+k+'"'+(OPEN[k]?" open":"")+'><summary><span>'+title+'</span><small>'+sum+'</small></summary><div class="in">'+inner+'</div></details>'}
function notasHtml(id){var a=(typeof ADM!=="undefined"&&ADM[id])||{};
  return ((a.tags||[]).length?'<div class="a-tags">'+a.tags.map(function(t){return '<span>'+esc(t)+'</span>'}).join("")+'</div>':'<p class="hint">Sin etiquetas.</p>')+(a.note?'<p class="a-note">'+esc(a.note)+'</p>':'<p class="hint">Sin nota.</p>')
    +'<div class="a-bt"><button type="button" class="a-b" data-u="note">Escribir nota</button><button type="button" class="a-b" data-u="tag">Etiquetas</button></div><p class="hint">Solo las ves vos. El negocio nunca las ve.</p>'}
function planCard(id,b,s){var st=state(s),tot=totalOf(s),paid=paidOf(id),due=Math.max(0,tot-paid),h='<div class="a-card" id="fPlan"><p class="a-t">Plan y cobros</p>';
  h+='<div class="a-ln"><b>'+esc(planTxt(b,s))+'</b><span>'+(monthly(s)&&st!=="suspended"?(st==="trial"?"prueba hasta el ":"pagado hasta el ")+fdC(untilMs(s)):st==="suspended"?"pausado":st==="demo"?"no se cobra":"")+'</span></div>';
  if(st!=="demo"&&st!=="none"&&!monthly(s))h+='<div class="a-ln"><span style="text-align:left">Pagó '+crc(paid)+' de '+crc(tot)+'</span><span>'+(due?'<b style="color:var(--bad)">debe '+crc(due)+'</b>':"completo")+'</span></div>';
  h+='<div class="a-bt">'+(st==="none"?'<button type="button" class="a-b pri" data-u="mensNone">Poner en prueba gratis</button><button type="button" class="a-b" data-u="pay">Cobrar un extra</button>':(s&&s.demo)||st!=="demo"?'<button type="button" class="a-b pri" data-u="pay">'+(monthly(s)||(s&&s.demo)?"Registrar mensualidad":"Registrar pago")+'</button>':"")
    +(s&&!s.demo?'<button type="button" class="a-b" data-u="pf">Cambiar plan o fecha</button>':"")+(b.wa?'<button type="button" class="a-b" data-u="msg">Mensajes</button>':"")+'</div>';
  return h+'<p class="a-use" id="fUse"></p></div>'}
/* Planes del modelo viejo (promo/standard/pers, con instalación): no se ofrecen para negocios nuevos ni a quien no
   los tiene; si el negocio ya está en uno, se muestra solo ese para que Guardar escriba lo mismo que el clásico. */
function pplBlock(nw){/* M3: al crear (o si no tiene subs) solo prueba gratis o demo; la mensualidad se registra después. */return '<label for="pPl">Plan</label><select id="pPl">'+Object.keys(PLANS).filter(function(k){var crea=nw||!has(SUBS,E.id);return k==="trial"||(!crea&&(k==="mensual"||(!E.demo&&E.plan===k)))}).map(function(k){return '<option value="'+k+'"'+(E.plan===k&&!E.demo?" selected":"")+'>'+PLANS[k].n+(PLANS[k].p?' · '+crc(PLANS[k].p)+' (modelo viejo)':'')+'</option>'}).join("")+'<option value="demo"'+(E.demo?" selected":"")+'>Demo (no se cobra)</option></select>'
    +'<div id="pMon"'+(E.demo||E.plan==="trial"||E.plan==="mensual"?" hidden":"")+'><label for="pTo">Total acordado (₡)</label><input id="pTo" type="number" inputmode="numeric" min="0" step="1000" value="'+esc(E.total)+'"><p class="hint">Personalizado incluye 1 módulo a la medida. Módulos extra desde '+crc(C.modFrom)+'.</p>'
    +(nw?'<label for="pSp">Pagado hoy (₡)</label><input id="pSp" type="number" inputmode="numeric" min="0" step="1000" value="'+esc(E.paidNow)+'"><p class="hint">Normalmente el 50 % al empezar. El resto lo registrás con "Registrar pago" al entregar.</p>':'<p class="hint">Los pagos se registran con "Registrar pago".</p>')+'</div>'}
edRender=function(){var nw=!E.id,W=E.web,id=E.id,b=id?(BIZ[id]||{}):{},s=id?(SUBS[id]||null):null,key=id||"nuevo";
  if(id&&WANT!==id&&REOP!==id){E=CUR&&CUR.id===WANT?CUR:null;return}
  if(PREV!==key){PREV=key;OPEN=nw?{datos:1,equipo:1,svc:1,hor:1,web:1,plan:1}:{};DIRTY=false;if(id)FOT[id]=E.fotos.length,lsSet(K.fot,FOT)}
  REOP=null;SIG=id?(OSIG[id]!=null?OSIG[id]:sigOf(id)):"";if(id)delete OSIG[id];
  if(id&&!has(SUBS,id)&&!E.planTouched){E.plan="trial";E.total=0;E.demo=false}  /* G2: sin subs = como un negocio nuevo (prueba gratis) */
  if(R.v!=="negocios"||parse().v!=="negocio"||(parse().a||"nuevo")!==key){WANT=key;history.pushState(null,"","#negocio/"+(id?encodeURIComponent(id):"nuevo"));route();if(!E)return}
  $("main").hidden=false;$("split").classList.add("ficha");var ed=$("ed");ed.hidden=false;
  var pl=id?pillOf(id):null,nS=E.services.filter(function(x){return String(x.n||"").trim()}).length,days=E.hours.filter(function(h){return h&&h.on}).length,mods=Object.keys(C.mods).filter(function(k){return E.mods[k]}).map(function(k){return C.mods[k].n.split(" ")[0]});
  var h='<div class="a-hero"><button type="button" class="a-back" id="eX">‹ Negocios</button><div class="n">'+avHtml(nw?{name:E.name||"N",logo:E.logo}:b)+'<div style="min-width:0"><h1>'+(nw?"Nuevo negocio":esc(E.name||"(sin nombre)"))+'</h1><div class="l">'+(nw?"Llená los datos y tocá Crear negocio.":"citalyapp.com/"+esc(E.slug)+' <span class="a-pill '+pl[0]+'">'+esc(pl[1])+'</span>')+'</div></div></div>';
  if(!nw)h+='<div class="a-q"><button type="button" class="wa" data-u="msg">'+ICO.wa+'WhatsApp</button><a target="_blank" rel="noopener" href="../../'+enc(E.slug)+'">'+ICO.web+'Ver web</a><a target="_blank" rel="noopener" href="../../r/?n='+enc(E.slug)+'">'+ICO.cal+'Reservas</a><button type="button" data-u="copy">'+ICO.copy+'Copiar link</button></div>';
  h+='</div><div id="fWarn"></div><div id="fWarnPub"></div>';
  if(nw)h+='<div class="demo"><span style="flex:1">¿Armando una demo? Llená todo con los datos, logo y fotos de GlassStudioCR.</span><button class="btn sm" id="eDemo">Usar GlassStudioCR</button></div>';
  if(C.iaUrl)h+='<details class="a-ia" data-sec="ia"'+(OPEN.ia?" open":"")+'><summary><b>Llenar con los mensajes del cliente</b><span>Pegá lo que te mandó por WhatsApp y se llena solo. Revisás y guardás.</span></summary><div class="in"><p class="hint">Servicios, precios, horario, dónde atiende… La IA llena el formulario y vos revisás. No cambia nada hasta que toqués Guardar.</p><textarea id="impT" maxlength="6000" style="min-height:90px" aria-label="Mensajes del cliente" placeholder="Ej: Ofrezco lavado 8mil sedan y 10000 suv. Atiendo miércoles y jueves de 8 a 2…"></textarea><div class="row" style="margin-top:8px"><button class="btn sm" id="impGo">Llenar formulario</button></div><div id="impR" class="hint" style="margin-top:8px" hidden></div></div></details>';
  if(!nw){var P=pasos(b,id),k=P.filter(function(p){return p.ok}).length;
    h+='<div class="a-card"><p class="a-t">Qué le falta · '+k+' de 6</p>'+P.map(function(p){return '<button type="button" class="a-ck" data-go="'+p.k+'"><i class="'+(p.ok?"si":p.ok===null?"un":"no")+'" aria-hidden="true">'+(p.ok?"✓":"")+'</i><span>'+p.n+(p.ok===null?' <small class="mute">(sin saber)</small>':"")+'</span>'+(p.ok?"":'<em>'+p.v+'</em>')+'</button>'}).join("")+'</div>';
    h+=planCard(id,b,s)}
  // secciones (mismos campos e ids que el editor del clásico)
  h+=S("datos","Datos",E.type&&C.types[E.type]?esc(C.types[E.type].n):"Falta el tipo",
     '<label for="eN">Nombre</label><input id="eN" maxlength="50" value="'+esc(E.name)+'" placeholder="Ej: Barbería El Legado">'
    +'<label for="eT">Tipo de negocio</label><select id="eT"><option value="">Elegí…</option>'+Object.keys(C.types).map(function(k){return '<option value="'+k+'"'+(E.type===k?" selected":"")+'>'+C.types[k].ic+" "+esc(C.types[k].n)+'</option>'}).join("")+'</select>'
    +'<label for="eS">Link</label>'+(nw?'<div class="slugbox"><b>citalyapp.com/</b><input id="eS" maxlength="40" autocapitalize="off" autocomplete="off" spellcheck="false" value="'+esc(E.slug)+'"></div><p class="small" id="eSm" style="margin:6px 0 0"></p>':'<div class="slugbox"><b>citalyapp.com/'+esc(E.slug)+'</b></div><p class="hint">El link no se puede cambiar después de creado.</p>')
    +'<label for="eW">WhatsApp del negocio</label><input id="eW" inputmode="tel" maxlength="15" value="'+esc(E.wa)+'" placeholder="8888 8888">'
    +'<label for="eA">Dirección o zona (opcional)</label><input id="eA" maxlength="120" value="'+esc(E.addr)+'" placeholder="Ej: Santa Ana, 200 m oeste de la iglesia">'
    +'<h3>Logo y color</h3><div class="logoup" style="margin-top:8px"><div class="lg" id="eLg">'+(E.logo?'<img alt="" src="'+esc(imgSrc(E.logo))+'">':"📷")+'</div><div class="row" style="flex:1"><button class="btn sm alt" id="eLb">Subir logo</button>'+(E.logo?'<button class="btn sm danger" id="eLr">Quitar</button>':"")+'</div></div><input type="file" id="eLf" accept="image/*" hidden>'
    +'<label>Color de la marca</label><div class="swatches" id="eC">'+C.colors.map(function(c){return '<button style="background:'+c+'" data-c="'+c+'" aria-pressed="'+(E.color===c)+'" aria-label="Color '+c+'"></button>'}).join("")+'<input type="color" id="eCc" value="'+esc(E.color)+'" aria-label="Otro color"></div>'
    +'<p class="hint">Que se lea bien con letra blanca encima (colores medios u oscuros).</p>'
    +'<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px"><button class="btn sm alt" id="ePg" type="button">✨ Colores del logo</button><button class="btn sm ghost" id="ePx" type="button"'+(W.pal?"":" hidden")+'>Quitar paleta</button></div><div id="ePc" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><p class="hint" id="ePm">'+(W.pal?"Paleta activa: "+esc(W.pal.n||"a tu gusto"):"")+'</p>');
  h+=S("svc","Servicios y precios",nS+" servicio"+(nS===1?"":"s"),'<p class="hint" style="margin-bottom:6px">La duración bloquea la agenda.</p><div id="eSv"></div><button class="btn ghost" id="eSvA" style="margin-top:8px">+ Agregar servicio</button>');
  h+=S("hor","Horario y domicilio",days+" día"+(days===1?"":"s")+(E.home?" · a domicilio":""),
     [1,2,3,4,5,6,0].map(function(d){var x=E.hours[d]||(E.hours[d]={on:false,a:"08:00",b:"18:00"});return '<div class="hrow"><button class="chip" data-hd="'+d+'" aria-pressed="'+!!x.on+'">'+DS[d]+'</button><input type="time" step="1800" id="ha'+d+'" value="'+esc(x.a)+'"'+(x.on?"":" disabled")+' aria-label="'+DS[d]+' abre"><input type="time" step="1800" id="hb'+d+'" value="'+esc(x.b)+'"'+(x.on?"":" disabled")+' aria-label="'+DS[d]+' cierra"></div>'}).join("")
    +'<div class="between" style="margin-top:16px"><div><h3 style="margin:0">Servicio a domicilio</h3><p class="hint">La página de reservas le pide al cliente su ubicación.</p></div>'+tg("eH",E.home,"Servicio a domicilio")+'</div><div id="eZw"'+(E.home?"":" hidden")+'><label>Zonas (dejá el monto vacío si es gratis)</label><div id="eZ"></div><button class="btn ghost" id="eZa" style="margin-top:8px">+ Agregar zona</button></div>');
  h+=S("web","Página web",E.tagline?"Con frase":"Falta la frase",
     '<p class="hint">Lo que se ve en citalyapp.com/'+esc(E.slug||"negocio")+'. Todo es opcional menos la frase principal.</p>'
    +'<label for="wTg">Frase principal</label><input id="wTg" maxlength="70" value="'+esc(E.tagline)+'" placeholder="Ej: Tu mejor corte, sin hacer fila">'
    +'<label for="wBl">Descripción corta</label><textarea id="wBl" maxlength="260" placeholder="Qué hacen, dónde y por qué elegirlos. 1 o 2 frases.">'+esc(E.blurb)+'</textarea>'
    +'<label for="wPr">Promoción</label><input id="wPr" maxlength="90" value="'+esc(E.promo)+'" placeholder="Ej: 10% de descuento en tu primera cita">'
    +'<label for="wPn">Detalle de la promoción</label><input id="wPn" maxlength="120" value="'+esc(W.promoNote||"")+'" placeholder="Ej: Solo reservando desde la página">'
    +'<label for="wFt">Puntos fuertes (uno por línea, máximo 4)</label><textarea id="wFt" placeholder="Domicilio gratis en la GAM&#10;Listo en 2 horas">'+esc(W.feats||"")+'</textarea>'
    +'<label for="wAb">Sobre nosotros</label><textarea id="wAb" maxlength="900" style="min-height:100px" placeholder="La historia del negocio, cómo trabajan, qué los hace diferentes.">'+esc(W.about||"")+'</textarea>'
    +'<label for="wSn">Nota debajo de los precios</label><input id="wSn" maxlength="160" value="'+esc(W.svcNote||"")+'" placeholder="Ej: Si el carro es otro tipo, el precio se ajusta al real.">'
    +'<label for="wHn">Nota del servicio a domicilio</label><input id="wHn" maxlength="160" value="'+esc(W.homeNote||"")+'" placeholder="Ej: Trabajamos en tu casa o en el parqueo de tu trabajo.">'
    +'<label>Preguntas frecuentes</label><div id="wFq"></div><button class="btn ghost" id="wFqA" style="margin-top:8px">+ Agregar pregunta</button>'
    +'<label>Reseñas de clientes reales</label><p class="hint" style="margin-top:-2px">Copiá reseñas reales (Google, Facebook, Instagram) y poné de dónde salen.</p><div id="wRv"></div><button class="btn ghost" id="wRvA" style="margin-top:8px">+ Agregar reseña</button>'
    +'<label for="wGr">Link para dejar reseña en Google</label><input id="wGr" inputmode="url" value="'+esc(W.greview||"")+'" placeholder="https://g.page/r/…">'
    +'<div class="r3"><div><label for="wIg">Instagram</label><input id="wIg" inputmode="url" value="'+esc(W.ig||"")+'" placeholder="instagram.com/…"></div><div><label for="wFb">Facebook</label><input id="wFb" inputmode="url" value="'+esc(W.fb||"")+'" placeholder="facebook.com/…"></div></div>'
    +'<div class="r3"><div><label for="wTt">TikTok</label><input id="wTt" inputmode="url" value="'+esc(W.tt||"")+'" placeholder="tiktok.com/@…"></div><div><label for="wEm">Correo público</label><input id="wEm" type="email" value="'+esc(W.email||"")+'"></div></div>');
  h+=S("fotos","Fotos y videos",E.fotos.length+" foto"+(E.fotos.length===1?"":"s")+((W.videos||[]).length?" · "+W.videos.length+" video"+(W.videos.length===1?"":"s"):""),
     '<p class="hint" style="margin-bottom:6px">La primera foto sale en la portada. Máximo 12.</p><div class="photos" id="ePh"></div><div style="height:8px"></div><button class="btn alt" id="ePhA">+ Subir fotos</button><input type="file" id="ePhF" accept="image/*" multiple hidden>'
    +'<label for="wVd">Videos (un link por línea, con título opcional)</label><textarea id="wVd" style="min-height:70px" placeholder="https://www.tiktok.com/@negocio/video/123…&#10;https://www.youtube.com/watch?v=…">'+esc((W.videos||[]).map(function(v){return v.u+(v.c?" "+v.c:"")}).join("\n"))+'</textarea><p class="hint" style="margin-top:-2px">TikTok, Instagram, Facebook o YouTube. Los links cortos se convierten solos al salir del cuadro. Se muestran hasta 6 (Arranque y prueba), 12 (Turbo) o 24 (Nitro).</p>');
  h+=S("equipo","Equipo y accesos",esc(E.email||"sin correo")+(emails(E.team).length?" + "+emails(E.team).length:""),
     '<p class="hint">Con estos correos entran a citalyapp.com/app. Con Google entran directo; con otro correo crean su contraseña y lo confirman.</p>'
    +'<label for="eE">Correo del dueño <span class="mute small">(en una demo para un prospecto puede quedar vacío)</span></label><input id="eE" type="email" inputmode="email" value="'+esc(E.email)+'" placeholder="dueno@gmail.com">'
    +'<label for="eTm">Correos del equipo (opcional, uno por línea)</label><textarea id="eTm" placeholder="ayudante@gmail.com">'+esc(E.team)+'</textarea>'
    +(!nw&&b.email?'<div class="between" style="margin-top:14px"><div><h3 style="margin:0">Correos de promos</h3><p class="hint">'+(b.noPromo?"No recibe correos de promos.":"Recibe correos de promos.")+'</p></div><button type="button" class="a-b" data-u="promo">'+(b.noPromo?"Activar":"Desactivar")+'</button></div>':""));
  h+=S("mods","Módulos",mods.length?esc(mods.join(", ")):"Ninguno",
     '<p class="hint">Funciones extra que se encienden solo para este negocio. Los demás no las ven.</p>'
    +Object.keys(C.mods).map(function(k){var m=C.mods[k];return '<div class="between" style="margin-top:12px;gap:12px"><div><b>'+m.ic+" "+esc(m.n)+'</b><p class="hint" style="margin:2px 0 0">'+esc(m.d)+'</p></div>'+tg("md_"+k,!!E.mods[k],m.n)+'</div>'}).join("")
    +'<div id="vehCfg"'+(E.mods.vehiculo?"":" hidden")+'><label>Tipos de vehículo y cuánto suma cada uno</label><div id="eVh"></div><button class="btn ghost" id="eVhA" style="margin-top:8px">+ Agregar tipo</button><p class="hint">En "Servicios y precios" marcá 🚙 los servicios que cambian de precio.</p></div>');
  if(nw)h+=S("plan","Plan y cobro","Prueba, mensual o demo",pplBlock(true));
  else h+=S("plan","Tipo de cuenta (avanzado)",esc(E.demo?"Demo":PLANS[E.plan]?PLANS[E.plan].n:E.plan),'<p class="hint">Se guarda con "Guardar cambios". Para cobrar o cambiar la fecha usá los botones de "Plan y cobros".</p>'+pplBlock(false));
  if(!nw){var a=(typeof ADM!=="undefined"&&ADM[id])||{};
    h+=S("notas","Notas y etiquetas",(a.tags||[]).length?esc(a.tags.join(", ")):a.note?"Con nota":"",'<div id="fNotas">'+notasHtml(id)+'</div>');
    var st=state(s);h+=S("peligro","Pausar o borrar","",'<p class="hint">Pausar deja la página sin recibir reservas. Borrar elimina el negocio con sus citas, clientes y página; los pagos registrados se conservan.</p><div class="a-bt">'+(s?(st==="suspended"?'<button type="button" class="a-b pri" data-u="on">Reactivar</button>':'<button type="button" class="a-b red" data-u="off">Pausar</button>'):"")+'<button type="button" class="a-b red" data-u="del">Borrar negocio…</button></div>',"red")}
  h+='<div class="a-save" id="fSave"'+(nw||DIRTY?"":" hidden")+'><span class="msg" id="fDirty"'+(nw?" hidden":"")+'>Cambios sin guardar</span><p class="err" id="eErr" role="alert"></p><div class="row"><button class="btn ghost" id="eX2" style="flex:0 0 auto;width:auto">Cancelar</button><button class="btn" id="eGo">'+(nw?"Crear negocio":"Guardar cambios")+'</button></div></div>';
  ed.innerHTML=h;ed.classList.toggle("dirty",nw||DIRTY);
  edWire();edUi(id);CUR=E;
  renderNeg();if(KEEP){var k=KEEP;KEEP=null;window.scrollTo(0,k.y);$("fichaPane").scrollTop=k.p}else if(window.innerWidth<900)window.scrollTo(0,0);else $("fichaPane").scrollTop=0;
  if(id)setTimeout(fichaSync,0)};
function mark(){if(DIRTY||!E)return;DIRTY=true;var s=$("fSave");if(s)s.hidden=false;$("ed").classList.add("dirty")}
function openSec(k){var d=document.querySelector('#ed .a-sec[data-sec="'+k+'"]');if(d){d.open=true;OPEN[k]=1}return d}
function edUi(id){var ed=$("ed");
  var close=function(){if(!DIRTY&&E&&E.id||confirm("¿Salir sin guardar?")){dropEd();nav("#negocios",true)}};
  $("eX").onclick=close;$("eX2").onclick=close;
  $("eGo").addEventListener("click",function(e){if(E&&E.stale&&!confirm("Este negocio cambió mientras lo editabas. El plan y los cobros no se tocan, pero tus cambios reemplazan los suyos en la ficha. ¿Guardar igual?")){e.stopImmediatePropagation();e.preventDefault()}},true);
  /* Si el guardado falla, el botón se vuelve a encender: ahí se revisa si el negocio cambió mientras se guardaba. */
  try{new MutationObserver(function(){var g=$("eGo");if(g&&!g.disabled&&E)setTimeout(fichaSync,0)}).observe($("eGo"),{attributes:true,attributeFilter:["disabled"]})}catch(e){}
  ed.oninput=ed.onchange=function(e){if(e.target&&e.target.id==="impT")return;if(E&&e.target&&/^(pPl|pTo|pSp)$/.test(e.target.id))E.planTouched=true;if(e.target&&e.target.closest&&e.target.closest(".a-sec,.a-ia"))mark()};
  ed.onclick=function(e){var g=e.target.closest("[data-go]");if(g){var d=openSec(g.getAttribute("data-go"));if(d)d.scrollIntoView({behavior:"smooth",block:"start"});return}
    var u=e.target.closest("[data-u]");if(u){fichaAct(u.getAttribute("data-u"),id);return}
    var bt=e.target.closest("button");if(bt&&bt.closest(".a-sec .in,.a-ia .in")&&bt.id!=="impGo")mark();if(bt&&bt.id==="impGo")setTimeout(function(){if($("impR")&&!$("impR").hidden)mark()},0)};
  if(id){loadUse(id);checkPub(id)}}
function fichaAct(k,id){if(!id)return;var b=BIZ[id]||{};
  if(k==="msg"){AX.openMsgs(id);return}
  if(k==="mensNone"){var d=openSec("plan");if(d)d.scrollIntoView({behavior:"smooth",block:"center"});toast("No tiene plan todavía: tocá Guardar y queda en prueba gratis. Después registrás la mensualidad.");mark();return}
  if(k==="copy"){copy((C.site||"https://citalyapp.com")+"/"+b.slug+"/reservar","Link de reservas copiado ✓");return}
  if(k==="note"||k==="tag"){act("x",k,id);return}
  if(k==="promo"){act("a","promo",id);return}
  if(!guard())return;
  if(k==="pay"){act("a","pay",id);return}
  if(k==="pf"){act("x","pf",id);return}
  if(k==="off"){act("a","off",id);return}
  if(k==="on"){if(confirm("¿Reactivar a "+(b.name||"este negocio")+"? Su página vuelve a recibir reservas."))act("a","on",id);return}
  if(k==="del"){act("x","del",id)}}
function sigOf(id){try{var b=Object.assign({},BIZ[id]||{});delete b.noPromo;return JSON.stringify([SUBS[id]||null,b])}catch(e){return String(Math.random())}}
function fichaSync(){if(!E||!E.id)return;var id=E.id;
  if(!BIZ[id]){if(loaded()&&!saving()){var n=E.name;dropEd();toast((n||"El negocio")+" ya no existe");nav("#negocios",true)}return}
  var nb=$("fNotas");if(nb)nb.innerHTML=notasHtml(id);
  var pb=document.querySelector('#ed [data-u="promo"]');if(pb){pb.textContent=BIZ[id].noPromo?"Activar":"Desactivar";var ph=pb.parentNode.querySelector(".hint");if(ph)ph.textContent=BIZ[id].noPromo?"No recibe correos de promos.":"Recibe correos de promos."}
  if(REOP===id||saving())return;
  if(sigOf(id)===SIG)return;
  var fa=document.activeElement,foc=fa&&$("ed").contains(fa)&&/^(INPUT|TEXTAREA|SELECT)$/.test(fa.tagName);
  if(!DIRTY&&!foc&&BIZ[id].slug===E.slug){refresh(id);return}
  /* Con cambios o escribiendo: no se recarga (se perdería lo tecleado). Se avisa y Guardar no toca el plan (G1). */
  E.stale=true;var w=$("fWarn");if(w&&!w.querySelector(".stale"))w.innerHTML='<div class="a-warnbox stale" role="alert"><b>Este negocio cambió mientras lo editabas</b> (un pago, el plan o el dueño desde su app). Guardar no toca el plan ni los cobros, pero tus cambios reemplazan los suyos en la ficha. Lo más seguro: tocá Cancelar y volvé a abrir la ficha.</div>'}
/* Refrescar la ficha sin cambios: mismas fotos si el link no cambió (no se vuelven a leer) y mismo lugar en la pantalla. */
function refresh(id){var b=BIZ[id];REOP=id;KEEP={y:window.scrollY,p:$("fichaPane").scrollTop};openEd(id,b&&E&&E.slug===b.slug?E.fotos.map(function(x){return Object.assign({},x)}):null)}
function loadUse(id){var el=$("fUse");if(!el)return;if(USE[id]){el.innerHTML=USE[id];return}el.textContent="Revisando el uso…";
  var hoy=ymdC(),d30=ymdC(Date.now()-30*DAY);
  db.collection("biz/"+id+"/jobs").where("date","<=",hoy).orderBy("date","desc").limit(50).get().then(function(q){
    var all=q.docs.map(function(d){return d.data()||{}}),L=all.filter(function(j){return j.st!=="Cancelada"}),n=L.filter(function(j){return String(j.date)>=d30}).length,last=L[0],full=all.length>=50&&String(all[all.length-1].date)>=d30;
    var t=last?"Última cita: <b>"+fdS(last.date)+"</b> · "+(full?"50+":n)+" cita"+(n===1&&!full?"":"s")+" en los últimos 30 días":"Todavía no tiene citas.";USE[id]=t;var e2=$("fUse");if(e2&&E&&E.id===id)e2.innerHTML=t},
    function(){var e2=$("fUse");if(e2)e2.textContent="No se pudo ver el uso (sin conexión o sin permiso)."})}
function checkPub(id){var b=BIZ[id];if(!b||!b.slug)return;var s=b.slug;
  var show=function(st){var w=$("fWarnPub");if(!w||!E||E.id!==id||st==="ok"||st==="err")return;w.innerHTML='<div class="a-warnbox" role="alert"><b>'+(st==="falta"?"Su link de reservas no abre":"Su link es de otro negocio")+'</b>: '+(st==="falta"?"falta la página pública (pub/"+esc(s)+"). Al guardar la ficha se vuelve a publicar.":"la página pública apunta a otro negocio. Revisalo antes de tocar nada.")+(st==="falta"?' <button type="button" class="a-b pri" id="fRepub" style="margin-top:8px">Volver a publicar</button>':"")+'</div>';
    var r=$("fRepub");if(r)r.onclick=function(){mark();$("eGo").click()}};
  if(PUB[s]){show(PUB[s]);return}
  db.doc("pub/"+s).get().then(function(d){var st=!d.exists?"falta":(d.data()||{}).biz===id?"ok":"otro";PUB[s]=st;var ck=ls(K.lnk,{});ck[s]={s:st,at:Date.now()};lsSet(K.lnk,ck);show(st)},function(){})}

closeEd=function(){if(E&&E.id&&saving()){FOT[E.id]=E.fotos.length;lsSet(K.fot,FOT);if(E.slug){delete PUB[E.slug];var ck=ls(K.lnk,{});if(ck[E.slug]&&ck[E.slug].s==="falta"){delete ck[E.slug];lsSet(K.lnk,ck)}}delete USE[E.id]}
  dropEd();if(parse().v==="negocio")nav("#negocios",true);window.scrollTo(0,0)};
var _fail=fail;fail=function(id,msg){var el=id&&$(id),d=el&&el.closest(".a-sec");if(d){d.open=true;OPEN[d.dataset.sec]=1}else if(!id&&/horario|día/i.test(msg))openSec("hor");mark();return _fail(id,msg)};

/* ---------- pagos (misma lista del clásico, en Plata → Cobros) ---------- */
renderPays=function(){var L=PAYS.slice(0,60);$("pays").innerHTML=L.length?L.map(function(p){return '<div class="li"><span>'+esc(p.name||"")+' <span class="pill">'+(p.type==="setup"?"Instalación":p.type==="saldo"?"Saldo":p.type==="mes"?"Mensualidad":esc(p.what||"Extra"))+'</span><br><span class="mute small">'+fd(p.at)+'</span></span><b>'+crc(p.amt)+'</b></div>'}).join("")+(PAYS.length>60?'<p class="a-more">Los demás están en Reporte.</p>':""):'<p class="mute small" style="margin:0">Aún no hay pagos registrados.</p>';render()};

/* ---------- arranque ---------- */
function boot(){
  if(["all","trial","active","late","owe","suspended","demo"].indexOf(ls(K.f,"all"))>=0)F=ls(K.f,"all");
  var so=ls(K.sort,"new");if(["new","due","name"].indexOf(so)>=0)$("srt").value=so;
  $("q").oninput=function(){render()};
  $("srt").onchange=function(){lsSet(K.sort,this.value);render()};
  $("hoyL").onclick=hoyClick;$("hoyN").onclick=hoyClick;
  $("vence").onclick=function(e){var x=e.target.closest("[data-v]");if(!x)return;var id=x.getAttribute("data-id");if(x.getAttribute("data-v")==="msg")AX.openMsgs(id);else if(guard())act("a","pay",id)};
  $("masEnl").onclick=function(e){var x=e.target.closest("[data-l]");if(!x)return;var k=x.getAttribute("data-l");
    if(k==="chk")checkLinks();else if(k==="cp")copy(resUrl(x.getAttribute("data-s")),"Link copiado ✓");
    else if(k==="all")copy(rowsAll().filter(function(y){return y.b.slug}).map(function(y){return (y.b.name||"")+": "+resUrl(y.b.slug)}).join("\n"),"Links copiados ✓")};
  $("masDem").onclick=function(e){var x=e.target.closest("[data-d]");if(!x)return;if(x.getAttribute("data-d")==="new")nav("#negocio/nuevo");else if(guard())AX.delDemos()};
  $("aSrch").onclick=function(){nav("#negocios");setTimeout(function(){$("q").focus()},60)};
  $("ed").addEventListener("toggle",function(e){var d=e.target;if(d&&d.dataset&&d.dataset.sec){if(d.open)OPEN[d.dataset.sec]=1;else delete OPEN[d.dataset.sec]}},true);
  $("newB").onclick=function(){nav("#negocio/nuevo")};
  window.addEventListener("hashchange",route);
  /* teclado: con foco en un campo de la ficha se esconde la barra de abajo */
  var kb=function(){var a=document.activeElement;document.body.classList.toggle("kb",!!(a&&$("ed").contains(a)&&(/^(TEXTAREA|SELECT)$/.test(a.tagName)||a.tagName==="INPUT"&&!/^(checkbox|radio|button|file|color)$/.test(a.type))))};
  document.addEventListener("focusin",kb);document.addEventListener("focusout",function(){setTimeout(function(){kb();if(E&&E.id&&!DIRTY)fichaSync()},60)});
  window.addEventListener("beforeunload",function(e){if(E&&DIRTY){e.preventDefault();e.returnValue=""}});
  document.addEventListener("keydown",function(e){var t=e.target,typing=t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);
    if(e.key==="/"&&!typing&&!e.ctrlKey&&!e.metaKey&&!$("main").hidden){e.preventDefault();if(R.v!=="negocios"||E)nav("#negocios");setTimeout(function(){$("q").focus()},40)}
    if(e.key==="Escape"){var o=document.querySelector(".shOv");if(o)o.remove()}});
  var off=function(){$("offl").hidden=navigator.onLine};window.addEventListener("online",off);window.addEventListener("offline",off);off();
  var sync=function(){var on=!$("main").hidden;$("nav").hidden=!on;$("aSrch").hidden=!on};
  new MutationObserver(sync).observe($("main"),{attributes:true,attributeFilter:["hidden"]});sync();
  var lg=$("login");if(lg&&!$("out2")){lg.insertAdjacentHTML("beforeend",'<button class="btn ghost" id="out2" type="button" hidden style="margin-top:8px">Salir de esta cuenta</button>');$("out2").onclick=function(){auth.signOut()}}
  auth.onAuthStateChanged(function(u){$("out2").hidden=!u});
  route()}
document.addEventListener("DOMContentLoaded",boot);
return {route:route,tareas:tareas,pasos:pasos,pillOf:pillOf,passF:passF,act:act,isDirty:function(){return DIRTY},nav:nav}})();
