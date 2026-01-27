/* ========= CONFIG ========= */
const BACKEND_BASE_URL = "https://YOUR-BACKEND.onrender.com"; // <-- set this
const POLL_INTERVAL_MS = 1400;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

/* ========= HELPERS ========= */
const $ = (id) => document.getElementById(id);

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function log(line) {
  const consoleEl = $("console");
  if (!consoleEl) return;
  consoleEl.textContent = `[${nowTime()}] ${line}\n\n` + consoleEl.textContent;
}

function setStatus(text) {
  const el = $("statusText");
  if (el) el.textContent = text;
}

function setBackendChip(text) {
  const el = $("chipBackend");
  if (el) el.textContent = text;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
    const msg = body?.error || body?.message || res.statusText || "Request failed";
    throw new Error(`${res.status} ${msg}`);
  }
  return isJson ? res.json() : res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ========= TABS ========= */
function activateTab(tabName) {
  document.querySelectorAll(".tabBtn").forEach((b) => {
    const is = b.dataset.tab === tabName;
    b.classList.toggle("isActive", is);
    b.setAttribute("aria-selected", is ? "true" : "false");
  });

  document.querySelectorAll(".tabPanel").forEach((p) => {
    p.classList.toggle("isActive", p.id === `tab-${tabName}`);
  });

  // tiny UX: ensure top of content visible when switching
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initTabs() {
  document.querySelectorAll(".tabBtn").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // clicking logo goes home
  document.querySelectorAll("[data-go='home']").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab("home");
    });
  });

  // CTA buttons route to tabs
  document.querySelectorAll("[data-go]").forEach((el) => {
    const go = el.getAttribute("data-go");
    if (!go) return;
    el.addEventListener("click", (e) => {
      // allow logo handler above
      if (go === "home") return;
      e.preventDefault();
      activateTab(go);
    });
  });
}

/* ========= BACKEND ========= */
async function checkBackendHealth() {
  if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes("YOUR-BACKEND")) {
    setBackendChip("Backend: set URL in script.js");
    log("Backend not configured. Set BACKEND_BASE_URL to your Render Web Service URL.");
    return false;
  }

  setBackendChip("Backend: checking…");
  try {
    const data = await fetchJson(`${BACKEND_BASE_URL}/health`);
    if (data?.ok) {
      setBackendChip("Backend: online ✓");
      log("Backend health OK.");
      return true;
    }
    setBackendChip("Backend: responded (check logs)");
    log(`Backend health response: ${JSON.stringify(data)}`);
    return true;
  } catch (err) {
    setBackendChip("Backend: offline / wrong URL");
    log(`Health check failed: ${err.message}`);
    return false;
  }
}

async function startDub({ videoUrl, targetLanguage }) {
  const payload = {
    videoUrl,
    targetLanguage,
    keepVoice: true,
    lipsync: true
  };

  const start = await fetchJson(`${BACKEND_BASE_URL}/api/dub`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  log("Start response:");
  log(JSON.stringify(start, null, 2));

  const jobId = start?.id || start?.jobId || start?.predictionId;
  const statusUrl = start?.statusUrl;

  return { start, jobId, statusUrl };
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
    } catch (err) {
      log(`Polling error (retrying): ${err.message}`);
      continue;
    }

    const status = (data?.status || "").toLowerCase();
    setStatus(status ? `Status: ${status}` : "Status: …");
    log(`Status: ${status || "(unknown)"}`);

    if (["succeeded","success","completed","done"].includes(status)) return data;
    if (["failed","error","canceled","cancelled"].includes(status)) return data;
  }
}

/* ========= UI ========= */
async function runDemo() {
  try {
    activateTab("home");

    const ok = await checkBackendHealth();
    if (!ok) {
      setStatus("Backend not reachable ⚠️");
      return;
    }

    const videoUrl = $("videoUrl")?.value?.trim();
    const targetLanguage = $("targetLang")?.value?.trim();

    if (!videoUrl) {
      setStatus("Paste a video URL ⚠️");
      log("Missing videoUrl.");
      return;
    }
    if (!targetLanguage) {
      setStatus("Enter a target language ⚠️");
      log("Missing targetLanguage.");
      return;
    }

    setStatus("Starting…");
    log(`videoUrl: ${videoUrl}`);
    log(`targetLanguage: ${targetLanguage}`);

    const { jobId, statusUrl } = await startDub({ videoUrl, targetLanguage });

    if (jobId) {
      setStatus("Processing…");
      const final = await pollJob(jobId);
      if (!final) return;

      const finalStatus = (final?.status || "").toLowerCase();
      if (["failed","error","canceled","cancelled"].includes(finalStatus)) {
        setStatus("Failed ⚠️");
        log(`Job failed: ${final?.error || "Unknown error"}`);
        return;
      }

      setStatus("Done ✅");
      log("Final result:");
      log(JSON.stringify(final, null, 2));

      if (final?.outputUrl) {
        log(`Output URL: ${final.outputUrl}`);
      } else {
        log("No outputUrl returned. Consider returning outputUrl in backend when done.");
      }
      return;
    }

    if (statusUrl) {
      setStatus("Started ✅ (no job id)");
      log(`Backend returned statusUrl: ${statusUrl}`);
      return;
    }

    setStatus("Started ✅");
    log("No job id returned. Add GET /api/dub/:id for progress polling.");
  } catch (err) {
    setStatus("Error ⚠️");
    log(`Error: ${err.message}`);
  }
}

/* Magnetic CTA animation (only for the .ctaMag button) */
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

/* ========= INIT ========= */
(function init() {
  const year = $("year");
  if (year) year.textContent = String(new Date().getFullYear());

  initTabs();
  initMagneticCta();

  $("btnRun")?.addEventListener("click", runDemo);
  $("btnHealth")?.addEventListener("click", checkBackendHealth);

  // Optional: auto-check once (quiet)
  checkBackendHealth().catch(() => {});
})();
