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
    #foodTime{width:100%;min-width:0!important;max-width:100%;display:block;box-sizing:border-box}
    .plan-card-compact .field-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
    .plan-card-compact input,.plan-card-compact select{padding:8px 9px}
    .plan-card-compact .toolbar{margin-top:8px}
    .plan-calc-details{margin-top:8px;border-top:1px solid var(--line);padding-top:7px}
    .plan-calc-details summary{cursor:pointer;color:var(--muted);font-size:11px;list-style-position:inside}
    .plan-calc-details .field-grid{margin-top:7px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .sync.local .sync-dot{background:var(--muted)!important}
    @media(max-width:700px){
      .plan-card-compact .field-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .plan-calc-details .field-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .plan-card-compact label{margin-bottom:3px}
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
  };

  const scheduleClean = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(clean);
  };

  const getDB = () => {
    if (window.fitnessApp?.getDB) return window.fitnessApp.getDB();
    try { return JSON.parse(localStorage.getItem("chibianyingFitnessV1") || "{}"); }
    catch { return {}; }
  };

  const latestWeight = db => {
    const rows = Object.values(db?.days || {})
      .filter(d => d?.weight != null)
      .sort((a,b) => String(a.date).localeCompare(String(b.date)));
    return rows.length ? +rows[rows.length - 1].weight : +(db?.settings?.calcWeight || 66);
  };

  const setupCalculator = () => {
    const stage = document.getElementById("setStage");
    if (!stage || document.getElementById("setCalcWeight")) return;

    const grid = stage.closest(".field-grid");
    const card = stage.closest(".card");
    if (!grid || !card) return;
    card.classList.add("plan-card-compact");

    const before = stage.parentElement.nextElementSibling;
    const makeWrap = html => {
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      return wrap;
    };

    const weightWrap = makeWrap('<label for="setCalcWeight">体重 kg</label><input id="setCalcWeight" type="number" step="0.1">');
    grid.insertBefore(weightWrap, before);

    const details = document.createElement("details");
    details.className = "plan-calc-details";
    details.innerHTML = '<summary>计算参数</summary><div class="field-grid"></div>';
    card.insertBefore(details, card.querySelector(".toolbar"));
    const paramGrid = details.querySelector(".field-grid");

    paramGrid.appendChild(makeWrap('<label for="setHeight">身高 cm</label><input id="setHeight" type="number" step="1">'));
    paramGrid.appendChild(makeWrap('<label for="setAge">年龄</label><input id="setAge" type="number" step="1">'));
    paramGrid.appendChild(makeWrap('<label for="setActivity">日常活动</label><select id="setActivity"><option value="1.2">低｜久坐</option><option value="1.4">中｜久坐 + 规律训练</option><option value="1.55">较高｜步数较多 / 高频训练</option><option value="1.7">高｜体力工作 / 高活动</option></select>'));

    const db = getDB();
    const settings = db.settings || {};
    document.getElementById("setCalcWeight").value = latestWeight(db) || 66;
    document.getElementById("setHeight").value = settings.height || 168;
    document.getElementById("setAge").value = settings.age || 24;

    const activityEl = document.getElementById("setActivity");
    const savedActivity = +(settings.activityFactor || 1.4);
    const options = [...activityEl.options].map(o => +o.value);
    const nearest = options.reduce((best,v) => Math.abs(v-savedActivity) < Math.abs(best-savedActivity) ? v : best, options[0]);
    activityEl.value = String(nearest);

    const round5 = n => Math.round(n / 5) * 5;
    const calculate = () => {
      const weight = +document.getElementById("setCalcWeight").value || latestWeight(getDB()) || 66;
      const height = +document.getElementById("setHeight").value || 168;
      const age = +document.getElementById("setAge").value || 24;
      const activity = +document.getElementById("setActivity").value || 1.4;
      const phase = stage.value || "cut";

      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      const tdee = bmr * activity;
      const kcal = Math.round((tdee * (phase === "cut" ? 0.85 : phase === "gain" ? 1.08 : 1)) / 10) * 10;
      const protein = round5(weight * (phase === "cut" ? 2.1 : 1.8));
      const fat = round5(weight * (phase === "gain" ? 1.0 : 0.9));
      const carbs = Math.max(0, round5((kcal - protein * 4 - fat * 9) / 4));

      document.getElementById("setK").value = kcal;
      document.getElementById("setC").value = carbs;
      document.getElementById("setP").value = protein;
      document.getElementById("setF").value = fat;
      document.getElementById("setCardio").value = phase === "cut" ? 90 : phase === "gain" ? 45 : 60;
    };

    ["setStage","setCalcWeight","setHeight","setAge","setActivity"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", calculate);
    });

    document.querySelectorAll('[data-page="settings"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const w = latestWeight(getDB());
        if (w) document.getElementById("setCalcWeight").value = w;
      });
    });

    document.getElementById("saveSettingsBtn")?.addEventListener("click", () => {
      setTimeout(() => {
        if (!window.fitnessApp?.getDB || !window.fitnessApp?.replaceDB) return;
        const next = window.fitnessApp.getDB();
        next.settings = next.settings || {};
        next.settings.calcWeight = +document.getElementById("setCalcWeight").value || latestWeight(next) || 66;
        next.settings.height = +document.getElementById("setHeight").value || 168;
        next.settings.age = +document.getElementById("setAge").value || 24;
        next.settings.activityFactor = +document.getElementById("setActivity").value || 1.4;
        next.meta = next.meta || {};
        next.meta.updatedAt = new Date().toISOString();
        next.meta.userTouched = true;
        window.fitnessApp.replaceDB(next);
        window.dispatchEvent(new CustomEvent("fitness:changed"));
      }, 0);
    });
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupCalculator);
  else setupCalculator();
})();
