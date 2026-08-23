(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num = v => +v || 0;
  const fmt = (v,d=1) => Number(v || 0).toFixed(d).replace(/\.0$/,"");
  const kcal = (c,p,f) => Math.round(num(c)*4 + num(p)*4 + num(f)*9);
  const db = () => window.fitnessApp?.getDB?.() || {foods:[],meals:[]};
  const toast = msg => {
    const t=$("toast"); if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  };
  const commitDB = next => {
    next.meta=next.meta||{};
    next.meta.updatedAt=new Date().toISOString();
    next.meta.userTouched=true;
    window.fitnessApp.replaceDB(next);
    window.dispatchEvent(new CustomEvent("fitness:changed"));
  };

  const isServing = f => f?.basis === "serving";
  const basisOf = f => isServing(f) ? "serving" : (f?.basis === "per100ml" || f?.unit === "ml" ? "per100ml" : "per100g");
  const displayMacros = f => isServing(f)
    ? {c:num(f.c)/100,p:num(f.p)/100,f:num(f.f)/100}
    : {c:num(f.c),p:num(f.p),f:num(f.f)};
  const basisText = f => {
    if(isServing(f)){
      const label=f.servingLabel||f.unit||"份";
      const size=num(f.servingSize)>0?`（约 ${fmt(f.servingSize)}${f.servingSizeUnit||"g"}）`:"";
      return `每1${label}${size}`;
    }
    return basisOf(f)==="per100ml"?"每100ml":"每100g";
  };

  function setupLibraryModal(){
    const modal=$("libFoodModal"), name=$("libFoodName"), unit=$("libFoodUnit");
    if(!modal||!name||!unit||$("libFoodBasis"))return;

    const grid=name.closest(".field-grid");
    if(!grid)return;

    const basisWrap=document.createElement("div");
    basisWrap.innerHTML='<label for="libFoodBasis">营养基准</label><select id="libFoodBasis"><option value="per100g">每100g</option><option value="per100ml">每100ml</option><option value="serving">每份</option></select>';
    grid.insertBefore(basisWrap, unit.parentElement);
    unit.parentElement.style.display="none";

    const labelWrap=document.createElement("div");
    labelWrap.id="libServingLabelWrap";
    labelWrap.innerHTML='<label for="libServingLabel">每份单位</label><input id="libServingLabel" placeholder="份 / 袋 / 盒 / 瓶 / 个">';
    grid.insertBefore(labelWrap, grid.children[2]||null);

    const sizeWrap=document.createElement("div");
    sizeWrap.id="libServingSizeWrap";
    sizeWrap.innerHTML='<label for="libServingSize">每份重量（可选）</label><div style="display:grid;grid-template-columns:1fr 78px;gap:7px"><input id="libServingSize" type="number" step="0.1" inputmode="decimal"><select id="libServingSizeUnit"><option value="g">g</option><option value="ml">ml</option></select></div>';
    grid.insertBefore(sizeWrap, grid.children[3]||null);

    const preview=document.createElement("div");
    preview.id="libFoodKcalPreview";
    preview.className="meta";
    preview.style.cssText="grid-column:1/-1;margin-top:-2px";
    grid.appendChild(preview);

    const update=()=>{
      const basis=$("libFoodBasis").value;
      const serving=basis==="serving";
      $("libServingLabelWrap").style.display=serving?"block":"none";
      $("libServingSizeWrap").style.display=serving?"block":"none";
      const suffix=serving?` /${$("libServingLabel").value.trim()||"份"}`:(basis==="per100ml"?" /100ml":" /100g");
      const cLabel=modal.querySelector('label[for="libFoodC"]');
      const pLabel=modal.querySelector('label[for="libFoodP"]');
      const fLabel=modal.querySelector('label[for="libFoodF"]');
      if(cLabel)cLabel.textContent="碳水"+suffix;
      if(pLabel)pLabel.textContent="蛋白质"+suffix;
      if(fLabel)fLabel.textContent="脂肪"+suffix;
      const C=num($("libFoodC").value),P=num($("libFoodP").value),F=num($("libFoodF").value);
      $("libFoodKcalPreview").textContent=`约 ${kcal(C,P,F)} kcal${serving?` / 1${$("libServingLabel").value.trim()||"份"}`:(basis==="per100ml"?" / 100ml":" / 100g")}`;
    };
    ["libFoodBasis","libServingLabel","libFoodC","libFoodP","libFoodF"].forEach(id=>$(id)?.addEventListener("input",update));
    $("libFoodBasis").addEventListener("change",update);
    update();

    const save=$("saveLibFoodBtn");
    if(save&&!save.dataset.flexBasis){
      save.dataset.flexBasis="1";
      save.addEventListener("click",e=>{
        e.preventDefault();e.stopImmediatePropagation();saveLibraryFood();
      },true);
    }
  }

  function openLibraryFood(id=""){
    setupLibraryModal();
    const f=db().foods?.find(x=>x.id===id);
    $("editingFoodId").value=id;
    $("libFoodModalTitle").textContent=id?"编辑食物":"添加食物";
    $("libFoodName").value=f?.name||"";
    const basis=basisOf(f);
    $("libFoodBasis").value=basis;
    $("libServingLabel").value=isServing(f)?(f.servingLabel||f.unit||"份"):"份";
    $("libServingSize").value=isServing(f)&&num(f.servingSize)>0?f.servingSize:"";
    $("libServingSizeUnit").value=f?.servingSizeUnit||"g";
    const m=f?displayMacros(f):{c:0,p:0,f:0};
    $("libFoodC").value=f?m.c:"";
    $("libFoodP").value=f?m.p:"";
    $("libFoodF").value=f?m.f:"";
    $("libFoodBasis").dispatchEvent(new Event("change"));
    $("libFoodModal").classList.add("open");
  }

  function saveLibraryFood(){
    const id=$("editingFoodId")?.value||"";
    const name=$("libFoodName")?.value.trim()||"";
    if(!name)return toast("填写食物名称");
    const basis=$("libFoodBasis")?.value||"per100g";
    const C=num($("libFoodC")?.value),P=num($("libFoodP")?.value),F=num($("libFoodF")?.value);
    let food;
    if(basis==="serving"){
      const label=$("libServingLabel")?.value.trim()||"份";
      food={
        id:id||`food_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
        name,basis:"serving",unit:label,servingLabel:label,
        servingSize:num($("libServingSize")?.value)||null,
        servingSizeUnit:$("libServingSizeUnit")?.value||"g",
        c:C*100,p:P*100,f:F*100
      };
    }else{
      const unit=basis==="per100ml"?"ml":"g";
      food={id:id||`food_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,name,basis,unit,c:C,p:P,f:F};
    }
    const next=db();next.foods=next.foods||[];
    const i=next.foods.findIndex(x=>x.id===id);
    if(i>=0)next.foods[i]=food;else next.foods.push(food);
    commitDB(next);
    $("libFoodModal")?.classList.remove("open");
    renderLibrary();
    updateAmountLabels();
    toast("食物已保存");
  }

  function deleteLibraryFood(id){
    if(!confirm("删除这个食物？餐食模板中引用它的项目也会被移除。"))return;
    const next=db();
    next.foods=(next.foods||[]).filter(x=>x.id!==id);
    (next.meals||[]).forEach(m=>m.items=(m.items||[]).filter(i=>i.foodId!==id));
    commitDB(next);renderLibrary();updateAmountLabels();
  }

  function renderLibrary(){
    const box=$("foodLibraryList");if(!box)return;
    const foods=db().foods||[];box.innerHTML="";
    if(!foods.length){box.innerHTML='<div class="empty">暂无食物。</div>';return}
    foods.forEach(f=>{
      const m=displayMacros(f),d=document.createElement("div");d.className="item";
      d.innerHTML=`<div class="item-main"><div class="item-title">${esc(f.name)}</div><div class="item-sub">${esc(basisText(f))} · C${fmt(m.c)} / P${fmt(m.p)} / F${fmt(m.f)} · ${kcal(m.c,m.p,m.f)} kcal</div></div><div class="item-actions"><button class="btn ghost" data-flex-edit="${esc(f.id)}">编辑</button><button class="btn danger" data-flex-del="${esc(f.id)}">删</button></div>`;
      box.appendChild(d);
    });
    box.querySelectorAll("[data-flex-edit]").forEach(b=>b.addEventListener("click",()=>openLibraryFood(b.dataset.flexEdit)));
    box.querySelectorAll("[data-flex-del]").forEach(b=>b.addEventListener("click",()=>deleteLibraryFood(b.dataset.flexDel)));
  }

  function setServingDefault(input,serving){
    if(!input)return;
    if(serving){
      if(!input.value){
        input.value="1";
        input.dataset.servingDefault="1";
      }
    }else if(input.dataset.servingDefault==="1"){
      input.value="";
      delete input.dataset.servingDefault;
    }
  }

  function updateSingleAmountLabel(){
    const select=$("foodSelect"),input=$("foodGrams");if(!select||!input)return;
    const f=db().foods?.find(x=>x.id===select.value);
    const label=input.previousElementSibling;
    if(!label)return;
    if(isServing(f)){
      const u=f.servingLabel||f.unit||"份";
      label.textContent=`数量（${u}）`;
      input.step="0.1";input.placeholder="1";
      setServingDefault(input,true);
    }else{
      label.textContent=basisOf(f)==="per100ml"?"用量 ml":"重量 g";
      input.step="1";input.placeholder="";
      setServingDefault(input,false);
    }
  }

  function updateMealAmountLabel(){
    const select=$("mealBuilderFood"),input=$("mealBuilderGrams");if(!select||!input)return;
    const f=db().foods?.find(x=>x.id===select.value);
    const label=input.previousElementSibling;
    if(!label)return;
    if(isServing(f)){
      const u=f.servingLabel||f.unit||"份";
      label.textContent=`数量（${u}）`;
      input.step="0.1";input.placeholder="1";
      setServingDefault(input,true);
    }else{
      label.textContent=basisOf(f)==="per100ml"?"用量 ml":"重量 g";
      input.step="1";input.placeholder="";
      setServingDefault(input,false);
    }
  }
  const updateAmountLabels=()=>{updateSingleAmountLabel();updateMealAmountLabel()};

  function setupServingSaveGuard(){
    const save=$("saveFoodEntryBtn");
    if(save&&!save.dataset.servingGuard){
      save.dataset.servingGuard="1";
      save.addEventListener("click",e=>{
        if($("foodMode")?.value!=="single")return;
        const f=db().foods?.find(x=>x.id===$("foodSelect")?.value);
        if(!isServing(f))return;
        const input=$("foodGrams");
        if(input&&!input.value)input.value="1";
        if(!input||num(input.value)<=0){
          e.preventDefault();e.stopImmediatePropagation();
          toast(`请填写${f.servingLabel||f.unit||"份"}数`);
        }
      },true);
    }

    const mealAdd=$("mealAddItemBtn");
    if(mealAdd&&!mealAdd.dataset.servingGuard){
      mealAdd.dataset.servingGuard="1";
      mealAdd.addEventListener("click",e=>{
        const f=db().foods?.find(x=>x.id===$("mealBuilderFood")?.value);
        if(!isServing(f))return;
        const input=$("mealBuilderGrams");
        if(input&&!input.value)input.value="1";
        if(!input||num(input.value)<=0){
          e.preventDefault();e.stopImmediatePropagation();
          toast(`请填写${f.servingLabel||f.unit||"份"}数`);
        }
      },true);
    }
  }

  function hookOpeners(){
    if(typeof window.openLibFoodModal==="function"&&!window.openLibFoodModal.__flexBasis){
      const fn=(id="")=>openLibraryFood(id);fn.__flexBasis=true;window.openLibFoodModal=fn;
    }
    if(typeof window.openFoodModal==="function"&&!window.openFoodModal.__flexBasis){
      const old=window.openFoodModal;
      const fn=(...args)=>{const r=old(...args);setTimeout(updateSingleAmountLabel,0);return r};
      fn.__flexBasis=true;window.openFoodModal=fn;
    }
    if(typeof window.openMealModal==="function"&&!window.openMealModal.__flexBasis){
      const old=window.openMealModal;
      const fn=(...args)=>{const r=old(...args);setTimeout(updateMealAmountLabel,0);return r};
      fn.__flexBasis=true;window.openMealModal=fn;
    }
    if(typeof window.renderFoodLibrary==="function")window.renderFoodLibrary=renderLibrary;
  }

  function setup(){
    if(!window.fitnessApp)return setTimeout(setup,60);
    setupLibraryModal();hookOpeners();renderLibrary();updateAmountLabels();setupServingSaveGuard();
    $("foodGrams")?.addEventListener("input",()=>delete $("foodGrams").dataset.servingDefault);
    $("mealBuilderGrams")?.addEventListener("input",()=>delete $("mealBuilderGrams").dataset.servingDefault);
    $("foodSelect")?.addEventListener("change",updateSingleAmountLabel);
    $("mealBuilderFood")?.addEventListener("change",updateMealAmountLabel);
    document.querySelectorAll('[data-page="food"]').forEach(b=>b.addEventListener("click",()=>setTimeout(()=>{renderLibrary();updateAmountLabels()},0)));
    window.addEventListener("fitness:changed",()=>setTimeout(()=>{renderLibrary();updateAmountLabels()},0));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0));
  else setTimeout(setup,0);
})();
