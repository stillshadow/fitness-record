(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
  const PLAN_VERSION = 2;
  let editingPlanId="",editingPlanRows=[];

  const DEFAULT_PLANS=[
    {id:"push",name:"推｜胸 + 中束 + 三头",exerciseIds:["bench","incline_machine_press","dip","cable_lateral_raise","overhead_triceps_extension","legraise"],finisherIds:[],prescriptions:{bench:"4 × 6–10",incline_machine_press:"3 × 8–12",dip:"3 × 8–12 · 前倾",cable_lateral_raise:"4 × 12–20",overhead_triceps_extension:"3 × 10–15",legraise:"3 × 8"}},
    {id:"pull",name:"拉｜背 + 后束 + 二头",exerciseIds:["cable_single_pulldown","neutral_pulldown","machine_single_row","seated_row_high_elbow","cable_curl","legraise"],finisherIds:[],prescriptions:{cable_single_pulldown:"3 × 10–12",neutral_pulldown:"3 × 8–12",machine_single_row:"3 × 8–12",seated_row_high_elbow:"3 × 12–15",cable_curl:"3 × 10–15",legraise:"3 × 8"}},
    {id:"legs",name:"腿｜股四头 + 臀 + 腘绳肌 + 小腿",exerciseIds:["barbell_squat","bulgarian_split_squat","rdl","seated_leg_curl","standing_calf_raise","legraise"],finisherIds:[],prescriptions:{barbell_squat:"4 × 6–10",bulgarian_split_squat:"3 × 8–12",rdl:"3 × 8–12",seated_leg_curl:"3 × 10–15",standing_calf_raise:"4 × 10–15",legraise:"3 × 8"}}
  ];
  const EXTRA_EXERCISES=[{id:"incline_machine_press",name:"上斜器械推胸",group:"胸"},{id:"barbell_squat",name:"杠铃深蹲",group:"股四头/臀"}];
  const getDB=()=>window.fitnessApp?.getDB?.()||{exercises:[],plans:[]};
  const putDB=db=>{window.fitnessApp.replaceDB(db);window.dispatchEvent(new CustomEvent("fitness:changed"))};
  const toast=msg=>{const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800)};

  function migratePlan(){
    const db=getDB();db.meta=db.meta||{};let changed=false;
    if((+db.meta.personalTrainingPlanVersion||0)<PLAN_VERSION){
      db.exercises=Array.isArray(db.exercises)?db.exercises:[];
      EXTRA_EXERCISES.forEach(ex=>{const i=db.exercises.findIndex(x=>x.id===ex.id);if(i<0)db.exercises.push(clone(ex));else db.exercises[i]={...db.exercises[i],...clone(ex)}});
      const reserved=new Set(DEFAULT_PLANS.map(x=>x.id)),custom=(db.plans||[]).filter(p=>!reserved.has(p.id));db.plans=[...DEFAULT_PLANS.map(clone),...custom];db.meta.personalTrainingPlanVersion=PLAN_VERSION;changed=true;
    }
    (db.plans||[]).forEach(plan=>{if(!(plan.finisherIds||[]).length)return;const seen=new Set(),merged=[];[...(plan.exerciseIds||[]),...(plan.finisherIds||[])].forEach(id=>{if(id&&!seen.has(id)){seen.add(id);merged.push(id)}});plan.exerciseIds=merged;plan.finisherIds=[];changed=true});
    if(changed){db.meta.updatedAt=new Date().toISOString();putDB(db)}
  }

  function ensureStyles(){
    if($("personalPlanStyle"))return;const style=document.createElement("style");style.id="personalPlanStyle";
    style.textContent=`#page-training #planList [data-load-plan]{display:none!important}.template-plan-row{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel2)}.template-plan-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.template-plan-fields{margin-top:9px}.template-plan-actions{display:flex;gap:5px;align-items:center}.template-plan-actions .btn{padding:6px 8px}`;document.head.appendChild(style);
  }

  function decoratePlanCards(){
    const box=$("planList");if(!box)return;const db=getDB();
    box.querySelectorAll(".item").forEach(card=>{
      const edit=card.querySelector("[data-edit-plan]"),id=edit?.dataset.editPlan,plan=(db.plans||[]).find(x=>x.id===id);if(!plan)return;
      const load=card.querySelector("[data-load-plan]");if(load){load.style.display="none";load.disabled=true}
      const sub=card.querySelector(".item-sub"),summary=`${(plan.exerciseIds||[]).length} 个动作`;if(sub&&sub.textContent!==summary)sub.textContent=summary;
    });
  }

  function ensurePlanItemsModal(){
    if($("planItemsModal"))return;const modal=document.createElement("div");modal.className="modal";modal.id="planItemsModal";
    modal.innerHTML=`<div class="modal-panel wide"><div class="section"><h2 id="planItemsTitle">编辑训练模板</h2><button class="btn ghost" id="closePlanItemsModal">关闭</button></div><label for="planItemsName">模板名称</label><input id="planItemsName"><div class="meta" style="margin:8px 0 10px">这里只定义常用起始方案。实际训练时可以自由调整。</div><div id="planItemsList" class="list"></div><div class="row" style="margin-top:12px;align-items:end"><div class="c8"><label for="planItemsAddSelect">添加动作</label><select id="planItemsAddSelect"></select></div><div class="c4"><button class="btn soft" id="planItemsAddBtn" style="width:100%">＋ 添加</button></div></div><div class="modal-actions"><button class="btn" id="savePlanItemsBtn">保存模板</button></div></div>`;
    document.body.appendChild(modal);$("closePlanItemsModal").addEventListener("click",()=>modal.classList.remove("open"));modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});$("planItemsAddBtn").addEventListener("click",addPlanItem);$("savePlanItemsBtn").addEventListener("click",savePlanItems);$("planItemsList").addEventListener("click",handleRowAction);
  }

  function openPlanItemsEditor(planId=""){
    ensurePlanItemsModal();const db=getDB(),plan=planId?(db.plans||[]).find(x=>x.id===planId):null;
    editingPlanId=plan?.id||"";editingPlanRows=[];const seen=new Set();
    [...(plan?.exerciseIds||[]),...(plan?.finisherIds||[])].forEach(id=>{if(seen.has(id))return;seen.add(id);editingPlanRows.push({id,rx:plan?.prescriptions?.[id]||""})});
    $("planItemsTitle").textContent=plan?"编辑训练模板":"新建训练模板";$("planItemsName").value=plan?.name||"";renderPlanItemsEditor();$("planItemsModal").classList.add("open");
  }

  function renderPlanItemsEditor(){
    const db=getDB(),box=$("planItemsList");if(!box)return;
    box.innerHTML=editingPlanRows.length?editingPlanRows.map((row,i)=>{const ex=(db.exercises||[]).find(x=>x.id===row.id)||{name:"未知动作",group:"其他"};return `<div class="template-plan-row" data-plan-row="${i}"><div class="template-plan-head"><div><div class="item-title">${esc(ex.name)}</div><div class="item-sub">${esc(ex.group||"其他")}</div></div><div class="template-plan-actions"><button type="button" class="btn ghost" data-move-plan="${i}" data-dir="-1" ${i===0?"disabled":""}>↑</button><button type="button" class="btn ghost" data-move-plan="${i}" data-dir="1" ${i===editingPlanRows.length-1?"disabled":""}>↓</button><button type="button" class="btn danger" data-remove-plan-item="${i}">删</button></div></div><div class="template-plan-fields"><label>计划</label><input data-plan-rx="${i}" value="${esc(row.rx)}" placeholder="例如 3 × 8–12"></div></div>`}).join(""):'<div class="empty">模板里还没有动作。</div>';
    box.querySelectorAll("[data-plan-rx]").forEach(input=>input.addEventListener("input",()=>{const row=editingPlanRows[+input.dataset.planRx];if(row)row.rx=input.value}));refreshPlanAddSelect();
  }

  function handleRowAction(e){
    const remove=e.target.closest?.("[data-remove-plan-item]");if(remove){editingPlanRows.splice(+remove.dataset.removePlanItem,1);return renderPlanItemsEditor()}
    const move=e.target.closest?.("[data-move-plan]");if(move){const i=+move.dataset.movePlan,j=i+(+move.dataset.dir||0);if(j<0||j>=editingPlanRows.length)return;[editingPlanRows[i],editingPlanRows[j]]=[editingPlanRows[j],editingPlanRows[i]];renderPlanItemsEditor()}
  }

  function refreshPlanAddSelect(){
    const select=$("planItemsAddSelect");if(!select)return;const db=getDB(),used=new Set(editingPlanRows.map(x=>x.id)),available=(db.exercises||[]).filter(x=>!used.has(x.id)).sort((a,b)=>String(a.group).localeCompare(String(b.group),"zh-CN")||String(a.name).localeCompare(String(b.name),"zh-CN"));
    select.innerHTML=available.length?available.map(x=>`<option value="${esc(x.id)}">${esc(x.group||"其他")}｜${esc(x.name)}</option>`).join(""):'<option value="">没有可添加动作</option>';$("planItemsAddBtn").disabled=!available.length;
  }
  function addPlanItem(){const id=$("planItemsAddSelect")?.value;if(!id)return;editingPlanRows.push({id,rx:""});renderPlanItemsEditor()}

  function savePlanItems(){
    const name=$("planItemsName")?.value.trim()||"";if(!name)return toast("填写模板名称");if(!editingPlanRows.length)return toast("模板至少保留一个动作");
    const db=getDB();let plan=editingPlanId?(db.plans||[]).find(x=>x.id===editingPlanId):null;
    if(!plan){plan={id:uid("plan"),name:"",exerciseIds:[],finisherIds:[],prescriptions:{}};db.plans=db.plans||[];db.plans.push(plan)}
    plan.name=name;plan.exerciseIds=editingPlanRows.map(x=>x.id);plan.finisherIds=[];plan.prescriptions={};editingPlanRows.forEach(x=>{const rx=String(x.rx||"").trim();if(rx)plan.prescriptions[x.id]=rx});
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;putDB(db);$("planItemsModal")?.classList.remove("open");window.renderTrainingPage?.();toast("模板已保存");
  }

  function hookPlanPage(){
    const box=$("planList");if(box&&!box.dataset.templateManagerV2){box.dataset.templateManagerV2="1";box.addEventListener("click",e=>{const load=e.target.closest?.("[data-load-plan]");if(load){e.preventDefault();e.stopImmediatePropagation();return}const edit=e.target.closest?.("[data-edit-plan]");if(edit){e.preventDefault();e.stopImmediatePropagation();openPlanItemsEditor(edit.dataset.editPlan)}},true)}
    const newBtn=$("newPlanBtn");if(newBtn&&!newBtn.dataset.templateManagerV2){newBtn.dataset.templateManagerV2="1";newBtn.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();openPlanItemsEditor("")},true)}
  }

  function scheduleDecorate(){requestAnimationFrame(()=>{decoratePlanCards();$("trainingGuidanceCard")?.remove()})}
  function setup(){
    if(!window.fitnessApp||!$("planList"))return setTimeout(setup,80);ensureStyles();migratePlan();ensurePlanItemsModal();hookPlanPage();decoratePlanCards();$("trainingGuidanceCard")?.remove();
    new MutationObserver(scheduleDecorate).observe($("planList"),{childList:true,subtree:true});window.addEventListener("fitness:changed",scheduleDecorate);document.querySelectorAll('[data-page="training"]').forEach(b=>b.addEventListener("click",()=>setTimeout(scheduleDecorate,0)));setTimeout(()=>{window.renderTrainingPage?.();scheduleDecorate()},0);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));else setTimeout(setup,0);
})();