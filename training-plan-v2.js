(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const PLAN_VERSION = 2;
  let editingPlanId = "";
  let editingPlanRows = [];

  const DEFAULT_PLANS = [
    {
      id:"push",name:"推｜胸 + 中束 + 三头",
      exerciseIds:["bench","incline_machine_press","dip","cable_lateral_raise","overhead_triceps_extension","legraise"],
      finisherIds:[],
      prescriptions:{
        bench:"4 × 6–10",
        incline_machine_press:"3 × 8–12",
        dip:"3 × 8–12 · 前倾",
        cable_lateral_raise:"4 × 12–20",
        overhead_triceps_extension:"3 × 10–15",
        legraise:"3 × 8"
      }
    },
    {
      id:"pull",name:"拉｜背 + 后束 + 二头",
      exerciseIds:["cable_single_pulldown","neutral_pulldown","machine_single_row","seated_row_high_elbow","cable_curl","legraise"],
      finisherIds:[],
      prescriptions:{
        cable_single_pulldown:"3 × 10–12",
        neutral_pulldown:"3 × 8–12",
        machine_single_row:"3 × 8–12",
        seated_row_high_elbow:"3 × 12–15",
        cable_curl:"3 × 10–15",
        legraise:"3 × 8"
      }
    },
    {
      id:"legs",name:"腿｜股四头 + 臀 + 腘绳肌 + 小腿",
      exerciseIds:["barbell_squat","bulgarian_split_squat","rdl","seated_leg_curl","standing_calf_raise","legraise"],
      finisherIds:[],
      prescriptions:{
        barbell_squat:"4 × 6–10",
        bulgarian_split_squat:"3 × 8–12",
        rdl:"3 × 8–12",
        seated_leg_curl:"3 × 10–15",
        standing_calf_raise:"4 × 10–15",
        legraise:"3 × 8"
      }
    }
  ];

  const EXTRA_EXERCISES = [
    {id:"incline_machine_press",name:"上斜器械推胸",group:"胸"},
    {id:"barbell_squat",name:"杠铃深蹲",group:"股四头/臀"}
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

  function migratePlan(){
    const db=getDB();
    db.meta=db.meta||{};
    let changed=false;
    if((+db.meta.personalTrainingPlanVersion||0)<PLAN_VERSION){
      db.exercises=Array.isArray(db.exercises)?db.exercises:[];
      EXTRA_EXERCISES.forEach(ex=>{
        const i=db.exercises.findIndex(x=>x.id===ex.id);
        if(i<0)db.exercises.push(clone(ex));
        else db.exercises[i]={...db.exercises[i],...clone(ex)};
      });
      const reserved=new Set(DEFAULT_PLANS.map(x=>x.id));
      const custom=(db.plans||[]).filter(p=>!reserved.has(p.id));
      db.plans=[...DEFAULT_PLANS.map(clone),...custom];
      db.meta.personalTrainingPlanVersion=PLAN_VERSION;
      changed=true;
    }

    // 兼容旧版“收尾动作”，仅移除特殊身份，不改变动作顺序或计划内容。
    (db.plans||[]).forEach(plan=>{
      if(!(plan.finisherIds||[]).length)return;
      const merged=[],seen=new Set();
      [...(plan.exerciseIds||[]),...(plan.finisherIds||[])].forEach(id=>{if(id&&!seen.has(id)){seen.add(id);merged.push(id)}});
      plan.exerciseIds=merged;
      plan.finisherIds=[];
      changed=true;
    });

    if(changed){
      db.meta.updatedAt=new Date().toISOString();
      putDB(db);
    }
    return changed;
  }

  function loadPlanToDay(plan){
    const db=getDB(),current=(db.plans||[]).find(x=>x.id===plan.id)||plan;
    const date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];
    day.planId=current.id;
    day.planName=current.name;
    day.planExerciseIds=clone(current.exerciseIds||[]);
    delete day.planMainExerciseIds;
    delete day.planFinisherIds;
    delete day.planOverrides;
    db.meta=db.meta||{};
    db.meta.updatedAt=new Date().toISOString();
    db.meta.userTouched=true;
    putDB(db);
    window.renderTodayTraining?.(day);
    return day;
  }

  function hookPlanLoading(){
    const box=$("planList");if(!box||box.dataset.personalPlanLoader)return;
    box.dataset.personalPlanLoader="1";
    box.addEventListener("click",e=>{
      const btn=e.target.closest?.("[data-load-plan]");if(!btn)return;
      const plan=(getDB().plans||[]).find(x=>x.id===btn.dataset.loadPlan);
      if(!plan)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof window.startTrainingFromPlan==="function")window.startTrainingFromPlan(plan.id);
      else{
        loadPlanToDay(plan);
        toast(`已载入 ${plan.name}`);
      }
    },true);
  }

  function decoratePlanCards(){
    const box=$("planList");if(!box)return;
    const db=getDB();
    box.querySelectorAll("[data-load-plan]").forEach(btn=>{
      const card=btn.closest(".item"),plan=(db.plans||[]).find(x=>x.id===btn.dataset.loadPlan);
      if(!card||!plan)return;
      btn.textContent="开始";
      const sub=card.querySelector(".item-sub");
      if(sub){
        const count=(plan.exerciseIds||[]).length;
        sub.textContent=`${count} 个动作`;
      }
    });
  }

  function ensurePlanItemsModal(){
    if($("planItemsModal"))return;
    const modal=document.createElement("div");
    modal.className="modal";modal.id="planItemsModal";
    modal.innerHTML=`
      <div class="modal-panel wide">
        <div class="section"><h2>编辑训练模板</h2><button class="btn ghost" id="closePlanItemsModal">关闭</button></div>
        <label for="planItemsName">模板名称</label><input id="planItemsName">
        <div class="meta" style="margin:8px 0 10px">动作可以增删，计划文字按需要填写。顺序就是训练顺序。</div>
        <div id="planItemsList" class="list"></div>
        <div class="row" style="margin-top:12px;align-items:end">
          <div class="c8"><label for="planItemsAddSelect">添加动作</label><select id="planItemsAddSelect"></select></div>
          <div class="c4"><button class="btn soft" id="planItemsAddBtn" style="width:100%">＋ 添加</button></div>
        </div>
        <div class="modal-actions"><button class="btn" id="savePlanItemsBtn">保存模板</button></div>
      </div>`;
    document.body.appendChild(modal);
    $("closePlanItemsModal").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    $("planItemsAddBtn").addEventListener("click",addPlanItem);
    $("savePlanItemsBtn").addEventListener("click",savePlanItems);
  }

  function openPlanItemsEditor(planId){
    ensurePlanItemsModal();
    const db=getDB(),plan=(db.plans||[]).find(x=>x.id===planId);if(!plan)return;
    editingPlanId=plan.id;
    const seen=new Set();
    editingPlanRows=[];
    [...(plan.exerciseIds||[]),...(plan.finisherIds||[])].forEach(id=>{
      if(seen.has(id))return;seen.add(id);
      editingPlanRows.push({id,rx:plan.prescriptions?.[id]||""});
    });
    $("planItemsName").value=plan.name||"";
    renderPlanItemsEditor();
    $("planItemsModal").classList.add("open");
  }

  function renderPlanItemsEditor(){
    const db=getDB(),box=$("planItemsList");if(!box)return;
    if(!editingPlanRows.length)box.innerHTML='<div class="empty">模板里还没有动作，可以从下方添加。</div>';
    else box.innerHTML=editingPlanRows.map((row,i)=>{
      const ex=(db.exercises||[]).find(x=>x.id===row.id)||{name:"未知动作",group:"其他"};
      return `<div class="template-plan-row" data-plan-row="${i}">
        <div class="template-plan-head"><div><div class="item-title">${esc(ex.name)}</div><div class="item-sub">${esc(ex.group||"其他")}</div></div><button type="button" class="btn danger" data-remove-plan-item="${i}">删</button></div>
        <div class="template-plan-fields"><div><label>计划</label><input data-plan-rx="${i}" value="${esc(row.rx)}" placeholder="例如 3 × 8–12"></div></div>
      </div>`;
    }).join("");
    box.querySelectorAll("[data-remove-plan-item]").forEach(b=>b.addEventListener("click",()=>{
      editingPlanRows.splice(+b.dataset.removePlanItem,1);renderPlanItemsEditor();
    }));
    box.querySelectorAll("[data-plan-rx]").forEach(input=>input.addEventListener("input",()=>{
      const row=editingPlanRows[+input.dataset.planRx];if(row)row.rx=input.value;
    }));
    refreshPlanAddSelect();
  }

  function refreshPlanAddSelect(){
    const select=$("planItemsAddSelect");if(!select)return;
    const db=getDB(),used=new Set(editingPlanRows.map(x=>x.id));
    const available=(db.exercises||[]).filter(x=>!used.has(x.id));
    select.innerHTML=available.length?available.map(x=>`<option value="${esc(x.id)}">${esc(x.group||"其他")}｜${esc(x.name)}</option>`).join(""):'<option value="">没有可添加动作</option>';
    $("planItemsAddBtn").disabled=!available.length;
  }

  function addPlanItem(){
    const id=$("planItemsAddSelect")?.value;if(!id)return;
    editingPlanRows.push({id,rx:""});
    renderPlanItemsEditor();
  }

  function savePlanItems(){
    const name=$("planItemsName")?.value.trim()||"";
    if(!name)return toast("填写模板名称");
    if(!editingPlanRows.length)return toast("模板至少保留一个动作");
    const db=getDB(),plan=(db.plans||[]).find(x=>x.id===editingPlanId);if(!plan)return;
    plan.name=name;
    plan.exerciseIds=editingPlanRows.map(x=>x.id);
    plan.finisherIds=[];
    plan.prescriptions={};
    editingPlanRows.forEach(x=>{const rx=String(x.rx||"").trim();if(rx)plan.prescriptions[x.id]=rx});
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
    $("planItemsModal")?.classList.remove("open");
    window.renderTrainingPage?.();
    toast("模板已保存");
  }

  function hookUnifiedPlanEditing(){
    const box=$("planList");if(!box||box.dataset.unifiedPlanEditing)return;
    box.dataset.unifiedPlanEditing="1";
    box.addEventListener("click",e=>{
      const btn=e.target.closest?.("[data-edit-plan]");if(!btn)return;
      e.preventDefault();e.stopImmediatePropagation();
      openPlanItemsEditor(btn.dataset.editPlan);
    },true);
  }

  function setupStyles(){
    if($("personalPlanStyle"))return;
    const style=document.createElement("style");style.id="personalPlanStyle";
    style.textContent=`
      .template-plan-row{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel2)}
      .template-plan-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .template-plan-fields{margin-top:9px}
    `;
    document.head.appendChild(style);
  }

  function removeLegacyGuidance(){
    $("trainingGuidanceCard")?.remove();
  }

  function scheduleDecorate(){
    requestAnimationFrame(()=>{decoratePlanCards();removeLegacyGuidance()});
  }

  function setup(){
    if(!window.fitnessApp||!$("planList"))return setTimeout(setup,80);
    setupStyles();
    migratePlan();
    hookPlanLoading();
    hookUnifiedPlanEditing();
    ensurePlanItemsModal();
    removeLegacyGuidance();
    decoratePlanCards();
    window.loadTrainingPlanToDay=planId=>{
      const plan=(getDB().plans||[]).find(x=>x.id===planId);if(!plan)return null;
      return loadPlanToDay(plan);
    };
    const plans=$("planList");
    new MutationObserver(scheduleDecorate).observe(plans,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",scheduleDecorate);
    document.querySelectorAll('[data-page="training"]').forEach(b=>b.addEventListener("click",()=>setTimeout(scheduleDecorate,0)));
    setTimeout(()=>{window.renderTrainingPage?.();scheduleDecorate()},0);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();