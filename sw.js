const CACHE='chibianying-fitness-v1-8';
const ASSETS=['./','index.html','manifest.json','cloud-config.js','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const cacheable=url.origin===location.origin||url.hostname==='cdn.jsdelivr.net';
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    if(cacheable){
      const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));
    }
    return resp;
  }).catch(()=>url.origin===location.origin?caches.match('index.html'):Response.error())));
});
