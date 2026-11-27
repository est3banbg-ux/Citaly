/* Citaly · temas premium de la app (Laca y Perla). Turbo en adelante; en la prueba se pueden usar.
   Este archivo solo trabaja cuando el tema está puesto (PREM.set lo llama apariencia.js):
   - pone las clases tm-prem / tm-laca / tm-perla que usa premium.css,
   - cambia los emojis de la interfaz por íconos de trazo (y los devuelve al quitar el tema),
   - y maneja los tres momentos con movimiento: abrir la app, marcar una cita atendida y abrir Números.
   No toca datos ni funciones: todo es sobre lo que ya está pintado. */
var CITALY_PREM=[
  {id:"laca",n:"Laca",d:"Negro pulido, como un capó recién detallado",dark:true,prem:1,v:{},tc:"#07060c",sw:"linear-gradient(180deg,rgba(7,6,12,0) 40%,#07060c),url(tema/laca.webp) 18% 12%/260% auto,#07060c"},
  {id:"perla",n:"Perla",d:"Blanco perla, se lee bien a pleno sol",dark:false,prem:1,v:{},tc:"#eceef4",sw:"linear-gradient(180deg,rgba(236,238,244,0) 50%,#eceef4),url(tema/perla.webp) 70% 20%/240% auto,#eceef4"}
];
var PREM=(function(){
  var R=document.documentElement,on="",mo=null,mm=null,cola=[],pend=0,entro=false,numOk=false,listas=null,toque=0;
  /* íconos: nombre → trazos (24×24, sin relleno) */
  var ICO={
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    spark:'<path d="M11 3l2 5.5L18.5 10 13 12l-2 5.5L9 12 3.5 10 9 8.5z"/><path d="M18.5 15.5v5M16 18h5"/>',
    rocket:'<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.9.7-2.2-.1-3s-2.1-.8-2.9 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-4 12.9 12.9 0 0 1 11-6c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    share:'<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    pin:'<path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    star:'<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    repeat:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    inbox:'<path d="M12 3v10m0 0-4-4m4 4 4-4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    upload:'<path d="M12 14V4m0 0-4 4m4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    bell:'<path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    pencil:'<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    users:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/>',
    car:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2M9 17h6M3 12h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5 1-2 2-2h2a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="7.5" cy="11.5" r=".8"/><circle cx="10.5" cy="7.5" r=".8"/><circle cx="15" cy="8" r=".8"/>',
    coin:'<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    chat:'<path d="M4 5h16v11H9l-5 4z"/>',
    phone:'<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    tel:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    map:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    gem:'<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M9 3 7 9l5 12 5-12-2-6"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    image:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="9.5" r="1.2"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    shield:'<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/>',
    door:'<path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 16l4-4-4-4M20 12H10"/>',
    install:'<rect x="9" y="2" width="11" height="20" rx="2.5"/><path d="M2 12h9m0 0-3-3m3 3-3 3"/>',
    box:'<path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>',
    store:'<path d="M4 10v10h16V10M3 10l2-6h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM10 20v-5h4v5"/>',
    contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="#000"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.2"/>',
    card:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
    bolt:'<path d="M13 2 5 13h6l-1 9 8-11h-6z"/>',
    belloff:'<path d="M6 16v-5a6 6 0 0 1 9-5.2M18 11v5l2 2H8M10 21h4M3 3l18 18"/>',
    warn:'<path d="M12 4 2.5 20h19zM12 10v4M12 17v.2"/>',
    tools:'<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3z"/>',
    bot:'<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V5M9 13v2M15 13v2M2 13v2M22 13v2"/><circle cx="12" cy="4" r="1"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    bank:'<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    clip:'<path d="M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7L10 17a1.7 1.7 0 0 1-2.4-2.4l6.9-7"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8"/>',
    laptop:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    folder:'<path d="M3 6h6l2 2h10v11H3z"/>',
    doc:'<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
    unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    fire:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
  };
  /* emoji de la interfaz → ícono ("" = se esconde). Lo que no está aquí se deja tal cual. */
  var EMO={"🔍":"search","✨":"spark","🚀":"rocket","↗":"share","🎁":"gift","📌":"pin","🎯":"target","⭐":"star","📈":"trend","📅":"cal","🗓":"cal","📆":"cal",
    "🔁":"repeat","💤":"moon","📥":"inbox","📤":"upload","🧾":"receipt","🕘":"clock","⏰":"clock","📸":"camera","📷":"camera","🔔":"bell","🔗":"link",
    "✏️":"pencil","✏":"pencil","📝":"pencil","👥":"users","👋":"","🚗":"car","🚙":"car","☀️":"sun","☀":"sun","🎨":"palette","💰":"coin","💵":"coin",
    "💡":"bulb","💬":"chat","📱":"phone","✅":"check","📞":"tel","🗑️":"trash","🗑":"trash","📍":"map","💎":"gem","🔒":"lock","🖼️":"image","🖼":"image","⚙️":"gear","⚙":"gear",
    "🧭":"compass","🛡️":"shield","🛡":"shield","🚪":"door","📲":"install","📦":"box","👤":"user","🏪":"store","🌓":"contrast","🌗":"contrast","🌐":"globe",
    "❓":"help","💳":"card","⚡":"bolt","🔕":"belloff","⚠️":"warn","⚠":"warn","🗺️":"map","🗺":"map","🛠️":"tools","🛠":"tools","🎥":"video","🤖":"bot",
    "📧":"mail","✉️":"mail","✉":"mail","📬":"mail","🏦":"bank","📎":"clip","📇":"users","🏆":"trophy","💻":"laptop","📂":"folder","📄":"doc","🔓":"unlock",
    "🔥":"fire","💸":"coin","✍️":"pencil","✍":"pencil","📩":"mail","🚧":"warn"};
  var keys=Object.keys(EMO).sort(function(a,b){return b.length-a.length});
  var re=new RegExp("("+keys.map(function(k){return k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("|")+")\\uFE0F?","g");
  function uri(d){return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>')+'")'}
  function estilo(){if(document.getElementById("premIco"))return;var s=document.createElement("style");s.id="premIco";var t=":root{--i-search:"+uri(ICO.search)+"}";for(var k in ICO)t+=".pi-"+k+"{--i:"+uri(ICO[k])+"}";s.textContent=t;document.head.appendChild(s);
    var g=document.createElementNS("http://www.w3.org/2000/svg","svg");g.id="premDefs";g.setAttribute("width","0");g.setAttribute("height","0");g.setAttribute("aria-hidden","true");g.style.cssText="position:absolute;width:0;height:0";
    g.innerHTML='<defs><linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a08cff"/><stop offset="1" stop-color="#ff8a5b"/></linearGradient></defs>';(document.body||R).appendChild(g)}
  function salta(p){return !p||/^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE|INPUT)$/.test(p.nodeName)||p.isContentEditable||(p.classList&&p.classList.contains("pi"))||(p.closest&&p.closest(".noi"))}
  /* Envuelve cada emoji en <i class="pi">: el emoji SIGUE adentro como texto (escondido por premium.css), porque la app
     lee textos de la pantalla (favAll() saca el ícono de cada ajuste con .textContent). Así textContent no cambia. */
  function cambia(raiz){
    if(!raiz)return;var L=[],n;
    if(raiz.nodeType===3){re.lastIndex=0;if(!salta(raiz.parentNode)&&re.test(raiz.nodeValue))L.push(raiz)}
    else if(raiz.nodeType===1){var w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,null);while((n=w.nextNode())){if(salta(n.parentNode))continue;re.lastIndex=0;if(re.test(n.nodeValue))L.push(n)}}
    L.forEach(function(n){var f=document.createDocumentFragment(),t=n.nodeValue,i=0,m;re.lastIndex=0;
      while((m=re.exec(t))){if(m.index>i)f.appendChild(document.createTextNode(t.slice(i,m.index)));var e=document.createElement("i");e.className="pi pi-"+(EMO[m[1]]||"none");e.setAttribute("aria-hidden","true");e.setAttribute("data-e","1");e.textContent=m[0];f.appendChild(e);i=m.index+m[0].length}
      if(i<t.length)f.appendChild(document.createTextNode(t.slice(i)));if(n.parentNode)n.parentNode.replaceChild(f,n)})}
  function devuelve(){Array.prototype.forEach.call(document.querySelectorAll("i.pi[data-e]"),function(e){if(e.parentNode)e.parentNode.replaceChild(document.createTextNode(e.textContent),e)})}
  /* cita que pasa a «Lista» mientras la app está abierta: un brillo en su tarjeta (premium.css .p-done) */
  function citas(){var L=document.querySelectorAll(".job[data-id]"),i,id,ok;if(!L.length)return;var primera=!listas;if(primera)listas={};
    for(i=0;i<L.length;i++){id=L[i].getAttribute("data-id");ok=L[i].classList.contains("st-Lista");
      /* solo si la marcó alguien en ESTE celular hace un momento: si la marca otra persona del equipo, no brilla ni vibra aquí */
      if(!primera&&listas[id]===false&&ok&&Date.now()-toque<4000)festeja(L[i]);listas[id]=ok}}
  /* Al marcar «Lista» la app primero pinta la cita y enseguida abre la hoja «¿Cómo te pagó?»: por eso se espera un momento
     y, si hay una hoja abierta, hasta que se cierre. El brillo tiene que verse. */
  function festeja(j){var id=j.getAttribute("data-id"),n=0,calma=0;
    setTimeout(function va(){var sh=document.getElementById("sh");if(sh&&sh.classList.contains("on")&&n++<200){calma=0;setTimeout(va,150);return}
      if(!calma){calma=1;setTimeout(va,420);return}   /* puede venir otra hoja detrás («¿Cada cuánto vuelve?»): se confirma que quedó libre */
      if(!on)return;var x=document.querySelector('.job.st-Lista[data-id="'+id+'"]');if(!x)return;var c=x.closest(".jc")||x;
      c.classList.add("p-done");try{if(navigator.vibrate)navigator.vibrate(12)}catch(e){}setTimeout(function(){c.classList.remove("p-done")},1300)},380)}
  /* Números: la primera vez que se abre en la sesión, las cifras suben contando */
  function numeros(){if(numOk)return;var v=document.getElementById("v-numeros");if(!v||!v.offsetParent)return;var B=v.querySelectorAll("#stats .stat b");if(!B.length)return;numOk=true;
    if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    Array.prototype.forEach.call(B,function(b){var m=/^(\D*)([\d\s .,]+)(\D*)$/.exec(b.textContent);if(!m)return;var n=parseInt(m[2].replace(/\D/g,""),10);if(!n||n<10)return;
      var t0=0,dur=620;function fmt(x){return String(x).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
      /* el texto real no se toca (la cifra verdadera sigue en la página): lo que cuenta va en data-pn y lo pinta premium.css encima */
      function paso(t){if(!b.isConnected)return;if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
        if(k<1){b.setAttribute("data-pn",m[1]+fmt(Math.round(n*e))+m[3]);requestAnimationFrame(paso)}else b.removeAttribute("data-pn")}
      b.setAttribute("data-pn",m[1]+"0"+m[3]);requestAnimationFrame(paso)})}
  function repasa(){pend=0;if(!on)return;var c=cola;cola=[];mo.disconnect();
    for(var i=0;i<c.length;i++){if(c[i].isConnected)cambia(c[i])}citas();numeros();
    mo.observe(document.body,{childList:true,subtree:true,characterData:true})}
  function toco(){toque=Date.now()}
  function mira(){if(!mo){document.addEventListener("change",toco,true);document.addEventListener("click",toco,true);mo=new MutationObserver(function(M){for(var i=0;i<M.length;i++){var x=M[i];if(x.type==="characterData")cola.push(x.target);else for(var j=0;j<x.addedNodes.length;j++)cola.push(x.addedNodes[j])}
      if(!pend){pend=1;requestAnimationFrame(repasa)}})}
    mo.observe(document.body,{childList:true,subtree:true,characterData:true})}
  /* entrada en cascada, una sola vez por apertura: cuando aparece la pantalla principal */
  function entrada(){if(entro)return;var m=document.getElementById("main");if(!m)return;
    function va(){if(entro||!on||!m.classList.contains("on"))return;entro=true;R.classList.add("p-in");setTimeout(function(){R.classList.remove("p-in")},1700);if(mm){mm.disconnect();mm=null}}
    if(m.classList.contains("on")){entro=true;return}
    if(!mm){mm=new MutationObserver(va);mm.observe(m,{attributes:true,attributeFilter:["class"]})}}
  /* id = "laca" | "perla" | "" (apagado). foto = false si el dueño eligió otro fondo: se respeta el suyo.
     acento = true si eligió un color de acento: los botones se rellenan con ese color (premium.css .tm-acc). */
  function set(id,foto,acento){
    var ok=false;for(var i=0;i<CITALY_PREM.length;i++)if(CITALY_PREM[i].id===id)ok=true;if(!ok)id="";
    if(id){R.classList.toggle("tm-foto",foto!==false);R.classList.toggle("tm-acc",!!acento)}
    if(id===on)return;
    CITALY_PREM.forEach(function(p){R.classList.toggle("tm-"+p.id,p.id===id)});R.classList.toggle("tm-prem",!!id);
    var antes=on;on=id;
    if(id){estilo();if(!antes){cambia(document.body);listas=null;citas();mira();entrada()}}
    else{R.classList.remove("tm-foto","tm-acc","p-in");if(mo)mo.disconnect();cola=[];devuelve()}}
  return{set:set,on:function(){return on},ico:ICO,emo:EMO}
})();
