// LYPO frontend demo script (v20) — fixed (no syntax errors)
(() => {
  if (window.__LYPO_INIT__) return;
  window.__LYPO_INIT__ = true;

  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const POLL_INTERVAL_MS = 1400;
  const POLL_TIMEOUT_MS = 8 * 60 * 1000;

  // Pricing hint (USD)
  const PRICE_PER_30S_USD = 2.89;

  const $ = (id) => document.getElementById(id);

  // ---- UI helpers
  function setStatus(text) {
    const st = $("statusText");
    if (st) st.textContent = text;
  }
  function setPreviewTitle(text) {
    const p = $("previewText");
    if (p) p.textContent = text;
  }
  function setPreviewHint(text) {
    const h = $("previewHint");
    if (h) h.textContent = text;
  }
  function popHint() {
    const hint = $("previewHint");
    if (!hint) return;
    hint.classList.remove("hintPop");
    void hint.offsetWidth; // reflow
    hint.classList.add("hintPop");
  }

  function showSkeleton(on) {
    const sk = $("previewSkeleton");
    if (sk) sk.hidden = !on;
  }

  function clearOutputVideo() {
    const box = $("previewBox");
    if (box) box.classList.remove("hasVideo");
    const v = $("outputVideo");
    if (!v) return;
    try { v.pause?.(); } catch {}
    v.hidden = true;
    v.removeAttribute("src");
    v.load?.();
  }

  function showOutputVideo(url) {
    const box = $("previewBox");
    if (box) box.classList.add("hasVideo");
    const v = $("outputVideo");
    if (!v) return;
    v.hidden = false;
    v.src = url;
    v.load?.();
  }

  function setBackendChip(text) {
    const el = $("chipBackend");
    if (el) el.textContent = text;
  }

  function setLoading(isLoading, text) {
    const pill = $("statusPill");
    const progress = $("progressWrap");
    const run = $("btnRun");
    const pay = $("btnPay");

    if (pill) pill.classList.toggle("isLoading", !!isLoading);
    if (progress) progress.hidden = !isLoading;

    if (run) {
      run.disabled = !!isLoading;
      run.classList.toggle("isLoading", !!isLoading);
    }
    if (pay) {
      pay.disabled = !!isLoading;
      pay.classList.toggle("isLoading", !!isLoading);
    }
    if (typeof text === "string") setStatus(text);
  }

  // ---- Generating messages
  const GENERATING_MESSAGES = [
    "Longer videos travel deeper paths through the machine ⏳",
    "Stay with us — good dubbing is a small act of digital divinity 😇",
    "Aligning lips, preserving voices, politely bending reality…",
    "Crafting your translated video frame by frame ✨"
  ];
  let genMsgIdx = 0;
  let genMsgTimer = null;

  function startGeneratingMessages() {
    stopGeneratingMessages();
    genMsgIdx = 0;
    popHint();
    setPreviewHint(GENERATING_MESSAGES[genMsgIdx]);
    genMsgTimer = setInterval(() => {
      genMsgIdx = (genMsgIdx + 1) % GENERATING_MESSAGES.length;
      popHint();
      setPreviewHint(GENERATING_MESSAGES[genMsgIdx]);
    }, 5200);
  }

  function stopGeneratingMessages() {
    if (genMsgTimer) {
      clearInterval(genMsgTimer);
      genMsgTimer = null;
    }
  }

  // ---- Download (blob only; avoids fullscreen/player)
  function resetDownload() {
    const btn = $("btnDownload");
    if (!btn) return;
    btn.hidden = true;
    btn.classList.remove("isReady");
    btn.setAttribute("aria-disabled", "true");
    btn.setAttribute("tabindex", "-1");
    btn.dataset.url = "";
  }

  function enableDownload(url) {
    const btn = $("btnDownload");
    if (!btn) return;
    btn.hidden = false;
    btn.dataset.url = url;
    btn.classList.add("isReady");
    btn.setAttribute("aria-disabled", "false");
    btn.removeAttribute("tabindex");
  }

  function guessMp4Name() {
    const original = $("videoFile")?.files?.[0]?.name || "video";
    const base = original.replace(/\.[^.]+$/, "");
    return `${base}-translated.mp4`;
  }

  async function downloadViaBlob(url, filename) {
    // Requires CORS on outputUrl OR proxy from your backend
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const originalBlob = await res.blob();
    const blob = new Blob([originalBlob], { type: "application/octet-stream" });

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
  }

  // ---- Tabs
  function attachTabs() {
    const tabBtns = Array.from(document.querySelectorAll(".tabBtn"));
    const panels = Array.from(document.querySelectorAll(".tabPanel"));
    const goHome = document.querySelector("[data-go='home']");

    function activate(tab) {
      tabBtns.forEach((b) => {
        const on = b.dataset.tab === tab;
        b.classList.toggle("isActive", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("isActive", p.id === `tab-${tab}`));
    }

    tabBtns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
    goHome?.addEventListener("click", (e) => {
      e.preventDefault();
      activate("home");
    });
  }

  // ---- Networking
  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (!res.ok) {
      const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
      throw new Error(typeof body === "string" ? body : (body?.error || `HTTP ${res.status}`));
    }
    return isJson ? res.json() : null;
  }

  // ---- Languages (Replicate expects full names)
  async function loadLanguages() {
    const select = $("targetLang");
    if (!select) return;

    const MAP = {
      "en":"English","es":"Spanish","fr":"French","de":"German","it":"Italian","pt":"Portuguese",
      "nl":"Dutch","tr":"Turkish","ko":"Korean","da":"Danish","ar":"Arabic","ro":"Romanian",
      "zh":"Chinese","ja":"Japanese","sv":"Swedish","id":"Indonesian","uk":"Ukrainian","el":"Greek",
      "cs":"Czech","bg":"Bulgarian","ms":"Malay","sk":"Slovak","hr":"Croatian","ta":"Tamil","fi":"Finnish","ru":"Russian",
      "pl":"Polish","hi":"Hindi","fil":"Filipino"
    };

    const FALLBACK = [
      "Arabic","Arabic (Egypt)","Arabic (Saudi Arabia)","Bulgarian","Chinese","Chinese (Mandarin, Simplified)","Chinese (Taiwanese Mandarin, Traditional)",
      "Croatian","Czech","Danish","Dutch","English","English (Australia)","English (Canada)","English (India)","English (UK)","English (United States)",
      "Filipino","Finnish","French","French (Canada)","French (France)","German","German (Austria)","German (Germany)","German (Switzerland)",
      "Greek","Hindi","Indonesian","Italian","Japanese","Korean","Malay","Mandarin","Polish","Portuguese","Portuguese (Brazil)","Portuguese (Portugal)",
      "Romanian","Russian","Russian (Russia)","Slovak","Spanish","Spanish (Mexico)","Spanish (Spain)","Swedish","Tamil","Turkish","Turkish (Türkiye)",
      "Ukrainian","Ukrainian (Ukraine)"
    ];

    function normalize(item) {
      if (!item) return null;
      if (typeof item === "string") {
        const v = MAP[item] || item;
        return { value: v, label: v };
      }
      const raw = item.name || item.label || item.title || item.value || item.code;
      if (!raw) return null;
      const code = (item.code || "").toLowerCase();
      const v = MAP[raw] || MAP[code] || raw;
      return { value: v, label: v };
    }

    function fill(list) {
      select.innerHTML = "";
      list.forEach((it) => {
        const opt = document.createElement("option");
        opt.value = it.value;
        opt.textContent = it.label;
        select.appendChild(opt);
      });
    }

    try {
      const raw = await fetchJson(`${BACKEND_BASE_URL}/api/languages`);
      const items = (raw || []).map(normalize).filter(Boolean);

      if (items.length) {
        const seen = new Set();
        const uniq = [];
        for (const it of items) {
          if (seen.has(it.value)) continue;
          seen.add(it.value);
          uniq.push(it);
        }
        uniq.sort((a,b) => a.label.localeCompare(b.label));
        fill(uniq);
        return;
      }
      throw new Error("Empty language list");
    } catch {
      fill(FALLBACK.map((x) => ({ value: x, label: x })));
    }
  }

  // ---- Backend health
  async function checkBackend() {
    try {
      await fetchJson(`${BACKEND_BASE_URL}/health`);
      setBackendChip("Backend: connected ✓");
    } catch {
      setBackendChip("Backend: not connected");
    }
  }

  // ---- Cost estimate + upload picker
  function formatUSD(n) {
    const val = Number.isFinite(n) ? n : 0;
    return `$${val.toFixed(2)}`;
  }
  function estimateCostFromSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    const units = Math.ceil(seconds / 30);
    return units * PRICE_PER_30S_USD;
  }

  function attachUploadPicker() {
    const input = $("videoFile");
    const pickBtn = $("btnPickVideo");
    const nameEl = $("videoName");
    if (!input || !pickBtn) return;

    const setName = (file) => { if (nameEl) nameEl.textContent = file ? file.name : "or drop it here"; };

    pickBtn.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      setName(file);

      resetDownload();
      clearOutputVideo();
      showSkeleton(false);
      stopGeneratingMessages();
      setPreviewTitle("No output yet");
      setPreviewHint("Generated video will appear here");

      const costEl = $("costEstimate");
      const pay = $("btnPay");

      if (!file) {
        if (costEl) costEl.textContent = "";
        if (pay) pay.querySelector(".btnLabel").textContent = "Pay";
        return;
      }

      const tmp = document.createElement("video");
      tmp.preload = "metadata";
      tmp.onloadedmetadata = () => {
        const seconds = Number(tmp.duration);
        const est = estimateCostFromSeconds(seconds);
        if (costEl && est) costEl.textContent = `Estimated: ${formatUSD(est)}`;
        if (pay && est) pay.querySelector(".btnLabel").textContent = `Pay (${formatUSD(est)})`;
        URL.revokeObjectURL(tmp.src);
      };
      tmp.src = URL.createObjectURL(file);
    });

    ["dragenter","dragover"].forEach((ev) => {
      pickBtn.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickBtn.classList.add("dragOver");
      });
    });
    ["dragleave","drop"].forEach((ev) => {
      pickBtn.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickBtn.classList.remove("dragOver");
      });
    });
    pickBtn.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    });
  }

  // ---- Polling + run
  async function pollJob(jobId) {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      const j = await fetchJson(`${BACKEND_BASE_URL}/api/dub/${encodeURIComponent(jobId)}`);
      if (j?.status === "succeeded" && j?.outputUrl) return j;
      if (j?.status === "failed") throw new Error(j?.error || "Job failed");
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      setStatus("Generating…");
    }
    throw new Error("Timed out waiting for result");
  }

  async function runUploadDub() {
    const input = $("videoFile");
    const select = $("targetLang");
    const file = input?.files?.[0];
    const outputLanguage = select?.value; // full name

    if (!file) return setStatus("Please choose a video first.");
    if (!outputLanguage) return setStatus("Please select a target language.");

    resetDownload();
    clearOutputVideo();
    showSkeleton(true);
    setPreviewTitle("Generating…");
    startGeneratingMessages();

    try {
      setLoading(true, "Uploading…");

      const fd = new FormData();
      fd.append("video", file);
      fd.append("output_language", outputLanguage);

      const up = await fetchJson(`${BACKEND_BASE_URL}/api/dub-upload`, { method: "POST", body: fd });
      const jobId = up?.id || up?.jobId || up?.predictionId;
      if (!jobId) throw new Error("No job id returned from server.");

      setStatus("Generating…");
      const final = await pollJob(jobId);

      setLoading(false, "Ready ✅");
      stopGeneratingMessages();
      showSkeleton(false);

      showOutputVideo(final.outputUrl);
      enableDownload(final.outputUrl);

      setPreviewTitle("Output ready");
      setPreviewHint("Preview is playable. Click Download to save the MP4.");
    } catch (e) {
      setLoading(false, "Error");
      stopGeneratingMessages();
      showSkeleton(false);
      clearOutputVideo();
      setPreviewTitle("Error");
      setPreviewHint("Something went wrong.");
      setStatus(`Error: ${e?.message || e}`);
    }
  }
  // ---- Mini showcase (English ➜ French)
  function attachMiniShowcase() {
    const vids = {
      english: $("miniEnglish"),
      french: $("miniFrench"),
    };
    const tiles = {
      english: vids.english?.closest(".miniVid") || null,
      french: vids.french?.closest(".miniVid") || null,
    };
    const buttons = Array.from(document.querySelectorAll(".miniPlay"));

    // no loop by default (keeps audio sane)
    Object.values(vids).forEach((v) => { if (v) v.loop = false; });

    function setPlaying(key, on) {
      const tile = tiles[key];
      const btn = document.querySelector(`.miniPlay[data-play="${key}"]`);
      if (tile) tile.classList.toggle("isPlaying", !!on);
      if (btn) btn.textContent = on ? "❚❚" : "▶";
    }

    function stopAll() {
      Object.entries(vids).forEach(([key, v]) => {
        try { v?.pause(); } catch {}
        setPlaying(key, false);
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.play;
        const v = vids[key];
        if (!v) return;

        const isPlaying = !v.paused && !v.ended;
        stopAll();

        if (!isPlaying) {
          v.play().then(() => setPlaying(key, true)).catch(() => {});
        }
      });
    });

    // Sync UI with actual playback state
    Object.entries(vids).forEach(([key, v]) => {
      v?.addEventListener("play", () => setPlaying(key, true));
      v?.addEventListener("pause", () => setPlaying(key, false));
      v?.addEventListener("ended", () => setPlaying(key, false));
      v?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    // Auto-pause when the showcase scrolls out of view
    // (pauses any playing preview as soon as it is not meaningfully visible)
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            stopAll();
          }
        }
      }, { threshold: [0, 0.15, 0.35, 0.6, 1] });

      const tab = document.querySelector(".showcaseTab");
      if (tab) io.observe(tab);
    } else {
      // Fallback: pause on scroll
      window.addEventListener("scroll", () => stopAll(), { passive: true });
    }
  }


  function attachDownload() {
    const btn = $("btnDownload");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const raw = btn.dataset.url;
      if (!raw || btn.getAttribute("aria-disabled") === "true") return;

      const filename = guessMp4Name();
      try {
        await downloadViaBlob(raw, filename);
      } catch {
        setStatus("Download blocked by server (CORS) ⚠️");
        setPreviewHint("To force download without opening the player: enable CORS on outputUrl or proxy it via your backend.");
      }
    });
  }

  function attachPay() {
    const btn = $("btnPay");
    if (!btn) return;
    btn.addEventListener("click", () => setStatus("Payment is not connected yet."));
  }

  function setYear() {
    const y = $("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function lockPreviewBox() {
    $("previewBox")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  // ---- INIT
  attachTabs();
  setYear();
  attachUploadPicker();
  attachDownload();
  attachPay();
  attachMiniShowcase();
  lockPreviewBox();

  resetDownload();
  clearOutputVideo();
  showSkeleton(false);
  setPreviewTitle("No output yet");
  setPreviewHint("Generated video will appear here");

  loadLanguages();
  checkBackend();

  $("btnRun")?.addEventListener("click", runUploadDub);
})();
