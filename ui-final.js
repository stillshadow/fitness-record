(() => {
  if (window.__CHI_BIAN_YING_UI_FINAL__) return;
  window.__CHI_BIAN_YING_UI_FINAL__ = true;

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const style = document.createElement('style');
  style.id = 'uiFinalStyle';
  style.textContent = `
    :root{
      --glass-bg:rgba(24,29,39,.52);
      --glass-bg-strong:rgba(27,33,44,.68);
      --glass-line:rgba(255,255,255,.12);
      --glass-line-soft:rgba(255,255,255,.07);
      --glass-highlight:rgba(255,255,255,.17);
      --glass-shadow:0 18px 55px rgba(0,0,0,.28);
      --glass-blur:blur(28px) saturate(145%);
      --final-blue:#a9b8ff;
      --final-text:#f4f6fb;
      --final-muted:#8993a3;
    }

    html.ui-v5 body.ui-final{
      margin:0!important;
      padding-bottom:0!important;
      color:var(--final-text)!important;
      background:
        radial-gradient(520px 420px at 76% 5%,rgba(125,145,255,.12),transparent 68%),
        radial-gradient(620px 520px at 8% 72%,rgba(82,112,190,.07),transparent 72%),
        linear-gradient(180deg,#07090d 0%,#0b0e14 100%)!important;
      -webkit-tap-highlight-color:transparent;
    }
    html.ui-v5 body.ui-final .app{max-width:820px!important;margin:auto!important}

    /* screens are mutually exclusive */
    html.ui-v5 body.ui-final #v3Home[hidden],
    html.ui-v5 body.ui-final #v3SettingsRoot[hidden]{display:none!important}
    html.ui-v5 body.ui-final.vf-home .page{display:none!important}
    html.ui-v5 body.ui-final.vf-settings .page{display:none!important}

    /* home */
    html.ui-v5 body.ui-final.vf-home{
      height:var(--v4-screen-h,100dvh)!important;
      overflow:hidden!important;
      overscroll-behavior:none!important;
    }
    html.ui-v5 body.ui-final.vf-home .app{
      height:var(--v4-screen-h,100dvh)!important;
      overflow:hidden!important;
      padding:0 13px!important;
    }
    html.ui-v5 body.ui-final #v3Home:not([hidden]){
      box-sizing:border-box!important;
      height:var(--v4-screen-h,100dvh)!important;
      min-height:0!important;
      max-height:var(--v4-screen-h,100dvh)!important;
      display:grid!important;
      grid-template-rows:auto minmax(0,1fr) auto!important;
      overflow:hidden!important;
      padding:calc(12px + env(safe-area-inset-top)) 0 max(calc(env(safe-area-inset-bottom) + 64px),96px)!important;
      position:relative!important;
      isolation:isolate;
      animation:vfHomeIn .48s cubic-bezier(.22,.8,.24,1) both;
    }
    html.ui-v5 body.ui-final #v3Home::before{
      content:"";position:absolute;inset:0;z-index:-3;pointer-events:none;
      background:
        radial-gradient(circle at 50% 38%,rgba(139,159,255,.09),transparent 34%),
        radial-gradient(circle at 52% 40%,rgba(255,255,255,.018),transparent 18%);
    }
    html.ui-v5 body.ui-final #v3Home::after{
      content:"";position:absolute;z-index:-2;pointer-events:none;
      width:390px;height:390px;left:50%;top:22%;transform:translate(-50%,-50%);
      border-radius:50%;opacity:.42;filter:blur(48px);
      background:linear-gradient(145deg,rgba(112,139,255,.15),rgba(86,103,170,.02));
      animation:vfAmbient 7s ease-in-out infinite;
    }

    html.ui-v5 body.ui-final .v3-top{min-height:44px!important;position:relative;z-index:5}
    html.ui-v5 body.ui-final .v3-today{font-size:11px!important;color:#858e9d!important;letter-spacing:.045em!important}
    html.ui-v5 body.ui-final .v3-today b{font-size:17px!important;font-weight:690!important;color:#f2f4f9!important;letter-spacing:-.012em!important}

    html.ui-v5 body.ui-final .v3-icon-btn,
    html.ui-v5 body.ui-final .v3-back{
      border:1px solid var(--glass-line)!important;
      background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.035))!important;
      color:#eef2fb!important;
      backdrop-filter:var(--glass-blur)!important;
      -webkit-backdrop-filter:var(--glass-blur)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 24px rgba(0,0,0,.16)!important;
    }
    html.ui-v5 body.ui-final .v3-icon-btn{width:42px!important;height:42px!important;border-radius:50%!important}

    html.ui-v5 body.ui-final .v3-avatar-stage{
      height:auto!important;min-height:0!important;align-self:stretch!important;
      overflow:hidden!important;display:grid!important;place-items:center!important;
      transform:translateY(-4px);
    }
    html.ui-v5 body.ui-final .v3-avatar-stage:before{
      width:min(70vw,370px)!important;height:min(70vw,370px)!important;
      background:radial-gradient(circle,rgba(141,161,255,.14),rgba(109,133,225,.035) 48%,transparent 71%)!important;
      filter:blur(3px)!important;
    }
    html.ui-v5 body.ui-final .v3-avatar-stage:after{bottom:9%!important;opacity:.72!important;filter:blur(20px)!important}
    html.ui-v5 body.ui-final .v3-avatar-orbit{
      width:min(61vw,286px)!important;height:min(61vw,286px)!important;
      border-color:rgba(190,202,255,.055)!important;opacity:.72!important;
    }
    html.ui-v5 body.ui-final .v3-avatar{
      height:min(42vh,380px)!important;max-height:min(42vh,380px)!important;
      max-width:min(77vw,365px)!important;
      filter:drop-shadow(0 22px 32px rgba(0,0,0,.32)) drop-shadow(0 0 18px rgba(125,146,255,.035))!important;
      animation:vfAvatarFloat 5.2s ease-in-out infinite!important;
      will-change:transform,filter;
    }

    html.ui-v5 body.ui-final .v3-action-stack{
      align-self:end!important;margin:0!important;padding:0!important;gap:9px!important;
      position:relative!important;z-index:4!important;
    }
    html.ui-v5 body.ui-final .v3-grid{gap:9px!important}

    html.ui-v5 body.ui-final .v3-start,
    html.ui-v5 body.ui-final .v3-action,
    html.ui-v5 body.ui-final .v3-setting-row{
      position:relative!important;overflow:hidden!important;
      border:1px solid var(--glass-line)!important;
      backdrop-filter:var(--glass-blur)!important;
      -webkit-backdrop-filter:var(--glass-blur)!important;
      transform:translateZ(0);
      transition:transform .2s cubic-bezier(.22,.8,.24,1),border-color .2s ease,background .24s ease,box-shadow .24s ease!important;
    }
    html.ui-v5 body.ui-final .v3-start::before,
    html.ui-v5 body.ui-final .v3-action::before,
    html.ui-v5 body.ui-final .v3-setting-row::before{
      content:"";position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(135deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.035) 28%,transparent 53%);
      opacity:.48;
    }
    html.ui-v5 body.ui-final .v3-start{
      min-height:58px!important;border-radius:19px!important;padding:13px 16px!important;
      color:#0a1020!important;text-align:left!important;
      background:linear-gradient(135deg,rgba(228,233,255,.94),rgba(169,187,255,.86) 54%,rgba(139,162,255,.78))!important;
      border-color:rgba(255,255,255,.39)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 17px 42px rgba(80,105,218,.18)!important;
    }
    html.ui-v5 body.ui-final .v3-start::after{
      content:"";position:absolute;top:-80%;left:-34%;width:28%;height:260%;pointer-events:none;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);
      transform:rotate(17deg);animation:vfGlassSweep 7.5s 1.2s ease-in-out infinite;
    }
    html.ui-v5 body.ui-final .v3-start strong{font-size:16px!important;font-weight:800!important;letter-spacing:-.01em!important}
    html.ui-v5 body.ui-final .v3-start small{font-size:10px!important;opacity:.62!important;margin-top:1px!important}
    html.ui-v5 body.ui-final .v3-start .v3-arrow{font-size:25px!important;opacity:.7}

    html.ui-v5 body.ui-final .v3-action{
      min-height:65px!important;border-radius:17px!important;padding:10px 13px!important;text-align:left!important;
      background:linear-gradient(145deg,rgba(34,41,53,.58),rgba(18,23,31,.43))!important;
      color:var(--final-text)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 12px 34px rgba(0,0,0,.13)!important;
    }
    html.ui-v5 body.ui-final .v3-action svg{width:17px!important;height:17px!important;color:#b0bfff!important;filter:drop-shadow(0 0 10px rgba(155,174,255,.13))}
    html.ui-v5 body.ui-final .v3-action b{font-size:13px!important;font-weight:720!important}
    html.ui-v5 body.ui-final .v3-action small{font-size:9.5px!important;color:#8a94a4!important}

    @media(hover:hover){
      html.ui-v5 body.ui-final .v3-action:hover,
      html.ui-v5 body.ui-final .v3-setting-row:hover{transform:translateY(-2px)!important;border-color:rgba(182,197,255,.23)!important;background:linear-gradient(145deg,rgba(40,48,64,.64),rgba(21,27,37,.48))!important}
      html.ui-v5 body.ui-final .v3-start:hover{transform:translateY(-2px)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 20px 48px rgba(82,108,225,.24)!important}
    }
    html.ui-v5 body.ui-final .v3-action:active,
    html.ui-v5 body.ui-final .v3-start:active,
    html.ui-v5 body.ui-final .v3-icon-btn:active,
    html.ui-v5 body.ui-final .v3-setting-row:active,
    html.ui-v5 body.ui-final .btn:active,
    html.ui-v5 body.ui-final .v3-back:active{transform:scale(.972)!important;transition-duration:.08s!important}

    /* settings root */
    html.ui-v5 body.ui-final #v3SettingsRoot:not([hidden]){
      box-sizing:border-box!important;display:block!important;width:100%!important;
      min-height:var(--v4-screen-h,100dvh)!important;padding:0 0 max(28px,env(safe-area-inset-bottom))!important;
      animation:vfScreenIn .34s cubic-bezier(.22,.8,.24,1) both;
    }
    html.ui-v5 body.ui-final #v3SettingsRoot>.v3-settings-title,
    html.ui-v5 body.ui-final #v3SettingsRoot>.v3-settings-sub{display:none!important}
    html.ui-v5 body.ui-final .v3-settings-list{margin-top:8px!important;display:grid!important;gap:10px!important}
    html.ui-v5 body.ui-final .v3-setting-row{
      width:100%!important;min-height:74px!important;border-radius:19px!important;padding:14px 15px!important;
      display:grid!important;grid-template-columns:42px minmax(0,1fr) auto!important;align-items:center!important;gap:12px!important;
      background:linear-gradient(145deg,rgba(34,41,54,.56),rgba(17,22,30,.44))!important;
      color:var(--final-text)!important;text-align:left!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 12px 34px rgba(0,0,0,.12)!important;
    }
    html.ui-v5 body.ui-final .v3-setting-icon{
      width:40px!important;height:40px!important;border-radius:14px!important;
      background:linear-gradient(145deg,rgba(170,188,255,.17),rgba(127,150,255,.07))!important;
      border:1px solid rgba(193,204,255,.08)!important;color:#bdc9ff!important;
      display:grid!important;place-items:center!important;
    }
    html.ui-v5 body.ui-final .v3-setting-copy b{font-size:14px!important;font-weight:720!important}
    html.ui-v5 body.ui-final .v3-setting-copy small{font-size:10px!important;color:#8892a1!important}
    html.ui-v5 body.ui-final .v3-setting-chevron{color:#697485!important}

    /* floating app bar */
    html.ui-v5 body.ui-final .v3-pagebar{
      box-sizing:border-box!important;
      min-height:62px!important;margin:0 -13px 12px!important;
      padding:calc(10px + env(safe-area-inset-top)) 13px 10px!important;
      position:sticky!important;top:0!important;z-index:30!important;
      display:grid!important;grid-template-columns:40px minmax(0,1fr) 40px!important;align-items:center!important;gap:8px!important;
      background:rgba(8,11,16,.42)!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.035)!important;
      box-shadow:none!important;backdrop-filter:blur(20px) saturate(140%)!important;-webkit-backdrop-filter:blur(20px) saturate(140%)!important;
      transition:background .24s ease,border-color .24s ease,box-shadow .24s ease!important;
    }
    html.ui-v5 body.ui-final.vf-scrolled .v3-pagebar{
      background:rgba(15,19,26,.64)!important;border-bottom-color:rgba(255,255,255,.075)!important;
      box-shadow:0 10px 32px rgba(0,0,0,.12)!important;
    }
    html.ui-v5 body.ui-final .v3-pagebar::after{content:"";width:40px;height:1px;grid-column:3}
    html.ui-v5 body.ui-final .v3-pagebar>.v3-back{grid-column:1;grid-row:1;width:38px!important;height:38px!important;border-radius:50%!important;font-size:21px!important;line-height:1!important}
    html.ui-v5 body.ui-final .v3-pagebar>div{grid-column:2;grid-row:1;text-align:center;min-width:0}
    html.ui-v5 body.ui-final .v3-pagebar-title{font-size:18px!important;font-weight:710!important;letter-spacing:-.012em!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    html.ui-v5 body.ui-final .v3-pagebar small{display:none!important}

    /* detailed pages */
    html.ui-v5 body.ui-final.v3-legacy-open .page.active{
      min-height:var(--v4-screen-h,100dvh)!important;padding-bottom:max(32px,env(safe-area-inset-bottom))!important;
      animation:vfScreenIn .34s cubic-bezier(.22,.8,.24,1) both;
    }
    html.ui-v5 body.ui-final.v3-legacy-open .grid{gap:11px!important}
    html.ui-v5 body.ui-final.v3-legacy-open .card,
    html.ui-v5 body.ui-final .v3-progress-card{
      background:linear-gradient(145deg,rgba(31,38,50,.52),rgba(16,21,29,.43))!important;
      border:1px solid var(--glass-line-soft)!important;border-radius:19px!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 16px 44px rgba(0,0,0,.12)!important;
      backdrop-filter:blur(22px) saturate(135%)!important;-webkit-backdrop-filter:blur(22px) saturate(135%)!important;
    }
    html.ui-v5 body.ui-final.v3-legacy-open .card{padding:14px!important}
    html.ui-v5 body.ui-final.v3-legacy-open .card .section{margin-bottom:10px!important}
    html.ui-v5 body.ui-final.v3-legacy-open .card .section h2{font-size:14px!important;font-weight:730!important}

    html.ui-v5 body.ui-final #page-today>.grid>.card:first-child{
      background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0 0 2px!important;border-radius:0!important;
    }
    html.ui-v5 body.ui-final #historyDateNav{margin:1px 0 10px!important}
    html.ui-v5 body.ui-final .history-arrow,
    html.ui-v5 body.ui-final .history-date-button,
    html.ui-v5 body.ui-final .strength-category-chip{
      border:1px solid rgba(255,255,255,.08)!important;
      background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.022))!important;
      color:#dfe5ef!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
    }
    html.ui-v5 body.ui-final .strength-category-chip.active{
      background:linear-gradient(145deg,rgba(184,198,255,.92),rgba(145,165,255,.8))!important;
      border-color:rgba(255,255,255,.3)!important;color:#0a1020!important;
    }
    html.ui-v5 body.ui-final #page-today>.grid>.card:first-child .summary{
      overflow:hidden!important;border-radius:18px!important;border:1px solid rgba(255,255,255,.07)!important;
      background:linear-gradient(145deg,rgba(31,38,50,.5),rgba(17,22,30,.39))!important;
      backdrop-filter:blur(22px) saturate(135%)!important;-webkit-backdrop-filter:blur(22px) saturate(135%)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;
    }
    html.ui-v5 body.ui-final #page-today>.grid>.card:first-child .summary-item{
      background:transparent!important;border:0!important;border-right:1px solid rgba(255,255,255,.05)!important;border-radius:0!important;padding:12px 10px!important;
    }
    html.ui-v5 body.ui-final #page-today>.grid>.card:first-child .summary-item:last-child{border-right:0!important}

    html.ui-v5 body.ui-final .item,
    html.ui-v5 body.ui-final .finish-training-row,
    html.ui-v5 body.ui-final .session-action-row{
      border:1px solid rgba(255,255,255,.055)!important;border-radius:15px!important;
      background:rgba(255,255,255,.026)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important;
      transition:background .18s ease,border-color .18s ease,transform .12s ease!important;
    }
    html.ui-v5 body.ui-final .item:active{transform:scale(.988)}
    html.ui-v5 body.ui-final .empty{border:0!important;background:rgba(255,255,255,.02)!important;color:#778190!important;border-radius:14px!important}

    html.ui-v5 body.ui-final .btn{
      position:relative;overflow:hidden;border-radius:11px!important;min-height:39px!important;
      transition:transform .12s ease,filter .18s ease,background .18s ease!important;
    }
    html.ui-v5 body.ui-final .btn:not(.ghost):not(.danger){
      background:linear-gradient(145deg,#bdc9ff,#91a6ff)!important;color:#09101d!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)!important;
    }
    html.ui-v5 body.ui-final .btn.ghost{
      background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.075)!important;color:#e6ebf5!important;
      backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;
    }
    html.ui-v5 body.ui-final .btn.soft{background:rgba(151,171,255,.12)!important;color:#cbd6ff!important}
    html.ui-v5 body.ui-final .btn.danger{background:rgba(255,93,109,.08)!important;color:#ff9ea8!important}

    html.ui-v5 body.ui-final input,
    html.ui-v5 body.ui-final select,
    html.ui-v5 body.ui-final textarea{
      border:1px solid rgba(255,255,255,.085)!important;border-radius:13px!important;
      background:rgba(7,10,15,.56)!important;color:#f2f4f8!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;
      transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;
    }
    html.ui-v5 body.ui-final input:focus,
    html.ui-v5 body.ui-final select:focus,
    html.ui-v5 body.ui-final textarea:focus{
      border-color:rgba(164,184,255,.45)!important;box-shadow:0 0 0 3px rgba(128,151,255,.09)!important;background:rgba(9,13,20,.72)!important;
    }

    /* progress */
    html.ui-v5 body.ui-final .v3-progress-card{padding:15px!important}
    html.ui-v5 body.ui-final .v3-progress-summary{border-color:rgba(255,255,255,.06)!important}
    html.ui-v5 body.ui-final .v3-stat{border-color:rgba(255,255,255,.055)!important}
    html.ui-v5 body.ui-final .v3-progress-summary .v3-stat:first-child strong{font-size:22px!important}
    html.ui-v5 body.ui-final #v3WeightChart{height:205px!important}
    html.ui-v5 body.ui-final .v3-chart-raw{opacity:.46!important}
    html.ui-v5 body.ui-final .v3-chart-trend{stroke:#b1c0ff!important;stroke-width:3!important;filter:drop-shadow(0 0 7px rgba(157,177,255,.16))}
    html.ui-v5 body.ui-final .v3-macro{background:rgba(255,255,255,.024)!important;border-color:rgba(255,255,255,.05)!important;border-radius:14px!important}

    /* sheets and modals */
    html.ui-v5 body.ui-final .modal,
    html.ui-v5 body.ui-final .sheet{background:rgba(1,3,7,.46)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
    html.ui-v5 body.ui-final .modal.open .modal-panel,
    html.ui-v5 body.ui-final .sheet.open .sheet-panel{animation:vfSheetIn .34s cubic-bezier(.2,.82,.2,1) both}
    html.ui-v5 body.ui-final .modal-panel,
    html.ui-v5 body.ui-final .sheet-panel{
      border:1px solid rgba(255,255,255,.12)!important;
      background:linear-gradient(160deg,rgba(38,45,58,.84),rgba(17,22,30,.88))!important;
      backdrop-filter:blur(34px) saturate(145%)!important;-webkit-backdrop-filter:blur(34px) saturate(145%)!important;
      box-shadow:0 -8px 60px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.1)!important;
    }

    .vf-ripple{
      position:absolute;pointer-events:none;border-radius:50%;z-index:20;
      width:12px;height:12px;margin:-6px 0 0 -6px;
      background:rgba(255,255,255,.28);transform:scale(0);opacity:.7;
      animation:vfRipple .56s ease-out forwards;
    }

    /* staggered screen entrance */
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-top{animation:vfFadeDown .38s .02s ease-out both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-avatar-stage{animation:vfAvatarReveal .62s .06s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-start{animation:vfActionReveal .42s .12s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-action:nth-child(1){animation:vfActionReveal .42s .16s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-action:nth-child(2){animation:vfActionReveal .42s .19s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-action:nth-child(3){animation:vfActionReveal .42s .22s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5.v5-ready body.ui-final #v3Home:not([hidden]) .v3-action:nth-child(4){animation:vfActionReveal .42s .25s cubic-bezier(.22,.8,.24,1) both}
    html.ui-v5 body.ui-final #v3SettingsRoot:not([hidden]) .v3-setting-row:nth-child(1){animation:vfActionReveal .35s .03s ease-out both}
    html.ui-v5 body.ui-final #v3SettingsRoot:not([hidden]) .v3-setting-row:nth-child(2){animation:vfActionReveal .35s .07s ease-out both}
    html.ui-v5 body.ui-final #v3SettingsRoot:not([hidden]) .v3-setting-row:nth-child(3){animation:vfActionReveal .35s .11s ease-out both}

    @keyframes vfHomeIn{from{opacity:.82}to{opacity:1}}
    @keyframes vfScreenIn{from{opacity:0;transform:translateX(9px)}to{opacity:1;transform:none}}
    @keyframes vfFadeDown{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
    @keyframes vfAvatarReveal{from{opacity:0;transform:translateY(11px) scale(.975)}to{opacity:1;transform:none}}
    @keyframes vfActionReveal{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
    @keyframes vfAvatarFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
    @keyframes vfAmbient{0%,100%{transform:translate(-50%,-50%) scale(.94);opacity:.32}50%{transform:translate(-50%,-50%) scale(1.08);opacity:.52}}
    @keyframes vfGlassSweep{0%,72%{left:-40%;opacity:0}78%{opacity:.55}91%{left:124%;opacity:.18}100%{left:124%;opacity:0}}
    @keyframes vfRipple{to{transform:scale(16);opacity:0}}
    @keyframes vfSheetIn{from{opacity:0;transform:translateY(24px) scale(.985)}to{opacity:1;transform:none}}

    @media(max-width:700px){
      html.ui-v5 body.ui-final .app{padding-left:12px!important;padding-right:12px!important}
      html.ui-v5 body.ui-final.vf-home .app{padding:0 12px!important}
      html.ui-v5 body.ui-final #v3Home:not([hidden]){padding-top:calc(11px + env(safe-area-inset-top))!important}
      html.ui-v5 body.ui-final .v3-pagebar{margin-left:-12px!important;margin-right:-12px!important;padding-left:12px!important;padding-right:12px!important}
      html.ui-v5 body.ui-final .modal{align-items:flex-end!important;padding:0!important}
      html.ui-v5 body.ui-final .modal-panel,
      html.ui-v5 body.ui-final .modal-panel.wide{
        width:100%!important;max-width:none!important;max-height:min(91dvh,calc(var(--v4-screen-h,100dvh) - 20px))!important;
        border-radius:25px 25px 0 0!important;border-left:0!important;border-right:0!important;border-bottom:0!important;
        padding:16px 14px calc(17px + env(safe-area-inset-bottom))!important;
      }
    }
    @media(max-height:720px){
      html.ui-v5 body.ui-final #v3Home:not([hidden]){padding-bottom:max(calc(env(safe-area-inset-bottom) + 38px),66px)!important}
      html.ui-v5 body.ui-final .v3-avatar{height:min(37vh,285px)!important;max-height:min(37vh,285px)!important}
      html.ui-v5 body.ui-final .v3-action{min-height:59px!important;padding:8px 11px!important}
      html.ui-v5 body.ui-final .v3-start{min-height:53px!important;padding:10px 13px!important}
    }
    @media(max-height:610px){
      html.ui-v5 body.ui-final #v3Home:not([hidden]){padding-bottom:max(calc(env(safe-area-inset-bottom) + 16px),42px)!important}
      html.ui-v5 body.ui-final .v3-avatar{height:min(31vh,220px)!important;max-height:min(31vh,220px)!important}
      html.ui-v5 body.ui-final .v3-action{min-height:53px!important}
      html.ui-v5 body.ui-final .v3-action small,html.ui-v5 body.ui-final .v3-start small{display:none!important}
      html.ui-v5 body.ui-final .v3-action-stack,html.ui-v5 body.ui-final .v3-grid{gap:6px!important}
    }
    @media(min-width:760px) and (min-height:740px){
      html.ui-v5 body.ui-final.vf-home .app{max-width:760px!important}
      html.ui-v5 body.ui-final .v3-avatar{max-width:340px!important}
    }
    @media(prefers-reduced-motion:reduce){
      html.ui-v5 body.ui-final *,html.ui-v5 body.ui-final *::before,html.ui-v5 body.ui-final *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
    }
  `;
  document.head.appendChild(style);

  function viewportHeight(){
    const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (h > 0) root.style.setProperty('--v4-screen-h', `${h}px`);
  }

  function syncScreens(){
    const home = $('v3Home');
    const settings = $('v3SettingsRoot');
    if (!home || !settings) return;
    const legacy = document.body.classList.contains('v3-legacy-open');
    if (legacy) {
      if (!home.hidden) home.hidden = true;
      if (!settings.hidden) settings.hidden = true;
    } else if (!settings.hidden) {
      if (!home.hidden) home.hidden = true;
    }
    const homeActive = !legacy && !home.hidden && settings.hidden;
    const settingsActive = !legacy && !settings.hidden;
    document.body.classList.toggle('vf-home',homeActive);
    document.body.classList.toggle('vf-settings',settingsActive);
    if (homeActive) window.scrollTo(0,0);
  }

  function syncScroll(){
    document.body.classList.toggle('vf-scrolled', window.scrollY > 12);
  }

  function addRipple(e){
    if (reduceMotion || e.button > 0) return;
    const target = e.target.closest('.v3-start,.v3-action,.v3-icon-btn,.v3-setting-row,.v3-back,.btn,.history-arrow,.history-date-button,.strength-category-chip');
    if (!target || target.disabled) return;
    const r = target.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'vf-ripple';
    dot.style.left = `${e.clientX-r.left}px`;
    dot.style.top = `${e.clientY-r.top}px`;
    target.appendChild(dot);
    setTimeout(()=>dot.remove(),620);
  }

  function polishDOM(){
    $('v3SettingsRoot')?.querySelector(':scope > .v3-settings-title')?.remove();
    $('v3SettingsRoot')?.querySelector(':scope > .v3-settings-sub')?.remove();
    const startSub=$('v3StartSub'); if(startSub && startSub.textContent.includes('从模板')) startSub.textContent='模板或自由训练';
  }

  function observe(){
    const home=$('v3Home'),settings=$('v3SettingsRoot');
    if(home)new MutationObserver(syncScreens).observe(home,{attributes:true,attributeFilter:['hidden']});
    if(settings)new MutationObserver(syncScreens).observe(settings,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(syncScreens).observe(document.body,{attributes:true,attributeFilter:['class']});
  }

  function setup(){
    if(!$('v3Home') || !$('v3SettingsRoot') || !document.body) return setTimeout(setup,30);
    document.body.classList.add('ui-final');
    viewportHeight();
    polishDOM();
    syncScreens();
    syncScroll();
    observe();
    window.addEventListener('resize',viewportHeight,{passive:true});
    window.visualViewport?.addEventListener('resize',viewportHeight,{passive:true});
    window.addEventListener('scroll',syncScroll,{passive:true});
    document.addEventListener('pointerdown',addRipple,{passive:true});
    window.addEventListener('fitness:changed',()=>requestAnimationFrame(()=>{polishDOM();syncScreens()}));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();