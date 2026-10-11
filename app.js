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
    $("manualAmountLabel").textContent=f?.basis==="serving"?"份数":"重量 "+(f?.unit||"g");
  }
  function openManual(){
    fillFoodSelects();
    $("manualSlot").value=inferSlot();$("manualTime").value=localTime();$("manualMode").value="library";
    $("manualAmount").value="";$("customFoodName").value="";$("customFoodWeight").value="";$("customFoodC").value="";$("customFoodP").value="";$("customFoodF").value="";
    toggleManualMode();openModal("manualFoodModal");
  }
  function toggleManualMode(){
    const m=$("manualMode").value;$("manualLibraryFields").hidden=m!=="library";$("manualMealFields").hidden=m!=="meal";$("manualCustomFields").hidden=m!=="custom";
  }
  function saveManual(){
    const day=ensureDay(),slot=$("manualSlot").value,time=$("manualTime").value||localTime(),mode=$("manualMode").value;
    if(mode==="library"){
      const f=DB.foods.find(x=>x.id===$("manualFoodSelect").value),amount=+$("manualAmount").value;
      if(!f||!(amount>0))return toast("请选择食物并填写数量");
      day.foods.push({...clone(f),id:uid("fd"),sourceFoodId:f.id,grams:amount,slot,time});
    }else if(mode==="meal"){
      const meal=DB.meals.find(x=>x.id===$("manualMealSelect").value);
      if(!meal)return toast("请选择餐食模板");
      for(const it of meal.items||[]){
        const f=DB.foods.find(x=>x.id===it.foodId);if(!f)continue;
        day.foods.push({...clone(f),id:uid("fd"),sourceFoodId:f.id,grams:+it.amount||+it.grams||0,slot,time,mealName:meal.name});
      }
    }else{
      const name=$("customFoodName").value.trim(),C=+$("customFoodC").value||0,P=+$("customFoodP").value||0,F=+$("customFoodF").value||0,grams=+$("customFoodWeight").value||0;
      if(!name)return toast("填写食物名称");
      day.foods.push({id:uid("fd"),name,grams,unit:"g",totalMacros:true,totalC:C,totalP:P,totalF:F,slot,time,source:"manual"});
    }
    persist();closeModal("manualFoodModal");renderDiet();toast("已记录");
  }

  function renderLibrary(){
    fillFoodSelects();
    $("libraryFoods").hidden=libraryTab!=="foods";$("libraryMeals").hidden=libraryTab!=="meals";
    document.querySelectorAll("[data-library-tab]").forEach(b=>b.classList.toggle("active",b.dataset.libraryTab===libraryTab));
    const fb=$("foodLibrary");fb.innerHTML="";
    if(!DB.foods.length)fb.innerHTML='<div class="empty">暂无食物。</div>';
    DB.foods.forEach(f=>{
      const d=document.createElement("div");d.className="item";
      const serving=f.basis==="serving",C=serving?(+f.c||0)/100:+f.c||0,P=serving?(+f.p||0)/100:+f.p||0,F=serving?(+f.f||0)/100:+f.f||0;
      d.innerHTML=`<div><div class="item-title">${escapeHtml(f.name)}</div><div class="item-sub">${serving?"每份":"每100"+escapeHtml(f.unit||"g")} · C ${fmt(C)} / P ${fmt(P)} / F ${fmt(F)}</div></div><div class="item-actions"><button class="chip" data-edit-food="${f.id}">编辑</button><button class="chip" data-delete-food="${f.id}">删除</button></div>`;
      fb.appendChild(d);
    });
    fb.querySelectorAll("[data-edit-food]").forEach(b=>b.onclick=()=>openFoodEditor(b.dataset.editFood));
    fb.querySelectorAll("[data-delete-food]").forEach(b=>b.onclick=()=>deleteFood(b.dataset.deleteFood));

    const mb=$("mealLibrary");mb.innerHTML="";
    if(!DB.meals.length)mb.innerHTML='<div class="empty">暂无餐食模板。</div>';
    DB.meals.forEach(m=>{
      const text=(m.items||[]).map(it=>{const f=DB.foods.find(x=>x.id===it.foodId);return f?`${f.name} ${fmt(+it.amount||+it.grams||0)}${f.basis==="serving"?"份":f.unit||"g"}`:""}).filter(Boolean).join(" · ");
      const d=document.createElement("div");d.className="item";d.innerHTML=`<div><div class="item-title">${escapeHtml(m.name)}</div><div class="item-sub">${escapeHtml(text||"空模板")}</div></div><div class="item-actions"><button class="chip" data-edit-meal="${m.id}">编辑</button><button class="chip" data-delete-meal="${m.id}">删除</button></div>`;
      mb.appendChild(d);
    });
    mb.querySelectorAll("[data-edit-meal]").forEach(b=>b.onclick=()=>openMealEditor(b.dataset.editMeal));
    mb.querySelectorAll("[data-delete-meal]").forEach(b=>b.onclick=()=>deleteMeal(b.dataset.deleteMeal));
  }
