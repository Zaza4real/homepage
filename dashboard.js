// Account dashboard
const token = localStorage.getItem("lypo_token_v1");
if (!token) {
  window.location.href = "auth.html";
}

(() => {
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  const $ = (id) => document.getElementById(id);

  function setMsg(msg){ const el=$("dashMsg"); if(el) el.textContent = msg || ""; }
  function fmtDate(iso){
    try{ return new Date(iso).toLocaleString(); } catch { return iso || ""; }
  }

  async function apiFetch(path) {
    if (!token) throw new Error("Please login first.");
    const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null);
    if (!res.ok) throw new Error(data?.error || (typeof data==="string" ? data : `Request failed (${res.status})`));
    return data;
  }

  function renderPayments(items){
    const body = $("paymentsBody");
    if (!body) return;
    if (!items?.length){
      body.innerHTML = '<tr><td colspan="5" class="mutedCell">No payments yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((p) => {
      const invoice = p.invoice_url ? `<a href="${p.invoice_url}" target="_blank" rel="noreferrer">Open</a>` : "—";
      return `<tr>
        <td>${fmtDate(p.created_at)}</td>
        <td>$${Number(p.amount_usd||0).toFixed(2)}</td>
        <td>${p.lypos||0}</td>
        <td>${p.status||"—"}</td>
        <td>${invoice}</td>
      </tr>`;
    }).join("");
  }

  function renderVideos(items){
    const body = $("videosBody");
    if (!body) return;
    if (!items?.length){
      body.innerHTML = '<tr><td colspan="4" class="mutedCell">No videos yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((v) => {
      const out = v.output_url ? `<a href="${v.output_url}" target="_blank" rel="noreferrer">Download</a>` : "—";
      const pred = v.prediction_id ? `<code>${v.prediction_id}</code>` : "—";
      return `<tr>
        <td>${fmtDate(v.created_at)}</td>
        <td>${v.status||"—"}</td>
        <td>${pred}</td>
        <td>${out}</td>
      </tr>`;
    }).join("");
  }

  
  async function loadAdmin() {
    try {
      const st = await apiFetch("/api/admin/status");
      const card = $("adminCard");
      if (card) card.style.display = st.isAdmin ? "block" : "none";
      if (st.isAdmin) {
        $("btnAdminAdd")?.addEventListener("click", async () => {
          const email = $("adminEmail")?.value?.trim();
          const amount = Number($("adminAmount")?.value || 0);
          const reason = $("adminReason")?.value?.trim() || "";
          const msgEl = $("adminMsg");
          if (msgEl) msgEl.textContent = "";
          if (!email) { if (msgEl) msgEl.textContent = "Enter a user email."; return; }
          if (!Number.isFinite(amount) || amount === 0) { if (msgEl) msgEl.textContent = "Enter a non-zero credit amount."; return; }

          try {
            const res = await fetch(`${BACKEND_BASE_URL}/api/admin/add-credits`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ email, amount, reason })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
            if (msgEl) msgEl.textContent = `✅ Updated ${data.user.email}: new balance ${data.user.balance} credits`;
          } catch (e) {
            if (msgEl) msgEl.textContent = `❌ ${e.message || e}`;
          }
        });
      }
    } catch {
      // ignore
    }
  }

async function load(){
    try{
      const me = await apiFetch("/api/auth/me");
      $("dashEmail").textContent = `Email: ${me.user.email}`;
      const credits = await apiFetch("/api/credits");
      $("dashBalance").textContent = `Balance: ${credits.balance} LYPOS`;

      const payments = await apiFetch("/api/account/payments");
      renderPayments(payments.payments);

      const vids = await apiFetch("/api/account/videos");
      renderVideos(vids.videos);

      setMsg("");
    } catch (e){
      setMsg(e.message || String(e));
      // kick to auth if not logged in
      if (!token) window.location.href = "auth.html";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("btnLogoutDash")?.addEventListener("click", () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = "auth.html";
    });
    load();
    loadAdmin();
  });
})();
