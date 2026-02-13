(() => {
  "use strict";

  const BACKEND_BASE = "https://lypo-backend.onrender.com";
  const KLING_COST_PER_SECOND = 20; // 20 credits per second
  const AUTH_TOKEN_KEY = "lypo_token_v1";

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }

  function initApp() {
    // DOM Elements
    const modeBtns = document.querySelectorAll("[data-mode]");
    const imageInputSection = document.getElementById("imageInputSection");
    const imageInput = document.getElementById("imageInput");
    const imageInputBtn = document.getElementById("imageInputBtn");
    const imageFileName = document.getElementById("imageFileName");
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewImg = document.getElementById("imagePreviewImg");
    
    const promptInput = document.getElementById("promptInput");
    const promptHint = document.getElementById("promptHint");
    const charCount = document.getElementById("charCount");
    
    const advancedToggle = document.getElementById("advancedToggle");
    const advancedSettings = document.getElementById("advancedSettings");
    
    const durationSelect = document.getElementById("durationSelect");
    const aspectBtns = document.querySelectorAll("[data-ratio]");
    
    const creditsBalance = document.getElementById("creditsBalance");
    
    const generateBtn = document.getElementById("generateBtn");
    const progressSection = document.getElementById("progressSection");
    const progressText = document.getElementById("progressText");
    
    const outputSection = document.getElementById("outputSection");
    const outputVideo = document.getElementById("outputVideo");
    const downloadBtn = document.getElementById("downloadBtn");
    const newVideoBtn = document.getElementById("newVideoBtn");

    // State
    let currentMode = "text";
    let selectedImage = null;
    let selectedAspectRatio = "16:9";
    let userBalance = 0;
    let currentJobId = null;
    let statusCheckInterval = null;

    // Debug: Check if element exists
    console.log("creditsBalance element:", creditsBalance);

    // Initialize
    init();

  function init() {
    checkAuth();
    setupEventListeners();
    updateCharCount();
  }

  // Check authentication and load credits
  async function checkAuth() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    console.log("🔍 Checking auth...");
    console.log("Token exists:", !!token);
    
    if (!token) {
      console.warn("⚠️ No auth token - user not logged in");
      generateBtn.disabled = true;
      const btnLabel = document.getElementById("generateBtnLabel");
      if (btnLabel) {
        btnLabel.textContent = "Login Required";
      }
      if (creditsBalance) {
        creditsBalance.textContent = "Login to see balance";
        creditsBalance.style.cursor = "pointer";
        creditsBalance.onclick = () => window.location.href = "auth.html";
      }
      return;
    }

    try {
      console.log("🌐 Fetching user data from /api/auth/me...");
      const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📡 Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ User data loaded:", data);
        
        // Backend returns balance nested in user object - same as TikTok Captions
        const balance = data.user?.balance ?? data.user?.credits ?? 0;
        console.log("💰 Balance value:", balance);
        console.log("Balance type:", typeof balance);
        
        if (data.user && typeof balance === "number") {
          console.log("💰 Setting balance to:", balance);
          userBalance = balance;
          if (creditsBalance) {
            creditsBalance.textContent = `${balance} Credits`;
            creditsBalance.style.cursor = "pointer";
            creditsBalance.onclick = () => {
              window.location.href = "index.html#buycredits";
            };
          }
        } else {
          console.warn("⚠️ No balance found in response, setting to 0");
          userBalance = 0;
          if (creditsBalance) {
            creditsBalance.textContent = "0 Credits";
          }
        }
        
        updateGenerateButton();
      } else {
        console.error("❌ Failed to fetch user data:", res.status);
        const errorText = await res.text();
        console.error("Error response:", errorText);
        
        if (creditsBalance) {
          creditsBalance.textContent = "Balance: Error";
        }
        
        // If unauthorized, clear token
        if (res.status === 401) {
          console.warn("⚠️ Token invalid - clearing and redirecting");
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setTimeout(() => {
            window.location.href = "auth.html";
          }, 2000);
        }
      }
    } catch (e) {
      console.error("❌ Failed to load credits:", e);
      if (creditsBalance) {
        creditsBalance.textContent = "Balance: Error";
      }
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Mode switching
    modeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        switchMode(mode);
      });
    });

    // Image input
    imageInputBtn.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageSelect);

    // Prompt input
    promptInput.addEventListener("input", () => {
      updateCharCount();
      validateForm();
    });

    // Duration change
    durationSelect.addEventListener("change", () => {
      updateCost();
      validateForm();
    });

    // Advanced settings toggle
    advancedToggle.addEventListener("click", () => {
      const isOpen = advancedSettings.style.display === "block";
      advancedSettings.style.display = isOpen ? "none" : "block";
      const arrow = advancedToggle.querySelector(".toggleArrow");
      if (arrow) {
        arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
      }
    });

    // Aspect ratio selection
    aspectBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        aspectBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAspectRatio = btn.dataset.ratio;
      });
    });

    // Generate button
    generateBtn.addEventListener("click", handleGenerate);

    // New video button
    newVideoBtn.addEventListener("click", resetForm);
  }

  // Switch between text and image modes
  function switchMode(mode) {
    currentMode = mode;
    
    modeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    if (mode === "image") {
      imageInputSection.style.display = "block";
      promptHint.textContent = "Describe how you want the image to move/animate";
    } else {
      imageInputSection.style.display = "none";
      promptHint.textContent = "Describe the video you want to create";
      selectedImage = null;
      imageFileName.textContent = "PNG, JPEG, or WebP";
      imagePreview.style.display = "none";
    }

    validateForm();
  }

  // Handle image selection
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      alert("Please upload a PNG, JPEG, or WebP image");
      return;
    }

    selectedImage = file;
    imageFileName.innerHTML = `<strong style="color: rgba(255,255,255,0.9);">${file.name}</strong>`;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewImg.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);

    validateForm();
  }

  // Update character count
  function updateCharCount() {
    charCount.textContent = promptInput.value.length;
  }

  // Calculate current cost
  function getCurrentCost() {
    const duration = parseInt(durationSelect.value) || 10;
    return duration * KLING_COST_PER_SECOND;
  }

  // Update cost display
  function updateCost() {
    const cost = getCurrentCost();
    const btnLabel = document.getElementById("generateBtnLabel");
    if (btnLabel) {
      btnLabel.textContent = `Generate Video (${cost} credits)`;
    }
  }

  // Validate form and update button state
  function validateForm() {
    const hasPrompt = promptInput.value.trim().length > 0;
    const hasImage = currentMode === "text" || selectedImage !== null;
    const cost = getCurrentCost();
    const hasCredits = userBalance >= cost;

    generateBtn.disabled = !(hasPrompt && hasImage && hasCredits);

    const btnLabel = document.getElementById("generateBtnLabel");
    
    if (!hasCredits) {
      btnLabel.textContent = `Insufficient Credits (need ${cost})`;
    } else if (!hasPrompt) {
      btnLabel.textContent = "Enter Prompt";
    } else if (currentMode === "image" && !hasImage) {
      btnLabel.textContent = "Upload Image";
    } else {
      // Just update the cost text, don't call validateForm again
      btnLabel.textContent = `Generate Video (${cost} credits)`;
    }
  }

  function updateGenerateButton() {
    updateCost();
    validateForm();
  }

  // Handle video generation
  async function handleGenerate() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      alert("Please login to generate videos");
      return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert("Please enter a prompt");
      return;
    }

    if (currentMode === "image" && !selectedImage) {
      alert("Please upload an image");
      return;
    }

    // Show progress
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.5';
    generateBtn.style.cursor = 'not-allowed';
    generateBtn.classList.add("generating");
    
    // Show generating modal
    if (window.GeneratingModal) {
      window.GeneratingModal.show(
        "Generating AI Video...",
        "Kling AI is creating your cinematic video.<br>This may take 3-5 minutes."
      );
    }
    
    outputSection.style.display = "none";
    progressText.textContent = "Uploading...";
    
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.classList.add("active");
    }

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("mode", currentMode);
      formData.append("duration", durationSelect.value);
      formData.append("aspectRatio", selectedAspectRatio);
      
      if (currentMode === "image" && selectedImage) {
        formData.append("image", selectedImage);
      }

      // Send to backend
      const res = await fetch(`${BACKEND_BASE}/api/kling-video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Generation failed");
      }

      const data = await res.json();
      currentJobId = data.jobId;

      progressText.textContent = "🎬 Generating video... Please do not refresh or close this page.";
      const btnLabel = document.getElementById("generateBtnLabel");
      if (btnLabel) {
        btnLabel.textContent = "🎬 Generating... Please wait";
      }

      // Update credits
      const cost = getCurrentCost();
      userBalance -= cost;
      if (creditsBalance) {
        creditsBalance.textContent = `${userBalance} Credits`;
      }

      // Start polling for status
      pollStatus();

    } catch (e) {
      console.error("Generation error:", e);
      alert(e.message || "Failed to generate video");
      resetProgress();
      validateForm();
    }
  }

  // Poll for generation status
  async function pollStatus() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    statusCheckInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/kling-video/${currentJobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Status check failed");

        const data = await res.json();
        
        // Update progress
        if (data.status === "processing") {
          progressText.textContent = "🎬 Generating video... Please do not refresh or close this page.";
        } else if (data.status === "succeeded") {
          clearInterval(statusCheckInterval);
          handleSuccess(data.output);
        } else if (data.status === "failed") {
          clearInterval(statusCheckInterval);
          throw new Error(data.error || "Generation failed");
        }

      } catch (e) {
        clearInterval(statusCheckInterval);
        console.error("Status check error:", e);
        alert("Failed to check status. Please refresh and check your dashboard.");
        resetProgress();
      }
    }, 3000); // Check every 3 seconds
  }

  // Handle successful generation
  function handleSuccess(videoUrl) {
    progressText.textContent = "✅ Complete!";
    
    // Remove generating state
    generateBtn.classList.remove("generating");
    
    // Hide generating modal with success sound
    if (window.GeneratingModal) {
      window.GeneratingModal.hide(true);
    }
    
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.classList.remove("active");
    }

    setTimeout(() => {
      outputSection.style.display = "block";
      
      outputVideo.src = videoUrl;
      
      // Set download button to force download (not open in browser)
      downloadBtn.onclick = async (e) => {
        e.preventDefault();
        try {
          console.log("📥 Downloading video...");
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `kling-video-${Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          console.log("✅ Download started!");
        } catch (error) {
          console.error("❌ Download failed:", error);
          // Fallback to direct link
          window.open(videoUrl, '_blank');
        }
      };

      // Scroll to output
      outputSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 500);
  }

  // Reset progress
  function resetProgress() {
    progressText.textContent = "Ready";
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
    generateBtn.style.cursor = 'pointer';
    generateBtn.classList.remove("generating");
    
    // Hide generating modal (no sound on reset/error)
    if (window.GeneratingModal) {
      window.GeneratingModal.hide(false);
    }
    
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.classList.remove("active");
    }
  }

  // Reset form for new generation
  function resetForm() {
    promptInput.value = "";
    selectedImage = null;
    imageInput.value = "";
    imageFileName.textContent = "PNG, JPEG, or WebP";
    imagePreview.style.display = "none";
    outputSection.style.display = "none";
    outputVideo.src = "";
    
    updateCharCount();
    validateForm();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  } // End of initApp
})();
