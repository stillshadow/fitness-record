// 池边影の健身记录：Supabase 配置
// 前端只使用 Publishable Key；不要填写 Secret Key / service_role。
window.CHI_BIAN_YING_CLOUD = {
  supabaseUrl: "https://ckcxkjwmxjewhbuwtgyz.supabase.co",
  supabaseKey: "sb_publishable_Q5Pm_VCJPwWWt9Kt8rKktQ_wCLT-XbE",
  email: "",
  autoSync: true
};

(() => {
  const style = document.createElement("style");
  style.textContent = `
    .row > div{min-width:0}
    #foodTime{width:100%!important;inline-size:100%!important;min-width:0!important;min-inline-size:0!important;max-width:100%!important;display:block!important;box-sizing:border-box!important;overflow:hidden!important;-webkit-appearance:none!important;appearance:none!important}
    #foodTime::-webkit-date-and-time-value{min-width:0!important;margin:0!important;text-align:left}
    .sheet-panel{width:calc(100% - 24px)!important;border-radius:22px!important;margin:0 auto calc(10px + env(safe-area-inset-bottom))!important;padding:16px 15px!important}
    .sync.local .sync-dot{background:var(--muted)!important}
    .macro-only{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .simple-goals .field-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px}
    .simple-goals input{padding:8px 9px}
    @media(max-width:700px){
      .macro-only{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .simple-goals .field-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .simple-goals label{margin-bottom:3px}
    }
  `;
  document.head.appendChild(style);

  const hideExactMeta = new Set([
    "模板只是快捷动作清单，不会强制你哪天必须练什么。",
    "例如“练后 = 香蕉120g + 蛋白粉30g”，以后一点就整套加入。",
    "自动统计最佳组与 e1RM",
    "随时可改",
    "云同步之外再留一份保险",
    "看均值，不看单日"
  ]);

  const hasStoredSession = () => {
    try {
      return Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k) && !!localStorage.getItem(k));
    } catch { return false; }
  };

  const savedCloudEmail = () => {
    try {
      const x = JSON.parse(localStorage.getItem("chibianyingCloudOverride") || "{}");
      return x.email || "";
    } catch { return ""; }
  };

  const getDB = () => {
    if (window.fitnessApp?.getDB) return window.fitnessApp.getDB();
    try { return JSON.parse(localStorage.getItem("chibianyingFitnessV1") || "{}"); }
    catch { return {}; }
  };

  const flash = msg => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(flash._timer);
    flash._timer = setTimeout(() => t.classList.remove("show"), 1800);
  };

  const localDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const activeDate = () => {
    const t = document.getElementById("activeDateLabel")?.textContent.trim() || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : localDateString();
  };

  const normalizeHeaderStatus = () => {
    const badge = document.getElementById("syncBadge");
    const text = document.getElementById("syncText");
    const cloudUser = document.getElementById("cloudUserText");
    const cloudStatus = document.getElementById("cloudStatus");
    if (!badge || !text || !cloudUser) return;

    const user = cloudUser.textContent.trim();
    const state = cloudStatus?.textContent.trim() || "";

    if (user === "未登录" || user === "未配置") {
      badge.classList.remove("warn", "bad");
      badge.classList.add("local");
      text.textContent = "仅本地";
      return;
    }

    badge.classList.remove("local");
    if (state === "离线") {
      badge.classList.remove("bad");
      badge.classList.add("warn");
      text.textContent = "离线";
    }
  };

  const normalizeMacroUI = () => {
    const sumK = document.getElementById("sumK");
    const metrics = sumK?.closest(".metrics");
    const kcalMetric = sumK?.closest(".metric");
    if (metrics) metrics.classList.add("macro-only");
    if (kcalMetric) kcalMetric.style.display = "none";

    const db = getDB();
    const s = db.settings || {};
    const target = document.getElementById("macroTargetText");
    if (target && s.c != null) target.textContent = `${s.c}C / ${s.p}P / ${s.f}F`;

    const C = +(document.getElementById("sumC")?.textContent || 0);
    const P = +(document.getElementById("sumP")?.textContent || 0);
    const F = +(document.getElementById("sumF")?.textContent || 0);
    const advice = document.getElementById("macroAdvice");
    if (!advice || s.c == null) return;

    if (!(C || P || F)) {
      advice.textContent = "添加食物后会自动统计。";
      return;
    }
    const tips = [];
    if (P < (+s.p || 0) - 10) tips.push(`蛋白质还差约 ${Math.round((+s.p||0)-P)}g`);
    if (C < (+s.c || 0) - 15) tips.push(`碳水还差约 ${Math.round((+s.c||0)-C)}g`);
    if (F > (+s.f || 0) + 5) tips.push(`脂肪超约 ${Math.round(F-(+s.f||0))}g`);
    advice.textContent = tips.join(" · ") || "今天已经比较接近目标。";
  };

  const normalizeTrendAdvice = () => {
    const el = document.getElementById("trendAdvice");
    if (!el || !window.fitnessApp?.getDB) return;
    const rows = Object.values(getDB().days || {})
      .filter(x => x?.weight != null)
      .sort((a,b) => String(a.date).localeCompare(String(b.date)));
    const last = rows.slice(-7).map(x => +x.weight);
    const prev = rows.slice(-14,-7).map(x => +x.weight);
    if (!last.length || !prev.length) {
      el.textContent = "至少记录两周晨重后，这里会显示均重变化。";
      return;
    }
    const avg = a => a.reduce((s,x)=>s+x,0)/a.length;
    const delta = avg(last) - avg(prev);
    if (Math.abs(delta) <= .15) el.textContent = "近两组均重基本稳定。";
    else if (delta < 0) el.textContent = `近7次晨重均值较前7次下降约 ${Math.abs(delta).toFixed(2)} kg。`;
    else el.textContent = `近7次晨重均值较前7次上升约 ${delta.toFixed(2)} kg。`;
  };

  const setupSimpleGoals = () => {
    const c = document.getElementById("setC");
    const p = document.getElementById("setP");
    const f = document.getElementById("setF");
    const k = document.getElementById("setK");
    const stage = document.getElementById("setStage");
    const cardio = document.getElementById("setCardio");
    if (!c || !p || !f || !k || !stage) return;

    const card = c.closest(".card");
    if (card) {
      card.classList.add("simple-goals");
      const title = card.querySelector(".section h2");
      if (title) title.textContent = "每日目标";
    }
    stage.parentElement.style.display = "none";
    k.parentElement.style.display = "none";
    if (cardio?.parentElement) cardio.parentElement.style.display = "none";
    document.getElementById("setCalcWeight")?.parentElement?.remove();
    document.querySelector(".plan-calc-details")?.remove();

    const syncHiddenKcal = () => {
      const C = +c.value || 0, P = +p.value || 0, F = +f.value || 0;
      k.value = Math.round(C*4 + P*4 + F*9);
    };
    [c,p,f].forEach(x => x.addEventListener("input", syncHiddenKcal));
    document.getElementById("saveSettingsBtn")?.addEventListener("click", syncHiddenKcal, true);
    syncHiddenKcal();
  };

  const setupManualFood = () => {
    const fields = document.getElementById("manualFoodFields");
    const btn = document.getElementById("saveFoodEntryBtn");
    if (!fields || !btn || btn.dataset.totalMacroReady) return;
    btn.dataset.totalMacroReady = "1";

    const gramLabel = fields.querySelector('label[for="manualFoodGrams"]');
    const cLabel = fields.querySelector('label[for="manualFoodC"]');
    const pLabel = fields.querySelector('label[for="manualFoodP"]');
    const fLabel = fields.querySelector('label[for="manualFoodF"]');
    if (gramLabel) gramLabel.textContent = "重量 g/ml（可选）";
    if (cLabel) cLabel.textContent = "碳水 g（本次）";
    if (pLabel) pLabel.textContent = "蛋白质 g（本次）";
    if (fLabel) fLabel.textContent = "脂肪 g（本次）";

    btn.addEventListener("click", e => {
      if (document.getElementById("foodMode")?.value !== "manual") return;
      e.preventDefault();
      e.stopImmediatePropagation();

      if (!window.fitnessApp?.getDB || !window.fitnessApp?.replaceDB) return;
      const name = document.getElementById("manualFoodName")?.value.trim() || "";
      if (!name) return flash("填写食物名称");

      const grams = +(document.getElementById("manualFoodGrams")?.value || 0);
      const C = +(document.getElementById("manualFoodC")?.value || 0);
      const P = +(document.getElementById("manualFoodP")?.value || 0);
      const F = +(document.getElementById("manualFoodF")?.value || 0);
      const slot = document.getElementById("mealSlot")?.value || "饮食";
      const time = document.getElementById("foodTime")?.value || "";

      const db = window.fitnessApp.getDB();
      const date = activeDate();
      db.days = db.days || {};
      if (!db.days[date]) db.days[date] = {date,weight:null,cardio:0,note:"",planExerciseIds:[],planName:"",training:[],foods:[]};
      db.days[date].foods = db.days[date].foods || [];

      let entry;
      if (grams > 0) {
        entry = {
          id:`fd_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
          name,unit:"g",grams,
          c:C*100/grams,p:P*100/grams,f:F*100/grams,
          totalMacros:true,totalC:C,totalP:P,totalF:F,slot,time
        };
      } else {
        entry = {
          id:`fd_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
          name,unit:"份",grams:1,
          c:C*100,p:P*100,f:F*100,
          totalMacros:true,totalC:C,totalP:P,totalF:F,slot,time
        };
      }
      db.days[date].foods.push(entry);
      db.meta = db.meta || {};
      db.meta.updatedAt = new Date().toISOString();
      db.meta.userTouched = true;
      window.fitnessApp.replaceDB(db);
      window.dispatchEvent(new CustomEvent("fitness:changed"));
      document.getElementById("foodModal")?.classList.remove("open");
      flash("饮食已记录");
    }, true);
  };

  let scheduled = false;
  const clean = () => {
    scheduled = false;

    document.querySelectorAll(".meta").forEach(el => {
      const text = el.textContent.trim();
      if (hideExactMeta.has(text)) el.style.display = "none";
    });

    const otpMeta = document.querySelector("#otpFields .meta");
    if (otpMeta) otpMeta.style.display = "none";

    const activeDateLabel = document.getElementById("activeDateLabel");
    if (activeDateLabel?.textContent.includes("自动读取本机日期")) activeDateLabel.textContent = "";

    const planHint = document.getElementById("planHint");
    if (planHint) {
      if (planHint.textContent.trim() === "不预设训练日") planHint.textContent = "";
      else if (planHint.textContent.startsWith("已载入模板：")) planHint.textContent = planHint.textContent.replace("已载入模板：", "模板：");
    }

    document.querySelectorAll(".empty").forEach(el => {
      const t = el.textContent.trim();
      if (t === "今天还没有训练记录。休息日保持为空即可。") el.textContent = "暂无训练记录。";
      if (t === "今天还没有饮食记录。") el.textContent = "暂无饮食记录。";
      if (t === "开始记录训练后，这里会自动出现力量数据。") el.textContent = "暂无力量记录。";
      if (t === "记录晨重后会出现趋势图。") el.textContent = "暂无体重数据。";
    });

    const cloudStatus = document.getElementById("cloudStatus");
    const cloudUser = document.getElementById("cloudUserText");
    if (cloudStatus) {
      const t = cloudStatus.textContent.trim();
      if (t.startsWith("Supabase 已配置。使用邮箱验证码登录")) cloudStatus.textContent = "未登录";
      else if (t.startsWith("未配置 Supabase。")) cloudStatus.textContent = "未配置";
      else if (t.startsWith("验证码已发送到 ")) cloudStatus.textContent = "验证码已发送";
      else if (/^(Supabase 初始化失败|同步失败|上传失败|下载失败)/.test(t) && hasStoredSession()) {
        cloudStatus.textContent = "离线";
        if (cloudUser) cloudUser.textContent = savedCloudEmail() || "会话已保存";
      }
    }

    normalizeHeaderStatus();
    normalizeMacroUI();
    normalizeTrendAdvice();
  };

  const scheduleClean = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(clean);
  };

  clean();
  new MutationObserver(scheduleClean).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  window.addEventListener("online", scheduleClean);
  window.addEventListener("offline", scheduleClean);
  window.addEventListener("fitness:changed", scheduleClean);

  const setup = () => {
    setupSimpleGoals();
    setupManualFood();
    scheduleClean();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setTimeout(setup,0);
})();

(() => {
  const load = () => {
    if (document.querySelector('script[data-food-system]')) return;
    const s = document.createElement('script');
    s.src = 'food-system.js?v=13';
    s.dataset.foodSystem = '1';
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(load,0);
  else window.addEventListener('load',load,{once:true});
})();

(() => {
  const load = () => {
    if (document.querySelector('script[data-training-system]')) return;
    const s = document.createElement('script');
    s.src = 'training-system.js?v=16';
    s.dataset.trainingSystem = '1';
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(load,0);
  else window.addEventListener('load',load,{once:true});
})();
