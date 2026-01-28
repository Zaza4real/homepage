// Account dashboard
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
    let res;
    try {
      res = await fetch(`${BACKEND_BASE_URL}${path}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (netErr) {
      throw new Error(`Failed to fetch (${path}). Backend may be offline.`);
    }
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
      const invoice = p.invoice_url ? `<a href="${p.invoice_url}" target="_blank" rel="noreferrer">${String(p.invoice_url).toLowerCase().includes('.pdf') ? 'Download' : 'Open'}</a>` : "—";
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

  async function load(){
    try{
      // If redirected back from Stripe, confirm the session to record the payment + invoice/receipt link
      const qs = new URLSearchParams(location.search);
      if (qs.get("paid") === "1" && qs.get("session_id")) {
        try {
          setMsg("Confirming your payment…");
          await apiFetch(`/api/stripe/confirm?session_id=${encodeURIComponent(qs.get("session_id"))}`);
          // Clean URL
          qs.delete("session_id"); qs.delete("paid");
          history.replaceState({}, "", `${location.pathname}${qs.toString() ? "?" + qs.toString() : ""}`);
        } catch (e) {
          setMsg(`Payment confirm error: ${e.message || e}`);
        }
      }

      const me = await apiFetch("/api/auth/me");
      $("dashEmail").textContent = `Email: ${me.user.email}`;
      const credits = await apiFetch("/api/credits");
      $("dashBalance").textContent = `Balance: ${credits.balance} credits`;

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
  });
})();
// Admin add credits handler
document.getElementById("btnAdminAdd")?.addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const amount = Number(document.getElementById("adminAmount").value);
  const reason = document.getElementById("adminReason").value.trim();
  const msg = document.getElementById("adminMsg");

  if (!email || !amount) {
    msg.textContent = "Enter email and credit amount.";
    return;
  }

  try {
    const res = await fetch("https://lypo-backend.onrender.com/api/admin/add-credits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("lypo_token_v1")}`
      },
      body: JSON.stringify({ email, amount, reason })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");

    msg.textContent = `✅ ${data.user.email} now has ${data.user.balance} credits`;
  } catch (e) {
    msg.textContent = "❌ " + e.message;
  }
});

