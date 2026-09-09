(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const SESSION_KEY = "chibianyingActiveTrainingSessionV1";
  let session = null;
  let pickerCallback = null;
  let pickerExcludeIds = new Set();

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

  function sessionStillValid(raw){
    if(!raw?.date || raw.date!==activeDate() || !Array.isArray(raw.exerciseIds))return false;
    if(raw.mode!=="plan")return raw.exerciseIds.length>0;
    const day=getDB().days?.[raw.date];
    return !!day?.planId && day.planId===raw.planId && raw.exerciseIds.length>0;
  }

  function restoreSession(){
    try{
      const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
      if(sessionStillValid(raw)){
        session=raw;
        session.prescriptions=session.prescriptions||{};
        session.index=Math.max(0,Math.min(+session.index||0,session.exerciseIds.length-1));
      }else{
        session=null;
        localStorage.removeItem(SESSION_KEY);
      }
    }catch(e){session=null;localStorage.removeItem(SESSION_KEY)}
  }

  function cancelSessionForDate(date=activeDate()){
    if(session?.date===date){
      session=null;saveSession();
      $("trainingSessionShell")?.classList.remove("open");
      $("finishTrainingModal")?.classList.remove("open");
    }
    updateHomeTrainingAction();
  }

  function reconcileSessionWithDay(){
    if(!session)return;
    if(session.mode==="plan"){
      const day=getDB().days?.[session.date];
      if(!day?.planId || day.planId!==session.planId)cancelSessionForDate(session.date);
    }
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
        <div class="meta" style="margin-bottom:10px">模板只是起点，训练中可以随时替换、增加或移除动作。</div>
        <div id="startTrainingPlans" class="training-start-list"></div>
        <button type="button" class="training-free-choice" id="startFreeTrainingBtn">
          <span><b>自由训练</b><small>先选一个动作，之后按状态继续加</small></span><span>›</span>
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
      const cb=pickerCallback;pickerCallback=null;pickerExcludeIds=new Set();cb?.(id);
    });
  }

  function pickerItems(){
    const db=getDB(),group=$("sessionExerciseGroup")?.value||"";
    return (db.exercises||[])
      .filter(ex=>categoryOf(ex.group)===group && !pickerExcludeIds.has(ex.id))
      .sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-CN"));
  }

  function renderPickerGroups(){
    const db=getDB(),groups=[];
    (db.exercises||[]).forEach(ex=>{
      if(pickerExcludeIds.has(ex.id))return;
      const g=categoryOf(ex.group);if(!groups.includes(g))groups.push(g);
    });
    const select=$("sessionExerciseGroup");if(!select)return;
    select.innerHTML=groups.map(g=>`<option>${esc(g)}</option>`).join("");
    renderPickerExercises();
  }

  function renderPickerExercises(){
    const select=$("sessionExerciseSelect");if(!select)return;
    const items=pickerItems();
    select.innerHTML=items.length?items.map(ex=>`<option value="${esc(ex.id)}">${esc(ex.name)}</option>`).join(""):'<option value="">这个分类没有可选动作</option>';
    $("sessionExerciseConfirm").disabled=!items.length;
  }

  function openExercisePicker(callback,title="选择动作",excludeIds=[]){
    ensureExercisePicker();
    pickerCallback=callback;
    pickerExcludeIds=new Set(excludeIds||[]);
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
        <div class="training-session-edit-actions">
          <button type="button" class="btn ghost" id="replaceSessionExercise">替换</button>
          <button type="button" class="btn ghost" id="addSessionExercise">＋ 加动作</button>
          <button type="button" class="btn ghost session-remove" id="removeSessionExercise">移除</button>
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
    $("replaceSessionExercise").addEventListener("click",replaceCurrentExercise);
    $("addSessionExercise").addEventListener("click",addExerciseAfterCurrent);
    $("removeSessionExercise").addEventListener("click",removeCurrentExercise);
  }

  function ensureFinishModal(){
    if($("finishTrainingModal"))return;
    const modal=document.createElement("div");modal.className="modal";modal.id="finishTrainingModal";
    modal.innerHTML=`
      <div class="modal-panel">
        <div class="section"><h2>结束训练</h2><button class="btn ghost" data-close-finish>返回</button></div>
        <div class="finish-training-label">本次已记录</div>
        <div id="finishTrainingSummary" class="finish-training-summary"></div>
        <div class="divider"></div>
        <label for="finishCardioMinutes">有氧分钟（没有可留空）</label>
        <input id="finishCardioMinutes" type="number" min="0" step="1" inputmode="numeric" placeholder="例如 20">
        <div class="modal-actions"><button class="btn" id="confirmFinishTraining">确认结束</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-finish]").addEventListener("click",()=>modal.classList.remove("open"));
    $("confirmFinishTraining").addEventListener("click",finishTraining);
  }

  function prescriptionFor(id){
    return session?.prescriptions?.[id]||"";
  }

  function syncSessionPlanToDay(){
    if(!session||session.mode!=="plan")return;
    const db=getDB(),day=db.days?.[session.date];if(!day)return;
    day.planExerciseIds=[...session.exerciseIds];
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
  }

  function renderSession(){
    ensureSessionShell();
    if(!session||!session.exerciseIds?.length)return;
    session.index=Math.max(0,Math.min(session.index||0,session.exerciseIds.length-1));
    const db=getDB(),id=session.exerciseIds[session.index],ex=(db.exercises||[]).find(x=>x.id===id);
    if(!ex)return;
    const day=db.days?.[session.date],rows=(day?.training||[]).filter(x=>x.exerciseId===id);
    $("sessionName").textContent=session.name||"训练";
    $("sessionProgress").textContent=`${session.index+1} / ${session.exerciseIds.length}`;
    $("sessionRecorded").textContent=rows.length?`已记录 ${rows.length} 组`:"未记录";
    $("sessionGroup").textContent=ex.group||"";
    $("sessionExerciseName").textContent=ex.name||"动作";
    const rx=prescriptionFor(id);
    $("sessionPrescription").textContent=rx?`计划 ${rx}`:"按状态完成";

    const hasNext=session.index<session.exerciseIds.length-1;
    if(hasNext){
      const next=(db.exercises||[]).find(x=>x.id===session.exerciseIds[session.index+1]);
      $("sessionNext").textContent=next?`下一个 · ${next.name}`:"";
      $("nextSessionExercise").style.display="";
      $("finishTrainingSession").classList.remove("wide");
    }else{
      $("sessionNext").textContent="这是本次训练的最后一个动作";
      $("nextSessionExercise").style.display="none";
      $("finishTrainingSession").classList.add("wide");
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
    if(!session?.exerciseIds?.length)return;
    const id=session.exerciseIds[session.index],day=getDB().days?.[session.date];
    const has=(day?.training||[]).some(x=>x.exerciseId===id);
    if(has&&typeof window.editTrainingExerciseSets==="function")window.editTrainingExerciseSets(id);
    else window.openTrainingModal?.(id);
  }

  function replaceCurrentExercise(){
    if(!session?.exerciseIds?.length)return;
    const oldId=session.exerciseIds[session.index];
    const used=session.exerciseIds.filter((_,i)=>i!==session.index);
    openExercisePicker(newId=>{
      if(!session||!newId)return;
      const oldRx=session.prescriptions?.[oldId]||"";
      session.exerciseIds[session.index]=newId;
      session.prescriptions=session.prescriptions||{};
      delete session.prescriptions[oldId];
      if(oldRx)session.prescriptions[newId]=oldRx;
      saveSession();syncSessionPlanToDay();renderSession();openSession();
      toast("本次训练动作已替换");
    },"替换当前动作",used);
  }

  function addExerciseAfterCurrent(){
    if(!session)return;
    openExercisePicker(newId=>{
      if(!session||!newId)return;
      const insertAt=Math.min(session.index+1,session.exerciseIds.length);
      session.exerciseIds.splice(insertAt,0,newId);
      session.prescriptions=session.prescriptions||{};
      saveSession();syncSessionPlanToDay();renderSession();openSession();
      toast("已加入本次训练");
    },"添加训练动作",session.exerciseIds);
  }

  function removeCurrentExercise(){
    if(!session?.exerciseIds?.length)return;
    const db=getDB(),id=session.exerciseIds[session.index],ex=(db.exercises||[]).find(x=>x.id===id);
    const recorded=(db.days?.[session.date]?.training||[]).some(x=>x.exerciseId===id);
    if(recorded&&!confirm(`「${ex?.name||"这个动作"}」已经有训练记录。移出本次流程不会删除已记录的组，继续？`))return;
    session.exerciseIds.splice(session.index,1);
    if(session.prescriptions)delete session.prescriptions[id];
    if(!session.exerciseIds.length){
      saveSession();syncSessionPlanToDay();
      $("trainingSessionShell")?.classList.remove("open");
      openFinishModal();
      return;
    }
    session.index=Math.min(session.index,session.exerciseIds.length-1);
    saveSession();syncSessionPlanToDay();renderSession();
    toast("已从本次训练移除");
  }

  function nextExercise(){
    if(!session)return;
    if(session.index<session.exerciseIds.length-1){
      session.index++;
      saveSession();renderSession();
    }
  }

  function renderFinishSummary(){
    const box=$("finishTrainingSummary");if(!box)return;
    const db=getDB(),day=db.days?.[session?.date],groups=[];
    (day?.training||[]).forEach(x=>{
      const key=x.exerciseId||x.exerciseName;
      let g=groups.find(y=>y.key===key);
      if(!g){
        const ex=(db.exercises||[]).find(e=>e.id===x.exerciseId);
        g={key,name:ex?.name||x.exerciseName||"动作",sets:0};groups.push(g);
      }
      g.sets+=Math.max(1,+x.sets||1);
    });
    box.innerHTML=groups.length?groups.map(g=>`<div class="finish-training-row"><span>${esc(g.name)}</span><b>${g.sets} 组</b></div>`).join(""):'<div class="empty">还没有记录力量训练。</div>';
  }

  function openFinishModal(){
    if(!session)return;
    ensureFinishModal();
    renderFinishSummary();
    const existing=+getDB().days?.[session.date]?.cardio||0;
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

  function fallbackLoadPlan(plan,ids){
    const db=getDB(),date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];
    day.planId=plan.id;day.planName=plan.name;day.planExerciseIds=[...ids];
    delete day.planMainExerciseIds;delete day.planFinisherIds;delete day.planOverrides;
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
  }

  function startTrainingFromPlan(planId){
    const db=getDB(),plan=(db.plans||[]).find(p=>p.id===planId);if(!plan)return;
    const ids=[...(plan.exerciseIds||[]),...(plan.finisherIds||[])].filter(Boolean);
    if(!ids.length)return toast("这个模板还没有动作");
    if(typeof window.loadTrainingPlanToDay==="function")window.loadTrainingPlanToDay(planId);
    else fallbackLoadPlan(plan,ids);
    session={date:activeDate(),mode:"plan",planId:plan.id,name:plan.name,exerciseIds:[...ids],prescriptions:{...(plan.prescriptions||{})},index:0};
    saveSession();
    $("startTrainingModal")?.classList.remove("open");
    openSession();
  }

  function startFreeSession(exerciseId){
    const db=getDB(),ex=(db.exercises||[]).find(x=>x.id===exerciseId);if(!ex)return;
    const date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    db.days[date].planId="";db.days[date].planName="";db.days[date].planExerciseIds=[];
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
    session={date,mode:"free",planId:"",name:"自由训练",exerciseIds:[exerciseId],prescriptions:{},index:0};
    saveSession();openSession();
  }

  function updateHomeTrainingAction(){
    const btn=$("homeStartTrainingBtn");if(!btn)return;
    btn.textContent=session?.date===activeDate()?"继续训练":"开始训练";
  }

  function simplifyHomeTraining(){
    const box=$("todayTrainingList");
    if(box){
      [...box.querySelectorAll(".item")].forEach(card=>{
        if(card.querySelector("[data-record-ex],[data-replace-plan-ex]"))card.remove();
      });
      if(!box.querySelector(".item")&&!box.querySelector(".empty"))box.innerHTML='<div class="empty">暂无训练记录。</div>';
    }
    const hint=$("planHint");
    if(hint){hint.textContent="";hint.style.display="none"}
    $("clearLoadedPlanBtn")?.remove();
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
    simplifyHomeTraining();
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

    const db=getDB();
    $("planList")?.querySelectorAll(".item").forEach(card=>{
      const edit=card.querySelector("[data-edit-plan]"),plan=(db.plans||[]).find(p=>p.id===edit?.dataset.editPlan);
      card.querySelector("[data-load-plan]")?.remove();
      if(plan){const sub=card.querySelector(".item-sub");if(sub)sub.textContent=`${(plan.exerciseIds||[]).length} 个动作`}
    });
  }

  function setupObservers(){
    window.addEventListener("fitness:changed",()=>requestAnimationFrame(()=>{
      reconcileSessionWithDay();
      if(session)renderSession();
      addHomeActions();simplifyTrainingPage();
    }));

    const dateLabel=$("activeDateLabel");
    if(dateLabel)new MutationObserver(()=>{
      restoreSession();
      updateHomeTrainingAction();
      $("trainingSessionShell")?.classList.remove("open");
      simplifyHomeTraining();
    }).observe(dateLabel,{childList:true,subtree:true,characterData:true});

    const todayList=$("todayTrainingList");
    if(todayList)new MutationObserver(()=>requestAnimationFrame(simplifyHomeTraining)).observe(todayList,{childList:true,subtree:true});
    const planList=$("planList");
    if(planList)new MutationObserver(()=>requestAnimationFrame(simplifyTrainingPage)).observe(planList,{childList:true,subtree:true});

    document.querySelectorAll('[data-page="today"],[data-page="training"]').forEach(btn=>btn.addEventListener("click",()=>setTimeout(()=>{addHomeActions();simplifyTrainingPage()},0)));
  }

  function setup(){
    if(!window.fitnessApp||!$("todayTrainingList")||!$("planList"))return setTimeout(setup,80);
    ensureStartModal();ensureExercisePicker();ensureSessionShell();ensureFinishModal();
    restoreSession();addHomeActions();simplifyTrainingPage();setupObservers();
    window.startTrainingFromPlan=startTrainingFromPlan;
    window.openTrainingStart=openStartModal;
    window.cancelTrainingSessionForDate=cancelSessionForDate;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();