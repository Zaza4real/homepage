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
      btn.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
          setMenuOpen(false);
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
    
  // Navigation behavior:
  // - Buttons with data-href go to their page
  // - "Demo" (data-tab="home") goes to index.html when not already there
  // - On index.html, we do NOT force reloads; script.js handles tab panels.
  tabs.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Make the pressed tab feel instant (avoid "clunky" delay)
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
        // Normal page navigation
        location.href = href;
        return;
      }

      const tab = (btn.getAttribute("data-tab") || "home").toLowerCase();

      // If we're not on index, Demo/Home should take us there (no query param needed)
      if (!isIndex) {
        location.href = "index.html";
        return;
      }

      // On index.html: do NOT reload or change URL.
      // The page's script.js already handles showing the correct tab panel.
      // We simply prevent any default weirdness.
      e.preventDefault();
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