// Prevent double-init (fixes “double buttons / double handlers” symptoms)
if (window.__LYPO_INIT__) {
  console.warn("LYPO already initialized (script.js loaded twice?)");
} else {
  window.__LYPO_INIT__ = true;

  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com"; // <-- set this
  const POLL_INTERVAL_MS = 1400;
  const POLL_TIMEOUT_MS = 8 * 60 * 1000;

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

      setStatus("Uploading…");
      log(`Uploading: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`);
      log(`Language: ${lang}`);

      const form = new FormData();
      form.append("video", file);
      form.append("output_language", lang);

      const start = await fetchJson(`${BACKEND_BASE_URL}/api/dub-upload`, {
        method: "POST",
        body: form
      });

      log("Start:");
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
        window.open(final.outputUrl, "_blank");
      } else {
        log("No outputUrl returned. Ensure backend returns outputUrl on success.");
      }
    } catch (e) {
      setStatus("Error ⚠️");
      log(`Error: ${e.message}`);
    }
  }

  // ---- Init ----
  (function init() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    initTabs();
    initMagneticCta();

    $("btnHealth")?.addEventListener("click", async () => {
      const ok = await checkBackendHealth();
      if (ok) await loadLanguages();
    });

    $("btnRun")?.addEventListener("click", runUploadDub);

    // initial
    checkBackendHealth().then((ok) => ok && loadLanguages());
  })();
}
