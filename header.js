document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tabBtn");
  const tabsContainer = document.querySelector(".tabs");
  const underline = document.querySelector(".tabUnderline");

  function normalize(path) {
    if (!path) return "/";
    return path
      .replace(location.origin, "")
      .replace(/index\.html$/, "/")
      .replace(/\.html$/, "")
      || "/";
  }

  function moveUnderline(btn) {
    if (!btn || !underline) return;
    const parent = btn.parentElement.getBoundingClientRect();
    const rect = btn.getBoundingClientRect();
    underline.style.width = rect.width + "px";
    underline.style.transform = `translateX(${rect.left - parent.left}px)`;
  }

  function setActiveFromPath(pathname) {
    const current = normalize(pathname);
    let active = null;

    tabs.forEach(btn => {
      const target = normalize(btn.dataset.href || btn.getAttribute("href"));
      const isActive =
        current === target ||
        (target !== "/" && current.startsWith(target));

      btn.classList.toggle("isActive", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) active = btn;
    });

    moveUnderline(active);
  }

  // IMPORTANT FIX:
  // set active state immediately on click (prevents double-click issue)
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => {
        b.classList.remove("isActive");
        b.setAttribute("aria-selected", "false");
      });

      btn.classList.add("isActive");
      btn.setAttribute("aria-selected", "true");
      moveUnderline(btn);
    });
  });

  // initial load
  setActiveFromPath(window.location.pathname);
});