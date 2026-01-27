// Prevent double-init (fixes “double buttons / double handlers” symptoms)
if (window.__LYPO_INIT__) {
  console.warn("LYPO already initialized (script.js loaded twice?)");
} else {
  window.__LYPO_INIT__ = true;

  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com"; // <-- set this
  const POLL_INTERVAL_MS = 1400;
  const POLL_TIMEOUT_MS = 8 * 60 * 1000;
  const PRICE_PER_30S_EUR = 2.89;

  const $ = (id) => document.getElementById(id);

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function log(line) {
    // Console removed from UI; keep this as a no-op unless a #console element exists.
    const consoleEl = $("console");
    if (!consoleEl) return;
    consoleEl.textContent = `[${nowTime()}] ${line}\n\n` + consoleEl.textContent;
  }

  function setStatus(text) {
    const el = $("statusText");
    if (el) el.textContent = text;

    const p = $("previewText");
    if (p) p.textContent = text;
  }

  function setBackendChip(text) {
    const el = $("chipBackend");
    if (el) el.textContent = text;
  }

  function euro(n) {
    // Use comma decimals to match €2,89 in the UI.
    const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
    return fixed.replace(".", ",");
  }

  function setLoading(isLoading, text) {
    const pill = $("statusPill");
    const progress = $("progressWrap");
    const run = $("btnRun");
    const pay = $("btnPay");

    if (pill) pill.classList.toggle("isLoading", !!isLoading);
    if (progress) progress.hidden = !isLoading;
    if (run) run.classList.toggle("isLoading", !!isLoading);
    if (pay) pay.classList.toggle("isLoading", !!isLoading);
    if (typeof text === "string") setStatus(text);
  }

  function resetDownload() {
    const btn = $("btnDownload");
    if (!btn) return;
    btn.hidden = true;
    btn.classList.remove("isReady");
    btn.setAttribute("aria-disabled", "true");
    btn.setAttribute("tabindex", "-1");
    btn.dataset.url = "";
  }

  function setDownload(url) {
    const btn = $("btnDownload");
    const video = $("outputVideo");
    if (!btn) return;

    if (!url) {
      resetDownload();
      if (video) {
        video.hidden = true;
        video.removeAttribute("src");
        video.load?.();
      }
      return;
    }

    btn.hidden = false;
    btn.dataset.url = url;
    btn.classList.add("isReady");
    btn.setAttribute("aria-disabled", "false");
    btn.removeAttribute("tabindex");

    // Show preview (no autoplay, no popups)
    if (video) {
      video.hidden = false;
      video.src = url;
      video.load?.();
    }

    // Auto-trigger download once (best effort). If browser blocks it, button stays highlighted.
    setTimeout(() => {
      try { btn.click(); } catch (_) {}
    }, 150);
  }

    a.hidden = false;
    a.href = url;
    a.classList.add("isReady");
    a.setAttribute("aria-disabled", "false");
    a.removeAttribute("tabindex");

    // Try to start the download automatically (some browsers require a user gesture).
    // The button remains highlighted so the user can click once if blocked.
    setTimeout(() => {
      try { a.click(); } catch (_) {}
    }, 150);
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (!res.ok) {
      const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
      throw new Error(body?.error || body?.message || res.statusText || "Request failed");
    }
    return isJson ? res.json() : res.text();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  

  async function downloadViaBlob(url, filename = "lypo-output.mp4") {
    // Best-effort: force download even if the MP4 would normally stream/play.
    // Requires CORS permission on the outputUrl.
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }

  function guessMp4Name() {
    const original = $("videoFile")?.files?.[0]?.name || "video";
    const base = original.replace(/\.[^.]+$/, "");
    return `${base}-translated.mp4`;
  }
// ---- Tabs ----
  function activateTab(tabName) {
    document.querySelectorAll(".tabBtn").forEach((b) => {
      const is = b.dataset.tab === tabName;
      b.classList.toggle("isActive", is);
      b.setAttribute("aria-selected", is ? "true" : "false");
    });

    document.querySelectorAll(".tabPanel").forEach((p) => {
      p.classList.toggle("isActive", p.id === `tab-${tabName}`);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function initTabs() {
    document.querySelectorAll(".tabBtn").forEach((btn) => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    document.querySelectorAll("[data-go]").forEach((el) => {
      const go = el.getAttribute("data-go");
      if (!go) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        activateTab(go);
      });
    });
  }

  // Magnetic animation (only for the .ctaMag button)
  function initMagneticCta() {
    const magBtn = document.querySelector(".ctaMag");
    if (!magBtn) return;

    magBtn.addEventListener("mousemove", (e) => {
      const r = magBtn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / 16;
      const dy = (e.clientY - (r.top + r.height / 2)) / 16;
      magBtn.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    magBtn.addEventListener("mouseleave", () => {
      magBtn.style.transform = "";
    });
  }

  // ---- Backend ----
  async function checkBackendHealth() {
    if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes("YOUR-BACKEND")) {
      setBackendChip("Backend: set URL in script.js");
      log("Set BACKEND_BASE_URL in script.js to your Render backend URL.");
      return false;
    }

    setBackendChip("Backend: checking…");
    try {
      const data = await fetchJson(`${BACKEND_BASE_URL}/health`);
      if (data?.ok) {
        setBackendChip("Backend: online ✓");
        return true;
      }
      setBackendChip("Backend: responded");
      return true;
    } catch (e) {
      setBackendChip("Backend: offline / wrong URL");
      log(`Health check failed: ${e.message}`);
      return false;
    }
  }

  async function loadLanguages() {
    const sel = $("targetLang");
    if (!sel) return;

    sel.innerHTML = `<option>Loading…</option>`;
    try {
      const data = await fetchJson(`${BACKEND_BASE_URL}/api/languages`);
      const langs = data?.languages || [];
      sel.innerHTML = "";
      for (const name of langs) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      }
      if (langs.includes("Spanish")) sel.value = "Spanish";
    } catch (e) {
      // fallback minimal list
      sel.innerHTML = "";
      ["Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean"].forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l;
        opt.textContent = l;
        sel.appendChild(opt);
      });
      log(`Could not load languages from backend, using fallback. Error: ${e.message}`);
    }
  }

  // ---- Upload UI (button + drag & drop) + price estimate ----
  let lastEstimatedCost = null;
  let lastDurationSec = null;

  function updateCostUI() {
    const el = $("costEstimate");
    const pay = $("btnPay");

    if (!el) return;

    if (!lastDurationSec || !Number.isFinite(lastDurationSec) || lastDurationSec <= 0) {
      el.textContent = "";
      if (pay) pay.querySelector(".btnLabel")?.replaceChildren(document.createTextNode("Pay"));
      return;
    }

    const mins = Math.round((lastDurationSec / 60) * 10) / 10;
    el.textContent = `Est. length: ${mins} min • Est. cost: €${euro(lastEstimatedCost)}`;
    if (pay) pay.querySelector(".btnLabel")?.replaceChildren(document.createTextNode(`Pay €${euro(lastEstimatedCost)}`));
  }

  async function computeDurationSeconds(file) {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Could not read video metadata"));
      });
      const d = Number(video.duration);
      URL.revokeObjectURL(url);
      return Number.isFinite(d) ? d : null;
    } catch {
      return null;
    }
  }

  async function handleSelectedFile(file) {
    const nameEl = $("videoName");
    if (nameEl) nameEl.textContent = file ? file.name : "or drop it here";

    resetDownload();

    lastDurationSec = file ? await computeDurationSeconds(file) : null;
    if (lastDurationSec && Number.isFinite(lastDurationSec)) {
      lastEstimatedCost = (lastDurationSec / 30) * PRICE_PER_30S_EUR;
    } else {
      lastEstimatedCost = null;
    }
    updateCostUI();
  }

  function initUploadUI() {
    const input = $("videoFile");
    const btn = $("btnPickVideo");
    if (!input || !btn) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) handleSelectedFile(file);
    });

    // Drag & drop
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ["dragenter", "dragover"].forEach((evt) => {
      btn.addEventListener(evt, (e) => {
        prevent(e);
        btn.classList.add("dragOver");
      });
    });
    ["dragleave", "drop"].forEach((evt) => {
      btn.addEventListener(evt, (e) => {
        prevent(e);
        btn.classList.remove("dragOver");
      });
    });
    btn.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      // Some browsers require a DataTransfer to programmatically set input.files
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch {
        // If it fails, we still handle the file for UI/estimate.
      }
      handleSelectedFile(file);
    });
  }

  async function pollJob(jobId) {
    const t0 = Date.now();
    while (true) {
      if (Date.now() - t0 > POLL_TIMEOUT_MS) {
        setStatus("Timed out ⚠️");
        log("Polling timed out.");
        return null;
      }

      await sleep(POLL_INTERVAL_MS);

      let data;
      try {
        data = await fetchJson(`${BACKEND_BASE_URL}/api/dub/${encodeURIComponent(jobId)}`);
      } catch (e) {
        log(`Polling error (retrying): ${e.message}`);
        continue;
      }

      const status = (data?.status || "").toLowerCase();
      setStatus(status ? `Status: ${status}` : "Status: …");
      log(`Status: ${status || "(unknown)"}`);

      if (["succeeded","success","completed","done"].includes(status)) return data;
      if (["failed","error","canceled","cancelled"].includes(status)) return data;
    }
  }

  async function runUploadDub() {
    const runBtn = $("btnRun");
    const payBtn = $("btnPay");

    try {
      resetDownload();
      if (runBtn) runBtn.disabled = true;
      if (payBtn) payBtn.disabled = true;

      const ok = await checkBackendHealth();
      if (!ok) {
        setStatus("Backend not reachable ⚠️");
        return;
      }

      const file = $("videoFile")?.files?.[0];
      const lang = $("targetLang")?.value;

      if (!file) {
        setStatus("Choose a video file ⚠️");
        return;
      }
      if (!lang) {
        setStatus("Choose a target language ⚠️");
        return;
      }

      const outV = $("outputVideo");
      if (outV) { outV.hidden = true; outV.removeAttribute("src"); outV.load?.(); }
      const hint = $("previewHint");
      if (hint) hint.textContent = "Generated video will appear here";
      setLoading(true, "Uploading…");
      log(`Uploading: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`);
      log(`Language: ${lang}`);

      const form = new FormData();
      form.append("video", file);
      form.append("output_language", lang);

      const start = await fetchJson(`${BACKEND_BASE_URL}/api/dub-upload`, {
        method: "POST",
        body: form
      });

      const jobId = start?.id;
      if (!jobId) {
        setLoading(false, "Started ✅ (no job id)");
        return;
      }

      setLoading(true, "Processing…");
      const final = await pollJob(jobId);
      if (!final) return;

      const finalStatus = (final?.status || "").toLowerCase();
      if (["failed","error","canceled","cancelled"].includes(finalStatus)) {
        setLoading(false, "Failed ⚠️");
        log(`Job failed: ${final?.error || "Unknown error"}`);
        return;
      }

      setLoading(false, "Done ✅");

      if (final?.outputUrl) {
        setStatus("Ready ✅");
        setDownload(final.outputUrl);
        const hint = $("previewHint");
        if (hint) hint.textContent = "Preview ready (no autoplay). Download starts automatically.";

      } else {
        log("No outputUrl returned. Ensure backend returns outputUrl on success.");
      }
    } catch (e) {
      setLoading(false, "Error ⚠️");
      log(`Error: ${e.message}`);
    } finally {
      if (runBtn) runBtn.disabled = false;
      if (payBtn) payBtn.disabled = false;
    }
  }

  // ---- Init ----
  (function init() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    initTabs();
    initMagneticCta();
    initUploadUI();

    // Payment button placeholder (wire this to Stripe/checkout later)
    $("btnPay")?.addEventListener("click", () => {
      // For now, just take the user to pricing so you have a clean flow
      activateTab("pricing");
      setStatus("Checkout coming soon — wire this to your payment system.");
    });

    $("btnRun")?.addEventListener("click", runUploadDub);

    $("btnDownload")?.addEventListener("click", async () => {
      const btn = $("btnDownload");
      const url = btn?.dataset?.url;
      if (!url || btn?.getAttribute("aria-disabled") === "true") return;
      try {
        setStatus("Downloading…");
        await downloadViaBlob(url, guessMp4Name());
        setStatus("Downloaded ✅");
      } catch (e) {
        // If CORS blocks blob download, we can only open the URL.
        // Keep the button highlighted and tell the user what to change server-side.
        setStatus("Download blocked by server (CORS) ⚠️");
        log(`Download blocked (CORS). Ask backend to enable CORS on outputUrl or proxy it. ${e?.message || ""}`);
      }
    });

    // initial
    checkBackendHealth().then((ok) => ok && loadLanguages());
    updateCostUI();
  })();
}
