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
 if(db.groceryPlanner&&Array.isArray(db.groceryPlanner.week))return db.groceryPlanner;
 const old=db.groceryChecklist||{};
 let names=C.initial.week.slice();
 const changes=[{},{"青花鱼净肉":"沙丁鱼","小白菜":"菠菜","西兰花":"菜花","青椒":"彩椒","蘑菇":"杏鲍菇"},{"青花鱼净肉":"三文鱼净肉","小白菜":"油麦菜","蘑菇":"香菇","卷心菜":"娃娃菜"}];
 names=names.map(n=>changes[Math.min(2,+old.week||0)][n]||n);
 return {week:names.map(n=>Object.assign(C.make(n,cat(n)),{checked:!!old.weekChecked?.[n]})),
 pantry:C.initial.pantry.map(n=>Object.assign(C.make(n,"常备储存"),{checked:!!old.pantryChecked?.[n]})),
 history:[],activeRecordId:null};
}
function store(s){const db=window.fitnessApp.getDB();db.groceryPlanner=s;window.fitnessApp.replaceDB(db);paint();}
function items(s){return tab==="pantry"?s.pantry:s.week;}
function groups(){return tab==="pantry"?["常备储存"]:["肉鱼蛋奶豆","蔬菜","水果薯类"];}
function record(s){return (s.history||[]).find(x=>x.id===s.activeRecordId);}
function snap(s){return {foods:s.week.filter(x=>x.checked).map(x=>({name:x.name,amount:x.amount,pieces:x.pieces,life:x.life,group:x.group})),
 pantry:s.pantry.filter(x=>x.checked).map(x=>({name:x.name,amount:x.amount,pieces:x.pieces}))};}
