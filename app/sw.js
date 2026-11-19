// Citaly: service worker para instalar la app y recibir avisos (Firebase Cloud Messaging). Siempre va a la red.
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",function(e){});
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
