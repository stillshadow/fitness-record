(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const fmt = (n,d=1) => Number(n || 0).toFixed(d).replace(/\.0$/, "");
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
  const SYSTEM_VERSION = 20;

  const LIBRARY = [
    {id:"bench",name:"杠铃卧推",group:"胸"},
    {id:"incline_db_press",name:"哑铃上斜卧推",group:"胸"},
    {id:"incline_barbell_press",name:"上斜杠铃卧推",group:"胸"},
    {id:"db_bench",name:"哑铃卧推",group:"胸"},
    {id:"chest_press",name:"器械推胸",group:"胸"},
    {id:"pecdeck",name:"蝴蝶机夹胸",group:"胸"},
    {id:"cable_fly",name:"龙门架夹胸",group:"胸"},
    {id:"dip",name:"双杠臂屈伸",group:"胸/三头",bodyweightFactor:1},
    {id:"pushup",name:"俯卧撑",group:"胸/三头",bodyweightFactor:.65},

    {id:"pullup",name:"引体向上",group:"背/二头",bodyweightFactor:1},
    {id:"pulldown",name:"高位下拉",group:"背"},
    {id:"neutral_pulldown",name:"对握下拉",group:"背"},
    {id:"cable_single_pulldown",name:"单手钢线下拉",group:"背"},
    {id:"singlepull",name:"器械单臂下拉",group:"背"},
    {id:"row",name:"坐姿划船",group:"背"},
    {id:"machine_single_row",name:"单手器械划船",group:"背"},
    {id:"seated_row_high_elbow",name:"坐姿划船（平肘）",group:"背/后束"},
    {id:"barbell_row",name:"杠铃划船",group:"背"},
    {id:"chest_supported_row",name:"胸托划船",group:"背"},
    {id:"straight_arm_pulldown",name:"直臂下压",group:"背"},

    {id:"shoulderpress",name:"器械推肩",group:"肩"},
    {id:"db_shoulder_press",name:"哑铃推肩",group:"肩"},
    {id:"ohp",name:"杠铃肩推",group:"肩"},
    {id:"lateral",name:"侧平举",group:"肩"},
    {id:"cable_lateral_raise",name:"钢线侧平举",group:"肩"},
    {id:"y_raise",name:"Y字侧平举",group:"肩"},
    {id:"reverse_fly",name:"反向飞鸟",group:"肩/后束"},
    {id:"face_pull",name:"面拉",group:"肩/后束"},

    {id:"curl",name:"坐姿弯举",group:"二头"},
    {id:"barbell_curl",name:"杠铃弯举",group:"二头"},
    {id:"db_curl",name:"哑铃弯举",group:"二头"},
    {id:"hammer_curl",name:"锤式弯举",group:"二头"},
    {id:"incline_curl",name:"上斜哑铃弯举",group:"二头"},
    {id:"cable_curl",name:"钢线弯举",group:"二头"},
    {id:"preacher_curl",name:"牧师凳弯举",group:"二头"},

    {id:"triceps",name:"龙门架三头下压",group:"三头"},
    {id:"rope_pushdown",name:"绳索下压",group:"三头"},
    {id:"overhead_triceps_extension",name:"过顶臂屈伸",group:"三头"},
    {id:"lying_triceps_extension",name:"仰卧臂屈伸",group:"三头"},
    {id:"close_grip_bench",name:"窄握卧推",group:"三头/胸"},

    {id:"squat",name:"深蹲",group:"股四头/臀"},
    {id:"front_squat",name:"颈前深蹲",group:"股四头/臀"},
    {id:"legpress",name:"倒蹬机",group:"股四头/臀"},
    {id:"hack_squat",name:"哈克深蹲",group:"股四头"},
    {id:"bulgarian_split_squat",name:"保加利亚深蹲",group:"股四头/臀"},
    {id:"walking_lunge",name:"行走弓步",group:"股四头/臀"},
    {id:"leg_extension",name:"腿屈伸",group:"股四头"},
    {id:"rdl",name:"罗马尼亚硬拉",group:"腘绳肌/臀"},
    {id:"single_leg_rdl",name:"单腿硬拉",group:"腘绳肌/臀"},
    {id:"leg_curl",name:"腿弯举",group:"腘绳肌"},
    {id:"seated_leg_curl",name:"坐姿腿弯举",group:"腘绳肌"},
    {id:"hip_thrust",name:"臀推",group:"臀"},
    {id:"back_extension",name:"山羊挺身",group:"臀/腘绳肌"},
    {id:"deadlift",name:"硬拉",group:"臀/腘绳肌/背"},
    {id:"adductor",name:"髋内收",group:"大腿内侧"},
    {id:"abductor",name:"髋外展",group:"臀"},

    {id:"standing_calf_raise",name:"站姿提踵",group:"小腿"},
    {id:"seated_calf_raise",name:"坐姿提踵",group:"小腿"},

    {id:"legraise",name:"悬垂举腿",group:"腹/核心"},
    {id:"cable_crunch",name:"绳索卷腹",group:"腹/核心"},
    {id:"ab_wheel",name:"健腹轮",group:"腹/核心"},
    {id:"plank",name:"平板支撑",group:"腹/核心"}
  ];

  const VIDEO_PLANS = [
    {
      id:"push",name:"胸 + 中束 + 三头",
      exerciseIds:["bench","incline_db_press","dip","lying_triceps_extension","y_raise"],
      prescriptions:{
        bench:"1组准备 + 3组正式 · RPE 8",
        incline_db_press:"4 × 12",
        dip:"4 × 12 / 接近力竭",
        lying_triceps_extension:"4 × 15",
        y_raise:"3 × 10 + 短休追加"
      }
    },
    {
      id:"pull",name:"背 + 后束 + 二头",
      exerciseIds:["cable_single_pulldown","neutral_pulldown","machine_single_row","seated_row_high_elbow","cable_curl"],
      prescriptions:{
        cable_single_pulldown:"4 × 12 + 短休追加",
        neutral_pulldown:"4组 · 12 → 8次",
        machine_single_row:"4 × 10 + 短休追加",
        seated_row_high_elbow:"4组 · 15 → 12次",
        cable_curl:"3 × 12"
      }
    },
    {
      id:"legs",name:"臀 + 股四头 + 腘绳肌",
      exerciseIds:["single_leg_rdl","bulgarian_split_squat","front_squat","rdl","back_extension"],
      prescriptions:{
        single_leg_rdl:"4 × 12",
        bulgarian_split_squat:"4 × 10",
        front_squat:"3 × 15",
        rdl:"3 × 12",
        back_extension:"3 × 8"
      }
    }
  ];

  const libraryById = new Map(LIBRARY.map(x => [x.id,x]));
  const groupOrder = ["胸","胸/三头","背","背/二头","背/后束","肩","肩/后束","二头","三头","三头/胸","股四头","股四头/臀","腘绳肌","腘绳肌/臀","臀","臀/腘绳肌","臀/腘绳肌/背","大腿内侧","小腿","腹/核心","其他"];

  const inferBodyweightFactor = name => {
    const n = String(name || "");
    if(/引体向上|双杠臂屈伸/.test(n)) return 1;
    if(/俯卧撑/.test(n)) return .65;
    return 0;
  };

  function normalizeCustomExercise(ex){
    return {
      id:ex?.id || uid("ex"),
      name:String(ex?.name || "未命名动作"),
      group:String(ex?.group || "其他"),
      ...(ex?.bodyweightFactor ? {bodyweightFactor:+ex.bodyweightFactor} : {})
    };
  }

  function normalizeExistingExercise(ex){
    const preset=libraryById.get(ex?.id);
    const factor=+ex?.bodyweightFactor || +preset?.bodyweightFactor || inferBodyweightFactor(ex?.name);
    return {
      id:ex?.id || uid("ex"),
      name:String(ex?.name || preset?.name || "未命名动作"),
      group:String(ex?.group || preset?.group || "其他"),
      ...(factor?{bodyweightFactor:factor}:{})
    };
  }

  function normalizeDB(input){
    const next = clone(input || {});
    next.exercises = Array.isArray(next.exercises) ? next.exercises : [];
    next.plans = Array.isArray(next.plans) ? next.plans : [];
    next.meta = next.meta || {};

    if((+next.meta.trainingSystemVersion || 0) < SYSTEM_VERSION){
      const custom = next.exercises.filter(x => !libraryById.has(x.id)).map(normalizeCustomExercise);
      next.exercises = [...LIBRARY.map(clone), ...custom];

      const customPlans = next.plans.filter(p => !["push","pull","legs"].includes(p.id));
      next.plans = [...VIDEO_PLANS.map(clone), ...customPlans];
      next.meta.trainingSystemVersion = SYSTEM_VERSION;
      next.meta.updatedAt = new Date().toISOString();
    }else{
      next.exercises = next.exercises.map(normalizeExistingExercise);
    }
    return next;
  }

  const getDB = () => window.fitnessApp?.getDB?.() || {exercises:[],plans:[],days:{}};
  const putDB = next => {
    window.fitnessApp.replaceDB(next);
    window.dispatchEvent(new CustomEvent("fitness:changed"));
  };

  const todayString = () => {
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const activeDate = () => {
    const t=$("activeDateLabel")?.textContent.trim() || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : todayString();
  };

  function bodyweightForDate(date,db){
    const rows=Object.values(db.days||{}).filter(d=>d?.weight!=null && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date)));
    if(!rows.length)return null;
    const target=Date.parse(date+"T00:00:00");
    rows.sort((a,b)=>Math.abs(Date.parse(a.date+"T00:00:00")-target)-Math.abs(Date.parse(b.date+"T00:00:00")-target));
    return +rows[0].weight || null;
  }

  function exerciseForEntry(entry,db){
    return db.exercises?.find(x=>x.id===entry.exerciseId) || libraryById.get(entry.exerciseId) || {id:entry.exerciseId,name:entry.exerciseName||"未知动作",group:"其他"};
  }

  function loadPlanToDay(id){
    const db=getDB(), plan=db.plans?.find(x=>x.id===id);if(!plan)return;
    const date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];
    day.planId=plan.id;
    day.planName=plan.name;
    day.planExerciseIds=clone(plan.exerciseIds||[]);
    putDB(db);
    toast(`已载入 ${plan.name}`);
  }

  function clearLoadedPlan(){
    const db=getDB(), day=db.days?.[activeDate()];if(!day)return;
    day.planId="";day.planName="";day.planExerciseIds=[];
    putDB(db);
    toast("已清除当前模板");
  }

  function toast(msg){
    const t=$("toast");if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  }

  function deletePlan(id){
    if(!confirm("删除这个训练模板？"))return;
    const db=getDB();
    db.plans=(db.plans||[]).filter(x=>x.id!==id);
    putDB(db);renderPlans();
  }

  function renderPlans(){
    const box=$("planList");if(!box)return;
    const db=getDB(), plans=db.plans||[];box.innerHTML="";
    if(!plans.length){box.innerHTML='<div class="empty">还没有训练模板。</div>';return}
    plans.forEach(p=>{
      const lines=(p.exerciseIds||[]).map(id=>{
        const ex=db.exercises.find(e=>e.id===id);if(!ex)return "";
        const rx=p.prescriptions?.[id];
        return rx?`${esc(ex.name)} · ${esc(rx)}`:esc(ex.name);
      }).filter(Boolean);
      const d=document.createElement("div");d.className="item";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(p.name)}</div><div class="item-sub">${lines.join("<br>")}</div></div><div class="item-actions"><button class="btn soft" data-load-plan="${esc(p.id)}">载入</button><button class="btn ghost" data-edit-plan="${esc(p.id)}">编辑</button><button class="btn danger" data-del-plan="${esc(p.id)}">删</button></div>`;
      box.appendChild(d);
    });
    box.querySelectorAll("[data-load-plan]").forEach(b=>b.addEventListener("click",()=>loadPlanToDay(b.dataset.loadPlan)));
    box.querySelectorAll("[data-edit-plan]").forEach(b=>b.addEventListener("click",()=>window.openPlanModal?.(b.dataset.editPlan)));
    box.querySelectorAll("[data-del-plan]").forEach(b=>b.addEventListener("click",()=>deletePlan(b.dataset.delPlan)));
  }

  function renderExercises(){
    const box=$("exerciseList");if(!box)return;
    const db=getDB();box.innerHTML="";
    const items=[...(db.exercises||[])].sort((a,b)=>{
      const ai=groupOrder.indexOf(a.group),bi=groupOrder.indexOf(b.group);
      const ag=ai<0?999:ai,bg=bi<0?999:bi;
      return ag-bg || String(a.name).localeCompare(String(b.name),"zh-CN");
    });
    if(!items.length){box.innerHTML='<div class="empty">暂无动作。</div>';return}
    items.forEach(ex=>{
      const d=document.createElement("div");d.className="item";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(ex.name)}</div><div class="item-sub">${esc(ex.group||"其他")}</div></div><div class="item-actions"><button class="btn ghost" data-edit-ex="${esc(ex.id)}">编辑</button><button class="btn danger" data-del-ex="${esc(ex.id)}">删</button></div>`;
      box.appendChild(d);
    });
    box.querySelectorAll("[data-edit-ex]").forEach(b=>b.addEventListener("click",()=>openExerciseModal(b.dataset.editEx)));
    box.querySelectorAll("[data-del-ex]").forEach(b=>b.addEventListener("click",()=>deleteExercise(b.dataset.delEx)));
  }

  function deleteExercise(id){
    if(!confirm("删除这个动作？历史训练不会删除，模板中的该动作会被移除。"))return;
    const db=getDB();
    db.exercises=(db.exercises||[]).filter(x=>x.id!==id);
    (db.plans||[]).forEach(p=>{
      p.exerciseIds=(p.exerciseIds||[]).filter(x=>x!==id);
      if(p.prescriptions)delete p.prescriptions[id];
    });
    putDB(db);renderTrainingPage();refreshTrainingSelector();
  }

  function groupOptions(current=""){
    const vals=["胸","胸/三头","背","背/二头","背/后束","肩","肩/后束","二头","三头","三头/胸","股四头","股四头/臀","腘绳肌","腘绳肌/臀","臀","臀/腘绳肌","臀/腘绳肌/背","大腿内侧","小腿","腹/核心","全身","其他"];
    if(current&&!vals.includes(current))vals.unshift(current);
    return vals.map(x=>`<option${x===current?" selected":""}>${esc(x)}</option>`).join("");
  }

  function simplifyExerciseModal(){
    ["exerciseRepMin","exerciseRepMax","exerciseSets"].forEach(id=>{
      const input=$(id);if(input?.parentElement)input.parentElement.style.display="none";
    });
  }

  function openExerciseModal(id=""){
    simplifyExerciseModal();
    const db=getDB(), ex=db.exercises?.find(x=>x.id===id);
    $("editingExerciseId").value=id;
    $("exerciseModalTitle").textContent=id?"编辑动作":"添加动作";
    $("exerciseName").value=ex?.name||"";
    $("exerciseGroup").innerHTML=groupOptions(ex?.group||"胸");
    $("exerciseModal").classList.add("open");
  }

  function saveExercise(){
    const id=$("editingExerciseId")?.value||"";
    const name=$("exerciseName")?.value.trim()||"";
    if(!name)return toast("填写动作名称");
    const db=getDB(), old=db.exercises?.find(x=>x.id===id);
    const factor=old?.bodyweightFactor || inferBodyweightFactor(name);
    const obj={id:id||uid("ex"),name,group:$("exerciseGroup")?.value||"其他",...(factor?{bodyweightFactor:factor}:{})};
    db.exercises=db.exercises||[];
    const i=db.exercises.findIndex(x=>x.id===id);
    if(i>=0)db.exercises[i]=obj;else db.exercises.push(obj);
    putDB(db);$("exerciseModal")?.classList.remove("open");renderTrainingPage();refreshTrainingSelector();toast("动作已保存");
  }

  function refreshTrainingSelector(){
    const select=$("trainingExercise");if(!select)return;
    const current=select.value, db=getDB();
    select.innerHTML='<option value="">仅记录有氧</option>'+(db.exercises||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
    if([...select.options].some(o=>o.value===current))select.value=current;
  }

  function updateTrainingMode(){
    const modal=$("trainingModal"),select=$("trainingExercise"),cardio=$("trainingCardio");
    if(!modal||!select||!cardio)return;
    const cardioMode=!select.value;
    const db=getDB(), ex=db.exercises?.find(x=>x.id===select.value);
    ["trainingWeight","trainingReps","trainingSets","trainingRir"].forEach(id=>{
      const input=$(id);if(input?.parentElement)input.parentElement.style.display=cardioMode?"none":"block";
    });
    const cardioWrap=cardio.parentElement;
    if(cardioWrap)cardioWrap.style.display=cardioMode?"block":"none";
    cardio.disabled=!cardioMode;
    if(!cardioMode)cardio.value="";

    const selectWrap=select.parentElement;
    if(selectWrap)selectWrap.className="c6";
    if(cardioWrap&&cardioMode)cardioWrap.className="c6";

    const weightLabel=$("trainingWeight")?.previousElementSibling;
    if(weightLabel?.tagName==="LABEL")weightLabel.textContent=(+ex?.bodyweightFactor||0)>0?"额外负重 kg（可选）":"重量 kg";
    const selectLabel=select.previousElementSibling;
    if(selectLabel?.tagName==="LABEL")selectLabel.textContent=cardioMode?"记录类型":"动作";
    const cardioLabel=cardio.previousElementSibling;
    if(cardioLabel?.tagName==="LABEL")cardioLabel.textContent="有氧分钟";

    const title=modal.querySelector(".section h2");if(title)title.textContent=cardioMode?"记录有氧":"记录力量训练";
    const save=$("saveTrainingBtn");if(save)save.textContent=cardioMode?"保存有氧":"保存训练";
    const hint=modal.querySelector(".row + .meta");
    if(hint)hint.textContent=cardioMode?"填写本次有氧分钟即可。":((+ex?.bodyweightFactor||0)>0?"自重已计入负重，只有额外负重时才填写重量。":"");
  }

  function openTrainingModalPatched(exerciseId=""){
    refreshTrainingSelector();
    $("trainingExercise").value=exerciseId||"";
    $("trainingWeight").value="";$("trainingReps").value="";$("trainingSets").value=1;$("trainingRir").value="";$("trainingCardio").value="";
    $("trainingModal").classList.add("open");
    updateTrainingMode();
  }

  function strengthMap(){
    const db=getDB(), map={};
    Object.values(db.days||{}).forEach(day=>(day.training||[]).forEach(x=>{
      if(!x.exerciseId||!x.reps)return;
      const ex=exerciseForEntry(x,db), factor=+ex.bodyweightFactor||inferBodyweightFactor(ex.name), external=+x.weight||0;
      let load=external, bw=null, kind="weight";
      if(factor>0){
        bw=bodyweightForDate(day.date,db);
        if(!bw){
          const m=map[x.exerciseId]||{exercise:ex,e1rm:0,bestSet:"",date:"",missingBodyweight:true,lastDate:""};
          m.missingBodyweight=true;if(!m.lastDate||day.date>m.lastDate)m.lastDate=day.date;map[x.exerciseId]=m;return;
        }
        load=bw*factor+external;kind="bodyweight";
      }
      if(load<=0)return;
      const rm=load*(1+(+x.reps||0)/30);
      const m=map[x.exerciseId]||{exercise:ex,e1rm:0,bestSet:"",date:"",missingBodyweight:false,lastDate:"",kind};
      if(rm>m.e1rm){
        m.e1rm=rm;m.date=day.date;m.kind=kind;m.bw=bw;m.external=external;
        m.bestSet=kind==="bodyweight"?(external>0?`自重 ${fmt(bw)}kg + ${fmt(external)}kg × ${x.reps}`:`自重 ${fmt(bw)}kg × ${x.reps}`):`${fmt(external)}kg × ${x.reps}`;
      }
      if(!m.lastDate||day.date>m.lastDate)m.lastDate=day.date;
      map[x.exerciseId]=m;
    }));
    return map;
  }

  function renderStrength(){
    const box=$("strengthList");if(!box)return;
    const map=strengthMap(), items=Object.values(map).sort((a,b)=>(b.e1rm||0)-(a.e1rm||0));box.innerHTML="";
    if(!items.length){box.innerHTML='<div class="empty">暂无力量记录。</div>';return}
    items.forEach(x=>{
      const d=document.createElement("div");d.className="item";
      const value=x.e1rm?`${fmt(x.e1rm)}kg`:"-";
      const sub=x.bestSet?`最佳组 ${esc(x.bestSet)} · ${esc(x.date)}`:(x.missingBodyweight?"记录晨重后可估算自重动作RM":"暂无可计算组");
      const label=x.kind==="bodyweight"?"估算总负重1RM":"估算1RM";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(x.exercise.name)}</div><div class="item-sub">${sub}</div></div><div><div class="value">${value}</div><div class="item-sub">${label}</div></div>`;
      box.appendChild(d);
    });
  }

  function planForDay(day,db){
    return db.plans?.find(p=>p.id===day.planId) || db.plans?.find(p=>p.name===day.planName) || null;
  }

  function renderTodayTraining(day){
    const box=$("todayTrainingList");if(!box)return;
    const db=getDB(), groups=[];
    for(const t of day.training||[]){
      let g=groups.find(x=>(x.exerciseId||x.name)===(t.exerciseId||t.exerciseName));
      if(!g){const ex=exerciseForEntry(t,db);g={exerciseId:t.exerciseId,name:ex.name,items:[]};groups.push(g)}
      g.items.push(t);
    }
    box.innerHTML="";
    const recordedIds=new Set(groups.map(x=>x.exerciseId));
    groups.forEach(g=>{
      const ex=db.exercises.find(e=>e.id===g.exerciseId)||{};
      const factor=+ex.bodyweightFactor||inferBodyweightFactor(ex.name);
      const lines=g.items.map(x=>{
        let load;
        if(factor>0)load=(+x.weight||0)>0?`BW + ${fmt(x.weight)}kg`:"BW";
        else load=(+x.weight||0)>0?`${fmt(x.weight)}kg`:"重量未填";
        return `${load} × ${x.reps||"-"} × ${x.sets||1}组${x.rir!==""&&x.rir!=null?` · RIR ${x.rir}`:""}`;
      });
      const d=document.createElement("div");d.className="item";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(g.name)}</div><div class="item-sub">${lines.join("<br>")}</div></div><div class="item-actions">${g.items.map(x=>`<button class="btn danger" data-del-training="${esc(x.id)}">删</button>`).join("")}</div>`;
      box.appendChild(d);
    });

    const plan=planForDay(day,db);
    (day.planExerciseIds||[]).filter(id=>!recordedIds.has(id)).forEach(id=>{
      const ex=db.exercises.find(e=>e.id===id);if(!ex)return;
      const rx=plan?.prescriptions?.[id]||ex.group||"";
      const d=document.createElement("div");d.className="item";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(ex.name)}</div><div class="item-sub">${esc(rx)}</div></div><button class="btn soft" data-record-ex="${esc(ex.id)}">记录</button>`;
      box.appendChild(d);
    });

    if(!groups.length&&!(day.planExerciseIds||[]).length)box.innerHTML='<div class="empty">暂无训练记录。</div>';
    box.querySelectorAll("[data-record-ex]").forEach(b=>b.addEventListener("click",()=>openTrainingModalPatched(b.dataset.recordEx)));
    box.querySelectorAll("[data-del-training]").forEach(b=>b.addEventListener("click",()=>window.deleteTraining?.(b.dataset.delTraining)));
    syncPlanHint(day);
  }

  function syncPlanHint(day){
    const hint=$("planHint");if(!hint)return;
    const section=hint.closest(".section");
    let clear=$("clearLoadedPlanBtn");
    if(day.planName||(day.planExerciseIds||[]).length){
      hint.textContent=day.planName?`模板：${day.planName}`:"已载入模板";
      if(!clear){
        clear=document.createElement("button");clear.id="clearLoadedPlanBtn";clear.className="btn ghost";clear.textContent="清除模板";
        clear.addEventListener("click",clearLoadedPlan);
        section?.appendChild(clear);
      }
      clear.style.display="inline-block";
    }else{
      hint.textContent="";
      if(clear)clear.style.display="none";
    }
  }

  function renderTrainingPage(){renderPlans();renderExercises();renderStrength()}

  function hookExerciseButtons(){
    const newBtn=$("newExerciseBtn"),saveBtn=$("saveExerciseBtn");
    if(newBtn&&!newBtn.dataset.simpleExercise){
      newBtn.dataset.simpleExercise="1";
      newBtn.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();openExerciseModal()},true);
    }
    if(saveBtn&&!saveBtn.dataset.simpleExercise){
      saveBtn.dataset.simpleExercise="1";
      saveBtn.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();saveExercise()},true);
    }
  }

  function hookTraining(){
    window.renderPlans=renderPlans;
    window.renderExercises=renderExercises;
    window.renderStrength=renderStrength;
    window.renderTrainingPage=renderTrainingPage;
    window.renderTodayTraining=renderTodayTraining;
    window.openTrainingModal=openTrainingModalPatched;
    window.openExerciseModal=openExerciseModal;

    const select=$("trainingExercise");
    if(select&&!select.dataset.modeSwitchReady){select.dataset.modeSwitchReady="1";select.addEventListener("change",updateTrainingMode)}
    hookExerciseButtons();simplifyExerciseModal();refreshTrainingSelector();
  }

  function wrapReplaceDB(){
    if(window.fitnessApp.__trainingNormalizeReady)return;
    const old=window.fitnessApp.replaceDB.bind(window.fitnessApp);
    window.fitnessApp.replaceDB=incoming=>old(normalizeDB(incoming));
    window.fitnessApp.__trainingNormalizeReady=true;
  }

  function migrateCurrent(){
    const current=getDB(), normalized=normalizeDB(current);
    if(JSON.stringify(current)!==JSON.stringify(normalized))putDB(normalized);
  }

  function setup(){
    if(!window.fitnessApp)return setTimeout(setup,60);
    wrapReplaceDB();
    migrateCurrent();
    hookTraining();
    renderTrainingPage();
    const day=getDB().days?.[activeDate()];
    if(day)renderTodayTraining(day);
    window.addEventListener("fitness:changed",()=>{
      requestAnimationFrame(()=>{
        refreshTrainingSelector();renderTrainingPage();
        const d=getDB().days?.[activeDate()];if(d)syncPlanHint(d);
      });
    });
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();

(() => {
  const load = () => {
    if (document.querySelector('script[data-history-system]')) return;
    const s = document.createElement('script');
    s.src = 'history-system.js?v=20';
    s.dataset.historySystem = '1';
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(load,0);
  else window.addEventListener('load',load,{once:true});
})();
