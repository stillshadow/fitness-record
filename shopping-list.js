(()=>{
"use strict";
if(window.__weeklyGroceries)return;window.__weeklyGroceries=true;
const $=id=>document.getElementById(id);
const OPTIONS=[
{title:"第1周：鸡胸、青花鱼",meat:[["鸡胸肉","200g"],["鸡腿肉","200g"],["猪里脊","350g"],["瘦牛肉","200g"],["青花鱼净肉","400g"],["虾仁","200g"]],veg:[["小白菜","300g"],["西兰花","500g"],["青椒","200g"],["蘑菇","150g"],["卷心菜","500g"]]},
{title:"第2周：鸡腿、沙丁鱼",meat:[["鸡胸肉","200g"],["鸡腿肉","200g"],["猪里脊","350g"],["瘦牛肉","200g"],["沙丁鱼可食部分","400g"],["虾仁","200g"]],veg:[["菠菜","300g"],["菜花","500g"],["彩椒","200g"],["杏鲍菇","150g"],["卷心菜","500g"]]},
{title:"第3周：鸡胸、三文鱼",meat:[["鸡胸肉","200g"],["鸡腿肉","200g"],["猪里脊","350g"],["瘦牛肉","200g"],["三文鱼净肉","400g"],["虾仁","200g"]],veg:[["油麦菜","300g"],["西兰花","500g"],["青椒","200g"],["香菇","150g"],["娃娃菜","500g"]]}
];
const PANTRY=[
["主食", [["大米","2.5kg"],["原味燕麦","500g"]]],
["冷冻食材", [["冷冻混合杂蔬","1kg"],["冷冻西兰花","500g"]]],
["调料", [["菜籽油","500ml"],["生抽","500ml"],["食盐","250g"],["黑胡椒粉","30g"],["米醋","250ml"]]]
];
let mode="week";
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function getState(){const s=window.fitnessApp.getDB().groceryChecklist||{};return{week:Math.min(2,Math.max(0,Number(s.week)||0)),weekChecked:s.weekChecked||{},pantryChecked:s.pantryChecked||{}};}
function save(s){const db=window.fitnessApp.getDB();db.groceryChecklist=s;window.fitnessApp.replaceDB(db);render();}
function groups(s){if(mode==="pantry")return PANTRY;const o=OPTIONS[s.week];return[
["肉、鱼、蛋、奶、豆",o.meat.concat([["豆腐","300g"],["鸡蛋","6个"],["纯牛奶","500ml"]])],
["蔬菜",o.veg.concat([["胡萝卜","200g"],["洋葱","200g"],["冷冻混合杂蔬","500g"]])],
["水果及其他",[["水果","约1.5kg"],["红薯","300g"],["生姜","50g"],["大蒜","1头"]]]
];}
function render(){
if(!$("grocerySheet"))return;
const s=getState(),gs=groups(s),checked=mode==="week"?s.weekChecked:s.pantryChecked;
const all=gs.flatMap(x=>x[1]),done=all.filter(x=>checked[x[0]]).length;
$("groceryCount").textContent=done+"/"+all.length+" 已勾选";
$("groceryTitle").textContent=mode==="week"?OPTIONS[s.week].title:"囤货和调料";
$("groceryTip").textContent=mode==="week"?"1人份：工作日5顿午餐 + 周末6顿。肉类按餐冷冻。":"不用每周买，库存不足再补。";
$("groceryNext").hidden=mode!=="week";
$("groceryWeekBtn").classList.toggle("active",mode==="week");
$("groceryPantryBtn").classList.toggle("active",mode==="pantry");
$("groceryItems").innerHTML=gs.map(g=>'<div class="grocery-group"><h3>'+escape(g[0])+'</h3>'+g[1].map(x=>'<label class="grocery-row"><input type="checkbox" data-item="'+escape(x[0])+'" '+(checked[x[0]]?"checked":"")+'><span>'+escape(x[0])+'</span><small>'+escape(x[1])+'</small></label>').join("")+'</div>').join("");
const weekly=OPTIONS[s.week].meat.length+3+OPTIONS[s.week].veg.length+3+4;
$("grocerySummary").textContent=s.weekChecked?Object.keys(s.weekChecked).filter(k=>s.weekChecked[k]).length+"/"+weekly+" 已采购":"打开清单";
}
function setup(){
if(!$("simpleApp")||!window.fitnessApp?.getDB)return setTimeout(setup,100);
if($("groceryBrief"))return;
const st=document.createElement("style");st.textContent=[
"#grocerySheet{z-index:130}",
".grocery-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}",
".grocery-actions button{padding:12px 4px;border:1px solid var(--simple-line);background:var(--simple-panel2);color:var(--simple-text);border-radius:12px}",
".grocery-actions button.active{background:var(--simple-accent);color:#10131a}",
".grocery-group{background:var(--simple-panel);border:1px solid var(--simple-line);border-radius:14px;padding:10px 13px;margin:12px 0}",
".grocery-group h3{font-size:13px;color:var(--simple-muted);margin:3px 0 9px}",
".grocery-row{display:flex;gap:10px;align-items:center;padding:11px 0;border-top:1px solid var(--simple-line);font-size:13px}",
".grocery-row input{width:19px;height:19px;accent-color:var(--simple-accent)}",
".grocery-row span{flex:1}.grocery-row small{font-size:12px;color:var(--simple-muted)}",
".grocery-row:has(input:checked) span{text-decoration:line-through;color:var(--simple-muted)}",
".grocery-tip{font-size:12px;line-height:1.6;color:var(--simple-muted)}"
].join("");document.head.appendChild(st);
const brief=document.createElement("section");brief.className="simple-card";brief.id="groceryBrief";
brief.innerHTML='<div class="simple-card-head"><h2>每周采购清单</h2><small id="grocerySummary"></small></div><button id="groceryOpen" class="simple-btn primary" style="width:100%" type="button">查看食材与购买量</button>';
const training=$("simpleTrainingPlan");training.parentNode.insertBefore(brief,training);
const sheet=document.createElement("div");sheet.id="grocerySheet";sheet.className="simple-sheet";sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
sheet.innerHTML='<div class="simple-sheet-inner"><div class="simple-sheet-head"><h2>每周采购清单</h2><button id="groceryClose">关闭</button></div><div class="grocery-actions"><button id="groceryWeekBtn">本周采购</button><button id="groceryPantryBtn">囤货 / 调料</button></div><div class="simple-card-head"><h2 id="groceryTitle"></h2><small id="groceryCount"></small></div><p id="groceryTip" class="grocery-tip"></p><div id="groceryItems"></div><button id="groceryNext" class="simple-btn primary" style="width:100%;min-height:46px">下一周：换食材并清空勾选</button><p class="grocery-tip">每周另用生米约600g、燕麦约100g；家里有库存就不用重复买。</p></div>';
document.body.appendChild(sheet);
$("groceryOpen").onclick=()=>{mode="week";render();sheet.classList.add("open");sheet.scrollTop=0;};
$("groceryClose").onclick=()=>sheet.classList.remove("open");
$("groceryWeekBtn").onclick=()=>{mode="week";render();};
$("groceryPantryBtn").onclick=()=>{mode="pantry";render();};
$("groceryItems").onchange=e=>{const i=e.target.closest("[data-item]");if(!i)return;const s=getState();(mode==="week"?s.weekChecked:s.pantryChecked)[i.dataset.item]=i.checked;save(s);};
$("groceryNext").onclick=()=>{if(!confirm("开始下一周？本周采购勾选将被清空。"))return;const s=getState();s.week=(s.week+1)%3;s.weekChecked={};save(s);sheet.scrollTop=0;};
document.addEventListener("keydown",e=>{if(e.key==="Escape")sheet.classList.remove("open");});
render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();