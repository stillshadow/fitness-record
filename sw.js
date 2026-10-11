const CACHE="chibianying-diet-memo-diet-v2-20261011e";
const ASSETS=[
  "./","index.html","manifest.json","deepseek-config.js","app-config.js",
  "food-system.js","ai-system.js","ui-keyboard.js","ui-v2.css",
  "update.html","icon-192.png","icon-512.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(async c=>{
        for(const asset of ASSETS){
          try{ await c.add(asset); }catch{}
        }
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
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(event.request,{cache:"no-store"});
      if(fresh&&fresh.ok){
        const copy=fresh.clone();
        caches.open(CACHE).then(c=>c.put(event.request,copy));
      }
      return fresh;
    }catch{
      return (await caches.match(event.request))||(await caches.match("./"))||(await caches.match("index.html"))||Response.error();
    }
  })());
});