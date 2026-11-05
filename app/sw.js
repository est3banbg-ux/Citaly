// Citaly: service worker mínimo para poder instalar la app. Siempre va a la red.
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",function(e){});
