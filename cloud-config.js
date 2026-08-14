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
    if (cloudStatus) {
      const t = cloudStatus.textContent.trim();
      if (t.startsWith("Supabase 已配置。使用邮箱验证码登录")) cloudStatus.textContent = "未登录";
      else if (t.startsWith("未配置 Supabase。")) cloudStatus.textContent = "未配置";
      else if (t.startsWith("验证码已发送到 ")) cloudStatus.textContent = "验证码已发送";
    }
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

  const addField = (grid, before, html) => {
    const box = document.createElement("div");
    box.innerHTML = html;
    grid.insertBefore(box, before);
    return box.firstElementChild;
  };

  const setupCalculator = () => {
    const stage = document.getElementById("setStage");
    if (!stage || document.getElementById("setCalcWeight")) return;

    const grid = stage.closest(".field-grid");
    if (!grid) return;
    const before = stage.parentElement.nextElementSibling;

    const fragment = document.createDocumentFragment();
    const make = html => {
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      fragment.appendChild(wrap);
    };

    make('<label for="setCalcWeight">计算体重 kg</label><input id="setCalcWeight" type="number" step="0.1">');
    make('<label for="setHeight">身高 cm</label><input id="setHeight" type="number" step="1">');
    make('<label for="setAge">年龄</label><input id="setAge" type="number" step="1">');
    make('<label for="setActivity">活动系数</label><select id="setActivity"><option value="1.2">1.20 久坐</option><option value="1.35">1.35 轻活动</option><option value="1.4">1.40 常规</option><option value="1.55">1.55 较高</option><option value="1.7">1.70 高活动</option></select>');
    grid.insertBefore(fragment, before);

    const db = getDB();
    const settings = db.settings || {};
    document.getElementById("setCalcWeight").value = latestWeight(db) || 66;
    document.getElementById("setHeight").value = settings.height || 168;
    document.getElementById("setAge").value = settings.age || 24;
    document.getElementById("setActivity").value = String(settings.activityFactor || 1.4);

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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupCalculator);
  else setupCalculator();
})();
