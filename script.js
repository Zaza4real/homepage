/**
 * YouDub Frontend Controller (script.js)
 * Works with a simple Render backend that exposes:
 *   GET  /health                       -> { ok: true }
 *   POST /api/dub                      -> starts a job
 *   GET  /api/dub/:id                  -> job status (optional but recommended)
 *
 * ✅ This script will work even if you only have POST /api/dub (it will display the response).
 * ⭐ If you add GET /api/dub/:id to your backend, it will auto-poll until done.
 */

/* =========================
   CONFIG
========================= */

// Put your Render Web Service URL here (no trailing slash)
const BACKEND_BASE_URL = "https://YOUR-BACKEND.onrender.com";

// Your contact email (used by “Copy Email” buttons)
const EMAIL = "hello@youdub.ai";

// Polling (only used if your backend supports GET /api/dub/:id)
const POLL_INTERVAL_MS = 1400;
const POLL_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes

/* =========================
   HELPERS
========================= */
const $ = (id) => document.getElementById(id);

function safeSetText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function log(line) {
  const consoleEl = $("console");
  if (!consoleEl) return;

  const prefix = `[${nowTime()}] `;
  consoleEl.textContent = `${prefix}${line}\n\n` + consoleEl.textContent;
}

function setStatus(text) {
  safeSetText("statusText", text);
}

function setBackendChip(text) {
  safeSetText("chipBackend", text);
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
    const message = body?.error || body?.message || res.statusText || "Request failed";
    throw new Error(`${res.status} ${message}`);
  }

  return isJson ? res.json() : res.text();
}

function withTimeout(promise, ms, label = "Operation") {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

/* =========================
   UI INIT
========================= */
(function init() {
  // Year in footer (if present)
  if ($("year")) $("year").textContent = String(new Date().getFullYear());

  // Email link (if present)
  if ($("emailLink")) {
    $("emailLink").textContent = EMAIL;
    $("emailLink").href = `mailto:${EMAIL}`;
  }

  // Wire copy email buttons (both the big hero one and the small contact one)
  if ($("btnCopyEmail")) $("btnCopyEmail").addEventListener("click", copyEmail);
  if ($("copySmall")) $("copySmall").addEventListener("click", copyEmail);

  // Wire “Run AI Demo” buttons (hero + card mini button)
  if ($("btnRunAi")) $("btnRunAi").addEventListener("click", runDubFlow);
  if ($("miniRunAi")) $("miniRunAi").addEventListener("click", runDubFlow);

  // Optional: improve “magnetic” button (if class exists)
  const magBtn = document.querySelector(".btnMag");
  if (magBtn) {
    magBtn.addEventListener("mousemove", (e) => {
      const r = magBtn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / 18;
      const dy = (e.clientY - (r.top + r.height / 2)) / 18;
      magBtn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    magBtn.addEventListener("mouseleave", () => (magBtn.style.transform = ""));
  }

  // Quick keyboard shortcut
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setStatus("Tip: Run AI Demo or Copy Email ✨");
      log("Pressed Ctrl/Cmd+K.");
    }
  });

  // Check backend health on load (non-blocking)
  checkBackendHealth().catch(() => {});
})();

/* =========================
   ACTIONS
========================= */

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    setStatus("Email copied ✅");
    log(`Copied email to clipboard: ${EMAIL}`);
  } catch {
    setStatus("Copy failed (browser blocked) ⚠️");
    log("Clipboard copy failed. You can still click the mailto link.");
  }
}

async function checkBackendHealth() {
  if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes("YOUR-BACKEND")) {
    setBackendChip("Backend: set URL in script.js");
    log("Backend not configured: set BACKEND_BASE_URL in script.js");
    return;
  }

  setBackendChip("Backend: checking…");
  try {
    const data = await withTimeout(fetchJson(`${BACKEND_BASE_URL}/health`), 7000, "Health check");
    if (data?.ok) {
      setBackendChip("Backend: online ✓");
      log("Backend health check OK.");
    } else {
      setBackendChip("Backend: responded (check logs)");
      log(`Backend health response: ${prettyJson(data)}`);
    }
  } catch (err) {
    setBackendChip("Backend: offline / wrong URL");
    log(`Backend health check failed: ${err.message}`);
  }
}

/**
 * Main “Run AI Demo” flow.
 * This uses a beginner-friendly input method:
 *  - ask for a video URL
 *  - ask for a target language (e.g. "es", "fr", "de")
 * Then it POSTs to your backend.
 */
