// Account dashboard + admin
(() => {
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  // Prefer explicit backend URL. If you change backend host, update this one place.
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";

  const $ = (id) => document.getElementById(id);

  function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

  function setDiag(txt) { setText("dashDiag", txt || ""); }
  function setMsg(txt) { setText("dashMsg", txt || ""); }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso || ""; }
  }

  async function fetchJSONorText(url, opts) {
    const res = await fetch(url, opts);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const isJson = ct.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
    return { res, ct, isJson, body };
  }

  // Robust API fetch:
  // 1) Try /api/... as expected
  // 2) If backend is deployed without the /api prefix, retry without it
  
  async function maybeConfirmStripeReturn() {
    try {
      const qs = new URLSearchParams(window.location.search || "");
      const paid = qs.get("paid");
      const sessionId = qs.get("session_id");
      if (paid !== "1" || !sessionId) return false;

      setMsg("Confirming your payment…");
      await apiFetch(`/api/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`);
      setMsg("Payment confirmed. Credits added.");

      // Remove params so refresh doesn't re-confirm
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("paid");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      } catch {}
      return true;
    } catch (e) {
      setMsg(`Payment confirm error: ${e.message || e}`);
      return false;
    }
  }

async function apiFetch(path, { method = "GET", jsonBody = null } = {}) {
    if (!token) throw new Error("Please login first.");

    const headers = { "Authorization": `Bearer ${token}` };
    if (jsonBody) headers["Content-Type"] = "application/json";

    const doReq = (p) => fetchJSONorText(`${BACKEND_BASE_URL}${p}`, {
      method,
      headers,
      body: jsonBody ? JSON.stringify(jsonBody) : undefined
    });

    let out = await doReq(path);

    // Retry without /api prefix if we got a 404 HTML response mentioning /api
    if (out.res.status === 404 && !out.isJson && typeof out.body === "string" && path.startsWith("/api/")) {
      const altPath = path.replace(/^\/api/, "");
      out = await doReq(altPath);
    }

    if (!out.res.ok) {
      const errMsg =
        (out.isJson && out.body && out.body.error) ? out.body.error :
        (typeof out.body === "string" && out.body.trim()) ? out.body.trim() :
        `Request failed (${out.res.status})`;

      // If it’s HTML, surface a clean message (so you can see it's a route/deploy issue)
      if (!out.isJson && out.ct.includes("text/html")) {
        throw new Error(`Expected JSON but got ${out.ct} (status ${out.res.status}). ${errMsg}`);
      }
      throw new Error(errMsg);
    }

    return out.body;
  }

  function renderPayments(items) {
    const body = $("paymentsBody");
    if (!body) return;
    if (!items?.length) {
      body.innerHTML = '<tr><td colspan="5" class="mutedCell">No payments yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((p) => {
      const docUrl = p.invoice_url;
      let invoice = "—";
      if (docUrl) {
        const isPdf = String(docUrl).includes(".pdf");
        // Note: download attribute may be ignored cross-origin, but it's harmless.
        invoice = `<a href="${docUrl}" target="_blank" rel="noreferrer"${isPdf ? " download" : ""}>${isPdf ? "Download" : "Open"}</a>`;
      }
      const amount = (p.amount_usd != null) ? `$${Number(p.amount_usd || 0).toFixed(2)}` : "—";
      const credits = (p.credits != null) ? p.credits : (p.lypos != null ? p.lypos : 0);
      return `<tr>
        <td>${fmtDate(p.created_at)}</td>
        <td>${amount}</td>
        <td>${credits}</td>
        <td>${p.status || "—"}</td>
        <td>${invoice}</td>
      </tr>`;
    }).join("");
  }

  function renderVideos(items) {
    const body = $("videosBody");
    if (!body) return;
    if (!items?.length) {
      body.innerHTML = '<tr><td colspan="4" class="mutedCell">No videos yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((v) => {
      const out = v.output_url ? `<a href="${v.output_url}" target="_blank" rel="noreferrer">Download</a>` : "—";
      const pred = v.prediction_id ? `<code>${v.prediction_id}</code>` : "—";
      return `<tr>
        <td>${fmtDate(v.created_at)}</td>
        <td>${v.status || "—"}</td>
        <td>${pred}</td>
        <td>${out}</td>
      </tr>`;
    }).join("");
  }

  async function load() {
    if (!token) {
      setText("dashAdminTop", "Admin: NO TOKEN");
      setDiag("You are not logged in. Go to Login and then return to Dashboard.");
      return;
    }

    try {
      const me = await apiFetch("/api/auth/me");
      const email = me?.user?.email || "—";
      setText("dashEmailTop", `Email: ${email}`);
      setText("dashEmailAccount", `Email: ${email}`);

      const credits = await apiFetch("/api/credits");
      const bal = credits?.balance ?? "—";
      setText("dashBalanceTop", `Balance: ${bal} credits`);
      setText("dashBalanceAccount", `Balance: ${bal} credits`);

      // Admin status
      try {
        const st = await apiFetch("/api/admin/status");
        if (st?.isAdmin) setText("dashAdminTop", "Admin: YES");
        else setText("dashAdminTop", "Admin: NO");
      } catch (e) {
        setText("dashAdminTop", "Admin: ERROR");
        setDiag(e.message || String(e));
      }

      // Payments/videos (ignore if backend doesn't have these yet)
      try {
        const payments = await apiFetch("/api/account/payments");
        renderPayments(payments?.payments || []);
      } catch {
        // keep table but don't break whole dashboard
      }

      try {
        const vids = await apiFetch("/api/account/videos");
        renderVideos(vids?.videos || []);
      } catch {
        // keep table but don't break whole dashboard
      }

      setMsg("");
    } catch (e) {
      setMsg(e.message || String(e));
      if (!token) window.location.href = "auth.html";
    }
  }

  async function adminAddCredits() {
    const email = ($("adminEmail")?.value || "").trim();
    const amount = Number($("adminAmount")?.value || 0);
    const reason = ($("adminReason")?.value || "").trim();
    const msg = $("adminMsg");

    if (!msg) return;

    if (!email || !Number.isFinite(amount) || amount === 0) {
      msg.textContent = "Enter user email and a non-zero credit amount.";
      return;
    }

    msg.textContent = "Working…";

    try {
      const data = await apiFetch("/api/admin/add-credits", { method: "POST", jsonBody: { email, amount, reason } });
      msg.textContent = `✅ ${data.user.email} now has ${data.user.balance} credits`;
      // refresh your own balance if you topped yourself up
      load();
    } catch (e) {
      msg.textContent = "❌ " + (e.message || String(e));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("btnLogoutDash")?.addEventListener("click", () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = "auth.html";
    });

    $("btnAdminAdd")?.addEventListener("click", adminAddCredits);

    load();
  });
})();
