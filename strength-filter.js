(() => {
  const $ = id => document.getElementById(id);
  const CATEGORIES = [
    {id:"chest",label:"胸"},
    {id:"back",label:"背"},
    {id:"shoulder",label:"肩"},
    {id:"biceps",label:"二头"},
    {id:"triceps",label:"三头"},
    {id:"legs",label:"腿 / 臀"},
    {id:"calves",label:"小腿"},
    {id:"core",label:"腹 / 核心"},
    {id:"other",label:"其他"}
  ];
  let activeCategory = "all";
  let scheduled = false;

  const getDB = () => window.fitnessApp?.getDB?.() || {exercises:[]};
  const categoryOfGroup = group => {
    const g = String(group || "");
    if (g.startsWith("胸")) return "chest";
    if (g.startsWith("背")) return "back";
    if (g.startsWith("肩")) return "shoulder";
    if (g.startsWith("二头")) return "biceps";
    if (g.startsWith("三头")) return "triceps";
    if (/^(股四头|腘绳肌|臀|大腿内侧)/.test(g)) return "legs";
    if (g.startsWith("小腿")) return "calves";
    if (/腹|核心/.test(g)) return "core";
    return "other";
  };

  function categoryForCard(card, db){
    const name = card.querySelector(".item-title")?.textContent.trim() || "";
    const ex = (db.exercises || []).find(x => x.name === name);
    return categoryOfGroup(ex?.group);
  }

  function setupStyles(){
    if ($("strengthFilterStyle")) return;
    const style = document.createElement("style");
    style.id = "strengthFilterStyle";
    style.textContent = `
      .strength-category-bar{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .strength-category-bar::-webkit-scrollbar{display:none}
      .strength-category-chip{flex:0 0 auto;border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:999px;padding:6px 10px;font-size:12px}
      .strength-category-chip.active{background:var(--accent);border-color:var(--accent);color:#09101b;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function render(){
    scheduled = false;
    const box = $("strengthList");
    if (!box || !window.fitnessApp?.getDB) return;
    setupStyles();

    let bar = $("strengthCategoryBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "strengthCategoryBar";
      bar.className = "strength-category-bar";
      box.parentElement?.insertBefore(bar, box);
    }

    const db = getDB();
    const cards = [...box.children].filter(x => x.classList?.contains("item"));
    const present = new Set(cards.map(card => categoryForCard(card, db)));
    const cats = CATEGORIES.filter(x => present.has(x.id));
    if (activeCategory !== "all" && !present.has(activeCategory)) activeCategory = "all";

    bar.style.display = cards.length ? "flex" : "none";
    bar.innerHTML = `<button type="button" class="strength-category-chip ${activeCategory === "all" ? "active" : ""}" data-strength-cat="all">全部</button>` +
      cats.map(x => `<button type="button" class="strength-category-chip ${activeCategory === x.id ? "active" : ""}" data-strength-cat="${x.id}">${x.label}</button>`).join("");

    bar.querySelectorAll("[data-strength-cat]").forEach(btn => btn.addEventListener("click", () => {
      activeCategory = btn.dataset.strengthCat || "all";
      render();
    }));

    cards.forEach(card => {
      const cat = categoryForCard(card, db);
      card.style.display = activeCategory === "all" || cat === activeCategory ? "grid" : "none";
    });
  }

  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  function setup(){
    const box = $("strengthList");
    if (!window.fitnessApp || !box) return setTimeout(setup, 80);
    new MutationObserver(schedule).observe(box, {childList:true, subtree:true});
    window.addEventListener("fitness:changed", schedule);
    document.querySelectorAll('[data-page="training"]').forEach(b => b.addEventListener("click", () => setTimeout(render, 0)));
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(setup, 0));
  else setTimeout(setup, 0);
})();

(() => {
  const load = (src,key) => {
    if (document.querySelector(`script[data-${key}]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.dataset[key] = '1';
    document.head.appendChild(s);
  };
  const boot = () => {
    load('day-plan-editor.js?v=27','dayPlanEditor');
    load('training-plan-v2.js?v=27','trainingPlanV2');
  };
  if (document.readyState === 'complete') setTimeout(boot,0);
  else window.addEventListener('load',boot,{once:true});
})();