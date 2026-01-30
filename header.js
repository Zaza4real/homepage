document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".nav-btn");
  const underline = document.querySelector(".tabUnderline");
  const menuBtn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".tabs");

  function normalizePath(p) {
    // "/support.html" -> "/support", "/" stays "/"
    const clean = (p || "/").split("?")[0].split("#")[0];
    if (clean === "/" || clean === "") return "/";
    return clean.replace(/\.html$/i, "");
  }

  function moveUnderline(btn) {
    if (!btn || !underline) return;
    const parentRect = btn.parentElement.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    underline.style.width = `${btnRect.width}px`;
    underline.style.transform = `translateX(${btnRect.left - parentRect.left}px)`;
  }

  function setActive() {
    const current = normalizePath(window.location.pathname);

    let activeBtn = null;
    buttons.forEach((btn) => {
      const btnPath = normalizePath(btn.dataset.path || btn.getAttribute("href") || "/");
      const isActive =
        btnPath === current ||
        (btnPath !== "/" && current.startsWith(btnPath + "/")); // subpages stay active

      btn.classList.toggle("isActive", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) activeBtn = btn;
    });

    moveUnderline(activeBtn);
  }

  function setMenuOpen(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("open", open);
    menuBtn.classList.toggle("isOpen", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  // Mobile menu toggle
  if (menuBtn && nav) {
    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", () => {
      setMenuOpen(!nav.classList.contains("open"));
    });

    // Close after clicking a nav link (mobile-friendly)
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setMenuOpen(false);
      });
    });

    // Close if clicking outside the menu
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("open")) return;
      const target = e.target;
      if (target instanceof Element) {
        const clickedInside = nav.contains(target) || menuBtn.contains(target);
        if (!clickedInside) setMenuOpen(false);
      }
    });

    // If user rotates / resizes back to desktop, ensure menu is reset
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 769px)").matches) {
        setMenuOpen(false);
      }
      setActive(); // keep underline accurate
    });
  }

  setActive();
});
