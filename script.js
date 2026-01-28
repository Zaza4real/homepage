// GLOBAL DOM helper — MUST be first line
const $ = (id) => document.getElementById(id);

(() => {
  const BACKEND = "https://lypo-backend.onrender.com";
  const TOKEN_KEY = "lypo_token_v1";
  const CREDITS_PER_SECOND = 10;

  const token = localStorage.getItem(TOKEN_KEY);

  function status(msg) {
    const el = $("statusLine");
    if (el) el.textContent = msg || "";
  }

  async function api(path, opts = {}) {
    const res = await fetch(BACKEND + path, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || data || `Request failed (${res.status})`);
    }
    return data;
  }

  async function getVideoSeconds() {
    const file = $("videoFile")?.files?.[0];
    if (!file) throw new Error("Select a video first.");

    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;

    await new Promise((ok, err) => {
      v.onloadedmetadata = ok;
      v.onerror = err;
    });

    URL.revokeObjectURL(url);
    return Math.max(1, Math.ceil(v.duration || 1));
  }

  async function uploadAndTranslate() {
    if (!token) {
      window.location.href = "auth.html";
      return;
    }

    try {
      const seconds = await getVideoSeconds();
      const cost = seconds * CREDITS_PER_SECOND;

      if (!confirm(`This video is ${seconds}s.\nCost: ${cost} credits.\n\nContinue?`)) {
        return;
      }

      const fd = new FormData();
      fd.append("video", $("videoFile").files[0]);
      fd.append("output_language", $("langSelect").value);
      fd.append("seconds", seconds);

      status("Uploading…");

      const res = await fetch(BACKEND + "/api/dub-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      status("Generating video…");
    } catch (e) {
      status("Error: " + e.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("btnRun")?.addEventListener("click", uploadAndTranslate);
    status("Ready.");
  });
})();
