(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
  let currentExerciseId = "";
  let setDrafts = [];

  const todayString = () => {
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const activeDate = () => {
    const t=$("activeDateLabel")?.textContent.trim()||"";
    return /^\d{4}-\d{2}-\d{2}$/.test(t)?t:todayString();
  };
  const timeString = () => {
    const d=new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
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

  function currentExercise(){
    const id=$("trainingExercise")?.value||"";
    return (getDB().exercises||[]).find(x=>x.id===id)||null;
  }
  function isStrengthMode(){return !!$("trainingExercise")?.value}
  function isBodyweight(ex){return (+ex?.bodyweightFactor||0)>0}

  function planPrescription(exerciseId){
    const db=getDB(),day=db.days?.[activeDate()];
    if(!day)return "";
    const plan=(db.plans||[]).find(p=>p.id===day.planId)||(db.plans||[]).find(p=>p.name===day.planName);
    return plan?.prescriptions?.[exerciseId]||"";
  }
  function prescribedSetCount(exerciseId){
    const text=planPrescription(exerciseId);
    let m=text.match(/(\d+)\s*组准备\s*\+\s*(\d+)\s*组正式/);
    if(m)return Math.max(1,(+m[1]||0)+(+m[2]||0));
    m=text.match(/^\s*(\d+)\s*[×xX]/);
    if(m)return Math.max(1,+m[1]||1);
    m=text.match(/^\s*(\d+)\s*组/);
    if(m)return Math.max(1,+m[1]||1);
    return 1;
  }

  function blankSet(weight=""){return {weight:String(weight??""),reps:"",rir:""}}
  function resetDrafts(exerciseId){
    currentExerciseId=exerciseId||"";
    const count=exerciseId?prescribedSetCount(exerciseId):1;
    setDrafts=Array.from({length:count},()=>blankSet());
  }

  function setupStyles(){
    if($("setLoggerStyle"))return;
    const style=document.createElement("style");
    style.id="setLoggerStyle";
    style.textContent=`
      #strengthSetEditor{margin-top:10px}
      .set-plan-hint{font-size:12px;color:var(--muted);margin:0 0 8px}
      .set-grid-head,.set-row{display:grid;grid-template-columns:28px minmax(0,1.2fr) minmax(62px,.75fr) minmax(58px,.65fr) 34px;gap:6px;align-items:center}
      .set-grid-head{font-size:11px;color:var(--muted);padding:0 2px 5px}
      .set-row{margin-bottom:7px}
      .set-index{font-size:12px;color:var(--muted);text-align:center}
      .set-row input{width:100%;min-width:0;box-sizing:border-box;padding:9px 8px}
      .set-delete{height:38px;width:34px;padding:0;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--bad);font-size:17px}
      .set-toolbar{display:flex;gap:8px;margin-top:3px}
      .set-toolbar .btn{flex:1}
      @media(max-width:430px){
        .set-grid-head,.set-row{grid-template-columns:24px minmax(0,1.12fr) minmax(55px,.7fr) minmax(52px,.62fr) 32px;gap:5px}
        .set-row input{padding:8px 6px}
        .set-delete{width:32px;height:36px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureEditor(){
    const modal=$("trainingModal"),row=$("trainingExercise")?.closest(".row");
    if(!modal||!row)return null;
    let editor=$("strengthSetEditor");
    if(editor)return editor;
    editor=document.createElement("div");
    editor.id="strengthSetEditor";
    row.insertAdjacentElement("afterend",editor);
    editor.addEventListener("input",e=>{
      const r=e.target.closest?.(".set-row");if(!r)return;
      const i=+r.dataset.index;
      if(!setDrafts[i])return;
      if(e.target.matches("[data-set-weight]"))setDrafts[i].weight=e.target.value;
      if(e.target.matches("[data-set-reps]"))setDrafts[i].reps=e.target.value;
      if(e.target.matches("[data-set-rir]"))setDrafts[i].rir=e.target.value;
      updateSaveText();
    });
    editor.addEventListener("click",e=>{
      const del=e.target.closest?.("[data-delete-set]");
      if(del){
        const i=+del.dataset.deleteSet;
        setDrafts.splice(i,1);
        if(!setDrafts.length)setDrafts=[blankSet()];
        renderEditor();
        return;
      }
      if(e.target.closest?.("#addSetRowBtn")){
        const last=setDrafts[setDrafts.length-1];
        setDrafts.push(blankSet(last?.weight||""));
        renderEditor();
        setTimeout(()=>editor.querySelector('.set-row:last-of-type [data-set-reps]')?.focus(),0);
      }
    });
    return editor;
  }

  function renderEditor(){
    const editor=ensureEditor();if(!editor)return;
    const ex=currentExercise(),body=isBodyweight(ex),rx=planPrescription(ex?.id||"");
    const weightLabel=body?"额外负重":"重量 kg";
    editor.innerHTML=`
      ${rx?`<div class="set-plan-hint">计划：${esc(rx)}</div>`:""}
      <div class="set-grid-head"><span></span><span>${weightLabel}</span><span>次数</span><span>RIR</span><span></span></div>
      <div id="setRows">${setDrafts.map((s,i)=>`
        <div class="set-row" data-index="${i}">
          <div class="set-index">${i+1}</div>
          <input data-set-weight type="number" step="0.5" inputmode="decimal" value="${esc(s.weight)}" placeholder="${body?"0":"kg"}">
          <input data-set-reps type="number" step="1" min="0" inputmode="numeric" value="${esc(s.reps)}" placeholder="次">
          <input data-set-rir type="number" step="1" min="0" max="10" inputmode="numeric" value="${esc(s.rir)}" placeholder="-">
          <button type="button" class="set-delete" data-delete-set="${i}" aria-label="删除第${i+1}组">×</button>
        </div>`).join("")}</div>
      <div class="set-toolbar"><button type="button" class="btn ghost" id="addSetRowBtn">＋ 添加一组</button></div>`;
    updateSaveText();
  }

  function hideOriginalStrengthInputs(){
    ["trainingWeight","trainingReps","trainingSets","trainingRir"].forEach(id=>{
      const input=$(id);if(input?.parentElement)input.parentElement.style.display="none";
    });
  }

  function updateSaveText(){
    const btn=$("saveTrainingBtn");if(!btn||!isStrengthMode())return;
    const n=setDrafts.filter(x=>+x.reps>0).length;
    btn.textContent=n?`保存 ${n} 组`:"保存训练";
  }

  function syncMode(forceReset=false){
    const editor=ensureEditor();if(!editor)return;
    const id=$("trainingExercise")?.value||"";
    hideOriginalStrengthInputs();
    const hint=$("trainingModal")?.querySelector(".row + .meta");
    if(!id){
      editor.style.display="none";
      if(hint)hint.style.display="";
      return;
    }
    if(forceReset||currentExerciseId!==id)resetDrafts(id);
    if(hint)hint.style.display="none";
    editor.style.display="block";
    renderEditor();
  }

  function saveStrengthSets(e){
    if(!isStrengthMode())return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const ex=currentExercise();if(!ex)return toast("请选择动作");
    for(let i=0;i<setDrafts.length;i++){
      const s=setDrafts[i],any=String(s.weight).trim()||String(s.reps).trim()||String(s.rir).trim();
      if(any && !(+s.reps>0))return toast(`请填写第 ${i+1} 组次数`);
    }
    const valid=setDrafts.filter(x=>+x.reps>0);
    if(!valid.length)return toast("至少记录一组");

    const db=getDB(),date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];day.training=day.training||[];
    const groupId=uid("setgroup"),time=timeString();
    valid.forEach((s,i)=>day.training.push({
      id:uid("tr"),setGroupId:groupId,setIndex:i+1,
      exerciseId:ex.id,exerciseName:ex.name,
      weight:+s.weight||0,reps:+s.reps||0,sets:1,
      rir:String(s.rir).trim()===""?"":+s.rir,
      time
    }));
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    putDB(db);
    $("trainingModal")?.classList.remove("open");
    toast(`已记录 ${valid.length} 组`);
  }

  function setup(){
    if(!window.fitnessApp||!$("trainingModal")||!$("saveTrainingBtn"))return setTimeout(setup,80);
    setupStyles();ensureEditor();

    const select=$("trainingExercise");
    if(select&&!select.dataset.perSetReady){
      select.dataset.perSetReady="1";
      select.addEventListener("change",()=>setTimeout(()=>syncMode(true),0));
    }
    const group=$("trainingGroupFilter");
    if(group&&!group.dataset.perSetReady){
      group.dataset.perSetReady="1";
      group.addEventListener("change",()=>setTimeout(()=>syncMode(true),0));
    }

    $("saveTrainingBtn").addEventListener("click",saveStrengthSets,true);

    const modal=$("trainingModal");
    new MutationObserver(()=>{
      if(modal.classList.contains("open")){
        currentExerciseId="";
        setTimeout(()=>syncMode(true),0);
      }
    }).observe(modal,{attributes:true,attributeFilter:["class"]});

    setTimeout(()=>syncMode(true),0);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();