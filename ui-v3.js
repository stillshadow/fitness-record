(() => {
  const $ = id => document.getElementById(id);
  const AVATAR = 'data:image/webp;base64,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';
  const STYLE = `
    body.ui-v3{--v3-bg:#07090d;--v3-panel:#0e1218;--v3-panel2:#141a22;--v3-text:#f4f6fb;--v3-muted:#7c8797;--v3-line:rgba(255,255,255,.07);--v3-accent:#9badff;background:radial-gradient(circle at 50% -8%,rgba(119,145,255,.12),transparent 32%),#07090d!important;padding-bottom:0!important;min-height:100vh}
    body.ui-v3>.bottom-nav,body.ui-v3 .bottom-nav,body.ui-v3 .desktop-tabs,body.ui-v3 .fab{display:none!important}
    body.ui-v3 .header{display:none!important}
    body.ui-v3 .app{max-width:820px!important;padding:0 14px 44px!important;margin:auto}
    body.ui-v3 .page{display:none!important}
    body.ui-v3.v3-legacy-open .page.active{display:block!important;animation:v3PageIn .18s ease-out}
    #v3Home,#v3SettingsRoot{min-height:100vh;padding:calc(18px + env(safe-area-inset-top)) 0 32px}
    #v3Home[hidden],#v3SettingsRoot[hidden]{display:none!important}
    .v3-top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px}
    .v3-today{font-size:12px;color:var(--v3-muted);letter-spacing:.04em}.v3-today b{display:block;color:var(--v3-text);font-size:17px;letter-spacing:0;margin-top:1px}
    .v3-icon-btn{width:40px;height:40px;border:1px solid var(--v3-line);border-radius:13px;background:rgba(18,23,31,.68);color:#cbd3e3;display:grid;place-items:center;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .v3-icon-btn svg{width:19px;height:19px}
    .v3-avatar-stage{height:min(48vh,440px);min-height:300px;display:grid;place-items:center;position:relative;isolation:isolate;perspective:700px;overflow:hidden}
    .v3-avatar-stage:before{content:"";position:absolute;width:min(72vw,390px);height:min(72vw,390px);border-radius:50%;background:radial-gradient(circle,rgba(119,145,255,.15),rgba(119,145,255,.035) 48%,transparent 70%);filter:blur(2px);animation:v3Glow 5.5s ease-in-out infinite;z-index:-2}
    .v3-avatar-stage:after{content:"";position:absolute;bottom:14%;width:180px;height:30px;border-radius:50%;background:rgba(0,0,0,.56);filter:blur(18px);animation:v3Shadow 4.4s ease-in-out infinite;z-index:-1}
    .v3-avatar-orbit{position:absolute;width:290px;height:290px;border:1px solid rgba(154,174,255,.055);border-radius:50%;animation:v3Orbit 18s linear infinite;z-index:-1}.v3-avatar-orbit:before,.v3-avatar-orbit:after{content:"";position:absolute;width:4px;height:4px;background:#9badff;border-radius:1px;box-shadow:0 0 14px rgba(155,173,255,.8)}.v3-avatar-orbit:before{top:22px;left:55px}.v3-avatar-orbit:after{right:24px;bottom:70px;opacity:.5}
    .v3-avatar{height:min(42vh,390px);max-height:390px;width:auto;max-width:78vw;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 18px 28px rgba(0,0,0,.28));animation:v3Float 4.4s ease-in-out infinite;transform:translate3d(var(--px,0),var(--py,0),0);transition:transform .22s ease-out;will-change:transform}
    .v3-action-stack{display:grid;gap:10px;margin-top:-6px;position:relative;z-index:2}
    .v3-start{width:100%;border:0;border-radius:18px;padding:17px 18px;background:linear-gradient(135deg,#b9c5ff,#8fa4ff);color:#080d17;display:flex;align-items:center;justify-content:space-between;text-align:left;box-shadow:0 12px 38px rgba(104,130,255,.16)}
    .v3-start strong{font-size:17px}.v3-start small{display:block;font-size:11px;opacity:.64;margin-top:2px}.v3-start .v3-arrow{font-size:24px;font-weight:400}
    .v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .v3-action{min-height:82px;border:1px solid var(--v3-line);border-radius:16px;background:linear-gradient(180deg,rgba(19,24,32,.92),rgba(13,17,23,.94));color:var(--v3-text);padding:13px 14px;text-align:left;display:flex;flex-direction:column;justify-content:space-between;transition:transform .12s ease,border-color .16s ease,background .16s ease}
    .v3-action:active,.v3-start:active{transform:scale(.985)}.v3-action:hover{border-color:rgba(155,173,255,.22);background:#121823}
    .v3-action svg{width:18px;height:18px;color:#9daceb}.v3-action b{font-size:13px}.v3-action small{font-size:10px;color:var(--v3-muted);margin-top:1px}
    .v3-pagebar{display:flex;align-items:center;gap:11px;padding:calc(16px + env(safe-area-inset-top)) 0 16px;position:sticky;top:0;z-index:12;background:linear-gradient(180deg,#07090d 72%,rgba(7,9,13,0));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    .v3-back{width:38px;height:38px;border:1px solid var(--v3-line);border-radius:12px;background:#10151c;color:var(--v3-text);font-size:22px;line-height:1}.v3-pagebar-title{font-size:19px;font-weight:780}.v3-pagebar small{display:block;color:var(--v3-muted);font-size:10px;font-weight:500;margin-top:1px}
    body.ui-v3.v3-legacy-open .card{background:linear-gradient(180deg,rgba(16,21,28,.97),rgba(12,16,22,.97))!important;border:1px solid var(--v3-line)!important;border-radius:18px!important;box-shadow:none!important}
    body.ui-v3.v3-legacy-open .grid{gap:10px!important}
    body.ui-v3 #page-today #homeStartTrainingBtn,body.ui-v3 #page-today #homeAddFoodBtn,body.ui-v3 #page-today #planHint,body.ui-v3 #page-today #clearLoadedPlanBtn{display:none!important}
    body.ui-v3 #page-training .card:has(#strengthList),body.ui-v3 #page-training .card:has(#exerciseList){display:none!important}
    body.ui-v3 #page-training #planList [data-load-plan]{display:none!important}
    .v3-settings-title{font-size:25px;font-weight:790;margin:28px 2px 5px}.v3-settings-sub{color:var(--v3-muted);font-size:12px;margin:0 2px 20px}
    .v3-settings-list{display:grid;gap:9px}.v3-setting-row{width:100%;border:1px solid var(--v3-line);background:linear-gradient(180deg,#10151d,#0d1117);color:var(--v3-text);border-radius:17px;padding:15px 16px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:11px;text-align:left}.v3-setting-icon{width:38px;height:38px;border-radius:12px;background:#171e2a;display:grid;place-items:center;color:#aab9ff}.v3-setting-icon svg{width:18px;height:18px}.v3-setting-copy b{display:block;font-size:14px}.v3-setting-copy small{display:block;color:var(--v3-muted);font-size:10px;margin-top:2px}.v3-setting-chevron{font-size:21px;color:#586271}
    .v3-progress-card{grid-column:span 12;background:linear-gradient(180deg,rgba(16,21,29,.98),rgba(11,15,21,.98));border:1px solid var(--v3-line);border-radius:18px;padding:16px}.v3-progress-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:15px}.v3-progress-head h2{font-size:14px;margin:0}.v3-progress-head span{font-size:10px;color:var(--v3-muted)}
    .v3-progress-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--v3-line);border-bottom:1px solid var(--v3-line)}.v3-stat{padding:13px 10px;border-right:1px solid var(--v3-line)}.v3-stat:last-child{border-right:0}.v3-stat small{display:block;color:var(--v3-muted);font-size:10px}.v3-stat strong{display:block;font-size:18px;margin-top:2px}.v3-stat em{font-style:normal;color:var(--v3-muted);font-size:9px}
    #v3WeightChart{height:190px;margin-top:13px}#v3WeightChart svg{display:block;width:100%;height:100%}.v3-chart-grid{stroke:rgba(255,255,255,.055);stroke-width:1}.v3-chart-raw{fill:none;stroke:#56627b;stroke-width:1.4;opacity:.75}.v3-chart-trend{fill:none;stroke:#aab9ff;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.v3-chart-dot{fill:#aab9ff}.v3-chart-label{fill:#687486;font-size:9px}
    .v3-macros{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.v3-macro{padding:11px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045)}.v3-macro small{display:block;color:var(--v3-muted);font-size:10px}.v3-macro b{font-size:16px}.v3-macro span{font-size:9px;color:#626d7c;margin-left:3px}.v3-mini-bar{height:3px;background:#171c24;border-radius:999px;margin-top:8px;overflow:hidden}.v3-mini-bar i{display:block;height:100%;background:#9badff;border-radius:999px}
    .v3-old-progress{display:none!important}
    #v3Splash{position:fixed;inset:0;z-index:1000;background:#07090d;display:grid;place-items:center;opacity:1;transition:opacity .38s ease;pointer-events:auto}#v3Splash.hide{opacity:0;pointer-events:none}.v3-splash-inner{text-align:center;transform:translateY(-4vh)}.v3-splash-kicker{font-size:10px;letter-spacing:.34em;color:#687489;margin-bottom:12px;text-transform:uppercase}.v3-splash-name{font-size:25px;font-weight:800;letter-spacing:.04em;color:#f2f5fb;animation:v3SplashName .7s ease-out both}.v3-splash-line{height:2px;width:34px;border-radius:99px;background:#9badff;margin:16px auto 0;animation:v3SplashLine .8s .12s ease both}
    @keyframes v3Float{0%,100%{translate:0 0}50%{translate:0 -7px}}@keyframes v3Glow{0%,100%{transform:scale(.96);opacity:.72}50%{transform:scale(1.05);opacity:1}}@keyframes v3Shadow{0%,100%{transform:scaleX(.92);opacity:.62}50%{transform:scaleX(.78);opacity:.42}}@keyframes v3Orbit{to{transform:rotate(360deg)}}@keyframes v3PageIn{from{opacity:.65;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes v3SplashName{from{opacity:0;transform:translateY(7px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}@keyframes v3SplashLine{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
    @media(max-width:700px){body.ui-v3 .app{padding:0 12px 34px!important}.v3-avatar-stage{height:43vh;min-height:285px}.v3-avatar{height:38vh;max-height:350px}.v3-progress-summary{grid-template-columns:repeat(3,1fr)}.v3-stat{padding:11px 8px}.v3-stat strong{font-size:16px}}
    @media(max-width:430px){.v3-avatar-stage{height:41vh;min-height:270px}.v3-avatar{height:36vh}.v3-grid{gap:8px}.v3-action{min-height:78px}.v3-macros{gap:6px}.v3-macro{padding:9px 8px}}
    /* Calm UI: keep the interface static and predictable. */
    body.ui-v3 *,body.ui-v3 *::before,body.ui-v3 *::after,#v3Splash *{
      animation:none!important;
      transition:none!important;
    }
    body.ui-v3 .v3-avatar{transform:none!important;will-change:auto!important}
    body.ui-v3 .v3-avatar-orbit{display:none!important}
    body.ui-v3 .v3-action:active,body.ui-v3 .v3-start:active,body.ui-v3 .btn:active{transform:scale(.985)!important}
    @media(prefers-reduced-motion:reduce){body.ui-v3 *,#v3Splash *{animation:none!important;transition:none!important}.v3-avatar{transform:none!important}}
  `;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const prettyToday = () => { const d=new Date(), w=['周日','周一','周二','周三','周四','周五','周六']; return `${d.getMonth()+1}月${d.getDate()}日 · ${w[d.getDay()]}`; };
  const getDB = () => window.fitnessApp?.getDB?.() || {days:{},settings:{},exercises:[]};
  const putDB = db => { window.fitnessApp?.replaceDB?.(db); window.dispatchEvent(new CustomEvent('fitness:changed')); };

  function injectStyle(){ if($('uiV3Style')) return; const s=document.createElement('style'); s.id='uiV3Style'; s.textContent=STYLE; document.head.appendChild(s); }
  function icon(name){
    const p={
      gear:'<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19 13.3v-2.6l-2-.6a7 7 0 0 0-.7-1.7l1-1.8-1.9-1.9-1.8 1a7 7 0 0 0-1.7-.7l-.6-2H8.7l-.6 2a7 7 0 0 0-1.7.7l-1.8-1-1.9 1.9 1 1.8a7 7 0 0 0-.7 1.7l-2 .6v2.6l2 .6a7 7 0 0 0 .7 1.7l-1 1.8 1.9 1.9 1.8-1a7 7 0 0 0 1.7.7l.6 2h2.6l.6-2a7 7 0 0 0 1.7-.7l1.8 1 1.9-1.9-1-1.8a7 7 0 0 0 .7-1.7l2-.6Z"/>',
      food:'<path d="M7 3v8M4.5 3v5.5A2.5 2.5 0 0 0 7 11v10M9.5 3v5.5A2.5 2.5 0 0 1 7 11M16 3v18M16 3c2 0 4 2.4 4 5.5S18 14 16 14"/>',
      weight:'<path d="M5 7.5h14l1.5 12h-17l1.5-12Z"/><path d="M9 7.5a3 3 0 0 1 6 0M12 7.5l1.6 2.2"/>',
      records:'<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
      progress:'<path d="m4 18 5-5 3 3 7-8M15 8h4v4"/>',
      training:'<path d="M5 9v6M8 7v10M16 7v10M19 9v6M8 12h8"/>',
      cloud:'<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.2 4.5 4.5 0 0 0 7 18Z"/>',
      target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
      library:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'
    }[name]||'';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  function purgeLegacyDayPlans(){
    if(!window.fitnessApp?.getDB) return;
    const db=getDB(); let changed=false;
    Object.values(db.days||{}).forEach(day=>{
      if(!day) return;
      if(day.planId || day.planName || (day.planExerciseIds||[]).length || day.planOverrides || day.planMainExerciseIds || day.planFinisherIds){
        delete day.planId; delete day.planName; delete day.planOverrides; delete day.planMainExerciseIds; delete day.planFinisherIds; day.planExerciseIds=[]; changed=true;
      }
    });
    if(changed){ db.meta=db.meta||{}; db.meta.updatedAt=new Date().toISOString(); db.meta.userTouched=true; putDB(db); }
  }

  function makeShell(){
    if($('v3Home')) return;
    const app=document.querySelector('.app'); if(!app) return;
    document.querySelector('.bottom-nav')?.remove(); document.querySelector('.desktop-tabs')?.remove(); document.getElementById('fab')?.remove();
    const home=document.createElement('main'); home.id='v3Home';
    home.innerHTML=`
      <div class="v3-top"><div class="v3-today">今天<b>${prettyToday()}</b></div><button class="v3-icon-btn" id="v3SettingsBtn" aria-label="设置">${icon('gear')}</button></div>
      <div class="v3-avatar-stage" id="v3AvatarStage"><div class="v3-avatar-orbit"></div><img class="v3-avatar" id="v3Avatar" src="${AVATAR}" alt="我的像素形象"></div>
      <div class="v3-action-stack">
        <button class="v3-start" id="v3StartTraining"><span><strong id="v3StartText">开始训练</strong><small id="v3StartSub">从模板或自由训练开始</small></span><span class="v3-arrow">›</span></button>
        <div class="v3-grid">
          <button class="v3-action" id="v3Food">${icon('food')}<span><b>记录食物</b><small>添加今天吃的东西</small></span></button>
          <button class="v3-action" id="v3Weight">${icon('weight')}<span><b>记录晨重</b><small id="v3WeightSub">今天还没记录</small></span></button>
          <button class="v3-action" id="v3Records">${icon('records')}<span><b>我的记录</b><small>按日期查看训练与饮食</small></span></button>
          <button class="v3-action" id="v3Progress">${icon('progress')}<span><b>我的进度</b><small>体重、力量与执行趋势</small></span></button>
        </div>
      </div>`;
    app.insertBefore(home,app.firstChild);

    const settings=document.createElement('section'); settings.id='v3SettingsRoot'; settings.hidden=true;
    settings.innerHTML=`
      <div class="v3-pagebar"><button class="v3-back" data-v3-home aria-label="返回">‹</button><div><div class="v3-pagebar-title">设置</div><small>训练、饮食和数据统一管理</small></div></div>
      <div class="v3-settings-title">设置</div><div class="v3-settings-sub">日常记录留在首页，低频管理都收在这里。</div>
      <div class="v3-settings-list">
        <button class="v3-setting-row" data-v3-open="training"><span class="v3-setting-icon">${icon('training')}</span><span class="v3-setting-copy"><b>训练设置</b><small>训练模板与自定义动作</small></span><span class="v3-setting-chevron">›</span></button>
        <button class="v3-setting-row" data-v3-open="food"><span class="v3-setting-icon">${icon('food')}</span><span class="v3-setting-copy"><b>饮食设置</b><small>餐食模板与食物库</small></span><span class="v3-setting-chevron">›</span></button>
        <button class="v3-setting-row" data-v3-open="settings"><span class="v3-setting-icon">${icon('target')}</span><span class="v3-setting-copy"><b>目标与数据</b><small>碳蛋脂、云同步与备份</small></span><span class="v3-setting-chevron">›</span></button>
      </div>`;
    app.insertBefore(settings,home.nextSibling);
  }

  function addSplash(){
    if($('v3Splash')) return;
    const s=document.createElement('div'); s.id='v3Splash'; s.innerHTML='<div class="v3-splash-inner"><div class="v3-splash-kicker">FITNESS RECORD</div><div class="v3-splash-name">池边影の健身记录</div><div class="v3-splash-line"></div></div>'; document.body.appendChild(s);
    const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    setTimeout(()=>{ s.classList.add('hide'); setTimeout(()=>s.remove(),reduced?20:420); },reduced?280:1050);
  }

  function ensurePageBar(page,title,sub,parent='home'){
    if(!page) return;
    let bar=page.querySelector(':scope > .v3-pagebar');
    if(!bar){ bar=document.createElement('div'); bar.className='v3-pagebar'; page.insertBefore(bar,page.firstChild); }
    bar.innerHTML=`<button class="v3-back" aria-label="返回">‹</button><div><div class="v3-pagebar-title">${esc(title)}</div><small>${esc(sub||'')}</small></div>`;
    bar.querySelector('button').onclick=()=>parent==='settings'?showSettings():showHome();
  }

  function showBasePage(name){
    if(typeof window.showPage==='function') window.showPage(name);
    else document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));
  }
  function showHome(){
    document.body.classList.remove('v3-legacy-open');
    $('v3Home').hidden=false; $('v3SettingsRoot').hidden=true; window.scrollTo({top:0,behavior:'instant'}); refreshHome();
  }
  function showSettings(){
    document.body.classList.remove('v3-legacy-open');
    $('v3Home').hidden=true; $('v3SettingsRoot').hidden=false; window.scrollTo({top:0,behavior:'instant'});
  }
  function showLegacy(name,title,sub){
    $('v3Home').hidden=true; $('v3SettingsRoot').hidden=true; document.body.classList.add('v3-legacy-open'); showBasePage(name);
    const page=$(`page-${name}`); ensurePageBar(page,title,sub,name==='today'||name==='progress'?'home':'settings');
    if(name==='progress'){ window.renderStrength?.(); renderProgressV3(); }
    if(name==='today') moveRecentRecords();
    window.scrollTo({top:0,behavior:'instant'});
  }

  function moveRecentRecords(){
    const card=$('recentRecordsCard'),grid=$('page-today')?.querySelector('.grid');
    if(card&&grid&&card.parentElement!==grid){ card.querySelector('.section h2') && (card.querySelector('.section h2').textContent='最近记录'); grid.appendChild(card); }
  }
  function moveStrengthToProgress(){
    const card=$('strengthList')?.closest('.card'),grid=$('page-progress')?.querySelector('.grid');
    if(!card||!grid) return;
    if(card.parentElement!==grid) grid.appendChild(card);
    const h=card.querySelector('.section h2'); if(h) h.textContent='力量进度';
    const m=card.querySelector('.section .meta'); if(m) m.textContent='按部位查看当前最佳表现';
  }

  function foodTotals(day){
    return (day?.foods||[]).reduce((s,f)=>{
      let c,p,fa;
      if(f.totalMacros){ c=+f.totalC||0; p=+f.totalP||0; fa=+f.totalF||0; }
      else { const q=(+f.grams||0)/100; c=(+f.c||0)*q; p=(+f.p||0)*q; fa=(+f.f||0)*q; }
      s.c+=c;s.p+=p;s.f+=fa;return s;
    },{c:0,p:0,f:0});
  }
  const avg = a => a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  function progressData(){
    const db=getDB(),days=Object.values(db.days||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d.date))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const weights=days.filter(d=>d.weight!=null).map(d=>({date:d.date,value:+d.weight}));
    const last7=weights.slice(-7).map(x=>x.value),prev7=weights.slice(-14,-7).map(x=>x.value),a7=avg(last7),p7=avg(prev7),delta=a7!=null&&p7!=null?a7-p7:null;
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-29);cutoff.setHours(0,0,0,0);
    const recent30=days.filter(d=>new Date(d.date+'T00:00:00')>=cutoff),trainingDays=recent30.filter(d=>(d.training||[]).length||(+d.cardio||0)>0).length;
    const diet=days.filter(d=>(d.foods||[]).length).slice(-7),macro=diet.map(foodTotals);
    const macroAvg={c:avg(macro.map(x=>x.c))||0,p:avg(macro.map(x=>x.p))||0,f:avg(macro.map(x=>x.f))||0};
    return {db,weights:weights.slice(-30),latest:weights.at(-1)?.value??null,a7,p7,delta,trainingDays,dietCount:diet.length,macroAvg};
  }

  function weightSvg(rows){
    if(rows.length<2) return '<div class="empty">继续记录晨重后会出现30天趋势。</div>';
    const W=640,H=190,pad={l:34,r:14,t:14,b:24},vals=rows.map(x=>x.value),mn=Math.min(...vals)-.25,mx=Math.max(...vals)+.25,span=Math.max(.5,mx-mn);
    const x=i=>pad.l+(W-pad.l-pad.r)*(i/Math.max(1,rows.length-1)),y=v=>pad.t+(H-pad.t-pad.b)*(1-(v-mn)/span);
    const raw=rows.map((r,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
    const trend=rows.map((r,i)=>({i,v:avg(rows.slice(Math.max(0,i-6),i+1).map(x=>x.value))})).filter(x=>x.i>=2).map((r,j)=>`${j?'L':'M'}${x(r.i).toFixed(1)},${y(r.v).toFixed(1)}`).join(' ');
    const grids=[0,.5,1].map(t=>{const yy=pad.t+(H-pad.t-pad.b)*t,val=(mx-span*t).toFixed(1);return `<line class="v3-chart-grid" x1="${pad.l}" x2="${W-pad.r}" y1="${yy}" y2="${yy}"/><text class="v3-chart-label" x="2" y="${yy+3}">${val}</text>`}).join('');
    const first=rows[0].date.slice(5).replace('-','/'),last=rows.at(-1).date.slice(5).replace('-','/');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grids}<path class="v3-chart-raw" d="${raw}"/><path class="v3-chart-trend" d="${trend}"/><circle class="v3-chart-dot" cx="${x(rows.length-1)}" cy="${y(rows.at(-1).value)}" r="3.3"/><text class="v3-chart-label" x="${pad.l}" y="${H-4}">${first}</text><text class="v3-chart-label" text-anchor="end" x="${W-pad.r}" y="${H-4}">${last}</text></svg>`;
  }

  function renderProgressV3(){
    const page=$('page-progress'),grid=page?.querySelector('.grid'); if(!grid) return;
    [...grid.children].forEach(c=>{ if(c.id!=='v3ProgressOverview'&&c.id!=='v3MacroOverview'&&!c.querySelector?.('#strengthList')) c.classList.add('v3-old-progress'); });
    moveStrengthToProgress();
    let main=$('v3ProgressOverview'); if(!main){ main=document.createElement('div');main.id='v3ProgressOverview';main.className='v3-progress-card';grid.insertBefore(main,grid.firstChild); }
    let macros=$('v3MacroOverview'); if(!macros){ macros=document.createElement('div');macros.id='v3MacroOverview';macros.className='v3-progress-card'; main.insertAdjacentElement('afterend',macros); }
    const d=progressData(),delta=d.delta;
    const deltaText=delta==null?'数据不足':`${delta<0?'↓':'↑'}${Math.abs(delta).toFixed(2)}kg`,latest=d.latest==null?'-':`${d.latest.toFixed(2)}kg`,avg7=d.a7==null?'-':`${d.a7.toFixed(2)}kg`;
    main.innerHTML=`<div class="v3-progress-head"><h2>身体趋势</h2><span>最近30天</span></div><div class="v3-progress-summary"><div class="v3-stat"><small>最近晨重</small><strong>${latest}</strong><em>最新一次记录</em></div><div class="v3-stat"><small>7次均重</small><strong>${avg7}</strong><em>平滑日波动</em></div><div class="v3-stat"><small>均重变化</small><strong>${deltaText}</strong><em>较前7次</em></div></div><div id="v3WeightChart">${weightSvg(d.weights)}</div><div class="v3-stat" style="border:0;padding:5px 2px 0"><small>最近30天训练日</small><strong>${d.trainingDays} 天</strong></div>`;
    const target=d.db.settings||{},m=d.macroAvg,bar=(v,t)=>Math.min(100,Math.max(0,t?v/t*100:0));
    macros.innerHTML=`<div class="v3-progress-head"><h2>饮食执行</h2><span>最近${d.dietCount||0}个有饮食记录的日子</span></div><div class="v3-macros"><div class="v3-macro"><small>碳水</small><b>${m.c.toFixed(0)}g</b><span>/ ${+target.c||0}g</span><div class="v3-mini-bar"><i style="width:${bar(m.c,+target.c||0)}%"></i></div></div><div class="v3-macro"><small>蛋白质</small><b>${m.p.toFixed(0)}g</b><span>/ ${+target.p||0}g</span><div class="v3-mini-bar"><i style="width:${bar(m.p,+target.p||0)}%"></i></div></div><div class="v3-macro"><small>脂肪</small><b>${m.f.toFixed(0)}g</b><span>/ ${+target.f||0}g</span><div class="v3-mini-bar"><i style="width:${bar(m.f,+target.f||0)}%"></i></div></div></div>`;
  }

  function refreshHome(){
    const db=getDB(),day=db.days?.[today()],weight=day?.weight;
    const ws=$('v3WeightSub'); if(ws) ws.textContent=weight!=null?`今天 ${Number(weight).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')} kg`:'今天还没记录';
    let active=!!window.fitnessWorkoutContext;
    if(!active){try{const s=JSON.parse(localStorage.getItem('chibianyingActiveWorkoutV2')||'null');active=!!(s?.date===today()&&s?.exerciseIds?.length)}catch{}}
    const text=$('v3StartText'),sub=$('v3StartSub'); if(text) text.textContent=active?'继续训练':'开始训练'; if(sub) sub.textContent=active?'回到本次训练':'从模板或自由训练开始';
  }

  function wire(){
    $('v3SettingsBtn').onclick=showSettings; document.querySelector('[data-v3-home]').onclick=showHome;
    $('v3Food').onclick=()=>$('quickFood')?.click(); $('v3Weight').onclick=()=>$('quickWeight')?.click();
    $('v3Records').onclick=()=>showLegacy('today','我的记录','训练、饮食与晨重都按日期归档');
    $('v3Progress').onclick=()=>showLegacy('progress','我的进度','只保留真正能帮助判断趋势的数据');
    $('v3StartTraining').onclick=()=>{
      let n=0; const go=()=>{ if(typeof window.openTrainingStart==='function') return window.openTrainingStart(); if(++n<12) return setTimeout(go,100); const t=$('toast'); if(t){t.textContent='训练模块还在加载';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500);} }; go();
    };
    document.querySelectorAll('[data-v3-open]').forEach(b=>b.onclick=()=>{
      const p=b.dataset.v3Open;
      if(p==='training') showLegacy('training','训练设置','只管理模板和自定义动作');
      else if(p==='food') showLegacy('food','饮食设置','餐食模板与食物库');
      else showLegacy('settings','目标与数据','每日目标、同步与备份');
    });
    window.addEventListener('fitness:changed',()=>{refreshHome();if(document.body.classList.contains('v3-legacy-open')&&$('page-progress')?.classList.contains('active')){window.renderStrength?.();renderProgressV3()}});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshHome()});
  }

  function prepareLegacyPages(){
    ensurePageBar($('page-today'),'我的记录','训练、饮食与晨重都按日期归档','home');
    ensurePageBar($('page-progress'),'我的进度','体重、力量与饮食执行','home');
    ensurePageBar($('page-training'),'训练设置','训练模板与自定义动作','settings');
    ensurePageBar($('page-food'),'饮食设置','餐食模板与食物库','settings');
    ensurePageBar($('page-settings'),'目标与数据','每日目标、同步与备份','settings');
    const exCard=$('exerciseList')?.closest('.card'); if(exCard) exCard.style.display='none';
    moveStrengthToProgress(); moveRecentRecords(); renderProgressV3();
  }

  function setup(){
    if(!window.fitnessApp?.getDB||!document.querySelector('.app')) return setTimeout(setup,50);
    injectStyle(); document.body.classList.add('ui-v3'); makeShell(); addSplash(); purgeLegacyDayPlans(); prepareLegacyPages(); wire(); showHome();
    setTimeout(()=>{moveRecentRecords();moveStrengthToProgress();renderProgressV3();refreshHome();},450);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0),{once:true}); else setTimeout(setup,0);
})();