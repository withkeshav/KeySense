import { THEME_KEY } from "./constants.js";

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

export function initUiBasics() {
  initTheme();
  initTabs();
}
