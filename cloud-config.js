// 池边影の健身记录：Supabase 配置
// 可以安全放在静态网页前端的是 Publishable Key（或旧 anon key）。
// 千万不要填写 Secret Key / service_role。
window.CHI_BIAN_YING_CLOUD = {
  supabaseUrl: "https://ckcxkjwmxjewhbuwtgyz.supabase.co",
  supabaseKey: "sb_publishable_Q5Pm_VCJPwWWt9Kt8rKktQ_wCLT-XbE",
  email: "",
  autoSync: true
};

// V1.2 文案兼容：旧缓存若仍残留重复提示，加载时自动整理。
(() => {
  const meta = document.querySelector("#otpFields .meta");
  if (meta) {
    meta.textContent = meta.textContent.replace(
      "支持 Supabase 配置的 6～10 位验证码。支持 Supabase 配置的 6～10 位验证码。",
      "支持 Supabase 配置的 6～10 位验证码。"
    );
  }
})();
