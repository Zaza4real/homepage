// TikTok Captions Tool - Frontend Logic
(() => {
  if (window.__TIKTOK_CAPTIONS_INIT__) return;
  window.__TIKTOK_CAPTIONS_INIT__ = true;

  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const COST_PER_VIDEO = 50; // 50 credits per caption generation

  // DOM elements
  const $ = (id) => document.getElementById(id);
  const videoFileInput = $("videoFile");
  const btnPickVideo = $("btnPickVideo");
  const btnGenerate = $("btnGenerate");
  const btnDownload = $("btnDownload");
  const videoNameEl = $("videoName");
  const previewBox = $("previewBox");
  const previewText = $("previewText");
  const previewHint = $("previewHint");
  const previewSkeleton = $("previewSkeleton");
  const outputVideo = $("outputVideo");
  const statusPill = $("statusPill");
  const statusText = $("statusText");
  const creditsBalance = $("creditsBalance");

  // Auth
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  // State
  let selectedFile = null;
  let isProcessing = false;
  let captionSize = 50;

  function init() {
    attachUploadHandlers();
    attachGenerateHandler();
    attachCaptionControls();
    loadCreditsBalance();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Attach caption style controls
  function attachCaptionControls() {
    // Caption size slider
    const captionSizeSlider = document.getElementById('captionSize');
    const captionSizeValue = document.getElementById('captionSizeValue');

    if (captionSizeSlider) {
      captionSizeSlider.addEventListener('input', (e) => {
        captionSize = parseInt(e.target.value, 10);
        if (captionSizeValue) {
          captionSizeValue.textContent = captionSize;
        }
        console.log('📏 Caption size changed:', captionSize);
      });
    }
  }

  // Load credits balance
  async function loadCreditsBalance() {
    console.log("🔍 Loading credits balance...");
    console.log("Auth token exists:", !!authToken);
    console.log("creditsBalance element exists:", !!creditsBalance);

    if (!authToken) {
      console.warn("⚠️ No auth token found - user not logged in");
      if (creditsBalance) {
        creditsBalance.textContent = "Login to see balance";
        creditsBalance.style.cursor = "pointer";
        // No color styling - use default chip color
        creditsBalance.onclick = () => {
          window.location.href = "auth.html";
        };
      }
      return;
    }

    try {
      console.log("🌐 Fetching user data from /api/auth/me...");
      const res = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        console.error("❌ Failed to load user data:", res.status);
        const errorText = await res.text();
        console.error("Error response:", errorText);

        if (creditsBalance) {
          creditsBalance.textContent = "Balance: Error";
          // No color styling - use default chip color
        }

        // If unauthorized, token might be invalid
        if (res.status === 401) {
          console.warn("⚠️ Token invalid - clearing and redirecting to login");
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setTimeout(() => {
            window.location.href = "auth.html";
          }, 2000);
        }
        return;
      }

      const data = await res.json();
      console.log("✅ User data received:", data);

      // Backend returns "balance" not "credits"
      const balance = data.user?.balance ?? data.user?.credits ?? 0;
      console.log("Balance value:", balance);
      console.log("Balance type:", typeof balance);

      if (data.user && typeof balance === "number") {
        console.log("💰 Setting balance to:", balance);
        if (creditsBalance) {
          creditsBalance.textContent = `${balance} Credits`;
          creditsBalance.style.cursor = "pointer";
          // No color styling - use default chip color
          creditsBalance.onclick = () => {
            window.location.href = "index.html#buycredits";
          };
        }
      } else {
        console.warn("⚠️ No balance found in response, setting to 0");
        if (creditsBalance) {
          creditsBalance.textContent = "0 Credits";
          // No color styling - use default chip color
        }
      }
    } catch (e) {
      console.error("❌ Exception loading credits:", e);
      console.error("Exception details:", e.message, e.stack);
      if (creditsBalance) {
        creditsBalance.textContent = "Balance: Error";
        // No color styling - use default chip color
      }
    }
  }

  // Upload handlers
  function attachUploadHandlers() {
    btnPickVideo.addEventListener("click", () => videoFileInput.click());

    videoFileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
    });

    // Drag and drop
    btnPickVideo.addEventListener("dragover", (e) => {
      e.preventDefault();
      btnPickVideo.classList.add("dragOver");
    });

    btnPickVideo.addEventListener("dragleave", () => {
      btnPickVideo.classList.remove("dragOver");
    });

    btnPickVideo.addEventListener("drop", (e) => {
      e.preventDefault();
      btnPickVideo.classList.remove("dragOver");
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("video/")) {
        videoFileInput.files = e.dataTransfer.files;
        handleFileSelected(file);
      }
    });
  }

  function handleFileSelected(file) {
    // Validate video format
    const validFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const fileExt = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['mp4', 'mov', 'avi', 'webm'];

    if (!validFormats.includes(file.type) && !validExtensions.includes(fileExt)) {
      alert(`⚠️ Unsupported video format: ${file.type || fileExt}\n\nPlease use MP4, MOV, AVI, or WebM format.\n\nTip: You can convert your video using a free tool like CloudConvert.com`);
      return;
    }

    // Check file size (max 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`⚠️ Video too large: ${(file.size / 1024 / 1024).toFixed(1)}MB\n\nMaximum size: 200MB\n\nPlease compress your video first.`);
      return;
    }

    selectedFile = file;
    videoNameEl.textContent = file.name;
    videoNameEl.style.color = "rgba(255,255,255,0.9)";
    setStatus("Ready", false);
  }

  // Generate handler
  function attachGenerateHandler() {
    btnGenerate.addEventListener("click", async () => {
      if (isProcessing) return;

      if (!selectedFile) {
        alert("Please select a video first");
        return;
      }

      if (!authToken) {
        alert("Please login to use this tool");
        window.location.href = "auth.html";
        return;
      }

      await generateCaptions();
    });
  }

  async function generateCaptions() {
    isProcessing = true;

    // Disable generate button with strong purple breathing effect
    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.style.opacity = '1'; // Keep full opacity for strong purple glow
      btnGenerate.style.cursor = 'not-allowed';
      btnGenerate.classList.add('generating'); // Purple breathing animation
    }

    // Show generating modal
    if (window.GeneratingModal) {
      window.GeneratingModal.show(
        "Generating Captions...",
        "AI is adding captions to your video.<br>This may take 1-3 minutes.<br><br><span style='color: rgba(255,255,255,0.7); font-size: 13px;'>📱 Note: iPhone videos and non-MP4 formats may take longer due to automatic conversion.</span>"
      );
    }

    // Make status pill prominent
    if (statusPill) statusPill.classList.add("active");

    setStatus("Uploading video...", true);
    showSkeleton(true);
    resetOutput();

    try {
      // Create form data
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("caption_size", captionSize);

      console.log("📤 Uploading video:", selectedFile.name);
      console.log("📊 Video size:", (selectedFile.size / 1024 / 1024).toFixed(2), "MB");
      console.log("📏 Caption size:", captionSize);

      // Upload and generate with timeout
      const uploadController = new AbortController();
      const uploadTimeout = setTimeout(() => uploadController.abort(), 60000); // 60 second upload timeout

      let res;
      try {
        res = await fetch(`${BACKEND_BASE_URL}/api/tiktok-captions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          body: formData,
          signal: uploadController.signal
        });
      } catch (uploadError) {
        clearTimeout(uploadTimeout);
        if (uploadError.name === 'AbortError') {
          throw new Error("Upload timeout - video is too large or connection is slow. Please try a smaller video.");
        }
        throw uploadError;
      }

      clearTimeout(uploadTimeout);

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Response wasn't JSON
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("✅ Upload complete, job ID:", data.jobId);

      // Poll for result with longer timeout
      setStatus("Generating captions... Please do not refresh or close this page.", true);
      const result = await pollJob(data.jobId);

      // Show result
      setStatus("Ready ✅", false);
      showSkeleton(false);
      showOutputVideo(result.outputUrl);
      enableDownload(result.outputUrl);
      setPreviewTitle("Captions ready!");
      setPreviewHint("Video with captions is ready. Click Download to save.");

      // Hide generating modal with success sound
      if (window.GeneratingModal) {
        window.GeneratingModal.hide(true);
      }

      // Remove active status
      if (statusPill) statusPill.classList.remove("active");

      // Reload credits
      await loadCreditsBalance();

    } catch (error) {
      console.error("❌ Generation error:", error);
      setStatus("Error ❌", false);
      showSkeleton(false);

      // Re-enable generate button on error
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.style.opacity = '1';
        btnGenerate.style.cursor = 'pointer';
        btnGenerate.classList.remove('generating');
      }

      // Hide generating modal (no sound on error)
      if (window.GeneratingModal) {
        window.GeneratingModal.hide(false);
      }

      // Remove active status
      if (statusPill) statusPill.classList.remove("active");

      // More user-friendly error messages
      let errorMsg = error.message;
      if (error.message.includes("timeout")) {
        errorMsg = "⏱️ Processing is taking longer than expected. This can happen with longer videos. Please try:\n\n• Using a shorter video (under 60 seconds)\n• Checking your internet connection\n• Trying again in a few minutes";
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        errorMsg = "🌐 Network error. Please check your internet connection and try again.";
      } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMsg = "🔐 Session expired. Please login again.";
        setTimeout(() => window.location.href = "auth.html", 2000);
      } else if (error.message.includes("insufficient")) {
        errorMsg = "💳 Insufficient credits. Please purchase more credits to continue.";
      }

      alert(`Error: ${errorMsg}`);
    } finally {
      isProcessing = false;

      // Re-enable generate button when done
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.style.opacity = '1';
        btnGenerate.style.cursor = 'pointer';
        btnGenerate.classList.remove('generating');
      }

      // Ensure modal is hidden (final cleanup)
      if (window.GeneratingModal) {
        window.GeneratingModal.hide(false);
      }

      // Remove active status (final cleanup)
      if (statusPill) statusPill.classList.remove("active");
    }
  }

  // Poll for job completion with better timeout and error handling
  async function pollJob(jobId) {
    const maxAttempts = 600; // 10 minutes max (increased from 5 minutes)
    const pollInterval = 1000; // Check every second
    let attempts = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    console.log(`🔄 Starting to poll job ${jobId} (max ${maxAttempts} seconds)`);

    while (attempts < maxAttempts) {
      await sleep(pollInterval);
      attempts++;

      // Update status every 30 seconds to show progress (no time shown)
      if (attempts % 30 === 0) {
        setStatus(`Generating captions... Please wait.`, true);
        console.log(`⏱️ Progress: ${attempts}/${maxAttempts} seconds`);
      }

      try {
        // Add timeout to individual fetch requests
        const pollController = new AbortController();
        const pollTimeout = setTimeout(() => pollController.abort(), 10000); // 10 second timeout per poll

        const res = await fetch(`${BACKEND_BASE_URL}/api/tiktok-captions/${jobId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: pollController.signal
        });

        clearTimeout(pollTimeout);

        if (!res.ok) {
          console.warn(`⚠️ Poll request failed with status ${res.status}`);
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(`Failed to check job status after ${maxConsecutiveErrors} attempts`);
          }
          continue;
        }

        const data = await res.json();
        consecutiveErrors = 0; // Reset error counter on success

        console.log(`📊 Poll #${attempts}: status = ${data.status}`);

        if (data.status === "succeeded") {
          // Autocaption returns output as a URL string or array
          let outputUrl = data.output;

          // If output is an array, get the first item
          if (Array.isArray(outputUrl)) {
            outputUrl = outputUrl[0];
          }

          console.log("✅ Job succeeded! Output URL:", outputUrl);

          if (!outputUrl) {
            throw new Error("No output video URL received from server");
          }

          return { outputUrl };

        } else if (data.status === "failed") {
          const errorMsg = data.error || "Video generation failed";
          console.error("❌ Job failed:", errorMsg);
          console.error("📋 Full error details:", data);

          // Provide helpful error messages based on error type
          let userMsg = errorMsg;
          if (typeof errorMsg === 'string') {
            if (errorMsg.includes('ffmpeg error')) {
              userMsg = '⚠️ Video format incompatible. Please try:\n\n1. Convert to MP4 using CloudConvert.com\n2. Use a different video file\n3. Compress/re-encode your video\n\nCommon causes: Unsupported codec, corrupted file, or unusual video parameters.';
            } else if (errorMsg.includes('timeout')) {
              userMsg = '⏱️ Generation timeout. Your video might be too long or complex. Try a shorter video.';
            } else if (errorMsg.includes('memory') || errorMsg.includes('OOM')) {
              userMsg = '💾 Out of memory. Your video is too large. Please compress it first.';
            }
          }

          throw new Error(userMsg);

        } else if (data.status === "processing" || data.status === "starting") {
          // Show progress if available
          if (data.progress) {
            setStatus(`Generating... ${Math.round(data.progress * 100)}%`, true);
          }
          // Continue polling

        } else {
          console.log(`⏳ Job status: ${data.status || 'unknown'}, continuing...`);
          // Continue polling for other statuses
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`⚠️ Poll request timeout (attempt ${attempts})`);
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error("Job status checks are timing out. Server may be overloaded or video is too complex.");
          }
        } else if (error.message && (error.message.includes("failed") || error.message.includes("No output"))) {
          // Propagate actual job failures
          throw error;
        } else {
          console.error(`⚠️ Poll error (attempt ${attempts}):`, error);
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(`Network errors prevented checking job status. Please check your connection and try again.`);
          }
        }
      }
    }

    // Timeout reached
    console.error(`⏱️ Polling timeout after ${maxAttempts} seconds`);
    throw new Error(`Video processing is taking longer than expected (${Math.floor(maxAttempts / 60)} minutes). This can happen with longer videos or during high server load. Please try:\n\n• Using a shorter video (30-60 seconds recommended)\n• Trying again in a few minutes\n• Contacting support if the issue persists`);
  }

  // UI helpers
  function setStatus(text, loading) {
    if (statusText) statusText.textContent = text;
    if (statusPill) statusPill.classList.toggle("isLoading", loading);
  }

  function showSkeleton(show) {
    if (previewSkeleton) previewSkeleton.hidden = !show;
  }

  function resetOutput() {
    if (outputVideo) {
      outputVideo.hidden = true;
      outputVideo.src = "";
    }
    if (btnDownload) {
      btnDownload.hidden = true;
      btnDownload.style.display = 'none';
      btnDownload.classList.remove('isReady');
    }
    if (previewBox) previewBox.classList.remove("hasVideo");
  }

  function showOutputVideo(url) {
    if (outputVideo && previewBox) {
      console.log("Setting video source:", url);

      // Set video source
      outputVideo.src = url;
      outputVideo.hidden = false;
      outputVideo.crossOrigin = "anonymous"; // Enable CORS

      // Add error handler
      outputVideo.onerror = (e) => {
        console.error("Video load error:", e);
        console.error("Video src:", outputVideo.src);
        alert("Video loaded but may have playback issues. Try downloading it instead.");
      };

      // Add success handler
      outputVideo.onloadeddata = () => {
        console.log("Video loaded successfully!");
      };

      outputVideo.load();
      previewBox.classList.add("hasVideo");
    }
  }

  function enableDownload(url) {
    if (btnDownload) {
      console.log("Enabling download button with URL:", url);

      // Remove hidden attribute
      btnDownload.hidden = false;
      btnDownload.removeAttribute('hidden');

      // Force visibility with inline style
      btnDownload.style.display = 'inline-flex';
      btnDownload.style.visibility = 'visible';
      btnDownload.style.opacity = '1';

      // Add ready class for animation
      btnDownload.classList.add('isReady');

      // Set click handler to FORCE download (not open in browser)
      btnDownload.onclick = async (e) => {
        e.preventDefault();
        console.log("Download button clicked!");
        try {
          console.log("📥 Downloading video via blob...");
          // Fetch video as blob to force download
          const response = await fetch(url);
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);

          // Create temporary download link
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = `tiktok-captions-${Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Clean up object URL
          window.URL.revokeObjectURL(objectUrl);
          console.log("✅ Download started!");
        } catch (e) {
          console.error("❌ Download error:", e);
          // Fallback: try direct link (will open in new tab)
          console.log("Falling back to direct link");
          window.open(url, '_blank');
        }
      };

      console.log("Download button enabled and visible!");
    } else {
      console.error("Download button element not found!");
    }
  }

  function setPreviewTitle(text) {
    if (previewText) previewText.textContent = text;
  }

  function setPreviewHint(text) {
    if (previewHint) previewHint.textContent = text;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================
  // Showcase Video Players
  // ===========================
  function initShowcasePlayers() {
    const buttons = document.querySelectorAll(".miniPlay[data-play]");
    const vids = {
      nocaptions: document.getElementById("miniNoCaptions"),
      withcaptions: document.getElementById("miniWithCaptions")
    };
    const tiles = {
      nocaptions: vids.nocaptions?.closest('.miniVid'),
      withcaptions: vids.withcaptions?.closest('.miniVid')
    };

    if (!buttons.length || !vids.nocaptions || !vids.withcaptions) {
      console.log("Showcase videos not found on this page");
      return;
    }

    // No loop by default, ensure audio is enabled
    Object.values(vids).forEach((v) => {
      if (v) {
        v.loop = false;
        v.muted = false; // Ensure audio plays
      }
    });

    function setPlaying(key, on) {
      const tile = tiles[key];
      const btn = document.querySelector(`.miniPlay[data-play="${key}"]`);
      if (tile) tile.classList.toggle("isPlaying", !!on);
      if (btn) btn.textContent = on ? "❚❚" : "▶";
    }

    function stopAll() {
      Object.entries(vids).forEach(([key, v]) => {
        try { v?.pause(); } catch { }
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
          v.play().then(() => setPlaying(key, true)).catch(() => { });
        }
      });
    });

    // Sync UI with actual playback state
    Object.entries(vids).forEach(([key, v]) => {
      v?.addEventListener("play", () => setPlaying(key, true));
      v?.addEventListener("pause", () => setPlaying(key, false));
      v?.addEventListener("ended", () => setPlaying(key, false));

      // Hide loading icon when video loads
      v?.addEventListener("loadeddata", () => {
        const tile = tiles[key];
        if (tile) {
          tile.classList.add("hasLoaded");
          // Hide inline fallback icon
          const inlineIcon = tile.querySelector('div[style*="position: absolute"]');
          if (inlineIcon) inlineIcon.style.display = 'none';
        }
      });
    });
  }

  // Initialize showcase players when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShowcasePlayers);
  } else {
    initShowcasePlayers();
  }
})();
