(()=>{
"use strict";
if(window.__groceryV2)return;window.__groceryV2=true;
const $=id=>document.getElementById(id), C=window.FITNESS_GROCERY_CATALOG;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
let tab="week",editId=null,historyId=null,working=false,aiError="";
function cat(name){for(const [key,arr] of Object.entries(C.category))if(key!=="常备储存"&&arr.includes(name))return key;return "水果薯类";}
function load(){
 const db=window.fitnessApp.getDB();
 if(db.groceryPlanner&&Array.isArray(db.groceryPlanner.week)){const v=db.groceryPlanner;return {...v,cycle:v.cycle||0,lastBought:v.lastBought||{}};}
 const old=db.groceryChecklist||{};
 let names=C.initial.week.slice();
 const changes=[{},{"青花鱼净肉":"沙丁鱼","小白菜":"菠菜","西兰花":"菜花","青椒":"彩椒","蘑菇":"杏鲍菇"},{"青花鱼净肉":"三文鱼净肉","小白菜":"油麦菜","蘑菇":"香菇","卷心菜":"娃娃菜"}];
 names=names.map(n=>changes[Math.min(2,+old.week||0)][n]||n);
 return {week:names.map(n=>Object.assign(C.make(n,cat(n)),{checked:!!old.weekChecked?.[n]})),
 pantry:C.initial.pantry.map(n=>Object.assign(C.make(n,"常备储存"),{checked:!!old.pantryChecked?.[n]})),
 history:[],activeRecordId:null,cycle:0,lastBought:{}};
}
function store(s){const db=window.fitnessApp.getDB();db.groceryPlanner=s;window.fitnessApp.replaceDB(db);paint();}
function items(s){return tab==="pantry"?s.pantry:s.week;}
function groups(){return tab==="pantry"?["常备储存"]:["肉鱼蛋奶豆","蔬菜","水果薯类","常备储存"];}
function record(s){return (s.history||[]).find(x=>x.id===s.activeRecordId);}
function snap(s){return {foods:s.week.filter(x=>x.checked).map(x=>({name:x.name,amount:x.amount,pieces:x.pieces,life:x.life,group:x.group})),
 pantry:s.pantry.filter(x=>x.checked).map(x=>({name:x.name,amount:x.amount,pieces:x.pieces}))};}
function sameRecord(s){const r=record(s);return !!r&&JSON.stringify({foods:r.foods,pantry:r.pantry})===JSON.stringify(snap(s));}

const FROZEN=/^(鸡胸肉|去骨鸡腿肉|猪里脊|瘦牛肉|青花鱼净肉|沙丁鱼|三文鱼净肉|秋刀鱼|去壳虾仁|冷冻混合杂蔬|冷冻西兰花)$/;
const PANTRY_CYCLE={"大米":4,"原味燕麦":5,"冷冻西兰花":2,"菜籽油":12,"生抽":12,"食盐":24,"黑胡椒粉":12,"米醋":12};
function allGroceries(s){return s.week.concat(s.pantry)}
function weeksFor(s,x){return s.pantry.includes(x)?PANTRY_CYCLE[x.name]||4:(FROZEN.test(x.name)?2:1)}
function needsBuying(s,x){const last=s.lastBought[x.name],recorded=record(s)?.purchases?.some(y=>y.name===x.name);return !Number.isFinite(last)||s.cycle-last>=weeksFor(s,x)||!!(recorded&&x.checked)}
function amountToBuy(s,x){
 const weeks=weeksFor(s,x);
 if(weeks===1||s.pantry.includes(x))return x.amount;
 const m=String(x.amount).match(/^(\d+(?:\.\d+)?)(g|kg|ml|个|盒)$/i);
 if(!m)return x.amount+"（约两周份）";
 let n=+m[1]*weeks,unit=m[2];
 if(unit==="g"&&n>=1000){n/=1000;unit="kg";}
 return n+unit+"（约"+weeks+"周份）";
}
function expectedAvailable(s){return allGroceries(s).filter(x=>s.lastBought[x.name]!==undefined&&s.cycle-s.lastBought[x.name]<weeksFor(s,x)).map(x=>({name:x.name,amount:x.amount,pieces:x.pieces,life:x.life}));}

function piecesToBuy(s,x){
 const text=String(x.pieces||"按包装"),weeks=weeksFor(s,x);
 if(weeks===1||s.pantry.includes(x)||!/\d/.test(text))return text;
 return text.replace(/(\d+)(?:～(\d+))?/,(_,a,b)=>b?(+a*weeks)+"～"+(+b*weeks):String(+a*weeks));
}
function autoSunday(){
 const now=new Date(),s=load(),r=record(s);
 if(now.getDay()!==0||!r?.date||s.lastRolloverDate===today())return;
 const passed=(Date.parse(today()+"T12:00:00")-Date.parse(r.date+"T12:00:00"))/86400000;
 if(!Number.isFinite(passed)||passed<6)return;
 s.week=s.week.map(x=>({...x,checked:false}));
 s.pantry=s.pantry.map(x=>({...x,checked:false}));
 s.cycle=(s.cycle||0)+1;s.lastRolloverDate=today();s.activeRecordId=null;historyId="";aiError="";
 store(s);
}
function paint(){
 if(!$("grocerySheet"))return;
 const s=load(),allItems=tab==="pantry"?s.pantry:allGroceries(s),all=tab==="pantry"?allItems:allItems.filter(x=>needsBuying(s,x)),checked=all.filter(x=>x.checked).length,r=record(s);
 $("grocerySummary").textContent=allGroceries(s).filter(x=>needsBuying(s,x)&&!x.checked).length+"项待买";
 ["week","pantry","history"].forEach(t=>$("gmTab"+t).classList.toggle("active",tab===t));
 $("gmCurrent").hidden=tab==="history";$("gmHistory").hidden=tab!=="history";
 $("gmTitle").textContent=tab==="week"?"本周建议采购":"长期储备 / 补货";
 $("gmProgress").textContent=checked+"/"+all.length+" 已勾选";
 $("gmNewWeek").hidden=tab!=="week";$("gmFinish").hidden=tab!=="week";
 $("gmFinish").textContent=r?"更新采购记录":"完成采购并记录";
 $("gmAdd").hidden=tab==="history";
 const renderEntry=x=>{
  const isPantry=s.pantry.includes(x),bulk=!isPantry&&weeksFor(s,x)===2;
  const advice=C.storageAdvice(x.name,x.life,x.group);
  const quantity=amountToBuy(s,x).replace(/（约\d+周份）/,"");
  const pieces=piecesToBuy(s,x);
  const due=needsBuying(s,x);
  const primary=tab==="pantry"&&!due?"预计暂不用补货":"买 "+quantity;
  return '<div class="gm-item">'+
    '<input aria-label="已买 '+esc(x.name)+'" type="checkbox" data-check="'+esc(x.id)+'" '+(x.checked?'checked':'')+'>'+
    '<div class="gm-info"><div class="gm-food-head"><b>'+esc(x.name)+'</b>'+
      (bulk?'<span class="gm-bulk">买 2 周量</span>':'')+'</div>'+
    '<div class="gm-buy"><strong>'+esc(primary)+'</strong><span>'+esc(pieces)+'</span></div>'+
    '<div class="gm-storage"><span class="gm-storage-place">'+esc(advice.place)+'</span>'+
      '<span class="gm-storage-method">'+esc(advice.method)+'</span>'+
      '<small>保存期限：'+esc(advice.expiry)+'</small></div></div>'+
    '<button type="button" class="gm-change" data-edit="'+esc(x.id)+'">替换 / 改量</button></div>';
 };
 const displayGroups=tab==="week"?
  [
   {name:"❄️ 两周量 · 买回分装冷冻",filter:x=>!s.pantry.includes(x)&&weeksFor(s,x)===2},
   {name:"🥬 本周新鲜食材",filter:x=>!s.pantry.includes(x)&&weeksFor(s,x)===1},
   {name:"📦 长期储备补货",filter:x=>s.pantry.includes(x)}
  ]:
  [{name:"📦 常备食品与调料",filter:x=>true}];
 $("gmList").innerHTML=displayGroups.map(g=>{
  const subset=all.filter(g.filter);
  if(!subset.length)return "";
  return '<section class="gm-group"><h3>'+esc(g.name)+'</h3>'+subset.map(renderEntry).join("")+'</section>';
 }).join("")||(tab==="week"?'<p class="gm-note">按预计库存，本周没有必须补购的食材。</p>':"");
 if(tab==="week"){
  const enough=allItems.filter(x=>!needsBuying(s,x));
  if(enough.length)$("gmList").innerHTML+='<details class="gm-group"><summary>预计库存足够（'+enough.length+'项，不用再买）</summary>'+
   enough.map(x=>'<div class="gm-item"><div class="gm-info"><b>'+esc(x.name)+'</b><small>'+esc(C.storageAdvice(x.name,x.life,x.group).place)+' · 当前按库存估算暂不补货</small></div>'+
   '<button class="gm-change" data-edit="'+esc(x.id)+'">调整</button></div>').join("")+'</details>';
 }
 $("gmAiBox").hidden=tab!=="week"||!r;
 $("gmSaved").textContent=r?("已保存 "+r.date+" 的采购记录；本周已买 "+(r.purchases||r.foods||[]).length+" 项。"):"预计库存与实际不同时，可手动调整或提前补货。";
 $("gmAiText").textContent=aiError||r?.recipe||"完成采购后，根据买到的食材生成简单健身菜谱。";
 $("gmAiButton").disabled=working||!r;
 $("gmAiButton").textContent=working?"正在生成…":r?.recipe?"重新推荐菜谱":"AI 推荐做什么菜";
 if(tab==="history"){
  $("gmHistory").innerHTML=(s.history||[]).length?s.history.slice().reverse().map(h=>
   '<div class="gm-history"><b>'+esc(h.date)+' · '+h.foods.length+' 种食材</b><small>'+esc(h.foods.map(x=>x.name).join("、"))+'</small>'+
   '<button type="button" data-history="'+esc(h.id)+'">查看记录</button></div>'
  ).join("")+'<div id="gmHistoryDetail"></div>':'<p class="gm-note">还没有保存过采购记录。</p>';
  const h=s.history.find(x=>x.id===historyId);
  if(h)$("gmHistoryDetail").innerHTML='<section class="gm-group"><h3>'+esc(h.date)+' 采购记录</h3>'+
   h.foods.map(x=>'<div class="gm-history-line">'+esc(x.name)+' · '+esc(x.amount)+'（'+esc(x.pieces)+'）</div>').join("")+
   '<h3>AI 菜谱</h3><p class="gm-ai-text">'+esc(h.recipe||"未生成")+'</p></section>';
 }
}
function populate(name,category){
 const names=C.category[category]||[];
 $("gmOption").innerHTML='<option value="">自定义食材…</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join("");
 $("gmOption").value=names.includes(name)?name:"";
 $("gmCustomLabel").hidden=!!$("gmOption").value;
}
function updatePreset(){
 const name=$("gmOption").value;$("gmCustomLabel").hidden=!!name;
 if(name){const a=C.list[name];if(a){$("gmWeight").value=a[0];$("gmCount").value=a[1];$("gmLife").value=a[2];}}
}
function editor(id){
 editId=id||"new";
 const s=load(),item=allGroceries(s).find(x=>x.id===id),category=item?.group||(tab==="pantry"?"常备储存":"蔬菜");
 $("gmEditorTitle").textContent=item?"替换或修改食材":"新增食材";
 $("gmCategory").innerHTML=(category==="常备储存"?["常备储存"]:["肉鱼蛋奶豆","蔬菜","水果薯类"]).map(x=>'<option>'+esc(x)+'</option>').join("");
 $("gmCategory").value=category;populate(item?.name||"",category);
 $("gmCustom").value=item?.name&&!C.list[item.name]?item.name:"";
 $("gmWeight").value=item?.amount||"";$("gmCount").value=item?.pieces||"";$("gmLife").value=item?.life||"";
 $("gmDelete").hidden=!item;
 $("groceryEditor").classList.add("open");
}
function applyEdit(){
 const name=($("gmOption").value||$("gmCustom").value).trim();
 const amount=$("gmWeight").value.trim(),pieces=$("gmCount").value.trim(),life=$("gmLife").value.trim(),group=$("gmCategory").value;
 if(!name||!amount||!pieces||!life){alert("请填写名称、购买量、个数和保存期限");return;}
 const s=load(),item=allGroceries(s).find(x=>x.id===editId),arr=item?(s.pantry.includes(item)?s.pantry:s.week):(group==="常备储存"?s.pantry:s.week);
 if(item)Object.assign(item,{name,amount,pieces,life,group,checked:item.name===name&&item.checked});
 else arr.push({id:"ing_"+uid(),name,amount,pieces,life,group,checked:false});
 store(s);$("groceryEditor").classList.remove("open");
}
function deleteEdit(){
 const s=load();
 s.pantry=s.pantry.filter(x=>x.id!==editId);
 s.week=s.week.filter(x=>x.id!==editId);
 store(s);$("groceryEditor").classList.remove("open");
}
function finish(){
 const s=load(),selected=allGroceries(s).filter(x=>x.checked&&needsBuying(s,x));
 const missing=allGroceries(s).filter(x=>!x.checked&&needsBuying(s,x));
 if(!selected.length&&!expectedAvailable(s).length){alert("先勾选实际买到的食材");return;}
 if(missing.length&&!confirm("还有"+missing.length+"项待买。仅记录已勾选的食材，确定吗？"))return;
 const previous=record(s),old=previous?.purchases||[];
 const purchases=selected.map(x=>({name:x.name,amount:amountToBuy(s,x),pieces:x.pieces}));
 for(const x of old){if(!purchases.some(y=>y.name===x.name)&&s.lastBought[x.name]===s.cycle)delete s.lastBought[x.name];}
 selected.forEach(x=>s.lastBought[x.name]=s.cycle);
 const snapshot={foods:purchases,purchases,available:expectedAvailable(s),pantry:s.pantry.filter(x=>!needsBuying(s,x)||x.checked).map(x=>({name:x.name,amount:x.amount}))};
 if(previous){
  if(JSON.stringify(previous.purchases||[])!==JSON.stringify(purchases))previous.recipe="";
  Object.assign(previous,snapshot,{date:today()});
 }else{
  const r={id:"buy_"+uid(),date:today(),recipe:"",...snapshot};
  s.history.push(r);s.activeRecordId=r.id;
 }
 aiError="";store(s);
 if(!record(s)?.recipe&&typeof window.fitnessDietAIAsk==="function")recommend();
}
function newWeek(){
 const s=load();
 if(s.lastRolloverDate===today()){alert("今天已经开启过新一周，不会重复操作。");return;}
 if(!record(s)&&allGroceries(s).some(x=>x.checked)&&!confirm("还没有保存采购记录，继续开始新一周吗？"))return;
 if(!confirm("开始新一周？会按上次采购时间与预计使用周期更新清单，历史记录会保留。"))return;
 s.week=s.week.map(x=>({...x,checked:false}));
 s.pantry=s.pantry.map(x=>({...x,checked:false}));
 s.cycle=(s.cycle||0)+1;s.lastRolloverDate=today();
 s.activeRecordId=null;historyId=null;aiError="";
 store(s);$("grocerySheet").scrollTop=0;
}
async function recommend(){
 const s=load(),r=record(s);if(!r||working)return;
 if(typeof window.fitnessDietAIAsk!=="function"){aiError="AI 尚未准备好，请刷新 App。";paint();return;}
 const prompt=[
 "你是简洁、实用的健身食谱助手。我只有电炒锅、小电饭煲、微波炉和冰箱。",
 "工作日5顿只做午餐：早上现做、冷藏带公司、中午复热；周末自己做三餐。",
 "请根据下面这次真实采购的食材推荐6道不同菜式，优先用保存期短的食材，偏向高蛋白、少油、简单好做。",
 "每道给：菜名、使用哪些采购食材、1至2句话做法；告诉我哪些要优先吃或提前冷冻。",
 "必须仅将清单内食材当作已有。没有的调料或主食可以提，但标注需另备。不要虚构营养成分、保质期。",
 "本次买到："+JSON.stringify(r.foods),
 "按此前采购记录预计还可用的食物："+JSON.stringify(r.available||[]),
 "家中已确认有的常备食材："+JSON.stringify(r.pantry)
 ].join("\n");
 working=true;aiError="";paint();
 try{
  const text=await window.fitnessDietAIAsk(prompt);
  const current=load(),target=current.history.find(x=>x.id===r.id);
  if(target){target.recipe=text;store(current);}
 }catch(err){aiError="生成失败："+(err?.message||"请检查 AI 配置");}
 finally{working=false;paint();}
}
function resetGroceries(){
 if(!confirm("恢复默认食材模板？将找回误删食材并覆盖自定义搭配，但不会清空采购历史。"))return;
 const s=load(),status=Object.fromEntries(s.week.concat(s.pantry).map(x=>[x.name,x.checked]));
 s.week=C.initial.week.map(n=>({...C.make(n,cat(n)),checked:!!status[n]}));
 s.pantry=C.initial.pantry.map(n=>({...C.make(n,"常备储存"),checked:!!status[n]}));
 store(s);
}
function styles(){
 const st=document.createElement("style");st.id="gmStyle";st.textContent=[
 "#grocerySheet,#groceryEditor{z-index:135}",
 ".gm-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:16px}",
 ".gm-tabs button{border:1px solid var(--simple-line);background:var(--simple-panel2);color:var(--simple-text);border-radius:10px;min-height:43px;font-size:12px}",
 ".gm-tabs button.active{background:var(--simple-accent);color:#11151c;font-weight:700}",
 ".gm-bar{display:flex;justify-content:space-between;align-items:center;gap:10px}.gm-bar small,.gm-note{color:var(--simple-muted);font-size:11px;line-height:1.6}",
 ".gm-group{border:1px solid var(--simple-line);background:var(--simple-panel);border-radius:14px;padding:10px 12px;margin:12px 0}",
 ".gm-group h3{font-size:13px;color:var(--simple-muted);margin:2px 0 10px}",
 ".gm-item{display:flex;gap:9px;align-items:center;border-top:1px solid var(--simple-line);padding:11px 0}",
 ".gm-item>input{width:19px;height:19px;accent-color:var(--simple-accent);flex-shrink:0}",
 ".gm-info{flex:1;min-width:0}.gm-info b{display:block;font-size:13px}.gm-info span,.gm-info small{display:block;color:var(--simple-muted);font-size:11px;margin-top:3px;line-height:1.4}",

 ".gm-food-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.gm-food-head b{font-size:14px}",
 ".gm-bulk{display:inline-flex;border-radius:7px;background:#29394f;border:1px solid #789dd1;color:#d4e6ff!important;padding:3px 7px;font-weight:800;font-size:11px!important;white-space:nowrap}",
 ".gm-buy{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:6px}.gm-buy strong{font-size:16px;color:#f1f5ff}.gm-buy span{font-size:12px;color:#c9d4e8}",
 ".gm-storage{margin-top:9px;background:#1b2633;border-radius:9px;padding:9px 10px;display:flex;flex-direction:column;gap:4px;border:1px solid #2b3c50}",
 ".gm-storage-place{font-size:12px!important;color:#c5deff!important;font-weight:750}",
 ".gm-storage-method{font-size:12px!important;color:#d8dfe8!important;line-height:1.55!important}",
 ".gm-storage small{color:#9eafc2!important;font-size:11px!important;margin:0!important}",
 ".gm-info{min-width:0}.gm-item{align-items:flex-start}.gm-item>input{margin-top:5px}.gm-item>.gm-change{margin-top:3px}",
 ".gm-item:has(input:checked) b{text-decoration:line-through;color:var(--simple-muted)}",
 ".gm-change{font-size:11px;color:var(--simple-text);background:var(--simple-panel2);border:1px solid var(--simple-line);border-radius:9px;padding:8px 6px;flex-shrink:0}",
 ".gm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}",
 ".gm-ai-text{white-space:pre-wrap;line-height:1.7;font-size:12px;color:#d5dbea}",
 ".gm-history{display:grid;gap:7px;border:1px solid var(--simple-line);padding:12px;margin:10px 0;border-radius:12px}",
 ".gm-history b{font-size:13px}.gm-history small{font-size:11px;color:var(--simple-muted);line-height:1.5}",
 ".gm-history button{padding:10px;color:var(--simple-text);background:var(--simple-panel2);border:1px solid var(--simple-line);border-radius:9px}",
 ".gm-history-line{padding:8px 0;border-top:1px solid var(--simple-line);font-size:12px}",
 "#groceryEditor .simple-field input,#groceryEditor .simple-field select{box-sizing:border-box;width:100%;min-height:43px;background:var(--simple-panel2);border:1px solid var(--simple-line);color:var(--simple-text);padding:9px;border-radius:9px}"
 ].join("");document.head.appendChild(st);
}
function setup(){
 if(!$("simpleApp")||!window.fitnessApp?.getDB||!C)return setTimeout(setup,80);
 if($("groceryBriefV2"))return;
 styles();
 const brief=document.createElement("section");brief.id="groceryBriefV2";brief.className="simple-card";
 brief.innerHTML='<div class="simple-card-head"><h2>🛒 周日采购清单</h2><small id="grocerySummary"></small></div><button class="simple-btn primary" type="button" id="gmOpen" style="width:100%">查看本周要买什么</button>';
 $("simpleTrainingPlan").parentNode.insertBefore(brief,$("simpleTrainingPlan"));
 const sheet=document.createElement("div");sheet.id="grocerySheet";sheet.className="simple-sheet";sheet.setAttribute("role","dialog");
 sheet.innerHTML='<div class="simple-sheet-inner"><div class="simple-sheet-head"><h2>食材采购</h2><button id="gmClose">关闭</button></div>'+
 '<div class="gm-tabs"><button id="gmTabweek">本周</button><button id="gmTabpantry">囤货</button><button id="gmTabhistory">采购历史</button></div>'+
 '<div id="gmCurrent"><div class="gm-bar"><b id="gmTitle"></b><small id="gmProgress"></small></div>'+
 '<p class="gm-note">冷冻食材已按 2 周购买量计算；每项显示具体保存步骤。期限仅供参考，以包装和实际状态为准。</p><div id="gmList"></div>'+
 '<button type="button" class="simple-btn" id="gmAdd">＋ 添加食材</button>'+
 '<button type="button" class="simple-btn" id="gmReset">↻ 恢复默认食材</button>'+
 '<div class="gm-actions"><button class="simple-btn primary" id="gmFinish">完成采购并记录</button><button class="simple-btn" id="gmNewWeek">开始新一周</button></div>'+
 '<p id="gmSaved" class="gm-note"></p><div id="gmAiBox" class="gm-group" hidden><h3>✨ 已购食材推荐菜谱</h3>'+
 '<button class="simple-btn primary" id="gmAiButton" style="width:100%">AI 推荐做什么菜</button><p id="gmAiText" class="gm-ai-text"></p></div></div>'+
 '<div id="gmHistory" hidden></div></div>';
 document.body.appendChild(sheet);
 const ed=document.createElement("div");ed.className="simple-sheet";ed.id="groceryEditor";ed.setAttribute("role","dialog");
 ed.innerHTML='<div class="simple-sheet-inner"><div class="simple-sheet-head"><h2 id="gmEditorTitle">编辑食材</h2><button id="gmCancel">返回</button></div>'+
 '<div class="simple-field"><label>类别</label><select id="gmCategory"></select></div>'+
 '<div class="simple-field"><label>选一种食材</label><select id="gmOption"></select></div>'+
 '<div class="simple-field" id="gmCustomLabel"><label>自定义名称</label><input id="gmCustom"></div>'+
 '<div class="simple-field"><label>采购重量/容量</label><input id="gmWeight" placeholder="例如 300g"></div>'+
 '<div class="simple-field"><label>约等于几个/几份</label><input id="gmCount" placeholder="例如 2个"></div>'+
 '<div class="simple-field"><label>保存方式及期限</label><input id="gmLife" placeholder="按包装说明填写"></div>'+
 '<div class="gm-actions"><button class="simple-btn primary" id="gmSave">保存食材</button><button class="simple-btn danger" id="gmDelete">删除</button></div></div>';
 document.body.appendChild(ed);
 $("gmOpen").onclick=()=>{autoSunday();tab="week";paint();sheet.classList.add("open");sheet.scrollTop=0;};
 $("gmClose").onclick=()=>sheet.classList.remove("open");
 for(const t of ["week","pantry","history"])$("gmTab"+t).onclick=()=>{tab=t;paint();sheet.scrollTop=0;};
 $("gmList").onclick=e=>{const b=e.target.closest("[data-edit]");if(b)editor(b.dataset.edit);};
 $("gmList").onchange=e=>{const b=e.target.closest("[data-check]");if(!b)return;const s=load(),x=allGroceries(s).find(x=>x.id===b.dataset.check);if(x){x.checked=b.checked;store(s);}};
 $("gmReset").onclick=resetGroceries;
 $("gmAdd").onclick=()=>editor("");$("gmFinish").onclick=finish;$("gmNewWeek").onclick=newWeek;$("gmAiButton").onclick=recommend;
 $("gmHistory").onclick=e=>{const b=e.target.closest("[data-history]");if(b){historyId=b.dataset.history;paint();}};
 $("gmCancel").onclick=()=>ed.classList.remove("open");
 $("gmCategory").onchange=()=>{populate("",$("gmCategory").value);updatePreset();};
 $("gmOption").onchange=updatePreset;
 $("gmSave").onclick=applyEdit;$("gmDelete").onclick=deleteEdit;
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){ed.classList.remove("open");sheet.classList.remove("open");}});
 paint();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();