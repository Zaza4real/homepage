const BACKEND_BASE_URL = "https://lypo-backend.onrender.com"; // <-- set this
const POLL_INTERVAL_MS = 1400;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

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

async function checkBackendHealth() {
  if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes("YOUR-BACKEND")) {
    setBackendChip("Backend: set URL in script.js");
    log("Set BACKEND_BASE_URL first.");
    return false;
  }
  setBackendChip("Backend: checking…");
  try {
    const data = await fetchJson(`${BACKEND_BASE_URL}/health`);
    if (data?.ok) {
      setBackendChip("Backend: online ✓");
      return true;
    }
    setBackendChip("Backend: responded (check logs)");
    return true;
  } catch (e) {
    setBackendChip("Backend: offline / wrong URL");
    log(`Health check failed: ${e.message}`);
    return false;
  }
}

async function loadLanguages() {
  const select = $("targetLang");
  if (!select) return;

  select.innerHTML = `<option>Loading…</option>`;

  try {
    const data = await fetchJson(`${BACKEND_BASE_URL}/api/languages`);
    const langs = data?.languages || [];
    select.innerHTML = "";

    for (const name of langs) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }

    // default
    if (langs.includes("Spanish")) select.value = "Spanish";
  } catch (e) {
    select.innerHTML = `<option>Spanish</option><option>French</option><option>German</option>`;
    log(`Could not load languages from backend, using fallback list. Error: ${e.message}`);
  }
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
  try {
    const ok = await checkBackendHealth();
    if (!ok) {
      setStatus("Backend not reachable ⚠️");
      return;
    }

    const fileInput = $("videoFile");
    const langSelect = $("targetLang");
    const file = fileInput?.files?.[0];
    const targetLanguage = langSelect?.value;

    if (!file) {
      setStatus("Choose a video file ⚠️");
      return;
    }
    if (!targetLanguage) {
      setStatus("Choose a target language ⚠️");
      return;
    }

    setStatus("Uploading…");
    log(`Uploading file: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`);
    log(`Target language: ${targetLanguage}`);

    const form = new FormData();
    form.append("video", file);
    form.append("output_language", targetLanguage);

    const start = await fetchJson(`${BACKEND_BASE_URL}/api/dub-upload`, {
      method: "POST",
      body: form
    });

    log("Start response:");
    log(JSON.stringify(start, null, 2));

    const jobId = start?.id;
    if (!jobId) {
      setStatus("Started ✅ (no job id)");
      return;
    }

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
    log("Final:");
    log(JSON.stringify(final, null, 2));

    if (final?.outputUrl) {
      log(`Output URL: ${final.outputUrl}`);
      log("Open it in a new tab to download.");
      window.open(final.outputUrl, "_blank");
    }
  } catch (e) {
    setStatus("Error ⚠️");
    log(`Error: ${e.message}`);
  }
}

(function init() {
  if ($("year")) $("year").textContent = String(new Date().getFullYear());

  $("btnHealth")?.addEventListener("click", async () => {
    const ok = await checkBackendHealth();
    if (ok) await loadLanguages();
  });

  $("btnRun")?.addEventListener("click", runUploadDub);

  // initial
  checkBackendHealth().then((ok) => ok && loadLanguages());
})();
