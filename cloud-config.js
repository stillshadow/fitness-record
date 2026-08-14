// 池边影の健身记录：Supabase 配置
// 可以安全放在静态网页前端的是 Publishable Key（或旧 anon key）。
// 千万不要填写 Secret Key / service_role。
window.CHI_BIAN_YING_CLOUD = {
  supabaseUrl: "https://ckcxkjwmxjewhbuwtgyz.supabase.co",
  supabaseKey: "sb_publishable_Q5Pm_VCJPwWWt9Kt8rKktQ_wCLT-XbE",
  email: "",
  autoSync: true
};

// V1.2 compatibility patch
// 1) Supabase Email OTP may be configured to 6–10 digits, so do not hard-code 6.
// 2) Keep the plan wording neutral so the same app can later be used for cutting, maintenance or bulking.
(() => {
  const getCloudConfig = () => {
    let local = {};
    try { local = JSON.parse(localStorage.getItem("chibianyingCloudOverride") || "{}"); } catch {}
    const global = window.CHI_BIAN_YING_CLOUD || {};
    return {
      url: local.url || global.supabaseUrl || "",
      key: local.key || global.supabaseKey || ""
    };
  };

  const setCloudStatus = (message) => {
    const el = document.getElementById("cloudStatus");
    if (el) el.textContent = message;
  };

  const normalizeCopy = () => {
    const title = [...document.querySelectorAll("#page-settings .section h2")]
      .find(el => el.textContent.trim() === "减脂方案");
    if (title) title.textContent = "营养与有氧目标";

    const otp = document.getElementById("cloudOtp");
    if (otp) {
      otp.maxLength = 10;
      otp.placeholder = "输入邮件中的验证码";
      const meta = otp.parentElement?.querySelector(".meta");
      if (meta && meta.textContent.includes("6 位验证码")) {
        meta.textContent = meta.textContent.replace("6 位验证码", "验证码");
      }
    }

    const status = document.getElementById("cloudStatus");
    if (status && status.textContent.includes("6 位验证码")) {
      status.textContent = status.textContent.replace("6 位验证码", "邮件中的验证码");
    }
  };

  normalizeCopy();

  const status = document.getElementById("cloudStatus");
  if (status) {
    new MutationObserver(normalizeCopy).observe(status, { childList: true, subtree: true, characterData: true });
  }

  const otp = document.getElementById("cloudOtp");
  const verifyBtn = document.getElementById("cloudVerify");

  if (otp) {
    // Capture before the old V1.1 listener so an 8-digit code is not truncated to 6 digits.
    otp.addEventListener("input", (event) => {
      otp.value = otp.value.replace(/\D/g, "").slice(0, 10);
      event.stopImmediatePropagation();
    }, true);

    otp.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        verifyBtn?.click();
      }
    }, true);
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", async (event) => {
      // Replace the V1.1 verifier, which expected exactly 6 digits.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const email = document.getElementById("cloudEmail")?.value.trim() || "";
      const token = (otp?.value || "").replace(/\D/g, "").slice(0, 10);
      if (!email) return setCloudStatus("请填写登录邮箱。");
      if (token.length < 6 || token.length > 10) return setCloudStatus("请输入邮件中的完整验证码。");

      const config = getCloudConfig();
      if (!config.url || !config.key) return setCloudStatus("请先配置 Supabase Project URL 和 Publishable Key。");

      const oldText = verifyBtn.textContent;
      verifyBtn.disabled = true;
      verifyBtn.textContent = "验证中…";
      try {
        const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/+esm");
        const client = createClient(config.url, config.key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
        const { error } = await client.auth.verifyOtp({ email, token, type: "email" });
        if (error) {
          setCloudStatus("验证码验证失败：" + error.message);
          return;
        }
        setCloudStatus("登录成功，正在刷新…");
        setTimeout(() => location.reload(), 250);
      } catch (error) {
        setCloudStatus("验证码验证失败：" + (error?.message || error));
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = oldText;
      }
    }, true);
  }
})();
