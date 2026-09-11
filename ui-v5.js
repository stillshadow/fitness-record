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
    html.ui-v5:not(.v5-ready) body{overflow:hidden!important;background:#07090d!important}
    html.ui-v5 body::before{
      content:"池边影の健身记录";
      position:fixed;inset:0;z-index:2147483646;
      display:grid;place-items:center;
      background:
        radial-gradient(300px 230px at 50% 48%,rgba(132,153,255,.075),transparent 72%),
        #07090d;
      color:#f4f6fb;
      font:780 25px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;
      letter-spacing:.035em;
      opacity:1;visibility:visible;
      transition:opacity .42s cubic-bezier(.22,.8,.24,1),visibility .42s ease;
      pointer-events:auto;
      text-shadow:0 0 30px rgba(160,178,255,.08);
    }
    html.ui-v5 body::after{
      content:"";position:fixed;z-index:2147483647;
      left:50%;top:calc(50% + 35px);width:36px;height:2px;
      border-radius:999px;background:linear-gradient(90deg,rgba(155,173,255,.18),#aebcff,rgba(155,173,255,.18));
      transform:translateX(-50%) scaleX(0);transform-origin:center;
      box-shadow:0 0 20px rgba(155,173,255,.28);
      animation:v5BootLine .62s .12s cubic-bezier(.22,.8,.24,1) forwards;
      opacity:1;visibility:visible;
      transition:opacity .3s ease,visibility .3s ease;
      pointer-events:none;
    }
    html.ui-v5.v5-ready body::before,
    html.ui-v5.v5-ready body::after{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    html.ui-v5 #v3Splash{display:none!important}
    @keyframes v5BootLine{to{transform:translateX(-50%) scaleX(1)}}

    html.ui-v5 body #v3Home[hidden],html.ui-v5 body #v3SettingsRoot[hidden]{display:none!important}

    /* final geometry exists before splash disappears, preventing a second layout jump */
    html.ui-v5 body #v3Home:not([hidden]){
      box-sizing:border-box!important;height:var(--v4-screen-h,100dvh)!important;min-height:0!important;max-height:var(--v4-screen-h,100dvh)!important;
      overflow:hidden!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;
      padding:calc(12px + env(safe-area-inset-top)) 0 max(calc(env(safe-area-inset-bottom) + 64px),96px)!important;
    }
    html.ui-v5 body .v3-avatar-stage{height:auto!important;min-height:0!important;align-self:stretch!important;overflow:hidden!important}
    html.ui-v5 body .v3-action-stack{align-self:end!important;margin:0!important;padding-top:0!important;gap:9px!important}
    html.ui-v5 body .v3-start{min-height:58px!important;padding:13px 16px!important}
    html.ui-v5 body .v3-action{min-height:65px!important;padding:10px 13px!important}
    html.ui-v5 body #v3SettingsRoot:not([hidden]){display:block!important;width:100%!important;min-height:var(--v4-screen-h,100dvh)!important}

    @media(max-height:720px){
      html.ui-v5 body #v3Home:not([hidden]){padding-bottom:max(calc(env(safe-area-inset-bottom) + 38px),66px)!important}
      html.ui-v5 body .v3-action{min-height:59px!important;padding:8px 11px!important}
      html.ui-v5 body .v3-start{min-height:53px!important;padding:10px 13px!important}
    }
    @media(max-height:610px){
      html.ui-v5 body #v3Home:not([hidden]){padding-bottom:max(calc(env(safe-area-inset-bottom) + 16px),42px)!important}
      html.ui-v5 body .v3-action{min-height:53px!important}
      html.ui-v5 body .v3-action-stack,html.ui-v5 body .v3-grid{gap:6px!important}
    }
    @media(prefers-reduced-motion:reduce){
      html.ui-v5 body::before,html.ui-v5 body::after{transition:none!important;animation:none!important}
      html.ui-v5 body::after{transform:translateX(-50%) scaleX(1)!important}
    }
  `;
  document.head.appendChild(style);

  function viewportHeight(){
    const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (h > 0) root.style.setProperty('--v4-screen-h', `${h}px`);
  }
  viewportHeight();
  // ui-final + ui-keyboard own live viewport changes. A second visualViewport
  // listener here doubled layout work during iOS keyboard animations.
  window.addEventListener('orientationchange',()=>setTimeout(viewportHeight,280),{passive:true});

  function revealWhenReady(){
    const home = document.getElementById('v3Home');
    const ready = !!home && document.body?.classList.contains('ui-v3') && document.body?.classList.contains('ui-final');
    if (!ready) return setTimeout(revealWhenReady,25);
    const delay = Math.max(0,960 - (performance.now() - bootStarted));
    setTimeout(()=>root.classList.add('v5-ready'),delay);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',revealWhenReady,{once:true});
  else revealWhenReady();
})();