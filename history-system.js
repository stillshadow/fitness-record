(() => {
  const $ = id => document.getElementById(id);
  const todayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const parseDate = s => {
    const [y,m,d] = String(s).split("-").map(Number);
    return new Date(y,m-1,d);
  };
  const addDays = (s,n) => {
    const d = parseDate(s);
    d.setDate(d.getDate()+n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const pretty = s => {
    const d = parseDate(s), today = parseDate(todayString());
    const weeks=["周日","周一","周二","周三","周四","周五","周六"];
    const prefix = s===todayString() ? "今天 · " : (d.getFullYear()!==today.getFullYear()?`${d.getFullYear()}年`:"");
    return `${prefix}${d.getMonth()+1}月${d.getDate()}日 · ${weeks[d.getDay()]}`;
  };
  const activeDate = () => {
    const label = $("activeDateLabel")?.textContent.trim() || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(label) ? label : todayString();
  };
  const openDate = date => {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const input=$("backfillDate"), confirm=$("confirmBackfill");
    if(!input||!confirm)return;
    input.value=date;
    confirm.click();
    setTimeout(updateNav,0);
  };

  function setupDateNav(){
    const firstCard=$("page-today")?.querySelector(".card");
    const summary=firstCard?.querySelector(".summary");
    if(!firstCard||!summary||$("historyDateNav"))return;

    const nav=document.createElement("div");
    nav.id="historyDateNav";
    nav.className="history-date-nav";
    nav.innerHTML=`
      <button class="history-arrow" id="historyPrev" aria-label="前一天">‹</button>
      <button class="history-date-button" id="historyDateButton"></button>
      <button class="history-arrow" id="historyNext" aria-label="后一天">›</button>`;
    firstCard.insertBefore(nav,summary);

    $("historyPrev").addEventListener("click",()=>openDate(addDays(activeDate(),-1)));
    $("historyNext").addEventListener("click",()=>{
      const next=addDays(activeDate(),1);
      if(next<=todayString())openDate(next);
    });
    $("historyDateButton").addEventListener("click",()=>$("backfillBtn")?.click());

    const headerButton=$("backfillBtn");
    if(headerButton)headerButton.textContent="日期";
    const modal=$("backfillModal");
    const title=modal?.querySelector(".section h2");
    if(title)title.textContent="选择日期";
    const todayBtn=$("todayBtn");
    if(todayBtn)todayBtn.textContent="今天";
    const confirm=$("confirmBackfill");
    if(confirm)confirm.textContent="打开";

    const topSection=firstCard.querySelector(".section");
    if(topSection)topSection.style.display="none";

    const nutrition=$("sumC")?.closest(".card")?.querySelector(".section h2");
    const training=$("todayTrainingList")?.closest(".card")?.querySelector(".section h2");
    const food=$("todayFoodList")?.closest(".card")?.querySelector(".section h2");
    if(nutrition)nutrition.textContent="营养";
    if(training)training.textContent="训练";
    if(food)food.textContent="饮食";
    const trainingSection=$("todayTrainingList")?.closest(".card")?.querySelector(".section");
    if(trainingSection&&!$("historyEditTraining")){
      const edit=document.createElement("button");
      edit.type="button";edit.className="btn soft";edit.id="historyEditTraining";edit.textContent="编辑训练";
      edit.addEventListener("click",()=>window.openBatchTraining?.(activeDate()));
      trainingSection.appendChild(edit);
    }

    const summaryLabels=firstCard.querySelectorAll(".summary-item span");
    if(summaryLabels[0])summaryLabels[0].textContent="晨重";
    if(summaryLabels[1])summaryLabels[1].textContent="训练";
    if(summaryLabels[2])summaryLabels[2].textContent="有氧";

    updateNav();
  }

  function updateNav(){
    const date=activeDate(), today=todayString();
    const btn=$("historyDateButton"), next=$("historyNext"), subtitle=$("todayText");
    if(btn)btn.textContent=pretty(date);
    if(next){
      next.disabled=date>=today;
      next.classList.toggle("disabled",date>=today);
    }
    if(subtitle?.textContent.startsWith("补记 ·"))subtitle.textContent=subtitle.textContent.replace("补记 ·","查看 ·");
  }

  const meaningful = d => !!d && (
    d.weight!=null || (+d.cardio||0)>0 || (d.training||[]).length>0 || (d.foods||[]).length>0 || String(d.note||"").trim()
  );

  function recordSummary(day){
    const parts=[];
    const unique=new Set((day.training||[]).map(x=>x.exerciseId||x.exerciseName).filter(Boolean)).size;
    if(unique)parts.push(`训练 ${unique} 个动作`);
    if((+day.cardio||0)>0)parts.push(`有氧 ${+day.cardio}min`);
    if(!unique && !(+day.cardio||0))parts.push("休息");
    if((day.foods||[]).length)parts.push(`饮食 ${(day.foods||[]).length} 笔`);
    if(day.weight!=null)parts.push(`晨重 ${Number(day.weight).toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}kg`);
    return parts.join(" · ");
  }

  function setupRecentCard(){
    const grid=$("page-progress")?.querySelector(".grid");
    if(!grid||$("recentRecordsCard"))return;
    const card=document.createElement("div");
    card.className="card s12";
    card.id="recentRecordsCard";
    card.innerHTML='<div class="section"><h2>最近记录</h2><span class="meta">点日期查看详情</span></div><div id="recentRecordsList" class="list"></div>';
    grid.appendChild(card);
  }

  function renderRecent(){
    setupRecentCard();
    const box=$("recentRecordsList");
    if(!box||!window.fitnessApp?.getDB)return;
    const days=Object.values(window.fitnessApp.getDB().days||{})
      .filter(meaningful)
      .sort((a,b)=>String(b.date).localeCompare(String(a.date)))
      .slice(0,14);
    box.innerHTML="";
    if(!days.length){
      box.innerHTML='<div class="empty">暂无历史记录。</div>';
      return;
    }
    days.forEach(day=>{
      const row=document.createElement("button");
      row.type="button";
      row.className="item history-record";
      row.innerHTML=`<div class="item-main"><div class="item-title">${pretty(day.date)}</div><div class="item-sub">${recordSummary(day)}</div></div><span class="history-chevron">›</span>`;
      row.addEventListener("click",()=>openDate(day.date));
      box.appendChild(row);
    });
  }

  function setupObservers(){
    const label=$("activeDateLabel"), todayText=$("todayText");
    const observer=new MutationObserver(()=>requestAnimationFrame(updateNav));
    if(label)observer.observe(label,{childList:true,characterData:true,subtree:true});
    if(todayText)observer.observe(todayText,{childList:true,characterData:true,subtree:true});

    const chart=$("weightChart");
    if(chart)new MutationObserver(()=>requestAnimationFrame(renderRecent)).observe(chart,{childList:true,subtree:true});

    window.addEventListener("fitness:changed",()=>requestAnimationFrame(renderRecent));
    document.querySelectorAll('[data-page="progress"]').forEach(b=>b.addEventListener("click",()=>setTimeout(renderRecent,0)));
  }

  function setupStyles(){
    if($("historySystemStyle"))return;
    const style=document.createElement("style");
    style.id="historySystemStyle";
    style.textContent=`
      .history-date-nav{display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:8px;align-items:center;margin-bottom:11px}
      .history-arrow,.history-date-button{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:12px;height:42px}
      .history-arrow{font-size:24px;line-height:1;padding:0;font-weight:500}
      .history-arrow.disabled,.history-arrow:disabled{opacity:.28;cursor:default}
      .history-date-button{font-weight:800;font-size:14px;padding:0 10px}
      .history-record{width:100%;text-align:left;color:var(--text);font:inherit;cursor:pointer}
      .history-record:hover{border-color:var(--accent)}
      .history-chevron{color:var(--muted);font-size:22px;padding-left:6px}
      #strengthList .item > div:last-child{text-align:right}
      #todayTrainingList .item-actions{display:none!important}
      #backfillModal .modal-panel{max-width:100%;overflow:hidden}
      #backfillDate{width:100%!important;inline-size:100%!important;min-width:0!important;min-inline-size:0!important;max-width:100%!important;max-inline-size:100%!important;display:block!important;box-sizing:border-box!important;overflow:hidden!important;-webkit-appearance:none!important;appearance:none!important}
      #backfillDate::-webkit-date-and-time-value{min-width:0!important;margin:0!important;text-align:left}
      @media(max-width:700px){.history-date-nav{grid-template-columns:40px minmax(0,1fr) 40px}.history-arrow,.history-date-button{height:40px}}
    `;
    document.head.appendChild(style);
  }

  window.fitnessHistoryDate=activeDate;

  function setup(){
    if(!window.fitnessApp)return setTimeout(setup,60);
    setupStyles();
    setupDateNav();
    setupRecentCard();
    renderRecent();
    setupObservers();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();

(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const CATEGORIES=[
    {id:"chest",label:"胸"},
    {id:"back",label:"背"},
    {id:"shoulder",label:"肩"},
    {id:"biceps",label:"二头"},
    {id:"triceps",label:"三头"},
    {id:"legs",label:"腿 / 臀"},
    {id:"calves",label:"小腿"},
    {id:"core",label:"腹 / 核心"},
    {id:"fullbody",label:"全身"},
    {id:"other",label:"其他"}
  ];
  let activeLibraryCategory="all";
  let activeLibraryScene="all";
  let activeLibrarySource="all";
  let librarySearch="";
  let changingPicker=false;

  const getDB=()=>window.fitnessApp?.getDB?.()||{exercises:[]};
  const categoryOfGroup=group=>{
    const g=String(group||"");
    if(g.startsWith("胸"))return "chest";
    if(/^(背|斜方|肩胛)/.test(g))return "back";
    if(g.startsWith("肩"))return "shoulder";
    if(g.startsWith("二头"))return "biceps";
    if(g.startsWith("三头"))return "triceps";
    if(/^(股四头|腘绳肌|臀|大腿内侧)/.test(g))return "legs";
    if(/^(小腿|胫骨)/.test(g))return "calves";
    if(/腹|核心/.test(g))return "core";
    if(g.startsWith("全身"))return "fullbody";
    return "other";
  };
  const categoryOfExercise=ex=>categoryOfGroup(ex?.group);
  const availableCategories=()=>{
    const present=new Set((getDB().exercises||[]).map(categoryOfExercise));
    return CATEGORIES.filter(x=>present.has(x.id));
  };
  const labelOf=id=>CATEGORIES.find(x=>x.id===id)?.label||"其他";
  const sceneDefs=()=>window.EXERCISE_SCENES||{};
  const sceneOf=ex=>ex?.scenes?.[0]||"other";
  const sceneLabel=id=>sceneDefs()[id]?.label||"其他";
  const availableScenes=()=>{
    const present=new Set();
    (getDB().exercises||[]).forEach(ex=>(ex.scenes?.length?ex.scenes:["other"]).forEach(id=>present.add(id)));
    return [...present].map(id=>({id,label:sceneLabel(id),order:sceneDefs()[id]?.order??999})).sort((a,b)=>a.order-b.order||a.label.localeCompare(b.label,"zh-CN"));
  };

  function setupStyles(){
    if($("exerciseCategoryStyle"))return;
    const style=document.createElement("style");
    style.id="exerciseCategoryStyle";
    style.textContent=`
      .exercise-library-tools{display:grid;gap:8px;margin-bottom:9px}
      .exercise-library-search{width:100%;min-height:42px;box-sizing:border-box}
      .exercise-source-bar,.exercise-scene-bar,.exercise-category-bar{display:flex;gap:6px;overflow-x:auto;padding:1px 0;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .exercise-source-bar::-webkit-scrollbar,.exercise-scene-bar::-webkit-scrollbar,.exercise-category-bar::-webkit-scrollbar{display:none}
      .exercise-source-chip,.exercise-scene-chip,.exercise-category-chip{flex:0 0 auto;border:1px solid rgba(255,255,255,.09)!important;background:#111821!important;color:#8793a4!important;border-radius:999px;padding:6px 10px;font-size:11px;white-space:nowrap;box-shadow:none!important}
      .exercise-source-chip.active,.exercise-scene-chip.active,.exercise-category-chip.active{background:#26314a!important;border-color:#536789!important;color:#dce4ff!important;font-weight:800}
      .exercise-library-heading{font-size:12px;font-weight:850;color:var(--accent2);padding:11px 2px 2px}
      .exercise-library-item{align-items:center}
      .exercise-library-main{display:flex;align-items:center;gap:10px;min-width:0}
      .exercise-library-copy{min-width:0}
      .exercise-illustration{width:50px;height:50px;flex:0 0 50px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.025);display:grid;place-items:center;color:#9eacf7}
      .exercise-illustration svg{width:34px;height:34px}
      .exercise-illustration-small{width:48px;height:48px;flex-basis:48px}
      .exercise-library-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
      .exercise-library-tags span{display:inline-flex;align-items:center;min-height:21px;padding:2px 7px;border:1px solid rgba(255,255,255,.06);border-radius:999px;color:#758196;font-size:9px;background:rgba(255,255,255,.018)}
      .exercise-library-count{font-size:10px;color:var(--muted);padding:0 2px}
      #trainingGroupWrap{min-width:0}
      @media(max-width:700px){#trainingGroupWrap{grid-column:span 12!important}.exercise-illustration{width:44px;height:44px;flex-basis:44px}.exercise-illustration svg{width:31px;height:31px}.exercise-library-item .item-actions{gap:4px}.exercise-library-item .item-actions .btn{padding:7px 8px!important}}
    `;
    document.head.appendChild(style);
  }

  function ensurePickerCategories(preferred=""){
    const filter=$("trainingGroupFilter");if(!filter)return;
    const cats=availableCategories();
    const current=preferred||filter.value||"cardio";
    filter.innerHTML='<option value="cardio">有氧</option>'+cats.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join("");
    filter.value=[...filter.options].some(o=>o.value===current)?current:"cardio";
  }

  function applyPickerLayout(category){
    const groupWrap=$("trainingGroupWrap"),select=$("trainingExercise"),cardio=$("trainingCardio");
    const selectWrap=select?.parentElement,cardioWrap=cardio?.parentElement;
    const cardioMode=category==="cardio";
    if(groupWrap)groupWrap.className=cardioMode?"c6":"c4";
    if(selectWrap){
      selectWrap.style.display=cardioMode?"none":"block";
      selectWrap.className=cardioMode?"c6":"c8";
    }
    if(cardioWrap&&cardioMode)cardioWrap.className="c6";
  }

  function populateExercises(category,preferred="",dispatch=true){
    const select=$("trainingExercise");if(!select)return;
    changingPicker=true;
    if(category==="cardio"){
      select.innerHTML='<option value="">仅记录有氧</option>';
      select.value="";
    }else{
      const items=(getDB().exercises||[])
        .filter(x=>categoryOfExercise(x)===category)
        .sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-CN"));
      select.innerHTML=items.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
      if(preferred&&items.some(x=>x.id===preferred))select.value=preferred;
      else if(items[0])select.value=items[0].id;
    }
    if(dispatch)select.dispatchEvent(new Event("change",{bubbles:true}));
    applyPickerLayout(category);
    changingPicker=false;
  }

  function syncPickerFromCurrent(){
    const select=$("trainingExercise"),filter=$("trainingGroupFilter");if(!select||!filter)return;
    const current=select.value,db=getDB();
    let category="cardio";
    if(current){
      const ex=(db.exercises||[]).find(x=>x.id===current);
      category=categoryOfExercise(ex);
    }
    ensurePickerCategories(category);
    filter.value=category;
    populateExercises(category,current,false);
  }

  function setupTrainingPicker(){
    const select=$("trainingExercise");if(!select)return;
    const row=select.closest(".row"),selectWrap=select.parentElement;
    if(!row||!selectWrap)return;

    let wrap=$("trainingGroupWrap");
    if(!wrap){
      wrap=document.createElement("div");
      wrap.id="trainingGroupWrap";
      wrap.className="c4";
      wrap.innerHTML='<label for="trainingGroupFilter">分类</label><select id="trainingGroupFilter"></select>';
      row.insertBefore(wrap,selectWrap);
      $("trainingGroupFilter").addEventListener("change",e=>populateExercises(e.target.value,"",true));
    }
    ensurePickerCategories();

    if(!select.dataset.categorySync){
      select.dataset.categorySync="1";
      select.addEventListener("change",()=>{
        if(changingPicker)return;
        const ex=(getDB().exercises||[]).find(x=>x.id===select.value);
        if(ex){
          const category=categoryOfExercise(ex);
          const filter=$("trainingGroupFilter");
          ensurePickerCategories(category);
          if(filter)filter.value=category;
          applyPickerLayout(category);
        }
      });
    }

    const modal=$("trainingModal");
    if(modal&&!modal.dataset.categoryObserved){
      modal.dataset.categoryObserved="1";
      new MutationObserver(()=>{
        if(modal.classList.contains("open"))setTimeout(syncPickerFromCurrent,0);
      }).observe(modal,{attributes:true,attributeFilter:["class"]});
    }
    syncPickerFromCurrent();
  }

  function ensureLibraryTools(){
    const box=$("exerciseList");if(!box)return null;
    let tools=$("exerciseLibraryTools");
    if(!tools){
      tools=document.createElement("div");
      tools.id="exerciseLibraryTools";
      tools.className="exercise-library-tools";
      tools.innerHTML='<div id="exerciseSourceBar" class="exercise-source-bar"></div><input id="exerciseLibrarySearch" class="exercise-library-search" type="search" placeholder="搜索动作 / 器械 / 别名…"><div id="exerciseSceneBar" class="exercise-scene-bar"></div><div id="exerciseCategoryBar" class="exercise-category-bar"></div><div id="exerciseLibraryCount" class="exercise-library-count"></div>';
      box.parentElement?.insertBefore(tools,box);
      $("exerciseLibrarySearch")?.addEventListener("input",e=>{librarySearch=String(e.target.value||"").trim().toLocaleLowerCase();organizeLibrary()});
    }
    return tools;
  }

  function renderSourceBar(){
    ensureLibraryTools();
    const bar=$("exerciseSourceBar");if(!bar)return;
    const defs=[["all","全部"],["builtin","内置动作"],["custom","我的动作"]];
    bar.innerHTML=defs.map(([id,label])=>`<button class="exercise-source-chip ${activeLibrarySource===id?"active":""}" data-ex-source="${id}">${label}</button>`).join("");
    bar.querySelectorAll("[data-ex-source]").forEach(btn=>btn.addEventListener("click",()=>{
      activeLibrarySource=btn.dataset.exSource;
      renderSourceBar();
      organizeLibrary();
    }));
  }

  function renderSceneBar(){
    ensureLibraryTools();
    const bar=$("exerciseSceneBar");if(!bar)return;
    const scenes=availableScenes();
    if(activeLibraryScene!=="all"&&!scenes.some(x=>x.id===activeLibraryScene))activeLibraryScene="all";
    bar.innerHTML=`<button class="exercise-scene-chip ${activeLibraryScene==="all"?"active":""}" data-ex-scene="all">全部场景</button>`+
      scenes.map(x=>`<button class="exercise-scene-chip ${activeLibraryScene===x.id?"active":""}" data-ex-scene="${esc(x.id)}">${esc(x.label)}</button>`).join("");
    bar.querySelectorAll("[data-ex-scene]").forEach(btn=>btn.addEventListener("click",()=>{
      activeLibraryScene=btn.dataset.exScene;
      renderSceneBar();
      organizeLibrary();
    }));
  }

  function renderLibraryBar(){
    ensureLibraryTools();
    const bar=$("exerciseCategoryBar");if(!bar)return;
    const cats=availableCategories();
    if(activeLibraryCategory!=="all"&&!cats.some(x=>x.id===activeLibraryCategory))activeLibraryCategory="all";
    bar.innerHTML=`<button class="exercise-category-chip ${activeLibraryCategory==="all"?"active":""}" data-ex-cat="all">全部肌群</button>`+
      cats.map(x=>`<button class="exercise-category-chip ${activeLibraryCategory===x.id?"active":""}" data-ex-cat="${x.id}">${esc(x.label)}</button>`).join("");
    bar.querySelectorAll("[data-ex-cat]").forEach(btn=>btn.addEventListener("click",()=>{
      activeLibraryCategory=btn.dataset.exCat;
      renderLibraryBar();
      organizeLibrary();
    }));
  }

  function organizeLibrary(){
    const box=$("exerciseList");if(!box)return;
    ensureLibraryTools();
    box.querySelectorAll(".exercise-library-heading").forEach(x=>x.remove());
    const db=getDB(),byId=new Map((db.exercises||[]).map(ex=>[ex.id,ex]));
    const items=[...box.children].filter(x=>x.classList?.contains("item"));
    let lastHeading="",visibleCount=0;
    const groupMode=activeLibraryScene==="all"?"scene":(activeLibraryCategory==="all"?"category":"none");

    items.forEach(item=>{
      const ex=byId.get(item.dataset.exerciseId)||{};
      const category=categoryOfExercise(ex);
      const scenes=ex.scenes?.length?ex.scenes:["other"];
      const sceneMatch=activeLibraryScene==="all"||scenes.includes(activeLibraryScene);
      const categoryMatch=activeLibraryCategory==="all"||activeLibraryCategory===category;
      const searchText=String(item.dataset.exerciseSearch||[ex.name,ex.group,ex.equipment,...(ex.aliases||[])].filter(Boolean).join(" ")).toLocaleLowerCase();
      const searchMatch=!librarySearch||searchText.includes(librarySearch);
      const source=item.dataset.exerciseSource||"custom";
      const sourceMatch=activeLibrarySource==="all"||activeLibrarySource===source;
      const visible=sceneMatch&&categoryMatch&&searchMatch&&sourceMatch;
      item.style.display=visible?"grid":"none";
      if(!visible)return;
      visibleCount++;

      let headingKey="",headingText="";
      if(groupMode==="scene"){
        headingKey=sceneOf(ex);headingText=sceneLabel(headingKey);
      }else if(groupMode==="category"){
        headingKey=category;headingText=labelOf(category);
      }
      if(headingKey&&headingKey!==lastHeading){
        const heading=document.createElement("div");
        heading.className="exercise-library-heading";
        heading.textContent=headingText;
        box.insertBefore(heading,item);
        lastHeading=headingKey;
      }
    });

    const count=$("exerciseLibraryCount");
    if(count)count.textContent=`显示 ${visibleCount} / ${items.length} 个动作`;
  }

  function refreshCategories(){
    setupTrainingPicker();
    ensureLibraryTools();
    renderSourceBar();
    renderSceneBar();
    renderLibraryBar();
    organizeLibrary();
  }

  function setup(){
    if(!window.fitnessApp||!$("trainingExercise"))return setTimeout(setup,80);
    setupStyles();
    refreshCategories();
    window.addEventListener("fitness:changed",()=>setTimeout(refreshCategories,0));
    window.addEventListener("fitness:exercise-changed",()=>setTimeout(refreshCategories,0));
    document.querySelectorAll('[data-page="training"]').forEach(b=>b.addEventListener("click",()=>setTimeout(refreshCategories,0)));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();

(() => {
  const load = () => {
    if (document.querySelector('script[data-set-logger]')) return;
    const s = document.createElement('script');
    s.src = 'set-logger.js?v=55';
    s.dataset.setLogger = '1';
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(load,0);
  else window.addEventListener('load',load,{once:true});
})();