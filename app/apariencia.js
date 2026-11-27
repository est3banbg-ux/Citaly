/* Citaly · Mi apariencia: temas exclusivos, fondos (diseño, escenas, foto propia), animados, acento, letra y vidrio.
   Los datos (CITALY_PACKS, CITALY_BGS, CITALY_ANIMS) viven en temas.js. */
var APA=(function(){
  var K="citaly_ap",R=document.documentElement,tc0=null,tcP=0,st={pack:"",bg:"",anim:"",daily:0,dim:25,blur:0,acc:"",font:"",glass:0},photo="",rafId=0,cv=null,parts=[],lastT=0;
  function lsg(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lss(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
  function load(){try{var o=JSON.parse(lsg(K)||"{}");for(var k in st)if(o[k]!==undefined)st[k]=o[k]}catch(e){}photo=lsg(K+"_foto")||""}
  function save(){lss(K,JSON.stringify(st));try{if(typeof B!=="undefined"&&B&&typeof saveBiz==="function"){var p={pack:st.pack,bg:st.bg==="foto"?"":st.bg,anim:st.anim,daily:st.daily,acc:st.acc,font:st.font,glass:st.glass};if(JSON.stringify(B.uiAp||{})!==JSON.stringify(p))saveBiz({uiAp:p})}}catch(e){}}
  function packs(){return typeof CITALY_PACKS!=="undefined"?CITALY_PACKS:[]}
  function bgs(){return typeof CITALY_BGS!=="undefined"?CITALY_BGS:[]}
  function anims(){return typeof CITALY_ANIMS!=="undefined"?CITALY_ANIMS:[]}
  /* Temas premium (premium.js / premium.css): Turbo en adelante. En la prueba tier() es "nitro", así que se pueden usar.
     Mientras no se sepa el plan (SUB todavía no llegó) se usa lo último que se supo en este celular (citaly_pmok),
     para que la app no parpadee al abrir: ni quien lo tiene lo pierde un instante, ni quien no lo tiene lo ve un instante. */
  function prem(){return typeof CITALY_PREM!=="undefined"?CITALY_PREM:[]}
  function premOk(){try{if(typeof SUB==="undefined"||!SUB||typeof tier!=="function"||typeof TIERS==="undefined")return lsg("citaly_pmok")!=="0";var ok=TIERS.indexOf(tier())>=TIERS.indexOf("turbo");lss("citaly_pmok",ok?"1":"0");return ok}catch(e){return true}}
  function byId(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
  function dayN(){var d=new Date();return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/864e5)}
  function curPack(){var P=packs();if(!P.length)return null;if(st.daily)return P[dayN()%P.length];return st.pack?(byId(P,st.pack)||byId(prem(),st.pack)):null}
  function ensureLayer(){var b=document.getElementById("bgx");if(b)return b;b=document.createElement("div");b.id="bgx";b.setAttribute("aria-hidden","true");b.innerHTML='<i class="bl"></i><canvas class="ba"></canvas><i class="bd"></i>';document.body.insertBefore(b,document.body.firstChild);return b}
  function hexRgb(h){var m=/^#?([0-9a-f]{6})$/i.exec(h||"");if(!m)return null;var n=parseInt(m[1],16);return[n>>16,n>>8&255,n&255]}
  function lum(c){var a=c.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
  function ap2(){if(typeof applyTheme==="function")applyTheme();else apply()}
  function apply(){
    var p=curPack(),vars=["--bg","--card","--ink","--mute","--line","--soft","--acc","--sh"],dkNow=false;
    /* premium: los colores salen de premium.css (clases), no de variables en línea. Si el plan no lo trae, queda guardado pero se ve el diseño normal. */
    var pm=p&&p.prem&&premOk()?p.id:"";if(p&&p.prem&&!pm)p=null;
    if(typeof PREM!=="undefined")PREM.set(pm,!st.bg,!!st.acc);
    if(pm){vars.forEach(function(v){R.style.removeProperty(v)});R.style.removeProperty("--accink")}
    if(p){vars.forEach(function(v){if(p.v[v])R.style.setProperty(v,p.v[v])});dkNow=!!p.dark;R.setAttribute("data-mode",p.dark?"dark":"light")}
    else{var mm=lsg("citaly_mode");if(mm==="light"||mm==="dark")R.setAttribute("data-mode",mm);else R.removeAttribute("data-mode");dkNow=typeof isDark==="function"?isDark():false}
    if(st.acc){R.style.setProperty("--acc",st.acc);var c=hexRgb(st.acc);if(c)R.style.setProperty("--accink",lum(c)>.5?"#1a1530":"#fff")}else if(p)R.style.removeProperty("--accink");
    /* fondo */
    var bgv="",pic="",b=ensureLayer(),bl=b.querySelector(".bl"),bd=b.querySelector(".bd");
    if(st.bg==="foto"&&photo)pic='url("'+photo+'") center/cover no-repeat';
    else if(st.bg){var g=byId(bgs(),st.bg);if(g)bgv=g.bg}
    if(!bgv&&!pic&&p&&p.bg)bgv=p.bg;
    var bgo=st.bg&&st.bg!=="foto"?byId(bgs(),st.bg):null;
    if(!p){if(pic||(bgo&&(bgo.g==="escena"||bgo.dark===true))){R.setAttribute("data-mode","dark");dkNow=true}else if(bgo&&bgo.dark===false){R.setAttribute("data-mode","light");dkNow=false}}
    var on=!!(bgv||pic);
    R.classList.toggle("hasbg",on);
    bl.style.background=pic||bgv||"none";bl.style.filter=pic&&st.blur?"blur("+st.blur+"px)":"none";bl.style.transform=pic&&st.blur?"scale(1.08)":"none";
    bd.style.background=pic?"rgba(0,0,0,"+(st.dim/100)+")":"none";
    R.classList.toggle("glass",!!st.glass||on);
    R.classList.remove("fx-clasica","fx-sistema","fx-redonda");if(st.font)R.classList.add("fx-"+st.font);
    var th=document.querySelector('meta[name="theme-color"]');if(th&&p&&p.v["--bg"]&&/^#/.test(p.v["--bg"]))th.setAttribute("content",p.v["--bg"]);
    /* la barra del sistema toma el color del tema premium y vuelve al de antes cuando se quita */
    if(th){if(tc0===null)tc0=th.getAttribute("content")||"";if(p&&p.tc){th.setAttribute("content",p.tc);tcP=1}else if(tcP){tcP=0;if(!(p&&p.v["--bg"]))th.setAttribute("content",tc0)}}
    startAnim(st.anim,dkNow)}
  /* ---------- animaciones (canvas liviano) ---------- */
  function startAnim(id,dk){
    cancelAnimationFrame(rafId);rafId=0;var b=ensureLayer();cv=b.querySelector(".ba");var cx=cv.getContext("2d");
    if(!id||matchMedia("(prefers-reduced-motion: reduce)").matches){cx.clearRect(0,0,cv.width,cv.height);cv.style.display="none";return}
    cv.style.display="block";var W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,1.5);
    function size(){W=innerWidth;H=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0)}size();
    var N=id==="aurora"?4:id==="estrellas"?70:id==="burbujas"?22:id==="lluvia"?55:34,col=dk?"255,255,255":"90,70,200";parts=[];
    for(var i=0;i<N;i++)parts.push({x:Math.random(),y:Math.random(),r:Math.random(),s:.4+Math.random()*.8,p:Math.random()*6.28});
    var hues=[160,200,270,320];
    function frame(t){rafId=requestAnimationFrame(frame);if(document.hidden)return;if(t-lastT<33)return;lastT=t;var s=t/1000;cx.clearRect(0,0,W,H);
      if(id==="aurora"){cx.globalCompositeOperation=dk?"lighter":"source-over";parts.forEach(function(q,i){var x=(.5+.38*Math.sin(s*.12*q.s+q.p))*W,y=(.25+.45*Math.cos(s*.09*q.s+q.p*2))*H,r=Math.max(W,H)*(.38+.12*Math.sin(s*.2+q.p)),g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"hsla("+hues[i%4]+",85%,"+(dk?55:68)+"%,"+(dk?.20:.22)+")");g.addColorStop(1,"hsla("+hues[i%4]+",85%,60%,0)");cx.fillStyle=g;cx.fillRect(0,0,W,H)});cx.globalCompositeOperation="source-over"}
      else if(id==="estrellas"){parts.forEach(function(q){var a=.25+.75*(.5+.5*Math.sin(s*q.s*1.6+q.p));cx.fillStyle="rgba("+col+","+(a*.8).toFixed(2)+")";cx.beginPath();cx.arc(q.x*W,q.y*H,.5+q.r*1.5,0,6.283);cx.fill()})}
      else if(id==="burbujas"){parts.forEach(function(q){var y=((q.y-s*.012*q.s)%1+1)%1,x=q.x*W+Math.sin(s*.6*q.s+q.p)*14,r=4+q.r*16;cx.strokeStyle="rgba("+col+",.28)";cx.fillStyle="rgba("+col+",.06)";cx.lineWidth=1.2;cx.beginPath();cx.arc(x,y*H,r,0,6.283);cx.fill();cx.stroke()})}
      else if(id==="lluvia"){cx.strokeStyle="rgba("+col+",.32)";cx.lineWidth=1.1;parts.forEach(function(q){var y=((q.y+s*.5*q.s)%1)*H,x=q.x*W+y*.12;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-2,y+10+q.r*12);cx.stroke()})}
      else{parts.forEach(function(q){var x=(q.x+.06*Math.sin(s*.15*q.s+q.p))*W,y=(q.y+.05*Math.cos(s*.12*q.s+q.p))*H,a=.15+.85*Math.max(0,Math.sin(s*q.s*.9+q.p));var g=cx.createRadialGradient(x,y,0,x,y,10+q.r*8);g.addColorStop(0,"rgba(255,235,120,"+(a*.9).toFixed(2)+")");g.addColorStop(1,"rgba(255,235,120,0)");cx.fillStyle=g;cx.beginPath();cx.arc(x,y,10+q.r*8,0,6.283);cx.fill()})}
    }
    rafId=requestAnimationFrame(frame);
    if(!startAnim.rs){startAnim.rs=1;addEventListener("resize",function(){if(st.anim)startAnim(st.anim,R.getAttribute("data-mode")==="dark"||(typeof isDark==="function"&&isDark()))})}}
  /* ---------- foto propia ---------- */
  function pickPhoto(file,done){
    if(!file)return;var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var m=1100,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);var u=c.toDataURL("image/jpeg",.8);
      if(!lss(K+"_foto",u)){toast("La foto es muy pesada para guardarla. Probá con otra.");return}photo=u;st.bg="foto";save();ap2();done&&done()};im.onerror=function(){toast("No pude abrir esa imagen")};im.src=fr.result};fr.readAsDataURL(file)}
  /* ---------- hoja ---------- */
  var ACC=["#6c4cf5","#2f6df6","#0ea5c6","#12a05c","#f08a1c","#e5484d","#e0388f","#8a5a2b","#334155","#d4a017"];
  function tabHtml(t){
    var ct=typeof curTheme==="function"?curTheme():"neg",cur=lsg("citaly_mode")||"auto",h="";
    if(t==="t"){
      h+='<h3 class="apH">Claro u oscuro</h3><div class="chips" id="mdC">'+[["auto","📱 Automático"],["light","☀️ Claro"],["dark","🌙 Oscuro"]].map(function(o){return '<button class="chip" data-md="'+o[0]+'" aria-pressed="'+(cur===o[0]&&!curPack())+'">'+o[1]+'</button>'}).join("")+'</div>';
      if(prem().length){var pok=premOk(),ptr=typeof SUB!=="undefined"&&SUB&&SUB.status==="trial";
        h+='<h3 class="apH">💎 Premium</h3><div class="apP" id="prG">'+prem().map(function(p){return '<button type="button" class="apPm" data-pm="'+p.id+'" aria-pressed="'+(st.pack===p.id&&!st.daily&&pok)+'"><i style="background:'+p.sw.replace(/"/g,"&quot;")+'"></i>'+(pok?'':'<span class="lk">Desde Turbo</span>')+'<b>'+p.n+'</b><small>'+p.d+'</small></button>'}).join("")+'</div>'
          +'<p class="mute small" id="prN" style="margin:8px 0 0">'+(pok?'Diseño completo, con íconos y animaciones propias. Viene en Turbo y Nitro'+(ptr?'; en tu prueba lo podés usar.':'.'):'Vienen con el plan Turbo o Nitro. Tocá uno para ver los planes.')+'</p>'}
      h+='<h3 class="apH">✨ Temas exclusivos</h3><div class="apG" id="pkG">'+packs().map(function(p){return '<button type="button" class="apT" data-pk="'+p.id+'" aria-pressed="'+(st.pack===p.id&&!st.daily)+'"><i style="background:'+p.sw+'"></i><b>'+p.n+'</b><small>'+(p.dark?"🌙 ":"☀️ ")+p.d+'</small></button>'}).join("")+'</div>';
      h+='<label class="apR"><span><b>Cambiar de tema cada día</b><small>Un look nuevo cada mañana</small></span><input type="checkbox" id="apD"'+(st.daily?" checked":"")+'></label>';
      h+='<h3 class="apH">Colores básicos</h3><div class="thg" id="thG">'+THEMES.map(function(t){return '<button type="button" class="thb" data-th="'+t.id+'" aria-pressed="'+(ct===t.id&&!curPack())+'"><i style="background:'+thSw(t)+'"></i><b>'+t.n+'</b><small>'+t.d+'</small></button>'}).join("")+'</div>'}
    else if(t==="f"){
      var gd=bgs().filter(function(x){return x.g==="diseno"}),ge=bgs().filter(function(x){return x.g==="escena"});
      function th(x){return '<button type="button" class="apB" data-bg="'+x.id+'" aria-pressed="'+(st.bg===x.id)+'" aria-label="'+x.n+'"><i style="background:'+x.bg.replace(/"/g,"&quot;")+'"></i><span>'+x.n+'</span></button>'}
      h+='<h3 class="apH" style="margin-top:6px">🎨 Diseños</h3><div class="apG3"><button type="button" class="apB" data-bg="" aria-pressed="'+(!st.bg)+'"><i style="background:var(--bg)"></i><span>Sin fondo</span></button>'+gd.map(th).join("")+'</div>';
      h+='<h3 class="apH">🌅 Escenas</h3><div class="apG3">'+ge.map(th).join("")+'</div>';
      h+='<h3 class="apH">📷 Mi foto</h3><div class="apFoto"><div class="apB" style="max-width:96px"><i id="apPv" style="background:'+(photo?'url('+photo+') center/cover':'var(--soft)')+'"></i></div><div style="flex:1"><button type="button" class="btn alt" id="apUp" style="width:100%">'+(photo?"Cambiar foto":"Subir una foto")+'</button><input type="file" id="apFile" accept="image/*" hidden><small class="mute">Tu carro, tu taller, tu logo… Solo se guarda en este dispositivo.</small></div></div>'
        +'<div id="apPh" '+(st.bg==="foto"?"":"hidden")+'><label class="apS">Oscurecer<input type="range" id="apDim" min="0" max="70" value="'+st.dim+'"></label><label class="apS">Desenfoque<input type="range" id="apBlur" min="0" max="14" value="'+st.blur+'"></label></div>';
      h+='<h3 class="apH">✨ Animados</h3><div class="chips" id="anC"><button class="chip" data-an="" aria-pressed="'+(!st.anim)+'">Ninguno</button>'+anims().map(function(a){return '<button class="chip" data-an="'+a.id+'" aria-pressed="'+(st.anim===a.id)+'">'+a.n+'</button>'}).join("")+'</div><p class="mute small" style="margin:6px 0 0">Se pausan solos si ahorrás batería o tenés «reducir movimiento».</p>'}
    else{
      h+='<h3 class="apH">Color de acento</h3><div class="apAc" id="acC">'+ACC.map(function(c){return '<button type="button" class="apA" data-ac="'+c+'" aria-pressed="'+(st.acc===c)+'" style="background:'+c+'" aria-label="Color '+c+'"></button>'}).join("")+'<label class="apA apCu" title="Otro color"><input type="color" id="acCu" value="'+(st.acc||"#6c4cf5")+'">🎨</label><button type="button" class="chip" data-ac="" aria-pressed="'+(!st.acc)+'">Del tema</button></div>';
      h+='<h3 class="apH">Letra</h3><div class="chips" id="fnC">'+[["","Normal"],["clasica","Clásica"],["redonda","Redondeada"],["sistema","Sistema"]].map(function(o){return '<button class="chip" data-fn="'+o[0]+'" aria-pressed="'+(st.font===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>';
      h+='<label class="apR"><span><b>Tarjetas de vidrio</b><small>Transparentes, se ve el fondo detrás</small></span><input type="checkbox" id="apGl"'+(st.glass?" checked":"")+'></label>';
      h+='<button type="button" class="btn alt" id="apReset" style="width:100%;margin-top:14px">↺ Volver al diseño de siempre</button>'}
    return h}
  function sheetUi(tab){
    tab=tab||"t";
    var body='<div class="nhd"><h2>🎨 Mi apariencia</h2><button type="button" class="nclose" id="apX" aria-label="Cerrar">✕</button></div><p class="mute small" style="margin:-4px 0 10px">Elegí cómo se ve tu app. Se ve al instante.</p>'
      +'<div class="chips apTabs" role="tablist">'+[["t","🎨 Temas"],["f","🖼️ Fondos"],["e","⚙️ Extras"]].map(function(o){return '<button class="chip" role="tab" data-tab="'+o[0]+'" aria-selected="'+(tab===o[0])+'" aria-pressed="'+(tab===o[0])+'">'+o[1]+'</button>'}).join("")+'</div><div id="apBody">'+tabHtml(tab)+'</div>';
    sheet(body,function(){wire(tab)})}
  function refresh(tab){var y=document.querySelector("#shC")&&document.querySelector("#shC").parentNode.scrollTop;var b=document.getElementById("apBody");if(!b)return;b.innerHTML=tabHtml(tab);wire(tab);if(y!=null)document.querySelector("#shC").parentNode.scrollTop=y}
  function wire(tab){
    var $=function(i){return document.getElementById(i)};
    $("apX").onclick=function(){closeSheet()};
    Array.prototype.forEach.call(document.querySelectorAll(".apTabs [data-tab]"),function(b){b.onclick=function(){sheetUi(b.dataset.tab)}});
    var b=$("apBody");
    if(tab==="t"){
      $("mdC").onclick=function(e){var x=e.target.closest("[data-md]");if(!x)return;st.pack="";st.daily=0;save();setMode(x.dataset.md);ap2();refresh("t")};
      if($("prG"))$("prG").onclick=function(e){var x=e.target.closest("[data-pm]");if(!x)return;
        if(!premOk()){if(typeof planSheet==="function")planSheet();if(typeof toast==="function")toast("Laca y Perla vienen desde el plan Turbo");return}
        st.pack=x.dataset.pm;st.daily=0;save();ap2();refresh("t")};
      $("pkG").onclick=function(e){var x=e.target.closest("[data-pk]");if(!x)return;st.pack=x.dataset.pk;st.daily=0;save();ap2();refresh("t")};
      $("apD").onchange=function(){st.daily=this.checked?1:0;if(!st.daily&&!st.pack)st.pack="";save();ap2();refresh("t")};
      $("thG").onclick=function(e){var x=e.target.closest("[data-th]");if(!x)return;st.pack="";st.daily=0;save();setTheme(x.dataset.th);ap2();refresh("t")}}
    else if(tab==="f"){
      b.onclick=function(e){var x=e.target.closest("[data-bg]");if(!x)return;st.bg=x.dataset.bg;var g=byId(bgs(),st.bg);if(g&&g.dark!==null&&g.dark!==undefined){var pk=curPack();if(pk&&!!pk.dark!==!!g.dark){st.pack="";st.daily=0}}save();ap2();refresh("f")};
      $("anC").onclick=function(e){var x=e.target.closest("[data-an]");if(!x)return;st.anim=x.dataset.an;save();ap2();refresh("f")};
      $("apUp").onclick=function(){$("apFile").click()};
      $("apFile").onchange=function(){pickPhoto(this.files[0],function(){refresh("f")})};
      var d=$("apDim"),bl=$("apBlur");if(d){d.oninput=function(){st.dim=+d.value;apply()};d.onchange=save;bl.oninput=function(){st.blur=+bl.value;apply()};bl.onchange=save}}
    else{
      $("acC").onclick=function(e){var x=e.target.closest("[data-ac]");if(!x)return;st.acc=x.dataset.ac;save();ap2();refresh("e")};
      $("acCu").oninput=function(){st.acc=this.value;apply()};$("acCu").onchange=function(){save();refresh("e")};
      $("fnC").onclick=function(e){var x=e.target.closest("[data-fn]");if(!x)return;st.font=x.dataset.fn;save();ap2();refresh("e")};
      $("apGl").onchange=function(){st.glass=this.checked?1:0;save();apply()};
      $("apReset").onclick=function(){if(!confirm("¿Volver al diseño de siempre? Se quitan tema, fondo y animación."))return;st={pack:"",bg:"",anim:"",daily:0,dim:25,blur:0,acc:"",font:"",glass:0};try{localStorage.removeItem(K+"_foto");localStorage.removeItem("citaly_theme")}catch(e){}photo="";R.removeAttribute("style");setMode("auto");save();ap2();if(typeof applyTheme==="function")applyTheme();sheetUi("e");toast("Listo, todo como al inicio ✓")}}}
  function fromBiz(){try{if(typeof B!=="undefined"&&B&&B.uiAp&&!lsg(K)){var o=B.uiAp;for(var k in o)if(st[k]!==undefined)st[k]=o[k];lss(K,JSON.stringify(st));apply()}}catch(e){}}
  load();
  return{apply:apply,sheet:sheetUi,fromBiz:fromBiz,st:function(){return st}}
})();
(function(){if(typeof applyTheme==="function"){var _at=applyTheme;applyTheme=function(){_at();APA.apply()};APA.apply()}})();
