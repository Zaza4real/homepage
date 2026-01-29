// Shared header behavior for all pages
(() => {
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";
  const isAuthed = () => !!token();

  const authBtn = document.querySelector(".headerAuthBtn");
  const dashBtn = document.querySelector('[data-nav="dashboard"]');
  const logoLink = document.querySelector(".logoWrap");
  const tabs = document.querySelectorAll(".tabBtn");

  // UNIVERSAL TAB NAV
  // data-href always navigates directly (works on every page including index)
  if (tabs && tabs.length) {
    tabs.forEach((btn) => {
      const href = btn.getAttribute("data-href");
      if (href) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          location.href = href;
        });
      }
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

  // On non-index pages, clicking tabs should bring you to the homepage and open that section
  const isIndex = path.endsWith("index.html") || path === "/" || path === "";
  if (!isIndex && tabs.length) {
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const href = btn.getAttribute("data-href");
        if (href) {
          location.href = href;
          return;
        }
        const tab = btn.getAttribute("data-tab") || "home";
        location.href = `index.html?tab=${encodeURIComponent(tab)}`;
      });
    });
  }
})();
