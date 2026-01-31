;// Shared header behavior for all pages
(() => {
  document.documentElement.classList.add('js');
  document.documentElement.classList.add('preload');

  // Guard to avoid double-binding navigation handlers across scripts
  window.__lypo_header_nav = true;

  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";
  const isAuthed = () => !!token();

  let authBtn = document.querySelector(".headerAuthBtn");
  const dashBtn = document.querySelector('[data-nav="dashboard"]');
  const logoLink = document.querySelector(".logoWrap");
  const getTabs = () => document.querySelectorAll('.tabBtn');
  let tabs = getTabs();

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

  // Inject Dashboard + Logout tabs (left side)
  let dashTabBtn = null;
  let logoutTabBtn = null;

  function ensureDashTabs(){
    if (!tabsNav) return;

    if (!dashTabBtn) {
      dashTabBtn = document.createElement("button");
      dashTabBtn.className = "tabBtn headerDashTab";
      dashTabBtn.type = "button";
      dashTabBtn.textContent = "Dashboard";
      dashTabBtn.style.display = "none";
      dashTabBtn.addEventListener("click", () => {
        location.href = "dashboard.html";
      });
      tabsNav.insertBefore(dashTabBtn, tabsNav.firstChild);
    }

    if (!logoutTabBtn) {
      logoutTabBtn = document.createElement("button");
      logoutTabBtn.className = "tabBtn headerLogoutTab";
      logoutTabBtn.type = "button";
      logoutTabBtn.textContent = "Logout";
      logoutTabBtn.style.display = "none";
      logoutTabBtn.addEventListener("click", () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        location.href = "index.html";
      });
      tabsNav.insertBefore(logoutTabBtn, dashTabBtn.nextSibling);
    }
  }

  // Inject Dashboard tab (visible only when logged in)
  dashTabBtn = document.querySelector('.headerDashTab');
  if (tabsNav && !dashTabBtn) {
    dashTabBtn = document.createElement("button");
    dashTabBtn.className = "tabBtn headerDashTab";
    dashTabBtn.type = "button";
    dashTabBtn.setAttribute("role", "tab");
    dashTabBtn.setAttribute("aria-selected", "false");
    dashTabBtn.setAttribute("data-href", "dashboard.html");
    dashTabBtn.textContent = "Dashboard";
    dashTabBtn.style.display = "none";
    // Place it after About (or at end if not found)
    const aboutBtn = Array.from(tabsNav.querySelectorAll(".tabBtn")).find(b => (b.getAttribute("data-href") || "").toLowerCase() === "about.html");
    if (aboutBtn && aboutBtn.nextSibling) {
      tabsNav.insertBefore(dashTabBtn, aboutBtn.nextSibling);
    } else {
      tabsNav.appendChild(dashTabBtn);
    }
  }

  let underlineEl = null;

  // Refresh tabs after any dynamic injections
  tabs = getTabs();

  // Mobile collapse (injected toggle button; no HTML changes needed)
  const headerEl = document.querySelector(".header");
  let menuBtn = document.querySelector(".menuToggle");

  const ensureMenuBtn = () => {
    if (!headerEl || !tabsNav) return null;
    if (menuBtn) return menuBtn;

    menuBtn = document.createElement("button");
    menuBtn.className = "menuToggle";
    menuBtn.type = "button";
    menuBtn.setAttribute("aria-label", "Open menu");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.innerHTML = '<span class="menuIcon" aria-hidden="true">☰</span>';

    // Insert just before the tabs
    headerEl.insertBefore(menuBtn, tabsNav);

    menuBtn.addEventListener("click", () => {
      const open = !tabsNav.classList.contains("open");
      setMenuOpen(open);
    });

    // Close when a tab is clicked (mobile)
    
  tabs.forEach((btn) => {
    if (btn.dataset.lypoBound === "1") return;
    btn.dataset.lypoBound = "1";

    btn.addEventListener("click", (e) => {
      const href = btn.getAttribute("data-href");
      const tab = (btn.getAttribute("data-tab") || "").toLowerCase();

      // Visual active state (instant)
      tabs.forEach((b) => {
        b.classList.remove("isActive");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("isActive");
      btn.setAttribute("aria-selected", "true");

      // Desktop underline
      if (tabsNav && window.matchMedia("(min-width: 769px)").matches) {
        const ul = ensureUnderline();
        const navRect = tabsNav.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        ul.style.transform = `translateX(${Math.max(0, btnRect.left - navRect.left)}px)`;
        ul.style.width = `${Math.max(12, btnRect.width)}px`;
        ul.style.opacity = "1";
      }

      // Normal navigation buttons
      if (href) {
        window.location.href = href;
        return;
      }

      // Index page tab switching only
      if (isIndex && tab) {
        e.preventDefault();
        activateIndexTab(tab);
        return;
      }
    });
  });


    // Close if clicking outside
    document.addEventListener("click", (e) => {
      if (!tabsNav.classList.contains("open")) return;
      const t = e.target;
      if (t instanceof Element) {
        const inside = tabsNav.contains(t) || menuBtn.contains(t);
        if (!inside) setMenuOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 769px)").matches) {
        setMenuOpen(false);
      }
    });

    return menuBtn;
  };

  const setMenuOpen = (open) => {
    if (!tabsNav) return;
    tabsNav.classList.toggle("open", open);
    const b = ensureMenuBtn();
    if (!b) return;
    b.classList.toggle("isOpen", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    const icon = b.querySelector(".menuIcon");
    if (icon) icon.textContent = open ? "✕" : "☰";
  };


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

  
  // On index.html we also need to activate the corresponding panel immediately.
  // This mirrors the minimal logic from script.js without changing design.
  function activateIndexTab(tabKey){
    const tab = String(tabKey || "home").toLowerCase();
    const tabBtns = Array.from(document.querySelectorAll(".tabBtn")).filter((b)=>b.dataset && b.dataset.tab);
    const panels = Array.from(document.querySelectorAll(".tabPanel"));
    tabBtns.forEach((b)=>{
      const on = (String(b.dataset.tab||"").toLowerCase() === tab);
      b.classList.toggle("isActive", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((p)=>{
      const on = (p.id === `tab-${tab}`);
      p.classList.toggle("isActive", on);
    });
  }

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

    // If nothing matched (edge case), default to Home/home
    if (!activeBtn && tabs.length) {
      activeBtn = tabs[0];
      activeBtn.classList.add("isActive");
      activeBtn.setAttribute("aria-selected", "true");
    }

    // Dashboard page highlight (safe)
    if (dashTabBtn) {
      const onDash = !!isDashboard;
      dashTabBtn.classList.toggle('isActive', onDash);
      dashTabBtn.setAttribute('aria-selected', onDash ? 'true' : 'false');
      if (onDash) activeBtn = dashTabBtn;
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
    // Inject Dashboard button (shown only when logged in)
    const headerRight = document.querySelector(".headerRight");
    let dashLink = document.querySelector(".headerDashBtn");
    if (headerRight && !dashLink) {
      dashLink = document.createElement("a");
      dashLink.className = "btnGhost headerAuthBtn headerDashBtn";
      dashLink.href = "dashboard.html";
      dashLink.style.textDecoration = "none";
      dashLink.style.display = "none";
      dashLink.style.alignItems = "center";
      dashLink.style.gap = "10px";
      dashLink.innerHTML = '<span class="btnLabel">Dashboard</span><span class="btnGlow"></span>';
      headerRight.insertBefore(dashLink, authBtn);
    }

    
    
    const applyAuthState = () => {
      const authed = isAuthed();
      ensureDashTabs();

      if (authed) {
        dashTabBtn.style.display = "";
        logoutTabBtn.style.display = "";
        // Keep right button consistent: show "Dashboard"
        if (authBtn) authBtn.querySelector(".btnLabel")?.replaceChildren(document.createTextNode("Dashboard"));
      } else {
        dashTabBtn.style.display = "none";
        logoutTabBtn.style.display = "none";
        if (authBtn) authBtn.querySelector(".btnLabel")?.replaceChildren(document.createTextNode("Login"));
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
    
  
  // Navigation + consistent press feedback (without changing design)
  const PRESS_DELAY_MS = 0; // keep header snappy; press feedback handled via pointer states // small delay so the press animation is visible

  tabs.forEach((btn) => {
    if (btn.dataset.lypoBound === "1") return; // prevent duplicate bindings
    btn.dataset.lypoBound = "1";

    const pressOn = () => btn.classList.add("isPressing");
    const pressOff = () => btn.classList.remove("isPressing");

    btn.addEventListener("pointerdown", pressOn, { passive: true });
    btn.addEventListener("pointerup", pressOff, { passive: true });
    btn.addEventListener("pointercancel", pressOff, { passive: true });
    btn.addEventListener("blur", pressOff);

    btn.addEventListener("click", (e) => {
      // Make the pressed tab feel instant
      tabs.forEach((b) => {
        b.classList.remove("isActive");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("isActive");
      btn.setAttribute("aria-selected", "true");

      // Move underline immediately on desktop
      if (tabsNav && window.matchMedia("(min-width: 769px)").matches) {
        const ul = ensureUnderline();
        const navRect = tabsNav.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const left = Math.max(0, btnRect.left - navRect.left);
        const width = Math.max(12, btnRect.width);
        ul.style.transform = `translateX(${left}px)`;
        ul.style.width = `${width}px`;
        ul.style.opacity = "1";
      }

      const href = btn.getAttribute("data-href");
      if (href) {
        // Let the press animation show before navigating
        e.preventDefault();
        setTimeout(() => (location.href = href), PRESS_DELAY_MS);
        return;
      }

      const tab = (btn.getAttribute("data-tab") || "home").toLowerCase();
      if (!isIndex) {
        // From other pages, Home goes to index
        e.preventDefault();
        setTimeout(() => (location.href = "index.html"), PRESS_DELAY_MS);
        return;
      }

      // On index.html: activate the panel immediately (no reload)
      if (isIndex) {
        e.preventDefault();
        activateIndexTab(tab);
        // keep URL clean (optional): ensure no lingering tab param
        try {
          const u = new URL(location.href);
          u.searchParams.delete("tab");
          history.replaceState({}, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : "") + u.hash);
        } catch {}
        return;
      }

      e.preventDefault();
    });
  });


}

  
  function finishHeaderPaint(){
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('preload');
    });
  }

// Initialize active state + underline
  const sync = () => requestAnimationFrame(setActiveTab);
  try { sync(); } finally { finishHeaderPaint(); }
  window.addEventListener("resize", () => {
    // avoid layout thrash
    clearTimeout(window.__lypoTabResizeT);
    window.__lypoTabResizeT = setTimeout(sync, 60);
  });
})();