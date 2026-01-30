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

  
  // ---- Admin: Support lookup (optional UI if elements exist)
  function findEl(...ids) {
    for (const id of ids) {
      const el = $(id);
      if (el) return el;
    }
    return null;
  }

  async function adminSupportLookup() {
    const emailEl = findEl("adminLookupEmail", "adminSupportEmail", "adminLookupEmailInput");
    const resEl = findEl("adminLookupResult", "adminSupportResult", "adminLookupResults");
    const msgEl = findEl("adminLookupMsg", "adminSupportMsg");
    if (!emailEl || !resEl) return;

    const email = String(emailEl.value || "").trim();
    if (!email) {
      if (msgEl) msgEl.textContent = "Enter a user email.";
      return;
    }
    if (msgEl) msgEl.textContent = "Searching…";
    resEl.innerHTML = "";

    try {
      const data = await apiFetch(`/api/admin/user-lookup?email=${encodeURIComponent(email)}`);
      if (msgEl) msgEl.textContent = "";

      const u = data.user || {};
      const payments = Array.isArray(data.payments) ? data.payments : [];
      const videos = Array.isArray(data.videos) ? data.videos : [];

      resEl.innerHTML = `
        <div class="card" style="margin-top:12px;">
          <div style="display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <div>
              <div style="font-weight:700;">${escapeHtml(u.email || email)}</div>
              <div class="muted" style="margin-top:4px;">Created: ${u.created_at ? escapeHtml(String(u.created_at)) : "—"} • Admin: ${u.is_admin ? "YES" : "NO"}</div>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <label class="field" style="margin:0;">
                <span class="fieldLabel">Balance</span>
                <input id="adminEditBalance" class="input" type="number" min="0" step="1" value="${Number(u.balance ?? 0)}" style="width:160px;" />
              </label>
              <button class="btnPrimary" id="btnAdminSaveUser"><span class="btnLabel">Save</span></button>
              <button class="btnPrimary" id="btnAdminDeleteUser"><span class="btnLabel">Delete account</span></button>
            </div>
          </div>

          <div class="hr" style="margin:16px 0;"></div>

          <div style="display:grid; grid-template-columns: 1fr; gap:14px;">
            <div>
              <div style="font-weight:700; margin-bottom:8px;">Purchases</div>
              ${payments.length ? `
                <div style="overflow:auto;">
                  <table class="table" style="min-width:720px;">
                    <thead><tr><th>Date</th><th>Amount</th><th>Credits</th><th>Status</th><th>Invoice</th></tr></thead>
                    <tbody>
                      ${payments.map(p => `
                        <tr>
                          <td>${escapeHtml(formatDate(p.created_at))}</td>
                          <td>$${escapeHtml(String(p.amount_usd ?? ""))}</td>
                          <td>${escapeHtml(String(p.lypos ?? ""))}</td>
                          <td>${escapeHtml(String(p.status ?? ""))}</td>
                          <td>${p.invoice_url ? `<a class="link" href="${escapeHtml(String(p.invoice_url))}" target="_blank" rel="noopener">Open</a>` : "—"}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `<div class="muted">No purchases found.</div>`}
            </div>

            <div>
              <div style="font-weight:700; margin-bottom:8px;">Video generations</div>
              ${videos.length ? `
                <div style="overflow:auto;">
                  <table class="table" style="min-width:720px;">
                    <thead><tr><th>Date</th><th>Status</th><th>Cost</th><th>Input</th><th>Output</th></tr></thead>
                    <tbody>
                      ${videos.map(v => `
                        <tr>
                          <td>${escapeHtml(formatDate(v.created_at))}</td>
                          <td>${escapeHtml(String(v.status ?? ""))}</td>
                          <td>${escapeHtml(String(v.cost_credits ?? ""))}</td>
                          <td>${v.input_url ? `<a class="link" href="${escapeHtml(String(v.input_url))}" target="_blank" rel="noopener">Open</a>` : "—"}</td>
                          <td>${v.output_url ? `<a class="link" href="${escapeHtml(String(v.output_url))}" target="_blank" rel="noopener">Open</a>` : "—"}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `<div class="muted">No generations found.</div>`}
            </div>
          </div>

          <div class="muted" id="adminLookupInlineMsg" style="margin-top:12px;"></div>
        </div>
      `;

      const inlineMsg = $("adminLookupInlineMsg");
      $("btnAdminSaveUser")?.addEventListener("click", async () => {
        const bal = Number($("adminEditBalance")?.value || 0);
        if (!Number.isFinite(bal) || bal < 0) {
          inlineMsg && (inlineMsg.textContent = "Invalid balance.");
          return;
        }
        inlineMsg && (inlineMsg.textContent = "Saving…");
        try {
          const upd = await apiFetch("/api/admin/user-update", { method: "PUT", jsonBody: { email: u.email || email, balance: Math.floor(bal) } });
          inlineMsg && (inlineMsg.textContent = `✅ Saved. New balance: ${upd.user.balance}`);
        } catch (e) {
          inlineMsg && (inlineMsg.textContent = "❌ " + (e.message || String(e)));
        }
      });

      $("btnAdminDeleteUser")?.addEventListener("click", async () => {
        const targetEmail = u.email || email;
        const ok = window.confirm(`Delete account for ${targetEmail}?\n\nThis will permanently delete the user and their related history.`);
        if (!ok) return;
        inlineMsg && (inlineMsg.textContent = "Deleting…");
        try {
          await apiFetch(`/api/admin/user-delete?email=${encodeURIComponent(targetEmail)}`, { method: "DELETE" });
          inlineMsg && (inlineMsg.textContent = "✅ Account deleted.");
          resEl.innerHTML = "";
        } catch (e) {
          inlineMsg && (inlineMsg.textContent = "❌ " + (e.message || String(e)));
        }
      });
    } catch (e) {
      if (msgEl) msgEl.textContent = "❌ " + (e.message || String(e));
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(v) {
    if (!v) return "";
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch { return String(v); }
  }

document.addEventListener("DOMContentLoaded", () => {
    $("btnLogoutDash")?.addEventListener("click", () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = "auth.html";
    });

    $("btnAdminAdd")?.addEventListener("click", adminAddCredits);

    // Admin • Support lookup
    findEl("btnAdminLookup","btnAdminSupportLookup","btnLookupUser")?.addEventListener("click", adminSupportLookup);
    findEl("adminLookupEmail","adminSupportEmail","adminLookupEmailInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") adminSupportLookup(); });

    load();
  });
})();
