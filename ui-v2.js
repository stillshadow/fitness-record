(() => {
  const icons={
    today:'<svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    training:'<svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 9v6M8 7v10M16 7v10M19 9v6M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    food:'<svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v8M4.5 3v5.5A2.5 2.5 0 0 0 7 11v10M9.5 3v5.5A2.5 2.5 0 0 1 7 11M16 3v18M16 3c2 0 4 2.4 4 5.5S18 14 16 14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    progress:'<svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18 9 13l3 3 7-8M15 8h4v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    settings:'<svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.7"/><path d="M19 13.2v-2.4l-2-.7a7 7 0 0 0-.7-1.6l.9-1.9-1.8-1.8-1.9.9a7 7 0 0 0-1.6-.7L11.2 3H8.8l-.7 2a7 7 0 0 0-1.6.7l-1.9-.9-1.8 1.8.9 1.9a7 7 0 0 0-.7 1.6l-2 .7v2.4l2 .7a7 7 0 0 0 .7 1.6l-.9 1.9 1.8 1.8 1.9-.9a7 7 0 0 0 1.6.7l.7 2h2.4l.7-2a7 7 0 0 0 1.6-.7l1.9.9 1.8-1.8-.9-1.9a7 7 0 0 0 .7-1.6l2-.7Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" transform="translate(2 0) scale(.85)"/></svg>'
  };

  function ensureStyle(){
    if(document.querySelector('link[data-ui-v2]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='ui-v2.css?v=32';link.dataset.uiV2='1';
    document.head.appendChild(link);
  }

  function decorateNav(){
    document.querySelectorAll('.bottom-nav button[data-page]').forEach(btn=>{
      if(btn.querySelector('.nav-icon'))return;
      const page=btn.dataset.page;
      const label=btn.textContent.trim();
      btn.innerHTML=(icons[page]||'')+`<span>${label}</span>`;
    });
  }

  function simplifyLabels(){
    const today=document.querySelector('.desktop-tabs [data-page="today"]');
    if(today)today.textContent='今日';
    const settings=document.querySelector('.bottom-nav [data-page="settings"] span');
    if(settings&&settings.textContent==='方案')settings.textContent='设置';
  }

  function removeQuickFab(){
    document.getElementById('fab')?.remove();
  }

  function setup(){
    ensureStyle();
    document.body.classList.add('ui-v2');
    decorateNav();
    simplifyLabels();
    removeQuickFab();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();