a-delete-meal="${m.id}">删除</button></div>`;mb.appendChild(d);
    });
    mb.querySelectorAll("[data-edit-meal]").forEach(b=>b.onclick=()=>openMealEditor(b.dataset.editMeal));
    mb.querySelectorAll("[data-delete-meal]").forEach(b=>b.onclick=()=>deleteMeal(b.dataset.deleteMeal));
  }
  function openFoodEditor(id=""){
    const f=DB.foods.find(x=>x.id===id);$("editingFoodId").value=id;$("foodEditorTitle").textContent=id?"编辑食物":"添加食物";
    $("foodName").value=f?.name||"";$("foodUnit").value=f?.unit==="ml"?"ml":"g";
    if(f?.basis==="serving"){$("foodC").value=fmt((+f.c||0)/100);$("foodP").value=fmt((+f.p||0)/100);$("foodF").value=fmt((+f.f||0)/100)}
    else{$("foodC").value=f?.c??"";$("foodP").value=f?.p??"";$("foodF").value=f?.f??""}
    openModal("foodEditorModal");
  }
  function saveFoodLibrary(){
    const id=$("editingFoodId").value,name=$("foodName").value.trim();if(!name)return toast("填写食物名称");
    const obj={id:id||uid("food"),name,unit:$("foodUnit").value,c:+$("foodC").value||0,p:+$("foodP").value||0,f:+$("foodF").value||0,basis:$("foodUnit").value==="ml"?"per100ml":"per100g"};
    const i=DB.foods.findIndex(x=>x.id===id);if(i>=0)DB.foods[i]=obj;else DB.foods.push(obj);
    persist();closeModal("foodEditorModal");renderLibrary();toast("食物已保存");
  }
  function deleteFood(id){
    if(!confirm("删除这个食物？使用它的历史记录不会受影响。"))return;
    DB.foods=DB.foods.filter(x=>x.id!==id);DB.meals.forEach(m=>m.items=(m.items||[]).filter(it=>it.foodId!==id));persist();renderLibrary();
  }

  function openMealEditor(id=""){
    const m=DB.meals.find(x=>x.id===id);$("editingMealId").value=id;$("mealEditorTitle").textContent=id?"编辑餐食模板":"添加餐食模板";$("mealName").value=m?.name||"";
    mealBuilder=(m?.items||[]).map(x=>({foodId:x.foodId,amount:+x.amount||+x.grams||0}));fillFoodSelects();$("mealFoodAmount").value="";renderMealBuilder();openModal("mealEditorModal");
  }
  function renderMealBuilder(){
    const box=$("mealBuilderList");box.innerHTML="";
    mealBuilder.forEach((it,i)=>{const f=DB.foods.find(x=>x.id===it.foodId);if(!f)return;const d=document.createElement("div");d.className="item";d.innerHTML=`<div><div class="item-title">${escapeHtml(f.name)}</div><div class="item-sub">${fmt(it.amount)}${f.basis==="serving"?"份":escapeHtml(f.unit||"g")}</div></div><button class="chip" data-remove-meal-item="${i}">删除</button>`;box.appendChild(d)});
    box.querySelectorAll("[data-remove-meal-item]").forEach(b=>b.onclick=()=>{mealBuilder.splice(+b.dataset.removeMealItem,1);renderMealBuilder()});
  }
  function addMealItem(){
    const foodId=$("mealFoodSelect").value,amount=+$("mealFoodAmount").value;if(!foodId||!(amount>0))return toast("选择食物并填写数量");
    mealBuilder.push({foodId,amount});$("mealFoodAmount").value="";renderMealBuilder();
  }
  function saveMeal(){
    const id=$("editingMealId").value,name=$("mealName").value.trim();if(!name)return toast("填写模板名称");if(!mealBuilder.length)return toast("至少添加一个食物");
    const obj={id:id||uid("meal"),name,items:mealBuilder.map(x=>({...x}))},i=DB.meals.findIndex(x=>x.id===id);if(i>=0)DB.meals[i]=obj;else DB.meals.push(obj);
    persist();closeModal("mealEditorModal");renderLibrary();toast("餐食模板已保存");
  }
  function deleteMeal(id){if(!confirm("删除这个餐食模板？"))return;DB.meals=DB.meals.filter(x=>x.id!==id);persist();renderLibrary()}

  function renderMemos(){
    const box=$("memoList"),rows=[...DB.memos].sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));box.innerHTML="";
    if(!rows.length){box.innerHTML='<div class="empty">还没有备忘录。可以记录训练计划、动作重量或任何想记住的东西。</div>';return}
    rows.forEach(m=>{
      const d=document.createElement("div");d.className="memo-card";
      d.innerHTML=`<h3>${escapeHtml(m.title||"未命名")}</h3><p>${escapeHtml(m.content||"")}</p><div class="memo-meta">${escapeHtml(formatDateTime(m.updatedAt))}</div><div class="memo-actions"><button class="chip" data-edit-memo="${m.id}">编辑</button><button class="chip" data-delete-memo="${m.id}">删除</button></div>`;box.appendChild(d);
    });
    box.querySelectorAll("[data-edit-memo]").forEach(b=>b.onclick=()=>openMemo(b.dataset.editMemo));
    box.querySelectorAll("[data-delete-memo]").forEach(b=>b.onclick=()=>deleteMemo(b.dataset.deleteMemo));
  }
  function formatDateTime(iso){
    if(!iso)return"";const d=new Date(iso);return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  function openMemo(id=""){
    const m=DB.memos.find(x=>x.id===id);$("editingMemoId").value=id;$("memoModalTitle").textContent=id?"编辑备忘录":"新建备忘录";$("memoTitle").value=m?.title||"";$("memoContent").value=m?.content||"";openModal("memoModal");
  }
  function saveMemo(){
    const id=$("editingMemoId").value,title=$("memoTitle").value.trim(),content=$("memoContent").value.trim();if(!title&&!content)return toast("冝点内容再保存");
    const now=new Date().toISOString(),obj={id:id||uid("memo"),title:title||"未命名",content,createdAt:DB.memos.find(x=>x.id===id)?.createdAt||now,updatedAt:now},i=DB.memos.findIndex(x=>x.id===id);if(i>=0)DB.memos[i]=obj;else DB.memos.push(obj);
    persist();closeModal("memoModal");renderMemos();toast("备忘录已保存");
  }
  function deleteMemo(id){if(!confirm("删除这条备忘录？"))return;DB.memos=DB.memos.filter(x=>x.id!==id);persist();renderMemos()}

  function renderSettings(){
    $("settingC").value=DB.settings.c;$("settingP").value=DB.settings.p;$("settingF").value=DB.settings.f;$("settingWater").value=DB.settings.waterGoal;
  }
  function saveTargets(){
    DB.settings.c=Math.max(0,+$("settingC").value||0);DB.settings.p=Math.max(0,+$("settingP").value||0);DB.settings.f=Math.max(0,+$("settingF").value||