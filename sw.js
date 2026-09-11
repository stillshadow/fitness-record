const CACHE='chibianying-fitness-v1-44';
const ASSETS=['./','index.html','manifest.json','cloud-config.js','food-system.js','training-system.js','history-system.js','set-logger.js','strength-filter.js','training-plan-v2.js','training-session.js','last-performance.js','ui-v2.js','ui-v2.css','ui-v3.js','ui-v5.js','ui-final.js','ui-keyboard.js','update.html','icon-192.png','icon-512.png'];
const EARLY_UI='<script src="ui-v5.js?v=44" data-ui-v5="1"></script><script src="ui-final.js?v=44" data-ui-final="1"></script><script src="ui-keyboard.js?v=44" data-ui-keyboard="1"></script>';

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

async function injectEarlyUI(resp){
  if(!resp||!resp.ok)return resp;
  const type=resp.headers.get('content-type')||'';
  if(!type.includes('text/html'))return resp;
  let html=await resp.text();
  if(!html.includes('data-ui-v5'))html=html.replace('</head>',EARLY_UI+'</head>');
  const headers=new Headers(resp.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(html,{status:resp.status,statusText:resp.statusText,headers});
}

async function navigationResponse(request){
  try{
    const resp=await fetch(request,{cache:'no-store'});
    if(resp&&resp.ok){
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(request,copy));
      return injectEarlyUI(resp);
    }
    return injectEarlyUI(resp);
  }catch(e){
    const cached=(await caches.match(request))||(await caches.match('index.html'));
    return cached?injectEarlyUI(cached):Response.error();
  }
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);

  if(e.request.mode==='navigate'){
    e.respondWith(navigationResponse(e.request));
    return;
  }

  if(url.origin===location.origin && (url.pathname.endsWith('/cloud-config.js') || url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/food-system.js') || url.pathname.endsWith('/training-system.js') || url.pathname.endsWith('/history-system.js') || url.pathname.endsWith('/set-logger.js') || url.pathname.endsWith('/strength-filter.js') || url.pathname.endsWith('/training-plan-v2.js') || url.pathname.endsWith('/training-session.js') || url.pathname.endsWith('/last-performance.js') || url.pathname.endsWith('/ui-v2.js') || url.pathname.endsWith('/ui-v2.css') || url.pathname.endsWith('/ui-v3.js') || url.pathname.endsWith('/ui-v5.js') || url.pathname.endsWith('/ui-final.js') || url.pathname.endsWith('/ui-keyboard.js'))){
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