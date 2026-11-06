

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
  const tabs = Array.from(document.querySelectorAll(".tab"));
  function activate(tab) {
    const target = tab.getAttribute("data-tab");
    tabs.forEach(function (item) {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll(".tab-content").forEach(function (panel) {
      panel.classList.toggle("active", panel.getAttribute("data-content") === target);
    });
    document.body.dataset.view = target;
  }
  tabs.forEach(function (tab, index) {
    const name = tab.getAttribute("data-tab");
    tab.id = "tab-" + name;
    tab.setAttribute("aria-controls", "panel-" + name);
    const panel = document.querySelector('[data-content="' + name + '"]');
    if (panel) { panel.id = "panel-" + name; panel.setAttribute("aria-labelledby", tab.id); }
    tab.addEventListener("click", function () { activate(tab); });
    tab.addEventListener("keydown", function (event) {
      let next;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(tabs[next]); tabs[next].focus(); }
    });
  });
  const initial = tabs.find(tab => tab.classList.contains("active")) || tabs[0];
  if (initial) activate(initial);
}

function initLearnPath() {
  /* Step state lives only in this closure variable. No localStorage, no seed
   * material: moving between steps toggles visibility and nothing else. */
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
      s.setAttribute("aria-current", i === idx ? "step" : "false");
    });
    contents.forEach(function (c, i) {
      c.style.display = i === idx ? "block" : "none";
    });
    if (prevBtn) {
      prevBtn.disabled = idx === 0;
      prevBtn.style.visibility = idx === 0 ? "hidden" : "visible";
    }
    if (nextBtn) { nextBtn.textContent = idx === steps.length - 1 ? "Last step" : "Next"; nextBtn.disabled = idx === steps.length - 1; }
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
