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

  const AI_KEY_STORAGE="chibianyingDeepSeekApiKey";
  const foodSchema={
    type:"object",additionalProperties:false,
    properties:{
      name:{type:"string"},estimated_weight_g:{type:"number",minimum:0},carbs_g:{type:"number",minimum:0},
      protein_g:{type:"number",minimum:0},fat_g:{type:"number",minimum:0},calories_kcal:{type:"number",minimum:0},
      confidence:{type:"string",enum:["low","medium","high"]},summary:{type:"string"},
      assumptions:{type:"array",items:{type:"string"},maxItems:8},
      components:{type:"array",maxItems:12,items:{type:"object",additionalProperties:false,properties:{
        name:{type:"string"},estimated_weight_g:{type:"number",minimum:0},carbs_g:{type:"number",minimum:0},
        protein_g:{type:"number",minimum:0},fat_g:{type:"number",minimum:0}
      },required:["name","estimated_weight_g","carbs_g","protein_g","fat_g"]}}
    },
    required:["name","estimated_weight_g","carbs_g","protein_g","fat_g","calories_kcal","confidence","summary","assumptions","components"]
  };
  const insightSchema={
    type:"object",additionalProperties:false,
    properties:{
      title:{type:"string"},summary:{type:"string"},
      observations:{type:"array",maxItems:6,items:{type:"object",additionalProperties:false,properties:{
        title:{type:"string"},detail:{type:"string"},level:{type:"string",enum:["info","positive","attention"]}
      },required:["title","detail","level"]}},
      suggestions:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{
        title:{type:"string"},detail:{type:"string"}
      },required:["title","detail"]}},
      data_quality:{type:"string"}
    },
    required:["title","summary","observations","suggestions","data_quality"]
  };

  function configuredAIKey(){
    return (localStorage.getItem(AI_KEY_STORAGE)||"").trim() || String(window.DEEPSEEK_CONFIG?.apiKey||"").trim();
  }
  function keySource(){
    if((localStorage.getItem(AI_KEY_STORAGE)||"").trim())return "local";
    if(String(window.DEEPSEEK_CONFIG?.apiKey||"").trim())return "github";
    return "none";
  }
  function outputText(response){
    for(const item of response?.output||[]){
      if(item?.type!=="message")continue;
      for(const part of item?.content||[]){
        if(part?.type==="output_text"&&typeof part.text==="string")return part.text;
      }
    }
    return "";
  }
  function instructionsFor(mode){
    if(mode==="food_estimate")return [
      "你是健身饮食记录中的食物营养估算助手。",
      "根据用户提供的食物照片、已知总重量和文字备注，估算这一整顿食物的碳水、蛋白质、脂肪和热量。",
      "如果用户明确说没吃鸡皮、没拌汤汁、剩下某部分等，必须据此调整可食部分。",
      "如果给了总重量，优先将它视为用户实际称得的整份食物重量，但要结合备注判断不可食骨头、包装等是否可能包含在称重里。",
      "不要虚构精确到克的确定性。信息不足时降低 confidence，并在 assumptions 说明主要不确定来源。",
      "calories_kcal 应与三大营养素大致满足 C*4 + P*4 + F*9。",
      "输出简洁中文。"
    ].join("\n");
    if(mode==="exercise")return [
      "你是力量训练记录分析助手。",
      "基于用户传入的某个动作最近训练记录，分析工作重量、重复次数、RIR、最佳组、估算1RM和训练间隔的变化。",
      "优先判断：是否持续进步、基本持平、出现连续退步，还是数据不足。单次状态波动不能定义为停滞。",
      "如果重量不变但次数或RIR改善，也应识别为进步。如果重量提高但次数明显下降，要结合e1RM而不是只看重量。",
      "建议最多给2到3条，必须具体可执行，例如维持重量争取次数、达到某条件后小幅加重。不要替用户自动修改计划。",
      "不要声称医学诊断、过度训练、恢复不良或受伤原因，除非输入数据明确支持且只做描述。",
      "输出简洁中文，先给结论，再给依据。"
    ].join("\n");
    if(mode==="today")return [
      "你是个人健身记录的今日简报助手。",
      "用户提供的是程序已经计算好的今日饮食、训练、体重目标，以及最近几天的上下文。算术结果以输入为准，不重新编造数字。",
      "今天可能尚未结束，因此碳水、蛋白质或热量暂时不足时，不要直接评价为执行失败。只描述当前进度，并把真正异常的点放在前面。",
      "区分单日波动和连续趋势。单日脂肪稍高、体重变化或某次训练表现变化，不要过度解读。",
      "如果今天训练已记录，指出最值得关注的表现；没有训练就不要强行建议训练。",
      "建议最多3条，具体、克制、能在今天剩余时间执行。不要自动修改目标。",
      "不要做医学诊断，也不要推断疾病、激素或精神状态。",
      "输出简洁中文，summary用2到4句话概括今天最重要的信息。"
    ].join("\n");
    if(mode==="weekly")return [
      "你是个人健身记录的7日趋势分析助手。",
      "比较最近7天与之前7天的体重均值、宏量营养、记录完整度和训练频率。输入中的统计值已经由程序计算，以这些数字为准。",
      "优先看趋势而不是单日极值。体重均值只有在记录数量足够时才下结论；饮食记录天数少时必须降低结论强度。",
      "饮食部分重点看平均摄入与目标的偏差、是否稳定执行，而不是要求每天完全一致。",
      "训练部分重点看训练频率和已有动作表现，不因为一周训练天数变化就自行判断过度或不足。",
      "建议最多3条，优先给是否需要保持现状、继续观察或做很小调整。不要自动修改用户目标。",
      "不要做医学诊断，也不要推断疾病、激素或精神状态。",
      "输出简洁中文，并明确哪些结论证据充分、哪些只是需要继续观察。"
    ].join("\n");
    return [
      "你是个人健身记录分析助手。",
      "只解释用户提供的数据，不编造缺失信息。",
      "区分短期波动和长期趋势，数据不足时明确指出。",
      "建议应保守、具体，不直接修改用户设置。",
      "不要做医学诊断。",
      "输出简洁中文。"
    ].join("\n");
  }
  function userText(mode,payload){
    if(mode==="food_estimate")return "请估算这顿食物。以下是用户提供的信息：\n"+JSON.stringify(payload||{});
    if(mode==="today")return "请生成今天的健身简报。下面是程序整理好的 JSON 数据：\n"+JSON.stringify(payload||{});
    if(mode==="weekly")return "请分析最近7天，并与之前7天比较。下面是程序整理好的 JSON 数据：\n"+JSON.stringify(payload||{});
    return "请分析这个动作最近的训练表现。下面是程序整理好的 JSON 数据：\n"+JSON.stringify(payload||{});
  }
  async function validateAIKey(apiKey=configuredAIKey()){
    if(!apiKey)throw new Error("还没有填写 DeepSeek API Key");
    const resp=await fetch("https://api.deepseek.com/models",{headers:{Authorization:"Bearer "+apiKey}});
    const raw=await resp.json().catch(()=>null);
    if(!resp.ok)throw new Error(raw?.error?.message||raw?.message||("DeepSeek HTTP "+resp.status));
    return raw;
  }
  async function callAI(mode,payload,imageDataUrl){
    const apiKey=configuredAIKey();
    if(!apiKey)throw new Error("请先到“目标与数据 → AI 服务”填写 DeepSeek API Key");
    const content=[{type:"input_text",text:userText(mode,payload)}];
    if(mode==="food_estimate"&&imageDataUrl)content.push({type:"input_image",image_url:imageDataUrl,detail:"low"});
    const schema=mode==="food_estimate"?foodSchema:insightSchema;
    const resp=await fetch("https://api.deepseek.com/responses",{
      method:"POST",
      headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"deepseek-flash",
        instructions:instructionsFor(mode),
        input:[{role:"user",content}],
        reasoning:{effort:"none"},
        max_output_tokens:mode==="food_estimate"?1200:1600,
        text:{format:{type:"json_schema",name:mode==="food_estimate"?"food_estimate":"fitness_insight",schema}}
      })
    });
    const raw=await resp.json().catch(()=>null);
    if(!resp.ok)throw new Error(raw?.error?.message||raw?.message||("DeepSeek HTTP "+resp.status));
    const text=outputText(raw);
    if(!text)throw new Error("DeepSeek 没有返回可解析结果");
    try{return JSON.parse(text)}catch{throw new Error("DeepSeek 返回了无效 JSON")}
  }

  const INSIGHT_CACHE_STORAGE="chibianyingAiInsightCacheV2";
  let currentInsight={mode:null,exerciseId:null,payload:null,fingerprint:"",entry:null};
  let insightReturnScroll=0;

  function payloadFingerprint(payload){
    const str=JSON.stringify(payload||{});
    let h=2166136261;
    for(let i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return (h>>>0).toString(36);
  }
  function readInsightCache(){
    try{
      const x=JSON.parse(localStorage.getItem(INSIGHT_CACHE_STORAGE)||"{}");
      return {version:2,today:x.today||null,weekly:x.weekly||null,exercises:x.exercises||{}};
    }catch{return{version:2,today:null,weekly:null,exercises:{}}}
  }
  function writeInsightCache(cache){
    try{localStorage.setItem(INSIGHT_CACHE_STORAGE,JSON.stringify(cache))}catch{}
  }
  function insightPayload(mode,exerciseId){
    return mode==="today"?buildTodayPayload():mode==="weekly"?buildWeeklyPayload():buildExercisePayload(exerciseId);
  }
  function cacheEntryFor(mode,exerciseId){
    const cache=readInsightCache();
    return mode==="exercise"?cache.exercises?.[exerciseId]||null:cache[mode]||null;
  }
  function validCacheEntry(mode,exerciseId,entry,fingerprint){
    if(!entry?.data)return false;
    if(mode==="today"||mode==="weekly")return entry.date===today();
    return !!exerciseId&&entry.fingerprint===fingerprint;
  }
  function saveInsightEntry(mode,exerciseId,data,fingerprint){
    const cache=readInsightCache();
    const entry={date:today(),generatedAt:new Date().toISOString(),fingerprint,data};
    if(mode==="exercise")cache.exercises[exerciseId]=entry;
    else cache[mode]=entry;
    writeInsightCache(cache);
    return entry;
  }
  function formatGeneratedTime(iso){
    if(!iso)return "";
    const d=new Date(iso);
    return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  }
  function insightLabel(mode){
    return mode==="today"?"今日简报":mode==="weekly"?"最近 7 天":"动作分析";
  }
  function currentCacheState(mode,exerciseId){
    try{
      const payload=insightPayload(mode,exerciseId),fingerprint=payloadFingerprint(payload),entry=cacheEntryFor(mode,exerciseId);
      const valid=validCacheEntry(mode,exerciseId,entry,fingerprint);
      const stale=valid&&entry.fingerprint!==fingerprint;
      return {payload,fingerprint,entry,valid,stale};
    }catch{return{payload:null,fingerprint:"",entry:null,valid:false,stale:false}}
  }

  function ensureStyles(){
    if($("fitnessAiStyle"))return;
    const style=document.createElement("style");style.id="fitnessAiStyle";style.textContent=`
      .ai-home-card{margin-top:14px;border:1px solid rgba(155,173,255,.14);background:linear-gradient(180deg,rgba(19,24,34,.96),rgba(12,16,23,.97));border-radius:19px;padding:14px}
      .ai-home-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}
      .ai-home-head-copy b{display:block;font-size:14px}.ai-home-head-copy small{display:block;margin-top:2px;font-size:9px;color:var(--v3-muted,#7c8797)}
      .ai-home-provider{font-size:9px;color:#8590a3;border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:4px 7px}
      .ai-home-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .ai-home-action,.ai-food-shortcut button{border:1px solid rgba(155,173,255,.14);background:#151b26;color:#dce3f5;border-radius:14px;padding:11px 12px;text-align:left}
      .ai-home-action{min-height:70px;display:flex;flex-direction:column;justify-content:space-between;gap:6px}
      .ai-home-action strong{font-size:12px}.ai-home-action small{display:block;color:#7f899a;font-size:9px;line-height:1.35}
      .ai-home-action.has-cache{border-color:rgba(126,215,171,.2);background:linear-gradient(180deg,rgba(19,31,31,.8),#151b26)}
      .ai-home-action.stale{border-color:rgba(240,186,94,.22)}.ai-home-action.stale small{color:#d5ad68}
      .ai-food-shortcut{margin:8px 0 12px}.ai-food-shortcut button{width:100%;display:flex;align-items:center;justify-content:space-between}.ai-food-shortcut small{color:var(--muted);font-size:9px}
      #aiFoodModal .modal-panel{width:min(620px,100%)!important;max-height:92vh}
      #aiInsightModal .ai-report-panel{width:min(680px,100%)!important;max-height:92vh!important;padding:0!important;overflow:auto!important}
      .ai-modal-head,.ai-report-head{display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center;gap:12px;margin:0;padding:15px 15px 12px;border-bottom:1px solid rgba(255,255,255,.075);background:#171d27;position:sticky;top:0;z-index:5}
      .ai-modal-head b,.ai-report-head h2{margin:0;font-size:18px;line-height:1.25}.ai-modal-head small,.ai-report-head small{display:block;margin-top:3px;color:#7e8999;font-size:9px}
      .ai-modal-close,.ai-report-close{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;padding:0!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:50%!important;background:#111720!important;color:#dbe2ef!important;font-size:23px!important;font-weight:400!important;line-height:1!important;display:grid!important;place-items:center!important}
      #aiFoodModal .ai-upload{margin:14px 15px 0}
      #aiFoodModal .ai-fields,#aiFoodModal #aiFoodResult,#aiFoodModal .modal-actions{margin-left:15px;margin-right:15px}
      #aiFoodModal .modal-actions{margin-bottom:15px}
      .ai-upload{border:1px dashed var(--line);border-radius:14px;padding:12px;text-align:center;background:var(--panel2)}.ai-upload input{display:none}.ai-upload-preview{display:none;max-height:210px;max-width:100%;margin:0 auto 10px;border-radius:12px;object-fit:contain}.ai-upload.has-image .ai-upload-preview{display:block}
      .ai-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ai-fields .wide{grid-column:1/-1}.ai-fields textarea{min-height:82px;resize:vertical}
      .ai-result-macros{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.ai-result-macro{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:9px;text-align:center}.ai-result-macro small{display:block;color:var(--muted);font-size:9px}.ai-result-macro b{font-size:15px}
      .ai-result-note{font-size:11px;color:var(--muted);line-height:1.65}.ai-loading{padding:42px 18px;text-align:center;color:var(--muted)}
      .ai-food-save{width:100%;margin-top:11px;min-height:46px!important}.ai-food-save-hint{text-align:center;color:#707b8b;font-size:9px;margin-top:6px}
      .ai-report-body{padding:15px}
      .ai-report-meta{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.ai-report-pill{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.08);background:#121823;border-radius:999px;padding:4px 8px;color:#8490a1;font-size:9px}.ai-report-pill.cached{color:#78d4a4}.ai-report-pill.stale{color:#e2b768}
      .ai-analysis-summary{padding:14px 15px;border:1px solid rgba(160,180,255,.14);border-radius:15px;background:linear-gradient(145deg,rgba(28,35,48,.88),rgba(17,22,30,.82));font-size:13px;line-height:1.75;color:#e7ebf4;margin-bottom:15px}
      .ai-report-section-title{font-size:10px;color:#788495;letter-spacing:.08em;margin:16px 2px 8px;text-transform:uppercase}
      .ai-observation-list{display:grid;gap:8px}.ai-observation{border:1px solid rgba(255,255,255,.065);border-radius:13px;padding:11px 12px;background:rgba(255,255,255,.018)}
      .ai-observation-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.ai-observation b{font-size:12px}.ai-observation p{margin:5px 0 0;color:#939dab;font-size:11px;line-height:1.65}
      .ai-tag{display:inline-flex;flex:0 0 auto;font-size:8px;padding:2px 6px;border-radius:999px;background:#171e2a;color:#aab9ff}.ai-tag.attention{color:#f0ba5e}.ai-tag.positive{color:#71d7a4}
      .ai-report-quality{margin-top:13px;color:#707b8b;font-size:9px}
      .ai-report-actions{display:flex;gap:8px;justify-content:flex-end;padding:0 15px 15px}.ai-report-actions button{min-height:40px}
      .ai-report-error{margin:18px 15px}
      .ai-exercise-btn{margin-top:5px;border:0;background:transparent;color:#9badff;font-size:9px;padding:1px 0}
      .ai-key-field{display:grid;gap:6px;margin:10px 0}.ai-key-field input{width:100%}.ai-key-actions{display:flex;gap:7px;flex-wrap:wrap}.ai-key-actions .btn{flex:1 1 120px}
      @media(max-width:700px){
        #aiInsightModal.open .ai-report-panel{width:100%!important;max-width:none!important;max-height:none!important;min-height:100dvh!important;padding:0 0 calc(16px + env(safe-area-inset-bottom))!important}
        #aiInsightModal .ai-report-head{padding:calc(12px + env(safe-area-inset-top)) 14px 12px!important;background:#0b0f14!important}
        #aiInsightModal .ai-report-body{padding:14px!important}
        #aiInsightModal .ai-report-actions{padding:0 14px 14px!important}
        #aiFoodModal .ai-modal-head{padding:calc(12px + env(safe-area-inset-top)) 14px 12px!important;background:#0b0f14!important}
      }
      @media(max-width:430px){.ai-result-macros{grid-template-columns:repeat(2,1fr)}.ai-fields{grid-template-columns:1fr}.ai-fields .wide{grid-column:auto}.ai-home-actions{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  let pendingFoodImage=null,pendingFoodResult=null,pendingSlot="午餐",pendingTime="",foodAIOrigin="home";
  function inferMealSlotAI(){
    const h=new Date().getHours();
    if(h<10)return "早餐";if(h<14)return "午餐";if(h<17)return "加餐";if(h<21)return "晚餐";return "练后";
  }
  function localTimeAI(){
    const d=new Date();
    return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  }
  function syncFoodSaveLabel(){
    const btn=$("aiUseFood");if(btn)btn.textContent="保存到"+($("aiFoodSlot")?.value||pendingSlot);
  }
  function ensureModals(){
    if(!$("aiFoodModal")){
      const modal=document.createElement("div");modal.className="modal";modal.id="aiFoodModal";
      modal.innerHTML='<div class="modal-panel"><div class="ai-modal-head"><div><b>AI 食物估算</b><small>照片、重量和备注一起判断</small></div><button type="button" class="ai-modal-close" id="aiFoodClose" aria-label="关闭">×</button></div>'+
        '<div class="ai-upload" id="aiUpload"><img class="ai-upload-preview" id="aiFoodPreview" alt=""><label class="btn soft" for="aiFoodImage">📷 拍照 / 选择图片</label><input id="aiFoodImage" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"><div class="meta" style="margin-top:7px">图片可选，也可以只写食物描述和重量</div></div>'+
        '<div class="ai-fields"><div><label for="aiFoodWeight">已知总重量 g（可选）</label><input id="aiFoodWeight" type="number" min="0" step="1" inputmode="decimal"></div><div><label for="aiFoodSlot">餐次</label><select id="aiFoodSlot"><option>早餐</option><option>午餐</option><option>加餐</option><option>晚餐</option><option>练后</option></select></div><div class="wide"><label for="aiFoodNote">描述 / 备注</label><textarea id="aiFoodNote" placeholder="例如：黄焖鸡米饭，鸡皮没吃，汤汁没有拌饭"></textarea></div></div>'+
        '<div id="aiFoodResult"></div><div class="modal-actions"><button class="btn ghost" id="aiFoodBack">手动记录</button><button class="btn" id="aiFoodAnalyze">AI 估算</button></div></div>';
      document.body.appendChild(modal);
      $("aiFoodClose").onclick=closeFoodAI;$("aiFoodBack").onclick=openManualFoodFromAI;$("aiFoodAnalyze").onclick=runFoodAI;
      $("aiFoodImage").addEventListener("change",onFoodImage);
      $("aiFoodSlot").addEventListener("change",()=>{pendingSlot=$("aiFoodSlot").value;syncFoodSaveLabel()});
      modal.addEventListener("click",e=>{if(e.target===modal)closeFoodAI()});
    }
    if(!$("aiInsightModal")){
      const modal=document.createElement("div");modal.className="modal";modal.id="aiInsightModal";
      modal.innerHTML='<div class="modal-panel ai-report-panel"><div class="ai-report-head"><div><h2 id="aiInsightTitle">AI 分析</h2><small id="aiInsightSubtitle">DeepSeek 健身报告</small></div><button type="button" class="ai-report-close" id="aiInsightClose" aria-label="关闭">×</button></div><div class="ai-report-body"><div class="ai-report-meta" id="aiInsightMeta"></div><div id="aiInsightContent"></div></div><div class="ai-report-actions"><button type="button" class="btn soft" id="aiInsightRefresh">重新分析</button></div></div>';
      document.body.appendChild(modal);$("aiInsightClose").onclick=closeInsightModal;$("aiInsightRefresh").onclick=()=>{if(currentInsight.mode)runInsight(currentInsight.mode,currentInsight.exerciseId,{force:true})};
      modal.addEventListener("click",e=>{if(e.target===modal)closeInsightModal()});
    }
  }
  function openFoodAI(origin="home"){
    ensureModals();
    foodAIOrigin=origin;
    const fromManual=origin==="manual"&&$("foodModal")?.classList.contains("open");
    pendingSlot=fromManual?($("mealSlot")?.value||inferMealSlotAI()):inferMealSlotAI();
    pendingTime=fromManual?($("foodTime")?.value||localTimeAI()):localTimeAI();
    $("foodModal")?.classList.remove("open");
    pendingFoodImage=null;pendingFoodResult=null;
    $("aiFoodImage").value="";$("aiFoodPreview").removeAttribute("src");$("aiUpload").classList.remove("has-image");
    $("aiFoodWeight").value="";$("aiFoodNote").value="";$("aiFoodResult").innerHTML="";
    $("aiFoodSlot").value=pendingSlot;
    $("aiFoodAnalyze").textContent="AI 估算";$("aiFoodModal").classList.add("open");
  }
  function closeFoodAI(){
    $("aiFoodModal")?.classList.remove("open");
    if(foodAIOrigin==="manual"){
      window.openFoodModal?.();
      if($("mealSlot"))$("mealSlot").value=pendingSlot;
      if($("foodTime"))$("foodTime").value=pendingTime||localTimeAI();
    }
  }
  function openManualFoodFromAI(){
    pendingSlot=$("aiFoodSlot")?.value||pendingSlot;
    $("aiFoodModal")?.classList.remove("open");
    window.openFoodModal?.();
    if($("mealSlot"))$("mealSlot").value=pendingSlot;
    if($("foodTime"))$("foodTime").value=pendingTime||localTimeAI();
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
      '<button type="button" class="btn ai-food-save" id="aiUseFood">保存到'+escapeHtml($("aiFoodSlot")?.value||pendingSlot)+'</button>'+
      '<div class="ai-food-save-hint">上面的名称、重量和 C/P/F 都可以直接修改后再保存</div>';
    $("aiUseFood").onclick=saveFoodResult;$("aiFoodAnalyze").textContent="重新估算";
  }
  async function runFoodAI(){
    pendingSlot=$("aiFoodSlot")?.value||pendingSlot;
    const note=$("aiFoodNote").value.trim(),weight=+$("aiFoodWeight").value||null;
    if(!pendingFoodImage&&!note)return toast("请拍一张照片，或写一下这顿吃了什么");
    const btn=$("aiFoodAnalyze");btn.disabled=true;btn.textContent="分析中…";$("aiFoodResult").innerHTML='<div class="ai-loading">DeepSeek 正在估算这顿饭…</div>';
    try{
      const data=await callAI("food_estimate",{weight_grams:weight,note,meal_slot:pendingSlot},pendingFoodImage);
      renderFoodResult(data);
    }catch(err){$("aiFoodResult").innerHTML='<div class="empty">'+escapeHtml(err.message||"AI 请求失败")+'</div>';btn.textContent="重试"}
    finally{btn.disabled=false}
  }
  function saveFoodResult(){
    const name=$("aiResultName")?.value.trim()||pendingFoodResult?.name||"AI估算餐";
    const weight=+$("aiResultWeight")?.value||0,C=+$("aiResultC")?.value||0,P=+$("aiResultP")?.value||0,F=+$("aiResultF")?.value||0;
    pendingSlot=$("aiFoodSlot")?.value||pendingSlot;
    if(!name)return toast("请填写食物名称");
    if(!window.fitnessApp?.addFoodEntry)return toast("饮食保存功能尚未准备好");
    window.fitnessApp.addFoodEntry({
      name,unit:"g",grams:weight,slot:pendingSlot,time:pendingTime||localTimeAI(),
      totalMacros:true,totalC:C,totalP:P,totalF:F,
      source:"ai_estimate",aiConfidence:pendingFoodResult?.confidence||""
    });
    $("aiFoodModal")?.classList.remove("open");
    toast("已保存到"+pendingSlot);
  }

  function openInsightModal(){
    const modal=$("aiInsightModal");if(!modal)return;
    if(!modal.classList.contains("open"))insightReturnScroll=window.scrollY||0;
    modal.classList.add("open");
    requestAnimationFrame(()=>window.scrollTo(0,0));
  }
  function closeInsightModal(){
    const modal=$("aiInsightModal");if(!modal)return;
    modal.classList.remove("open");
    requestAnimationFrame(()=>window.scrollTo(0,insightReturnScroll||0));
  }
  function showInsightLoading(title){
    ensureModals();
    $("aiInsightTitle").textContent=title;
    $("aiInsightSubtitle").textContent="DeepSeek 正在生成新报告";
    $("aiInsightMeta").innerHTML='<span class="ai-report-pill">正在分析</span>';
    $("aiInsightContent").innerHTML='<div class="ai-loading">正在整理记录并生成分析…</div>';
    $("aiInsightRefresh").style.display="none";
    openInsightModal();
  }
  function renderInsight(data,meta={}){
    const obs=(data.observations||[]).map(x=>
      '<div class="ai-observation"><div class="ai-observation-head"><b>'+escapeHtml(x.title||"观察")+'</b><span class="ai-tag '+escapeHtml(x.level||"info")+'">'+escapeHtml(x.level==="positive"?"良好":x.level==="attention"?"关注":"信息")+'</span></div><p>'+escapeHtml(x.detail||"")+'</p></div>'
    ).join("");
    const sug=(data.suggestions||[]).map(x=>
      '<div class="ai-observation"><div class="ai-observation-head"><b>'+escapeHtml(x.title||"建议")+'</b><span class="ai-tag">建议</span></div><p>'+escapeHtml(x.detail||"")+'</p></div>'
    ).join("");
    $("aiInsightTitle").textContent=data.title||("AI "+insightLabel(meta.mode));
    $("aiInsightSubtitle").textContent=meta.mode==="exercise"?"基于最近训练记录":"基于你的本机记录";
    const pills=[];
    if(meta.generatedAt)pills.push('<span class="ai-report-pill '+(meta.cached?"cached":"")+'">'+(meta.cached?"本机缓存 · ":"刚刚生成 · ")+escapeHtml(formatGeneratedTime(meta.generatedAt))+'</span>');
    if(meta.stale)pills.push('<span class="ai-report-pill stale">生成后记录有更新</span>');
    if(!meta.cached)pills.push('<span class="ai-report-pill">DeepSeek Flash</span>');
    $("aiInsightMeta").innerHTML=pills.join("");
    $("aiInsightContent").innerHTML=
      '<div class="ai-analysis-summary">'+escapeHtml(data.summary||"")+'</div>'+
      (obs?'<div class="ai-report-section-title">重点观察</div><div class="ai-observation-list">'+obs+'</div>':"")+
      (sug?'<div class="ai-report-section-title">接下来可以怎么做</div><div class="ai-observation-list">'+sug+'</div>':"")+
      (data.data_quality?'<div class="ai-report-quality">数据完整度：'+escapeHtml(data.data_quality)+'</div>':"");
    const refresh=$("aiInsightRefresh");
    refresh.style.display="";
    refresh.textContent=meta.stale?"按最新记录重新分析":"重新分析";
    openInsightModal();
  }
  async function runInsight(mode,exerciseId,options={}){
    const force=!!options.force,title="AI "+insightLabel(mode);
    let payload,fingerprint,entry,valid,stale;
    try{
      payload=insightPayload(mode,exerciseId);
      fingerprint=payloadFingerprint(payload);
      entry=cacheEntryFor(mode,exerciseId);
      valid=validCacheEntry(mode,exerciseId,entry,fingerprint);
      stale=valid&&entry.fingerprint!==fingerprint;
    }catch(err){
      ensureModals();$("aiInsightTitle").textContent=title;$("aiInsightMeta").innerHTML="";$("aiInsightContent").innerHTML='<div class="empty ai-report-error">'+escapeHtml(err.message||"没有足够的数据")+'</div>';$("aiInsightRefresh").style.display="none";openInsightModal();return;
    }

    currentInsight={mode,exerciseId:exerciseId||null,payload,fingerprint,entry};
    if(!force&&valid){
      renderInsight(entry.data,{mode,cached:true,generatedAt:entry.generatedAt,stale,exerciseId});
      return;
    }

    showInsightLoading(title);
    try{
      const data=await callAI(mode,payload,null);
      entry=saveInsightEntry(mode,exerciseId,data,fingerprint);
      currentInsight.entry=entry;
      renderInsight(data,{mode,cached:false,generatedAt:entry.generatedAt,stale:false,exerciseId});
      refreshHomeAIStatus();
    }catch(err){
      if(entry?.data){
        renderInsight(entry.data,{mode,cached:true,generatedAt:entry.generatedAt,stale:true,exerciseId});
        toast("重新分析失败，已保留上一次报告");
      }else{
        $("aiInsightMeta").innerHTML="";
        $("aiInsightContent").innerHTML='<div class="empty ai-report-error">'+escapeHtml(err.message||"AI 请求失败")+'</div>';
        $("aiInsightRefresh").style.display="";
        $("aiInsightRefresh").textContent="重试";
      }
    }
  }

  function injectFoodShortcut(){
    const modal=$("foodModal"),panel=modal?.querySelector(".modal-panel");if(!panel||$("aiFoodShortcut"))return;
    const div=document.createElement("div");div.className="ai-food-shortcut";div.id="aiFoodShortcut";
    div.innerHTML='<button type="button" id="aiFoodStart"><span><b>✦ AI 估算这顿饭</b><br><small>拍照 / 重量 / 描述 → 自动填写 C P F</small></span><span>›</span></button>';
    panel.querySelector(".section")?.insertAdjacentElement("afterend",div);$("aiFoodStart").onclick=()=>openFoodAI("manual");
  }
  function refreshHomeAIStatus(){
    const todayBtn=$("aiToday"),weeklyBtn=$("aiWeekly");
    if(!todayBtn||!weeklyBtn)return;
    for(const [mode,btn] of [["today",todayBtn],["weekly",weeklyBtn]]){
      const status=btn.querySelector("small");
      const state=currentCacheState(mode,null);
      btn.classList.toggle("has-cache",state.valid);
      btn.classList.toggle("stale",state.stale);
      if(state.valid){
        status.textContent=state.stale?"已生成 · 数据有更新":"今日已生成 · "+formatGeneratedTime(state.entry.generatedAt);
      }else{
        status.textContent=mode==="today"?"饮食 + 训练 + 体重":"趋势 + 执行 + 建议";
      }
    }
  }
  function injectHomeCard(){
    const stack=$("v3Home")?.querySelector(".v3-action-stack");if(!stack||$("aiHomeCard"))return;
    const card=document.createElement("div");card.className="ai-home-card";card.id="aiHomeCard";
    card.innerHTML='<div class="ai-home-head"><div class="ai-home-head-copy"><b>✦ AI 分析</b><small>当天报告生成一次，之后直接查看缓存</small></div><span class="ai-home-provider">DeepSeek</span></div><div class="ai-home-actions"><button type="button" class="ai-home-action" id="aiToday"><strong>今日简报</strong><small>饮食 + 训练 + 体重</small></button><button type="button" class="ai-home-action" id="aiWeekly"><strong>最近 7 天</strong><small>趋势 + 执行 + 建议</small></button></div>';
    stack.insertAdjacentElement("afterend",card);
    $("aiToday").onclick=()=>runInsight("today");
    $("aiWeekly").onclick=()=>runInsight("weekly");
    refreshHomeAIStatus();
  }

  async function refreshAISettingsStatus(){
    const status=$("aiSettingsStatus"),remove=$("aiDeleteKey");
    if(!status)return;
    const source=keySource();
    status.textContent="DeepSeek Flash · "+(source==="local"?"本机已保存":source==="github"?"GitHub 配置":"未配置");
    if(remove)remove.style.display=source==="local"?"inline-flex":"none";
  }

  function injectSettingsCard(){
    const grid=$("page-settings")?.querySelector(".grid");if(!grid||$("aiSettingsCard"))return;
    const card=document.createElement("div");card.className="card s12";card.id="aiSettingsCard";
    card.innerHTML='<div class="section"><h2>AI 服务</h2><span class="meta" id="aiSettingsStatus">DeepSeek Flash · 检查中…</span></div>'+
      '<div class="meta">Key 可以直接保存在这台手机，也可以写进 deepseek-config.js。App 会从浏览器直接调用 DeepSeek。</div>'+
      '<div class="ai-key-field"><label for="aiApiKey">DeepSeek API Key</label><input id="aiApiKey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="粘贴 API Key"></div>'+
      '<div class="ai-key-actions"><button type="button" class="btn" id="aiSaveKey">保存并验证</button><button type="button" class="btn soft" id="aiTestConnection">测试连接</button><button type="button" class="btn ghost" id="aiClearCache">清除 AI 报告缓存</button><button type="button" class="btn danger" id="aiDeleteKey" style="display:none">移除本机 Key</button></div>';
    grid.appendChild(card);

    $("aiSaveKey").onclick=async()=>{
      const input=$("aiApiKey"),btn=$("aiSaveKey"),key=input.value.trim();
      if(!key)return toast("请先填写 DeepSeek API Key");
      btn.disabled=true;btn.textContent="验证并保存中…";
      try{
        await validateAIKey(key);
        localStorage.setItem(AI_KEY_STORAGE,key);
        input.value="";
        toast("DeepSeek Key 已保存在本机");
        refreshAISettingsStatus();
      }catch(err){toast(err.message||"保存失败")}
      finally{btn.disabled=false;btn.textContent="保存并验证"}
    };

    $("aiTestConnection").onclick=async()=>{
      const btn=$("aiTestConnection"),status=$("aiSettingsStatus");btn.disabled=true;btn.textContent="测试中…";
      try{
        await validateAIKey();
        status.textContent="DeepSeek Flash · 已连接";
        toast("DeepSeek 连接正常");
      }catch(err){
        status.textContent="未连接 · "+(err.message||"请检查 Key");toast(err.message||"AI 连接失败");
      }finally{btn.disabled=false;btn.textContent="测试连接"}
    };

    $("aiClearCache").onclick=()=>{
      localStorage.removeItem(INSIGHT_CACHE_STORAGE);
      toast("AI 报告缓存已清除");
      refreshHomeAIStatus();
    };

    $("aiDeleteKey").onclick=()=>{
      if(!confirm("移除这台设备保存的 DeepSeek API Key？"))return;
      localStorage.removeItem(AI_KEY_STORAGE);
      toast("本机 DeepSeek Key 已移除");
      refreshAISettingsStatus();
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
  function bindFastFoodEntry(){
    const btn=$("v3Food");if(!btn)return;
    btn.onclick=()=>openFoodAI("home");
    const sub=btn.querySelector("small");if(sub)sub.textContent="拍照 / 描述，AI 估算后直接保存";
  }
  function setupObservers(){
    const strength=$("strengthList");if(strength)new MutationObserver(()=>requestAnimationFrame(injectExerciseButtons)).observe(strength,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",()=>setTimeout(()=>{injectHomeCard();injectExerciseButtons();refreshHomeAIStatus()},0));
  }
  function setup(){
    if(!window.fitnessApp?.getDB)return setTimeout(setup,80);
    ensureStyles();ensureModals();injectFoodShortcut();injectHomeCard();injectSettingsCard();injectExerciseButtons();bindFastFoodEntry();setupObservers();refreshHomeAIStatus();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();