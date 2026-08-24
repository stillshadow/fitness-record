const CACHE='chibianying-fitness-v1-18';
const ASSETS=['./','index.html','manifest.json','cloud-config.js','food-system.js','training-system.js','history-system.js','update.html','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));

async function networkFirst(request,fallback){
  try{
    const resp=await fetch(request,{cache:'no-store'});
    if(resp&&resp.ok){
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(request,copy));
    }
    return resp;
  }catch(e){
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : Response.error());
  }
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);

  if(e.request.mode==='navigate'){
    e.respondWith(networkFirst(e.request,'index.html'));
    return;
  }

  if(url.origin===location.origin && (url.pathname.endsWith('/cloud-config.js') || url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/food-system.js') || url.pathname.endsWith('/training-system.js') || url.pathname.endsWith('/history-system.js'))){
    e.respondWith(networkFirst(e.request));
    return;
  }

  const cacheable=url.origin===location.origin || url.hostname==='cdn.jsdelivr.net';
  if(!cacheable)return;

  e.respondWith(caches.match(e.request).then(cached=>{
    const fresh=fetch(e.request).then(resp=>{
      if(resp&&resp.ok){
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return resp;
    }).catch(()=>cached||Response.error());
    return cached||fresh;
  }));
});
