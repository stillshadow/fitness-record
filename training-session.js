(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const SESSION_KEY = "chibianyingActiveWorkoutV2";
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

  function publishWorkoutContext(){
    window.fitnessWorkoutContext=session?{
      workoutId:session.workoutId,
      date:session.date,
      prescriptions:{...(session.prescriptions||{})}
    }:null;
  }

  function saveSession(){
    if(!session)localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    publishWorkoutContext();
  }

  function restoreSession(){
    try{
      const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
      if(raw?.version===2 && raw.date===activeDate() && raw.workoutId && Array.isArray(raw.exerciseIds) && raw.exerciseIds.length){
        session=raw;
        session.prescriptions=session.prescriptions||{};
        session.index=Math.max(0,Math.min(+session.index||0,session.exerciseIds.length-1));
      }else session=null;
    }catch(e){session=null}
    publishWorkoutContext();
  }

  function endSessionState(){
    session=null;
    saveSession();
    $("trainingSessionShell")?.classList.remove("open");
    $("finishTrainingModal")?.classList.remove("open");
    $("sessionActionsModal")?.classList.remove("open");
    updateHomeTrainingAction();
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

  function workoutEntries(db=getDB()){
    if(!session?.workoutId)return [];
    return (db.days?.[session.date]?.training||[]).filter(x=>x.workoutId===session.workoutId);
  }

  function rowsForExercise(exerciseId,db=getDB()){
    return workoutEntries(db).filter(x=>x.exerciseId===exerciseId);
  }

  function ensureStyles(){
    if($("workoutSessionV2Style"))return;
    const style=document.createElement("style");style.id="workoutSessionV2Style";
    style.textContent=`
      #page-training #planList [data-load-plan]{display:none!important}
      .training-session-nav{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
      .training-session-nav .btn{min-height:44px}
      .training-session-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
      .training-session-link{border:0;background:transparent;color:var(--muted);padding:7px 2px;font-size:12px}
      .training-session-link.danger{color:#ff9ca5}
      .session-action-list{display:grid;gap:7px;margin-top:4px}
      .session-action-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.02);border-radius:13px;padding:9px 10px}
      .session-action-row.current{border-color:rgba(154,174,255,.34);background:rgba(154,174,255,.055)}
      .session-action-main{min-width:0;border:0;background:transparent;color:var(--text);text-align:left;padding:2px;display:flex;align-items:center;gap:10px}
      .session-action-index{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:#171d26;color:var(--muted);font-size:11px;flex:0 0 auto}
      .session-action-copy{min-width:0}.session-action-copy b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.session-action-copy small{display:block;color:var(--muted);font-size:10px;margin-top:1px}
      .session-action-controls{display:flex;gap:5px}.session-action-controls .btn{padding:6px 8px;font-size:11px}
      .session-list-add{width:100%;margin-top:10px}
      .finish-cardio-toggle{display:flex;align-items:center;gap:8px;color:var(--text);font-size:13px;margin:0}.finish-cardio-toggle input{width:auto}
      #finishCardioField{margin-top:10px}
      .finish-training-summary{display:grid;gap:6px}.finish-training-row{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border:1px solid rgba(255,255,255,.06);border-radius:11px;background:rgba(255,255,255,.02)}
      .finish-training-row b{font-size:12px;color:var(--accent2);white-space:nowrap}
      @media(max-width:430px){.session-action-row{grid-template-columns:1fr}.session-action-controls{justify-content:flex-end}}
    `;
    document.head.appendChild(style);
  }

  function ensureStartModal(){
    if($("startTrainingModal"))return;
    const modal=document.createElement("div");modal.className="modal";modal.id="startTrainingModal";
    modal.innerHTML=`
      <div class="modal-panel training-start-panel">
        <div class="section"><h2>开始训练</h2><button class="btn ghost" data-close-start>关闭</button></div>
        <div class="meta" style="margin-bottom:10px">模板只是本次训练的起点，开始后可以自由调整。</div>
        <div id="startTrainingPlans" class="training-start-list"></div>
        <button type="button" class="training-free-choice" id="startFreeTrainingBtn">
          <span><b>自由训练</b><small>先选一个动作，后面随时添加</small></span><span>›</span>
        </button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-start]").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    $("startFreeTrainingBtn").addEventListener("click",()=>{
      modal.classList.remove("open");
      openExercisePicker(id=>startFreeSession(id),"选择第一个动作");
    });
  }

  function renderStartPlans(){
    ensureStartModal();
    const box=$("startTrainingPlans"),db=getDB();if(!box)return;
    const plans=db.plans||[];
    box.innerHTML=plans.length?plans.map(p=>`
      <button type="button" class="training-plan-choice" data-session-plan="${esc(p.id)}">
        <span><b>${esc(p.name)}</b><small>${(p.exerciseIds||[]).length} 个动作</small></span><span>开始</span>
      </button>`).join(""):'<div class="empty">还没有训练模板，可以使用自由训练。</div>';
    box.querySelectorAll("[data-session-plan]").forEach(btn=>btn.addEventListener("click",()=>startTrainingFromPlan(btn.dataset.sessionPlan)));
  }

  function openStartModal(){
    if(session?.date===activeDate())return openSession();
    renderStartPlans();
    $("startTrainingModal")?.classList.add("open");
  }

  function ensureExercisePicker(){
    if($("sessionExercisePicker"))return;
    const modal=document.createElement("div");modal.className="modal";modal.id="sessionExercisePicker";
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
    return (db.exercises||[]).filter(ex=>categoryOf(ex.group)===group&&!pickerExcludeIds.has(ex.id)).sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-CN"));
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
    pickerCallback=callback;pickerExcludeIds=new Set(excludeIds||[]);
    $("sessionExercisePickerTitle").textContent=title;
    renderPickerGroups();
    $("sessionExercisePicker")?.classList.add("open");
  }

  function ensureSessionShell(){
    if($("trainingSessionShell"))return;
    const shell=document.createElement("div");shell.id="trainingSessionShell";shell.className="training-session-shell";
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
        <div class="training-session-nav">
          <button type="button" class="btn ghost" id="previousSessionExercise">上一动作</button>
          <button type="button" class="btn soft" id="nextSessionExercise">下一动作</button>
        </div>
        <div class="training-session-footer">
          <button type="button" class="training-session-link" id="openSessionActions">本次训练动作</button>
          <button type="button" class="training-session-link danger" id="finishTrainingSession">结束训练</button>
        </div>
      </div>`;
    document.body.appendChild(shell);
    $("minimizeTrainingSession").addEventListener("click",()=>shell.classList.remove("open"));
    $("recordSessionExercise").addEventListener("click",recordCurrentExercise);
    $("previousSessionExercise").addEventListener("click",previousExercise);
    $("nextSessionExercise").addEventListener("click",nextExercise);
    $("openSessionActions").addEventListener("click",openActionsModal);
    $("finishTrainingSession").addEventListener("click",openFinishModal);
  }

  function ensureActionsModal(){
    if($("sessionActionsModal"))return;
    const modal=document.createElement("div");modal.className="modal";modal.id="sessionActionsModal";
    modal.innerHTML=`
      <div class="modal-panel wide">
        <div class="section"><h2>本次训练</h2><button type="button" class="btn ghost" data-close-session-actions>关闭</button></div>
        <div class="meta" style="margin-bottom:9px">点任意动作可直接切换过去，已记录的动作也可以重新打开修改。</div>
        <div id="sessionActionList" class="session-action-list"></div>
        <button type="button" class="btn soft session-list-add" id="appendSessionExercise">＋ 添加动作</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-session-actions]").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    $("appendSessionExercise").addEventListener("click",appendExercise);
    $("sessionActionList").addEventListener("click",e=>{
      const replace=e.target.closest?.("[data-session-replace]");
      if(replace)return replaceAt(+replace.dataset.sessionReplace);
      const remove=e.target.closest?.("[data-session-remove]");
      if(remove)return removeAt(+remove.dataset.sessionRemove);
      const jump=e.target.closest?.("[data-session-jump]");
      if(jump)return jumpTo(+jump.dataset.sessionJump);
    });
  }

  function renderActionsModal(){
    ensureActionsModal();
    const box=$("sessionActionList"),db=getDB();if(!box||!session)return;
    box.innerHTML=session.exerciseIds.map((id,i)=>{
      const ex=(db.exercises||[]).find(x=>x.id===id)||{name:"未知动作",group:"其他"};
      const n=rowsForExercise(id,db).length;
      return `<div class="session-action-row ${i===session.index?"current":""}">
        <button type="button" class="session-action-main" data-session-jump="${i}">
          <span class="session-action-index">${i+1}</span>
          <span class="session-action-copy"><b>${esc(ex.name)}</b><small>${n?`已记录 ${n} 组`:esc(session.prescriptions?.[id]||ex.group||"未记录")}</small></span>
        </button>
        <div class="session-action-controls"><button type="button" class="btn ghost" data-session-replace="${i}">替换</button><button type="button" class="btn ghost" data-session-remove="${i}">移除</button></div>
      </div>`;
    }).join("");
  }

  function openActionsModal(){renderActionsModal();$("sessionActionsModal")?.classList.add("open")}

  function jumpTo(index){
    if(!session||index<0||index>=session.exerciseIds.length)return;
    session.index=index;saveSession();
    $("sessionActionsModal")?.classList.remove("open");
    renderSession();openSession();
  }

  function replaceAt(index){
    if(!session||index<0||index>=session.exerciseIds.length)return;
    const oldId=session.exerciseIds[index],db=getDB(),ex=(db.exercises||[]).find(x=>x.id===oldId);
    if(rowsForExercise(oldId,db).length&&!confirm(`「${ex?.name||"这个动作"}」已经有记录。替换只改变接下来的训练流程，不会删除已记录组。继续？`))return;
    $("sessionActionsModal")?.classList.remove("open");
    openExercisePicker(newId=>{
      if(!session||!newId)return;
      session.exerciseIds[index]=newId;
      session.prescriptions=session.prescriptions||{};
      delete session.prescriptions[oldId];
      delete session.prescriptions[newId];
      session.index=index;
      saveSession();renderSession();openSession();toast("本次动作已替换");
    },"替换动作",session.exerciseIds);
  }

  function removeAt(index){
    if(!session||index<0||index>=session.exerciseIds.length)return;
    const db=getDB(),id=session.exerciseIds[index],ex=(db.exercises||[]).find(x=>x.id===id);
    if(rowsForExercise(id,db).length&&!confirm(`「${ex?.name||"这个动作"}」已经有记录。移出流程不会删除已记录组。继续？`))return;
    session.exerciseIds.splice(index,1);
    if(session.prescriptions)delete session.prescriptions[id];
    if(!session.exerciseIds.length){
      saveSession();$("sessionActionsModal")?.classList.remove("open");return openFinishModal();
    }
    if(session.index>index)session.index--;
    session.index=Math.min(session.index,session.exerciseIds.length-1);
    saveSession();renderActionsModal();renderSession();toast("已从本次训练移除");
  }

  function appendExercise(){
    if(!session)return;
    $("sessionActionsModal")?.classList.remove("open");
    openExercisePicker(newId=>{
      if(!session||!newId)return;
      session.exerciseIds.push(newId);
      session.prescriptions=session.prescriptions||{};
      delete session.prescriptions[newId];
      saveSession();renderSession();openSession();toast("已添加到本次训练");
    },"添加动作",session.exerciseIds);
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
        <label class="finish-cardio-toggle"><input id="finishHasCardio" type="checkbox"> 本次做了有氧</label>
        <div id="finishCardioField" class="hidden"><label for="finishCardioMinutes">有氧分钟</label><input id="finishCardioMinutes" type="number" min="1" step="1" inputmode="numeric" placeholder="例如 20"></div>
        <div class="modal-actions"><button class="btn" id="confirmFinishTraining">完成训练</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-close-finish]").addEventListener("click",()=>modal.classList.remove("open"));
    $("finishHasCardio").addEventListener("change",()=>$("finishCardioField")?.classList.toggle("hidden",!$("finishHasCardio").checked));
    $("confirmFinishTraining").addEventListener("click",finishTraining);
  }

  function renderFinishSummary(){
    const box=$("finishTrainingSummary");if(!box||!session)return;
    const db=getDB(),entries=workoutEntries(db),groups=[];
    entries.forEach(x=>{
      let g=groups.find(y=>y.id===x.exerciseId);
      if(!g){const ex=(db.exercises||[]).find(e=>e.id===x.exerciseId);g={id:x.exerciseId,name:ex?.name||x.exerciseName||"动作",sets:0};groups.push(g)}
      g.sets+=Math.max(1,+x.sets||1);
    });
    box.innerHTML=groups.length?groups.map(g=>`<div class="finish-training-row"><span>${esc(g.name)}</span><b>${g.sets} 组</b></div>`).join(""):'<div class="empty">还没有记录任何训练内容。</div>';
  }

  function openFinishModal(){
    if(!session)return;
    ensureFinishModal();renderFinishSummary();
    $("finishHasCardio").checked=false;
    $("finishCardioMinutes").value="";
    $("finishCardioField")?.classList.add("hidden");
    $("finishTrainingModal")?.classList.add("open");
  }

  function finishTraining(){
    if(!session)return;
    const hasCardio=!!$("finishHasCardio")?.checked;
    const minutes=hasCardio?Math.max(0,+$("finishCardioMinutes")?.value||0):0;
    if(hasCardio&&!minutes)return toast("填写有氧分钟");
    const entries=workoutEntries();
    if(!entries.length&&!minutes){
      endSessionState();
      return toast("未记录内容，本次训练未保存");
    }
    if(minutes){
      const db=getDB(),date=session.date;
      db.days=db.days||{};
      if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
      db.days[date].cardio=(+db.days[date].cardio||0)+minutes;
      db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
      putDB(db);
    }
    const doneCount=entries.length;
    endSessionState();
    if(!minutes&&doneCount){
      // Set rows were written quietly during the workout. Rebuild the rest of the app once,
      // after the workout is actually finished and no keyboard is involved.
      window.fitnessApp?.refresh?.();
      window.dispatchEvent(new CustomEvent("fitness:changed"));
    }
    toast(minutes?`训练完成 · 有氧 ${minutes}min`:(doneCount?"训练完成":"本次训练未保存"));
  }

  function renderSession(){
    ensureSessionShell();if(!session?.exerciseIds?.length)return;
    session.index=Math.max(0,Math.min(+session.index||0,session.exerciseIds.length-1));
    const db=getDB(),id=session.exerciseIds[session.index],ex=(db.exercises||[]).find(x=>x.id===id);if(!ex)return;
    const rows=rowsForExercise(id,db);
    $("sessionName").textContent=session.name||"训练";
    $("sessionProgress").textContent=`${session.index+1} / ${session.exerciseIds.length}`;
    $("sessionRecorded").textContent=rows.length?`已记录 ${rows.length} 组`:"未记录";
    $("sessionGroup").textContent=ex.group||"";
    $("sessionExerciseName").textContent=ex.name||"动作";
    const rx=session.prescriptions?.[id]||"";
    $("sessionPrescription").textContent=rx?`计划 ${rx}`:"自由记录";
    const prev=session.index>0,next=session.index<session.exerciseIds.length-1;
    $("previousSessionExercise").disabled=!prev;
    $("nextSessionExercise").disabled=!next;
    if(next){const n=(db.exercises||[]).find(x=>x.id===session.exerciseIds[session.index+1]);$("sessionNext").textContent=n?`下一个 · ${n.name}`:""}
    else $("sessionNext").textContent="已经到最后一个动作";
    $("recordSessionExercise").textContent=rows.length?"查看 / 编辑记录":"记录本动作";
    publishWorkoutContext();updateHomeTrainingAction();
  }

  function openSession(){
    if(!session)return openStartModal();
    renderSession();$("trainingSessionShell")?.classList.add("open");
  }

  function recordCurrentExercise(){
    if(!session?.exerciseIds?.length)return;
    publishWorkoutContext();
    const id=session.exerciseIds[session.index],has=rowsForExercise(id).length>0;
    if(has&&typeof window.editTrainingExerciseSets==="function")window.editTrainingExerciseSets(id,session.workoutId);
    else window.openTrainingModal?.(id);
  }

  function previousExercise(){
    if(!session||session.index<=0)return;
    session.index--;saveSession();renderSession();
  }
  function nextExercise(){
    if(!session||session.index>=session.exerciseIds.length-1)return;
    session.index++;saveSession();renderSession();
  }

  function newSession(name,exerciseIds,prescriptions={},sourcePlanId=""){
    session={version:2,workoutId:uid("wk"),date:activeDate(),sourcePlanId,name,exerciseIds:[...exerciseIds],prescriptions:{...prescriptions},index:0};
    saveSession();
    $("startTrainingModal")?.classList.remove("open");
    openSession();
  }

  function startTrainingFromPlan(planId){
    const db=getDB(),plan=(db.plans||[]).find(p=>p.id===planId);if(!plan)return;
    const ids=(plan.exerciseIds||[]).filter(Boolean);if(!ids.length)return toast("这个模板还没有动作");
    newSession(plan.name,ids,plan.prescriptions||{},plan.id);
  }

  function startFreeSession(exerciseId){
    const ex=(getDB().exercises||[]).find(x=>x.id===exerciseId);if(!ex)return;
    newSession("自由训练",[exerciseId],{},"");
  }

  function updateHomeTrainingAction(){
    const btn=$("homeStartTrainingBtn");if(!btn)return;
    btn.textContent=session?.date===activeDate()?"继续训练":"开始训练";
  }

  function simplifyHomeTraining(){
    const box=$("todayTrainingList");
    if(box){
      [...box.querySelectorAll(".item")].forEach(card=>{if(card.querySelector("[data-record-ex],[data-replace-plan-ex]"))card.remove()});
      if(!box.querySelector(".item")&&!box.querySelector(".empty"))box.innerHTML='<div class="empty">暂无训练记录。</div>';
    }
    const hint=$("planHint");if(hint){hint.textContent="";hint.style.display="none"}
    $("clearLoadedPlanBtn")?.remove();
  }

  function addHomeActions(){
    const weight=$("todayWeight")?.closest(".summary-item");
    if(weight&&!weight.dataset.directWeight){
      weight.dataset.directWeight="1";weight.classList.add("direct-record-target");weight.setAttribute("role","button");weight.setAttribute("tabindex","0");
      const open=()=>$("quickWeight")?.click();weight.addEventListener("click",open);weight.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    }
    const trainingSection=$("todayTrainingList")?.closest(".card")?.querySelector(".section");
    if(trainingSection&&!$("homeStartTrainingBtn")){
      const btn=document.createElement("button");btn.id="homeStartTrainingBtn";btn.className="btn";btn.textContent="开始训练";
      btn.addEventListener("click",()=>session?.date===activeDate()?openSession():openStartModal());trainingSection.appendChild(btn);
    }
    const foodSection=$("todayFoodList")?.closest(".card")?.querySelector(".section");
    if(foodSection&&!$("homeAddFoodBtn")){
      const btn=document.createElement("button");btn.id="homeAddFoodBtn";btn.className="btn soft";btn.textContent="记录食物";btn.addEventListener("click",()=>$("quickFood")?.click());foodSection.appendChild(btn);
    }
    simplifyHomeTraining();updateHomeTrainingAction();
  }

  function simplifyTrainingPage(){
    $("trainingGuidanceCard")?.remove();
    const exerciseCard=$("exerciseList")?.closest(".card");if(exerciseCard)exerciseCard.style.display="none";
    const planCard=$("planList")?.closest(".card"),planSection=planCard?.querySelector(".section");
    const addExercise=$("newExerciseBtn"),newPlan=$("newPlanBtn");
    if(planSection&&addExercise&&!$("trainingHeaderActions")){
      const actions=document.createElement("div");actions.id="trainingHeaderActions";actions.className="training-header-actions";
      if(newPlan)actions.appendChild(newPlan);addExercise.textContent="＋ 动作";actions.appendChild(addExercise);planSection.appendChild(actions);
    }
    const planMeta=planCard?.querySelector(":scope > .meta");if(planMeta)planMeta.style.display="none";
    const strengthCard=$("strengthList")?.closest(".card"),strengthMeta=strengthCard?.querySelector(".section .meta");if(strengthMeta)strengthMeta.style.display="none";
    const db=getDB();
    $("planList")?.querySelectorAll(".item").forEach(card=>{
      const edit=card.querySelector("[data-edit-plan]"),plan=(db.plans||[]).find(p=>p.id===edit?.dataset.editPlan);
      const load=card.querySelector("[data-load-plan]");if(load){load.style.display="none";load.disabled=true}
      if(plan){const sub=card.querySelector(".item-sub"),summary=`${(plan.exerciseIds||[]).length} 个动作`;if(sub&&sub.textContent!==summary)sub.textContent=summary}
    });
  }

  function setupObservers(){
    window.addEventListener("fitness:workout-changed",()=>requestAnimationFrame(()=>{
      if(!session)return;
      renderSession();
      if($("sessionActionsModal")?.classList.contains("open"))renderActionsModal();
    }));
    window.addEventListener("fitness:changed",()=>requestAnimationFrame(()=>{if(session)renderSession();addHomeActions();simplifyTrainingPage()}));
    const dateLabel=$("activeDateLabel");
    if(dateLabel)new MutationObserver(()=>{restoreSession();updateHomeTrainingAction();$("trainingSessionShell")?.classList.remove("open");simplifyHomeTraining()}).observe(dateLabel,{childList:true,subtree:true,characterData:true});
    const todayList=$("todayTrainingList");if(todayList)new MutationObserver(()=>requestAnimationFrame(simplifyHomeTraining)).observe(todayList,{childList:true,subtree:true});
    const planList=$("planList");if(planList)new MutationObserver(()=>requestAnimationFrame(simplifyTrainingPage)).observe(planList,{childList:true,subtree:true});
    document.querySelectorAll('[data-page="today"],[data-page="training"]').forEach(btn=>btn.addEventListener("click",()=>setTimeout(()=>{addHomeActions();simplifyTrainingPage()},0)));
  }

  function setup(){
    if(!window.fitnessApp||!$("todayTrainingList")||!$("planList"))return setTimeout(setup,80);
    ensureStyles();ensureStartModal();ensureExercisePicker();ensureSessionShell();ensureActionsModal();ensureFinishModal();
    restoreSession();addHomeActions();simplifyTrainingPage();setupObservers();
    window.openTrainingStart=openStartModal;
    window.getActiveWorkoutSession=()=>session?JSON.parse(JSON.stringify(session)):null;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();