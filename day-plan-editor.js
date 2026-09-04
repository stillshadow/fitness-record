(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let sourceExerciseId = "";
  let scheduled = false;

  const CATEGORIES = [
    {id:"chest",label:"胸"},
    {id:"back",label:"背"},
    {id:"shoulder",label:"肩"},
    {id:"biceps",label:"二头"},
    {id:"triceps",label:"三头"},
    {id:"legs",label:"腿 / 臀"},
    {id:"calves",label:"小腿"},
    {id:"core",label:"腹 / 核心"},
    {id:"other",label:"其他"}
  ];

  const todayString = () => {
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const activeDate = () => {
    const t=$("activeDateLabel")?.textContent.trim()||"";
    return /^\d{4}-\d{2}-\d{2}$/.test(t)?t:todayString();
  };
  const getDB = () => window.fitnessApp?.getDB?.() || {exercises:[],plans:[],days:{}};
  const putDB = db => {
    window.fitnessApp.replaceDB(db);
    window.dispatchEvent(new CustomEvent("fitness:changed"));
  };
  const toast = msg => {
    const t=$("toast");if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  };

  function categoryOfGroup(group){
    const g=String(group||"");
    if(g.startsWith("胸"))return "chest";
    if(g.startsWith("背"))return "back";
    if(g.startsWith("肩"))return "shoulder";
    if(g.startsWith("二头"))return "biceps";
    if(g.startsWith("三头"))return "triceps";
    if(/^(股四头|腘绳肌|臀|大腿内侧)/.test(g))return "legs";
    if(g.startsWith("小腿"))return "calves";
    if(/腹|核心/.test(g))return "core";
    return "other";
  }

  function planKey(day){
    return day?.planId ? `id:${day.planId}` : `name:${day?.planName||""}`;
  }

  function planForDay(day,db){
    return (db.plans||[]).find(p=>p.id===day?.planId) || (db.plans||[]).find(p=>p.name===day?.planName) || null;
  }

  function activeOverrides(day){
    const ov=day?.planOverrides;
    if(!ov || ov.planKey!==planKey(day))return null;
    const mapped=Object.keys(ov.prescriptions||{});
    if(mapped.length && !mapped.some(id=>(day.planExerciseIds||[]).includes(id)))return null;
    return ov;
  }

  function prescriptionFor(day,exerciseId,db){
    const ov=activeOverrides(day);
    if(ov?.prescriptions?.[exerciseId])return ov.prescriptions[exerciseId];
    return planForDay(day,db)?.prescriptions?.[exerciseId] || "";
  }

  function ensureOverrideStore(day){
    const key=planKey(day), current=activeOverrides(day);
    if(current)return current;
    day.planOverrides={planKey:key,prescriptions:{}};
    return day.planOverrides;
  }

  function setupStyles(){
    if($("dayPlanEditorStyle"))return;
    const style=document.createElement("style");
    style.id="dayPlanEditorStyle";
    style.textContent=`
      .day-plan-actions{display:flex;gap:7px;align-items:center;flex-wrap:nowrap}
      .day-plan-actions .btn{white-space:nowrap;padding:8px 11px;min-width:auto}
      #replacePlanExerciseModal .sheet-panel{max-height:min(78vh,620px);overflow:auto}
      #replacePlanExerciseModal .row>div{min-width:0}
      #replacePlanExerciseModal select{width:100%;min-width:0;max-width:100%;box-sizing:border-box}
      @media(max-width:430px){.day-plan-actions .btn{padding:7px 9px}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal(){
    let modal=$("replacePlanExerciseModal");
    if(modal)return modal;
    modal=document.createElement("div");
    modal.id="replacePlanExerciseModal";
    modal.className="sheet";
    modal.innerHTML=`
      <div class="sheet-panel">
        <div class="section"><h2 id="replacePlanTitle">替换动作</h2><button type="button" class="btn ghost" id="closeReplacePlanBtn">关闭</button></div>
        <div class="row">
          <div class="c6"><label for="replacePlanCategory">分类</label><select id="replacePlanCategory"></select></div>
          <div class="c6"><label for="replacePlanExercise">动作</label><select id="replacePlanExercise"></select></div>
        </div>
        <div class="toolbar"><button type="button" class="btn" id="confirmReplacePlanBtn">替换</button></div>
      </div>`;
    document.body.appendChild(modal);
    $("closeReplacePlanBtn").addEventListener("click",closeModal);
    $("replacePlanCategory").addEventListener("change",populateReplacementExercises);
    $("confirmReplacePlanBtn").addEventListener("click",confirmReplacement);
    modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
    return modal;
  }

  function categoryOptions(preferred){
    const db=getDB();
    const present=new Set((db.exercises||[]).map(x=>categoryOfGroup(x.group)));
    const cats=CATEGORIES.filter(x=>present.has(x.id));
    const select=$("replacePlanCategory");
    select.innerHTML=cats.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join("");
    select.value=cats.some(x=>x.id===preferred)?preferred:(cats[0]?.id||"other");
  }

  function populateReplacementExercises(){
    const category=$("replacePlanCategory")?.value||"other";
    const select=$("replacePlanExercise");if(!select)return;
    const db=getDB(),day=db.days?.[activeDate()];
    const used=new Set((day?.planExerciseIds||[]).filter(id=>id!==sourceExerciseId));
    const items=(db.exercises||[])
      .filter(x=>categoryOfGroup(x.group)===category && !used.has(x.id) && x.id!==sourceExerciseId)
      .sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-CN"));
    select.innerHTML=items.length
      ? items.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")
      : '<option value="">这个分类没有其它可替换动作</option>';
    $("confirmReplacePlanBtn").disabled=!items.length;
  }

  function openReplacement(exerciseId){
    const db=getDB(),day=db.days?.[activeDate()];
    if(!day || !(day.planExerciseIds||[]).includes(exerciseId))return;
    sourceExerciseId=exerciseId;
    const ex=(db.exercises||[]).find(x=>x.id===exerciseId);
    ensureModal();
    $("replacePlanTitle").textContent=ex?.name?`替换「${ex.name}」`:"替换动作";
    categoryOptions(categoryOfGroup(ex?.group));
    populateReplacementExercises();
    $("replacePlanExerciseModal").classList.add("open");
  }

  function closeModal(){
    $("replacePlanExerciseModal")?.classList.remove("open");
    sourceExerciseId="";
  }

  function confirmReplacement(){
    const newId=$("replacePlanExercise")?.value||"";
    if(!sourceExerciseId||!newId)return;
    const db=getDB(),day=db.days?.[activeDate()];if(!day)return;
    const ids=[...(day.planExerciseIds||[])],idx=ids.indexOf(sourceExerciseId);
    if(idx<0)return closeModal();
    if(ids.includes(newId))return toast("今天的计划里已经有这个动作");

    const oldRx=prescriptionFor(day,sourceExerciseId,db);
    const ov=ensureOverrideStore(day);
    delete ov.prescriptions[sourceExerciseId];
    if(oldRx)ov.prescriptions[newId]=oldRx;
    ids[idx]=newId;
    day.planExerciseIds=ids;
    db.meta=db.meta||{};
    db.meta.updatedAt=new Date().toISOString();
    db.meta.userTouched=true;
    sourceExerciseId="";
    putDB(db);
    $("replacePlanExerciseModal")?.classList.remove("open");
    toast("今天的动作已替换");
  }

  function decorateCards(){
    scheduled=false;
    const box=$("todayTrainingList");if(!box)return;
    const db=getDB(),day=db.days?.[activeDate()];if(!day)return;
    const ov=activeOverrides(day);

    box.querySelectorAll("[data-record-ex]").forEach(recordBtn=>{
      const card=recordBtn.closest(".item");if(!card)return;
      const id=recordBtn.dataset.recordEx;
      if(ov?.prescriptions?.[id]){
        const sub=card.querySelector(".item-sub");
        if(sub)sub.textContent=ov.prescriptions[id];
      }
      if(card.dataset.dayPlanReplaceReady)return;
      const actions=document.createElement("div");
      actions.className="item-actions day-plan-actions";
      recordBtn.parentElement?.insertBefore(actions,recordBtn);
      actions.appendChild(recordBtn);
      const replace=document.createElement("button");
      replace.type="button";
      replace.className="btn ghost";
      replace.textContent="替换";
      replace.dataset.replacePlanEx=id;
      replace.addEventListener("click",()=>openReplacement(id));
      actions.insertBefore(replace,recordBtn);
      card.dataset.dayPlanReplaceReady="1";
    });
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(decorateCards);
  }

  function setup(){
    const box=$("todayTrainingList");
    if(!window.fitnessApp||!box)return setTimeout(setup,80);
    setupStyles();ensureModal();
    new MutationObserver(schedule).observe(box,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",schedule);
    decorateCards();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();