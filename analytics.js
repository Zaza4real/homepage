// Google Analytics 4 (GA4) Configuration
// Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 Measurement ID

(() => {
  // IMPORTANT: Replace this with your actual GA4 Measurement ID
  // Get it from: https://analytics.google.com/
  // Format: G-XXXXXXXXXX
  const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // TODO: Replace with your real ID

  // Only load analytics in production (not localhost)
  const isProduction = !["localhost", "127.0.0.1"].includes(location.hostname);
  
  if (!isProduction) {
    console.log("📊 Google Analytics disabled on localhost");
    // Create mock gtag for development
    window.gtag = function() {
      console.log("📊 [DEV] GA Event:", arguments);
    };
    window.dataLayer = window.dataLayer || [];
    return;
  }

  // Load Google Analytics script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Configure GA4
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: "SameSite=None;Secure"
  });

  console.log("📊 Google Analytics loaded:", GA_MEASUREMENT_ID);
})();

// Helper function to track events
window.trackEvent = function(eventName, eventParams = {}) {
  if (typeof gtag === "function") {
    gtag("event", eventName, eventParams);
    console.log("📊 Event tracked:", eventName, eventParams);
  }
};

// Helper function to track page views
window.trackPageView = function(pagePath, pageTitle) {
  if (typeof gtag === "function") {
    gtag("event", "page_view", {
      page_path: pagePath || location.pathname,
      page_title: pageTitle || document.title
    });
    console.log("📊 Page view tracked:", pagePath || location.pathname);
  }
};

// Helper function to track conversions
window.trackConversion = function(conversionName, value = null, currency = "USD") {
  if (typeof gtag === "function") {
    const params = { event_category: "conversion" };
    if (value !== null) {
      params.value = value;
      params.currency = currency;
    }
    gtag("event", conversionName, params);
    console.log("📊 Conversion tracked:", conversionName, params);
  }
};

// Auto-track common user interactions
document.addEventListener("DOMContentLoaded", () => {
  // Track authenticated state
  const token = localStorage.getItem("lypo_token_v1");
  if (token) {
    trackEvent("user_authenticated", { method: "page_load" });
  }

  // Track outbound links
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.href && !link.href.includes(location.hostname)) {
      trackEvent("outbound_link", {
        link_url: link.href,
        link_text: link.textContent.trim().substring(0, 50)
      });
    }
  });

  // Track button clicks (main CTAs)
  document.addEventListener("click", (e) => {
    const button = e.target.closest("button, .btnPrimary, .btnGhost");
    if (button && button.textContent) {
      const btnText = button.textContent.trim();
      if (btnText && !["Login", "Dashboard", "Logout"].includes(btnText)) {
        trackEvent("button_click", {
          button_text: btnText.substring(0, 50),
          button_id: button.id || "unknown"
        });
      }
    }
  });

  console.log("📊 Analytics auto-tracking enabled");
});
