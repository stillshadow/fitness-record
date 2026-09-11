(() => {
  if (window.__CHI_BIAN_YING_KEYBOARD_FIX_V2__) return;
  window.__CHI_BIAN_YING_KEYBOARD_FIX_V2__ = true;

  const root = document.documentElement;
  const vv = () => window.visualViewport;
  let stableHeight = 0;
  let lastWidth = 0;
  let raf = 0;
  let focusTimer = 0;

  const editable = el => !!el && (
    el.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]')
  );

  function fullHeight(){
    return Math.round(Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
      vv()?.height || 0
    ));
  }

  function captureStableHeight(force=false){
    const viewport=vv();
    const width=Math.round(viewport?.width || window.innerWidth || 0);
    const height=fullHeight();
    const rotated=lastWidth && Math.abs(width-lastWidth)>80;
    if(force || !stableHeight || rotated){
      stableHeight=height;
    }else if(!editable(document.activeElement)){
      stableHeight=Math.max(stableHeight,height);
    }
    lastWidth=width;
    if(stableHeight) root.style.setProperty('--app-stable-h',stableHeight+'px');
  }

  function isKeyboardOpen(){
    const viewport=vv();
    return !!(viewport && stableHeight && editable(document.activeElement) && stableHeight-viewport.height>120);
  }

  function exposeViewportVars(){
    const viewport=vv();
    if(!viewport)return;
    root.style.setProperty('--keyboard-vh',Math.round(viewport.height)+'px');
    root.style.setProperty('--keyboard-vw',Math.round(viewport.width)+'px');
    root.style.setProperty('--keyboard-top',Math.round(viewport.offsetTop)+'px');
    root.style.setProperty('--keyboard-left',Math.round(viewport.offsetLeft)+'px');
  }

  function keepFocusedFieldVisible(){
    if(!isKeyboardOpen())return;
    const active=document.activeElement;
    const viewport=vv();
    const panel=active?.closest?.('.modal-panel,.sheet-panel');
    if(!editable(active)||!viewport||!panel)return;

    const rect=active.getBoundingClientRect();
    const visibleTop=viewport.offsetTop+14;
    const visibleBottom=viewport.offsetTop+viewport.height-18;
    let delta=0;
    if(rect.bottom>visibleBottom) delta=rect.bottom-visibleBottom+22;
    else if(rect.top<visibleTop) delta=rect.top-visibleTop-18;

    if(Math.abs(delta)>1){
      panel.scrollTop += delta;
    }
  }

  function syncNow(){
    raf=0;
    captureStableHeight(false);
    exposeViewportVars();
    const open=isKeyboardOpen();
    document.body?.classList.toggle('keyboard-open',open);
    if(!open) document.body?.classList.remove('keyboard-settling');
  }

  function scheduleSync(){
    if(raf)return;
    raf=requestAnimationFrame(syncNow);
  }

  const style=document.createElement('style');
  style.id='keyboardFixStyleV2';
  style.textContent=`
    html.ui-v5 body.ui-final.vf-home,
    html.ui-v5 body.ui-final.vf-home .app,
    html.ui-v5 body.ui-final #v3Home:not([hidden]){
      height:var(--app-stable-h,var(--v4-screen-h,100dvh))!important;
      max-height:var(--app-stable-h,var(--v4-screen-h,100dvh))!important;
    }
    html.ui-v5 body.ui-final #v3SettingsRoot:not([hidden]),
    html.ui-v5 body.ui-final.v3-legacy-open .page.active{
      min-height:var(--app-stable-h,var(--v4-screen-h,100dvh))!important;
    }

    @media(max-width:700px){
      html.ui-v5 body.ui-final input,
      html.ui-v5 body.ui-final textarea,
      html.ui-v5 body.ui-final select{
        font-size:16px!important;
      }

      html.ui-v5 body.ui-final.keyboard-open{
        overflow:hidden!important;
      }

      html.ui-v5 body.ui-final.keyboard-open .modal.open,
      html.ui-v5 body.ui-final.keyboard-open .sheet.open{
        box-sizing:border-box!important;
        position:fixed!important;
        inset:auto!important;
        top:var(--keyboard-top,0px)!important;
        left:var(--keyboard-left,0px)!important;
        width:var(--keyboard-vw,100vw)!important;
        height:var(--keyboard-vh,100dvh)!important;
        align-items:flex-end!important;
        justify-content:flex-end!important;
        overflow:hidden!important;
        padding:0!important;

        /* iOS 在键盘动画期间对 backdrop-filter 的实时合成代价很高。 */
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        background:rgba(1,3,7,.58)!important;
      }

      html.ui-v5 body.ui-final.keyboard-open .modal.open .modal-panel,
      html.ui-v5 body.ui-final.keyboard-open .sheet.open .sheet-panel{
        box-sizing:border-box!important;
        width:100%!important;
        max-width:none!important;
        max-height:calc(var(--keyboard-vh,100dvh) - 8px)!important;
        margin:0!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch;
        padding-bottom:14px!important;
        border-radius:25px 25px 0 0!important;

        /* 输入时优先稳定帧率，保留玻璃色彩但停止实时背景采样。 */
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        background:linear-gradient(160deg,rgba(38,45,58,.97),rgba(17,22,30,.98))!important;
        animation:none!important;
        transform:none!important;
        contain:layout paint;
      }

      html.ui-v5 body.ui-final.keyboard-open #trainingSessionShell,
      html.ui-v5 body.ui-final.keyboard-open .v3-avatar,
      html.ui-v5 body.ui-final.keyboard-open .v3-avatar-stage:before,
      html.ui-v5 body.ui-final.keyboard-open .v3-avatar-stage:after{
        animation-play-state:paused!important;
      }

      html.ui-v5 body.ui-final.keyboard-open .vf-ripple{
        display:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  captureStableHeight(true);
  syncNow();

  window.addEventListener('resize',()=>{
    if(!isKeyboardOpen())captureStableHeight(false);
    scheduleSync();
  },{passive:true});

  vv()?.addEventListener('resize',()=>{
    scheduleSync();
    clearTimeout(focusTimer);
    focusTimer=setTimeout(keepFocusedFieldVisible,90);
  },{passive:true});

  /* 只同步 viewport 坐标，不再在 scroll 回调里反复滚动输入框。 */
  vv()?.addEventListener('scroll',scheduleSync,{passive:true});

  document.addEventListener('focusin',e=>{
    if(!editable(e.target))return;
    document.body?.classList.add('keyboard-settling');
    clearTimeout(focusTimer);
    scheduleSync();
    focusTimer=setTimeout(()=>{
      scheduleSync();
      keepFocusedFieldVisible();
    },180);
  });

  document.addEventListener('focusout',()=>{
    clearTimeout(focusTimer);
    focusTimer=setTimeout(scheduleSync,180);
  });

  window.addEventListener('orientationchange',()=>{
    setTimeout(()=>{
      stableHeight=0;
      captureStableHeight(true);
      scheduleSync();
    },320);
  });
})();