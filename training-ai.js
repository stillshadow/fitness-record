(function trainingAiModule(){
  if(window.__FITNESS_TRAINING_AI__)return;
  window.__FITNESS_TRAINING_AI__=true;

  const $=id=>document.getElementById(id);
  const getDB=()=>window.fitnessApp?.getDB?.()||{days:{},exercises:[]};
  const toast=msg=>{
    const t=$("toast");if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  };
  const AI_KEY_STORAGE="chibianyingDeepSeekApiKey";
  const configuredAIKey=()=>String(localStorage.getItem(AI_KEY_STORAGE)||window.DEEPSEEK_CONFIG?.apiKey||"").trim();

  const parseSchema={
    type:"object",additionalProperties:false,
    properties:{
      exercises:{type:"array",maxItems:16,items:{
        type:"object",additionalProperties:false,
        properties:{
          exercise_id:{type:"string"},
          exercise_name:{type:"string"},
          confidence:{type:"string",enum:["low","medium","high"]},
          sets:{type:"array",maxItems:12,items:{
            type:"object",additionalProperties:false,
            properties:{
              weight:{type:"number",minimum:0},
              reps:{type:"number",minimum:0},
              rir:{type:"number",minimum:-1,maximum:10},
              resistance_label:{type:"string"}
            },
            required:["weight","reps","rir","resistance_label"]
          }},
          note:{type:"string"}
        },
        required:["exercise_id","exercise_name","confidence","sets","note"]
      }},
      cardio_minutes:{type:"number",minimum:0},
      warnings:{type:"array",items:{type:"string"},maxItems:8}
    },
    required:["exercises","cardio_minutes","warnings"]
  };

  const assistantSchema={
    type:"object",additionalProperties:false,
    properties:{
      answer:{type:"string"},
      matched_exercise_id:{type:"string"},
      matched_exercise_name:{type:"string"},
      confidence:{type:"string",enum:["low","medium","high"]},
      evidence:{type:"array",items:{type:"string"},maxItems:6}
    },
    required:["answer","matched_exercise_id","matched_exercise_name","confidence","evidence"]
  };

  function outputText(response){
    for(const item of response?.output||[]){
      if(item?.type!=="message")continue;
      for(const part of item?.content||[]){
        if(part?.type==="output_text"&&typeof part.text==="string")return part.text;
      }
    }
    return "";
  }

  async function callStructured({instructions,text,schema,name,max=1800}){
    const apiKey=configuredAIKey();
    if(!apiKey)throw new Error("请先到“目标与数据 → AI 服务”填写 DeepSeek API Key");
    const resp=await fetch("https://api.deepseek.com/responses",{
      method:"POST",
      headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"deepseek-flash",
        instructions,
        input:[{role:"user",content:[{type:"input_text",text}]}],
        reasoning:{effort:"none"},
        max_output_tokens:max,
        text:{format:{type:"json_schema",name,schema}}
      })
    });
    const raw=await resp.json().catch(()=>null);
    if(!resp.ok)throw new Error(raw?.error?.message||raw?.message||("DeepSeek HTTP "+resp.status));
    const out=outputText(raw);
    if(!out)throw new Error("DeepSeek 没有返回可解析结果");
    try{return JSON.parse(out)}catch{throw new Error("DeepSeek 返回了无效 JSON")}
  }

  function compactCatalog(){
    return (getDB().exercises||[]).map(ex=>({
      id:ex.id,
      name:ex.name,
      aliases:Array.isArray(ex.aliases)?ex.aliases.slice(0,6):[],
      group:ex.group||"",
      load_type:window.fitnessLoadTypeOf?.(ex)||ex.loadType||"weight"
    }));
  }

  async function parseTrainingText(input){
    const text=String(input||"").trim();
    if(!text)throw new Error("先说或写一下今天练了什么");
    return callStructured({
      name:"training_quick_log",
      schema:parseSchema,
      max:1900,
      instructions:[
        "你是健身训练日志解析器，只负责把用户的自然语言训练记录转成结构化数据。",
        "必须从用户提供的 exercise_catalog 中匹配动作，exercise_id 必须严格使用目录中的真实 id，不能创造新动作。",
        "优先匹配最具体的动作名称或别名。例如用户明确说哑铃地板卧推，就不要匹配普通哑铃卧推或杠铃卧推。",
        "用户常用简写：22.5kg 10、9、8次 表示同一重量三组；10次3组 / 10x3 表示三组相同次数；RIR2 如果只说一次且语义上针对整个动作，可应用到该动作所有组。",
        "如果用户说每组重量不同，要逐组保留。没有说重量时 weight=0；没有说 RIR 时 rir=-1。",
        "弹力带动作把 30-50lb、50-70lb、颜色、双股等写入 resistance_label，weight=0。",
        "纯自重动作 weight=0。自重+额外负重动作只有用户明确说额外负重时才填 weight。",
        "不要把热身、感受、动作建议编造成训练组。信息不确定时 confidence 降低并写入 warnings。",
        "如果提到跑步、骑车、椭圆机等明确有氧时，可填写 cardio_minutes；没有分钟数则保持0，不猜。",
        "输出只反映用户说过的训练，不添加用户没说的动作或组数。"
      ].join("\n"),
      text:"用户训练描述：\n"+text+"\n\nexercise_catalog：\n"+JSON.stringify(compactCatalog())
    });
  }

  function normalize(s){
    return String(s||"").toLocaleLowerCase().replace(/[\s·•,，。；;:：/\\()（）\[\]【】\-—_]/g,"");
  }

  function matchExercise(question){
    const q=normalize(question),db=getDB(),matches=[];
    for(const ex of db.exercises||[]){
      const phrases=[ex.name,...(Array.isArray(ex.aliases)?ex.aliases:[])].filter(Boolean);
      let best=0,bestPhrase="";
      for(const phrase of phrases){
        const p=normalize(phrase);
        if(!p)continue;
        if(q.includes(p)){const score=1000+p.length;if(score>best){best=score;bestPhrase=phrase}}
        else if(p.includes(q)&&q.length>=2){const score=100+q.length;if(score>best){best=score;bestPhrase=phrase}}
      }
      if(best)matches.push({ex,score:best,phrase:bestPhrase});
    }
    matches.sort((a,b)=>b.score-a.score||String(b.phrase).length-String(a.phrase).length);
    if(!matches.length)return null;
    if(matches.length>1&&matches[0].score===matches[1].score)return null;
    return matches[0].ex;
  }

  function lastSession(exerciseId){
    const db=getDB(),dates=Object.keys(db.days||{}).sort().reverse();
    for(const date of dates){
      const rows=(db.days?.[date]?.training||[]).filter(r=>r.exerciseId===exerciseId).sort((a,b)=>(+a.setIndex||0)-(+b.setIndex||0));
      if(rows.length)return {date,rows};
    }
    return null;
  }

  function rowText(row,ex){
    const type=["weight","bodyweight","bodyweight_extra","band"].includes(row?.loadType)?row.loadType:(window.fitnessLoadTypeOf?.(ex)||ex?.loadType||"weight");
    const reps=+row?.reps||0,weight=+row?.weight||0;
    const load=type==="band"?(row.resistanceLabel||"弹力带"):type==="bodyweight"?"BW":type==="bodyweight_extra"?(weight>0?"BW + "+weight+"kg":"BW"):(weight>0?weight+"kg":"重量未填");
    return load+" × "+(reps||"-")+(row?.rir!==""&&row?.rir!=null?" · RIR "+row.rir:"");
  }

  function localAssistantAnswer(question){
    const q=String(question||""),ex=matchExercise(q);
    if(!ex)return null;
    if(!/(上次|之前|最近|多重|重量|多少|几组|次数|rir|这次|今天|建议|开始)/i.test(q))return null;
    const last=lastSession(ex.id);
    if(!last)return {answer:"你还没有「"+ex.name+"」的历史训练记录。",matched_exercise_id:ex.id,matched_exercise_name:ex.name,confidence:"high",evidence:[]};
    const sets=last.rows.map((r,i)=>(i+1)+". "+rowText(r,ex));
    let answer="上次「"+ex.name+"」是 "+last.date.slice(5).replace("-","/")+"：\n"+sets.join("\n");
    if(/(这次|今天).*(多重|重量|多少|开始)|建议.*(多重|重量|多少|开始)|从多少/i.test(q)){
      const first=last.rows[0],type=first?.loadType||window.fitnessLoadTypeOf?.(ex)||ex.loadType||"weight";
      if(type==="weight"&&+first.weight>0)answer+="\n\n如果今天状态正常，可以先从上次首组的 "+first.weight+"kg 开始，再根据热身手感调整。";
      else if(type==="bodyweight_extra")answer+="\n\n如果今天状态正常，可以先沿用上次的自重/额外负重方案。";
      else if(type==="band")answer+="\n\n如果今天状态正常，可以先沿用上次的 "+(first.resistanceLabel||"弹力带阻力")+"。";
      else answer+="\n\n如果今天状态正常，可以先沿用上次的自重次数目标。";
    }
    return {answer,matched_exercise_id:ex.id,matched_exercise_name:ex.name,confidence:"high",evidence:sets};
  }

  function compactHistory(){
    const db=getDB(),byExercise=new Map(),dates=Object.keys(db.days||{}).sort().reverse();
    for(const date of dates){
      for(const row of db.days?.[date]?.training||[]){
        if(!row.exerciseId)continue;
        if(!byExercise.has(row.exerciseId))byExercise.set(row.exerciseId,[]);
        const sessions=byExercise.get(row.exerciseId);
        let session=sessions.find(x=>x.date===date);
        if(!session&&sessions.length<3){session={date,sets:[]};sessions.push(session)}
        if(session)session.sets.push({weight:+row.weight||0,resistance_label:row.resistanceLabel||"",reps:+row.reps||0,rir:row.rir===""||row.rir==null?null:+row.rir});
      }
    }
    const exMap=new Map((db.exercises||[]).map(x=>[x.id,x]));
    return [...byExercise.entries()].slice(0,80).map(([id,sessions])=>{
      const ex=exMap.get(id)||{};
      return {id,name:ex.name||id,aliases:Array.isArray(ex.aliases)?ex.aliases.slice(0,4):[],load_type:window.fitnessLoadTypeOf?.(ex)||ex.loadType||"weight",sessions};
    });
  }

  async function askTrainingAssistant(question){
    const q=String(question||"").trim();
    if(!q)throw new Error("先问我一个训练问题");
    const local=localAssistantAnswer(q);
    if(local)return local;
    return callStructured({
      name:"training_assistant",
      schema:assistantSchema,
      max:1000,
      instructions:[
        "你是用户私人健身日志的训练助手。回答必须以 payload 中真实训练历史为依据，不得捏造重量、次数、日期或动作。",
        "用户最常问的是某个动作上次用了多少重量、做了几组/几次、这次可以从多少开始。",
        "如果能匹配到动作，先直接回答最近一次训练的日期和每组表现。若用户问这次用多少，只能给基于上次记录的保守起始建议，并提醒根据热身手感调整。",
        "不同动作绝不能混在一起比较。动作库里的器械属性只是动作名称的一部分，不再区分具体机器。",
        "弹力带动作比较 resistance_label、次数和 RIR；自重动作比较次数/RIR；固定重量动作可比较重量、次数和RIR。",
        "如果没有对应历史，明确说没有记录，不要猜。",
        "回答短、直接、适合训练中快速看。最多5句话。"
      ].join("\n"),
      text:"用户问题：\n"+q+"\n\n最近训练历史：\n"+JSON.stringify(compactHistory())
    });
  }

  function ensureStyles(){
    if($("trainingAiStyle"))return;
    const style=document.createElement("style");style.id="trainingAiStyle";
    style.textContent=`
      .training-ai-quick{border:1px solid rgba(155,173,255,.15);background:linear-gradient(180deg,rgba(20,26,37,.96),rgba(14,19,27,.98));border-radius:15px;padding:11px;margin:0 0 11px}
      .training-ai-quick-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.training-ai-quick-head b{font-size:13px}.training-ai-quick-head small{color:var(--muted);font-size:9px}
      .training-ai-input{width:100%;box-sizing:border-box;min-height:76px;resize:vertical;padding:10px 11px;line-height:1.5}
      .training-ai-actions{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px;margin-top:8px}.training-ai-actions.one{grid-template-columns:1fr}.training-ai-actions .btn{min-height:39px}
      .training-ai-mic.listening{border-color:#ff7887!important;color:#ff98a4!important}
      .training-ai-result{margin-top:8px;font-size:10px;line-height:1.55;color:#8894a5}.training-ai-result.good{color:#8fd7ad}.training-ai-result.warn{color:#e4bd72}
      .training-assistant-home{grid-column:1/-1!important;min-height:46px!important}
      #trainingAssistantModal .modal-panel{width:min(620px,100%);max-height:92vh}
      .training-assistant-body{padding:14px}.training-assistant-answer{min-height:88px;border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:12px;font-size:12px;line-height:1.7;white-space:pre-wrap;color:#dbe2ef}
      .training-assistant-examples{display:flex;gap:6px;overflow-x:auto;margin:9px 0;scrollbar-width:none}.training-assistant-example{flex:0 0 auto;border:1px solid var(--line);background:#111821;color:#8f9aac;border-radius:999px;padding:6px 9px;font-size:9px}
      .training-assistant-input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:10px}.training-assistant-input-row input{min-height:42px}.training-assistant-send{min-width:74px}
      .training-assistant-mic{margin-top:7px;width:100%;min-height:36px}
      @media(max-width:700px){#trainingAssistantModal.open .modal-panel{width:100%!important;max-width:none!important;max-height:none!important;min-height:100dvh!important}}
    `;
    document.head.appendChild(style);
  }

  function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
  function createSpeech(button,onText){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){button.style.display="none";return null}
    const r=new SR();r.lang="zh-CN";r.interimResults=true;r.continuous=false;
    let finalText="";
    r.onstart=()=>{button.classList.add("listening");button.textContent="正在听…"};
    r.onresult=e=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const text=e.results[i][0]?.transcript||"";
        if(e.results[i].isFinal)finalText+=text;else interim+=text;
      }
      onText(finalText+interim,false);
    };
    r.onend=()=>{button.classList.remove("listening");button.textContent="🎙 语音";if(finalText)onText(finalText,true)};
    r.onerror=()=>{button.classList.remove("listening");button.textContent="🎙 语音"};
    button.onclick=()=>{finalText="";try{r.start()}catch{}};
    return r;
  }

  function injectBatchQuick(){
    const modal=$("batchTrainingModal"),panel=modal?.querySelector(".modal-panel"),plan=modal?.querySelector(".batch-planbar");
    if(!panel||!plan||$("trainingAiQuick"))return;
    const box=document.createElement("section");box.id="trainingAiQuick";box.className="training-ai-quick";
    box.innerHTML='<div class="training-ai-quick-head"><b>✦ AI 快速记录</b><small>直接说 / 写整场训练</small></div><textarea id="trainingAiInput" class="training-ai-input" placeholder="例如：哑铃地板卧推 22.5kg，10、9、8次，RIR2；侧平举 7.5kg 15次三组"></textarea><div class="training-ai-actions" id="trainingAiActions"><button type="button" class="btn ghost training-ai-mic" id="trainingAiMic">🎙 语音</button><button type="button" class="btn" id="trainingAiParse">解析并加入</button></div><div id="trainingAiResult" class="training-ai-result"></div>';
    panel.insertBefore(box,plan);
    const mic=$("trainingAiMic"),input=$("trainingAiInput"),parse=$("trainingAiParse"),result=$("trainingAiResult");
    if(!speechSupported()){mic.style.display="none";$("trainingAiActions").classList.add("one")}
    else createSpeech(mic,(text,done)=>{input.value=text;if(done)input.focus()});
    parse.onclick=async()=>{
      const text=input.value.trim();if(!text)return toast("先说或写一下今天练了什么");
      parse.disabled=true;parse.textContent="解析中…";result.className="training-ai-result";result.textContent="AI 正在匹配动作库并拆分训练组…";
      try{
        const parsed=await parseTrainingText(text),applied=window.fitnessBatchTraining?.addParsedTraining?.(parsed);
        const added=applied?.added||[],warnings=[...(parsed.warnings||[])];
        if(applied?.skipped?.length)warnings.push("未加入："+applied.skipped.join("、"));
        result.className="training-ai-result "+(warnings.length?"warn":"good");
        result.textContent=added.length?("已加入 "+added.map(x=>x.name+" "+x.sets+"组").join(" · ")+(warnings.length?"；"+warnings.join("；"):"")):(warnings.join("；")||"没有解析出可加入的训练组");
        if(added.length||applied?.cardio)input.value="";
      }catch(err){result.className="training-ai-result warn";result.textContent=err?.message||"AI 训练解析失败"}
      finally{parse.disabled=false;parse.textContent="解析并加入"}
    };
  }

  function ensureAssistantModal(){
    if($("trainingAssistantModal"))return;
    const modal=document.createElement("div");modal.id="trainingAssistantModal";modal.className="modal";
    modal.innerHTML='<div class="modal-panel"><div class="ai-modal-head"><div><b>训练助手</b><small>直接查你的真实训练历史</small></div><button type="button" class="ai-modal-close" id="trainingAssistantClose" aria-label="关闭">×</button></div><div class="training-assistant-body"><div id="trainingAssistantAnswer" class="training-assistant-answer">可以直接问：“哑铃卧推我上次多重？”</div><div class="training-assistant-examples"><button type="button" class="training-assistant-example">哑铃卧推我上次多重？</button><button type="button" class="training-assistant-example">引体向上上次做了几组？</button><button type="button" class="training-assistant-example">侧平举这次从多少开始？</button></div><div class="training-assistant-input-row"><input id="trainingAssistantInput" type="text" placeholder="问上次重量、次数、RIR…"><button type="button" class="btn training-assistant-send" id="trainingAssistantSend">发送</button></div><button type="button" class="btn ghost training-assistant-mic" id="trainingAssistantMic">🎙 语音</button></div></div>';
    document.body.appendChild(modal);
    $("trainingAssistantClose").onclick=()=>modal.classList.remove("open");
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
    const input=$("trainingAssistantInput"),send=$("trainingAssistantSend"),answer=$("trainingAssistantAnswer"),mic=$("trainingAssistantMic");
    if(!speechSupported())mic.style.display="none";else createSpeech(mic,(text,done)=>{input.value=text;if(done)input.focus()});
    async function ask(){
      const q=input.value.trim();if(!q)return;
      send.disabled=true;send.textContent="…";answer.textContent="正在查你的训练记录…";
      try{
        const r=await askTrainingAssistant(q);
        answer.textContent=r.answer||"没有找到相关记录";
      }catch(err){answer.textContent=err?.message||"训练助手暂时无法回答"}
      finally{send.disabled=false;send.textContent="发送"}
    }
    send.onclick=ask;input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ask()}});
    modal.querySelectorAll(".training-assistant-example").forEach(b=>b.onclick=()=>{input.value=b.textContent;ask()});
  }

  function injectHomeAssistant(){
    const actions=$("aiHomeCard")?.querySelector(".ai-home-actions");
    if(!actions||$("aiTrainingAssistant"))return;
    const btn=document.createElement("button");btn.type="button";btn.id="aiTrainingAssistant";btn.className="ai-home-action training-assistant-home";
    btn.innerHTML="<strong>训练助手</strong>";
    btn.onclick=()=>{ensureAssistantModal();$("trainingAssistantModal").classList.add("open");setTimeout(()=>$("trainingAssistantInput")?.focus(),60)};
    actions.appendChild(btn);
  }

  let queued=false;
  function ensure(){
    queued=false;ensureStyles();injectBatchQuick();injectHomeAssistant();ensureAssistantModal();
  }
  function schedule(){
    if(queued)return;queued=true;requestAnimationFrame(ensure);
  }
  function setup(){
    ensure();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("fitness:changed",schedule);
    window.addEventListener("pageshow",schedule);
    setTimeout(ensure,180);setTimeout(ensure,600);
  }

  window.fitnessTrainingAI={parseTrainingText,askTrainingAssistant};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();