(() => {
  const $ = id => document.getElementById(id);
  const getDB = () => window.fitnessApp?.getDB?.() || {days:{},settings:{},exercises:[],plans:[]};
  const fmt = (v,d=1) => Number(v || 0).toFixed(d).replace(/\.0+$/,"");
  const today = () => {
    const d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  };
  const addDays = (date,n) => {
    const [y,m,d]=String(date).split("-").map(Number),x=new Date(y,m-1,d);
    x.setDate(x.getDate()+n);
    return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
  };
  const toast = msg => {
    const t=$("toast"); if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  };
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const avg = values => values.length ? values.reduce((s,x)=>s+x,0)/values.length : null;

  function foodMacros(entry){
    if(entry?.totalMacros){
      const C=+entry.totalC||0,P=+entry.totalP||0,F=+entry.totalF||0;
      return {C,P,F,K:C*4+P*4+F*9};
    }
    const q=(+entry?.grams||0)/100,C=(+entry?.c||0)*q,P=(+entry?.p||0)*q,F=(+entry?.f||0)*q;
    return {C,P,F,K:C*4+P*4+F*9};
  }
  function dayMacros(day){
    return (day?.foods||[]).reduce((s,x)=>{
      const q=foodMacros(x);s.C+=q.C;s.P+=q.P;s.F+=q.F;s.K+=q.K;return s;
    },{C:0,P:0,F:0,K:0});
  }
  function groupedTraining(day){
    const groups=[];
    for(const row of day?.training||[]){
      let g=groups.find(x=>x.exerciseId===(row.exerciseId||row.exerciseName));
      if(!g){
        g={exerciseId:row.exerciseId||row.exerciseName,name:row.exerciseName||row.exerciseId||"未知动作",sets:[]};
        groups.push(g);
      }
      g.sets.push({weight:+row.weight||0,reps:+row.reps||0,rir:row.rir===""||row.rir==null?null:+row.rir});
    }
    return groups;
  }
  function daySummary(date,day){
    const m=dayMacros(day);
    return {
      date,
      weight:day?.weight==null?null:+day.weight,
      macros:{carbs:+m.C.toFixed(1),protein:+m.P.toFixed(1),fat:+m.F.toFixed(1),kcal:Math.round(m.K)},
      food_entries:(day?.foods||[]).map(x=>{
        const q=foodMacros(x);
        return {name:x.name||"食物",amount:+x.grams||0,unit:x.unit||"g",carbs:+q.C.toFixed(1),protein:+q.P.toFixed(1),fat:+q.F.toFixed(1)};
      }),
      training:groupedTraining(day)
    };
  }
  function recentWeightContext(db,endDate=today()){
    const dates=Object.keys(db.days||{}).filter(d=>d<=endDate).sort();
    const rows=dates.map(d=>({date:d,weight:db.days[d]?.weight})).filter(x=>x.weight!=null);
    const last=rows.slice(-7).map(x=>+x.weight),prev=rows.slice(-14,-7).map(x=>+x.weight);
    return {
      latest:rows.at(-1)||null,
      recent_average:last.length?+avg(last).toFixed(2):null,
      previous_average:prev.length?+avg(prev).toFixed(2):null
    };
  }
  function buildTodayPayload(){
    const db=getDB(),date=today(),day=db.days?.[date]||{date,foods:[],training:[]};
    const recent=[];
    for(let i=6;i>=0;i--){
      const d=addDays(date,-i),x=db.days?.[d];
      if(x)recent.push(daySummary(d,x));
    }
    return {
      goals:{carbs:+db.settings?.c||0,protein:+db.settings?.p||0,fat:+db.settings?.f||0,kcal:+db.settings?.kcal||0},
      today:daySummary(date,day),
      weight_context:recentWeightContext(db,date),
      recent_7_days:recent
    };
  }
  function buildWeeklyPayload(){
    const db=getDB(),date=today(),recent=[],previous=[];
    for(let i=13;i>=0;i--){
      const d=addDays(date,-i),x=db.days?.[d]||{date:d,foods:[],training:[]};
      (i>=7?previous:recent).push(daySummary(d,x));
    }
    const macroAvg = days => {
      const logged=days.filter(x=>x.food_entries.length);
      return {
        logged_days:logged.length,
        carbs:logged.length?+avg(logged.map(x=>x.macros.carbs)).toFixed(1):0,
        protein:logged.length?+avg(logged.map(x=>x.macros.protein)).toFixed(1):0,
        fat:logged.length?+avg(logged.map(x=>x.macros.fat)).toFixed(1):0,
        kcal:logged.length?Math.round(avg(logged.map(x=>x.macros.kcal))):0
      };
    };
    const weightAvg = days => {
      const vals=days.map(x=>x.weight).filter(x=>x!=null);
      return vals.length?+avg(vals).toFixed(2):null;
    };
    return {
      goals:{carbs:+db.settings?.c||0,protein:+db.settings?.p||0,fat:+db.settings?.f||0,kcal:+db.settings?.kcal||0},
      recent_7_days:recent,
      previous_7_days:previous,
      summary:{
        recent_macros:macroAvg(recent),
        previous_macros:macroAvg(previous),
        recent_weight_average:weightAvg(recent),
        previous_weight_average:weightAvg(previous),
        recent_training_days:recent.filter(x=>x.training.length).length,
        previous_training_days:previous.filter(x=>x.training.length).length
      }
    };
  }
  function e1rm(weight,reps){return weight>0&&reps>0?weight*(1+reps/30):null}
  function buildExercisePayload(exerciseId){
    const db=getDB(),ex=(db.exercises||[]).find(x=>x.id===exerciseId);
    if(!ex)throw new Error("找不到这个动作");
    const sessions=[];
    const dates=Object.keys(db.days||{}).sort();
    for(const date of dates){
      const rows=(db.days[date]?.training||[]).filter(x=>x.exerciseId===exerciseId);
      if(!rows.length)continue;
      const sets=rows.sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0)).map(x=>({weight:+x.weight||0,reps:+x.reps||0,rir:x.rir===""||x.rir==null?null:+x.rir}));
      const rms=sets.map(x=>e1rm(x.weight,x.reps)).filter(x=>x!=null);
      sessions.push({date,sets,best_e1rm:rms.length?+Math.max(...rms).toFixed(1):null});
    }
    return {
      exercise:{id:ex.id,name:ex.name,group:ex.group||"",rep_min:+ex.repMin||null,rep_max:+ex.repMax||null,target_sets:+ex.sets||null},
      current_bodyweight:recentWeightContext(db,today()).latest?.weight??null,
      sessions:sessions.slice(-10)
    };
  }

  async function callAI(mode,payload,imageDataUrl){
    if(!window.fitnessCloud?.invoke)throw new Error("AI 后端尚未连接");
    const result=await window.fitnessCloud.invoke("fitness-ai",{mode,payload,imageDataUrl:imageDataUrl||null});
    if(!result?.ok)throw new Error(result?.error||"AI 请求失败");
    return result.data;
  }

  function ensureStyles(){
    if($("fitnessAiStyle"))return;
    const style=document.createElement("style");style.id="fitnessAiStyle";style.textContent=
      ".ai-home-card{margin-top:12px;border:1px solid rgba(155,173,255,.13);background:linear-gradient(180deg,rgba(19,24,34,.94),rgba(12,16,23,.96));border-radius:17px;padding:13px 14px}"+
      ".ai-home-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ai-home-head b{font-size:13px}.ai-home-head small{font-size:9px;color:var(--v3-muted,#7c8797)}"+
      ".ai-home-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ai-home-actions button,.ai-food-shortcut button{border:1px solid rgba(155,173,255,.16);background:#151b26;color:#dce3f5;border-radius:12px;padding:10px 11px;font-size:11px;text-align:left}"+
      ".ai-food-shortcut{margin:8px 0 12px}.ai-food-shortcut button{width:100%;display:flex;align-items:center;justify-content:space-between}.ai-food-shortcut small{color:var(--muted);font-size:9px}"+
      "#aiFoodModal .modal-panel,#aiInsightModal .modal-panel{width:min(620px,100%);max-height:92vh}"+
      ".ai-upload{border:1px dashed var(--line);border-radius:14px;padding:12px;text-align:center;background:var(--panel2)}.ai-upload input{display:none}.ai-upload-preview{display:none;max-height:210px;max-width:100%;margin:0 auto 10px;border-radius:12px;object-fit:contain}.ai-upload.has-image .ai-upload-preview{display:block}"+
      ".ai-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ai-fields .wide{grid-column:1/-1}.ai-fields textarea{min-height:82px;resize:vertical}"+
      ".ai-result-macros{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.ai-result-macro{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:9px;text-align:center}.ai-result-macro small{display:block;color:var(--muted);font-size:9px}.ai-result-macro b{font-size:15px}"+
      ".ai-result-note{font-size:11px;color:var(--muted);line-height:1.65}.ai-loading{padding:28px 8px;text-align:center;color:var(--muted)}"+
      ".ai-analysis-summary{font-size:13px;line-height:1.7;margin-bottom:12px}.ai-observation{border-top:1px solid var(--line);padding:11px 1px}.ai-observation b{font-size:12px}.ai-observation p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.6}"+
      ".ai-tag{display:inline-block;font-size:8px;padding:2px 6px;border-radius:999px;margin-left:6px;background:#171e2a;color:#aab9ff}.ai-tag.attention{color:#f0ba5e}.ai-tag.positive{color:#71d7a4}"+
      ".ai-exercise-btn{margin-top:5px;border:0;background:transparent;color:#9badff;font-size:9px;padding:1px 0}"+
      ".ai-key-field{display:grid;gap:6px;margin:10px 0}.ai-key-field input{width:100%}.ai-key-actions{display:flex;gap:7px;flex-wrap:wrap}.ai-key-actions .btn{flex:1 1 120px}"+
      "@media(max-width:430px){.ai-result-macros{grid-template-columns:repeat(2,1fr)}.ai-fields{grid-template-columns:1fr}.ai-fields .wide{grid-column:auto}}";
    document.head.appendChild(style);
  }

  let pendingFoodImage=null,pendingFoodResult=null,pendingSlot="午餐",pendingTime="";
  function ensureModals(){
    if(!$("aiFoodModal")){
      const modal=document.createElement("div");modal.className="modal";modal.id="aiFoodModal";
      modal.innerHTML='<div class="modal-panel"><div class="section"><h2>AI 食物估算</h2><button class="btn ghost" id="aiFoodClose">关闭</button></div>'+
        '<div class="ai-upload" id="aiUpload"><img class="ai-upload-preview" id="aiFoodPreview" alt=""><label class="btn soft" for="aiFoodImage">📷 拍照 / 选择图片</label><input id="aiFoodImage" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"><div class="meta" style="margin-top:7px">图片可选，也可以只写食物描述和重量</div></div>'+
        '<div class="ai-fields"><div><label for="aiFoodWeight">已知总重量 g（可选）</label><input id="aiFoodWeight" type="number" min="0" step="1" inputmode="decimal"></div><div class="wide"><label for="aiFoodNote">描述 / 备注</label><textarea id="aiFoodNote" placeholder="例如：黄焖鸡米饭，鸡皮没吃，汤汁没有拌饭"></textarea></div></div>'+
        '<div id="aiFoodResult"></div><div class="modal-actions"><button class="btn ghost" id="aiFoodBack">返回饮食记录</button><button class="btn" id="aiFoodAnalyze">AI 估算</button></div></div>';
      document.body.appendChild(modal);
      $("aiFoodClose").onclick=closeFoodAI;$("aiFoodBack").onclick=closeFoodAI;$("aiFoodAnalyze").onclick=runFoodAI;
      $("aiFoodImage").addEventListener("change",onFoodImage);
      modal.addEventListener("click",e=>{if(e.target===modal)closeFoodAI()});
    }
    if(!$("aiInsightModal")){
      const modal=document.createElement("div");modal.className="modal";modal.id="aiInsightModal";
      modal.innerHTML='<div class="modal-panel"><div class="section"><h2 id="aiInsightTitle">AI 分析</h2><button class="btn ghost" id="aiInsightClose">关闭</button></div><div id="aiInsightContent"></div></div>';
      document.body.appendChild(modal);$("aiInsightClose").onclick=()=>modal.classList.remove("open");
      modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    }
  }
  function openFoodAI(){
    ensureModals();
    pendingSlot=$("mealSlot")?.value||"午餐";pendingTime=$("foodTime")?.value||"";
    $("foodModal")?.classList.remove("open");
    pendingFoodImage=null;pendingFoodResult=null;
    $("aiFoodImage").value="";$("aiFoodPreview").removeAttribute("src");$("aiUpload").classList.remove("has-image");
    $("aiFoodWeight").value="";$("aiFoodNote").value="";$("aiFoodResult").innerHTML="";
    $("aiFoodAnalyze").textContent="AI 估算";$("aiFoodModal").classList.add("open");
  }
  function closeFoodAI(){
    $("aiFoodModal")?.classList.remove("open");
    window.openFoodModal?.();
    if($("mealSlot"))$("mealSlot").value=pendingSlot;
    if($("foodTime")&&pendingTime)$("foodTime").value=pendingTime;
  }
  async function fileToDataUrl(file){
    if(!file)return null;
    if(file.size>15*1024*1024)throw new Error("图片太大，请选择 15MB 以内的照片");
    const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=raw});
    const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);
    return canvas.toDataURL("image/jpeg",0.78);
  }
  async function onFoodImage(e){
    try{
      pendingFoodImage=await fileToDataUrl(e.target.files?.[0]);
      if(pendingFoodImage){$("aiFoodPreview").src=pendingFoodImage;$("aiUpload").classList.add("has-image")}
    }catch(err){pendingFoodImage=null;toast(err.message||"图片读取失败")}
  }
  function renderFoodResult(r){
    pendingFoodResult=r;
    $("aiFoodResult").innerHTML='<div class="ai-result-macros">'+
      '<div class="ai-result-macro"><small>碳水</small><b>'+fmt(r.carbs_g)+'g</b></div>'+
      '<div class="ai-result-macro"><small>蛋白质</small><b>'+fmt(r.protein_g)+'g</b></div>'+
      '<div class="ai-result-macro"><small>脂肪</small><b>'+fmt(r.fat_g)+'g</b></div>'+
      '<div class="ai-result-macro"><small>热量</small><b>'+Math.round(+r.calories_kcal||0)+'</b></div></div>'+
      '<div class="ai-fields"><div class="wide"><label>名称</label><input id="aiResultName" value="'+escapeHtml(r.name||"AI估算餐")+'"></div>'+
      '<div><label>重量 g</label><input id="aiResultWeight" type="number" value="'+(+r.estimated_weight_g||"")+'"></div>'+
      '<div><label>碳水 g</label><input id="aiResultC" type="number" step="0.1" value="'+(+r.carbs_g||0)+'"></div>'+
      '<div><label>蛋白质 g</label><input id="aiResultP" type="number" step="0.1" value="'+(+r.protein_g||0)+'"></div>'+
      '<div><label>脂肪 g</label><input id="aiResultF" type="number" step="0.1" value="'+(+r.fat_g||0)+'"></div></div>'+
      '<div class="ai-result-note">'+escapeHtml(r.summary||"")+(r.assumptions?.length?'<br>假设：'+r.assumptions.map(escapeHtml).join("；"):"")+'<br>置信度：'+escapeHtml(r.confidence||"medium")+'</div>'+
      '<button type="button" class="btn soft" id="aiUseFood" style="width:100%;margin-top:10px">填入饮食记录</button>';
    $("aiUseFood").onclick=useFoodResult;$("aiFoodAnalyze").textContent="重新估算";
  }
  async function runFoodAI(){
    const note=$("aiFoodNote").value.trim(),weight=+$("aiFoodWeight").value||null;
    if(!pendingFoodImage&&!note)return toast("请拍一张照片，或写一下这顿吃了什么");
    const btn=$("aiFoodAnalyze");btn.disabled=true;btn.textContent="分析中…";$("aiFoodResult").innerHTML='<div class="ai-loading">DeepSeek 正在估算这顿饭…</div>';
    try{
      const data=await callAI("food_estimate",{weight_grams:weight,note,meal_slot:pendingSlot},pendingFoodImage);
      renderFoodResult(data);
    }catch(err){$("aiFoodResult").innerHTML='<div class="empty">'+escapeHtml(err.message||"AI 请求失败")+'</div>';btn.textContent="重试"}
    finally{btn.disabled=false}
  }
  function useFoodResult(){
    const name=$("aiResultName")?.value.trim()||pendingFoodResult?.name||"AI估算餐";
    const weight=+$("aiResultWeight")?.value||0,C=+$("aiResultC")?.value||0,P=+$("aiResultP")?.value||0,F=+$("aiResultF")?.value||0;
    $("aiFoodModal")?.classList.remove("open");
    window.openFoodModal?.();
    if($("foodMode")){$("foodMode").value="manual";$("foodMode").dispatchEvent(new Event("change"))}
    if($("mealSlot"))$("mealSlot").value=pendingSlot;if($("foodTime")&&pendingTime)$("foodTime").value=pendingTime;
    if($("manualFoodName"))$("manualFoodName").value=name;if($("manualFoodGrams"))$("manualFoodGrams").value=weight||"";
    if($("manualFoodC"))$("manualFoodC").value=C;if($("manualFoodP"))$("manualFoodP").value=P;if($("manualFoodF"))$("manualFoodF").value=F;
    toast("AI 结果已填入，确认后再保存");
  }

  function showInsightLoading(title){
    ensureModals();$("aiInsightTitle").textContent=title;$("aiInsightContent").innerHTML='<div class="ai-loading">DeepSeek 正在读取你的记录…</div>';$("aiInsightModal").classList.add("open");
  }
  function renderInsight(data){
    const obs=(data.observations||[]).map(x=>'<div class="ai-observation"><b>'+escapeHtml(x.title||"观察")+'<span class="ai-tag '+escapeHtml(x.level||"info")+'">'+escapeHtml(x.level==="positive"?"良好":x.level==="attention"?"关注":"信息")+'</span></b><p>'+escapeHtml(x.detail||"")+'</p></div>').join("");
    const sug=(data.suggestions||[]).map(x=>'<div class="ai-observation"><b>'+escapeHtml(x.title||"建议")+'</b><p>'+escapeHtml(x.detail||"")+'</p></div>').join("");
    $("aiInsightTitle").textContent=data.title||"AI 分析";
    $("aiInsightContent").innerHTML='<div class="ai-analysis-summary">'+escapeHtml(data.summary||"")+'</div>'+obs+(sug?'<div class="section" style="margin-top:12px"><h2>建议</h2></div>'+sug:"")+(data.data_quality?'<div class="ai-result-note" style="margin-top:10px">数据完整度：'+escapeHtml(data.data_quality)+'</div>':"");
  }
  async function runInsight(mode,exerciseId){
    const title=mode==="today"?"AI 今日简报":mode==="weekly"?"AI 最近7天报告":"AI 动作分析";
    showInsightLoading(title);
    try{
      const payload=mode==="today"?buildTodayPayload():mode==="weekly"?buildWeeklyPayload():buildExercisePayload(exerciseId);
      const data=await callAI(mode,payload,null);renderInsight(data);
    }catch(err){$("aiInsightContent").innerHTML='<div class="empty">'+escapeHtml(err.message||"AI 请求失败")+'</div>'}
  }

  function injectFoodShortcut(){
    const modal=$("foodModal"),panel=modal?.querySelector(".modal-panel");if(!panel||$("aiFoodShortcut"))return;
    const div=document.createElement("div");div.className="ai-food-shortcut";div.id="aiFoodShortcut";
    div.innerHTML='<button type="button" id="aiFoodStart"><span><b>✦ AI 估算这顿饭</b><br><small>拍照 / 重量 / 描述 → 自动填写 C P F</small></span><span>›</span></button>';
    panel.querySelector(".section")?.insertAdjacentElement("afterend",div);$("aiFoodStart").onclick=openFoodAI;
  }
  function injectHomeCard(){
    const stack=$("v3Home")?.querySelector(".v3-action-stack");if(!stack||$("aiHomeCard"))return;
    const card=document.createElement("div");card.className="ai-home-card";card.id="aiHomeCard";
    card.innerHTML='<div class="ai-home-head"><b>✦ AI 分析</b><small>DeepSeek</small></div><div class="ai-home-actions"><button type="button" id="aiToday">今日简报<br><small>饮食 + 训练 + 体重</small></button><button type="button" id="aiWeekly">最近7天<br><small>趋势 + 执行 + 建议</small></button></div>';
    stack.insertAdjacentElement("afterend",card);$("aiToday").onclick=()=>runInsight("today");$("aiWeekly").onclick=()=>runInsight("weekly");
  }
  async function refreshAISettingsStatus(){
    const status=$("aiSettingsStatus"),remove=$("aiDeleteKey");
    if(!status)return;
    try{
      const result=await callAI("config_status",{},null);
      const source=result.source==="user_vault"?"App 内已保存":result.source==="env_secret"?"Supabase Secret":"未配置";
      status.textContent=(result.provider||"DeepSeek")+" "+(result.model||"")+" · "+source;
      if(remove)remove.style.display=result.source==="user_vault"?"inline-flex":"none";
    }catch(err){
      status.textContent="未连接 · "+(err.message||"请先登录 Supabase");
      if(remove)remove.style.display="none";
    }
  }

  function injectSettingsCard(){
    const grid=$("page-settings")?.querySelector(".grid");if(!grid||$("aiSettingsCard"))return;
    const card=document.createElement("div");card.className="card s12";card.id="aiSettingsCard";
    card.innerHTML='<div class="section"><h2>AI 服务</h2><span class="meta" id="aiSettingsStatus">DeepSeek Flash · 检查中…</span></div>'+
      '<div class="meta">API Key 在这里填一次即可。保存时会先向 DeepSeek 验证，然后通过登录后的 Supabase Edge Function 写入 Vault 加密保存。网页本地和 GitHub 都不会保存明文。</div>'+
      '<div class="ai-key-field"><label for="aiApiKey">DeepSeek API Key</label><input id="aiApiKey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="粘贴 API Key，已保存的 Key 不会回显"></div>'+
      '<div class="ai-key-actions"><button type="button" class="btn" id="aiSaveKey">保存并验证</button><button type="button" class="btn soft" id="aiTestConnection">测试连接</button><button type="button" class="btn danger" id="aiDeleteKey" style="display:none">移除 Key</button></div>';
    grid.appendChild(card);

    $("aiSaveKey").onclick=async()=>{
      const input=$("aiApiKey"),btn=$("aiSaveKey"),key=input.value.trim();
      if(!key)return toast("请先填写 DeepSeek API Key");
      btn.disabled=true;btn.textContent="验证并保存中…";
      try{
        const result=await window.fitnessCloud.invoke("fitness-ai",{mode:"save_api_key",api_key:key});
        if(!result?.ok)throw new Error(result?.error||"保存失败");
        input.value="";
        toast("DeepSeek Key 已安全保存");
        await refreshAISettingsStatus();
      }catch(err){toast(err.message||"保存失败")}
      finally{btn.disabled=false;btn.textContent="保存并验证"}
    };

    $("aiTestConnection").onclick=async()=>{
      const btn=$("aiTestConnection"),status=$("aiSettingsStatus");btn.disabled=true;btn.textContent="测试中…";
      try{
        const result=await callAI("healthcheck",{},null);
        status.textContent=(result.provider||"DeepSeek")+" "+(result.model||"")+" · 已连接";
        toast("DeepSeek 连接正常");
      }catch(err){
        status.textContent="未连接 · "+(err.message||"请检查配置");toast(err.message||"AI 连接失败");
      }finally{btn.disabled=false;btn.textContent="测试连接"}
    };

    $("aiDeleteKey").onclick=async()=>{
      if(!confirm("移除 App 内保存的 DeepSeek API Key？"))return;
      const btn=$("aiDeleteKey");btn.disabled=true;
      try{
        const result=await window.fitnessCloud.invoke("fitness-ai",{mode:"delete_api_key"});
        if(!result?.ok)throw new Error(result?.error||"移除失败");
        toast("DeepSeek Key 已移除");await refreshAISettingsStatus();
      }catch(err){toast(err.message||"移除失败")}
      finally{btn.disabled=false}
    };

    refreshAISettingsStatus();
  }

  function injectExerciseButtons(){
    const box=$("strengthList");if(!box)return;
    const db=getDB();
    box.querySelectorAll(".item").forEach(item=>{
      if(item.querySelector(".ai-exercise-btn"))return;
      const name=item.querySelector(".item-title")?.textContent.trim(),ex=(db.exercises||[]).find(x=>x.name===name);if(!ex)return;
      const target=item.children[1]||item;
      const btn=document.createElement("button");btn.type="button";btn.className="ai-exercise-btn";btn.textContent="✦ AI 分析";btn.onclick=e=>{e.stopPropagation();runInsight("exercise",ex.id)};
      target.appendChild(btn);
    });
  }
  function setupObservers(){
    const strength=$("strengthList");if(strength)new MutationObserver(()=>requestAnimationFrame(injectExerciseButtons)).observe(strength,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",()=>setTimeout(()=>{injectHomeCard();injectExerciseButtons()},0));
  }
  function setup(){
    if(!window.fitnessApp?.getDB)return setTimeout(setup,80);
    ensureStyles();ensureModals();injectFoodShortcut();injectHomeCard();injectSettingsCard();injectExerciseButtons();setupObservers();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();