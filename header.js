(() => {
  // Make sure header never stays hidden
  document.documentElement.classList.add("js");
  document.documentElement.classList.add("preload");
  requestAnimationFrame(() => document.documentElement.classList.remove("preload"));

  const AUTH_TOKEN_KEY = "lypo_token"; // keep consistent with backend/frontend auth
  const isAuthed = () => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    return !!(t && String(t).trim().length > 10);
  };

  const filename = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isIndex = filename === "" || filename === "index.html" || filename === "/";
  const isDashboard = filename.includes("dashboard");

  const tabsNav = document.querySelector(".tabs");
  const authBtn = document.querySelector(".headerAuthBtn");

  // Inject Dashboard + Logout into LEFT nav (only visible when logged in)
  let dashTabBtn = null;
  let logoutTabBtn = null;

  function ensureDashTabs() {
    if (!tabsNav) return;

    if (!dashTabBtn) {
      dashTabBtn = document.createElement("button");
      dashTabBtn.type = "button";
      dashTabBtn.className = "tabBtn headerDashTab";
      dashTabBtn.textContent = "Dashboard";
      dashTabBtn.dataset.href = "dashboard.html";
      dashTabBtn.style.display = "none";
      tabsNav.insertBefore(dashTabBtn, tabsNav.firstChild);
    }

    if (!logoutTabBtn) {
      logoutTabBtn = document.createElement("button");
      logoutTabBtn.type = "button";
      logoutTabBtn.className = "tabBtn headerLogoutTab";
      logoutTabBtn.textContent = "Logout";
      logoutTabBtn.style.display = "none";
      logoutTabBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem(AUTH_TOKEN_KEY);
        location.href = "index.html";
      });
      tabsNav.insertBefore(logoutTabBtn, dashTabBtn.nextSibling);
    }
  }

  function applyAuthState() {
    const authed = isAuthed();
    ensureDashTabs();

    if (dashTabBtn) dashTabBtn.style.display = authed ? "" : "none";
    if (logoutTabBtn) logoutTabBtn.style.display = authed ? "" : "none";

    if (authBtn) {
      // Right-side button: Login when logged out, Dashboard when logged in
      const label = authBtn.querySelector(".btnLabel");
      if (label) label.textContent = authed ? "Dashboard" : "Login";
    }
  }

  // Auth button navigation
  if (authBtn) {
    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      location.href = isAuthed() ? "dashboard.html" : "auth.html";
    });
  }

  // Active tab + underline
  const ensureUnderline = () => {
    if (!tabsNav) return null;
    let ul = tabsNav.querySelector(".tabUnderline");
    if (!ul) {
      ul = document.createElement("div");
      ul.className = "tabUnderline";
      tabsNav.appendChild(ul);
    }
    return ul;
  };

  function normalizePath(p) {
    const clean = String(p || "").split("?")[0].split("#")[0].toLowerCase();
    if (!clean || clean === "/" || clean === "index.html") return "index.html";
    return clean.replace(/^\//, "");
  }

  function syncActive() {
    if (!tabsNav) return;
    const ul = ensureUnderline();
    const current = normalizePath(location.pathname.split("/").pop() || "index.html");

    const tabs = Array.from(tabsNav.querySelectorAll(".tabBtn"));
    let activeBtn = null;

    tabs.forEach((btn) => {
      // Skip logout - it's an action, not a page
      if (btn.classList.contains("headerLogoutTab")) return;

      const href = btn.dataset.href || "";
      const isHome = (btn.dataset.tab || "").toLowerCase() === "home";
      const target = isHome ? "index.html" : normalizePath(href);

      const on =
        (isDashboard && btn.classList.contains("headerDashTab")) ||
        (!isDashboard && target && current === target);

      btn.classList.toggle("isActive", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
      if (on) activeBtn = btn;
    });

    // default to Home if none matched (on index)
    if (!activeBtn) {
      const home = tabs.find((b) => (b.dataset.tab || "").toLowerCase() === "home");
      if (home && isIndex) {
        home.classList.add("isActive");
        home.setAttribute("aria-selected", "true");
        activeBtn = home;
      }
    }

    if (!ul || !activeBtn) return;

    // hide underline on mobile stacked menu
    if (window.matchMedia("(max-width: 768px)").matches) {
      ul.style.opacity = "0";
      return;
    }

    const navRect = tabsNav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const left = Math.max(0, btnRect.left - navRect.left);
    const width = Math.max(12, btnRect.width);
    ul.style.transform = `translateX(${left}px)`;
    ul.style.width = `${width}px`;
    ul.style.opacity = "1";
  }

  // Tab clicks (data-href)
  if (tabsNav) {
    tabsNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".tabBtn");
      if (!btn) return;

      // Logout handled separately
      if (btn.classList.contains("headerLogoutTab")) return;

      const href = btn.dataset.href;
      const tab = (btn.dataset.tab || "").toLowerCase();

      if (href) {
        location.href = href;
        return;
      }

      if (tab === "home") {
        location.href = "index.html";
        return;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyAuthState();
    syncActive();
    // second pass after paint for first-tab underline
    setTimeout(syncActive, 0);
  });

  window.addEventListener("resize", () => {
    syncActive();
  });
})();
