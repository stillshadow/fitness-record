(() => {
  const $ = id => document.getElementById(id);
  let ready = false;
  let homeObserver = null;
  let bodyObserver = null;
  let trainingObserver = null;

  function addStyles(){
    if ($('uiV4PolishStyle')) return;
    const style = document.createElement('style');
    style.id = 'uiV4PolishStyle';
    style.textContent = `
      :root{
        --v4-screen-h:100dvh;
        --v4-page:#080a0e;
        --v4-surface:rgba(16,21,28,.78);
        --v4-surface-strong:rgba(18,23,31,.94);
        --v4-line:rgba(255,255,255,.065);
        --v4-line-strong:rgba(159,177,255,.18);
      }
      html{background:var(--v4-page)!important}
      body.ui-v4{
        padding-bottom:0!important;
        background:
          radial-gradient(760px 460px at 50% -160px,rgba(115,139,255,.09),transparent 64%),
          linear-gradient(180deg,#080a0e 0%,#0a0d12 100%)!important;
      }
      body.ui-v4 .app{padding-bottom:36px!important}

      /* 首页就是一整屏，不产生无意义的页面滚动。 */
      body.ui-v4.v4-home-active{
        height:var(--v4-screen-h)!important;
        min-height:0!important;
        overflow:hidden!important;
        overscroll-behavior:none;
      }
      body.ui-v4.v4-home-active .app{
        height:var(--v4-screen-h)!important;
        min-height:0!important;
        overflow:hidden!important;
        padding:0 14px!important;
      }
      body.ui-v4 #v3Home{
        box-sizing:border-box;
        height:var(--v4-screen-h)!important;
        min-height:0!important;
        max-height:var(--v4-screen-h)!important;
        overflow:hidden!important;
        padding:calc(14px + env(safe-area-inset-top)) 0 max(14px,env(safe-area-inset-bottom))!important;
        display:grid!important;
        grid-template-rows:auto minmax(0,1fr) auto;
        gap:0;
        position:relative;
      }
      body.ui-v4 #v3Home::before{
        content:"";position:absolute;inset:0;pointer-events:none;z-index:-3;
        background:radial-gradient(circle at 50% 38%,rgba(128,151,255,.065),transparent 34%);
      }
      body.ui-v4 .v3-top{min-height:42px}
      body.ui-v4 .v3-today{color:#7e8998;font-size:11px;letter-spacing:.05em}
      body.ui-v4 .v3-today b{font-size:17px;font-weight:720;color:#eef2f8}
      body.ui-v4 .v3-icon-btn{
        width:40px;height:40px;border-radius:50%;
        background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
      }
      body.ui-v4 .v3-avatar-stage{
        height:auto!important;min-height:0!important;overflow:hidden!important;
        align-self:stretch;display:grid;place-items:center;
      }
      body.ui-v4 .v3-avatar-stage:before{
        width:min(68vw,360px)!important;height:min(68vw,360px)!important;
        background:radial-gradient(circle,rgba(118,143,255,.13),rgba(118,143,255,.025) 48%,transparent 70%)!important;
      }
      body.ui-v4 .v3-avatar-stage:after{bottom:10%!important;opacity:.78}
      body.ui-v4 .v3-avatar-orbit{width:min(62vw,290px)!important;height:min(62vw,290px)!important;opacity:.72}
      body.ui-v4 .v3-avatar{
        height:min(43vh,390px)!important;max-height:min(43vh,390px)!important;
        max-width:min(76vw,370px)!important;
        filter:drop-shadow(0 18px 34px rgba(0,0,0,.34))!important;
      }
      body.ui-v4 .v3-action-stack{gap:8px!important;margin:0!important;align-self:end;padding-top:6px}
      body.ui-v4 .v3-start{
        min-height:58px;border-radius:17px!important;padding:13px 15px!important;
        background:linear-gradient(135deg,#c1cbff 0%,#91a6ff 100%)!important;
        box-shadow:0 12px 34px rgba(89,117,255,.16),inset 0 1px 0 rgba(255,255,255,.38)!important;
      }
      body.ui-v4 .v3-start strong{font-size:16px!important;font-weight:800}
      body.ui-v4 .v3-start small{font-size:10px!important;margin-top:1px!important}
      body.ui-v4 .v3-grid{gap:8px!important}
      body.ui-v4 .v3-action{
        min-height:68px!important;border-radius:15px!important;padding:10px 12px!important;
        background:linear-gradient(145deg,rgba(20,26,35,.88),rgba(12,16,22,.9))!important;
        border-color:rgba(255,255,255,.062)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018);
      }
      body.ui-v4 .v3-action svg{width:17px!important;height:17px!important}
      body.ui-v4 .v3-action b{font-size:13px!important;font-weight:720}
      body.ui-v4 .v3-action small{font-size:9.5px!important;color:#788392!important}

      /* 详细页顶部改成真正的 App Bar，不再像一块黑色标题卡。 */
      body.ui-v4 .v3-pagebar{
        min-height:58px;
        margin:0 -14px 12px!important;
        padding:calc(10px + env(safe-area-inset-top)) 14px 10px!important;
        position:sticky!important;top:0!important;z-index:25!important;
        background:rgba(10,13,18,.82)!important;
        border:0!important;border-bottom:1px solid rgba(255,255,255,.05)!important;
        box-shadow:none!important;
        backdrop-filter:blur(18px) saturate(125%)!important;
        -webkit-backdrop-filter:blur(18px) saturate(125%)!important;
      }
      body.ui-v4 .v3-back{
        width:36px!important;height:36px!important;border-radius:50%!important;
        border:1px solid rgba(255,255,255,.065)!important;
        background:rgba(255,255,255,.035)!important;color:#e8edf7!important;
        font-size:21px!important;
      }
      body.ui-v4 .v3-pagebar-title{font-size:19px!important;font-weight:760!important;letter-spacing:-.01em}
      body.ui-v4 .v3-pagebar small{display:none!important}
      body.ui-v4.v3-legacy-open .page.active{min-height:var(--v4-screen-h);padding-bottom:max(24px,env(safe-area-inset-bottom))}
      body.ui-v4.v3-legacy-open .grid{gap:11px!important}

      /* 记录页首块去掉“黑盒”，日期和当天摘要成为页面本身的一部分。 */
      body.ui-v4 #page-today>.grid>.card:first-child{
        background:transparent!important;border:0!important;padding:0 0 2px!important;border-radius:0!important;
      }
      body.ui-v4 #page-today #historyDateNav{margin:2px 0 9px!important}
      body.ui-v4 #page-today .history-arrow,
      body.ui-v4 #page-today .history-date-button{
        background:rgba(255,255,255,.028)!important;
        border-color:rgba(255,255,255,.06)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;
      }
      body.ui-v4 #page-today>.grid>.card:first-child .summary{
        background:linear-gradient(145deg,rgba(18,24,32,.78),rgba(12,16,22,.78));
        border:1px solid rgba(255,255,255,.055)!important;border-radius:16px!important;overflow:hidden;
      }
      body.ui-v4 #page-today>.grid>.card:first-child .summary-item{padding:12px 10px!important}

      /* 内容层级：少一点黑块，多一点空气。 */
      body.ui-v4.v3-legacy-open .card,
      body.ui-v4 .v3-progress-card{
        background:linear-gradient(145deg,rgba(18,23,31,.78),rgba(11,15,21,.82))!important;
        border:1px solid rgba(255,255,255,.058)!important;
        border-radius:17px!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;
      }
      body.ui-v4.v3-legacy-open .card .section{margin-bottom:10px!important}
      body.ui-v4.v3-legacy-open .card .section h2{font-size:14px!important;font-weight:740!important}
      body.ui-v4 .item,
      body.ui-v4 .finish-training-row,
      body.ui-v4 .session-action-row{
        background:rgba(255,255,255,.022)!important;
        border-color:rgba(255,255,255,.052)!important;
      }
      body.ui-v4 .item:hover{background:rgba(157,176,255,.035)!important}
      body.ui-v4 .empty{
        border:0!important;background:rgba(255,255,255,.02)!important;
        color:#717c8b!important;padding:15px!important;
      }
      body.ui-v4 .btn{border-radius:10px!important;min-height:38px}
      body.ui-v4 .btn.ghost{background:rgba(255,255,255,.025)!important;border-color:rgba(255,255,255,.065)!important}
      body.ui-v4 .btn.danger{background:rgba(255,91,107,.075)!important;color:#ff9ba6!important}
      body.ui-v4 input,body.ui-v4 select,body.ui-v4 textarea{
        background:rgba(5,8,12,.72)!important;border-color:rgba(255,255,255,.075)!important;
      }

      /* 设置首页去掉重复的第二个“设置”标题。 */
      body.ui-v4 #v3SettingsRoot{min-height:var(--v4-screen-h)!important;padding:0 0 max(26px,env(safe-area-inset-bottom))!important}
      body.ui-v4 #v3SettingsRoot>.v3-settings-title,
      body.ui-v4 #v3SettingsRoot>.v3-settings-sub{display:none!important}
      body.ui-v4 #v3SettingsRoot .v3-settings-list{margin-top:4px!important;gap:8px!important}
      body.ui-v4 .v3-setting-row{
        min-height:72px;border-radius:16px!important;padding:13px 14px!important;
        background:linear-gradient(145deg,rgba(18,24,32,.82),rgba(12,16,22,.84))!important;
        border-color:rgba(255,255,255,.06)!important;
      }
      body.ui-v4 .v3-setting-icon{background:rgba(151,170,255,.09)!important}

      /* 进度页强化最重要的数字，但不继续加图表和徽章。 */
      body.ui-v4 .v3-progress-card{padding:15px!important}
      body.ui-v4 .v3-progress-head{margin-bottom:12px!important}
      body.ui-v4 .v3-progress-summary{border-color:rgba(255,255,255,.055)!important}
      body.ui-v4 .v3-stat{border-color:rgba(255,255,255,.055)!important}
      body.ui-v4 .v3-progress-summary .v3-stat:first-child strong{font-size:22px!important;letter-spacing:-.02em}
      body.ui-v4 #v3WeightChart{height:200px!important;margin-top:10px!important}
      body.ui-v4 .v3-chart-trend{stroke-width:3!important}
      body.ui-v4 .v3-macro{background:rgba(255,255,255,.018)!important;border-color:rgba(255,255,255,.045)!important}

      /* 手机上录入类弹窗统一成底部 Sheet，更接近原生交互。 */
      @media(max-width:700px){
        body.ui-v4 .app{padding-left:12px!important;padding-right:12px!important}
        body.ui-v4.v4-home-active .app{padding:0 12px!important}
        body.ui-v4 #v3Home{padding:calc(12px + env(safe-area-inset-top)) 0 max(12px,env(safe-area-inset-bottom))!important}
        body.ui-v4 .v3-pagebar{margin:0 -12px 10px!important;padding-left:12px!important;padding-right:12px!important}
        body.ui-v4 .v3-pagebar-title{font-size:18px!important}
        body.ui-v4 .modal{align-items:flex-end!important;padding:0!important}
        body.ui-v4 .modal-panel,
        body.ui-v4 .modal-panel.wide{
          width:100%!important;max-width:none!important;max-height:min(90dvh,calc(var(--v4-screen-h) - 28px))!important;
          border-radius:22px 22px 0 0!important;border-left:0!important;border-right:0!important;border-bottom:0!important;
          padding:16px 14px calc(16px + env(safe-area-inset-bottom))!important;
          background:linear-gradient(180deg,#151a22,#0f1319)!important;
          box-shadow:0 -20px 60px rgba(0,0,0,.36)!important;
        }
        body.ui-v4 .modal-actions .btn:not(.ghost){min-height:44px}
        body.ui-v4 #page-today>.grid>.card:first-child .summary-item b{font-size:16px!important}
      }
      @media(max-width:430px){
        body.ui-v4 .v3-action{min-height:65px!important}
        body.ui-v4 .v3-start{min-height:56px!important}
        body.ui-v4 .v3-avatar{height:min(40vh,350px)!important;max-height:min(40vh,350px)!important}
      }
      @media(max-height:680px){
        body.ui-v4 .v3-action{min-height:60px!important;padding:8px 11px!important}
        body.ui-v4 .v3-action small{display:none!important}
        body.ui-v4 .v3-start{min-height:52px!important;padding:10px 13px!important}
        body.ui-v4 .v3-start small{display:none!important}
        body.ui-v4 .v3-avatar{height:min(36vh,270px)!important;max-height:min(36vh,270px)!important}
        body.ui-v4 .v3-avatar-orbit{width:min(54vw,230px)!important;height:min(54vw,230px)!important}
      }
      @media(max-height:590px){
        body.ui-v4 .v3-avatar{height:min(31vh,205px)!important;max-height:min(31vh,205px)!important}
        body.ui-v4 .v3-action{min-height:54px!important}
        body.ui-v4 .v3-action-stack{gap:6px!important}
        body.ui-v4 .v3-grid{gap:6px!important}
      }
      @media(min-width:760px) and (min-height:700px){
        body.ui-v4.v4-home-active .app{max-width:760px!important}
        body.ui-v4 .v3-avatar{max-width:340px!important}
      }
      @media(prefers-reduced-motion:reduce){
        body.ui-v4 .v3-avatar,body.ui-v4 .v3-avatar-stage:before,body.ui-v4 .v3-avatar-stage:after{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function setViewportHeight(){
    const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (h > 0) document.documentElement.style.setProperty('--v4-screen-h', `${h}px`);
  }

  function stripLegacyPlanCards(){
    const box = $('todayTrainingList');
    if (!box) return;
    box.querySelectorAll('[data-record-ex],[data-replace-plan-ex]').forEach(el => el.closest('.item')?.remove());
    if (!box.querySelector('.item') && !box.querySelector('.empty')) {
      box.innerHTML = '<div class="empty">暂无训练记录。</div>';
    }
  }

  function polishCopy(){
    const startSub = $('v3StartSub'); if (startSub) startSub.textContent = '模板或自由训练';
    const recordSmall = $('v3Records')?.querySelector('small'); if (recordSmall) recordSmall.textContent = '训练、饮食与晨重';
    const progressSmall = $('v3Progress')?.querySelector('small'); if (progressSmall) progressSmall.textContent = '体重、力量与执行趋势';
    const foodSmall = $('v3Food')?.querySelector('small'); if (foodSmall) foodSmall.textContent = '记下今天吃的东西';
  }

  function cleanSettingsIntro(){
    $('v3SettingsRoot')?.querySelector(':scope > .v3-settings-title')?.remove();
    $('v3SettingsRoot')?.querySelector(':scope > .v3-settings-sub')?.remove();
  }

  function syncMode(){
    const home = $('v3Home');
    const homeActive = !!home && !home.hidden && !document.body.classList.contains('v3-legacy-open');
    document.body.classList.toggle('v4-home-active', homeActive);
    if (homeActive) window.scrollTo(0,0);
  }

  function observe(){
    const home = $('v3Home');
    if (home && !homeObserver) {
      homeObserver = new MutationObserver(syncMode);
      homeObserver.observe(home,{attributes:true,attributeFilter:['hidden']});
    }
    if (!bodyObserver) {
      bodyObserver = new MutationObserver(syncMode);
      bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    }
    const box = $('todayTrainingList');
    if (box && !trainingObserver) {
      trainingObserver = new MutationObserver(stripLegacyPlanCards);
      trainingObserver.observe(box,{childList:true,subtree:true});
    }
  }

  function setup(){
    if (ready) return;
    if (!$('v3Home') || !$('v3SettingsRoot')) return setTimeout(setup,40);
    ready = true;
    document.body.classList.add('ui-v4');
    addStyles();
    setViewportHeight();
    cleanSettingsIntro();
    polishCopy();
    stripLegacyPlanCards();
    observe();
    syncMode();
    window.addEventListener('resize',setViewportHeight,{passive:true});
    window.visualViewport?.addEventListener('resize',setViewportHeight,{passive:true});
    window.addEventListener('fitness:changed',()=>{
      stripLegacyPlanCards();
      polishCopy();
      syncMode();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();
