(() => {
  const $ = id => document.getElementById(id);

  function installStyles(){
    if ($('v3PolishStyle')) return;
    const style = document.createElement('style');
    style.id = 'v3PolishStyle';
    style.textContent = `
      /* V3.1: layout polish only. No new product features. */
      html{min-height:100%;background:#080a0e}
      body.ui-v3{min-height:100%;background:
        radial-gradient(circle at 50% -10%,rgba(119,145,255,.075),transparent 34%),
        linear-gradient(180deg,#080a0e 0%,#0a0d12 100%)!important}
      body.ui-v3 .app{max-width:820px!important;padding:0 14px!important;min-height:100dvh}

      /* Home is one screen, never a document that happens to be short. */
      body.ui-v3.v3-home-open{height:100dvh;overflow:hidden;overscroll-behavior:none}
      body.ui-v3.v3-home-open .app{height:100dvh;overflow:hidden}
      #v3Home{
        box-sizing:border-box!important;
        height:100dvh!important;
        min-height:0!important;
        padding:calc(14px + env(safe-area-inset-top)) 0 max(14px,env(safe-area-inset-bottom))!important;
        display:grid!important;
        grid-template-rows:auto minmax(0,1fr) auto;
        overflow:hidden!important;
      }
      #v3Home[hidden]{display:none!important}
      #v3Home .v3-top{min-height:38px}
      #v3Home .v3-today{font-size:10px;letter-spacing:.055em;color:#6f7988}
      #v3Home .v3-today b{font-size:16px;margin-top:0;letter-spacing:-.01em}
      #v3Home .v3-icon-btn{
        width:38px;height:38px;border:1px solid rgba(255,255,255,.065);border-radius:13px;
        background:rgba(255,255,255,.025);box-shadow:none
      }
      #v3Home .v3-avatar-stage{
        height:auto!important;min-height:0!important;width:100%;overflow:visible!important;
        align-self:stretch;display:grid;place-items:center
      }
      #v3Home .v3-avatar-stage:before{width:min(68vw,360px);height:min(68vw,360px);opacity:.88}
      #v3Home .v3-avatar-stage:after{bottom:10%;width:150px;height:23px;opacity:.72}
      #v3Home .v3-avatar-orbit{width:min(62vw,278px);height:min(62vw,278px);opacity:.8}
      #v3Home .v3-avatar{
        height:min(100%,390px)!important;max-height:min(39dvh,390px)!important;max-width:74vw!important;
        filter:drop-shadow(0 20px 28px rgba(0,0,0,.24))
      }
      #v3Home .v3-action-stack{gap:8px;margin:0!important;padding-top:2px}
      #v3Home .v3-start{
        min-height:58px;border-radius:16px;padding:12px 16px;box-shadow:0 12px 32px rgba(104,130,255,.12)
      }
      #v3Home .v3-start strong{font-size:16px}
      #v3Home .v3-start small{font-size:10px;margin-top:1px}
      #v3Home .v3-grid{gap:8px}
      #v3Home .v3-action{
        min-height:64px;border-radius:15px;padding:10px 12px;
        background:rgba(255,255,255,.023);border-color:rgba(255,255,255,.06);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018)
      }
      #v3Home .v3-action svg{width:16px;height:16px}
      #v3Home .v3-action b{font-size:12px}
      #v3Home .v3-action small{font-size:9px;color:#707a89}

      /* Settings root is allowed to scroll, but should not repeat its title. */
      body.ui-v3.v3-settings-open{overflow:auto;overscroll-behavior-y:auto}
      #v3SettingsRoot{min-height:100dvh!important;padding:0 0 max(28px,env(safe-area-inset-bottom))!important}
      #v3SettingsRoot .v3-settings-title,#v3SettingsRoot .v3-settings-sub{display:none!important}
      #v3SettingsRoot .v3-settings-list{gap:8px;padding-top:12px}
      #v3SettingsRoot .v3-setting-row{
        border-radius:15px;padding:13px 14px;border-color:rgba(255,255,255,.055);
        background:rgba(255,255,255,.022);box-shadow:none
      }
      #v3SettingsRoot .v3-setting-icon{width:36px;height:36px;border-radius:11px;background:rgba(154,174,255,.075)}
      #v3SettingsRoot .v3-setting-copy b{font-size:13px}
      #v3SettingsRoot .v3-setting-copy small{font-size:10px;color:#707a89}

      /* Page titles: no black gradient block under the title. */
      body.ui-v3 .v3-pagebar{
        position:relative!important;top:auto!important;z-index:3!important;
        min-height:62px;padding:calc(14px + env(safe-area-inset-top)) 0 12px!important;
        margin:0!important;background:transparent!important;border:0!important;
        backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
      }
      body.ui-v3 .v3-pagebar:after{
        content:"";position:absolute;left:48px;right:0;bottom:0;height:1px;
        background:linear-gradient(90deg,rgba(255,255,255,.075),transparent 82%)
      }
      body.ui-v3 .v3-back{
        width:36px;height:36px;border:0!important;border-radius:12px!important;
        background:rgba(255,255,255,.035)!important;color:#e8ecf6!important;
        font-size:23px!important;display:grid;place-items:center;padding:0;box-shadow:none!important
      }
      body.ui-v3 .v3-pagebar-title{font-size:20px!important;line-height:1.15;font-weight:760!important;letter-spacing:-.015em}
      body.ui-v3 .v3-pagebar small{font-size:10px!important;color:#707a89!important;margin-top:3px!important;line-height:1.35}

      /* Detail pages get a calmer information hierarchy. */
      body.ui-v3.v3-legacy-open{overflow:auto!important;overscroll-behavior-y:auto}
      body.ui-v3.v3-legacy-open .app{padding:0 14px max(30px,env(safe-area-inset-bottom))!important}
      body.ui-v3.v3-legacy-open .page.active{padding:0!important}
      body.ui-v3.v3-legacy-open .grid{gap:9px!important;padding-top:12px}
      body.ui-v3.v3-legacy-open .card{
        background:rgba(255,255,255,.021)!important;
        border:1px solid rgba(255,255,255,.055)!important;
        border-radius:16px!important;padding:14px!important;box-shadow:none!important
      }
      body.ui-v3.v3-legacy-open .card .section{margin-bottom:10px!important}
      body.ui-v3.v3-legacy-open .section h2{font-size:13px!important;font-weight:720!important}
      body.ui-v3.v3-legacy-open .meta{color:#707a89!important}
      body.ui-v3.v3-legacy-open .item{
        background:rgba(255,255,255,.018)!important;border-color:rgba(255,255,255,.05)!important;
        border-radius:12px!important;box-shadow:none!important
      }
      body.ui-v3.v3-legacy-open .empty{
        border-color:rgba(255,255,255,.07)!important;background:rgba(255,255,255,.012)!important;
        border-radius:12px!important;color:#687383!important
      }
      body.ui-v3.v3-legacy-open .btn{border-radius:10px!important;box-shadow:none!important}
      body.ui-v3.v3-legacy-open .btn.ghost{background:rgba(255,255,255,.025)!important;border-color:rgba(255,255,255,.065)!important}
      body.ui-v3.v3-legacy-open input,
      body.ui-v3.v3-legacy-open select,
      body.ui-v3.v3-legacy-open textarea{background:#0d1117!important;border-color:rgba(255,255,255,.07)!important}

      /* Records: date navigation reads like navigation, not three form fields. */
      body.ui-v3 #page-today .grid>div.card:first-of-type{
        background:transparent!important;border:0!important;padding:0!important
      }
      body.ui-v3 #page-today .history-date-nav{
        grid-template-columns:36px minmax(0,1fr) 36px!important;gap:4px!important;
        margin:0 0 10px!important;padding:0 2px!important
      }
      body.ui-v3 #page-today .history-arrow,
      body.ui-v3 #page-today .history-date-button{
        height:38px!important;border:0!important;background:transparent!important;box-shadow:none!important
      }
      body.ui-v3 #page-today .history-date-button{font-size:13px!important;font-weight:680!important}
      body.ui-v3 #page-today .history-arrow{font-size:22px!important;color:#8f99aa!important}
      body.ui-v3 #page-today .summary{
        border:1px solid rgba(255,255,255,.055)!important;border-radius:14px!important;
        overflow:hidden;background:rgba(255,255,255,.018)!important
      }
      body.ui-v3 #page-today .summary-item{padding:11px 9px!important}

      /* Progress: let numbers and chart lead, not the container. */
      body.ui-v3 #page-progress .v3-progress-card{
        background:rgba(255,255,255,.018)!important;border-color:rgba(255,255,255,.052)!important;
        border-radius:16px!important;padding:15px!important;box-shadow:none!important
      }
      body.ui-v3 #page-progress .v3-progress-head{margin-bottom:12px!important}
      body.ui-v3 #page-progress .v3-progress-head h2{font-size:13px!important}
      body.ui-v3 #page-progress .v3-progress-summary{border-color:rgba(255,255,255,.055)!important}
      body.ui-v3 #page-progress .v3-stat{border-color:rgba(255,255,255,.055)!important}
      body.ui-v3 #page-progress #v3WeightChart{height:178px!important}
      body.ui-v3 #page-progress .v3-macro{background:rgba(255,255,255,.018)!important;border-color:rgba(255,255,255,.045)!important}

      /* Compact tactile controls. */
      body.ui-v3 button{-webkit-tap-highlight-color:transparent}
      body.ui-v3 .v3-setting-row:active,body.ui-v3 .v3-icon-btn:active,body.ui-v3 .v3-back:active{transform:scale(.985)}

      /* Phone modals behave more like sheets and waste less vertical space. */
      @media(max-width:700px){
        body.ui-v3 .modal{align-items:flex-end!important;padding:0!important}
        body.ui-v3 .modal-panel{
          width:100%!important;max-height:88dvh!important;margin:0!important;
          border-radius:22px 22px 0 0!important;border-left:0!important;border-right:0!important;border-bottom:0!important;
          padding:16px 14px calc(16px + env(safe-area-inset-bottom))!important
        }
        body.ui-v3 .modal-panel>.section:first-child{position:sticky;top:-16px;z-index:3;padding:15px 0 10px;background:linear-gradient(180deg,#141920 80%,rgba(20,25,32,0));margin-top:-16px}
        #v3Home .v3-avatar{max-height:min(38dvh,350px)!important}
      }

      @media(max-height:700px){
        #v3Home{padding-top:calc(10px + env(safe-area-inset-top))!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
        #v3Home .v3-top{min-height:34px}
        #v3Home .v3-avatar{max-height:34dvh!important}
        #v3Home .v3-avatar-stage:before{width:min(58vw,300px);height:min(58vw,300px)}
        #v3Home .v3-avatar-orbit{width:min(52vw,240px);height:min(52vw,240px)}
        #v3Home .v3-start{min-height:54px;padding:10px 14px}
        #v3Home .v3-action{min-height:58px;padding:8px 11px}
        #v3Home .v3-action-stack{gap:6px}
        #v3Home .v3-grid{gap:6px}
      }

      @media(max-height:600px){
        #v3Home .v3-avatar{max-height:29dvh!important}
        #v3Home .v3-action small,#v3Home .v3-start small{display:none}
        #v3Home .v3-action{min-height:50px}
        #v3Home .v3-start{min-height:50px}
      }

      @media(min-width:760px){
        #v3Home .v3-action-stack{width:min(620px,100%);margin-left:auto!important;margin-right:auto!important}
        #v3Home .v3-avatar{max-height:min(43dvh,410px)!important}
        body.ui-v3.v3-legacy-open .app,#v3SettingsRoot{max-width:760px;margin-left:auto;margin-right:auto}
      }

      @media(prefers-reduced-motion:reduce){
        #v3Home .v3-avatar,#v3Home .v3-avatar-stage:before,#v3Home .v3-avatar-stage:after,#v3Home .v3-avatar-orbit{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function syncSurfaceState(){
    const home=$('v3Home'), settings=$('v3SettingsRoot');
    const legacy=document.body.classList.contains('v3-legacy-open');
    document.body.classList.toggle('v3-home-open',!!home&&!home.hidden&&!legacy);
    document.body.classList.toggle('v3-settings-open',!!settings&&!settings.hidden&&!legacy);
  }

  function cleanRepeatedSettingsTitle(){
    const root=$('v3SettingsRoot'); if(!root) return;
    root.querySelector('.v3-settings-title')?.setAttribute('aria-hidden','true');
    root.querySelector('.v3-settings-sub')?.setAttribute('aria-hidden','true');
  }

  function polishPageBars(){
    document.querySelectorAll('.v3-pagebar').forEach(bar=>{
      if(bar.dataset.polished) return;
      bar.dataset.polished='1';
      const btn=bar.querySelector('.v3-back');
      if(btn) btn.setAttribute('title','返回');
    });
  }

  function setupObservers(){
    const home=$('v3Home'),settings=$('v3SettingsRoot');
    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{
      syncSurfaceState();
      polishPageBars();
      cleanRepeatedSettingsTitle();
    }));
    if(home) observer.observe(home,{attributes:true,attributeFilter:['hidden']});
    if(settings) observer.observe(settings,{attributes:true,attributeFilter:['hidden']});
    observer.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  }

  function setup(){
    if(!$('v3Home')||!document.body.classList.contains('ui-v3')) return setTimeout(setup,35);
    installStyles();
    cleanRepeatedSettingsTitle();
    polishPageBars();
    syncSurfaceState();
    setupObservers();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();