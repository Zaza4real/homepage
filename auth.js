// Auth page script
(() => {
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const AUTH_TOKEN_KEY = "lypo_token_v1";

  const $ = (id) => document.getElementById(id);

  function setMsg(msg){ const el=$("authMsgPage"); if(el) el.textContent = msg || ""; }

  async function apiFetch(path, opts = {}) {
    const headers = new Headers(opts.headers || {});
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(`${BACKEND_BASE_URL}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error || "Request failed";
      const e = new Error(msg);
      e.status = res.status;
      throw e;
    }
    return data;
  }

  async function doSignup() {
    const email = $("authEmailPage")?.value?.trim();
    const password = $("authPassPage")?.value || "";
    if (!email || !password) { setMsg("Please enter email + password."); return; }
    setMsg("Creating account…");
    const out = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem(AUTH_TOKEN_KEY, out.token);
    setMsg("Account created. Redirecting…");
    window.location.href = "index.html";
  }

  async function doLogin() {
    const email = $("authEmailPage")?.value?.trim();
    const password = $("authPassPage")?.value || "";
    if (!email || !password) { setMsg("Please enter email + password."); return; }
    setMsg("Logging in…");
    const out = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem(AUTH_TOKEN_KEY, out.token);
    setMsg("Logged in. Redirecting…");
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("btnSignupPage")?.addEventListener("click", () => doSignup().catch(e => setMsg(`Signup failed: ${e.message}`)));
    $("btnLoginPage")?.addEventListener("click", () => doLogin().catch(e => setMsg(`Login failed: ${e.message}`)));

    // Enter submits login
    ["authEmailPage","authPassPage"].forEach((id) => {
      $(id)?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") $("btnLoginPage")?.click();
      });
    });
  });
})();
