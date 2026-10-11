(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const today=()=>{
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const shiftDate=(date,delta)=>{
    const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+delta);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const prettyDate=date=>{
    const d=new Date(date+"T12:00:00");
    return new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"short"}).format(d);
  };
  const getDB=()=>window.fitnessApp?.getDB?.()||{days:{},settings:{}};
  const saveDB=db=>window.fitnessApp?.replaceDB?.(db);
  let activeDate=today(),editingMemoId=null,lastDietSignature="";

  function ensureDay(db,date=activeDate){
    db.days=db.days||{};
    if(!db.days[date])db.days[date]={date,foods:[],waterMl:0};
    const day=db.days[date];
    day.foods=Array.isArray(day.foods)?day.foods:[];
    day.waterMl=Math.max(0,+day.waterMl||0);
    return day;
  }

  function getTargets(db){
    const s=db.settings||{},n=s.nutritionTargets||{};
    const numericEntries=Object.entries(s).filter(([,v])=>Number.isFinite(+v)&&+v>0);
    const pick=(re)=>{
      const row=numericEntries.find(([k])=>re.test(k));
      return row?+row[1]:0;
    };
    return {
      c:+n.carbs||+n.c||pick(/target.*(carb|c$)|carb.*target/i)||0,
      p:+n.protein||+n.p||pick(/target.*(protein|p$)|protein.*target/i)||0,
      f:+n.fat||+n.f||pick(/target.*(fat|f$)|fat.*target/i)||0
    };
  }

  function oneFoodTotals(entry){
    if(typeof window.foodTotals==="function"){
      try{
        const r=window.foodTotals({foods:[entry]});
        if(r&&["c","p","f"].every(k=>Number.isFinite(+r[k])))return {c:+r.c,p:+r.p,f:+r.f};
      }catch{}
    }
    const grams=+entry.grams||100;
    const factor=grams/100;
    const total=(keys,per100Keys)=>{
      for(const k of keys)if(entry[k]!=null&&Number.isFinite(+entry[k]))return +entry[k];
      for(const k of per100Keys)if(entry[k]!=null&&Number.isFinite(+entry[k]))return +entry[k]*factor;
      return 0;
    };
    return {
      c:total(["totalC","totalCarbs"],["c","carbs","carbohydrate"]),
      p:total(["totalP","totalProtein"],["p","protein"]),
      f:total(["totalF","totalFat"],["f","fat"])
    };
  }

  function dayTotals(day){
    if(typeof window.foodTotals==="function"){
      try{
        const r=window.foodTotals(day);
        if(r&&["c","p","f"].every(k=>Number.isFinite(+r[k])))return {c:+r.c,p:+r.p,f:+r.f};
      }catch{}
    }
    return (day.foods||[]).reduce((a,x)=>{
      const n=oneFoodTotals(x);a.c+=n.c;a.p+=n.p;a.f+=n.f;return a;
    },{c:0,p:0,f:0});
  }

  function macroBox(label,value,target,unit="g"){
    const pct=target>0?clamp(value/target*100,0,100):0;
    const meta=target>0?`${Math.round(value)} / ${Math.round(target)}${unit}`:`${Math.round(value)}${unit}`;
    return `<div class="simple-macro"><div class="simple-macro-head"><span>${label}</span><b>${meta}</b></div><div class="simple-progress"><i style="width:${pct}%"></i></div></div>`;
  }

  function foodName(x){
    return x.name||x.foodName||x.title||"食物";
  }

  function dietSignature(day){
    return JSON.stringify({water:+day.waterMl||0,foods:(day.foods||[]).map(x=>[x.id,foodName(x),x.grams,x.c,x.p,x.f,x.totalC,x.totalP,x.totalF])});
  }

  function renderDiet(){
    const db=getDB(),day=ensureDay(db,activeDate),t=dayTotals(day),targets=getTargets(db);
    const kcal=t.c*4+t.p*4+t.f*9,targetKcal=targets.c*4+targets.p*4+targets.f*9;
    $("simpleDateLabel").textContent=prettyDate(activeDate);
    $("simpleDateKicker").textContent=activeDate===today()?"今天":"饮食记录";
    $("simpleNextDate").disabled=activeDate>=today();
    $("simpleMacroGrid").innerHTML=[
      macroBox("热量",kcal,targetKcal," kcal"),
      macroBox("碳水",t.c,targets.c),
      macroBox("蛋白质",t.p,targets.p),
      macroBox("脂肪",t.f,targets.f)
    ].join("");
    $("simpleWaterValue").textContent=`${Math.round(+day.waterMl||0)} ml`;
    const list=$("simpleFoodList"),foods=day.foods||[];
    if(!foods.length){
      list.innerHTML='<div class="simple-empty">今天还没有食物记录。</div>';
    }else{
      list.innerHTML=foods.map(x=>{
        const n=oneFoodTotals(x),k=n.c*4+n.p*4+n.f*9,grams=+x.grams||0;
        return `<div class="simple-food-item">
          <div><b>${esc(foodName(x))}</b><small>${grams?esc(grams)+"g · ":""}${Math.round(k)} kcal · C ${Math.round(n.c)} · P ${Math.round(n.p)} · F ${Math.round(n.f)}</small></div>
          <button type="button" class="simple-icon danger" data-del-food="${esc(x.id||"")}">×</button>
        </div>`;
      }).join("");
    }
    const sig=dietSignature(day);
    if(lastDietSignature&&lastDietSignature!==sig&&$("simpleAiAssessment")?.dataset.done==="1"){
      $("simpleAiAssessment").dataset.done="0";
      $("simpleAiAssessment").textContent="饮食记录有变化，可以重新进行今日评估。";
    }
    lastDietSignature=sig;
  }

  function renderMemoPreview(){
    const db=getDB(),memos=Array.isArray(db.memos)?db.memos:[];
    const latest=[...memos].sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")))[0];
    $("simpleMemoPreview").innerHTML=latest
      ? `<b>${esc(latest.title||"未命名备忘")}</b><p>${esc(String(latest.content||"").slice(0,120))||"暂无内容"}</p><small>${new Date(latest.updatedAt||Date.now()).toLocaleDateString("zh-CN")}</small>`
      : '<div class="simple-empty">还没有备忘录。可以记训练计划、常用重量或任何训练提示。</div>';
  }

  function renderAll(){
    renderDiet();renderMemoPreview();adoptAiCard();
  }

  function setDate(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())return;
    activeDate=date;
    window.fitnessApp?.setActiveDate?.(date);
    renderDiet();
  }

  function addWater(amount){
    const db=getDB(),day=ensureDay(db);day.waterMl=Math.max(0,(+day.waterMl||0)+amount);saveDB(db);renderDiet();
  }

  function addCustomWater(){
    const input=$("simpleWaterInput"),v=+input.value;
    if(!(v>0))return;
    addWater(v);input.value="";
  }

  function deleteFood(id){
    if(!id||!confirm("删除这条食物记录？"))return;
    const db=getDB(),day=ensureDay(db);
    day.foods=(day.foods||[]).filter(x=>String(x.id)!==String(id));
    saveDB(db);renderDiet();
  }

  function openFoodRecorder(){
    const btn=$("quickFood");
    if(btn){btn.click();return}
    if(typeof window.openFoodModal==="function")window.openFoodModal();
  }

  function openFoodLibrary(){
    document.body.classList.add("simple-legacy");
    $("simpleApp").hidden=true;
    if(typeof window.showPage==="function")window.showPage("food");
    else{
      qa(".page").forEach(p=>p.classList.remove("active"));
      $("page-food")?.classList.add("active");
    }
    ensureLegacyBack();
    window.renderFoodPage?.();
  }

  function ensureLegacyBack(){
    let bar=$("simpleLegacyBack");
    if(!bar){
      bar=document.createElement("div");bar.id="simpleLegacyBack";bar.className="simple-legacy-back";
      bar.innerHTML='<button type="button">‹ 返回饮食</button><b>食物库与餐食模板</b>';
      document.body.appendChild(bar);
      q("button",bar).onclick=closeLegacy;
    }
    bar.hidden=false;
  }

  function closeLegacy(){
    document.body.classList.remove("simple-legacy");
    if($("simpleLegacyBack"))$("simpleLegacyBack").hidden=true;
    qa(".page").forEach(p=>p.classList.remove("active"));
    $("simpleApp").hidden=false;
    renderAll();
  }

  function openNotes(){
    renderNotes();$("simpleNotesSheet").classList.add("open");
  }

  function closeNotes(){
    $("simpleNotesSheet").classList.remove("open");
  }

  function renderNotes(){
    const db=getDB(),memos=Array.isArray(db.memos)?[...db.memos]:[];
    memos.sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));
    $("simpleNotesList").innerHTML=memos.length?memos.map(m=>`
      <button type="button" class="simple-note-row" data-edit-memo="${esc(m.id)}">
        <b>${esc(m.title||"未命名备忘")}</b>
        <span>${esc(String(m.content||"").replace(/\s+/g," ").slice(0,90))||"暂无内容"}</span>
        <small>${new Date(m.updatedAt||Date.now()).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</small>
      </button>`).join(""):'<div class="simple-empty">还没有备忘录。</div>';
  }

  function openMemoEditor(id=null){
    const db=getDB(),m=(db.memos||[]).find(x=>x.id===id);
    editingMemoId=m?.id||null;
    $("simpleMemoEditorTitle").textContent=m?"编辑备忘":"新建备忘";
    $("simpleMemoTitle").value=m?.title||"";
    $("simpleMemoContent").value=m?.content||"";
    $("simpleMemoDelete").hidden=!m;
    $("simpleMemoEditor").classList.add("open");
    setTimeout(()=>$("simpleMemoTitle").focus(),60);
  }

  function saveMemo(){
    const title=$("simpleMemoTitle").value.trim(),content=$("simpleMemoContent").value.trim();
    if(!title&&!content)return;
    const db=getDB();db.memos=Array.isArray(db.memos)?db.memos:[];
    const now=new Date().toISOString();
    if(editingMemoId){
      const m=db.memos.find(x=>x.id===editingMemoId);
      if(m){m.title=title||"未命名备忘";m.content=content;m.updatedAt=now}
    }else{
      db.memos.push({id:"memo_"+Date.now().toString(36),title:title||"未命名备忘",content,createdAt:now,updatedAt:now});
    }
    saveDB(db);$("simpleMemoEditor").classList.remove("open");editingMemoId=null;renderNotes();renderMemoPreview();
  }

  function deleteMemo(){
    if(!editingMemoId||!confirm("删除这条备忘录？"))return;
    const db=getDB();db.memos=(db.memos||[]).filter(x=>x.id!==editingMemoId);saveDB(db);
    $("simpleMemoEditor").classList.remove("open");editingMemoId=null;renderNotes();renderMemoPreview();
  }

  function openSettings(){
    const db=getDB(),t=getTargets(db);
    $("simpleTargetC").value=t.c||"";
    $("simpleTargetP").value=t.p||"";
    $("simpleTargetF").value=t.f||"";
    $("simpleSettingsSheet").classList.add("open");
  }

  function saveTargets(){
    const c=+$("simpleTargetC").value,p=+$("simpleTargetP").value,f=+$("simpleTargetF").value;
    const db=getDB();db.settings=db.settings||{};db.settings.nutritionTargets={carbs:Math.max(0,c||0),protein:Math.max(0,p||0),fat:Math.max(0,f||0)};
    saveDB(db);$("simpleSettingsSheet").classList.remove("open");renderDiet();
  }

  function clearHistory(){
    if(!confirm("清空所有历史记录？\n\n会删除饮食、饮水、健身备忘录，以及旧版本遗留的体重和训练记录。食物库、餐食模板和目标设置会保留。"))return;
    const db=getDB();
    db.days={};db.memos=[];
    ["plans","exercises","trainingPlans","workoutPlans","strengthRecords","trainingHistory"].forEach(k=>{if(k in db)db[k]=[]});
    saveDB(db);activeDate=today();window.fitnessApp?.setActiveDate?.(activeDate);closeNotes();$("simpleSettingsSheet").classList.remove("open");renderAll();
  }

  function findApiSecret(obj,depth=0){
    if(!obj||typeof obj!=="object"||depth>3)return "";
    for(const [k,v] of Object.entries(obj)){
      if(typeof v==="string"&&/(api.?key|token|secret)/i.test(k)&&v.trim().length>10)return v.trim();
    }
    for(const v of Object.values(obj)){
      if(v&&typeof v==="object"){const x=findApiSecret(v,depth+1);if(x)return x}
    }
    return "";
  }

  function findConfig(){
    const db=getDB(),globalObjects=[];
    for(const k of Object.keys(window)){
      if(/deepseek|ai.*config|config.*ai/i.test(k)){
        try{globalObjects.push(window[k])}catch{}
      }
    }
    const objects=[window.DEEPSEEK_CONFIG,window.deepseekConfig,window.AI_CONFIG,...globalObjects].filter(Boolean);
    let key=findApiSecret(db.settings||{});
    if(!key)for(const o of objects){key=findApiSecret(o);if(key)break}
    if(!key){
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i),v=localStorage.getItem(k);
        if(/deepseek|api.?key|ai.?key/i.test(k||"")&&v){
          try{key=findApiSecret(JSON.parse(v))||(/^[\w-]{20,}$/.test(v.trim())?v.trim():"")}catch{if(/^[\w-]{20,}$/.test(v.trim()))key=v.trim()}
          if(key)break;
        }
      }
    }
    let cfg=objects.find(x=>x&&typeof x==="object")||{};
    const base=cfg.baseUrl||cfg.baseURL||cfg.apiBase||cfg.endpoint||"https://api.deepseek.com";
    let url=cfg.chatUrl||cfg.chatURL||cfg.url||base;
    if(!/chat\/completions/i.test(url))url=String(url).replace(/\/$/,"")+"/chat/completions";
    return {key,url,model:cfg.model||"deepseek-chat"};
  }

  async function evaluateDiet(){
    const btn=$("simpleAiAssessBtn"),box=$("simpleAiAssessment"),db=getDB(),day=ensureDay(db),t=dayTotals(day),targets=getTargets(db);
    if(!(day.foods||[]).length){box.textContent="先记录今天吃了什么，再进行整体评估。";return}
    const cfg=findConfig();
    if(!cfg.key){box.textContent="没有找到已配置的 AI Key。先使用上方现有的 AI 食物分析功能完成配置。";return}
    const foods=(day.foods||[]).map(x=>{
      const n=oneFoodTotals(x);
      return {name:foodName(x),grams:+x.grams||null,carbs:+n.c.toFixed(1),protein:+n.p.toFixed(1),fat:+n.f.toFixed(1)};
    });
    const prompt=`请评估这一天的饮食。只依据提供的数据，不要虚构微量营养素或食材细节。回答简短、直接，用中文，最多5句话。重点说明：碳水/蛋白质/脂肪相对目标是否合适、最明显的问题、下一餐或明天最值得调整的一件事。饮水没有设置目标，只报告摄入量，不要武断判断缺水。
日期：${activeDate}
目标：碳水 ${targets.c||"未设置"}g，蛋白质 ${targets.p||"未设置"}g，脂肪 ${targets.f||"未设置"}g
实际：碳水 ${t.c.toFixed(1)}g，蛋白质 ${t.p.toFixed(1)}g，脂肪 ${t.f.toFixed(1)}g，饮水 ${Math.round(day.waterMl||0)}ml
食物：${JSON.stringify(foods)}`;
    btn.disabled=true;btn.textContent="分析中…";box.textContent="AI 正在综合今天的饮食记录…";
    try{
      const res=await fetch(cfg.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+cfg.key},body:JSON.stringify({model:cfg.model,messages:[{role:"system",content:"你是简洁、谨慎的饮食记录助手。不得编造用户未提供的信息。"},{role:"user",content:prompt}],temperature:.3,max_tokens:500})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.error?.message||("HTTP "+res.status));
      const answer=data?.choices?.[0]?.message?.content?.trim();
      if(!answer)throw new Error("AI 没有返回内容");
      box.textContent=answer;box.dataset.done="1";
    }catch(err){
      box.textContent="今日饮食评估失败："+(err?.message||"未知错误");
    }finally{btn.disabled=false;btn.textContent="AI 评估今日饮食"}
  }

  function adoptAiCard(){
    const host=$("simpleDietAiHost"),card=$("aiHomeCard");
    if(!host||!card||host.contains(card))return;
    qa("button",card).forEach(b=>{if(/训练|上次重量|训练助手/.test(b.textContent||""))b.remove()});
    card.hidden=false;host.appendChild(card);
  }

  function injectStyle(){
    if($("simpleAppStyle"))return;
    const s=document.createElement("style");s.id="simpleAppStyle";s.textContent=`
      :root{--simple-bg:#090b0f;--simple-panel:#11151c;--simple-panel2:#151a22;--simple-line:#252c37;--simple-text:#f2f4f7;--simple-muted:#8993a2;--simple-accent:#b8c5ff;--simple-danger:#ff8a96}
      body{background:var(--simple-bg)!important;color:var(--simple-text)!important}
      .desktop-tabs,.bottom-nav,#fab{display:none!important}
      body:not(.simple-legacy) .page{display:none!important}
      body.simple-legacy .page.active{display:block!important;padding-top:62px!important}
      #simpleApp{max-width:760px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 14px 42px}
      .simple-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
      .simple-date-nav{display:flex;align-items:center;gap:8px;min-width:0}.simple-date-main{border:0;background:transparent;color:var(--simple-text);text-align:left;padding:0 4px;min-width:0}
      .simple-date-main small{display:block;color:var(--simple-muted);font-size:11px;margin-bottom:2px}.simple-date-main b{font-size:20px;white-space:nowrap}
      .simple-icon{width:38px;height:38px;border:1px solid var(--simple-line);border-radius:12px;background:var(--simple-panel);color:var(--simple-text);font-size:18px}
      .simple-icon:disabled{opacity:.3}.simple-icon.danger{width:32px;height:32px;color:var(--simple-danger);font-size:19px}
      .simple-card{background:var(--simple-panel);border:1px solid var(--simple-line);border-radius:18px;padding:14px;margin-bottom:12px}
      .simple-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.simple-card-head h2{font-size:16px;margin:0}.simple-card-head small{color:var(--simple-muted)}
      .simple-macro-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.simple-macro{background:var(--simple-panel2);border-radius:13px;padding:10px}
      .simple-macro-head{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--simple-muted)}.simple-macro-head b{color:var(--simple-text);font-size:11px}
      .simple-progress{height:4px;background:#242a34;border-radius:99px;overflow:hidden;margin-top:8px}.simple-progress i{display:block;height:100%;background:var(--simple-accent);border-radius:99px}
      .simple-water{margin-top:12px;padding-top:12px;border-top:1px solid var(--simple-line)}.simple-water-top{display:flex;justify-content:space-between;align-items:center}.simple-water-top b{font-size:14px}.simple-water-top strong{font-size:18px}
      .simple-water-actions{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;gap:6px;margin-top:9px}.simple-chip,.simple-btn{border:1px solid var(--simple-line);background:var(--simple-panel2);color:var(--simple-text);border-radius:11px;min-height:38px;padding:0 11px;font-weight:650}.simple-btn.primary{background:var(--simple-accent);border-color:var(--simple-accent);color:#10131a}.simple-btn.danger{color:var(--simple-danger)}
      .simple-water-actions input,.simple-field input,.simple-field textarea{width:100%;box-sizing:border-box;border:1px solid var(--simple-line);background:#0d1117;color:var(--simple-text);border-radius:11px;padding:10px 11px;font:inherit}
      .simple-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}
      .simple-subhead{display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px}.simple-subhead b{font-size:13px}.simple-subhead span{font-size:10px;color:var(--simple-muted)}
      .simple-food-list{display:grid;gap:7px}.simple-food-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;background:var(--simple-panel2);border-radius:12px;padding:10px}.simple-food-item b{display:block;font-size:13px}.simple-food-item small{display:block;color:var(--simple-muted);font-size:10px;margin-top:4px}
      .simple-empty{color:var(--simple-muted);font-size:12px;line-height:1.6;padding:12px 2px}
      #simpleDietAiHost{margin-top:14px}#simpleDietAiHost #aiHomeCard{margin:0!important}
      .simple-ai-assess{margin-top:10px;padding-top:10px;border-top:1px solid var(--simple-line)}.simple-ai-answer{font-size:12px;line-height:1.7;color:#cdd4df;white-space:pre-wrap;margin-top:9px}
      .simple-memo-preview b{display:block}.simple-memo-preview p{color:#c9d0da;font-size:12px;line-height:1.6;margin:7px 0}.simple-memo-preview small{color:var(--simple-muted)}
      .simple-sheet{position:fixed;inset:0;z-index:90;background:var(--simple-bg);display:none;overflow:auto}.simple-sheet.open{display:block}.simple-sheet-inner{max-width:760px;margin:0 auto;padding:calc(16px + env(safe-area-inset-top)) 14px 40px}
      .simple-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}.simple-sheet-head h2{font-size:18px;margin:0}.simple-sheet-head button{border:0;background:transparent;color:var(--simple-text);font-size:16px;padding:8px}
      .simple-notes-list{display:grid;gap:8px}.simple-note-row{display:block;text-align:left;width:100%;border:1px solid var(--simple-line);background:var(--simple-panel);color:var(--simple-text);border-radius:14px;padding:12px}.simple-note-row b,.simple-note-row span,.simple-note-row small{display:block}.simple-note-row span{color:#c6ced9;font-size:12px;line-height:1.5;margin:5px 0}.simple-note-row small{color:var(--simple-muted);font-size:9px}
      .simple-note-new{width:100%;margin-bottom:10px}.simple-field{margin-bottom:12px}.simple-field label{display:block;font-size:11px;color:var(--simple-muted);margin-bottom:6px}.simple-field textarea{min-height:46vh;resize:vertical;line-height:1.65}
      .simple-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .simple-settings-section{background:var(--simple-panel);border:1px solid var(--simple-line);border-radius:15px;padding:13px;margin-bottom:12px}.simple-settings-section h3{font-size:14px;margin:0 0 12px}.simple-target-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .simple-legacy-back{position:fixed;z-index:120;top:0;left:0;right:0;height:52px;padding-top:env(safe-area-inset-top);display:flex;align-items:center;gap:12px;background:#0b0e13;border-bottom:1px solid var(--simple-line);padding-left:12px;padding-right:12px}.simple-legacy-back button{border:0;background:transparent;color:var(--simple-accent);font-size:14px}.simple-legacy-back b{font-size:14px}
      @media(max-width:520px){.simple-macro-grid{grid-template-columns:1fr 1fr}.simple-water-actions{grid-template-columns:1fr 1fr}.simple-water-actions input{grid-column:1/2}.simple-water-actions .simple-water-add{grid-column:2/3}.simple-target-grid{grid-template-columns:1fr 1fr 1fr}}
    `;document.head.appendChild(s);
  }

  function build(){
    const app=q(".app");if(!app||$("simpleApp"))return;
    activeDate=window.fitnessApp?.getActiveDate?.()||today();
    const root=document.createElement("main");root.id="simpleApp";root.innerHTML=`
      <header class="simple-top">
        <div class="simple-date-nav">
          <button class="simple-icon" type="button" id="simplePrevDate">‹</button>
          <button class="simple-date-main" type="button" id="simpleDateBtn"><small id="simpleDateKicker">今天</small><b id="simpleDateLabel"></b></button>
          <button class="simple-icon" type="button" id="simpleNextDate">›</button>
          <input id="simpleDateInput" type="date" hidden>
        </div>
        <button class="simple-icon" type="button" id="simpleSettingsBtn" aria-label="设置">⚙</button>
      </header>
      <section class="simple-card">
        <div class="simple-card-head"><h2>每日饮食</h2><small>食物 · 饮水 · AI</small></div>
        <div id="simpleMacroGrid" class="simple-macro-grid"></div>
        <div class="simple-water">
          <div class="simple-water-top"><b>今日饮水</b><strong id="simpleWaterValue">0 ml</strong></div>
          <div class="simple-water-actions">
            <button class="simple-chip" type="button" data-water="250">+250 ml</button>
            <button class="simple-chip" type="button" data-water="500">+500 ml</button>
            <input id="simpleWaterInput" type="number" inputmode="numeric" min="1" placeholder="本次 ml">
            <button class="simple-btn simple-water-add" type="button" id="simpleWaterAdd">加入</button>
          </div>
        </div>
        <div class="simple-actions">
          <button class="simple-btn primary" type="button" id="simpleAddFood">记录食物</button>
          <button class="simple-btn" type="button" id="simpleFoodLibrary">食物库 / 模板</button>
        </div>
        <div class="simple-subhead"><b>当天记录</b><span>切换日期即可查看历史</span></div>
        <div id="simpleFoodList" class="simple-food-list"></div>
        <div id="simpleDietAiHost"></div>
        <div class="simple-ai-assess">
          <button class="simple-btn" type="button" id="simpleAiAssessBtn">AI 评估今日饮食</button>
          <div class="simple-ai-answer" id="simpleAiAssessment">AI 会结合当天食物、碳蛋脂目标和饮水记录做整体评估。</div>
        </div>
      </section>
      <section class="simple-card">
        <div class="simple-card-head"><h2>健身备忘录</h2><button class="simple-btn" type="button" id="simpleOpenNotes">打开备忘录</button></div>
        <div id="simpleMemoPreview" class="simple-memo-preview"></div>
      </section>
    `;
    app.insertBefore(root,app.firstChild);

    const notes=document.createElement("div");notes.id="simpleNotesSheet";notes.className="simple-sheet";notes.innerHTML=`
      <div class="simple-sheet-inner">
        <div class="simple-sheet-head"><h2>健身备忘录</h2><button type="button" id="simpleNotesClose">关闭</button></div>
        <button class="simple-btn primary simple-note-new" type="button" id="simpleNewMemo">＋ 新建备忘</button>
        <div id="simpleNotesList" class="simple-notes-list"></div>
      </div>`;
    document.body.appendChild(notes);

    const editor=document.createElement("div");editor.id="simpleMemoEditor";editor.className="simple-sheet";editor.innerHTML=`
      <div class="simple-sheet-inner">
        <div class="simple-sheet-head"><h2 id="simpleMemoEditorTitle">新建备忘</h2><button type="button" id="simpleMemoEditorClose">关闭</button></div>
        <div class="simple-field"><label>标题</label><input id="simpleMemoTitle" type="text" placeholder="例如：推日训练计划"></div>
        <div class="simple-field"><label>内容</label><textarea id="simpleMemoContent" placeholder="记录训练计划、常用重量、动作提示……"></textarea></div>
        <div class="simple-editor-actions"><button class="simple-btn danger" type="button" id="simpleMemoDelete" hidden>删除</button><button class="simple-btn primary" type="button" id="simpleMemoSave">保存</button></div>
      </div>`;
    document.body.appendChild(editor);

    const settings=document.createElement("div");settings.id="simpleSettingsSheet";settings.className="simple-sheet";settings.innerHTML=`
      <div class="simple-sheet-inner">
        <div class="simple-sheet-head"><h2>设置</h2><button type="button" id="simpleSettingsClose">关闭</button></div>
        <section class="simple-settings-section">
          <h3>每日营养目标</h3>
          <div class="simple-target-grid">
            <div class="simple-field"><label>碳水 g</label><input id="simpleTargetC" type="number" min="0" inputmode="decimal"></div>
            <div class="simple-field"><label>蛋白质 g</label><input id="simpleTargetP" type="number" min="0" inputmode="decimal"></div>
            <div class="simple-field"><label>脂肪 g</label><input id="simpleTargetF" type="number" min="0" inputmode="decimal"></div>
          </div>
          <button class="simple-btn primary" type="button" id="simpleTargetSave">保存目标</button>
        </section>
        <section class="simple-settings-section">
          <h3>历史数据</h3>
          <div class="simple-empty">清空饮食、饮水、备忘录，以及旧版本遗留的体重和训练记录。食物库、餐食模板和目标设置会保留。</div>
          <button class="simple-btn danger" type="button" id="simpleClearHistory">清空所有历史记录</button>
        </section>
      </div>`;
    document.body.appendChild(settings);
  }

  function wire(){
    $("simplePrevDate").onclick=()=>setDate(shiftDate(activeDate,-1));
    $("simpleNextDate").onclick=()=>{if(activeDate<today())setDate(shiftDate(activeDate,1))};
    $("simpleDateBtn").onclick=()=>{
      const i=$("simpleDateInput");i.value=activeDate;i.max=today();i.hidden=false;
      try{if(i.showPicker)i.showPicker();else i.click()}catch{i.click()}
      setTimeout(()=>i.hidden=true,500);
    };
    $("simpleDateInput").onchange=e=>{if(e.target.value)setDate(e.target.value)};
    qa("[data-water]").forEach(b=>b.onclick=()=>addWater(+b.dataset.water||0));
    $("simpleWaterAdd").onclick=addCustomWater;
    $("simpleWaterInput").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();addCustomWater()}};
    $("simpleAddFood").onclick=openFoodRecorder;
    $("simpleFoodLibrary").onclick=openFoodLibrary;
    $("simpleFoodList").onclick=e=>{const b=e.target.closest("[data-del-food]");if(b)deleteFood(b.dataset.delFood)};
    $("simpleAiAssessBtn").onclick=evaluateDiet;
    $("simpleOpenNotes").onclick=openNotes;
    $("simpleNotesClose").onclick=closeNotes;
    $("simpleNewMemo").onclick=()=>openMemoEditor();
    $("simpleNotesList").onclick=e=>{const b=e.target.closest("[data-edit-memo]");if(b)openMemoEditor(b.dataset.editMemo)};
    $("simpleMemoEditorClose").onclick=()=>$("simpleMemoEditor").classList.remove("open");
    $("simpleMemoSave").onclick=saveMemo;
    $("simpleMemoDelete").onclick=deleteMemo;
    $("simpleSettingsBtn").onclick=openSettings;
    $("simpleSettingsClose").onclick=()=>$("simpleSettingsSheet").classList.remove("open");
    $("simpleTargetSave").onclick=saveTargets;
    $("simpleClearHistory").onclick=clearHistory;
    window.addEventListener("fitness:changed",renderAll);
    window.addEventListener("fitness:date-changed",()=>{activeDate=window.fitnessApp?.getActiveDate?.()||activeDate;renderAll()});
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")renderAll()});
    const mo=new MutationObserver(()=>adoptAiCard());mo.observe(document.body,{childList:true,subtree:true});
  }

  function setup(){
    if(!window.fitnessApp?.getDB||!q(".app"))return setTimeout(setup,50);
    injectStyle();build();wire();renderAll();setTimeout(adoptAiCard,250);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();