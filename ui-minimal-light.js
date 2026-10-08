(() => {
  if(window.__FITNESS_MINIMAL_LIGHT__)return;
  window.__FITNESS_MINIMAL_LIGHT__=true;
  const $=id=>document.getElementById(id);
  if(!document.querySelector('link[data-minimal-light]')){
    const link=document.createElement("link");link.rel="stylesheet";link.href="ui-minimal-light.css?v=1";link.dataset.minimalLight="1";document.head.appendChild(link);
  }
  const pad=n=>String(n).padStart(2,"0");
  const today=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const fmt=(n,d=0)=>Number.isFinite(+n)?Number(n).toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1"):"0";
  const foodTotals=day=>(day&&day.foods||[]).reduce((s,f)=>{
    let c=0,p=0,fa=0;
    if(f.totalMacros){c=+f.totalC||0;p=+f.totalP||0;fa=+f.totalF||0}
    else{const q=(+f.grams||0)/100;c=(+f.c||0)*q;p=(+f.p||0)*q;fa=(+f.f||0)*q}
    s.c+=c;s.p+=p;s.f+=fa;return s;
  },{c:0,p:0,f:0});
  const calories=m=>m.c*4+m.p*4+m.f*9;

  function ensureHome(){
    const home=$("v3Home"),stack=home&&home.querySelector(".v3-action-stack");if(!home||!stack)return false;
    if(!$("minimalToday")){
      const section=document.createElement("section");section.id="minimalToday";
      section.innerHTML=
        '<article class="minimal-card"><div class="minimal-card-head"><h3>晨重</h3><small id="minimalWeightStatus"></small></div><div class="minimal-weight-row"><input id="minimalWeightInput" type="number" inputmode="decimal" step="0.05" placeholder="kg"><button id="minimalWeightSave" class="minimal-weight-save" type="button">保存</button></div></article>'+
        '<article class="minimal-card"><div class="minimal-card-head"><h3>今日训练</h3><small id="minimalTrainingStatus"></small></div><div class="minimal-value" id="minimalTrainingValue">未记录</div><div class="minimal-sub" id="minimalTrainingSub"></div><div class="minimal-actions"><button type="button" class="minimal-primary" id="minimalTrainRecord">记录训练</button><button type="button" class="minimal-secondary" id="minimalTrainDetail">查看详情</button></div></article>'+
        '<article class="minimal-card"><div class="minimal-card-head"><h3>今日饮食</h3><small id="minimalFoodStatus"></small></div><div class="minimal-macros"><div class="minimal-macro"><small>热量</small><b id="minimalKcal">0</b></div><div class="minimal-macro"><small>碳水</small><b id="minimalC">0g</b></div><div class="minimal-macro"><small>蛋白质</small><b id="minimalP">0g</b></div><div class="minimal-macro"><small>脂肪</small><b id="minimalF">0g</b></div></div><div class="minimal-actions"><button type="button" class="minimal-primary" id="minimalFoodRecord">记录食物</button><button type="button" class="minimal-secondary" id="minimalFoodDetail">查看详情</button></div></article>'+
        '<button type="button" class="minimal-progress-btn" id="minimalProgress"><b>我的进度</b><span>›</span></button>';
      stack.parentElement.insertBefore(section,stack);
      $("minimalWeightSave").onclick=saveWeight;
      $("minimalWeightInput").addEventListener("keydown",e=>{if(e.key==="Enter")saveWeight()});
      $("minimalTrainRecord").onclick=()=>$("v3StartTraining")&&$("v3StartTraining").click();
      $("minimalTrainDetail").onclick=()=>$("v3Records")&&$("v3Records").click();
      $("minimalFoodRecord").onclick=()=>$("v3Food")&&$("v3Food").click();
      $("minimalFoodDetail").onclick=()=>$("v3Records")&&$("v3Records").click();
      $("minimalProgress").onclick=()=>$("v3Progress")&&$("v3Progress").click();
    }
    refreshHome();
    return true;
  }

  function saveWeight(){
    const input=$("minimalWeightInput"),value=+((input&&input.value)||0);if(!(value>0))return;
    const db=clone(window.fitnessApp&&window.fitnessApp.getDB?window.fitnessApp.getDB():{}),date=today();
    db.days=db.days||{};
    db.days[date]=db.days[date]||{date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
    db.days[date].weight=value;
    window.fitnessApp&&window.fitnessApp.replaceDB&&window.fitnessApp.replaceDB(db);
    input.blur();
  }

  function refreshHome(){
    const db=window.fitnessApp&&window.fitnessApp.getDB?window.fitnessApp.getDB():null;if(!db||!$("minimalToday"))return;
    const day=db.days&&db.days[today()]||{},weight=day.weight,m=foodTotals(day),rows=day.training||[];
    const exerciseCount=new Set(rows.map(x=>x.exerciseId||x.exerciseName)).size;
    const sets=rows.reduce((n,x)=>n+Math.max(1,+x.sets||1),0),cardio=+day.cardio||0;
    if($("minimalWeightInput")&&document.activeElement!==$("minimalWeightInput"))$("minimalWeightInput").value=weight==null?"":weight;
    if($("minimalWeightStatus"))$("minimalWeightStatus").textContent=weight!=null?fmt(weight,2)+" kg":"今天未记录";
    if($("minimalTrainingStatus"))$("minimalTrainingStatus").textContent=rows.length||cardio?"已记录":"未记录";
    if($("minimalTrainingValue"))$("minimalTrainingValue").textContent=exerciseCount?exerciseCount+" 个动作":cardio?"有氧":"未记录";
    if($("minimalTrainingSub"))$("minimalTrainingSub").textContent=[sets?sets+" 组":"",cardio?cardio+" min 有氧":""].filter(Boolean).join(" · ");
    if($("minimalFoodStatus"))$("minimalFoodStatus").textContent=(day.foods||[]).length?(day.foods.length+" 条记录"):"未记录";
    if($("minimalKcal"))$("minimalKcal").textContent=Math.round(calories(m));
    if($("minimalC"))$("minimalC").textContent=Math.round(m.c)+"g";
    if($("minimalP"))$("minimalP").textContent=Math.round(m.p)+"g";
    if($("minimalF"))$("minimalF").textContent=Math.round(m.f)+"g";
  }

  function recordDays(db){
    return Object.values(db.days||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d.date))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  function cutoffDays(days,n){
    const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-(n-1));
    return days.filter(d=>new Date(d.date+"T00:00:00")>=start);
  }
  function hasRecord(d){return d&&(d.weight!=null||(d.training||[]).length||(d.foods||[]).length||(+d.cardio||0)>0)}
  function streak(days){
    const map=new Map(days.map(d=>[d.date,d])),cur=new Date();cur.setHours(0,0,0,0);
    if(!hasRecord(map.get(today())))cur.setDate(cur.getDate()-1);
    let n=0;
    for(let i=0;i<3650;i++){
      const key=cur.getFullYear()+"-"+pad(cur.getMonth()+1)+"-"+pad(cur.getDate());
      if(!hasRecord(map.get(key)))break;n++;cur.setDate(cur.getDate()-1);
    }
    return n;
  }

  function refreshProgress(){
    const grid=$("page-progress")&&$("page-progress").querySelector(".grid");if(!grid)return;
    let card=$("minimalProgressStatsCard");
    if(!card){
      card=document.createElement("div");card.id="minimalProgressStatsCard";card.className="v3-progress-card";
      const anchor=$("v3ProgressOverview");if(anchor)anchor.insertAdjacentElement("afterend",card);else grid.insertBefore(card,grid.firstChild);
    }
    const db=window.fitnessApp&&window.fitnessApp.getDB?window.fitnessApp.getDB():{},days=recordDays(db),d7=cutoffDays(days,7),d30=cutoffDays(days,30);
    const isTraining=x=>(x.training||[]).length>0||(+x.cardio||0)>0;
    const setCount=x=>(x.training||[]).reduce((n,r)=>n+Math.max(1,+r.sets||1),0);
    const food7=d7.filter(x=>(x.foods||[]).length),target=db.settings||{},tp=+target.p||0,tk=+target.kcal||0;
    const fs=food7.map(d=>{const m=foodTotals(d);return{p:m.p,k:calories(m)}});
    const proteinHit=fs.length&&tp?Math.round(fs.filter(x=>x.p>=tp*.9).length/fs.length*100):null;
    const kcalHit=fs.length&&tk?Math.round(fs.filter(x=>x.k>=tk*.9&&x.k<=tk*1.1).length/fs.length*100):null;
    const avgK=fs.length?Math.round(fs.reduce((a,x)=>a+x.k,0)/fs.length):null;
    const t7=d7.filter(isTraining).length,t30=d30.filter(isTraining).length,s7=d7.reduce((a,x)=>a+setCount(x),0),s30=d30.reduce((a,x)=>a+setCount(x),0);
    card.innerHTML='<div class="v3-progress-head"><h2>执行概览</h2><span>训练与记录</span></div><div id="minimalProgressStats">'+
      '<div class="minimal-progress-stat"><small>近 7 天训练</small><b>'+t7+' 天</b><span>'+s7+' 组力量训练</span></div>'+
      '<div class="minimal-progress-stat"><small>近 30 天训练</small><b>'+t30+' 天</b><span>'+s30+' 组力量训练</span></div>'+
      '<div class="minimal-progress-stat"><small>蛋白达标率</small><b>'+(proteinHit==null?"-":proteinHit+"%")+'</b><span>≥90% 目标 · 近7天有记录日</span></div>'+
      '<div class="minimal-progress-stat"><small>热量目标范围</small><b>'+(kcalHit==null?"-":kcalHit+"%")+'</b><span>'+(avgK==null?"暂无饮食记录":"平均 "+avgK+" kcal")+'</span></div>'+
      '<div class="minimal-progress-stat"><small>连续记录</small><b>'+streak(days)+' 天</b><span>晨重 / 饮食 / 训练任一记录</span></div>'+
      '<div class="minimal-progress-stat"><small>近 7 天有氧</small><b>'+d7.reduce((a,x)=>a+(+x.cardio||0),0)+' min</b><span>训练记录中的有氧</span></div></div>';
  }

  function tick(){ensureHome();refreshHome();refreshProgress()}
  window.addEventListener("fitness:changed",()=>setTimeout(tick,0));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")tick()});
  const observer=new MutationObserver(()=>{if($("v3Home")&&!$("minimalToday"))tick();if($("page-progress")&&$("page-progress").classList.contains("active"))refreshProgress()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden"]});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(tick,100),{once:true});else setTimeout(tick,100);
})();