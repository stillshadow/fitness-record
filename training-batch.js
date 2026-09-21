(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const time = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
  const prettyDate = s => { const [y,m,d]=String(s).split('-').map(Number), n=new Date(y,m-1,d), now=new Date(); return s===today()?'今天':`${n.getFullYear()!==now.getFullYear()?n.getFullYear()+'年':''}${n.getMonth()+1}月${n.getDate()}日`; };
  const getDB = () => window.fitnessApp?.getDB?.() || {exercises:[],plans:[],days:{}};
  const clone = x => JSON.parse(JSON.stringify(x));
  const CARDIO_ID = "__cardio__";

  let drafts = [];
  let previous = new Map();
  let workoutId = '';
  let editDate = today();
  let hadExistingTraining = false;

  try { localStorage.removeItem('chibianyingActiveWorkoutV2'); } catch {}

  function toast(msg){
    const t=$('toast'); if(!t) return;
    t.textContent=msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),1600);
  }

  function categoryOrder(group){
    const g=String(group||'');
    if(g.startsWith('胸')) return 1;
    if(g.startsWith('背')) return 2;
    if(g.startsWith('肩')) return 3;
    if(g.startsWith('二头')) return 4;
    if(g.startsWith('三头')) return 5;
    if(/股四头|腘绳肌|臀|大腿/.test(g)) return 6;
    if(g.startsWith('小腿')) return 7;
    if(/腹|核心/.test(g)) return 8;
    return 9;
  }

  function prescribedSetCount(text, fallback=3){
    text=String(text||'');
    let m=text.match(/(\d+)\s*组准备\s*\+\s*(\d+)\s*组正式/); if(m) return Math.max(1,+m[1]+ +m[2]);
    m=text.match(/^\s*(\d+)\s*[×xX]/); if(m) return Math.max(1,+m[1]);
    m=text.match(/^\s*(\d+)\s*组/); if(m) return Math.max(1,+m[1]);
    return Math.max(1,+fallback||3);
  }

  function previousMap(db,beforeDate=editDate){
    const out=new Map();
    const dates=Object.keys(db.days||{}).filter(d=>d<beforeDate).sort().reverse();
    for(const date of dates){
      const rows=db.days?.[date]?.training||[];
      const grouped=new Map();
      rows.forEach(r=>{ if(!r.exerciseId) return; if(!grouped.has(r.exerciseId)) grouped.set(r.exerciseId,[]); grouped.get(r.exerciseId).push(r); });
      for(const [id,items] of grouped){ if(!out.has(id)) out.set(id,{date,items:items.sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0))}); }
      if(out.size >= (db.exercises||[]).length) break;
    }
    return out;
  }

  function blankSet(exerciseId,index){
    const p=previous.get(exerciseId)?.items?.[index] || previous.get(exerciseId)?.items?.at?.(-1) || null;
    return {weight:'',reps:'',rir:'',hintWeight:p?.weight>0?String(p.weight):'',hintReps:p?.reps>0?String(p.reps):''};
  }

  function draftForExercise(ex, count=3, existing=[]){
    const sets=existing.length
      ? existing.map((r,i)=>({weight:r.weight>0?String(r.weight):'',reps:r.reps>0?String(r.reps):'',rir:r.rir===''||r.rir==null?'':String(r.rir),hintWeight:'',hintReps:''}))
      : Array.from({length:count},(_,i)=>blankSet(ex.id,i));
    return {kind:"exercise",exerciseId:ex.id,exerciseName:ex.name,group:ex.group||'',sets};
  }

  function cardioDraft(minutes=''){
    return {kind:"cardio",exerciseId:CARDIO_ID,exerciseName:"有氧",group:"有氧",minutes:+minutes>0?String(+minutes):""};
  }

  function expandLegacyRows(rows=[]){
    const out=[];
    rows.forEach(r=>{
      const count=Math.max(1,+r.sets||1);
      for(let i=0;i<count;i++)out.push({...r,sets:1,setIndex:+r.setIndex||i+1});
    });
    return out;
  }

  function loadExisting(date=editDate){
    const db=getDB(), day=db.days?.[date]||{}, rows=day.training||[];
    previous=previousMap(db,date);
    hadExistingTraining=rows.length>0 || (+day.cardio||0)>0;
    workoutId=rows.find(x=>x.workoutId)?.workoutId || uid('workout');

    const groups=[];
    rows.forEach((r,ri)=>{
      const id=r.exerciseId||r.exerciseName||("legacy_"+ri);
      let g=groups.find(x=>x.id===id);
      if(!g){
        const ex=(db.exercises||[]).find(x=>x.id===r.exerciseId)||{id:r.exerciseId||id,name:r.exerciseName||'未知动作',group:''};
        g={id,ex,rows:[],orderIndex:Number.isFinite(+r.orderIndex)?+r.orderIndex:groups.length};
        groups.push(g);
      }
      g.rows.push(...expandLegacyRows([r]));
      if(Number.isFinite(+r.orderIndex))g.orderIndex=Math.min(g.orderIndex,+r.orderIndex);
    });
    groups.forEach(g=>g.rows.sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0)));

    const byId=new Map(groups.map(g=>[g.id,g]));
    const used=new Set(), out=[];
    const sequence=Array.isArray(day.trainingSequence)?day.trainingSequence:[];
    sequence.forEach(step=>{
      if(step?.type==="cardio"){
        if((+day.cardio||0)>0 && !used.has(CARDIO_ID)){out.push(cardioDraft(day.cardio));used.add(CARDIO_ID)}
        return;
      }
      const id=step?.exerciseId||step?.id;
      const g=byId.get(id);
      if(g&&!used.has(id)){out.push(draftForExercise(g.ex,g.rows.length,g.rows));used.add(id)}
    });
    groups.sort((a,b)=>a.orderIndex-b.orderIndex).forEach(g=>{
      if(!used.has(g.id)){out.push(draftForExercise(g.ex,g.rows.length,g.rows));used.add(g.id)}
    });
    if((+day.cardio||0)>0&&!used.has(CARDIO_ID))out.push(cardioDraft(day.cardio));
    drafts=out;
  }

  function loadPlan(planId){
    const db=getDB(), plan=(db.plans||[]).find(p=>p.id===planId); if(!plan) return;
    drafts=(plan.exerciseIds||[]).map(id=>{
      if(id===CARDIO_ID)return cardioDraft("");
      const ex=(db.exercises||[]).find(e=>e.id===id); if(!ex) return null;
      const count=prescribedSetCount(plan.prescriptions?.[id], ex.sets||3);
      return draftForExercise(ex,count);
    }).filter(Boolean);
    render();
  }

  function ensureUI(){
    if($('batchTrainingModal')) return;
    const style=document.createElement('style'); style.id='batchTrainingStyle'; style.textContent=`
      #batchTrainingModal .modal-panel{width:min(760px,100%);max-height:92vh;padding:14px}
      .batch-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.batch-head h2{margin:0;font-size:18px}.batch-head small{display:block;color:var(--muted);font-size:10px;margin-top:2px}
      .batch-planbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-bottom:11px}.batch-planbar select{min-height:42px}.batch-planbar .btn{min-width:86px}
      .batch-list{display:grid;gap:10px}.batch-ex{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:11px}.batch-ex-head{display:flex;align-items:start;justify-content:space-between;gap:10px;margin-bottom:9px}.batch-ex-head b{font-size:14px}.batch-ex-head small{display:block;color:var(--muted);font-size:10px;margin-top:2px}.batch-ex-actions{display:flex;gap:4px;align-items:center}.batch-move,.batch-remove{border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:8px;min-width:32px;height:30px;padding:0 7px}.batch-remove{color:var(--bad)}
      .batch-set-head,.batch-set{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,.8fr) minmax(0,.65fr) 28px;gap:6px;align-items:center}.batch-set-head{font-size:10px;color:var(--muted);padding:0 2px 5px}.batch-set{margin-bottom:6px}.batch-set-index{text-align:center;color:var(--muted);font-size:11px}.batch-set input{padding:8px 7px;text-align:center}.batch-set-del{height:34px;border:0;background:transparent;color:var(--muted);font-size:18px}.batch-add-set{width:100%;margin-top:2px;border:1px dashed var(--line);background:transparent;color:var(--muted);border-radius:10px;padding:7px}
      .batch-add-ex{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;margin-top:10px}.batch-cardio-fields{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.batch-cardio-fields input{min-height:42px}.batch-empty{border:1px dashed var(--line);border-radius:14px;padding:22px 12px;text-align:center;color:var(--muted);font-size:12px}.batch-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:12px;position:sticky;bottom:-14px;background:linear-gradient(180deg,transparent,var(--panel) 28%);padding:18px 0 14px}
      @media(max-width:430px){#batchTrainingModal{padding:8px}.batch-set-head,.batch-set{grid-template-columns:24px minmax(0,1fr) minmax(56px,.72fr) minmax(48px,.58fr) 24px;gap:4px}.batch-ex{padding:9px}.batch-set input{padding:8px 4px}.batch-actions{bottom:-14px}}
    `; document.head.appendChild(style);

    const modal=document.createElement('div'); modal.className='modal'; modal.id='batchTrainingModal';
    modal.innerHTML=`<div class="modal-panel"><div class="batch-head"><div><h2>记录训练</h2><small id="batchDateText">训练结束后一次录完整场</small></div><button type="button" class="btn ghost" id="batchClose">关闭</button></div><div class="batch-planbar"><select id="batchPlan"></select><button type="button" class="btn soft" id="batchLoadPlan">载入模板</button></div><div id="batchTrainingList" class="batch-list"></div><div class="batch-add-ex"><select id="batchExercise"></select><button type="button" class="btn soft" id="batchAddExercise">＋ 动作</button><button type="button" class="btn soft" id="batchAddCardio">＋ 有氧</button></div><div class="batch-actions"><button type="button" class="btn ghost" id="batchClear">清空训练</button><button type="button" class="btn" id="batchSave">保存训练</button></div></div>`;
    document.body.appendChild(modal);
    $('batchClose').onclick=()=>modal.classList.remove('open');
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
    $('batchLoadPlan').onclick=()=>{const id=$('batchPlan').value;if(id)loadPlan(id)};
    $('batchAddExercise').onclick=addSelectedExercise;
    $('batchAddCardio').onclick=addCardio;
    $('batchClear').onclick=()=>{if(drafts.length&&!confirm('清空当前编辑内容？'))return;drafts=[];render()};
    $('batchSave').onclick=save;
    $('batchTrainingList').addEventListener('input',onInput);
    $('batchTrainingList').addEventListener('click',onClick);
  }

  function fillSelectors(){
    const db=getDB();
    const plans=$('batchPlan');
    plans.innerHTML='<option value="">选择训练模板…</option>'+(db.plans||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const used=new Set(drafts.filter(x=>x.kind!=="cardio").map(x=>x.exerciseId));
    const exs=[...(db.exercises||[])].filter(x=>!used.has(x.id)).sort((a,b)=>categoryOrder(a.group)-categoryOrder(b.group)||String(a.name).localeCompare(String(b.name),'zh-CN'));
    $('batchExercise').innerHTML=exs.length?exs.map(x=>`<option value="${esc(x.id)}">${esc(x.group||'其他')} · ${esc(x.name)}</option>`).join(''):'<option value="">没有更多动作</option>';
    $('batchAddExercise').disabled=!exs.length;
    $('batchAddCardio').disabled=drafts.some(x=>x.kind==="cardio");
  }

  function render(){
    ensureUI(); fillSelectors();
    const label=$('batchDateText'),saveBtn=$('batchSave');
    if(label) label.textContent=`${prettyDate(editDate)} · 训练结束后一次录完整场`;
    if(saveBtn) saveBtn.textContent=editDate===today()?'保存今日训练':'保存这天训练';
    const box=$('batchTrainingList');
    if(!drafts.length){box.innerHTML='<div class="batch-empty">选择一个训练模板，或直接添加这天练过的动作。</div>';return}
    box.innerHTML=drafts.map((d,di)=>{
      const move=`<div class="batch-ex-actions"><button type="button" class="batch-move" data-move-ex="${di}" data-dir="-1" ${di===0?"disabled":""}>↑</button><button type="button" class="batch-move" data-move-ex="${di}" data-dir="1" ${di===drafts.length-1?"disabled":""}>↓</button><button type="button" class="batch-remove" data-remove-ex="${di}">移除</button></div>`;
      if(d.kind==="cardio"){
        return `<section class="batch-ex" data-ex-index="${di}"><div class="batch-ex-head"><div><b>有氧</b><small>作为训练流程的一部分，可自由调整前后顺序</small></div>${move}</div><div class="batch-cardio-fields"><div><label>有氧分钟</label><input data-cardio-minutes type="number" min="0" step="1" inputmode="numeric" value="${esc(d.minutes)}" placeholder="例如 25"></div></div></section>`;
      }
      const p=previous.get(d.exerciseId), last=p?`上次 ${p.date.slice(5)} · ${p.items.map(x=>`${x.weight>0?x.weight+'kg':'BW'}×${x.reps}`).join(' / ')}`:'暂无历史';
      return `<section class="batch-ex" data-ex-index="${di}"><div class="batch-ex-head"><div><b>${esc(d.exerciseName)}</b><small>${esc(d.group||'其他')} · ${esc(last)}</small></div>${move}</div><div class="batch-set-head"><span></span><span>重量 kg</span><span>次数</span><span>RIR</span><span></span></div>${d.sets.map((s,si)=>`<div class="batch-set" data-set-index="${si}"><span class="batch-set-index">${si+1}</span><input data-field="weight" type="number" step="0.5" inputmode="decimal" value="${esc(s.weight)}" placeholder="${esc(s.hintWeight||'kg')}"><input data-field="reps" type="number" step="1" min="0" inputmode="numeric" value="${esc(s.reps)}" placeholder="${esc(s.hintReps||'次')}"><input data-field="rir" type="number" step="1" min="0" max="10" inputmode="numeric" value="${esc(s.rir)}" placeholder="-"><button type="button" class="batch-set-del" data-remove-set="${si}">×</button></div>`).join('')}<button type="button" class="batch-add-set" data-add-set="${di}">＋ 添加一组</button></section>`;
    }).join('');
  }

  function onInput(e){
    const ex=e.target.closest('[data-ex-index]');
    if(e.target.matches('[data-cardio-minutes]')){
      const d=drafts[+ex?.dataset.exIndex];if(d?.kind==="cardio")d.minutes=e.target.value;return;
    }
    const field=e.target.dataset.field; if(!field) return;
    const row=e.target.closest('[data-set-index]'); if(!ex||!row) return;
    const d=drafts[+ex.dataset.exIndex], set=d?.sets?.[+row.dataset.setIndex]; if(set) set[field]=e.target.value;
  }

  function onClick(e){
    const move=e.target.closest('[data-move-ex]');
    if(move){
      const i=+move.dataset.moveEx,j=i+(+move.dataset.dir||0);
      if(j>=0&&j<drafts.length){[drafts[i],drafts[j]]=[drafts[j],drafts[i]];render()}
      return;
    }
    const remEx=e.target.closest('[data-remove-ex]');
    if(remEx){drafts.splice(+remEx.dataset.removeEx,1);render();return}
    const add=e.target.closest('[data-add-set]');
    if(add){const d=drafts[+add.dataset.addSet];if(d){d.sets.push(blankSet(d.exerciseId,d.sets.length));render()}return}
    const rem=e.target.closest('[data-remove-set]');
    if(rem){const ex=rem.closest('[data-ex-index]'),d=drafts[+ex.dataset.exIndex];if(d){d.sets.splice(+rem.dataset.removeSet,1);if(!d.sets.length)d.sets=[blankSet(d.exerciseId,0)];render()}}
  }

  function addSelectedExercise(){
    const id=$('batchExercise').value, db=getDB(), ex=(db.exercises||[]).find(x=>x.id===id); if(!ex) return;
    drafts.push(draftForExercise(ex,Math.max(1,+ex.sets||3))); render();
  }

  function addCardio(){
    if(drafts.some(x=>x.kind==="cardio"))return;
    drafts.push(cardioDraft(""));render();
  }

  function save(){
    const db=getDB();
    const valid=[];
    for(const d of drafts){
      if(d.kind==="cardio")continue;
      d.sets.forEach((set,i)=>{
        const any=String(set.weight).trim()||String(set.reps).trim()||String(set.rir).trim();
        if(any&&!(+set.reps>0))valid.push({error:`${d.exerciseName} 第 ${i+1} 组没有填写次数`});
      });
    }
    const err=valid.find(x=>x.error);if(err)return toast(err.error);

    const rows=[],sequence=[],now=time();
    let cardioMinutes=0;
    drafts.forEach((d,di)=>{
      if(d.kind==="cardio"){
        cardioMinutes=Math.max(0,+d.minutes||0);
        if(cardioMinutes>0)sequence.push({type:"cardio"});
        return;
      }
      const entered=d.sets.filter(set=>+set.reps>0);
      if(!entered.length)return;
      sequence.push({type:"exercise",exerciseId:d.exerciseId});
      const groupId=uid('setgroup');
      entered.forEach((set,i)=>rows.push({
        id:uid('tr'),setGroupId:groupId,setIndex:i+1,orderIndex:di,
        exerciseId:d.exerciseId,exerciseName:d.exerciseName,weight:+set.weight||0,reps:+set.reps||0,
        sets:1,rir:String(set.rir).trim()===''?'':+set.rir,time:now,workoutId
      }));
    });

    const hasAny=rows.length>0||cardioMinutes>0;
    if(!hasAny&&!hadExistingTraining)return toast('至少记录一个动作或有氧');
    if(!hasAny&&hadExistingTraining&&!confirm(`清空${prettyDate(editDate)}的全部训练记录？`))return;

    db.days=db.days||{};
    const date=editDate;
    if(!db.days[date])db.days[date]={date,weight:null,cardio:0,note:'',planExerciseIds:[],planName:'',training:[],foods:[]};
    db.days[date].training=rows;
    db.days[date].cardio=cardioMinutes;
    db.days[date].trainingSequence=sequence;
    db.meta=db.meta||{};db.meta.updatedAt=new Date().toISOString();db.meta.userTouched=true;
    if(window.fitnessApp?.replaceDBQuiet){
      window.fitnessApp.replaceDBQuiet(db);
      window.dispatchEvent(new CustomEvent('fitness:changed'));
      window.dispatchEvent(new CustomEvent('fitness:sync-needed'));
      window.fitnessApp.refresh?.();
    }else window.fitnessApp?.replaceDB?.(db);
    hadExistingTraining=hasAny;
    $('batchTrainingModal')?.classList.remove('open');
    const exerciseCount=new Set(rows.map(x=>x.exerciseId)).size;
    const parts=[];
    if(exerciseCount)parts.push(`${exerciseCount} 个动作 · ${rows.length} 组`);
    if(cardioMinutes)parts.push(`有氧 ${cardioMinutes}min`);
    toast(hasAny?`已记录 ${parts.join(" · ")}`:`已清空${prettyDate(editDate)}训练`);
  }

  function open(date=today(),exerciseId=''){
    ensureUI();
    editDate=validDate(date)?date:today();
    loadExisting(editDate);
    if(exerciseId&&!drafts.some(x=>x.exerciseId===exerciseId)){
      const ex=(getDB().exercises||[]).find(x=>x.id===exerciseId);
      if(ex) drafts.push(draftForExercise(ex,Math.max(1,+ex.sets||3)));
    }
    render(); $('batchTrainingModal').classList.add('open');
  }

  window.openBatchTraining=open;
  window.openTrainingModal=(exerciseId='')=>open(window.fitnessHistoryDate?.()||today(),exerciseId);
})();
