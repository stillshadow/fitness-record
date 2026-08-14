// 池边影の健身记录：Supabase 配置
// 前端只使用 Publishable Key；不要填写 Secret Key / service_role。
window.CHI_BIAN_YING_CLOUD = {
  supabaseUrl: "https://ckcxkjwmxjewhbuwtgyz.supabase.co",
  supabaseKey: "sb_publishable_Q5Pm_VCJPwWWt9Kt8rKktQ_wCLT-XbE",
  email: "",
  autoSync: true
};

// 保持应用界面简洁：只保留操作所需信息，不展示实现说明。
(() => {
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
    if (activeDateLabel?.textContent.includes("自动读取本机日期")) {
      activeDateLabel.textContent = "";
    }

    const planHint = document.getElementById("planHint");
    if (planHint) {
      if (planHint.textContent.trim() === "不预设训练日") planHint.textContent = "";
      else if (planHint.textContent.startsWith("已载入模板：")) {
        planHint.textContent = planHint.textContent.replace("已载入模板：", "模板：");
      }
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

  clean();
  new MutationObserver(scheduleClean).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
