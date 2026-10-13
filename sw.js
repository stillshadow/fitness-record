const CACHE="chibianying-diet-memo-diet-v2-20261013a";
const ASSETS=[
  "./","index.html","manifest.json","deepseek-config.js","app-config.js",
  "food-system.js","ai-system.js","ui-v3.js","ui-keyboard.js","ui-v2.css",
  "update.html","icon-192.png","icon-512.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(async cache=>{
        for(const asset of ASSETS){try{await cache.add(asset)}catch{}}
      })
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  const network=fetch(event.request,{cache:"no-store"}).then(async fresh=>{
    if(fresh&&fresh.ok){
      const cache=await caches.open(CACHE);
      await cache.put(event.request,fresh.clone());
    }
    return fresh;
  }).catch(()=>null);

  event.waitUntil(network.then(()=>{}));
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    return (await network)||(await caches.match("index.html"))||Response.error();
  })());
});