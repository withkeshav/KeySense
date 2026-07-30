

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const label = document.getElementById("themeLabel");
  if (label) label.textContent = theme === "light" ? "Light" : "Dark";
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

function initTheme() {
  let t = "light";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") t = saved;
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) t = "dark";
  } catch (_) {}
  applyTheme(t);
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", function () {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      const targetTab = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".tab-content").forEach(function (c) { c.classList.remove("active"); });
      tab.classList.add("active");
      var panel = document.querySelector('[data-content="' + targetTab + '"]');
      if (panel) panel.classList.add("active");
    });
  });
}

function initLearnPath() {
  const steps = document.querySelectorAll(".learn-step");
  const contents = document.querySelectorAll(".learn-content");
  const prevBtn = document.getElementById("learnPrev");
  const nextBtn = document.getElementById("learnNext");
  const progress = document.getElementById("learnProgress");
  if (!steps.length || !contents.length) return;

  let current = 0;

  function showStep(idx) {
    idx = Math.max(0, Math.min(idx, steps.length - 1));
    current = idx;
    steps.forEach(function (s, i) {
      s.classList.toggle("active", i === idx);
      s.classList.toggle("completed", i < idx);
    });
    contents.forEach(function (c, i) {
      c.style.display = i === idx ? "block" : "none";
    });
    if (prevBtn) {
      prevBtn.disabled = idx === 0;
      prevBtn.style.visibility = idx === 0 ? "hidden" : "visible";
    }
    if (nextBtn) nextBtn.textContent = idx === steps.length - 1 ? "Done" : "Next";
    if (progress) progress.textContent = (idx + 1) + " of " + steps.length;
  }

  steps.forEach(function (s, i) {
    s.addEventListener("click", function () { showStep(i); });
  });
  if (prevBtn) prevBtn.addEventListener("click", function () { showStep(current - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () {
    if (current === steps.length - 1) return;
    showStep(current + 1);
  });

  showStep(0);
}

function initUiBasics() {
  initTheme();
  initTabs();
  initLearnPath();
}
