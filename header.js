// Shared header behavior for all pages
(() => {
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";
  const isAuthed = () => !!token();

  const authBtn = document.querySelector(".headerAuthBtn");
  const dashBtn = document.querySelector('[data-nav="dashboard"]');
  const logoLink = document.querySelector(".logoWrap");
  const tabs = document.querySelectorAll(".tabBtn");

  // UNIVERSAL TAB NAV (single handler, prevents double-binding bugs)
  if (tabs && tabs.length) {
    tabs.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const href = btn.getAttribute("data-href");
        if (href) {
          location.href = href;
          return;
        }
        const tab = btn.getAttribute("data-tab") || "home";
        if (tab === "home") {
          location.href = "index.html";
        } else {
          location.href = `index.html?tab=${encodeURIComponent(tab)}`;
        }
      });
    });
  }

  // Make logo always go to homepage
  if (logoLink) {
    logoLink.setAttribute("href", "index.html");
  }

  // Highlight current page in header (dashboard / auth)
  const path = (location.pathname || "").toLowerCase();
  const isDashboard = path.includes("dashboard");
  const isAuth = path.includes("auth");
  if (dashBtn) dashBtn.classList.toggle("isActive", isDashboard);

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
})();


// Highlight active header button based on current page
(function setActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll('.header .btnGhost, .header .btnPrimary').forEach(btn=>{
    const href = btn.getAttribute("href");
    if (!href) return;
    if (href === path){
      btn.classList.add("isActive");
    } else {
      btn.classList.remove("isActive");
    }
  });
})();


// Active header button based on data-nav (robust)
(function setActiveNavV2(){
  const page = (location.pathname.split("/").pop() || "index.html")
    .replace(".html","");

  document.querySelectorAll("[data-nav]").forEach(btn=>{
    const nav = btn.getAttribute("data-nav");
    if (!nav) return;
    if (nav === page){
      btn.classList.add("isActive");
    } else {
      btn.classList.remove("isActive");
    }
  });
})();


// Active header tab (white pill) based on current page
(function applyActiveHeaderTab(){
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const btns = Array.from(document.querySelectorAll(".tabs .tabBtn"));
  if (!btns.length) return;

  btns.forEach((b) => {
    const href = (b.getAttribute("data-href") || "").toLowerCase();
    const tab = (b.getAttribute("data-tab") || "").toLowerCase();

    const isHome = (page === "index.html" || page === "");
    const shouldBeActive =
      (href && href === page) ||
      (isHome && tab === "home");

    b.classList.toggle("isActive", !!shouldBeActive);
    b.setAttribute("aria-selected", shouldBeActive ? "true" : "false");
  });
})();
