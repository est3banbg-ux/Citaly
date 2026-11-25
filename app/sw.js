// Citaly: service worker para instalar la app, recibir avisos (FCM) y seguir abriendo si la red falla.
// Estrategia: SIEMPRE red primero (así las actualizaciones son instantáneas); la copia guardada solo se usa si la red no responde.
var CK="citaly-v1";
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CK}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
function okUrl(u){return u.origin===self.location.origin||/^https:\/\/www\.gstatic\.com\/firebasejs\//.test(u.href)}
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET"||r.headers.has("range"))return;
  var u=new URL(r.url);if(!okUrl(u)||/\/(__\/|api\/)/.test(u.pathname))return;
  e.respondWith(new Promise(function(res){
    var done=false,t=setTimeout(function(){fall()},5000);
    function fall(){if(done)return;caches.match(r,{ignoreSearch:false}).then(function(c){if(c&&!done){done=true;clearTimeout(t);res(c)}})}
    fetch(r).then(function(x){if(done)return;done=true;clearTimeout(t);if(x&&x.ok&&(x.type==="basic"||x.type==="cors")){var cp=x.clone();caches.open(CK).then(function(c){c.put(r,cp)}).catch(function(){})}res(x)}).catch(function(){
      if(done)return;caches.match(r).then(function(c){if(c){done=true;clearTimeout(t);res(c)}else if(r.mode==="navigate"){caches.match("/app/").then(function(d){done=true;clearTimeout(t);res(d||new Response("<meta charset=utf-8><meta name=viewport content='width=device-width'><body style='font-family:sans-serif;text-align:center;padding:40px'><h2>Sin conexión</h2><p>Revisá tu internet y volvé a intentar.</p>",{headers:{"content-type":"text/html; charset=utf-8"}}))})}else{done=true;clearTimeout(t);res(Response.error())}})})}))});
self.addEventListener("push",function(e){
  var p={};try{p=e.data?e.data.json():{}}catch(x){p={data:{body:e.data&&e.data.text()}}}
  var d=p.data||p,n=p.notification||{};
  var title=d.title||n.title||"Citaly",body=d.body||n.body||"";
  var ack=d.biz&&d.pid?fetch("https://bitter-brook-9ee2.citalyapp-cr.workers.dev/ack",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({biz:d.biz,pid:d.pid})}).catch(function(){}):Promise.resolve();
  e.waitUntil(Promise.all([ack,self.registration.showNotification(title,{body:body,icon:"../icon-192.png",badge:"../badge-96.png",tag:d.url||"citaly",renotify:true,silent:false,requireInteraction:/reserva|cancel|cambi/i.test(title),timestamp:Date.now(),vibrate:[300,120,300,120,300],data:{url:d.url||"/app/"}})]));
});
self.addEventListener("notificationclick",function(e){
  e.notification.close();var url=(e.notification.data&&e.notification.data.url)||"/app/";
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){var c=cs[i];if(c.url.indexOf("/app/")>=0&&"focus" in c){c.navigate&&c.navigate(url).catch(function(){});return c.focus()}}
    return self.clients.openWindow(url)}));
});
