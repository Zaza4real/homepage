function escapeHtml(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
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

  
  // ---- Admin: Users list (edit/delete)
  async function adminLoadUsersList({ q = "", offset = 0 } = {}) {
    const host = document.querySelector("#adminPanel") || document.querySelector(".adminPanel") || document.body;
    let wrap = document.getElementById("adminUsersWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "adminUsersWrap";
      wrap.className = "card";
      wrap.style.marginTop = "14px";
      wrap.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div style="font-weight:700;">All users</div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <input id="adminUsersSearch" class="input" type="text" placeholder="Search email…" style="width:240px;" />
            <button class="btnPrimary" id="btnAdminUsersSearch"><span class="btnLabel">Search</span></button>
          </div>
        </div>
        <div class="hr" style="margin:14px 0;"></div>
        <div id="adminUsersMsg" class="muted"></div>
        <div id="adminUsersTable" style="overflow:auto; margin-top:10px;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btnPrimary" id="btnUsersPrev"><span class="btnLabel">Prev</span></button>
          <div class="muted" id="adminUsersPage"></div>
          <button class="btnPrimary" id="btnUsersNext"><span class="btnLabel">Next</span></button>
        </div>
      `;
      // Try to place under existing admin lookup result if present
      const after = document.getElementById("adminLookupResult") || document.getElementById("adminSupportResult") || document.getElementById("adminLookupResults");
      if (after && after.parentElement) {
        after.parentElement.appendChild(wrap);
      } else {
        host.appendChild(wrap);
      }
    }

    const msg = document.getElementById("adminUsersMsg");
    const tableWrap = document.getElementById("adminUsersTable");
    const pageEl = document.getElementById("adminUsersPage");
    const limit = 50;

    msg.textContent = "Loading…";
    tableWrap.innerHTML = "";

    try {
      const data = await apiFetch(`/api/admin/users?limit=${limit}&offset=${offset}&q=${encodeURIComponent(q || "")}`);
      const users = Array.isArray(data.users) ? data.users : [];
      msg.textContent = users.length ? "" : "No users found.";

      tableWrap.innerHTML = `
        <table class="table" style="min-width:840px;">
          <thead>
            <tr>
              <th>Email</th>
              <th>Created</th>
              <th>Balance</th>
              <th>Admin</th>
              <th style="width:260px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-email="${escapeHtml(u.email)}">
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(formatDate(u.created_at))}</td>
                <td>
                  <input class="input" type="number" min="0" step="1" value="${Number(u.balance||0)}" style="width:120px;" />
                </td>
                <td>${u.is_admin ? "YES" : "NO"}</td>
                <td>
                  <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <button class="btnPrimary btnUserSave"><span class="btnLabel">Save</span></button>
                    <button class="btnPrimary btnUserDelete"><span class="btnLabel">Delete</span></button>
                    <span class="muted userRowMsg"></span>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      pageEl.textContent = `Showing ${offset + 1}–${offset + users.length} (limit ${limit})`;

      // Wire row actions
      tableWrap.querySelectorAll("tr[data-email]").forEach(tr => {
        const email = tr.getAttribute("data-email");
        const balInput = tr.querySelector("input");
        const rowMsg = tr.querySelector(".userRowMsg");

        tr.querySelector(".btnUserSave")?.addEventListener("click", async () => {
          const bal = Number(balInput?.value || 0);
          if (!Number.isFinite(bal) || bal < 0) {
            rowMsg.textContent = "Invalid balance.";
            return;
          }
          rowMsg.textContent = "Saving…";
          try {
            const upd = await apiFetch("/api/admin/user-update", { method: "PUT", jsonBody: { email, balance: Math.floor(bal) } });
            rowMsg.textContent = "✅ Saved";
            if (upd?.user?.balance !== undefined) balInput.value = String(upd.user.balance);
          } catch (e) {
            rowMsg.textContent = "❌ " + (e.message || String(e));
          }
        });

        tr.querySelector(".btnUserDelete")?.addEventListener("click", async () => {
          const ok = window.confirm(`Delete account for ${email}?\n\nThis will permanently delete the user and related history.`);
          if (!ok) return;
          rowMsg.textContent = "Deleting…";
          try {
            await apiFetch(`/api/admin/user-delete?email=${encodeURIComponent(email)}`, { method: "DELETE" });
            tr.remove();
          } catch (e) {
            rowMsg.textContent = "❌ " + (e.message || String(e));
          }
        });
      });

      // Wire pagination + search
      document.getElementById("btnUsersPrev")?.onclick = () => adminLoadUsersList({ q, offset: Math.max(offset - limit, 0) });
      document.getElementById("btnUsersNext")?.onclick = () => adminLoadUsersList({ q, offset: offset + limit });

      const searchInput = document.getElementById("adminUsersSearch");
      if (searchInput && !searchInput.value) searchInput.value = q || "";
      document.getElementById("btnAdminUsersSearch")?.onclick = () => adminLoadUsersList({ q: (searchInput?.value || "").trim(), offset: 0 });
      searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") adminLoadUsersList({ q: (searchInput.value || "").trim(), offset: 0 }); });

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

function formatDate(v){ if(!v) return ''; try{ return new Date(v).toLocaleString(); }catch{ return String(v);} }
