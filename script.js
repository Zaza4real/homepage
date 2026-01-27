// LYPO frontend demo script (v7) — clean init + working buttons
() => {
  if (window.__LYPO_INIT__) return;
  window.__LYPO_INIT__ = true;

  // === CONFIG ===
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com"; // change if needed
  const POLL_INTERVAL_MS = 1400;
  const POLL_TIMEOUT_MS = 8 * 60 * 1000;

  // Pricing hint (USD)
  const PRICE_PER_30S_USD = 2.89;

  const $ = (id) => document.getElementById(id);

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

  function showSkeleton(on) {
    const sk = $("previewSkeleton");
    if (sk) sk.hidden = !on;
  }

  function clearOutputVideo() {
    const v = $("outputVideo");
    if (!v) return;
    v.pause?.();
    v.hidden = true;
    v.removeAttribute("src");
    v.load?.();
  }

  function showOutputVideo(url) {
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

  function formatUSD(n) {
    const val = Number.isFinite(n) ? n : 0;
    return `$${val.toFixed(2)}`;
  }

  function estimateCostFromSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    const units = Math.ceil(seconds / 30);
    return units * PRICE_PER_30S_USD;
  }

  async function downloadViaBlob(url, filename) {
    // Requires CORS access to fetch the file
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
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

  function makeDownloadUrl(rawUrl, filename) {
    // Best-effort: append response-content-disposition for S3/GCS signed URLs
    try {
      const u = new URL(rawUrl);
      const host = u.host || "";
      const isS3 = host.includes("amazonaws.com") || u.searchParams.has("X-Amz-Signature");
      const isGcs = host.includes("storage.googleapis.com");
      if (isS3 || isGcs) {
        u.searchParams.set("response-content-disposition", `attachment; filename="${filename}"`);
        u.searchParams.set("response-content-type", "video/mp4");
        return u.toString();
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

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

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (!res.ok) {
      const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
      throw new Error(typeof body === "string" ? body : (body?.error || `HTTP ${res.status}`));
    }
    return isJson ? res.json() : null;
  }

  
  async function loadLanguages() {
    const select = $("targetLang");
    if (!select) return;

    const NAMES = {
      "en": "English",
      "es": "Spanish",
      "de": "German",
      "fr": "French",
      "it": "Italian",
      "pt": "Portuguese",
      "pt-BR": "Portuguese (Brazil)",
      "nl": "Dutch",
      "sv": "Swedish",
      "no": "Norwegian",
      "da": "Danish",
      "fi": "Finnish",
      "et": "Estonian",
      "lv": "Latvian",
      "lt": "Lithuanian",
      "pl": "Polish",
      "cs": "Czech",
      "sk": "Slovak",
      "hu": "Hungarian",
      "ro": "Romanian",
      "bg": "Bulgarian",
      "el": "Greek",
      "tr": "Turkish",
      "uk": "Ukrainian",
      "ru": "Russian",
      "ar": "Arabic",
      "he": "Hebrew",
      "hi": "Hindi",
      "bn": "Bengali",
      "ur": "Urdu",
      "fa": "Persian",
      "zh": "Chinese",
      "zh-CN": "Chinese (Simplified)",
      "zh-TW": "Chinese (Traditional)",
      "ja": "Japanese",
      "ko": "Korean",
      "th": "Thai",
      "vi": "Vietnamese",
      "id": "Indonesian",
      "ms": "Malay",
      "tl": "Filipino",
      "sw": "Swahili"
    };

    function normalizeItem(item) {
      if (typeof item === "string") return { code: item, name: NAMES[item] || item };
      if (!item) return null;
      const code = item.code || item.value || item.lang || item.id;
      const name = item.name || item.label || item.title || (code ? (NAMES[code] || code) : null);
      if (!code) return null;
      return { code, name };
    }

    function fill(list) {
      select.innerHTML = "";
      for (const it of list) {
        const opt = document.createElement("option");
        opt.value = it.code;
        opt.textContent = it.name; // full name
        select.appendChild(opt);
      }
    }

    try {
      const raw = await fetchJson(`${BACKEND_BASE_URL}/api/languages`);
      const items = (raw || []).map(normalizeItem).filter(Boolean);
      if (items.length) {
        // Sort by display name for nicer UX
        items.sort((a,b) => a.name.localeCompare(b.name));
        fill(items);
        return;
      }
      throw new Error("Empty language list");
    } catch (e) {
      // Rich fallback list with full names (covers common cases)
      const fallback = Object.entries(NAMES).map(([code, name]) => ({ code, name }));
      fallback.sort((a,b) => a.name.localeCompare(b.name));
      fill(fallback);
    }
  }

    } catch (e) {
      // Fallback list
      const select = $("targetLang");
      if (select) {
        select.innerHTML = "";
        ["en","es","de","fr","it","pt","ja","ko","zh"].forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c.toUpperCase();
          select.appendChild(opt);
        });
      }
    }

  async function checkBackend() {
    try {
      await fetchJson(`${BACKEND_BASE_URL}/health`);
      setBackendChip("Backend: connected ✓");
    } catch {
      setBackendChip("Backend: not connected");
    }
  }

  function attachUploadPicker() {
    const input = $("videoFile");
    const pickBtn = $("btnPickVideo");
    const nameEl = $("videoName");

    if (!input || !pickBtn) return;

    function setName(file) {
      if (nameEl) nameEl.textContent = file ? file.name : "or drop it here";
    }

    pickBtn.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      setName(file);
      resetDownload();
      clearOutputVideo();
      showSkeleton(false);
      setPreviewTitle("No output yet");
      setPreviewHint("Generated video will appear here");

      // Update cost estimate once we know duration
      if (file) {
        const tmp = document.createElement("video");
        tmp.preload = "metadata";
        tmp.onloadedmetadata = () => {
          const seconds = Number(tmp.duration);
          const est = estimateCostFromSeconds(seconds);
          const costEl = $("costEstimate");
          if (costEl && est) costEl.textContent = `Estimated: ${formatUSD(est)}`;
          const pay = $("btnPay");
          if (pay && est) pay.querySelector(".btnLabel").textContent = `Pay (${formatUSD(est)})`;
          URL.revokeObjectURL(tmp.src);
        };
        tmp.src = URL.createObjectURL(file);
      } else {
        const costEl = $("costEstimate");
        if (costEl) costEl.textContent = "";
        const pay = $("btnPay");
        if (pay) pay.querySelector(".btnLabel").textContent = "Pay";
      }
    });

    // Drag & drop ONLY on the upload button (NOT on the output window)
    ;["dragenter","dragover"].forEach((ev) => {
      pickBtn.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickBtn.classList.add("dragOver");
      });
    });
    ;["dragleave","drop"].forEach((ev) => {
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
    const lang = $("targetLang")?.value;
    const file = input?.files?.[0];

    if (!file) {
      setStatus("Please choose a video first.");
      return;
    }
    if (!lang) {
      setStatus("Please select a target language.");
      return;
    }

    resetDownload();
    clearOutputVideo();
    showSkeleton(true);
    setPreviewTitle("Generating…");
    setPreviewHint("Working on it — preview will appear when ready.");

    try {
      setLoading(true, "Uploading…");

      const fd = new FormData();
      fd.append("video", file);
      fd.append("output_language", lang);

      const up = await fetchJson(`${BACKEND_BASE_URL}/api/dub-upload`, { method: "POST", body: fd });
      const jobId = up?.id || up?.jobId || up?.predictionId;
      if (!jobId) throw new Error("No job id returned from server.");

      setStatus("Generating…");
      const final = await pollJob(jobId);

      setLoading(false, "Ready ✅");
      showSkeleton(false);

      // Preview
      showOutputVideo(final.outputUrl);

      // Enable download
      enableDownload(final.outputUrl);

      setPreviewTitle("Output ready");
      setPreviewHint("Preview is playable. Click Download to save the MP4.");

    } catch (e) {
      setLoading(false, "Error");
      showSkeleton(false);
      setPreviewTitle("Error");
      setPreviewHint("Something went wrong.");
      setStatus(`Error: ${e?.message || e}`);
    }
  }

  function attachDownload() {
    const btn = $("btnDownload");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const raw = btn.dataset.url;
      if (!raw || btn.getAttribute("aria-disabled") === "true") return;

      const filename = guessMp4Name();
      const url = makeDownloadUrl(raw, filename);

      // Attempt 1: direct anchor click (works if server forces attachment)
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Attempt 2: blob download (works if CORS allows)
      try {
        await downloadViaBlob(raw, filename);
      } catch (_) {
        // If CORS blocks, user might see a player from attempt 1 depending on headers.
        // Backend should set Content-Disposition: attachment or provide a same-origin proxy.
      }
    });
  }

  function attachPay() {
    const btn = $("btnPay");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Placeholder: wire this to Stripe/etc.
      // For now, it just nudges the user.
      setStatus("Payment is not connected yet.");
    });
  }

  function setYear() {
    const y = $("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // === INIT ===
  attachTabs();
  setYear();
  attachUploadPicker();
  $("previewBox")?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
  attachDownload();
  attachPay();
  resetDownload();
  clearOutputVideo();
  showSkeleton(false);
  setPreviewTitle("No output yet");
  setPreviewHint("Generated video will appear here");

  loadLanguages();
  checkBackend();
;
