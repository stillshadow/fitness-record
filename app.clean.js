(() => {
  const STORAGE_KEY="chibianyingDietV2";
  const LEGACY_KEYS=["chibianyingFitnessV1","cutTrackerV2"];
  const $=id=>document.getElementById(id);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=p=>p+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const today=()=>localDate(new Date());
  const DEFAULT_DB={
    version:2,
    settings:{c:200,p:140,f:60,waterGoal:2500},
    foods:[
      {id:"rice",name:"熟米饭",unit:"g",c:25.9,p:2.6,f:0.3},
      {id:"chicken",name:"熟鸡胸肉",unit:"g",c:0,p:31,f:3.6},
      {id:"beef",name:"熟瘦牛肉",unit:"g",c:0,p:27,f:10},
      {id:"egg",name:"鸡蛋",unit:"g",c:0.7,p:12.6,f:9.5},
      {id:"banana",name:"香蕉",unit:"g",c:22.8,p:1.1,f:0.3},
      {id:"skim",name:"脱脂牛奶",unit:"ml",c:5,p:3.4,f:0.2},
      {id:"bread",name:"全麦面包",unit:"g",c:43,p:10,f:4},
      {id:"protein",name:"蛋白粉",unit:"g",c:10,p:75,f:5}
    ],
    meals:[],
    days:{},
    memos:[],
    meta:{updatedAt:null}
  };
  let DB=loadDB();
  let activeDate=today();
  let mealBuilder=[];
  let libraryTab="foods";

  function localDate(d){
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function localTime(d=new Date()){return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
  function shiftDate(date,n){
    const [y,m,d]=date.split("-").map(Number),x=new Date(y,m-1,d);x.setDate(x.getDate()+n);return localDate(x);
  }
  function prettyDate(date){
    const [y,m,d]=date.split("-").map(Number),x=new Date(y,m-1,d),w=["周日","周一","周二","周三","周四","周五","周六"];
    return (date===today()?"今天 · ":"")+m+"月"+d+"日 · "+w[x.getDay()];
  }
  function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function fmt(n,d=1){return Number(n||0).toFixed(d).replace(/\.0+$/,"").replace(/(\.\d*?)0+$/,"$1")}
  function toast(msg){
    const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1700);
  }
  function inferSlot(){
    const h=new Date().getHours();return h<10?"早餐":h<14?"午餐":h<17?"加餐":h<21?"晚餐":"加餐";
  }
  function migrateLegacy(old){
    const next=clone(DEFAULT_DB);
    if(old?.settings){
      next.settings.c=+old.settings.c||next.settings.c;
      next.settings.p=+old.settings.p||next.settings.p;
      next.settings.f=+old.settings.f||next.settings.f;
    }
    if(Array.isArray(old?.foods)&&old.foods.length)next.foods=old.foods.map(x=>({...x}));
    if(Array.isArray(old?.meals))next.meals=old.meals.map(x=>({...x,items:(x.items||[]).map(i=>({...i}))}));
    for(const [date,day] of Object.entries(old?.days||{})){
      if(!Array.isArray(day?.foods)||!day.foods.length)continue;
      next.days[date]={date,foods:day.foods.map(x=>({...x})),waterMl:+day.waterMl||0};
    }
    next.meta.updatedAt=new Date().toISOString();
    return next;
  }
  function loadDB(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){
        const x=JSON.parse(raw);
        return {...clone(DEFAULT_DB),...x,settings:{...clone(DEFAULT_DB.settings),...(x.settings||{})},foods:Array.isArray(x.foods)?x.foods:clone(DEFAULT_DB.foods),meals:Array.isArray(x.meals)?x.meals:[],days:x.days||{},memos:Array.isArray(x.memos)?x.memos:[]};
      }
      const legacy=localStorage.getItem("chibianyingFitnessV1")||localStorage.getItem("cutTrackerV2");
      if(legacy){
        const migrated=migrateLegacy(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        return migrated;
      }
    }catch{}
    return clone(DEFAULT_DB);
  }
  function persist(){
    DB.meta=DB.meta||{};DB.meta.updatedAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(DB));
    window.dispatchEvent(new CustomEvent("diet:changed"));
  }
  function ensureDay(date=activeDate){
    DB.days[date]=DB.days[date]||{date,foods:[],waterMl:0};
    DB.days[date].foods=DB.days[date].foods||[];
    DB.days[date].waterMl=+DB.days[date].waterMl||0;
    return DB.days[date];
  }
  function macroOf(entry,amountOverride){
    if(entry?.totalMacros){
      const C=+entry.totalC||0,P=+entry.totalP||0,F=+entry.totalF||0;
      return {C,P,F,K:C*4+P*4+F*9};
    }
    const amount=amountOverride==null?(+entry?.grams||0):+amountOverride;
    if(entry?.basis==="serving"){
      const C=(+entry.c||0)/100*amount,P=(+entry.p||0)/100*amount,F=(+entry.f||0)/100*amount;
      return {C,P,F,K:C*4+P*4+F*9};
    }
    const q=amount/100,C=(+entry?.c||0)*q,P=(+entry?.p||0)*q,F=(+entry?.f||0)*q;
    return {C,P,F,K:C*4+P*4+F*9};
  }
  function totals(day){
    return (day?.foods||[]).reduce((s,x)=>{const q=macroOf(x);s.C+=q.C;s.P+=q.P;s.F+=q.F;s.K+=q.K;return s},{C:0,P:0,F:0,K:0});
  }
  function progress(value,target){return target>0?Math.min(100,Math.max(0,value/target*100)):0}
  function setBar(id,value,target){const el=$(id);if(el)el.style.width=progress(value,target)+"%"}
  function openModal(id){$(id)?.classList.add("open")}
  function closeModal(id){$(id)?.classList.remove("open")}

  function renderDiet(){
    const day=ensureDay(),sum=totals(day),s=DB.settings,targetK=s.c*4+s.p*4+s.f*9;
    $("dateLabel").textContent=prettyDate(activeDate);
    $("dateInput").value=activeDate;$("dateInput").max=today();
    $("nextDate").disabled=activeDate>=today();
    $("macroC").textContent=fmt(sum.C)+"g";$("targetC").textContent="/ "+fmt(s.c)+"g";
    $("macroP").textContent=fmt(sum.P)+"g";$("targetP").textContent="/ "+fmt(s.p)+"g";
    $("macroF").textContent=fmt(sum.F)+"g";$("targetF").textContent="/ "+fmt(s.f)+"g";
    $("macroK").textContent=Math.round(sum.K);$("targetK").textContent="/ "+Math.round(targetK)+" kcal";
    setBar("barC",sum.C,s.c);setBar("barP",sum.P,s.p);setBar("barF",sum.F,s.f);setBar("barK",sum.K,targetK);
    $("macroHint").textContent=(day.foods||[]).length?`${day.foods.length} 条记录`:"尚未记录";
    $("waterValue").textContent=Math.round(day.waterMl)+" ml";$("waterTargetText").textContent="目标 "+Math.round(s.waterGoal)+" ml";setBar("barWater",day.waterMl,s.waterGoal);
    renderEntries(day);
  }
  function renderEntries(day){
    const box=$("foodEntries"),rows=day.foods||[];$("foodCount").textContent=rows.length+" 条";box.innerHTML="";
    if(!rows.length){box.innerHTML='<div class="empty">这一天还没有饮食记录。</div>';return}
    [...rows].sort((a,b)=>String(a.time||"").localeCompare(String(b.time||""))).forEach(x=>{
      const q=macroOf(x),d=document.createElement("div");d.className="item";
      d.innerHTML=`<div><div class="item-title">${escapeHtml(x.slot||"饮食")} · ${escapeHtml(x.name||"未命名")}</div><div class="item-sub">${x.time?escapeHtml(x.time)+" · ":""}C ${fmt(q.C)} / P ${fmt(q.P)} / F ${fmt(q.F)}${x.grams?` · ${fmt(x.grams)}${escapeHtml(x.unit||"g")}`:""}</div></div><div class="item-actions"><span class="kcal">${Math.round(q.K)} kcal</span><button class="chip" data-delete-entry="${x.id}">删除</button></div>`;
      box.appendChild(d);
    });
    box.querySelectorAll("[data-delete-entry]").forEach(b=>b.onclick=()=>{
      if(!confirm("删除这条饮食记录？"))return;
      day.foods=day.foods.filter(x=>x.id!==b.dataset.deleteEntry);persist();renderDiet();
    });
  }

  function fillFoodSelects(){
    const options=(DB.foods||[]).map(f=>`<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join("");
    ["manualFoodSelect","mealFoodSelect"].forEach(id=>{const el=$(id);if(el){const old=el.value;el.innerHTML=options;if(old&&DB.foods.some(f=>f.id===old))el.value=old}});
    const mealOptions=(DB.meals||[]).map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join("");
    $("manualMealSelect").innerHTML=mealOptions;
    updateManualAmountLabel();
  }
  function updateManualAmountLabel(){
    const f=DB.foods.find(x=>x.id===$("manualFoodSelect")?.value);
    if(!$("manualAmountLabel"))return;
    $("manualAmountLabel").textContent=f?.basis==="serving"?"份数":"重量 "+(f?.