async function runDubFlow() {
  try {
    // Basic guard
    if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes("YOUR-BACKEND")) {
      setStatus("Set BACKEND_BASE_URL first ⚠️");
      log("You need to set BACKEND_BASE_URL in script.js to your Render Web Service URL.");
      return;
    }

    setStatus("Preparing…");

    // Ask user for inputs (simple + works everywhere)
    const videoUrl = prompt("Paste a public video URL (mp4 or similar):", "https://example.com/video.mp4");
    if (!videoUrl) {
      setStatus("Cancelled.");
      log("User cancelled: no video URL provided.");
      return;
    }

    const targetLanguage = prompt("Target language code (e.g. es, fr, de, ja):", "es");
    if (!targetLanguage) {
      setStatus("Cancelled.");
      log("User cancelled: no target language provided.");
      return;
    }

    // Optional settings (simple defaults)
    const keepVoice = true; // your product promise
    const lipsync = true;   // your product promise

    setStatus("Starting dub…");
    log("Starting dub request…");
    log(`Input videoUrl: ${videoUrl}`);
    log(`Target language: ${targetLanguage}`);

    const startPayload = {
      videoUrl,
      targetLanguage,
      keepVoice,
      lipsync
    };

    const startResponse = await withTimeout(
      fetchJson(`${BACKEND_BASE_URL}/api/dub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(startPayload)
      }),
      30000,
      "Start dub"
    );

    // Show immediate response
    setStatus("Job started ✅");
    log("Backend response:");
    log(prettyJson(startResponse));

    // If backend returns an id, we can poll /api/dub/:id
    const jobId = startResponse?.id || startResponse?.jobId || startResponse?.predictionId;
    const statusUrl = startResponse?.statusUrl; // optional

    if (jobId) {
      setStatus("Processing… (polling)");
      log(`Polling job status: ${jobId}`);
      await pollUntilDone(jobId);
      return;
    }

    // If backend returns a statusUrl, we can poll that
    if (statusUrl) {
      setStatus("Processing… (polling statusUrl)");
      log(`Polling statusUrl: ${statusUrl}`);
      await pollStatusUrl(statusUrl);
      return;
    }

    // Otherwise we’re done (your backend might be synchronous)
    setStatus("Done (no polling) ✅");
    log("No job id/statusUrl returned. If you want progress + final output, add GET /api/dub/:id to backend.");
  } catch (err) {
    setStatus("Error ⚠️");
    log(`Error: ${err.message}`);
  }
}

/**
 * Polls GET /api/dub/:id until it returns a terminal status.
 * Expected backend response shape (recommended):
 *   { status: "queued"|"processing"|"succeeded"|"failed", outputUrl?: "...", error?: "..." }
 */
async function pollUntilDone(jobId) {
  const start = Date.now();

  while (true) {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      setStatus("Timed out ⚠️");
      log("Polling timed out. Try again or check backend logs.");
      return;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let data;
    try {
      data = await fetchJson(`${BACKEND_BASE_URL}/api/dub/${encodeURIComponent(jobId)}`);
    } catch (err) {
      log(`Polling error (will retry): ${err.message}`);
      continue;
    }

    const status = (data?.status || "").toLowerCase();
    log(`Status: ${status || "(unknown)"}`);

    // Update UI status text
    if (status) setStatus(`Status: ${status}`);

    // Terminal states
    if (["succeeded", "success", "completed", "done"].includes(status)) {
      setStatus("Done ✅");
      log("Job completed.");

      if (data?.outputUrl) {
        log(`Output URL: ${data.outputUrl}`);
        // If your UI has a link element, you can set it here
        // Example: $("downloadLink").href = data.outputUrl;
        // Example: $("downloadLink").textContent = "Download result";
      } else {
        log("No outputUrl provided by backend. Consider returning outputUrl when done.");
      }
      return;
    }

    if (["failed", "error", "canceled", "cancelled"].includes(status)) {
      setStatus("Failed ⚠️");
      log(`Job failed: ${data?.error || "Unknown error"}`);
      return;
    }
  }
}

/**
 * Polls a fully-qualified status URL (if your backend returns one).
 * This is generic and expects the same {status, outputUrl} contract.
 */
async function pollStatusUrl(statusUrl) {
  const start = Date.now();

  while (true) {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      setStatus("Timed out ⚠️");
      log("Polling statusUrl timed out. Try again or check backend logs.");
      return;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let data;
    try {
      data = await fetchJson(statusUrl);
    } catch (err) {
      log(`Polling statusUrl error (will retry): ${err.message}`);
      continue;
    }

    const status = (data?.status || "").toLowerCase();
    log(`Status: ${status || "(unknown)"}`);
    if (status) setStatus(`Status: ${status}`);

    if (["succeeded", "success", "completed", "done"].includes(status)) {
      setStatus("Done ✅");
      if (data?.outputUrl) log(`Output URL: ${data.outputUrl}`);
      return;
    }

    if (["failed", "error", "canceled", "cancelled"].includes(status)) {
      setStatus("Failed ⚠️");
      log(`Job failed: ${data?.error || "Unknown error"}`);
      return;
    }
  }
}
