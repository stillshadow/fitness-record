(() => {
  const $ = id => document.getElementById(id);
  const CATEGORIES = [
    {id:"chest",label:"胸"},{id:"back",label:"背"},{id:"shoulder",label:"肩"},{id:"biceps",label:"二头"},{id:"triceps",label:"三头"},{id:"legs",label:"腿 / 臀"},{id:"calves",label:"小腿"},{id:"core",label:"腹 / 核心"},{id:"other",label:"其他"}
  ];
  let activeCategory="",scheduled=false;
  const getDB=()=>window.fitnessApp?.getDB?.()||{exercises:[]};
  const categoryOfGroup=group=>{const g=String(group||"");if(g.startsWith("胸"))return"chest";if(g.startsWith("背"))return"back";if(g.startsWith("肩"))return"shoulder";if(g.startsWith("二头"))return"biceps";if(g.startsWith("三头"))return"triceps";if(/^(股四头|腘绳肌|臀|大腿内侧)/.test(g))return"legs";if(g.startsWith("小腿"))return"calves";if(/腹|核心/.test(g))return"core";return"other"};
  function categoryForCard(card,db){const name=card.querySelector(".item-title")?.textContent.trim()||"",ex=(db.exercises||[]).find(x=>x.name===name);return categoryOfGroup(ex?.group)}
  function setupStyles(){if($("strengthFilterStyle"))return;const style=document.createElement("style");style.id="strengthFilterStyle";style.textContent=`.strength-category-bar{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.strength-category-bar::-webkit-scrollbar{display:none}.strength-category-chip{flex:0 0 auto;border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:999px;padding:6px 10px;font-size:12px}.strength-category-chip.active{background:var(--accent);border-color:var(--accent);color:#09101b;font-weight:800}`;document.head.appendChild(style)}
  function render(){scheduled=false;const box=$("strengthList");if(!box||!window.fitnessApp?.getDB)return;setupStyles();let bar=$("strengthCategoryBar");if(!bar){bar=document.createElement("div");bar.id="strengthCategoryBar";bar.className="strength-category-bar";box.parentElement?.insertBefore(bar,box)}const db=getDB(),cards=[...box.children].filter(x=>x.classList?.contains("item")),present=new Set(cards.map(card=>categoryForCard(card,db))),cats=CATEGORIES.filter(x=>present.has(x.id));if(!cats.length){bar.style.display="none";return}if(!activeCategory||!present.has(activeCategory))activeCategory=cats[0].id;bar.style.display="flex";bar.innerHTML=cats.map(x=>`<button type="button" class="strength-category-chip ${activeCategory===x.id?"active":""}" data-strength-cat="${x.id}">${x.label}</button>`).join("");bar.querySelectorAll("[data-strength-cat]").forEach(btn=>btn.addEventListener("click",()=>{activeCategory=btn.dataset.strengthCat||cats[0].id;render()}));cards.forEach(card=>{card.style.display=categoryForCard(card,db)===activeCategory?"grid":"none"})}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
  function setup(){const box=$("strengthList");if(!window.fitnessApp||!box)return setTimeout(setup,80);new MutationObserver(schedule).observe(box,{childList:true,subtree:true});window.addEventListener("fitness:changed",schedule);document.querySelectorAll('[data-page="training"]').forEach(b=>b.addEventListener("click",()=>setTimeout(render,0)));render()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));else setTimeout(setup,0);
})();

(() => {
  const load=(src,attr)=>{if(document.querySelector(`script[data-${attr}]`))return;const s=document.createElement('script');s.async=false;s.src=src;s.setAttribute(`data-${attr}`,'1');document.head.appendChild(s)};
  const boot=()=>{load('training-plan-v2.js?v=35','training-plan-v2');load('ui-v2.js?v=35','ui-v2');load('training-session.js?v=35','training-session')};
  if(document.readyState==='complete')setTimeout(boot,0);else window.addEventListener('load',boot,{once:true});
})();