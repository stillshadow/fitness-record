(() => {
  const STORAGE_KEY="chibianyingDietV2";
  const LEGACY_KEYS=["chibianyingFitnessV1","cutTrackerV2"];
  const $=id=>document.getElementById(id);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=p=>p+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const today=()=>localDate(new Date());
  const DEFAULT_DB={
    version:2,
    settings:{c:200,p:140,f:60,waterGoal:2500},
    foods:[
      {id:"rice",name:"熟米饭",unit:"g",c:25.9,p:2.6,f:0.3},
      {id:"chicken",name:"熟鸡胸肉",unit:"g",c:0,p:31,f:3.6},
      {id:"beef",name:"熟瘦牛肉",unit:"g",c:0,p:27,f:10},
      {id:"egg",name:"鸡蛋",unit:"g",c:0.7,p:12.6,f:9.5},
      {id:"banana",name:"香蕉",unit:"g",c:22.8,p:1.1,f:0.3},
      {id:"skim",name:"脱脂牛奶",unit:"ml",c:5,p:3.4,f:0.2},
      {id:"bread",name:"全麦面包",unit:"g",c:43,p:10,f:4},
      {id:"protein",name:"蛋白粉",unit:"g",c:10,p:75,f:5}
    ],
    meals:[],
    days:{},
    memos:[],
    meta:{updatedAt:null}
  };
  let DB=loadDB();
  let activeDate=today();
  let mealBuilder=[];
  let libraryTab="foods";

  function localDate(d){
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function localTime(d=new Date()){return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
  function shiftDate(date,n){
    const [y,m,d]=date.split("-").map(Number),x=new Date(y,m-1,d);x.setDate(x.getDate()+n);return localDate(x);
  }
  function prettyDate(date){
    const [y,m,d]=date.split("-").map(Number),x=new Date(y,m-1,d),w=["周日","周一","周二","周三","周四","周五","周六"];
    return (date===today()?"今天 · ":"")+m+"月"+d+"日 · "+w[x.getDay()];
  }
  function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function fmt(n,d=1){return Number(n||0).toFixed(d).replace(/\.0+$/,"").replace(/(\.\d*?)0+$/,"$1")}
  function toast(msg){
    const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1700);
  }
  function inferSlot(){
    const h=new Date().getHours();return h<10?"早餐":h<14?"午餐":h<17?"加餐":h<21?"晚餐":"加餐";
  }
  function migrateLegacy(old){
    const next=clone(DEFAULT_DB);
    if(old?.settings){
      next.settings.c=+old.settings.c||next.settings.c;
      next.settings.p=+old.settings.p||next.settings.p;
      next.settings.f=+old.settings.f||next.settings.f;
    }
    if(Array.isArray(old?.foods)&&old.foods.length)next.foods=old.foods.map(x=>({...x}));
    if(Array.isArray(old?.meals))next.meals=old.meals.map(x=>({...x,items:(x.items||[]).map(i=>({...i}))}));
    for(const [date,day] of Object.entries(old?.days||{})){
      if(!Array.isArray(day?.foods)||!day.foods.length)continue;
      next.days[date]={date,foods:day.foods.map(x=>({...x})),waterMl:+day.waterMl||0};
    }
    next.meta.updatedAt=new Date().toISOString();
    return next;
  }
  function loadDB(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){
        const x=JSON.parse(raw);
        return {...clone(DEFAULT_DB),...x,settings:{...clone(DEFAULT_DB.settings),...(x.settings||{})},foods:Array.isArray(x.foods)?x.foods:clone(DEFAULT_DB.foods),meals:Array.isArray(x.meals)?x.meals:[],days:x.days||{},memos:Array.isArray(x.memos)?x.memos:[]};
      }
      const legacy=localStorage.getItem("chibianyingFitnessV1")||localStorage.getItem("cutTrackerV2");
      if(legacy){
        const migrated=migrateLegacy(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        return migrated;
      }
    }catch{}
    return clone(DEFAULT_DB);
  }
  function persist(){
    DB.meta=DB.meta||{};DB.meta.updatedAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(DB));
    window.dispatchEvent(new CustomEvent("diet:changed"));
  }
  function ensureDay(date=activeDate){
    DB.days[date]=DB.days[date]||{date,foods:[],waterMl:0};
    DB.day