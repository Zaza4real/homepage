const BACKEND_BASE_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://localhost:10000"
  : "https://lypo-backend.onrender.com";

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

  

async function maybeHandleEmailVerify() {
  const hash = String(location.hash || "");
  if (!hash.includes("verify=")) return false;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("verify") || "";
  const email = params.get("email") || "";

  // Clean URL (keep page but remove token from address bar)
  history.replaceState(null, "", "auth.html");

  try {
    setMsg("Verifying email…");
    await apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    });
    setMsg("✅ Email verified! You can now log in.");
    // Focus login
    showConfirmPass(false);
    $("authEmailPage") && ($("authEmailPage").value = email);
    $("authPassPage")?.focus();
    return true;
  } catch (e) {
    setMsg(e?.message || "Could not verify email.");
    return true;
  }
}


function setMsg(msg){
  const el = document.getElementById("resetMsg");
  if (el) el.textContent = msg || "";
}

function getParams(){
  const u = new URL(location.href);
  const token = u.searchParams.get("token") || "";
  const email = u.searchParams.get("email") || "";
  return { token, email };
}

document.addEventListener("DOMContentLoaded", () => {
  const { token, email } = getParams();
  if (!token || !email) {
    setMsg("Missing reset link data. Please request a new reset email.");
    document.getElementById("btnDoReset")?.setAttribute("disabled","true");
    return;
  }

  const btn = document.getElementById("btnDoReset");
  btn?.addEventListener("click", async () => {
    const p1 = document.getElementById("resetPass1")?.value || "";
    const p2 = document.getElementById("resetPass2")?.value || "";
    if (!p1 || !p2) return setMsg("Please enter your new password twice.");
    if (p1 !== p2) return setMsg("Passwords do not match.");
    if (p1.length < 6) return setMsg("Password too short (min 6 characters).");

    try {
      btn.disabled = true;
      setMsg("Updating password…");
      const resetCandidates = ["/api/auth/reset-password", "/auth/reset-password", "/reset-password", "/api/auth/password/reset", "/auth/password/reset"];
      let ok = false; let lastErr = null;
      for (const url of resetCandidates) {
        try {
          await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({ email, token, password: p1 }),
      });
          ok = true; break;
        } catch(e){ lastErr = e; }
      }
      if (!ok) throw lastErr;

      setMsg("✅ Password updated. You can now sign in.");
      setTimeout(() => { location.href = "auth.html"; }, 900);
    } catch (e) {
      setMsg(e?.message || "Could not reset password. Please request a new link.");
    } finally {
      btn.disabled = false;
    }
  });
});
