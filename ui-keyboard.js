(() => {
  if (window.__CHI_BIAN_YING_KEYBOARD_FIX__) return;
  window.__CHI_BIAN_YING_KEYBOARD_FIX__ = true;

  const root = document.documentElement;
  let stableHeight = 0;
  let lastWidth = 0;
  let timer = 0;

  const vv = () => window.visualViewport;
  const editable = el => !!el && (
    el.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]') ||
    el.matches?.('select')
  );

  const currentFullHeight = () => Math.round(Math.max(
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    vv()?.height || 0
  ));

  function initStableHeight(force = false) {
    const viewport = vv();
    const w = Math.round(viewport?.width || window.innerWidth || 0);
    const h = currentFullHeight();
    const rotated = lastWidth && Math.abs(w - lastWidth) > 80;
    if (force || !stableHeight || rotated) stableHeight = h;
    else if (!editable(document.activeElement)) stableHeight = Math.max(stableHeight, h);
    lastWidth = w;
    if (stableHeight) root.style.setProperty('--app-stable-h', `${stableHeight}px`);
  }

  function keyboardState() {
    const viewport = vv();
    if (!viewport || !stableHeight) return false;
    const active = document.activeElement;
    return editable(active) && stableHeight - viewport.height > 110;
  }

  function clearOverlayPosition(el) {
    ['top','left','right','bottom','width','height'].forEach(p => el.style.removeProperty(p));
  }

  function positionOpenOverlays(open) {
    const viewport = vv();
    if (!viewport) return;
    const overlays = document.querySelectorAll('.modal.open,.sheet.open');
    overlays.forEach(el => {
      if (!open) return clearOverlayPosition(el);
      el.style.setProperty('position','fixed','important');
      el.style.setProperty('top',`${Math.round(viewport.offsetTop)}px`,'important');
      el.style.setProperty('left',`${Math.round(viewport.offsetLeft)}px`,'important');
      el.style.setProperty('right','auto','important');
      el.style.setProperty('bottom','auto','important');
      el.style.setProperty('width',`${Math.round(viewport.width)}px`,'important');
      el.style.setProperty('height',`${Math.round(viewport.height)}px`,'important');
    });
  }

  function keepFieldVisible() {
    const active = document.activeElement;
    if (!editable(active) || !keyboardState()) return;
    const viewport = vv();
    const panel = active.closest?.('.modal-panel,.sheet-panel');
    if (!viewport || !panel) return;
    const r = active.getBoundingClientRect();
    const top = viewport.offsetTop + 14;
    const bottom = viewport.offsetTop + viewport.height - 18;
    if (r.bottom > bottom) panel.scrollBy({top:r.bottom-bottom+28,behavior:'smooth'});
    else if (r.top < top) panel.scrollBy({top:r.top-top-22,behavior:'smooth'});
  }

  function sync() {
    initStableHeight(false);
    const viewport = vv();
    if (viewport) {
      root.style.setProperty('--keyboard-vh', `${Math.round(viewport.height)}px`);
      root.style.setProperty('--keyboard-top', `${Math.round(viewport.offsetTop)}px`);
    }
    const open = keyboardState();
    document.body?.classList.toggle('keyboard-open', open);
    positionOpenOverlays(open);
    if (open) setTimeout(keepFieldVisible, 70);
  }

  const style = document.createElement('style');
  style.id = 'keyboardFixStyle';
  style.textContent = `
    /* The app's canvas must not collapse when iOS opens its software keyboard. */
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

    /* 16px prevents Safari from zooming the whole page when an input receives focus. */
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
        align-items:flex-end!important;
        justify-content:flex-end!important;
        overflow:hidden!important;
        padding:0!important;
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
      }
      html.ui-v5 body.ui-final.keyboard-open .modal.open .modal-panel::before,
      html.ui-v5 body.ui-final.keyboard-open .sheet.open .sheet-panel::before{
        position:sticky!important;
        top:0!important;
      }
    }
  `;
  document.head.appendChild(style);

  initStableHeight(true);
  sync();

  window.addEventListener('resize', () => {
    if (!keyboardState()) initStableHeight(false);
    sync();
  }, {passive:true});
  vv()?.addEventListener('resize', sync, {passive:true});
  vv()?.addEventListener('scroll', sync, {passive:true});

  document.addEventListener('focusin', e => {
    if (!editable(e.target)) return;
    clearTimeout(timer);
    timer = setTimeout(sync, 40);
    setTimeout(sync, 180);
    setTimeout(keepFieldVisible, 300);
  });
  document.addEventListener('focusout', () => {
    clearTimeout(timer);
    timer = setTimeout(sync, 220);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { stableHeight = 0; initStableHeight(true); sync(); }, 320);
  });
})();
