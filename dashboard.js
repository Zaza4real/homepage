let editingBlogId = null;

// Global toggle function for collapsible sections
window.toggleSection = function (sectionId) {
  const section = document.getElementById(sectionId);
  const toggleIcon = document.getElementById(sectionId.replace('Section', 'Toggle'));

  if (!section) return;

  if (section.style.display === 'none') {
    section.style.display = 'block';
    if (toggleIcon) toggleIcon.textContent = '▼';
  } else {
    section.style.display = 'none';
    if (toggleIcon) toggleIcon.textContent = '▶';
  }
};

// Global function to show all rows in a table
window.showAllRows = function (tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => row.style.display = '');

  // Hide the "Show All" button
  const showMoreBtn = document.getElementById(tbodyId.replace('Body', 'ShowMore'));
  if (showMoreBtn) showMoreBtn.style.display = 'none';
};

// Limit table rows to a certain number and show "Show All" button if needed
function limitTableRows(tbodyId, maxRows = 10) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr:not(.mutedCell)');
  const showMoreBtn = document.getElementById(tbodyId.replace('Body', 'ShowMore'));

  if (rows.length > maxRows) {
    rows.forEach((row, idx) => {
      if (idx >= maxRows) row.style.display = 'none';
    });
    if (showMoreBtn) showMoreBtn.style.display = 'block';
  } else {
    if (showMoreBtn) showMoreBtn.style.display = 'none';
  }
}

