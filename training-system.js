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
      if (cardioWrap) {
        restoreClass(cardioWrap);
        cardioWrap.className = "c6";
        cardioWrap.style.display = "block";
      }
      cardio.disabled = false;
    } else {
      restoreClass(selectWrap);
      if (cardioWrap) cardioWrap.style.display = "none";
      cardio.value = "";
      cardio.disabled = true;
    }

    const selectLabel = select.previousElementSibling;
    const cardioLabel = cardio.previousElementSibling;
    if (selectLabel?.tagName === "LABEL") selectLabel.textContent = cardioMode ? "记录类型" : "动作";
    if (cardioLabel?.tagName === "LABEL") cardioLabel.textContent = "有氧分钟";

    const title = modal.querySelector(".section h2");
    if (title) title.textContent = cardioMode ? "记录有氧" : "记录力量训练";

    const save = $("saveTrainingBtn");
    if (save) save.textContent = cardioMode ? "保存有氧" : "保存训练";

    const hint = modal.querySelector(".row + .meta");
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

(() => {
  const load = () => {
    if (document.querySelector('script[data-history-system]')) return;
    const s = document.createElement('script');
    s.src = 'history-system.js?v=18';
    s.dataset.historySystem = '1';
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(load,0);
  else window.addEventListener('load',load,{once:true});
})();
