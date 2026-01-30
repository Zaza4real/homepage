// Auth page script
(() => {
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const AUTH_TOKEN_KEY = "lypo_token_v1";

  const $ = (id) => document.getElementById(id);

  function setMsg(msg){ const el=$("authMsgPage"); if(el) el.textContent = msg || ""; }

  function showConfirmPass(show){
    const wrap = $("confirmPassWrap");
    if (wrap) wrap.style.display = show ? "" : "none";
  }

  async function apiFetch(path, opts = {}) {
    const headers = new Headers(opts.headers || {});
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(`${BACKEND_BASE_URL}${path}`, { ...opts, headers });
    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) data = await res.json().catch(() => null);
    else data = await res.text().catch(() => null);
    if (!res.ok) {
      const msg = data?.error || (typeof data==="string" && data.trim()) || `Request failed (${res.status})`;
      const e = new Error(msg);
      e.status = res.status;
      throw e;
    }
    return data;
  }


  async function ensureBackendUp() {
    try {
      const r = await fetch(`${BACKEND_BASE_URL}/health`);
      if (!r.ok) throw new Error(`Backend unhealthy (${r.status})`);
      return true;
    } catch (e) {
      setMsg(`Backend not reachable. Check Render backend URL and logs. (${e.message || e})`);
      return false;
    }
  }

  async function doSignup() {
    if (!(await ensureBackendUp())) return;

    const email = $("authEmailPage")?.value?.trim();
    const password = $("authPassPage")?.value || "";
    const password2 = $("authPass2Page")?.value || "";
    if (!email || !password) { setMsg("Please enter email + password."); return; }
    if (password !== password2) { setMsg("Passwords do not match."); return; }
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
    if (!(await ensureBackendUp())) return;

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

  // ---- Forgot / Reset password
  function getHashParams() {
    const h = (location.hash || "").replace(/^#/, "");
    const out = {};
    if (!h) return out;
    for (const part of h.split("&")) {
      const [k, v] = part.split("=");
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
    return out;
  }

  async function requestPasswordReset() {
    const email = $("authEmailPage")?.value?.trim();
    if (!email) return setMsg("Please enter your email first.");
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMsg("If an account exists for that email, a reset link has been sent.");
    } catch (e) {
      // Always show a generic message to avoid account enumeration
      setMsg("If an account exists for that email, a reset link has been sent.");
    }
  }

  async function doResetPassword() {
    const params = getHashParams();
    const token = params.reset || "";
    const email = (params.email || $("authEmailPage")?.value || "").trim();
    const p1 = $("resetPass1")?.value || "";
    const p2 = $("resetPass2")?.value || "";
    if (!token) return setMsg("Missing reset token.");
    if (!email) return setMsg("Missing email.");
    if (p1.length < 6) return setMsg("Password too short (min 6).");
    if (p1 !== p2) return setMsg("Passwords do not match.");
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword: p1 })
      });
      setMsg("Password updated. You can now sign in.");
      // clean hash and hide reset panel
      history.replaceState(null, "", location.pathname);
      const wrap = $("resetWrap"); if (wrap) wrap.style.display = "none";
    } catch (e) {
      setMsg(e.message || "Could not reset password.");
    }
  }

  const btnForgot = $("btnForgotPage");
  if (btnForgot) btnForgot.addEventListener("click", requestPasswordReset);

  const btnReset = $("btnResetPass");
  if (btnReset) btnReset.addEventListener("click", doResetPassword);

  // If opened from email link: auth.html#reset=...&email=...
  const hp = getHashParams();
  if (hp.reset) {
    const wrap = $("resetWrap");
    if (wrap) wrap.style.display = "block";
    if (hp.email && $("authEmailPage")) $("authEmailPage").value = hp.email;
  }
})();