function sameRecord(s){const r=record(s);return !!r&&JSON.stringify({foods:r.foods,pantry:r.pantry})===JSON.stringify(snap(s));}
function paint(){
 if(!$("grocerySheet"))return;
 const s=load(),all=items(s),checked=all.filter(x=>x.checked).length,r=record(s);
 $("grocerySummary").textContent=s.week.filter(x=>x.checked).length+"/"+s.week.length+" 已购";
 ["week","pantry","history"].forEach(t=>$("gmTab"+t).classList.toggle("active",tab===t));
 $("gmCurrent").hidden=tab==="history";$("gmHistory").hidden=tab!=="history";
 $("gmTitle").textContent=tab==="week"?"本周食材（可随时替换）":"家中常备储存";
 $("gmProgress").textContent=checked+"/"+all.length+" 已勾选";
 $("gmNewWeek").hidden=tab!=="week";$("gmFinish").hidden=tab!=="week";
 $("gmFinish").textContent=r?"更新采购记录":"完成采购并记录";
 $("gmAdd").hidden=tab==="history";
 $("gmList").innerHTML=groups().map(g=>{
 const subset=all.filter(x=>x.group===g);if(!subset.length)return "";
 return '<section class="gm-group"><h3>'+esc(g)+'</h3>'+subset.map(x=>
 '<div class="gm-item"><input aria-label="已买 '+esc(x.name)+'" type="checkbox" data-check="'+esc(x.id)+'" '+(x.checked?"checked":"")+'>'+
 '<div class="gm-info"><b>'+esc(x.name)+'</b><span>'+esc(x.amount)+' ≈ '+esc(x.pieces)+'</span><small>保存：'+esc(x.life)+'</small></div>'+
 '<button type="button" class="gm-change" data-edit="'+esc(x.id)+'">替换/改量</button></div>'
 ).join("")+'</section>';
 }).join("");
 $("gmAiBox").hidden=tab!=="week"||!r;
 $("gmSaved").textContent=r?(sameRecord(s)?"已记录 "+r.date+"，"+r.foods.length+" 种食材":"清单有变化，请更新采购记录"):"";
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
 const s=load(),item=items(s).find(x=>x.id===id),category=item?.group||(tab==="pantry"?"常备储存":"蔬菜");
 $("gmEditorTitle").textContent=item?"替换或修改食材":"新增食材";
 $("gmCategory").innerHTML=groups().map(x=>'<option>'+esc(x)+'</option>').join("");
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
 const s=load(),arr=items(s),item=arr.find(x=>x.id===editId);
 if(item)Object.assign(item,{name,amount,pieces,life,group,checked:item.name===name&&item.checked});
 else arr.push({id:"ing_"+uid(),name,amount,pieces,life,group,checked:false});
 store(s);$("groceryEditor").classList.remove("open");
}
function deleteEdit(){
 const s=load();
 if(tab==="pantry")s.pantry=s.pantry.filter(x=>x.id!==editId);
 else s.week=s.week.filter(x=>x.id!==editId);
 store(s);$("groceryEditor").classList.remove("open");
}
function finish(){
 const s=load(),selected=s.week.filter(x=>x.checked);
 if(!selected.length){alert("先勾选实际买到的食材");return;}
 if(selected.length<s.week.length&&!confirm("仍有"+(s.week.length-selected.length)+"项未采购，只记录勾选的"+selected.length+"项，确定吗？"))return;
 const snapshot=snap(s),r=record(s);
 if(r){if(!sameRecord(s))r.recipe="";Object.assign(r,snapshot,{date:today()});}
 else{const h=Object.assign({id:"buy_"+uid(),date:today(),recipe:""},snapshot);s.history.push(h);s.activeRecordId=h.id;}
 aiError="";store(s);
}
function newWeek(){
 const s=load();
 if(s.week.some(x=>x.checked)&&!record(s)&&!confirm("本周采购尚未保存。仍要开始新一周吗？"))return;
 if(!confirm("开始新的一周？会清空勾选，保留食材搭配与所有历史记录。"))return;
 s.week=s.week.map(x=>Object.assign({},x,{checked:false}));s.activeRecordId=null;historyId=null;aiError="";
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
 brief.innerHTML='<div class="simple-card-head"><h2>🥬 本周食材</h2><small id="grocerySummary"></small></div><button class="simple-btn primary" type="button" id="gmOpen" style="width:100%">打开采购 / AI 菜谱</button>';
 $("simpleTrainingPlan").parentNode.insertBefore(brief,$("simpleTrainingPlan"));
 const sheet=document.createElement("div");sheet.id="grocerySheet";sheet.className="simple-sheet";sheet.setAttribute("role","dialog");
 sheet.innerHTML='<div class="simple-sheet-inner"><div class="simple-sheet-head"><h2>食材采购</h2><button id="gmClose">关闭</button></div>'+
 '<div class="gm-tabs"><button id="gmTabweek">本周</button><button id="gmTabpantry">长期储备</button><button id="gmTabhistory">采购历史</button></div>'+
 '<div id="gmCurrent"><div class="gm-bar"><b id="gmTitle"></b><small id="gmProgress"></small></div>'+
 '<p class="gm-note">数量是估算；冷藏按4℃以下、冷冻按-18℃计算，实际以包装和新鲜程度为准。</p><div id="gmList"></div>'+
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
 $("gmOpen").onclick=()=>{tab="week";paint();sheet.classList.add("open");sheet.scrollTop=0;};
 $("gmClose").onclick=()=>sheet.classList.remove("open");
 for(const t of ["week","pantry","history"])$("gmTab"+t).onclick=()=>{tab=t;paint();sheet.scrollTop=0;};
 $("gmList").onclick=e=>{const b=e.target.closest("[data-edit]");if(b)editor(b.dataset.edit);};
 $("gmList").onchange=e=>{const b=e.target.closest("[data-check]");if(!b)return;const s=load(),x=items(s).find(x=>x.id===b.dataset.check);if(x){x.checked=b.checked;store(s);}};
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