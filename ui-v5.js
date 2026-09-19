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
      transition:none;
      pointer-events:auto;
      text-shadow:0 0 30px rgba(160,178,255,.08);
    }
    html.ui-v5 body::after{
      content:"";position:fixed;z-index:2147483647;
      left:50%;top:calc(50% + 35px);width:36px;height:2px;
      border-radius:999px;background:linear-gradient(90deg,rgba(155,173,255,.18),#aebcff,rgba(155,173,255,.18));
      transform:translateX(-50%) scaleX(0);transform-origin:center;
      box-shadow:0 0 20px rgba(155,173,255,.28);
      animation:none;transform:translateX(-50%) scaleX(1);
      opacity:1;visibility:visible;
      transition:none;
      pointer-events:none;
    }
    html.ui-v5.v5-ready body::before,
    html.ui-v5.v5-ready body::after{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    html.ui-v5 #v3Splash{display:none!important}
    @keyframes v5BootLine{to{transform:translateX(-50%) scaleX(1)}}

    html.ui-v5 body #v3Home[hidden],html.ui-v5 body #v3SettingsRoot[hidden]{display:none!important}

    /* final geometry exists before splash disappears, preventing a second layout jump */
    html.ui-v5 body #v3Home:not([hidden]){
      box-sizing:border-box!important;
      height:auto!important;min-height:100svh!important;max-height:none!important;
      overflow:visible!important;display:block!important;
      padding:calc(18px + env(safe-area-inset-top)) 0 calc(34px + env(safe-area-inset-bottom))!important;
    }
    html.ui-v5 body .v3-avatar-stage{height:272px!important;min-height:272px!important;overflow:visible!important}
    html.ui-v5 body .v3-action-stack{margin:0!important;padding-top:0!important;gap:9px!important}
    html.ui-v5 body .v3-start{min-height:58px!important;padding:13px 16px!important}
    html.ui-v5 body .v3-action{min-height:65px!important;padding:10px 13px!important}
    html.ui-v5 body #v3SettingsRoot:not([hidden]){display:block!important;width:100%!important;min-height:var(--v4-screen-h,100dvh)!important}

    @media(max-width:390px){
      html.ui-v5 body .v3-avatar-stage{height:252px!important;min-height:252px!important}
      html.ui-v5 body .v3-action{min-height:59px!important;padding:9px 11px!important}
      html.ui-v5 body .v3-start{min-height:54px!important;padding:11px 13px!important}
    }
    @media(prefers-reduced-motion:reduce){
      html.ui-v5 body::before,html.ui-v5 body::after{transition:none!important;animation:none!important}
      html.ui-v5 body::after{transform:translateX(-50%) scaleX(1)!important}
    }
  `;
  document.head.appendChild(style);

  function viewportHeight(){
    const h = Math.round(window.innerHeight || document.documentElement.clientHeight || 0);
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
    root.classList.add('v5-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',revealWhenReady,{once:true});
  else revealWhenReady();
})();