// Account dashboard + admin
(() => {
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  // Prefer explicit backend URL. If you change backend host, update this one place.
  const BACKEND_BASE_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:10000"
    : "https://api.lypo.org";

  const $ = (id) => document.getElementById(id);

  function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }


  function hideAdminUI() {
    document.getElementById("adminCard")?.remove();
    document.getElementById("blogAdminCard")?.remove();
    document.getElementById("adminLookupCard")?.remove();
    document.getElementById("dashAdminTop")?.remove();
  }



  function setDiag(txt) { setText("dashDiag", txt || ""); }
  function setMsg(txt) { setText("dashMsg", txt || ""); }


  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
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
      } catch { }
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

    // Limit rows to 10 by default
    setTimeout(() => limitTableRows('paymentsBody', 10), 100);
  }

  function renderVideos(items) {
    const body = $("videosBody");
    if (!body) return;
    if (!items?.length) {
      body.innerHTML = '<tr><td colspan="5" class="mutedCell">No videos yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((v) => {
      const out = v.output_url ? `<a href="${v.output_url}" target="_blank" rel="noreferrer">Download</a>` : "—";

      // Format type nicely
      let typeLabel = "Video Translation";
      let typeIcon = "🎬";
      if (v.type === 'tiktok_captions') {
        typeLabel = "TikTok Captions";
        typeIcon = "📱";
      } else if (v.type === 'kling_video') {
        typeLabel = "Kling AI Video";
        typeIcon = "🎥";
      } else if (v.type === 'voiceover') {
        typeLabel = "Voiceover";
        typeIcon = "🎙️";
      }

      // Format status with color
      let statusClass = "";
      if (v.status === 'succeeded') statusClass = 'style="color: #4ade80;"';
      else if (v.status === 'failed') statusClass = 'style="color: #ef4444;"';
      else if (v.status === 'processing' || v.status === 'starting') statusClass = 'style="color: #fbbf24;"';

      return `<tr>
        <td>${fmtDate(v.created_at)}</td>
        <td>${typeIcon} ${typeLabel}</td>
        <td ${statusClass}>${v.status || "—"}</td>
        <td>${out}</td>
      </tr>`;
    }).join("");

    // Limit rows to 10 by default
    setTimeout(() => limitTableRows('videosBody', 10), 100);
  }

  async function load() {
    if (!token) {
      setText("dashAdminTop", "Admin: NO TOKEN");
      setDiag("You are not logged in. Go to Login and then return to Dashboard.");
      return;
    }

    // Confirm Stripe redirect (record payment + add credits)
    await maybeConfirmStripeReturn();

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
        if (st?.isAdmin) {
          // Show admin indicator
          const dashAdminTop = document.getElementById("dashAdminTop");
          if (dashAdminTop) {
            dashAdminTop.style.display = "inline-flex";
            dashAdminTop.textContent = "Admin: YES";
          }

          // Show all admin panels
          const adminCard = document.getElementById("adminCard");
          if (adminCard) adminCard.style.display = "block";

          const blogCard = document.getElementById("blogAdminCard");
          if (blogCard) blogCard.style.display = "block";

          const lookupCard = document.getElementById("adminLookupCard");
          if (lookupCard) lookupCard.style.display = "block";

          // Load admin tools
          if (typeof loadAdminBlog === "function") loadAdminBlog();
          if (typeof initAdminLookup === "function") initAdminLookup(true);
          if (typeof initAdminUsersList === "function") initAdminUsersList(true);
        } else {
          setText("dashAdminTop", "Admin: NO");
          hideAdminUI();
        }
      } catch (e) {
        setText("dashAdminTop", "Admin: ERROR");
        hideAdminUI();
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

  // --- Admin Blog (only loaded for admins) ---


  async function adminLookupUser(email) {
    const q = new URLSearchParams({ email: (email || "").trim() }).toString();
    return apiFetch(`/api/admin/user-lookup?${q}`, { method: "GET" });
  }

  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts || "");
    }
  }

  function renderLookup(result) {
    const wrap = document.getElementById("lookupResult");
    const msg = document.getElementById("lookupMsg");
    const account = document.getElementById("lookupAccount");
    const totals = document.getElementById("lookupTotals");
    const payBody = document.getElementById("lookupPaymentsBody");
    const vidBody = document.getElementById("lookupVideosBody");

    if (!wrap || !account || !totals || !payBody || !vidBody) return;

    wrap.style.display = "block";
    msg.textContent = "";

    const u = result.user;
    const payments = result.payments || [];
    const videos = result.videos || [];

    const totalUsd = payments.reduce((a, p) => a + Number(p.amount_usd || 0), 0);
    const totalCredits = payments.reduce((a, p) => a + Number(p.lypos || 0), 0);
    const totalVideoCost = videos.reduce((a, v) => a + Number(v.cost_credits || 0), 0);

    account.innerHTML = `
    <div><b>Email:</b> ${esc(u.email)}</div>
    <div><b>Created:</b> ${esc(fmtDate(u.created_at))}</div>
    <div><b>Balance:</b> ${esc(String(u.balance))}</div>
    <div><b>Admin:</b> ${u.is_admin ? "Yes" : "No"}</div>
  `;

    totals.innerHTML = `
    <div><b>Purchases:</b> ${payments.length}</div>
    <div><b>Total spent:</b> $${totalUsd.toFixed(2)}</div>
    <div><b>Total credits bought:</b> ${totalCredits}</div>
    <div><b>Videos generated:</b> ${videos.length}</div>
    <div><b>Total credits used:</b> ${totalVideoCost}</div>
  `;

    // Purchases
    if (!payments.length) {
      payBody.innerHTML = '<tr><td colspan="5" class="mutedCell">No purchases found</td></tr>';
    } else {
      payBody.innerHTML = payments.map(p => {
        const receipt = p.invoice_url ? `<a class="link" href="${p.invoice_url}" target="_blank" rel="noopener">Open</a>` : '<span class="mutedCell">—</span>';
        return `<tr>
        <td>${esc(fmtDate(p.created_at))}</td>
        <td>$${esc(String(p.amount_usd || 0))}</td>
        <td>${esc(String(p.lypos || 0))}</td>
        <td>${esc(String(p.status || ""))}</td>
        <td>${receipt}</td>
      </tr>`;
      }).join("");
    }

    // Videos
    if (!videos.length) {
      vidBody.innerHTML = '<tr><td colspan="6" class="mutedCell">No videos found</td></tr>';
    } else {
      vidBody.innerHTML = videos.map(v => {
        const outL = v.output_url ? `<a class="link" href="${v.output_url}" target="_blank" rel="noopener">Output</a>` : '<span class="mutedCell">—</span>';

        // Format type
        let typeLabel = "Video Translation";
        let typeIcon = "🎬";
        if (v.type === 'tiktok_captions') {
          typeLabel = "TikTok Captions";
          typeIcon = "📱";
        } else if (v.type === 'kling_video') {
          typeLabel = "Kling AI Video";
          typeIcon = "🎥";
        } else if (v.type === 'voiceover') {
          typeLabel = "Voiceover";
          typeIcon = "🎙️";
        }

        return `<tr>
        <td>${esc(fmtDate(v.created_at))}</td>
        <td>${typeIcon} ${esc(typeLabel)}</td>
        <td>${esc(String(v.status || ""))}</td>
        <td>${esc(String(v.cost_credits || 0))}</td>
        <td>${outL}</td>
      </tr>`;
      }).join("");
    }
  }



  function initAdminLookup(isAdmin) {
    const card = document.getElementById("adminLookupCard");
    if (!isAdmin) {
      if (card) card.style.display = "none";
      return;
    }
    if (card) card.style.display = "block";

    const btn = document.getElementById("btnLookup");
    const input = document.getElementById("lookupEmail");
    const msg = document.getElementById("lookupMsg");

    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const run = async () => {
      const email = (input?.value || "").trim();
      if (!email) {
        if (msg) msg.textContent = "Enter an email.";
        return;
      }
      try {
        if (msg) msg.textContent = "Searching…";
        const result = await adminLookupUser(email);
        renderLookup(result);
        if (msg) msg.textContent = "Done.";
      } catch (e) {
        if (msg) msg.textContent = e?.message || "Lookup failed";
      }
    };

    btn.addEventListener("click", run);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") run();
      });
    }
  }

  function initAdminUsersList(isAdmin) {
    const card = document.getElementById("adminLookupCard");
    if (!card) return;
    // Only for admins
    let wrap = document.getElementById("adminUsersWrap");
    if (!isAdmin) {
      if (wrap) wrap.style.display = "none";
      return;
    }
    if (wrap) {
      wrap.style.display = "block";
      return;
    }

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

    // Place directly under lookup card content
    const anchor = document.getElementById("lookupResult") || card;
    anchor.parentElement ? anchor.parentElement.appendChild(wrap) : card.appendChild(wrap);

    const state = { q: "", offset: 0, limit: 50 };

    async function loadUsers() {
      const msg = document.getElementById("adminUsersMsg");
      const tableWrap = document.getElementById("adminUsersTable");
      const pageEl = document.getElementById("adminUsersPage");
      msg.textContent = "Loading…";
      tableWrap.innerHTML = "";

      try {
        const data = await apiFetch(`/api/admin/users?limit=${state.limit}&offset=${state.offset}&q=${encodeURIComponent(state.q || "")}`);
        const users = Array.isArray(data.users) ? data.users : [];
        msg.textContent = users.length ? "" : "No users found.";

        tableWrap.innerHTML = `
        <table class="table" style="min-width:840px;">
          <thead>
            <tr><th>Email</th><th>Created</th><th>Balance</th><th>Admin</th><th style="width:260px;">Actions</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-email="${esc(u.email)}">
                <td>${esc(u.email)}</td>
                <td>${esc(fmtDate(u.created_at))}</td>
                <td><input class="input" type="number" min="0" step="1" value="${Number(u.balance || 0)}" style="width:120px;" /></td>
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

        pageEl.textContent = `Showing ${state.offset + 1}–${state.offset + users.length} (limit ${state.limit})`;

        tableWrap.querySelectorAll("tr[data-email]").forEach(tr => {
          const email = tr.getAttribute("data-email");
          const balInput = tr.querySelector("input");
          const rowMsg = tr.querySelector(".userRowMsg");

          tr.querySelector(".btnUserSave")?.addEventListener("click", async () => {
            const bal = Number(balInput?.value || 0);
            if (!Number.isFinite(bal) || bal < 0) { rowMsg.textContent = "Invalid balance."; return; }
            rowMsg.textContent = "Saving…";
            try {
              await apiFetch("/api/admin/user-update", { method: "PUT", jsonBody: { email, balance: Math.floor(bal) } });
              rowMsg.textContent = "✅ Saved";
            } catch (e) { rowMsg.textContent = "❌ " + (e.message || String(e)); }
          });

          tr.querySelector(".btnUserDelete")?.addEventListener("click", async () => {
            const ok = window.confirm(`Delete account for ${email}?\n\nThis will permanently delete the user and related history.`);
            if (!ok) return;
            rowMsg.textContent = "Deleting…";
            try {
              await apiFetch(`/api/admin/user-delete?email=${encodeURIComponent(email)}`, { method: "DELETE" });
              tr.remove();
            } catch (e) { rowMsg.textContent = "❌ " + (e.message || String(e)); }
          });
        });

        const prevBtn = document.getElementById("btnUsersPrev");
        if (prevBtn) prevBtn.onclick = () => { state.offset = Math.max(state.offset - state.limit, 0); loadUsers(); };
        const nextBtn = document.getElementById("btnUsersNext");
        if (nextBtn) nextBtn.onclick = () => { state.offset = state.offset + state.limit; loadUsers(); };

      } catch (e) {
        msg.textContent = "❌ " + (e.message || String(e));
      }
    }

    const searchBtn = document.getElementById("btnAdminUsersSearch");
    const searchInput = document.getElementById("adminUsersSearch");
    if (searchBtn) searchBtn.onclick = () => { state.q = (searchInput?.value || "").trim(); state.offset = 0; loadUsers(); };
    searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { state.q = (searchInput.value || "").trim(); state.offset = 0; loadUsers(); } });

    loadUsers();
  }


  async function loadAdminBlog() {
    const body = $("blogBody");
    if (!body) return;
    try {
      const data = await apiFetch("/api/admin/blog/posts");
      const posts = data?.posts || [];
      if (!posts.length) {
        body.innerHTML = '<tr><td colspan="4" class="mutedCell">No posts yet.</td></tr>';
        return;
      }
      body.innerHTML = posts.map(p => {
        const created = fmtDate(p.created_at);
        return `<tr>
        <td>${created}</td>
        <td><code>${p.slug}</code></td>
        <td>${p.status || "draft"}</td>
        <td>
          <button class="btnGhost" data-edit="${p.id}" style="padding:6px 10px;">Edit</button>
          <button class="btnGhost" data-del="${p.id}" style="padding:6px 10px;">Delete</button>
        </td>
      </tr>`;
      }).join("");

      // Limit rows to 10 by default
      setTimeout(() => limitTableRows('blogBody', 10), 100);

      body.querySelectorAll("[data-del]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = Number(btn.getAttribute("data-del"));
          if (!confirm("Delete this post?")) return;
          try {
            await apiFetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
            loadAdminBlog();
          } catch (e) {
            alert("Could not delete: " + (e.message || e));
          }
        });
      });

      body.querySelectorAll("[data-edit]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = Number(btn.getAttribute("data-edit"));
          const msg = $("blogMsg");
          if (msg) msg.textContent = "Loading post…";
          try {
            console.log(`Attempting to load blog post ID: ${id}`);
            console.log(`Backend URL: ${BACKEND_BASE_URL}`);
            const data = await apiFetch(`/api/admin/blog/posts/${id}`);
            const p = data.post;
            if (!p) throw new Error("Post not found");

            editingBlogId = id;
            if ($("blogTitle")) $("blogTitle").value = p.title || "";
            if ($("blogSlug")) $("blogSlug").value = p.slug || "";
            if ($("blogExcerpt")) $("blogExcerpt").value = p.excerpt || "";
            if ($("blogCover")) $("blogCover").value = p.cover_url || "";
            if ($("blogVideo")) $("blogVideo").value = p.video_url || "";
            if ($("blogContent")) $("blogContent").value = p.content_html || "";
            if ($("blogPublish")) $("blogPublish").checked = (p.status === "published");

            const btnSave = $("btnBlogSave");
            if (btnSave) btnSave.querySelector(".btnLabel") ? (btnSave.querySelector(".btnLabel").textContent = "Update Post") : (btnSave.textContent = "Update Post");
            if (msg) msg.textContent = `Editing: ${p.slug}`;
            console.log(`Successfully loaded post: ${p.slug}`);
            // Scroll to editor
            document.querySelector("#blogEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (e) {
            console.error(`Failed to load blog post ID ${id}:`, e);
            if (msg) msg.textContent = "❌ Backend Error: " + (e.message || "Endpoint not found. Check lypo-backend repo.");
          }
        });
      });

    } catch (e) {
      body.innerHTML = `<tr><td colspan="4" class="mutedCell">Could not load posts</td></tr>`;
    }
  }

  async function saveBlogPost() {
    const msg = $("blogMsg");
    const title = ($("blogTitle")?.value || "").trim();
    const slug = ($("blogSlug")?.value || "").trim();
    const excerpt = ($("blogExcerpt")?.value || "").trim();
    const cover_url = ($("blogCover")?.value || "").trim();
    const video_url = ($("blogVideo")?.value || "").trim();
    const content_html = ($("blogContent")?.value || "").trim();
    const status = $("blogPublish")?.checked ? "published" : "draft";

    if (!title || !slug || !content_html) { if (msg) msg.textContent = "Title, slug, and content are required."; return; }
    if (msg) msg.textContent = "Saving…";
    try {
      if (editingBlogId) {
        await apiFetch(`/api/admin/blog/posts/${editingBlogId}`, { method: "PUT", jsonBody: { title, slug, excerpt, cover_url, video_url, content_html, status } });
      } else {
        await apiFetch("/api/admin/blog/posts", { method: "POST", jsonBody: { title, slug, excerpt, cover_url, video_url, content_html, status } });
      }
      if (msg) msg.textContent = "✅ Saved";
      editingBlogId = null;
      const btnSave = $("btnBlogSave");
      if (btnSave) btnSave.querySelector(".btnLabel") ? (btnSave.querySelector(".btnLabel").textContent = "Save Post") : (btnSave.textContent = "Save Post");
      loadAdminBlog();
    } catch (e) {
      if (msg) msg.textContent = "❌ " + (e.message || "Error");
    }
  }


  document.addEventListener("DOMContentLoaded", () => {
    $("btnBlogSave")?.addEventListener("click", saveBlogPost);

    $("btnLogoutDash")?.addEventListener("click", () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = "auth.html";
    });

    $("btnAdminAdd")?.addEventListener("click", adminAddCredits);

    load();
  });
})();

