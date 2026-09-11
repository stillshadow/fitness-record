(() => {
  if (window.__CHI_BIAN_YING_KEYBOARD_FIX_V3__) return;
  window.__CHI_BIAN_YING_KEYBOARD_FIX_V3__ = true;

  const root=document.documentElement;
  const vv=()=>window.visualViewport;
  let stableHeight=Math.round(window.innerHeight||document.documentElement.clientHeight||0);
  let raf=0;
  let focusTimer=0;

  const editable=el=>!!el&&el.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]),textarea,select,[contenteditable="true"]');

  function isKeyboardOpen(){
    const viewport=vv();
    if(!viewport||!stableHeight)return false;
    return stableHeight-Math.round(viewport.height)>120;
  }

  function syncNow(){
    raf=0;
    const viewport=vv();
    if(viewport)root.style.setProperty('--keyboard-vh',Math.round(viewport.height)+'px');
    const open=isKeyboardOpen();
    document.body?.classList.toggle('keyboard-open',open);
    if(!open)document.body?.classList.remove('keyboard-settling');
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(syncNow);
  }

  const style=document.createElement('style');
  style.id='keyboardFixStyleV3';
  style.textContent=`
    @media(max-width:700px){
      html.ui-v5 body.ui-final input,
      html.ui-v5 body.ui-final textarea,
      html.ui-v5 body.ui-final select{
        font-size:16px!important;
      }

      html.ui-v5 body.ui-final .modal.open,
      html.ui-v5 body.ui-final .sheet.open{
        position:fixed!important;
        inset:0!important;
        width:auto!important;
        height:auto!important;
        align-items:flex-end!important;
        justify-content:center!important;
        overflow:hidden!important;
        padding:0!important;
        transform:none!important;
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        background:rgba(1,3,7,.72)!important;
      }

      html.ui-v5 body.ui-final .modal.open .modal-panel,
      html.ui-v5 body.ui-final .sheet.open .sheet-panel{
        box-sizing:border-box!important;
        width:100%!important;
        max-width:none!important;
        max-height:min(88dvh,calc(var(--keyboard-vh,100dvh) - 8px))!important;
        margin:0!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        border-radius:22px 22px 0 0!important;
        background:#171d27!important;
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        box-shadow:0 -10px 32px rgba(0,0,0,.38)!important;
        transform:none!important;
        contain:none!important;
      }

      html.ui-v5 body.ui-final.keyboard-open{
        overflow:hidden!important;
      }

      html.ui-v5 body.ui-final.keyboard-open .modal.open .modal-panel,
      html.ui-v5 body.ui-final.keyboard-open .sheet.open .sheet-panel{
        max-height:calc(var(--keyboard-vh,100dvh) - 6px)!important;
        padding-bottom:12px!important;
      }

      html.ui-v5 body.ui-final .modal input,
      html.ui-v5 body.ui-final .modal select,
      html.ui-v5 body.ui-final .modal textarea,
      html.ui-v5 body.ui-final .modal button,
      html.ui-v5 body.ui-final .sheet input,
      html.ui-v5 body.ui-final .sheet select,
      html.ui-v5 body.ui-final .sheet textarea,
      html.ui-v5 body.ui-final .sheet button{
        touch-action:manipulation;
      }
    }
  `;
  document.head.appendChild(style);

  window.addEventListener('resize',()=>{
    if(!editable(document.activeElement)&&!isKeyboardOpen()){
      stableHeight=Math.max(stableHeight,Math.round(window.innerHeight||0));
    }
    schedule();
  },{passive:true});

  vv()?.addEventListener('resize',schedule,{passive:true});
  vv()?.addEventListener('scroll',schedule,{passive:true});

  document.addEventListener('focusin',e=>{
    if(!editable(e.target))return;
    document.body?.classList.add('keyboard-settling');
    schedule();
  });

  document.addEventListener('focusout',()=>{
    clearTimeout(focusTimer);
    focusTimer=setTimeout(schedule,240);
  });

  window.addEventListener('orientationchange',()=>{
    setTimeout(()=>{
      stableHeight=Math.round(window.innerHeight||document.documentElement.clientHeight||stableHeight);
      schedule();
    },320);
  });

  syncNow();
})();