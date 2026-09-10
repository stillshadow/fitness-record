(() => {
  if (window.__CHI_BIAN_YING_UI_V5__) return;
  window.__CHI_BIAN_YING_UI_V5__ = true;

  const root = document.documentElement;
  const bootStarted = performance.now();
  root.classList.add('ui-v5');

  const style = document.createElement('style');
  style.id = 'uiV5Style';
  style.textContent = `
    html.ui-v5{background:#07090d!important}

    /* 真正的首帧启动层。由 head 中的 ui-v5 提前建立，旧页面没有机会先露出来。 */
    html.ui-v5:not(.v5-ready) body{overflow:hidden!important;background:#07090d!important}
    html.ui-v5:not(.v5-ready) body::before{
      content:"池边影の健身记录";
      position:fixed;inset:0;z-index:2147483646;
      display:grid;place-items:center;
      background:#07090d;color:#f2f5fb;
      font:800 25px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;
      letter-spacing:.04em;
      opacity:1;visibility:visible;
      transition:opacity .34s ease,visibility .34s ease;
      pointer-events:auto;
    }
    html.ui-v5:not(.v5-ready) body::after{
      content:"";position:fixed;z-index:2147483647;
      left:50%;top:calc(50% + 34px);width:34px;height:2px;
      border-radius:999px;background:#9badff;
      transform:translateX(-50%) scaleX(1);
      box-shadow:0 0 18px rgba(155,173,255,.28);
      pointer-events:none;
    }
    html.ui-v5.v5-ready body::before,
    html.ui-v5.v5-ready body::after{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    html.ui-v5 #v3Splash{display:none!important}

    /* hidden 必须拥有最终解释权。修复设置页出现在首页下方。 */
    html.ui-v5 body #v3Home[hidden],
    html.ui-v5 body #v3SettingsRoot[hidden]{display:none!important}

    /* 最终首页布局提前定义，V3/V4 后加载时不会再把按钮从一个位置弹到另一个位置。 */
    html.ui-v5 body #v3Home:not([hidden]){
      box-sizing:border-box!important;
      height:var(--v4-screen-h,100dvh)!important;
      min-height:0!important;
      max-height:var(--v4-screen-h,100dvh)!important;
      overflow:hidden!important;
      display:grid!important;
      grid-template-rows:auto minmax(0,1fr) auto!important;
      padding:calc(12px + env(safe-area-inset-top)) 0 max(calc(env(safe-area-inset-bottom) + 42px),78px)!important;
    }
    html.ui-v5 body .v3-avatar-stage{
      height:auto!important;min-height:0!important;
      align-self:stretch!important;overflow:hidden!important;
    }
    html.ui-v5 body .v3-action-stack{
      align-self:end!important;margin:0!important;padding-top:4px!important;gap:8px!important;
    }
    html.ui-v5 body .v3-start{min-height:56px!important;padding:12px 15px!important}
    html.ui-v5 body .v3-action{min-height:64px!important;padding:10px 12px!important}

    /* 设置就是独立页面，不参与首页的布局流。 */
    html.ui-v5 body #v3SettingsRoot:not([hidden]){
      display:block!important;
      width:100%!important;
      min-height:var(--v4-screen-h,100dvh)!important;
    }

    @media(max-height:700px){
      html.ui-v5 body #v3Home:not([hidden]){
        padding-bottom:max(calc(env(safe-area-inset-bottom) + 15px),46px)!important;
      }
      html.ui-v5 body .v3-action{min-height:59px!important;padding:8px 11px!important}
      html.ui-v5 body .v3-start{min-height:52px!important;padding:10px 13px!important}
    }
    @media(max-height:590px){
      html.ui-v5 body #v3Home:not([hidden]){
        padding-bottom:max(calc(env(safe-area-inset-bottom) + 8px),32px)!important;
      }
      html.ui-v5 body .v3-action{min-height:53px!important}
      html.ui-v5 body .v3-action-stack,html.ui-v5 body .v3-grid{gap:6px!important}
    }
    @media(prefers-reduced-motion:reduce){
      html.ui-v5:not(.v5-ready) body::before{transition:none!important}
    }
  `;
  document.head.appendChild(style);

  function viewportHeight(){
    const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (h > 0) root.style.setProperty('--v4-screen-h', `${h}px`);
  }
  viewportHeight();
  window.addEventListener('resize',viewportHeight,{passive:true});
  window.visualViewport?.addEventListener('resize',viewportHeight,{passive:true});

  function revealWhenReady(){
    const home = document.getElementById('v3Home');
    const ready = !!home && document.body?.classList.contains('ui-v3');
    if (!ready) return setTimeout(revealWhenReady,30);
    const delay = Math.max(0,900 - (performance.now() - bootStarted));
    setTimeout(()=>root.classList.add('v5-ready'),delay);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',revealWhenReady,{once:true});
  } else revealWhenReady();
})();