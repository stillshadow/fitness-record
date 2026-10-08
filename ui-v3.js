(() => {
  const $ = id => document.getElementById(id);
  const STYLE = `
    body.ui-v3{--v3-bg:#07090d;--v3-panel:#0e1218;--v3-panel2:#141a22;--v3-text:#f4f6fb;--v3-muted:#7c8797;--v3-line:rgba(255,255,255,.07);--v3-accent:#9badff;background:radial-gradient(circle at 50% -8%,rgba(119,145,255,.12),transparent 32%),#07090d!important;padding-bottom:0!important;min-height:100vh}
    body.ui-v3>.bottom-nav,body.ui-v3 .bottom-nav,body.ui-v3 .desktop-tabs,body.ui-v3 .fab{display:none!important}
    body.ui-v3 .header{display:none!important}
    body.ui-v3 .app{max-width:820px!important;padding:0 14px 44px!important;margin:auto}
    body.ui-v3 .page{display:none!important}
    body.ui-v3.v3-legacy-open .page.active{display:block!important;animation:v3PageIn .18s ease-out}
    #v3Home,#v3SettingsRoot{min-height:100vh;padding:calc(18px + env(safe-area-inset-top)) 0 32px}
    #v3Home{padding-top:calc(40px + env(safe-area-inset-top))}
    #v3Home[hidden],#v3SettingsRoot[hidden]{display:none!important}
    .v3-top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px}
    .v3-today{font-size:12px;color:var(--v3-muted);letter-spacing:.04em}.v3-today b{display:block;color:var(--v3-text);font-size:17px;letter-spacing:0;margin-top:1px}
    .v3-icon-btn{width:40px;height:40px;border:1px solid var(--v3-line);border-radius:13px;background:rgba(18,23,31,.68);color:#cbd3e3;display:grid;place-items:center;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .v3-icon-btn svg{width:19px;height:19px}
    .v3-action-stack{display:grid;gap:10px;margin-top:0;position:relative;z-index:2}
    .v3-start{width:100%;border:0;border-radius:18px;padding:14px 18px;background:linear-gradient(135deg,#b9c5ff,#8fa4ff);color:#080d17;display:flex;align-items:center;justify-content:space-between;text-align:left;box-shadow:0 12px 38px rgba(104,130,255,.16)}
    .v3-start strong{font-size:17px}.v3-start small{display:block;font-size:11px;opacity:.64;margin-top:2px}.v3-start .v3-arrow{font-size:24px;font-weight:400}
    .v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .v3-action{min-height:60px;border:1px solid var(--v3-line);border-radius:16px;background:linear-gradient(180deg,rgba(19,24,32,.92),rgba(13,17,23,.94));color:var(--v3-text);padding:12px 14px;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:8px;transition:transform .12s ease,border-color .16s ease,background .16s ease}
    .v3-action:active,.v3-start:active{transform:scale(.985)}.v3-action:hover{border-color:rgba(155,173,255,.22);background:#121823}
    .v3-action svg{width:18px;height:18px;color:#9daceb}.v3-action b{font-size:13px}.v3-action small{font-size:10px;color:var(--v3-muted);margin-top:1px}
    .v3-pagebar{display:flex;align-items:center;gap:11px;padding:calc(16px + env(safe-area-inset-top)) 0 16px;position:sticky;top:0;z-index:12;background:linear-gradient(180deg,#07090d 72%,rgba(7,9,13,0));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    .v3-back{width:38px;height:38px;border:1px solid var(--v3-line);border-radius:12px;background:#10151c;color:var(--v3-text);font-size:22px;line-height:1}.v3-pagebar-title{font-size:19px;font-weight:780}.v3-pagebar small{display:block;color:var(--v3-muted);font-size:10px;font-weight:500;margin-top:1px}
    body.ui-v3.v3-legacy-open .card{background:linear-gradient(180deg,rgba(16,21,28,.97),rgba(12,16,22,.97))!important;border:1px solid var(--v3-line)!important;border-radius:18px!important;box-shadow:none!important}
    body.ui-v3.v3-legacy-open .grid{gap:10px!important}
    body.ui-v3 #page-today #homeStartTrainingBtn,body.ui-v3 #page-today #homeAddFoodBtn,body.ui-v3 #page-today #planHint,body.ui-v3 #page-today #clearLoadedPlanBtn{display:none!important}
    body.ui-v3 #page-training .card:has(#strengthList){display:none!important}
    body.ui-v3 #page-training #planList [data-load-plan]{display:none!important}
    body.ui-v3 #page-today .summary-item:has(#todayCardio),body.ui-v3 #page-progress .metric:has(#cardioWeek),body.ui-v3 #page-settings div:has(>label[for="setCardio"]){display:none!important}
    body.ui-v3 #page-today .summary:has(#todayCardio){grid-template-columns:repeat(2,minmax(0,1fr))!important}
    body.ui-v3 #cloudSyncCard{display:none!important}
    body.ui-v3 #todayTrainingList .item-actions{display:none!important}
    .v3-settings-title{font-size:25px;font-weight:790;margin:28px 2px 5px}.v3-settings-sub{color:var(--v3-muted);font-size:12px;margin:0 2px 20px}
    .v3-settings-list{display:grid;gap:9px}.v3-setting-row{width:100%;border:1px solid var(--v3-line);background:linear-gradient(180deg,#10151d,#0d1117);color:var(--v3-text);border-radius:17px;padding:15px 16px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:11px;text-align:left}.v3-setting-icon{width:38px;height:38px;border-radius:12px;background:#171e2a;display:grid;place-items:center;color:#aab9ff}.v3-setting-icon svg{width:18px;height:18px}.v3-setting-copy b{display:block;font-size:14px}.v3-setting-copy small{display:block;color:var(--v3-muted);font-size:10px;margin-top:2px}.v3-setting-chevron{font-size:21px;color:#586271}
    .v3-progress-card{grid-column:span 12;background:linear-gradient(180deg,rgba(16,21,29,.98),rgba(11,15,21,.98));border:1px solid var(--v3-line);border-radius:18px;padding:16px}.v3-progress-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:15px}.v3-progress-head h2{font-size:14px;margin:0}.v3-progress-head span{font-size:10px;color:var(--v3-muted)}
    .v3-progress-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--v3-line);border-bottom:1px solid var(--v3-line)}.v3-stat{padding:13px 10px;border-right:1px solid var(--v3-line)}.v3-stat:last-child{border-right:0}.v3-stat small{display:block;color:var(--v3-muted);font-size:10px}.v3-stat strong{display:block;font-size:18px;margin-top:2px}.v3-stat em{font-style:normal;color:var(--v3-muted);font-size:9px}
    .v3-chart-toolbar{display:flex;align-items:center;justify-content:space-between;gap:9px;margin:12px 0 4px}.v3-chart-ranges{display:flex;gap:5px;min-width:0}.v3-chart-range,.v3-chart-latest{border:1px solid var(--v3-line);background:rgba(255,255,255,.025);color:var(--v3-muted);border-radius:999px;min-height:32px;padding:0 10px;font-size:10px}.v3-chart-range.active{background:#aab9ff;color:#09101b;border-color:#aab9ff;font-weight:800}.v3-chart-latest{flex:0 0 auto}
    #v3WeightChart{margin-top:7px}.v3-weight-chart-shell{display:grid;grid-template-columns:34px minmax(0,1fr);height:198px;min-width:0}.v3-chart-yaxis{height:174px;padding:8px 5px 18px 0;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;color:#687486;font-size:9px;line-height:1;pointer-events:none}.v3-weight-scroll{min-width:0;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain}.v3-weight-scroll::-webkit-scrollbar{display:none}.v3-weight-scroll svg{display:block;height:190px;max-width:none}.v3-chart-grid{stroke:rgba(255,255,255,.055);stroke-width:1}.v3-chart-raw{fill:none;stroke:#56627b;stroke-width:1.4;opacity:.75}.v3-chart-trend{fill:none;stroke:#aab9ff;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.v3-chart-dot{fill:#71809b}.v3-chart-dot.latest{fill:#aab9ff}.v3-chart-dot.selected{fill:#eef1ff;stroke:#aab9ff;stroke-width:2}.v3-chart-hit{fill:transparent;cursor:pointer}.v3-chart-label{fill:#687486;font-size:9px}.v3-chart-detail{min-height:24px;display:flex;align-items:center;justify-content:center;gap:6px;color:#8e99aa;font-size:10px;padding:1px 4px 4px}.v3-chart-detail b{color:#e1e6ef;font-size:12px}.v3-chart-swipe{font-size:9px;color:#626d7c;text-align:center;margin-top:-2px}
    .v3-macros{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.v3-macro{padding:11px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045)}.v3-macro small{display:block;color:var(--v3-muted);font-size:10px}.v3-macro b{font-size:16px}.v3-macro span{font-size:9px;color:#626d7c;margin-left:3px}.v3-mini-bar{height:3px;background:#171c24;border-radius:999px;margin-top:8px;overflow:hidden}.v3-mini-bar i{display:block;height:100%;background:#9badff;border-radius:999px}
    .v3-old-progress{display:none!important}
    .diary-top{align-items:flex-start}
    .diary-date-nav{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;gap:7px;min-width:0;flex:1}
    .diary-date-step{width:36px;height:36px;border:1px solid var(--v3-line);border-radius:11px;background:#10151c;color:var(--v3-text);font-size:20px}
    .diary-date-step:disabled{opacity:.28}
    .diary-date-main{border:0;background:transparent;color:var(--v3-text);text-align:left;padding:0 4px;min-width:0}.diary-date-input{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;inset:auto!important;padding:0!important;border:0!important}
    .diary-date-main small{display:block;color:var(--v3-muted);font-size:10px;font-weight:600}.diary-date-main b{display:block;font-size:18px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .diary-home{display:grid;gap:10px;margin-top:17px}
    .diary-card{background:linear-gradient(180deg,#10151d,#0c1117);border:1px solid var(--v3-line);border-radius:18px;padding:15px}
    .diary-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.diary-card-head h3{margin:0;font-size:14px}.diary-card-head small{color:var(--v3-muted);font-size:10px}
    .diary-weight-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:10px}.diary-weight-row input{font-size:19px;font-weight:760;min-height:44px}.diary-weight-row button{min-width:72px}
    .diary-main-value{font-size:23px;font-weight:780;letter-spacing:-.02em;margin-top:8px}.diary-sub{font-size:11px;color:var(--v3-muted);margin-top:4px;line-height:1.55}
    .diary-actions{display:flex;gap:7px;margin-top:12px}.diary-actions .btn{flex:1;min-height:38px}
    .diary-macros{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:10px}.diary-macro{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);border-radius:11px;padding:9px 6px;text-align:center}.diary-macro small{display:block;color:var(--v3-muted);font-size:9px}.diary-macro b{display:block;margin-top:3px;font-size:13px}
    .diary-progress-link{width:100%;min-height:50px;border:1px solid var(--v3-line);border-radius:16px;background:#10151d;color:var(--v3-text);display:flex;align-items:center;justify-content:space-between;padding:0 14px;text-align:left}.diary-progress-link b{font-size:14px}.diary-progress-link span{font-size:20px;color:#606b7b}
    .diary-ai-anchor{display:none!important}
    #v3TrainingDetail,#v3FoodDetail{min-height:100vh;padding:0 0 32px}
    #v3TrainingDetail[hidden],#v3FoodDetail[hidden]{display:none!important}
    .diary-detail-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:3px 2px 13px}.diary-detail-summary b{font-size:14px}.diary-detail-summary span{font-size:10px;color:var(--v3-muted)}
    .diary-detail-list{display:grid;gap:9px}.diary-detail-card{border:1px solid var(--v3-line);background:#10151d;border-radius:16px;padding:13px}
    .diary-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}.diary-detail-head b{font-size:14px}.diary-detail-head small{display:block;color:var(--v3-muted);font-size:10px;margin-top:2px}
    .diary-set-list{display:grid;gap:5px;margin-top:10px}.diary-set{display:grid;grid-template-columns:26px minmax(0,1fr);gap:7px;align-items:center;font-size:12px}.diary-set i{font-style:normal;color:#647082;text-align:center;font-size:10px}
    .diary-previous{margin-top:10px;padding-top:9px;border-top:1px solid var(--v3-line);font-size:10px;color:#758194;line-height:1.6}.diary-previous b{color:#aeb8ca;font-size:10px}
    .diary-food-meal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.diary-food-meal-head b{font-size:14px}.diary-food-meal-head span{font-size:10px;color:var(--v3-muted)}
    .diary-food-item{display:grid;grid-template-columns:minmax(0,1fr) auto 26px;gap:8px;align-items:center;padding:7px 0;border-top:1px solid rgba(255,255,255,.045)}.diary-food-delete{width:26px;height:26px;border:0;background:transparent;color:#6f7a8b;font-size:16px;border-radius:8px}.diary-food-delete:active{background:rgba(255,255,255,.05);color:#ff8b96}.diary-food-item:first-of-type{border-top:0}.diary-food-item b{font-size:12px}.diary-food-item small{display:block;color:var(--v3-muted);font-size:9px;margin-top:1px}.diary-food-item strong{font-size:11px;text-align:right}.diary-food-total{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:11px}.diary-food-total div{background:rgba(255,255,255,.025);border-radius:9px;padding:7px 5px;text-align:center}.diary-food-total small{display:block;color:var(--v3-muted);font-size:8px}.diary-food-total b{font-size:11px}
    .diary-empty{border:1px dashed var(--v3-line);border-radius:15px;padding:22px 14px;text-align:center;color:var(--v3-muted);font-size:11px}
    .diary-progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.diary-progress-metric{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045);border-radius:12px;padding:10px}.diary-progress-metric small{display:block;color:var(--v3-muted);font-size:9px}.diary-progress-metric b{display:block;font-size:15px;margin-top:3px}.diary-progress-metric span{display:block;color:#626d7c;font-size:8px;margin-top:2px}
    @media(max-width:430px){.diary-progress-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    #aiHomeCard{margin-top:15px!important}
    #aiHomeCard .ai-home-head-copy small,#aiHomeCard .ai-home-provider{display:none!important}
    @media(max-width:430px){.diary-card{padding:13px}.diary-macros{gap:5px}.diary-main-value{font-size:21px}}
    @media(max-width:700px){body.ui-v3 .app{padding:0 12px 34px!important}.v3-progress-summary{grid-template-columns:repeat(3,1fr)}.v3-stat{padding:11px 8px}.v3-stat strong{font-size:16px}}
    @media(max-width:430px){#v3Home{padding-top:calc(28px + env(safe-area-inset-top));overflow-anchor:none}.v3-macros{gap:6px}.v3-macro{padding:9px 8px}.v3-chart-toolbar{align-items:flex-start}.v3-chart-ranges{gap:4px}.v3-chart-range,.v3-chart-latest{padding:0 9px;min-height:34px}.v3-weight-chart-shell{grid-template-columns:31px minmax(0,1fr)}}
    /* Calm UI: keep the interface static and predictable. */
    body.ui-v3 *,body.ui-v3 *::before,body.ui-v3 *::after{animation:none!important;transition:none!important}
    body.ui-v3 .btn:active{transform:scale(.985)!important}
    @media(prefers-reduced-motion:reduce){body.ui-v3 *{animation:none!important;transition:none!important}}
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
      <div class="v3-top diary-top">
        <div class="diary-date-nav">
          <button type="button" class="diary-date-step" id="diaryPrevDate" aria-label="前一天">‹</button>
          <button type="button" class="diary-date-main" id="diaryDateBtn"><small id="diaryDateKicker">今天</small><b id="diaryDateLabel"></b></button>
          <button type="button" class="diary-date-step" id="diaryNextDate" aria-label="后一天">›</button>
          <input id="diaryDateInput" class="diary-date-input" type="date" aria-hidden="true">
        </div>
        <button class="v3-icon-btn" id="v3SettingsBtn" aria-label="设置">${icon('gear')}</button>
      </div>
      <div class="diary-home">
        <section class="diary-card">
          <div class="diary-card-head"><h3>晨重</h3><small id="diaryWeightStatus">未记录</small></div>
          <div class="diary-weight-row"><input id="diaryWeightInput" type="number" inputmode="decimal" step="0.05" placeholder="kg"><button type="button" class="btn" id="diaryWeightSave">保存</button></div>
        </section>
        <section class="diary-card">
          <div class="diary-card-head"><h3>训练</h3><small id="diaryTrainingStatus">未记录</small></div>
          <div class="diary-main-value" id="diaryTrainingValue">未记录</div>
          <div class="diary-sub" id="diaryTrainingSub"></div>
          <div class="diary-actions"><button type="button" class="btn" id="v3StartTraining">记录训练</button><button type="button" class="btn ghost" id="diaryTrainingDetailBtn">查看训练</button></div>
        </section>
        <section class="diary-card">
          <div class="diary-card-head"><h3>饮食</h3><small id="diaryFoodStatus">未记录</small></div>
          <div class="diary-macros"><div class="diary-macro"><small>热量</small><b id="diaryKcal">0</b></div><div class="diary-macro"><small>碳水</small><b id="diaryC">0g</b></div><div class="diary-macro"><small>蛋白质</small><b id="diaryP">0g</b></div><div class="diary-macro"><small>脂肪</small><b id="diaryF">0g</b></div></div>
          <div class="diary-actions"><button type="button" class="btn" id="v3Food">记录食物</button><button type="button" class="btn ghost" id="diaryFoodDetailBtn">查看饮食</button></div>
        </section>
        <button type="button" class="diary-progress-link" id="v3Progress"><b>我的进度</b><span>›</span></button>
      </div>
      <div class="v3-action-stack diary-ai-anchor"></div>`;
    app.insertBefore(home,app.firstChild);

    const trainingDetail=document.createElement('section');trainingDetail.id='v3TrainingDetail';trainingDetail.hidden=true;
    trainingDetail.innerHTML=`<div class="v3-pagebar"><button class="v3-back" data-diary-home aria-label="返回">‹</button><div><div class="v3-pagebar-title">训练</div><small id="diaryTrainingDetailDate"></small></div></div><div class="diary-detail-summary"><b id="diaryTrainingDetailSummary"></b><button type="button" class="btn" id="diaryTrainingDetailRecord">记录 / 编辑</button></div><div id="diaryTrainingDetailList" class="diary-detail-list"></div>`;
    app.insertBefore(trainingDetail,home.nextSibling);

    const foodDetail=document.createElement('section');foodDetail.id='v3FoodDetail';foodDetail.hidden=true;
    foodDetail.innerHTML=`<div class="v3-pagebar"><button class="v3-back" data-diary-home aria-label="返回">‹</button><div><div class="v3-pagebar-title">饮食</div><small id="diaryFoodDetailDate"></small></div></div><div class="diary-detail-summary"><b id="diaryFoodDetailSummary"></b><button type="button" class="btn" id="diaryFoodDetailRecord">记录食物</button></div><div id="diaryFoodDetailList" class="diary-detail-list"></div>`;
    app.insertBefore(foodDetail,trainingDetail.nextSibling);

    const settings=document.createElement('section'); settings.id='v3SettingsRoot'; settings.hidden=true;
    settings.innerHTML=`
      <div class="v3-pagebar"><button class="v3-back" data-v3-home aria-label="返回">‹</button><div><div class="v3-pagebar-title">设置</div><small>低频管理</small></div></div>
      <div class="v3-settings-list" style="margin-top:18px">
        <button class="v3-setting-row" data-v3-open="training"><span class="v3-setting-icon">${icon('training')}</span><span class="v3-setting-copy"><b>训练设置</b><small>模板与动作库</small></span><span class="v3-setting-chevron">›</span></button>
        <button class="v3-setting-row" data-v3-open="food"><span class="v3-setting-icon">${icon('food')}</span><span class="v3-setting-copy"><b>饮食设置</b><small>餐食模板与食物库</small></span><span class="v3-setting-chevron">›</span></button>
        <button class="v3-setting-row" data-v3-open="settings"><span class="v3-setting-icon">${icon('target')}</span><span class="v3-setting-copy"><b>目标与数据</b><small>目标、AI Key 与备份</small></span><span class="v3-setting-chevron">›</span></button>
      </div>`;
    app.insertBefore(settings,foodDetail.nextSibling);
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
    document.body.classList.remove('v3-legacy-open');hideDiaryDetails();
    $('v3Home').hidden=false; $('v3SettingsRoot').hidden=true; window.scrollTo({top:0,behavior:'instant'}); refreshHome();
  }
  function showSettings(){
    document.body.classList.remove('v3-legacy-open');hideDiaryDetails();
    $('v3Home').hidden=true; $('v3SettingsRoot').hidden=false; window.scrollTo({top:0,behavior:'instant'});
  }
  function showLegacy(name,title,sub){
    hideDiaryDetails();$('v3Home').hidden=true; $('v3SettingsRoot').hidden=true; document.body.classList.add('v3-legacy-open'); showBasePage(name);
    const page=$(`page-${name}`); ensurePageBar(page,title,sub,name==='progress'?'home':'settings');
    if(name==='progress'){ window.renderStrength?.(); renderProgressV3(); }
    window.scrollTo({top:0,behavior:'instant'});
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
  const activeDate = () => window.fitnessApp?.getActiveDate?.() || today();
  const dateObj = date => new Date(String(date)+"T12:00:00");
  const shiftDate = (date,delta) => { const d=dateObj(date);d.setDate(d.getDate()+delta);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const prettyDateValue = date => { const d=dateObj(date),w=['周日','周一','周二','周三','周四','周五','周六'];return `${d.getMonth()+1}月${d.getDate()}日 · ${w[d.getDay()]}`; };
  const equipmentNameOf = row => window.fitnessEquipmentNameOf?.(row) || String(row?.equipmentName||'').trim().replace(/\s+/g,' ');
  const equipmentKey = name => window.fitnessEquipmentKey?.(name) || String(name||'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
  const setText = (row,ex={}) => {
    const type=['weight','bodyweight','bodyweight_extra','band'].includes(row?.loadType)?row.loadType:(window.fitnessLoadTypeOf?.(ex)||ex.loadType||((+ex.bodyweightFactor||0)>0?'bodyweight_extra':'weight'));
    const weight=+row?.weight||0,reps=+row?.reps||0;
    const load=type==='band'?(row.resistanceLabel||'弹力带'):type==='bodyweight'?'BW':type==='bodyweight_extra'?(weight>0?`BW + ${weight}kg`:'BW'):(weight>0?`${weight}kg`:'重量未填');
    return `${load} × ${reps||'-'}${(+row?.sets||1)>1?` × ${+row.sets}组`:''}${row?.rir!==''&&row?.rir!=null?` · RIR ${row.rir}`:''}`;
  };
  function foodMacro(entry){
    if(entry?.totalMacros){const c=+entry.totalC||0,p=+entry.totalP||0,f=+entry.totalF||0;return {c,p,f,k:c*4+p*4+f*9};}
    const q=(+entry?.grams||0)/100,c=(+entry?.c||0)*q,p=(+entry?.p||0)*q,f=(+entry?.f||0)*q;return {c,p,f,k:c*4+p*4+f*9};
  }
  function ensureDiaryDay(db,date){ db.days=db.days||{};db.days[date]=db.days[date]||{date,weight:null,cardio:0,note:'',planExerciseIds:[],planName:'',training:[],foods:[]};return db.days[date]; }
  function setDiaryDate(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return;
    window.fitnessApp?.setActiveDate?.(date);
    refreshHome();
    if(!$('v3TrainingDetail')?.hidden)renderTrainingDetail();
    if(!$('v3FoodDetail')?.hidden)renderFoodDetail();
  }
  function hideDiaryDetails(){ if($('v3TrainingDetail'))$('v3TrainingDetail').hidden=true;if($('v3FoodDetail'))$('v3FoodDetail').hidden=true; }
  function showDiaryDetail(kind){
    document.body.classList.remove('v3-legacy-open');$('v3Home').hidden=true;$('v3SettingsRoot').hidden=true;hideDiaryDetails();
    const page=kind==='training'?$('v3TrainingDetail'):$('v3FoodDetail');if(page)page.hidden=false;
    if(kind==='training')renderTrainingDetail();else renderFoodDetail();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function trainingGroups(day,db){
    const groups=[];
    (day?.training||[]).forEach((row,idx)=>{
      const id=row.exerciseId||row.exerciseName||('legacy_'+idx),eq=equipmentNameOf(row),key=`${id}::${equipmentKey(eq)}`;
      let g=groups.find(x=>x.key===key);
      if(!g){const ex=(db.exercises||[]).find(x=>x.id===row.exerciseId)||{id,name:row.exerciseName||'动作'};g={key,exerciseId:row.exerciseId||'',name:ex.name||row.exerciseName||'动作',ex,equipmentName:eq,items:[],order:Number.isFinite(+row.orderIndex)?+row.orderIndex:groups.length};groups.push(g);}
      g.items.push(row);if(Number.isFinite(+row.orderIndex))g.order=Math.min(g.order,+row.orderIndex);
    });
    groups.forEach(g=>g.items.sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0)));groups.sort((a,b)=>a.order-b.order);return groups;
  }
  function previousTrainingGroup(group,date,db){
    const dates=Object.keys(db.days||{}).filter(d=>d<date).sort().reverse(),wantedEq=equipmentKey(group.equipmentName);
    for(const d of dates){
      const rows=(db.days?.[d]?.training||[]).filter(r=>{
        const same=group.exerciseId?r.exerciseId===group.exerciseId:(!r.exerciseId&&r.exerciseName===group.name);
        return same&&equipmentKey(equipmentNameOf(r))===wantedEq;
      }).sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0));
      if(rows.length)return {date:d,rows};
    }
    return null;
  }
  function renderTrainingDetail(){
    const db=getDB(),date=activeDate(),day=db.days?.[date]||{},groups=trainingGroups(day,db),list=$('diaryTrainingDetailList');
    if($('diaryTrainingDetailDate'))$('diaryTrainingDetailDate').textContent=prettyDateValue(date);
    const sets=(day.training||[]).reduce((n,r)=>n+Math.max(1,+r.sets||1),0),cardio=+day.cardio||0;
    if($('diaryTrainingDetailSummary'))$('diaryTrainingDetailSummary').textContent=[groups.length?`${groups.length} 个动作`:'',sets?`${sets} 组`:'',cardio?`有氧 ${cardio}min`:''].filter(Boolean).join(' · ')||'暂无训练';
    if(!list)return;
    if(!groups.length&&!cardio){list.innerHTML='<div class="diary-empty">这一天还没有训练记录。</div>';return;}
    list.innerHTML=groups.map(g=>{
      const prev=previousTrainingGroup(g,date,db),equipment=g.equipmentName||g.ex?.equipment||'';
      const prevHtml=prev?`<div class="diary-previous"><b>上次 · ${prev.date.slice(5).replace('-','/')}</b><br>${prev.rows.map((r,i)=>`${i+1}. ${esc(setText(r,g.ex))}`).join('　')}</div>`:'<div class="diary-previous">此前暂无同动作、同器械记录</div>';
      return `<article class="diary-detail-card"><div class="diary-detail-head"><div><b>${esc(g.name)}</b>${equipment?`<small>${esc(equipment)}</small>`:''}</div></div><div class="diary-set-list">${g.items.map((r,i)=>`<div class="diary-set"><i>${i+1}</i><span>${esc(setText(r,g.ex))}</span></div>`).join('')}</div>${prevHtml}</article>`;
    }).join('')+(cardio?`<article class="diary-detail-card"><div class="diary-detail-head"><div><b>有氧</b><small>${cardio} min</small></div></div></article>`:'');
  }
  function renderFoodDetail(){
    const db=getDB(),date=activeDate(),day=db.days?.[date]||{},foods=day.foods||[],list=$('diaryFoodDetailList');
    if($('diaryFoodDetailDate'))$('diaryFoodDetailDate').textContent=prettyDateValue(date);
    const total=foods.reduce((s,f)=>{const m=foodMacro(f);s.c+=m.c;s.p+=m.p;s.f+=m.f;s.k+=m.k;return s},{c:0,p:0,f:0,k:0});
    if($('diaryFoodDetailSummary'))$('diaryFoodDetailSummary').textContent=foods.length?`${Math.round(total.k)} kcal · P ${Math.round(total.p)}g`:'暂无饮食';
    if(!list)return;
    if(!foods.length){list.innerHTML='<div class="diary-empty">这一天还没有饮食记录。</div>';return;}
    const order=['早餐','午餐','加餐','晚餐','练后','其他'],groups=new Map();
    foods.forEach(f=>{const slot=order.includes(f.slot)?f.slot:'其他';if(!groups.has(slot))groups.set(slot,[]);groups.get(slot).push(f);});
    list.innerHTML=order.filter(slot=>groups.has(slot)).map(slot=>{
      const items=groups.get(slot),sum=items.reduce((a,f)=>{const m=foodMacro(f);a.c+=m.c;a.p+=m.p;a.f+=m.f;a.k+=m.k;return a},{c:0,p:0,f:0,k:0});
      return `<article class="diary-detail-card"><div class="diary-food-meal-head"><b>${slot}</b><span>${Math.round(sum.k)} kcal · C${Math.round(sum.c)} P${Math.round(sum.p)} F${Math.round(sum.f)}</span></div>${items.map(f=>{const m=foodMacro(f);return `<div class="diary-food-item"><div><b>${esc(f.name||'食物')}</b><small>${+f.grams>0?`${f.grams}${f.unit||'g'}`:''}${f.time?` · ${f.time}`:''}</small></div><strong>${Math.round(m.k)} kcal<br><small>C${Math.round(m.c)} P${Math.round(m.p)} F${Math.round(m.f)}</small></strong><button type="button" class="diary-food-delete" data-diary-del-food="${esc(f.id)}" aria-label="删除">×</button></div>`;}).join('')}<div class="diary-food-total"><div><small>热量</small><b>${Math.round(sum.k)}</b></div><div><small>碳水</small><b>${Math.round(sum.c)}g</b></div><div><small>蛋白质</small><b>${Math.round(sum.p)}g</b></div><div><small>脂肪</small><b>${Math.round(sum.f)}g</b></div></div></article>`;
    }).join('');
  }
  const avg = a => a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  let progressWeightRange=30;
  let progressSelectedWeightDate="";
  function progressData(){
    const db=getDB(),days=Object.values(db.days||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d.date))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const weights=days.filter(d=>d.weight!=null).map(d=>({date:d.date,value:+d.weight}));
    const last7=weights.slice(-7).map(x=>x.value),prev7=weights.slice(-14,-7).map(x=>x.value),a7=avg(last7),p7=avg(prev7),delta=a7!=null&&p7!=null?a7-p7:null;
    const now=dateObj(today()),cutoff7=new Date(now),cutoff30=new Date(now);cutoff7.setDate(cutoff7.getDate()-6);cutoff30.setDate(cutoff30.getDate()-29);
    const recent7=days.filter(d=>dateObj(d.date)>=cutoff7&&dateObj(d.date)<=now),recent30=days.filter(d=>dateObj(d.date)>=cutoff30&&dateObj(d.date)<=now);
    const hasTraining=d=>(d.training||[]).length>0||(+d.cardio||0)>0;
    const trainingDays7=recent7.filter(hasTraining).length,trainingDays30=recent30.filter(hasTraining).length;
    const foodDays7=recent7.filter(d=>(d.foods||[]).length>0),foodStats=foodDays7.map(d=>{const m=foodTotals(d);return{...m,k:m.c*4+m.p*4+m.f*9}});
    const avgKcal7=avg(foodStats.map(x=>x.k)),avgProtein7=avg(foodStats.map(x=>x.p)),cardio7=recent7.reduce((n,d)=>n+(+d.cardio||0),0);
    return {db,weights,latest:weights.at(-1)?.value??null,a7,p7,delta,trainingDays7,trainingDays30,foodDays7:foodDays7.length,avgKcal7,avgProtein7,cardio7};
  }

  function weightChart(rows){
    if(rows.length<2)return {html:'<div class="empty">继续记录晨重后会出现体重趋势。</div>',mn:null,mx:null,width:0};
    const H=190,pad={l:10,r:16,t:12,b:27};
    const gap=rows.length>180?28:rows.length>90?34:44;
    const W=Math.max(420,pad.l+pad.r+Math.max(1,rows.length-1)*gap);
    const vals=rows.map(x=>x.value),mn=Math.min(...vals)-.25,mx=Math.max(...vals)+.25,span=Math.max(.5,mx-mn);
    const x=i=>pad.l+(W-pad.l-pad.r)*(i/Math.max(1,rows.length-1));
    const y=v=>pad.t+(H-pad.t-pad.b)*(1-(v-mn)/span);
    const raw=rows.map((r,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
    const trend=rows.map((r,i)=>({i,v:avg(rows.slice(Math.max(0,i-6),i+1).map(x=>x.value))}))
      .filter(x=>x.i>=2)
      .map((r,j)=>`${j?'L':'M'}${x(r.i).toFixed(1)},${y(r.v).toFixed(1)}`).join(' ');
    const grids=[0,.5,1].map(t=>{
      const yy=pad.t+(H-pad.t-pad.b)*t;
      return `<line class="v3-chart-grid" x1="0" x2="${W}" y1="${yy}" y2="${yy}"/>`;
    }).join('');
    const labelEvery=rows.length>120?6:rows.length>60?4:2;
    const labels=rows.map((r,i)=>{
      if(i!==0&&i!==rows.length-1&&i%labelEvery!==0)return "";
      return `<text class="v3-chart-label" text-anchor="middle" x="${x(i)}" y="${H-5}">${r.date.slice(5).replace('-','/')}</text>`;
    }).join('');
    const dots=rows.map((r,i)=>{
      const latest=i===rows.length-1,selected=r.date===progressSelectedWeightDate;
      const cls=`v3-chart-dot${latest?' latest':''}${selected?' selected':''}`;
      return `<circle class="${cls}" data-weight-dot="${i}" cx="${x(i)}" cy="${y(r.value)}" r="${selected?4.6:latest?3.6:2.5}"/><circle class="v3-chart-hit" data-weight-point="${i}" tabindex="0" role="button" aria-label="${r.date} ${r.value} kg" cx="${x(i)}" cy="${y(r.value)}" r="13"/>`;
    }).join('');
    return {mn,mx,width:W,html:`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-label="体重趋势曲线">${grids}<path class="v3-chart-raw" d="${raw}"/>${trend?`<path class="v3-chart-trend" d="${trend}"/>`:""}${dots}${labels}</svg>`};
  }

  function weightRowsForRange(rows){
    if(progressWeightRange==="all")return rows;
    return rows.slice(-Math.max(2,+progressWeightRange||30));
  }

  function weightDetailText(row){
    if(!row)return '<span>点曲线上的记录查看详情</span>';
    const parts=String(row.date).split('-');
    const value=Number(row.value).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    return `<span>${+parts[1]}月${+parts[2]}日</span><b>${value} kg</b>`;
  }

  function bindWeightChart(rows){
    const scroll=$('v3WeightScroll'),detail=$('v3WeightDetail');
    if(!scroll)return;
    const selectPoint=i=>{
      const row=rows[i];if(!row)return;
      progressSelectedWeightDate=row.date;
      scroll.querySelectorAll('[data-weight-dot]').forEach(dot=>{
        const di=+dot.dataset.weightDot,selected=di===i;
        dot.classList.toggle('selected',selected);
        dot.setAttribute('r',selected?'4.6':di===rows.length-1?'3.6':'2.5');
      });
      if(detail)detail.innerHTML=weightDetailText(row);
    };
    scroll.querySelectorAll('[data-weight-point]').forEach(hit=>{
      hit.addEventListener('click',()=>selectPoint(+hit.dataset.weightPoint));
      hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPoint(+hit.dataset.weightPoint)}});
    });
    $('v3ChartLatest')?.addEventListener('click',()=>{
      scroll.scrollTo({left:scroll.scrollWidth,behavior:'smooth'});
      selectPoint(rows.length-1);
    });
    requestAnimationFrame(()=>{scroll.scrollLeft=scroll.scrollWidth});
  }

  function renderProgressV3(){
    const page=$('page-progress'),grid=page?.querySelector('.grid'); if(!grid) return;
    [...grid.children].forEach(c=>{ if(c.id!=='v3ProgressOverview'&&c.id!=='v3MacroOverview'&&!c.querySelector?.('#strengthList')) c.classList.add('v3-old-progress'); });
    moveStrengthToProgress();
    let main=$('v3ProgressOverview'); if(!main){ main=document.createElement('div');main.id='v3ProgressOverview';main.className='v3-progress-card';grid.insertBefore(main,grid.firstChild); }
    let macros=$('v3MacroOverview'); if(!macros){ macros=document.createElement('div');macros.id='v3MacroOverview';macros.className='v3-progress-card'; main.insertAdjacentElement('afterend',macros); }
    const d=progressData(),delta=d.delta,weightRows=weightRowsForRange(d.weights);
    if(weightRows.length&&!weightRows.some(x=>x.date===progressSelectedWeightDate))progressSelectedWeightDate=weightRows.at(-1).date;
    const chart=weightChart(weightRows),selectedRow=weightRows.find(x=>x.date===progressSelectedWeightDate)||weightRows.at(-1);
    const deltaText=delta==null?'数据不足':`${delta<0?'↓':'↑'}${Math.abs(delta).toFixed(2)}kg`,latest=d.latest==null?'-':`${d.latest.toFixed(2)}kg`,avg7=d.a7==null?'-':`${d.a7.toFixed(2)}kg`;
    const rangeLabel=progressWeightRange==="all"?'全部记录':`最近 ${progressWeightRange} 条`,yMid=chart.mn==null?"":((chart.mn+chart.mx)/2).toFixed(1);
    main.innerHTML=`<div class="v3-progress-head"><h2>身体趋势</h2><span>${rangeLabel}</span></div><div class="v3-progress-summary"><div class="v3-stat"><small>最近晨重</small><strong>${latest}</strong><em>最新一次记录</em></div><div class="v3-stat"><small>7次均重</small><strong>${avg7}</strong><em>平滑日波动</em></div><div class="v3-stat"><small>均重变化</small><strong>${deltaText}</strong><em>较前7次</em></div></div><div class="v3-chart-toolbar"><div class="v3-chart-ranges"><button type="button" class="v3-chart-range ${progressWeightRange===14?'active':''}" data-weight-range="14">14条</button><button type="button" class="v3-chart-range ${progressWeightRange===30?'active':''}" data-weight-range="30">30条</button><button type="button" class="v3-chart-range ${progressWeightRange==="all"?'active':''}" data-weight-range="all">全部</button></div><button type="button" class="v3-chart-latest" id="v3ChartLatest">最新</button></div><div id="v3WeightChart">${chart.mn==null?chart.html:`<div class="v3-weight-chart-shell"><div class="v3-chart-yaxis"><span>${chart.mx.toFixed(1)}</span><span>${yMid}</span><span>${chart.mn.toFixed(1)}</span></div><div class="v3-weight-scroll" id="v3WeightScroll">${chart.html}</div></div><div class="v3-chart-detail" id="v3WeightDetail">${weightDetailText(selectedRow)}</div><div class="v3-chart-swipe">↔ 左右滑动查看记录</div>`}</div>`;
    main.querySelectorAll('[data-weight-range]').forEach(btn=>btn.addEventListener('click',()=>{progressWeightRange=btn.dataset.weightRange==="all"?"all":+btn.dataset.weightRange;progressSelectedWeightDate="";renderProgressV3()}));
    bindWeightChart(weightRows);
    macros.innerHTML=`<div class="v3-progress-head"><h2>执行概览</h2><span>最近 7 / 30 天</span></div><div class="diary-progress-grid"><div class="diary-progress-metric"><small>近 7 天训练</small><b>${d.trainingDays7} 天</b><span>是否完成训练</span></div><div class="diary-progress-metric"><small>近 30 天训练</small><b>${d.trainingDays30} 天</b><span>训练频率</span></div><div class="diary-progress-metric"><small>平均热量</small><b>${d.avgKcal7==null?'-':Math.round(d.avgKcal7)+' kcal'}</b><span>近7天有饮食记录日</span></div><div class="diary-progress-metric"><small>平均蛋白质</small><b>${d.avgProtein7==null?'-':Math.round(d.avgProtein7)+'g'}</b><span>近7天有饮食记录日</span></div><div class="diary-progress-metric"><small>饮食记录完整度</small><b>${Math.round(d.foodDays7/7*100)}%</b><span>${d.foodDays7} / 7 天</span></div><div class="diary-progress-metric"><small>近 7 天有氧</small><b>${d.cardio7} min</b><span>训练记录中的有氧</span></div></div>`;
  }

  function refreshHome(){
    const db=getDB(),date=activeDate(),day=db.days?.[date]||{},weight=day.weight,rows=day.training||[],m=foodTotals(day),k=m.c*4+m.p*4+m.f*9;
    const isToday=date===today(),d=dateObj(date),future=date>today();
    if($('diaryDateKicker'))$('diaryDateKicker').textContent=isToday?'今天':'记录';
    if($('diaryDateLabel'))$('diaryDateLabel').textContent=prettyDateValue(date);
    if($('diaryDateInput')){$('diaryDateInput').value=date;$('diaryDateInput').max=today();}
    if($('diaryNextDate'))$('diaryNextDate').disabled=future||isToday;

    const wi=$('diaryWeightInput');if(wi&&document.activeElement!==wi)wi.value=weight??'';
    if($('diaryWeightStatus'))$('diaryWeightStatus').textContent=weight!=null?`${Number(weight).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')} kg`:'未记录';

    const groups=trainingGroups(day,db),sets=rows.reduce((n,r)=>n+Math.max(1,+r.sets||1),0),cardio=+day.cardio||0;
    if($('diaryTrainingStatus'))$('diaryTrainingStatus').textContent=groups.length||cardio?'已记录':'未记录';
    if($('diaryTrainingValue'))$('diaryTrainingValue').textContent=groups.length?`${groups.length} 个动作`:cardio?'有氧':'未记录';
    if($('diaryTrainingSub'))$('diaryTrainingSub').textContent=[sets?`${sets} 组`:'',cardio?`有氧 ${cardio}min`:''].filter(Boolean).join(' · ');

    if($('diaryFoodStatus'))$('diaryFoodStatus').textContent=(day.foods||[]).length?`${day.foods.length} 条记录`:'未记录';
    if($('diaryKcal'))$('diaryKcal').textContent=Math.round(k);
    if($('diaryC'))$('diaryC').textContent=`${Math.round(m.c)}g`;
    if($('diaryP'))$('diaryP').textContent=`${Math.round(m.p)}g`;
    if($('diaryF'))$('diaryF').textContent=`${Math.round(m.f)}g`;

    if(!$('v3TrainingDetail')?.hidden)renderTrainingDetail();
    if(!$('v3FoodDetail')?.hidden)renderFoodDetail();
  }

  function wire(){
    $('v3SettingsBtn').onclick=showSettings; document.querySelector('[data-v3-home]').onclick=showHome;
    document.querySelectorAll('[data-diary-home]').forEach(b=>b.onclick=showHome);
    $('diaryPrevDate').onclick=()=>setDiaryDate(shiftDate(activeDate(),-1));
    $('diaryNextDate').onclick=()=>{if(activeDate()<today())setDiaryDate(shiftDate(activeDate(),1))};
    $('diaryDateBtn').onclick=()=>{const input=$('diaryDateInput');if(!input)return;try{if(input.showPicker)input.showPicker();else input.click()}catch{input.click()}};
    $('diaryDateInput').onchange=e=>{if(e.target.value&&e.target.value<=today())setDiaryDate(e.target.value)};
    $('diaryWeightSave').onclick=()=>{
      const v=+$('diaryWeightInput').value;if(!(v>0))return;
      const db=getDB(),day=ensureDiaryDay(db,activeDate());day.weight=v;window.fitnessApp?.replaceDB?.(db);$('diaryWeightInput').blur();
    };
    $('diaryTrainingDetailBtn').onclick=()=>showDiaryDetail('training');
    $('diaryFoodDetailBtn').onclick=()=>showDiaryDetail('food');
    $('v3Food').onclick=()=>$('quickFood')?.click();
    $('v3Progress').onclick=()=>showLegacy('progress','我的进度','体重、力量与执行趋势');
    $('v3StartTraining').onclick=()=>{
      let n=0; const go=()=>{ if(typeof window.openBatchTraining==='function') return window.openBatchTraining(activeDate()); if(++n<12) return setTimeout(go,100); const t=$('toast'); if(t){t.textContent='训练记录模块还在加载';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500);} }; go();
    };
    $('diaryTrainingDetailRecord').onclick=()=>$('v3StartTraining')?.click();
    $('diaryFoodDetailRecord').onclick=()=>$('v3Food')?.click();
    $('diaryFoodDetailList').addEventListener('click',e=>{
      const btn=e.target.closest('[data-diary-del-food]');if(!btn)return;
      if(!confirm('删除这条饮食记录？'))return;
      if(typeof window.deleteFoodEntry==='function')window.deleteFoodEntry(btn.dataset.diaryDelFood);
      renderFoodDetail();
    });
    document.querySelectorAll('[data-v3-open]').forEach(b=>b.onclick=()=>{
      const p=b.dataset.v3Open;
      if(p==='training') showLegacy('training','训练设置','模板与动作库');
      else if(p==='food') showLegacy('food','饮食设置','餐食模板与食物库');
      else showLegacy('settings','目标与数据','目标、AI Key 与备份');
    });
    window.addEventListener('fitness:changed',()=>{refreshHome();if(document.body.classList.contains('v3-legacy-open')&&$('page-progress')?.classList.contains('active')){window.renderStrength?.();renderProgressV3()}});
    window.addEventListener('fitness:date-changed',()=>refreshHome());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshHome()});
  }

  function prepareLegacyPages(){
    ensurePageBar($('page-progress'),'我的进度','体重、力量与执行趋势','home');
    ensurePageBar($('page-training'),'训练设置','模板与动作库','settings');
    ensurePageBar($('page-food'),'饮食设置','餐食模板与食物库','settings');
    ensurePageBar($('page-settings'),'目标与数据','目标、AI Key 与备份','settings');
    moveStrengthToProgress(); renderProgressV3();
  }

  function setup(){
    if(!window.fitnessApp?.getDB||!document.querySelector('.app')) return setTimeout(setup,50);
    injectStyle(); document.body.classList.add('ui-v3'); makeShell(); purgeLegacyDayPlans(); prepareLegacyPages(); wire(); showHome();
    setTimeout(()=>{moveStrengthToProgress();renderProgressV3();refreshHome();},350);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0),{once:true}); else setTimeout(setup,0);
})();