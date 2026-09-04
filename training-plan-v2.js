(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const PLAN_VERSION = 1;

  const DEFAULT_PLANS = [
    {
      id:"push",name:"推｜胸 + 中束 + 三头",
      exerciseIds:["bench","incline_machine_press","dip","cable_lateral_raise","overhead_triceps_extension"],
      finisherIds:["legraise"],
      prescriptions:{
        bench:"4 × 6–10",
        incline_machine_press:"3 × 8–12",
        dip:"3 × 8–12 · 前倾",
        cable_lateral_raise:"4 × 12–20",
        overhead_triceps_extension:"3 × 10–15",
        legraise:"3 × 8 · 收尾"
      }
    },
    {
      id:"pull",name:"拉｜背 + 后束 + 二头",
      exerciseIds:["cable_single_pulldown","neutral_pulldown","machine_single_row","seated_row_high_elbow","cable_curl"],
      finisherIds:["legraise"],
      prescriptions:{
        cable_single_pulldown:"3 × 10–12",
        neutral_pulldown:"3 × 8–12",
        machine_single_row:"3 × 8–12",
        seated_row_high_elbow:"3 × 12–15",
        cable_curl:"3 × 10–15",
        legraise:"3 × 8 · 收尾"
      }
    },
    {
      id:"legs",name:"腿｜股四头 + 臀 + 腘绳肌 + 小腿",
      exerciseIds:["front_squat","bulgarian_split_squat","rdl","seated_leg_curl","standing_calf_raise"],
      finisherIds:["legraise"],
      prescriptions:{
        front_squat:"4 × 6–10",
        bulgarian_split_squat:"3 × 8–12",
        rdl:"3 × 8–12",
        seated_leg_curl:"3 × 10–15",
        standing_calf_raise:"4 × 10–15",
        legraise:"3 × 8 · 收尾"
      }
    }
  ];

  const EXTRA_EXERCISES = [
    {id:"incline_machine_press",name:"上斜器械推胸",group:"胸"}
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
    if((+db.meta.personalTrainingPlanVersion||0)>=PLAN_VERSION)return false;
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
    db.meta.updatedAt=new Date().toISOString();
    putDB(db);
    return true;
  }

  function loadPlanWithFinisher(plan){
    const db=getDB(),current=(db.plans||[]).find(x=>x.id===plan.id)||plan;
    const date=activeDate();
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];
    day.planId=current.id;
    day.planName=current.name;
    day.planMainExerciseIds=clone(current.exerciseIds||[]);
    day.planFinisherIds=clone(current.finisherIds||[]);
    day.planExerciseIds=[...day.planMainExerciseIds,...day.planFinisherIds];
    delete day.planOverrides;
    db.meta=db.meta||{};
    db.meta.updatedAt=new Date().toISOString();
    db.meta.userTouched=true;
    putDB(db);
    window.renderTodayTraining?.(day);
    toast(`已载入 ${current.name}`);
  }

  function hookPlanLoading(){
    const box=$("planList");if(!box||box.dataset.personalPlanLoader)return;
    box.dataset.personalPlanLoader="1";
    box.addEventListener("click",e=>{
      const btn=e.target.closest?.("[data-load-plan]");if(!btn)return;
      const plan=(getDB().plans||[]).find(x=>x.id===btn.dataset.loadPlan);
      if(!plan?.finisherIds?.length)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      loadPlanWithFinisher(plan);
    },true);
  }

  function decoratePlanCards(){
    const box=$("planList");if(!box)return;
    const db=getDB();
    box.querySelectorAll("[data-load-plan]").forEach(btn=>{
      const card=btn.closest(".item"),plan=(db.plans||[]).find(x=>x.id===btn.dataset.loadPlan);
      if(!card||!plan?.finisherIds?.length)return;
      const sub=card.querySelector(".item-sub");if(!sub)return;
      let note=card.querySelector(".plan-finisher-note");
      const lines=(plan.finisherIds||[]).map(id=>{
        const ex=(db.exercises||[]).find(x=>x.id===id);
        if(!ex)return "";
        return `收尾：${esc(ex.name)} · ${esc(plan.prescriptions?.[id]||"")}`;
      }).filter(Boolean).join("<br>");
      if(!lines)return;
      if(!note){note=document.createElement("div");note.className="plan-finisher-note";sub.appendChild(note)}
      note.innerHTML=lines;
    });
  }

  function protectFinishers(){
    const day=getDB().days?.[activeDate()];
    const finishers=new Set(day?.planFinisherIds||[]);
    if(!finishers.size)return;
    document.querySelectorAll("[data-replace-plan-ex]").forEach(btn=>{
      if(finishers.has(btn.dataset.replacePlanEx))btn.remove();
    });
  }

  function hookFinisherProtection(){
    const box=$("todayTrainingList");if(!box||box.dataset.finisherProtected)return;
    box.dataset.finisherProtected="1";
    box.addEventListener("click",e=>{
      const btn=e.target.closest?.("[data-replace-plan-ex]");if(!btn)return;
      const day=getDB().days?.[activeDate()];
      if((day?.planFinisherIds||[]).includes(btn.dataset.replacePlanEx)){
        e.preventDefault();e.stopImmediatePropagation();
      }
    },true);
    new MutationObserver(()=>requestAnimationFrame(protectFinishers)).observe(box,{childList:true,subtree:true});
  }

  function setupStyles(){
    if($("personalPlanStyle"))return;
    const style=document.createElement("style");style.id="personalPlanStyle";
    style.textContent=`
      .plan-finisher-note{margin-top:5px;color:var(--accent2);font-weight:750}
      #trainingGuidanceCard .training-cycle{font-size:14px;font-weight:850;letter-spacing:.2px}
      #trainingGuidanceCard details{border-top:1px solid var(--line);padding-top:10px;margin-top:10px}
      #trainingGuidanceCard summary{cursor:pointer;font-weight:800;color:var(--text)}
      #trainingGuidanceCard .guidance-copy{margin-top:9px;color:var(--muted);font-size:13px;line-height:1.75}
      #trainingGuidanceCard .guidance-copy b{color:var(--text)}
    `;
    document.head.appendChild(style);
  }

  function ensureGuidance(){
    if($("trainingGuidanceCard"))return;
    const grid=$("page-training")?.querySelector(".grid"),exercise=$("exerciseList")?.closest(".card");
    if(!grid||!exercise)return;
    const card=document.createElement("div");
    card.id="trainingGuidanceCard";card.className="card s12";
    card.innerHTML=`
      <div class="section"><h2>训练调整备忘</h2><span class="meta">先固定训练，再根据表现调整</span></div>
      <div class="callout"><div class="training-cycle">推 → 拉 → 休 → 推 → 拉 → 腿 → 休</div><div class="meta" style="margin-top:5px">推 / 拉 / 腿各 5 个主动作；每次训练结束悬垂举腿 3 × 8。</div></div>
      <details>
        <summary>执行与进步规则</summary>
        <div class="guidance-copy">
          <b>动作先固定 6–8 周。</b> 优先增加同重量下的次数，稳定到次数区间上沿后再加重量。复合动作大多数正式组保持 RIR 1–2；侧平举、弯举、臂屈伸等孤立动作最后一组可到 RIR 0–1。悬垂举腿不用每次力竭，优先通过减少摆动、腿更直、下降更慢来增加难度。
        </div>
      </details>
      <details>
        <summary>后期什么时候调整</summary>
        <div class="guidance-copy">
          <b>胸：</b>如果连续 2–3 次推日表现下降或肩肘恢复不过来，先把上斜器械或双杠各减 1 组，卧推优先保留。<br>
          <b>背：</b>如果第二个拉日明显疲劳，先让一个辅助背部动作从 3 组降到 2 组，不急着换动作。<br>
          <b>二头：</b>如果 6–8 周后背在进步而二头明显落后，钢线弯举从 3 组加到 4 组，先不新增第六个动作。<br>
          <b>肩：</b>如果肩宽发展落后，钢线侧平举从 4 组加到 5 组；当前不需要单独肩日。<br>
          <b>三头：</b>如果成为卧推瓶颈或围度明显落后，过顶臂屈伸从 3 组加到 4 组；当前不需要单独手臂日。<br>
          <b>腿：</b>目前腿一周一次。如果以后腿部变成重点，优先提高训练频率，而不是把单次腿日无限堆组数。<br>
          <b>恢复：</b>关节不适、同部位持续酸痛超过 3 天、连续数次力量下滑时，先减量或短暂降载，再判断是否需要换动作。
        </div>
      </details>`;
    grid.insertBefore(card,exercise);
  }

  function scheduleDecorate(){
    requestAnimationFrame(()=>{decoratePlanCards();protectFinishers();ensureGuidance()});
  }

  function setup(){
    if(!window.fitnessApp||!$("planList"))return setTimeout(setup,80);
    setupStyles();
    migratePlan();
    hookPlanLoading();
    hookFinisherProtection();
    ensureGuidance();
    decoratePlanCards();
    const plans=$("planList");
    new MutationObserver(scheduleDecorate).observe(plans,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",scheduleDecorate);
    document.querySelectorAll('[data-page="training"]').forEach(b=>b.addEventListener("click",()=>setTimeout(scheduleDecorate,0)));
    setTimeout(()=>{window.renderTrainingPage?.();scheduleDecorate()},0);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();