(() => {
  if (window.__CHI_BIAN_YING_LAST_PERFORMANCE__) return;
  window.__CHI_BIAN_YING_LAST_PERFORMANCE__ = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n || 0).toFixed(1).replace(/\.0$/,'');
  const getDB = () => window.fitnessApp?.getDB?.() || {days:{},exercises:[]};
  const equipmentNameOf=x=>window.fitnessEquipmentNameOf?.(x)||String(x?.equipmentName||"").trim().replace(/\s+/g," ");
  const equipmentKey=name=>window.fitnessEquipmentKey?.(name)||String(name||"").trim().replace(/\s+/g," ").toLocaleLowerCase();

  function currentExerciseContext(){
    const s = window.getActiveWorkoutSession?.();
    if(!s?.exerciseIds?.length) return null;
    const index = Math.max(0,Math.min(+s.index||0,s.exerciseIds.length-1));
    const exerciseId = s.exerciseIds[index];
    const db = getDB();
    const exercise = (db.exercises||[]).find(x=>x.id===exerciseId);
    if(!exercise) return null;
    return {session:s,exercise,exerciseId,db};
  }

  function previousPerformance(exerciseId,session,exercise,db=getDB()){
    if(!exerciseId||!session?.date)return null;
    const groups=[];
    Object.keys(db.days||{}).filter(d=>d<session.date).sort().reverse().some(date=>{
      const rows=(db.days?.[date]?.training||[]).filter(row=>{
        const same=row.exerciseId===exerciseId||(!row.exerciseId&&row.exerciseName===exercise?.name);
        return same&&row.workoutId!==session.workoutId;
      });
      if(!rows.length)return false;
      const byGroup=new Map();
      rows.forEach(row=>{
        const key=row.workoutId?`wk:${row.workoutId}`:row.setGroupId?`sg:${row.setGroupId}`:`legacy:${date}`;
        if(!byGroup.has(key))byGroup.set(key,{date,time:'00:00',rows:[],ordinal:0});
        const g=byGroup.get(key);g.rows.push(row);if(String(row.time||"")>g.time)g.time=String(row.time||"");
      });
      groups.push(...byGroup.values());return true;
    });
    if(!groups.length)return null;
    groups.sort((a,b)=>String(b.date+b.time).localeCompare(String(a.date+a.time)));
    return groups[0];
  }

  function expandedSets(rows){
    const out=[];
    (rows||[]).forEach(row=>{
      const count=Math.max(1,+row.sets||1);
      for(let i=0;i<count;i++)out.push(row);
    });
    return out;
  }

  function setText(row,exercise){
    const type=["weight","bodyweight","bodyweight_extra","band"].includes(row?.loadType)?row.loadType:(window.fitnessLoadTypeOf?.(exercise)||(["weight","bodyweight","bodyweight_extra","band"].includes(exercise?.loadType)?exercise.loadType:((+exercise?.bodyweightFactor||0)>0?"bodyweight_extra":"weight")));
    const weight=+row.weight||0;
    const load=type==="band"?(row.resistanceLabel||"弹力带未填"):type==="bodyweight"?"BW":type==="bodyweight_extra"?(weight>0?`BW + ${fmt(weight)}kg`:"BW"):(weight>0?`${fmt(weight)}kg`:"未填重量");
    const rir=row.rir!==''&&row.rir!=null?` · RIR ${row.rir}`:'';
    return `${load} × ${+row.reps||'-'}${rir}`;
  }

  function ensurePanel(){
    let panel=$('lastPerformancePanel');
    if(panel)return panel;
    const anchor=$('sessionPrescription');
    if(!anchor)return null;
    panel=document.createElement('div');
    panel.id='lastPerformancePanel';
    panel.className='last-performance';
    panel.hidden=true;
    anchor.insertAdjacentElement('afterend',panel);
    return panel;
  }

  function ensureStyle(){
    if($('lastPerformanceStyle'))return;
    const style=document.createElement('style');
    style.id='lastPerformanceStyle';
    style.textContent=`
      .last-performance{margin:13px 0 2px;padding:11px 12px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
      .last-performance[hidden]{display:none!important}
      .last-performance-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:var(--muted);font-size:10px;letter-spacing:.02em}
      .last-performance-head b{font-size:10px;color:#aab6c9;font-weight:650}
      .last-performance-sets{display:flex;flex-wrap:wrap;gap:6px}
      .last-performance-set{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:5px 8px;border-radius:10px;background:rgba(5,8,13,.34);border:1px solid rgba(255,255,255,.045);color:#e9edf5;font-size:11px;white-space:nowrap}
      .last-performance-set i{font-style:normal;color:#718099;font-size:9px}
      @media(max-width:430px){.last-performance{margin-top:11px;padding:10px}.last-performance-set{font-size:10.5px;padding:5px 7px}}
    `;
    document.head.appendChild(style);
  }

  function render(){
    ensureStyle();
    const panel=ensurePanel();
    if(!panel)return;
    const ctx=currentExerciseContext();
    if(!ctx){panel.hidden=true;return}
    const prev=previousPerformance(ctx.exerciseId,ctx.session,ctx.exercise,ctx.db);
    if(!prev){panel.hidden=true;panel.innerHTML='';return}
    const sets=expandedSets(prev.rows);
    panel.innerHTML=`<div class="last-performance-head"><span>上次成绩</span><b>${esc(displayDate(prev.date))}</b></div><div class="last-performance-sets">${sets.map((row,i)=>`<span class="last-performance-set"><i>${i+1}</i>${esc(setText(row,ctx.exercise))}</span>`).join('')}</div>`;
    panel.hidden=false;
  }

  function setup(){
    if(!window.fitnessApp?.getDB || !window.getActiveWorkoutSession || !$('sessionExerciseName')) return setTimeout(setup,60);
    ensureStyle();ensurePanel();render();
    const name=$('sessionExerciseName');
    new MutationObserver(()=>requestAnimationFrame(render)).observe(name,{childList:true,subtree:true,characterData:true});
    const shell=$('trainingSessionShell');
    if(shell)new MutationObserver(()=>requestAnimationFrame(render)).observe(shell,{attributes:true,attributeFilter:['class']});
    window.addEventListener('fitness:changed',()=>requestAnimationFrame(render));
    window.addEventListener('focus',()=>requestAnimationFrame(render));
    window.getPreviousExercisePerformance=(exerciseId)=>{
      const s=window.getActiveWorkoutSession?.();
      const db=getDB(),ex=(db.exercises||[]).find(x=>x.id===exerciseId);
      return s&&ex?previousPerformance(exerciseId,s,ex,db):null;
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0),{once:true});
  else setTimeout(setup,0);
})();
