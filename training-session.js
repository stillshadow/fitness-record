(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const SESSION_KEY = "chibianyingActiveTrainingSessionV1";
  let session = null;
  let pickerCallback = null;

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

  function saveSession(){
    if(!session){localStorage.removeItem(SESSION_KEY);return}
    localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  }
  function restoreSession(){
    try{
      const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
      if(raw?.date===activeDate()&&Array.isArray(raw.exerciseIds)&&raw.exerciseIds.length){
        session=raw;
        session.index=Math.max(0,Math.min(+session.index||0,session.exerciseIds.length-1));
      }else session=null;
    }catch(e){session=null}
  }

  function categoryOf(group){
    const g=String(group||"");
    if(g.startsWith("胸"))return "胸";
    if(g.startsWith("背"))return "背";
    if(g.startsWith("肩"))return "肩";
    if(g.startsWith("二头"))return "二头";
    if(g.startsWith("三头"))return "三头";
    if(/^(股四头|腘绳肌|臀|大腿内侧)/.test(g))return "腿 / 臀";
    if(g.startsWith("小腿"))return "小腿";
    if(/腹|核心/.test(g))return "腹 / 核心";
    return "其他";
  }

  function ensureStartModal(){
    if($("startTrainingModal"))return;
    const modal=document.createElement("div");
    modal.className="modal";modal.id="startTrainingModal";
    modal.innerHTML=`
      <div class="modal-panel training-start-panel">
        <div class="section"><h2>开始训练</h2><button class="btn ghost" data-close-start>关闭</button></div>
        <div class="meta" style="margin-bottom:10px">选择模板，或直接从一个动作开始。</div>
        <div id="startTrainingPlans" class="training-start-list"></div>
        <button type="button" class="training-free-choice" id="startFreeTrainingBtn">
          <span><b>自由训练</b><small>自己选择动作，做完后再选下一个</small></span><span>›</span>
        </button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-start]").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    $("startFreeTrainingBtn").addEventListener("click",()=>{
      modal.classList.remove("open");
      openExercisePicker(exerciseId=>startFreeSession(exerciseId),"选择第一个动作");
    });
  }

  function renderStartPlans(){
    ensureStartModal();
    const box=$("startTrainingPlans"),db=getDB();if(!box)return;
    const plans=db.plans||[];
    box.innerHTML=plans.length?plans.map(p=>`
      <button type="button" class="training-plan-choice" data-session-plan="${esc(p.id)}">
        <span><b>${esc(p.name)}</b><small>${(p.exerciseIds||[]).length} 个动作</small></span><span>开始</span>
      </button>`).join(""):'<div class="empty">还没有训练模板，可以先用自由训练。</div>';
    box.querySelectorAll("[data-session-plan]").forEach(btn=>btn.addEventListener("click",()=>startTrainingFromPlan(btn.dataset.sessionPlan)));
  }

  function openStartModal(){
    renderStartPlans();
    $("startTrainingModal")?.classList.add("open");
  }

  function ensureExercisePicker(){
    if($("sessionExercisePicker"))return;
    const modal=document.createElement("div");
    modal.className="modal";modal.id="sessionExercisePicker";
    modal.innerHTML=`
      <div class="modal-panel">
        <div class="section"><h2 id="sessionExercisePickerTitle">选择动作</h2><button class="btn ghost" data-close-picker>关闭</button></div>
        <label for="sessionExerciseGroup">分类</label><select id="sessionExerciseGroup"></select>
        <label for="sessionExerciseSelect" style="margin-top:10px">动作</label><select id="sessionExerciseSelect"></select>
        <div class="modal-actions"><button class="btn" id="sessionExerciseConfirm">选择</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-picker]").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    $("sessionExerciseGroup").addEventListener("change",renderPickerExercises);
    $("sessionExerciseConfirm").addEventListener("click",()=>{
      const id=$("sessionExerciseSelect")?.value;if(!id)return toast("请选择动作");
      modal.classList.remove("open");
      const cb=pickerCallback;pickerCallback=null;cb?.(id);
    });
  }

  function renderPickerGroups(){
    const db=getDB(),groups=[];
    (db.exercises||[]).forEach(ex=>{const g=categoryOf(ex.group);if(!groups.includes(g))groups.push(g)});
    const select=$("sessionExerciseGroup");if(!select)return;
    select.innerHTML=groups.map(g=>`<option>${esc(g)}</option>`).join("");
    renderPickerExercises();
  }
  function renderPickerExercises(){
    const db=getDB(),group=$("sessionExerciseGroup")?.value||"";
    const items=(db.exercises||[]).filter(ex=>categoryOf(ex.group)===group).sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-CN"));
    const select=$("sessionExerciseSelect");if(!select)return;
    select.innerHTML=items.map(ex=>`<option value="${esc(ex.id)}">${esc(ex.name)}</option>`).join("");
  }
  function openExercisePicker(callback,title="选择动作"){
    ensureExercisePicker();
    pickerCallback=callback;
    $("sessionExercisePickerTitle").textContent=title;
    renderPickerGroups();
    $("sessionExercisePicker")?.classList.add("open");
  }

  function ensureSessionShell(){
    if($("trainingSessionShell"))return;
    const shell=document.createElement("div");
    shell.id="trainingSessionShell";shell.className="training-session-shell";
    shell.innerHTML=`
      <div class="training-session-topbar">
        <div><span class="training-session-kicker">训练中</span><strong id="sessionName"></strong></div>
        <button type="button" class="btn ghost" id="minimizeTrainingSession">收起</button>
      </div>
      <div class="training-session-content">
        <div class="training-session-progress"><span id="sessionProgress"></span><span id="sessionRecorded"></span></div>
        <div class="training-session-exercise">
          <div class="training-session-group" id="sessionGroup"></div>
          <h1 id="sessionExerciseName"></h1>
          <div class="training-session-prescription" id="sessionPrescription"></div>
          <div class="training-session-next" id="sessionNext"></div>
        </div>
        <button type="button" class="training-session-record" id="recordSessionExercise">记录本动作</button>
        <div class="training-session-actions">
          <button type="button" class="btn soft" id="nextSessionExercise">下一动作</button>
          <button type="button" class="btn ghost" id="finishTrainingSession">结束训练</button>
        </div>
      </div>`;
    document.body.appendChild(shell);
    $("minimizeTrainingSession").addEventListener("click",()=>shell.classList.remove("open"));
    $("recordSessionExercise").addEventListener("click",recordCurrentExercise);
    $("nextSessionExercise").addEventListener("click",nextExercise);
    $("finishTrainingSession").addEventListener("click",openFinishModal);
  }

  function ensureFinishModal(){
    if($("finishTrainingModal"))return;
    const modal=document.createElement("div");modal.className="modal";modal.id="finishTrainingModal";
    modal.innerHTML=`
      <div class="modal-panel">
        <div class="section"><h2>结束训练</h2><button class="btn ghost" data-close-finish>返回</button></div>
        <div class="meta" style="margin-bottom:10px">如果这次做了有氧，顺手记下时间；没有就留空。</div>
        <label for="finishCardioMinutes">有氧分钟（可选）</label>
        <input id="finishCardioMinutes" type="number" min="0" step="1" inputmode="numeric" placeholder="例如 20">
        <div class="modal-actions"><button class="btn" id="confirmFinishTraining">结束并保存</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-finish]").addEventListener("click",()=>modal.classList.remove("open"));
    $("confirmFinishTraining").addEventListener("click",finishTraining);
  }

  function prescriptionFor(id){
    const db=getDB();
    if(!session?.planId)return "";
    const plan=(db.plans||[]).find(p=>p.id===session.planId);
    return plan?.prescriptions?.[id]||"";
  }

  function renderSession(){
    ensureSessionShell();
    if(!session||!session.exerciseIds?.length)return;
    const db=getDB(),id=session.exerciseIds[session.index],ex=(db.exercises||[]).find(x=>x.id===id);
    if(!ex)return;
    const day=db.days?.[session.date],rows=(day?.training||[]).filter(x=>x.exerciseId===id);
    $("sessionName").textContent=session.name||"训练";
    $("sessionProgress").textContent=session.mode==="plan"?`${session.index+1} / ${session.exerciseIds.length}`:`第 ${session.index+1} 个动作`;
    $("sessionRecorded").textContent=rows.length?`已记录 ${rows.length} 组`:"未记录";
    $("sessionGroup").textContent=ex.group||"";
    $("sessionExerciseName").textContent=ex.name||"动作";
    const rx=prescriptionFor(id);
    $("sessionPrescription").textContent=rx?`计划 ${rx}`:"按状态完成";
    if(session.mode==="plan"&&session.index<session.exerciseIds.length-1){
      const next=(db.exercises||[]).find(x=>x.id===session.exerciseIds[session.index+1]);
      $("sessionNext").textContent=next?`下一个 · ${next.name}`:"";
      $("nextSessionExercise").textContent="下一动作";
    }else if(session.mode==="free"){
      $("sessionNext").textContent="做完后再选择下一个动作";
      $("nextSessionExercise").textContent="选择下一动作";
    }else{
      $("sessionNext").textContent="这是模板最后一个动作";
      $("nextSessionExercise").textContent="完成训练";
    }
    $("recordSessionExercise").textContent=rows.length?"编辑 / 追加本动作":"记录本动作";
    updateHomeTrainingAction();
  }

  function openSession(){
    if(!session)return openStartModal();
    renderSession();
    $("trainingSessionShell")?.classList.add("open");
  }

  function recordCurrentExercise(){
    if(!session)return;
    const id=session.exerciseIds[session.index],day=getDB().days?.[session.date];
    const has=(day?.training||[]).some(x=>x.exerciseId===id);
    if(has&&typeof window.editTrainingExerciseSets==="function")window.editTrainingExerciseSets(id);
    else window.openTrainingModal?.(id);
  }

  function nextExercise(){
    if(!session)return;
    if(session.mode==="free"){
      openExercisePicker(id=>{
        session.exerciseIds.push(id);
        session.index=session.exerciseIds.length-1;
        saveSession();renderSession();openSession();
      },"选择下一动作");
      return;
    }
    if(session.index<session.exerciseIds.length-1){
      session.index++;
      saveSession();renderSession();
    }else openFinishModal();
  }

  function openFinishModal(){
    ensureFinishModal();
    const existing=+getDB().days?.[session?.date]?.cardio||0;
    $("finishCardioMinutes").value=existing||"";
    $("finishTrainingModal")?.classList.add("open");
  }

  function finishTraining(){
    if(!session)return;
    const minutes=Math.max(0,+$("finishCardioMinutes")?.value||0);
    const db=getDB(),date=session.date;
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    db.days[date].cardio=minutes;
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
    session=null;saveSession();
    $("finishTrainingModal")?.classList.remove("open");
    $("trainingSessionShell")?.classList.remove("open");
    updateHomeTrainingAction();
    toast(minutes?`训练完成 · 有氧 ${minutes}min`:"训练完成");
  }

  function startTrainingFromPlan(planId){
    const db=getDB(),plan=(db.plans||[]).find(p=>p.id===planId);if(!plan)return;
    const ids=[...(plan.exerciseIds||[]),...(plan.finisherIds||[])].filter(Boolean);
    if(!ids.length)return toast("这个模板还没有动作");
    if(typeof window.loadTrainingPlanToDay==="function")window.loadTrainingPlanToDay(planId);
    session={date:activeDate(),mode:"plan",planId:plan.id,name:plan.name,exerciseIds:ids,index:0};
    saveSession();
    $("startTrainingModal")?.classList.remove("open");
    openSession();
  }

  function startFreeSession(exerciseId){
    const db=getDB(),ex=(db.exercises||[]).find(x=>x.id===exerciseId);if(!ex)return;
    session={date:activeDate(),mode:"free",planId:"",name:"自由训练",exerciseIds:[exerciseId],index:0};
    saveSession();openSession();
  }

  function updateHomeTrainingAction(){
    const btn=$("homeStartTrainingBtn");if(!btn)return;
    btn.textContent=session?.date===activeDate()?"继续训练":"开始训练";
  }

  function addHomeActions(){
    const weight=$("todayWeight")?.closest(".summary-item");
    if(weight&&!weight.dataset.directWeight){
      weight.dataset.directWeight="1";weight.classList.add("direct-record-target");
      weight.setAttribute("role","button");weight.setAttribute("tabindex","0");
      const open=()=>$("quickWeight")?.click();
      weight.addEventListener("click",open);
      weight.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    }

    const trainingSection=$("todayTrainingList")?.closest(".card")?.querySelector(".section");
    if(trainingSection&&!$("homeStartTrainingBtn")){
      const btn=document.createElement("button");btn.id="homeStartTrainingBtn";btn.className="btn";btn.textContent="开始训练";
      btn.addEventListener("click",()=>session?.date===activeDate()?openSession():openStartModal());
      trainingSection.appendChild(btn);
    }

    const foodSection=$("todayFoodList")?.closest(".card")?.querySelector(".section");
    if(foodSection&&!$("homeAddFoodBtn")){
      const btn=document.createElement("button");btn.id="homeAddFoodBtn";btn.className="btn soft";btn.textContent="记录食物";
      btn.addEventListener("click",()=>$("quickFood")?.click());
      foodSection.appendChild(btn);
    }
    updateHomeTrainingAction();
  }

  function simplifyTrainingPage(){
    $("trainingGuidanceCard")?.remove();
    const exerciseCard=$("exerciseList")?.closest(".card");
    if(exerciseCard)exerciseCard.style.display="none";

    const planCard=$("planList")?.closest(".card"),planSection=planCard?.querySelector(".section");
    const addExercise=$("newExerciseBtn"),newPlan=$("newPlanBtn");
    if(planSection&&addExercise&&!$("trainingHeaderActions")){
      const actions=document.createElement("div");actions.id="trainingHeaderActions";actions.className="training-header-actions";
      if(newPlan)actions.appendChild(newPlan);
      addExercise.textContent="＋ 动作";
      actions.appendChild(addExercise);
      planSection.appendChild(actions);
    }
    const planMeta=planCard?.querySelector(":scope > .meta");if(planMeta)planMeta.style.display="none";
    const strengthCard=$("strengthList")?.closest(".card");
    const strengthMeta=strengthCard?.querySelector(".section .meta");if(strengthMeta)strengthMeta.style.display="none";
  }

  function setupObservers(){
    window.addEventListener("fitness:changed",()=>requestAnimationFrame(()=>{renderSession();addHomeActions();simplifyTrainingPage()}));
    const dateLabel=$("activeDateLabel");
    if(dateLabel)new MutationObserver(()=>{
      restoreSession();
      updateHomeTrainingAction();
      $("trainingSessionShell")?.classList.remove("open");
    }).observe(dateLabel,{childList:true,subtree:true,characterData:true});
    document.querySelectorAll('[data-page="today"],[data-page="training"]').forEach(btn=>btn.addEventListener("click",()=>setTimeout(()=>{addHomeActions();simplifyTrainingPage()},0)));
  }

  function setup(){
    if(!window.fitnessApp||!$("todayTrainingList")||!$("planList"))return setTimeout(setup,80);
    ensureStartModal();ensureExercisePicker();ensureSessionShell();ensureFinishModal();
    restoreSession();addHomeActions();simplifyTrainingPage();setupObservers();
    window.startTrainingFromPlan=startTrainingFromPlan;
    window.openTrainingStart=openStartModal;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();