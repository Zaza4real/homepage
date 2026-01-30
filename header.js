;// Shared header behavior for all pages
(() => {
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";
  const isAuthed = () => !!token();

  const authBtn = document.querySelector(".headerAuthBtn");
  const dashBtn = document.querySelector('[data-nav="dashboard"]');
  const logoLink = document.querySelector(".logoWrap");
  const tabs = document.querySelectorAll(".tabBtn");

  // Make logo always go to homepage
  if (logoLink) {
    logoLink.setAttribute("href", "index.html");
  }

  // Highlight current page in header
  const path = (location.pathname || "").toLowerCase();
  const filename = path.split("/").pop() || "index.html";
  const isIndex = filename === "" || filename === "index.html" || filename === "/";
  const isDashboard = filename.includes("dashboard");
  const isAuth = filename.includes("auth");

  if (dashBtn) dashBtn.classList.toggle("isActive", isDashboard);

  // Tabs active state + underline
  const tabsNav = document.querySelector(".tabs");
  let underlineEl = null;

  const ensureUnderline = () => {
    if (!tabsNav) return null;
    if (underlineEl) return underlineEl;
    underlineEl = document.createElement("div");
    underlineEl.className = "tabUnderline";
    tabsNav.appendChild(underlineEl);
    return underlineEl;
  };

  const getDesiredActiveKey = () => {
    // index.html can set tab via ?tab=
    const params = new URLSearchParams(location.search || "");
    const tabParam = (params.get("tab") || "").toLowerCase();
    if (isIndex) {
      return tabParam || "home";
    }
    // non-index pages: match by filename (support.html, features.html, etc.)
    return filename;
  };

  const setActiveTab = () => {
    const key = getDesiredActiveKey();
    let activeBtn = null;

    tabs.forEach((btn) => {
      const href = (btn.getAttribute("data-href") || "").toLowerCase();
      const tab = (btn.getAttribute("data-tab") || "").toLowerCase();

      const isActive =
        (isIndex && tab && tab === key) ||
        (!isIndex && href && href === key);

      btn.classList.toggle("isActive", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");

      if (isActive) activeBtn = btn;
    });

    // If nothing matched (edge case), default to Demo/home
    if (!activeBtn && tabs.length) {
      activeBtn = tabs[0];
      activeBtn.classList.add("isActive");
      activeBtn.setAttribute("aria-selected", "true");
    }

    // Move underline
    if (tabsNav && activeBtn) {
      const ul = ensureUnderline();
      if (!ul) return;

      const navRect = tabsNav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      const left = Math.max(0, btnRect.left - navRect.left);
      const width = Math.max(12, btnRect.width);

      ul.style.transform = `translateX(${left}px)`;
      ul.style.width = `${width}px`;
      ul.style.opacity = "1";
    }
  };

  if (authBtn) {
    const applyAuthState = () => {
      if (isAuthed()) {
        authBtn.querySelector(".btnLabel")?.replaceChildren(document.createTextNode("Logout"));
        authBtn.setAttribute("href", "#");
        authBtn.classList.add("isActive", false);
      } else {
        authBtn.querySelector(".btnLabel")?.replaceChildren(document.createTextNode("Login"));
        authBtn.setAttribute("href", "auth.html");
        authBtn.classList.toggle("isActive", isAuth);
      }
    };

    applyAuthState();

    authBtn.addEventListener("click", (e) => {
      if (isAuthed()) {
        e.preventDefault();
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // go home after logout
        location.href = "index.html";
      }
    });
  }

  // Tab navigation
  if (tabs.length) {
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const href = btn.getAttribute("data-href");
        if (href) {
          location.href = href;
          return;
        }
        const tab = btn.getAttribute("data-tab") || "home";
        // If we're already on index, keep it on index and update the tab query param
        location.href = `index.html?tab=${encodeURIComponent(tab)}`;
      });
    });
  }

  // Initialize active state + underline
  const sync = () => requestAnimationFrame(setActiveTab);
  sync();
  window.addEventListener("resize", () => {
    // avoid layout thrash
    clearTimeout(window.__lypoTabResizeT);
    window.__lypoTabResizeT = setTimeout(sync, 60);
  });
})();