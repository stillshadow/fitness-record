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
      @media(max-width:700px){.history-date-nav{grid-template-columns:40px minmax(0,1fr) 40px}.history-arrow,.history-date-button{height:40px}}
    `;
    document.head.appendChild(style);
  }

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
