(() => {
  const $ = id => document.getElementById(id);

  const rememberClass = el => {
    if (el && !el.dataset.trainingOriginalClass) el.dataset.trainingOriginalClass = el.className;
  };

  const restoreClass = el => {
    if (el?.dataset.trainingOriginalClass) el.className = el.dataset.trainingOriginalClass;
  };

  function updateTrainingMode(){
    const modal = $("trainingModal");
    const select = $("trainingExercise");
    const cardio = $("trainingCardio");
    if (!modal || !select || !cardio) return;

    const cardioMode = !select.value;
    const strengthIds = ["trainingWeight","trainingReps","trainingSets","trainingRir"];

    strengthIds.forEach(id => {
      const input = $(id);
      if (input?.parentElement) input.parentElement.style.display = cardioMode ? "none" : "block";
    });

    const selectWrap = select.parentElement;
    const cardioWrap = cardio.parentElement;
    rememberClass(selectWrap);
    rememberClass(cardioWrap);

    if (cardioMode) {
      if (selectWrap) selectWrap.className = "c6";
      if (cardioWrap) cardioWrap.className = "c6";
    } else {
      restoreClass(selectWrap);
      restoreClass(cardioWrap);
    }

    const selectLabel = select.previousElementSibling;
    const cardioLabel = cardio.previousElementSibling;
    if (selectLabel?.tagName === "LABEL") selectLabel.textContent = cardioMode ? "记录类型" : "动作";
    if (cardioLabel?.tagName === "LABEL") cardioLabel.textContent = cardioMode ? "有氧分钟" : "有氧分钟（可选）";

    const title = modal.querySelector(".section h2");
    if (title) title.textContent = cardioMode ? "记录有氧" : "添加训练";

    const save = $("saveTrainingBtn");
    if (save) save.textContent = cardioMode ? "保存有氧" : "加入今日";

    const hint = [...modal.querySelectorAll(".meta")].find(x => x.textContent.includes("自重动作重量可留空"));
    if (hint) hint.textContent = cardioMode ? "填写本次有氧分钟即可。" : "自重动作重量可留空。";
  }

  function setup(){
    const select = $("trainingExercise");
    if (!select) return;

    if (!select.dataset.modeSwitchReady) {
      select.dataset.modeSwitchReady = "1";
      select.addEventListener("change", updateTrainingMode);
    }

    if (typeof window.openTrainingModal === "function" && !window.openTrainingModal.__modeSwitchReady) {
      const old = window.openTrainingModal;
      const wrapped = (...args) => {
        const result = old(...args);
        updateTrainingMode();
        return result;
      };
      wrapped.__modeSwitchReady = true;
      window.openTrainingModal = wrapped;
    }

    updateTrainingMode();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(setup,0));
  else setTimeout(setup,0);
})();
