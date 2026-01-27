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


  function setLoading(isLoading, statusText) {
    const pill = $("statusPill");
    if (pill) pill.classList.toggle("isLoading", !!isLoading);

    const runBtn = $("btnRun");
    const healthBtn = $("btnHealth");
    const pickBtn = $("btnPickVideo");
    const fileInput = $("videoFile");
    const langSel = $("targetLang");

    [runBtn, healthBtn, pickBtn, fileInput, langSel].forEach((el) => {
      if (!el) return;
      if (el.tagName === "INPUT" || el.tagName === "SELECT") {
        el.disabled = !!isLoading;
      } else {
        el.disabled = !!isLoading;
        el.classList.toggle("isLoading", !!isLoading);
      }
    });

    if (typeof statusText === "string") setStatus(statusText);
  }

  function setVideoName(file) {
    const nameEl = $("videoName");
    if (!nameEl) return;
    if (!file) {
      nameEl.textContent = "or drop it here";
      return;
    }
    const mb = Math.round(file.size / 1024 / 1024);
    nameEl.textContent = `${file.name} • ${mb} MB`;
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
    // One place to turn loading UI on/off reliably
    try {
      const ok = await checkBackendHealth();
      if (!ok) {
        setLoading(false, "Backend not reachable ⚠️");
        return;
      }

      const file = $("videoFile")?.files?.[0];
      const lang = $("targetLang")?.value;

      if (!file) {
        setLoading(false, "Choose a video file ⚠️");
        return;
      }
      if (!lang) {
        setLoading(false, "Choose a target language ⚠️");
        return;
      }

      setLoading(true, "Uploading…");

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
      if (!final) {
        setLoading(false, "Timed out ⚠️");
        return;
      }

      const finalStatus = (final?.status || "").toLowerCase();
      if (["failed", "error", "canceled", "cancelled"].includes(finalStatus)) {
        setLoading(false, "Failed ⚠️");
        return;
      }

      setLoading(false, "Done ✅");

      if (final?.outputUrl) {
        window.open(final.outputUrl, "_blank");
      }
    } catch (e) {
      setLoading(false, "Error ⚠️");
    }
  }

  // ---- Init ----
  (function init() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    initTabs();
    initMagneticCta();


    // File upload UI (custom button + drag & drop)
    const fileInput = $("videoFile");
    const pickBtn = $("btnPickVideo");

    pickBtn?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", () => {
      setVideoName(fileInput.files?.[0]);
      setStatus("Ready.");
    });

    ["dragenter", "dragover"].forEach((ev) => {
      pickBtn?.addEventListener(ev, (e) => {
        e.preventDefault();
        pickBtn.classList.add("dragOver");
      });
    });

    ["dragleave", "drop"].forEach((ev) => {
      pickBtn?.addEventListener(ev, (e) => {
        e.preventDefault();
        pickBtn.classList.remove("dragOver");
      });
    });

    pickBtn?.addEventListener("drop", (e) => {
      const f = e.dataTransfer?.files?.[0];
      if (!f) return;
      if (fileInput) fileInput.files = e.dataTransfer.files;
      setVideoName(f);
      setStatus("Ready.");
    });

    setVideoName(fileInput?.files?.[0]);
    $("btnHealth")?.addEventListener("click", async () => {
      try {
        setLoading(true, "Checking backend…");
        const ok = await checkBackendHealth();
        if (ok) await loadLanguages();
        setLoading(false, ok ? "Ready." : "Backend not reachable ⚠️");
      } catch {
        setLoading(false, "Error ⚠️");
      }
    });

    $("btnRun")?.addEventListener("click", runUploadDub);

    // initial
    checkBackendHealth().then((ok) => ok && loadLanguages());
  })();
}
