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

  function fmtDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
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

    const pick = (o, ...keys) => {
      for (const k of keys) {
        if (o && o[k] != null && o[k] !== "") return o[k];
      }
      return null;
    };

    const isProbablyUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

    body.innerHTML = items.map((p) => {
      const created = pick(p, "createdAt", "created_at");
      const amountRaw = pick(p, "amountUsd", "amount_usd");
      const credits = pick(p, "credits", "lypos", "lypo", "LYPOS") ?? 0;
      const status = pick(p, "status") || "—";

      // Stripe links can be invoice PDFs, hosted invoice pages, or charge receipt URLs.
      const docUrl = pick(p, "invoiceUrl", "invoice_url", "receiptUrl", "receipt_url", "invoice_pdf", "hosted_invoice_url");
      let invoice = "—";
      if (isProbablyUrl(docUrl)) {
        const isPdf = String(docUrl).toLowerCase().includes(".pdf");
        invoice = `<a href="${docUrl}" target="_blank" rel="noreferrer">${isPdf ? "Download" : "Open"}</a>`;
      }

      const amount = (amountRaw != null) ? `$${Number(amountRaw || 0).toFixed(2)}` : "—";

      return `<tr>
        <td>${fmtDate(created)}</td>
        <td>${amount}</td>
        <td>${credits}</td>
        <td>${status}</td>
        <td>${invoice}</td>
      </tr>`;
    }).join("");
  })();
