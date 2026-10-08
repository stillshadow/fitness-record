(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
  const fmt = n => Number(n || 0).toFixed(1).replace(/\.0$/,"");
  let currentExerciseId="",editingExerciseId="",editingWorkoutId="",editingLoadType="",currentEquipmentName="",editingEquipmentFilterKey=null,setDrafts=[],savingSets=false;

  const todayString=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const activeDate=()=>{const t=$("activeDateLabel")?.textContent.trim()||"";return /^\d{4}-\d{2}-\d{2}$/.test(t)?t:todayString()};
  const timeString=()=>{const d=new Date();return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};
  const getDB=()=>window.fitnessApp?.getDB?.()||{exercises:[],plans:[],days:{}};
  const putDB=(db,{workout=false}={})=>{
    if(workout&&window.fitnessApp?.replaceDBQuiet){
      window.fitnessApp.replaceDBQuiet(db);
      window.dispatchEvent(new CustomEvent("fitness:workout-changed"));
      window.dispatchEvent(new CustomEvent("fitness:sync-needed"));
      return;
    }
    window.fitnessApp.replaceDB(db);
    window.dispatchEvent(new CustomEvent("fitness:changed"));
  };
  const toast=msg=>{const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800)};
  const workoutContext=()=>{const c=window.fitnessWorkoutContext;return c?.workoutId&&c?.date===activeDate()?c:null};

  function currentExercise(){const id=$("trainingExercise")?.value||"";return (getDB().exercises||[]).find(x=>x.id===id)||null}
  function isStrengthMode(){return !!$("trainingExercise")?.value}
  function loadTypeOf(ex){return window.fitnessLoadTypeOf?.(ex)||(["weight","bodyweight","bodyweight_extra","band"].includes(ex?.loadType)?ex.loadType:((+ex?.bodyweightFactor||0)>0?"bodyweight_extra":"weight"))}
  const equipmentNameOf=x=>window.fitnessEquipmentNameOf?.(x)||String(x?.equipmentName||"").trim().replace(/\s+/g," ");
  const equipmentKey=name=>window.fitnessEquipmentKey?.(name)||String(name||"").trim().replace(/\s+/g," ").toLocaleLowerCase();
  function equipmentOptionsForExercise(exerciseId){
    const db=getDB(),seen=new Set(),out=[];
    Object.keys(db.days||{}).sort().reverse().forEach(date=>{
      [...(db.days?.[date]?.training||[])].reverse().forEach(row=>{
        if(row.exerciseId!==exerciseId)return;
        const name=equipmentNameOf(row),key=equipmentKey(name);
        if(name&&!seen.has(key)){seen.add(key);out.push(name)}
      });
    });
    return out;
  }

  function planPrescription(exerciseId){
    const ctx=workoutContext();
    if(ctx?.prescriptions?.[exerciseId])return ctx.prescriptions[exerciseId];
    const db=getDB(),day=db.days?.[activeDate()];if(!day)return "";
    const plan=(db.plans||[]).find(p=>p.id===day.planId)||(db.plans||[]).find(p=>p.name===day.planName);
    return plan?.prescriptions?.[exerciseId]||"";
  }
  function prescribedSetCount(exerciseId){
    const text=planPrescription(exerciseId);let m=text.match(/(\d+)\s*组准备\s*\+\s*(\d+)\s*组正式/);if(m)return Math.max(1,(+m[1]||0)+(+m[2]||0));
    m=text.match(/^\s*(\d+)\s*[×xX]/);if(m)return Math.max(1,+m[1]||1);
    m=text.match(/^\s*(\d+)\s*组/);if(m)return Math.max(1,+m[1]||1);
    return 1;
  }

  const blankSet=(weight="",resistanceLabel="")=>({weight:String(weight??""),resistanceLabel:String(resistanceLabel??""),reps:"",rir:""});
  function resetDrafts(exerciseId){
    currentExerciseId=exerciseId||"";
    const opts=exerciseId?equipmentOptionsForExercise(exerciseId):[];
    currentEquipmentName=opts.length===1?opts[0]:"";
    editingEquipmentFilterKey=null;
    setDrafts=Array.from({length:exerciseId?prescribedSetCount(exerciseId):1},()=>blankSet());
  }
  function rowsForEdit(exerciseId,workoutId=""){
    const day=getDB().days?.[activeDate()];
    return (day?.training||[]).filter(x=>{
      if(x.exerciseId!==exerciseId|| (workoutId&&x.workoutId!==workoutId))return false;
      return editingEquipmentFilterKey===null||equipmentKey(equipmentNameOf(x))===editingEquipmentFilterKey;
    });
  }
  function draftsFromExisting(exerciseId,workoutId=""){
    const out=[];rowsForEdit(exerciseId,workoutId).forEach(x=>{for(let i=0;i<Math.max(1,+x.sets||1);i++)out.push({weight:(+x.weight||0)>0?String(+x.weight):"",resistanceLabel:x.resistanceLabel||"",reps:(+x.reps||0)>0?String(+x.reps):"",rir:x.rir===""||x.rir==null?"":String(x.rir)})});
    return out.length?out:[blankSet()];
  }

  function setupStyles(){
    if($("setLoggerStyle"))return;
    const style=document.createElement("style");style.id="setLoggerStyle";
    style.textContent=`
      #strengthSetEditor{margin-top:10px}.set-plan-hint{font-size:12px;color:var(--muted);margin:0 0 8px}.set-equipment{margin:0 0 9px}.set-equipment label{display:block;margin-bottom:5px;font-size:10px;color:var(--muted)}.set-equipment input{width:100%;box-sizing:border-box;min-height:40px}
      .set-grid-head,.set-row{display:grid;grid-template-columns:28px minmax(0,1.2fr) minmax(62px,.75fr) minmax(58px,.65fr) 34px;gap:6px;align-items:center}.set-grid-head{font-size:11px;color:var(--muted);padding:0 2px 5px}.set-row{margin-bottom:7px}.set-index{font-size:12px;color:var(--muted);text-align:center}.set-row input{width:100%;min-width:0;box-sizing:border-box;padding:9px 8px}.set-band-presets{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px 28px}.set-band-preset{border:1px solid var(--line);background:rgba(255,255,255,.025);color:var(--muted);border-radius:999px;min-height:30px;padding:0 10px;font-size:10px}.set-load-static{height:39px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:10px;color:#aab4c3;background:rgba(255,255,255,.025);font-size:11px}.set-delete{height:38px;width:34px;padding:0;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--bad);font-size:17px}.set-toolbar{display:flex;gap:8px;margin-top:3px}.set-toolbar .btn{flex:1}
      .training-card-actions{display:flex!important;gap:7px!important;align-items:center!important;flex-wrap:nowrap!important}.training-card-actions .btn{white-space:nowrap;padding:8px 11px!important;min-width:auto!important}.training-set-lines{line-height:1.7}
      #trainingModal.workout-entry .training-session-hidden-field{display:none!important}
      body.training-save-settling *{transition:none!important}
      @media(max-width:430px){.set-grid-head,.set-row{grid-template-columns:24px minmax(0,1.12fr) minmax(55px,.7fr) minmax(52px,.62fr) 32px;gap:5px}.set-row input{padding:8px 6px}.set-delete{width:32px;height:36px}.training-card-actions .btn{padding:7px 9px!important}}
    `;document.head.appendChild(style);
  }

  function ensureEditor(){
    const modal=$("trainingModal"),row=$("trainingExercise")?.closest(".row");if(!modal||!row)return null;
    let editor=$("strengthSetEditor");if(editor)return editor;
    editor=document.createElement("div");editor.id="strengthSetEditor";row.insertAdjacentElement("afterend",editor);
    editor.addEventListener("input",e=>{
      if(e.target.matches("[data-set-equipment]")){
        currentEquipmentName=e.target.value;
        window.dispatchEvent(new CustomEvent("fitness:equipment-draft-changed",{detail:{exerciseId:currentExerciseId,equipmentName:currentEquipmentName}}));
        return;
      }
      const r=e.target.closest?.(".set-row");if(!r)return;const i=+r.dataset.index;if(!setDrafts[i])return;if(e.target.matches("[data-set-weight]"))setDrafts[i].weight=e.target.value;if(e.target.matches("[data-set-resistance]"))setDrafts[i].resistanceLabel=e.target.value;if(e.target.matches("[data-set-reps]"))setDrafts[i].reps=e.target.value;if(e.target.matches("[data-set-rir]"))setDrafts[i].rir=e.target.value;updateSaveText()
    });
    editor.addEventListener("change",e=>{
      if(!e.target.matches("[data-set-equipment]"))return;
      currentEquipmentName=String(e.target.value||"").trim().replace(/\s+/g," ");
      e.target.value=currentEquipmentName;
      window.dispatchEvent(new CustomEvent("fitness:equipment-draft-changed",{detail:{exerciseId:currentExerciseId,equipmentName:currentEquipmentName}}));
    });
    editor.addEventListener("click",e=>{
      const preset=e.target.closest?.("[data-set-band-preset]");
      if(preset){
        const value=preset.dataset.setBandPreset||"";
        setDrafts.forEach(set=>{if(!String(set.resistanceLabel||"").trim())set.resistanceLabel=value});
        renderEditor();return;
      }
      const del=e.target.closest?.("[data-delete-set]");if(del){setDrafts.splice(+del.dataset.deleteSet,1);if(!setDrafts.length)setDrafts=[blankSet()];renderEditor();return}
      if(e.target.closest?.("#addSetRowBtn")){const last=setDrafts[setDrafts.length-1];setDrafts.push(blankSet(last?.weight||"",last?.resistanceLabel||""));renderEditor();setTimeout(()=>editor.querySelector('.set-row:last-of-type [data-set-reps]')?.focus(),0)}
    });
    return editor;
  }

  function renderEditor(){
    const editor=ensureEditor();if(!editor)return;
    const ex=currentExercise(),type=editingLoadType||loadTypeOf(ex),rx=planPrescription(ex?.id||"");
    const loadLabel=type==="band"?"阻力 / 弹力带":type==="bodyweight"?"自重":type==="bodyweight_extra"?"额外负重":"重量 kg";
    const equipmentOptions=ex?.id?equipmentOptionsForExercise(ex.id):[];
    const equipmentField=(type==="band"||type==="bodyweight")?"":`<div class="set-equipment"><label for="setEquipmentInput">器械 / 设备（可选）</label><input id="setEquipmentInput" data-set-equipment type="text" list="setEquipmentList" value="${esc(currentEquipmentName||"")}" placeholder="例如 Hammer Strength 推胸机"><datalist id="setEquipmentList">${equipmentOptions.map(name=>`<option value="${esc(name)}"></option>`).join("")}</datalist></div>`;
    const bandOptions=Array.isArray(ex?.resistanceOptions)&&ex.resistanceOptions.length?ex.resistanceOptions:(window.fitnessBandResistanceOptions||["30-50lb","50-70lb"]);
    const bandPresets=type==="band"?`<div class="set-band-presets">${bandOptions.map(opt=>`<button type="button" class="set-band-preset" data-set-band-preset="${esc(opt)}">${esc(opt)}</button>`).join("")}</div>`:"";
    const loadField=(set,i)=>{
      if(type==="bodyweight")return '<span class="set-load-static">BW</span>';
      if(type==="band")return `<input data-set-resistance type="text" value="${esc(set.resistanceLabel||"")}" placeholder="黄色 / 红色">`;
      return `<input data-set-weight type="number" step="0.5" inputmode="decimal" value="${esc(set.weight)}" placeholder="${type==="bodyweight_extra"?"0":"kg"}">`;
    };
    editor.innerHTML=`${rx?`<div class="set-plan-hint">计划：${esc(rx)}</div>`:""}${equipmentField}${bandPresets}<div class="set-grid-head"><span></span><span>${loadLabel}</span><span>次数</span><span>RIR</span><span></span></div><div id="setRows">${setDrafts.map((set,i)=>`<div class="set-row" data-index="${i}"><div class="set-index">${i+1}</div>${loadField(set,i)}<input data-set-reps type="number" step="1" min="0" inputmode="numeric" value="${esc(set.reps)}" placeholder="次"><input data-set-rir type="number" step="1" min="0" max="10" inputmode="numeric" value="${esc(set.rir)}" placeholder="-"><button type="button" class="set-delete" data-delete-set="${i}" aria-label="删除第${i+1}组">×</button></div>`).join("")}</div><div class="set-toolbar"><button type="button" class="btn ghost" id="addSetRowBtn">＋ 添加一组</button></div>`;updateSaveText();
  }

  function hideOriginalStrengthInputs(){["trainingWeight","trainingReps","trainingSets","trainingRir"].forEach(id=>{const input=$(id);if(input?.parentElement)input.parentElement.style.display="none"})}
  function setPickerDisabled(disabled){const select=$("trainingExercise"),group=$("trainingGroupFilter");if(select)select.disabled=!!disabled;if(group)group.disabled=!!disabled}
  function applyWorkoutEntryUI(){
    const modal=$("trainingModal"),ctx=workoutContext(),select=$("trainingExercise"),group=$("trainingGroupFilter");if(!modal)return;
    modal.classList.toggle("workout-entry",!!ctx);
    [select,group].forEach(el=>{if(el?.parentElement)el.parentElement.classList.toggle("training-session-hidden-field",!!ctx)});
    if(ctx&&select?.value){const ex=currentExercise(),title=modal.querySelector(".section h2");if(title)title.textContent=ex?.name||"记录训练"}
  }
  function updateSaveText(){const btn=$("saveTrainingBtn");if(!btn||!isStrengthMode())return;const n=setDrafts.filter(x=>+x.reps>0).length;btn.textContent=n?`保存 ${n} 组`:"保存训练"}

  function syncMode(forceReset=false){
    const editor=ensureEditor();if(!editor)return;const id=$("trainingExercise")?.value||"";hideOriginalStrengthInputs();applyWorkoutEntryUI();
    const hint=$("trainingModal")?.querySelector(".row + .meta");if(!id){editor.style.display="none";if(hint)hint.style.display="";return}
    if(!editingExerciseId&&(forceReset||currentExerciseId!==id))resetDrafts(id);if(hint)hint.style.display="none";editor.style.display="block";setPickerDisabled(!!workoutContext()||!!editingExerciseId);renderEditor();
  }

  function openEditTrainingSets(exerciseId,workoutId="",equipmentName=null){
    if(!exerciseId)return;
    editingWorkoutId=workoutId||"";
    editingEquipmentFilterKey=equipmentName===null?null:equipmentKey(equipmentName);
    window.openTrainingModal?.(exerciseId);
    setTimeout(()=>{
      const select=$("trainingExercise");if(select&&select.value!==exerciseId){const opt=[...select.options].find(o=>o.value===exerciseId);if(opt)select.value=exerciseId}
      editingEquipmentFilterKey=equipmentName===null?null:equipmentKey(equipmentName);
      editingExerciseId=exerciseId;currentExerciseId=exerciseId;const existingRows=rowsForEdit(exerciseId,editingWorkoutId);editingLoadType=existingRows.find(x=>["weight","bodyweight","bodyweight_extra","band"].includes(x.loadType))?.loadType||"";currentEquipmentName=equipmentName===null?(equipmentNameOf(existingRows[0]||{})):(String(equipmentName||"").trim().replace(/\s+/g," "));setDrafts=draftsFromExisting(exerciseId,editingWorkoutId);setPickerDisabled(true);
      const title=$("trainingModal")?.querySelector(".section h2"),ex=currentExercise();if(title)title.textContent=workoutContext()?ex?.name||"编辑训练":"编辑力量训练";
      hideOriginalStrengthInputs();applyWorkoutEntryUI();const editor=ensureEditor();if(editor)editor.style.display="block";renderEditor();
    },60);
  }

  function saveStrengthSets(e){
    if(!isStrengthMode())return;e.preventDefault();e.stopImmediatePropagation();
    if(savingSets)return;
    savingSets=true;
    const saveBtn=$("saveTrainingBtn");
    if(saveBtn)saveBtn.disabled=true;
    const ex=currentExercise();if(!ex){savingSets=false;if(saveBtn)saveBtn.disabled=false;return toast("请选择动作")}
    const type=editingLoadType||loadTypeOf(ex);
    for(let i=0;i<setDrafts.length;i++){const s=setDrafts[i],any=String(s.weight).trim()||String(s.resistanceLabel||"").trim()||String(s.reps).trim()||String(s.rir).trim();if(any&&!(+s.reps>0)){savingSets=false;if(saveBtn)saveBtn.disabled=false;return toast(`请填写第 ${i+1} 组次数`)}if(+s.reps>0&&type==="band"&&!String(s.resistanceLabel||"").trim()){savingSets=false;if(saveBtn)saveBtn.disabled=false;return toast(`请填写第 ${i+1} 组弹力带阻力 / 颜色`)}}
    const valid=setDrafts.filter(x=>+x.reps>0);if(!valid.length){savingSets=false;if(saveBtn)saveBtn.disabled=false;return toast("至少记录一组")}
    const ctx=workoutContext(),targetWorkoutId=editingWorkoutId||ctx?.workoutId||"",db=getDB(),date=ctx?.date||activeDate();
    db.days=db.days||{};if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    const day=db.days[date];day.training=day.training||[];
    if(editingExerciseId)day.training=day.training.filter(x=>{
      if(x.exerciseId!==editingExerciseId|| (editingWorkoutId&&x.workoutId!==editingWorkoutId))return true;
      if(editingEquipmentFilterKey===null)return false;
      return equipmentKey(equipmentNameOf(x))!==editingEquipmentFilterKey;
    });
    const groupId=uid("setgroup"),time=timeString(),equipmentName=String(currentEquipmentName||"").trim().replace(/\s+/g," ");
    valid.forEach((s,i)=>day.training.push({id:uid("tr"),setGroupId:groupId,setIndex:i+1,exerciseId:ex.id,exerciseName:ex.name,loadType:type,...(equipmentName?{equipmentName}:{ }),weight:(type==="weight"||type==="bodyweight_extra")?(+s.weight||0):0,...(type==="band"?{resistanceLabel:String(s.resistanceLabel||"").trim()}:{ }),reps:+s.reps||0,sets:1,rir:String(s.rir).trim()===""?"":+s.rir,time,...(targetWorkoutId?{workoutId:targetWorkoutId}:{})}));
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    const wasEdit=!!editingExerciseId;
    editingExerciseId="";editingWorkoutId="";editingLoadType="";editingEquipmentFilterKey=null;currentEquipmentName="";setPickerDisabled(false);

    // Close the input surface before broadcasting the expensive global refresh.
    // On iOS this keeps keyboard dismissal and application rerender out of the same frame.
    const modal=$("trainingModal");
    const active=document.activeElement;
    if(active?.blur)active.blur();
    modal?.classList.remove("open");
    document.body?.classList.add("training-save-settling");

    const message=wasEdit?"训练记录已更新":`已记录 ${valid.length} 组`;
    const inWorkout=!!targetWorkoutId;
    setTimeout(()=>{
      try{
        // Set logging is a hot path. Always write quietly and never broadcast a
        // full app/session rerender while the iOS keyboard is closing.
        if(window.fitnessApp?.replaceDBQuiet) window.fitnessApp.replaceDBQuiet(db);
        else window.fitnessApp?.replaceDB?.(db);

        if(inWorkout){
          const recorded=$("sessionRecorded");
          const recordBtn=$("recordSessionExercise");
          if(recorded)recorded.textContent=`已记录 ${valid.length} 组`;
          if(recordBtn)recordBtn.textContent="查看 / 编辑记录";
        }else{
          window.renderTodayTraining?.(db.days?.[date]);
          requestAnimationFrame(compactTodayTrainingCards);
        }

        // Sync later, after the save/keyboard frame is finished.
        setTimeout(()=>window.dispatchEvent(new CustomEvent("fitness:sync-needed")),450);
        toast(message);
      }finally{
        savingSets=false;
        if(saveBtn)saveBtn.disabled=false;
        document.body?.classList.remove("training-save-settling");
      }
    },220);
  }

  function deleteExerciseRecord(exerciseId,equipmentName=null){
    const db=getDB(),day=db.days?.[activeDate()];if(!day)return;const ex=(db.exercises||[]).find(x=>x.id===exerciseId);
    const eq=equipmentName===null?null:String(equipmentName||"").trim().replace(/\s+/g," ");
    const label=eq?`「${ex?.name||"动作"} · ${eq}」`:(ex?.name?`「${ex.name}」`:"这个动作");
    if(!confirm(`删除${label}当天的全部组记录？`))return;
    const key=eq===null?null:equipmentKey(eq);
    day.training=(day.training||[]).filter(x=>x.exerciseId!==exerciseId||(key!==null&&equipmentKey(equipmentNameOf(x))!==key));
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;putDB(db);toast("训练记录已删除");
  }

  function lineForSet(x,ex,index,total){const type=["weight","bodyweight","bodyweight_extra","band"].includes(x?.loadType)?x.loadType:loadTypeOf(ex),load=type==="band"?(x.resistanceLabel||"弹力带未填"):type==="bodyweight"?"BW":type==="bodyweight_extra"?((+x.weight||0)>0?`BW + ${fmt(x.weight)}kg`:"BW"):((+x.weight||0)>0?`${fmt(x.weight)}kg`:"重量未填"),prefix=total>1?`第${index+1}组 · `:"",rir=x.rir!==""&&x.rir!=null?` · RIR ${x.rir}`:"";return `${prefix}${load} × ${x.reps||"-"}${rir}`}

  function compactTodayTrainingCards(){
    const box=$("todayTrainingList");if(!box)return;const db=getDB(),day=db.days?.[activeDate()];if(!day)return;
    [...box.querySelectorAll(".item")].forEach(card=>{
      const actions=card.querySelector(".item-actions"),oldButtons=actions?.querySelectorAll?.("[data-del-training]");if(!actions||!oldButtons?.length||card.dataset.compactTrainingActions)return;
      const firstId=oldButtons[0].dataset.delTraining,first=(day.training||[]).find(x=>x.id===firstId),exerciseId=first?.exerciseId;if(!exerciseId)return;
      const equipmentName=card.dataset.equipmentName||equipmentNameOf(first),eqKey=equipmentKey(equipmentName);
      const ex=(db.exercises||[]).find(x=>x.id===exerciseId)||{id:exerciseId,name:first.exerciseName||"动作"},rows=(day.training||[]).filter(x=>x.exerciseId===exerciseId&&equipmentKey(equipmentNameOf(x))===eqKey),sub=card.querySelector(".item-sub");
      if(sub){
        sub.classList.add("training-set-lines");
        const equipmentLine=equipmentName?`<div class="training-equipment-line">器械：${esc(equipmentName)}</div>`:"";
        sub.innerHTML=equipmentLine+rows.map((x,i)=>esc(lineForSet(x,ex,i,rows.length))).join("<br>");
      }
      actions.classList.add("training-card-actions");actions.innerHTML=`<button type="button" class="btn ghost" data-edit-exercise-sets="${esc(exerciseId)}">编辑</button><button type="button" class="btn danger" data-delete-exercise-sets="${esc(exerciseId)}">删</button>`;
      actions.querySelector("[data-edit-exercise-sets]")?.addEventListener("click",()=>openEditTrainingSets(exerciseId,"",equipmentName));actions.querySelector("[data-delete-exercise-sets]")?.addEventListener("click",()=>deleteExerciseRecord(exerciseId,equipmentName));card.dataset.compactTrainingActions="1";
    });
  }

  function setupCardObserver(){const box=$("todayTrainingList");if(!box||box.dataset.compactObserver)return;box.dataset.compactObserver="1";new MutationObserver(()=>requestAnimationFrame(compactTodayTrainingCards)).observe(box,{childList:true,subtree:true});window.addEventListener("fitness:changed",()=>requestAnimationFrame(compactTodayTrainingCards));compactTodayTrainingCards()}

  function setup(){
    if(!window.fitnessApp||!$("trainingModal")||!$("saveTrainingBtn"))return setTimeout(setup,80);
    setupStyles();ensureEditor();setupCardObserver();window.editTrainingExerciseSets=openEditTrainingSets;
    const select=$("trainingExercise");if(select&&!select.dataset.perSetReady){select.dataset.perSetReady="1";select.addEventListener("change",()=>setTimeout(()=>syncMode(true),0))}
    const group=$("trainingGroupFilter");if(group&&!group.dataset.perSetReady){group.dataset.perSetReady="1";group.addEventListener("change",()=>setTimeout(()=>syncMode(true),0))}
    $("saveTrainingBtn").addEventListener("click",saveStrengthSets,true);
    const modal=$("trainingModal");
    let modalWasOpen=modal.classList.contains("open");
    new MutationObserver(()=>{
      const isOpen=modal.classList.contains("open");
      if(isOpen===modalWasOpen)return;
      modalWasOpen=isOpen;
      if(isOpen){
        currentExerciseId="";
        setTimeout(()=>syncMode(true),0);
      }else{
        editingExerciseId="";
        editingWorkoutId="";
        editingLoadType="";
        editingEquipmentFilterKey=null;
        currentEquipmentName="";
        setPickerDisabled(false);
        if(modal.classList.contains("workout-entry"))modal.classList.remove("workout-entry");
        ["trainingExercise","trainingGroupFilter"].forEach(id=>{
          const p=$(id)?.parentElement;
          if(p?.classList.contains("training-session-hidden-field"))p.classList.remove("training-session-hidden-field");
        });
      }
    }).observe(modal,{attributes:true,attributeFilter:["class"]});
    setTimeout(()=>{syncMode(true);compactTodayTrainingCards()},0);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));else setTimeout(setup,0);
})();

(() => {
  const load=()=>{if(document.querySelector('script[data-strength-filter]'))return;const s=document.createElement('script');s.src='strength-filter.js?v=52';s.dataset.strengthFilter='1';document.head.appendChild(s)};
  if(document.readyState==='complete')setTimeout(load,0);else window.addEventListener('load',load,{once:true});
})();