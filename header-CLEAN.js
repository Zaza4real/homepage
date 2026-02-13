// Shared header behavior - CLEAN & SIMPLE VERSION
(() => {
  "use strict";
  
  const AUTH_TOKEN_KEY = "lypo_token_v1";
  
  // Cache authentication state
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
  const isAuthed = !!token;
  
  // Cache DOM queries
  const authBtn = document.querySelector(".headerAuthBtn");
  const btnLabel = authBtn?.querySelector(".btnLabel");
  const logoLink = document.querySelector(".logoWrap");
  const tabs = document.querySelectorAll(".tabBtn");
  
  // Make logo always go to homepage
  if (logoLink) logoLink.setAttribute("href", "index.html");
  
  // Detect current page
  const path = location.pathname.toLowerCase();
  const page = path.split('/').pop() || 'index.html';
  const isDashboard = page === "dashboard.html";
  const isAuth = page === "auth.html";
  const isHome = page === "index.html" || page === "" || path === "/";
  
  // Page-to-tab mapping
  const pageTabMap = {
    "features.html": '[data-href="features.html"]',
    "support.html": '[data-href="support.html"]',
    "blog.html": '[data-href="blog.html"]',
    "about.html": '[data-href="about.html"]'
  };
  
  // Remove all active states first
  tabs.forEach(tab => tab.classList.remove("isActive"));
  
  // Highlight current page tab
  const tabSelector = pageTabMap[page];
  if (tabSelector) {
    const activeTab = document.querySelector(tabSelector);
    if (activeTab) activeTab.classList.add("isActive");
  } else if (isHome) {
    const toolsBtn = document.getElementById('toolsBtn');
    if (toolsBtn) toolsBtn.classList.add("isActive");
  }
  
  // Auth button setup
  if (authBtn && btnLabel) {
    const targetText = isAuthed ? "Dashboard" : "Login";
    const targetPage = isAuthed ? "dashboard.html" : "auth.html";
    
    if (btnLabel.textContent !== targetText) {
      btnLabel.textContent = targetText;
    }
    
    authBtn.classList.toggle("isActive", isAuthed && isDashboard);
    authBtn.classList.toggle("isActive", !isAuthed && isAuth);
    authBtn.setAttribute("data-target", targetPage);
    
    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = authBtn.getAttribute("data-target");
      if (target) location.href = target;
    }, { passive: false, once: false });
  }
  
  // Tab navigation
  if (!isHome && tabs.length) {
    tabs.forEach((btn) => {
      if (btn.id === 'toolsBtn') return; // Skip Tools button
      
      btn.addEventListener("click", () => {
        const href = btn.getAttribute("data-href");
        if (href) {
          location.href = href;
        } else {
          const tab = btn.getAttribute("data-tab") || "home";
          location.href = `index.html?tab=${encodeURIComponent(tab)}`;
        }
      }, { passive: true });
    });
  }
  
  // Force style calculation
  if (authBtn) void authBtn.offsetHeight;
})();

// ========================================
// TOOLS DROPDOWN - WORKS ON DESKTOP + MOBILE
// ========================================

(function() {
  'use strict';
  
  const toolsBtn = document.getElementById('toolsBtn');
  const toolsMenu = document.getElementById('toolsMenu');
  
  if (!toolsBtn || !toolsMenu) {
    console.error('❌ Dropdown elements not found');
    return;
  }
  
  let isOpen = false;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // SHOW MENU - Simple and clean
  function show() {
    isOpen = true;
    toolsMenu.style.display = 'block';
    toolsMenu.style.visibility = 'visible';
    toolsMenu.style.opacity = '1';
    toolsMenu.style.pointerEvents = 'auto';
    toolsMenu.removeAttribute('hidden');
    toolsBtn.setAttribute('aria-expanded', 'true');
    console.log('✅ Menu opened');
  }
  
  // HIDE MENU - Simple and clean
  function hide() {
    isOpen = false;
    toolsMenu.style.display = 'none';
    toolsMenu.style.visibility = 'hidden';
    toolsMenu.style.opacity = '0';
    toolsMenu.style.pointerEvents = 'none';
    toolsMenu.setAttribute('hidden', '');
    toolsBtn.setAttribute('aria-expanded', 'false');
    console.log('✅ Menu closed');
  }
  
  // TOGGLE
  function toggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    isOpen ? hide() : show();
  }
  
  // EVENT HANDLERS
  
  // Desktop: Simple click
  toolsBtn.addEventListener('click', function(e) {
    console.log('🖱️ Click detected');
    if (!isMobile) {
      toggle(e);
    }
  }, false);
  
  // Mobile: Touch events
  if (isMobile) {
    toolsBtn.addEventListener('touchend', function(e) {
      console.log('📱 Touch detected');
      e.preventDefault();
      e.stopPropagation();
      toggle(e);
    }, { passive: false });
  }
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (isOpen && !toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) {
      hide();
    }
  }, true);
  
  // Close on mobile touch outside
  if (isMobile) {
    document.addEventListener('touchend', function(e) {
      if (isOpen && !toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) {
        hide();
      }
    }, { passive: true, capture: true });
  }
  
  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      hide();
      toolsBtn.focus();
    }
  });
  
  // Initial state
  hide();
  
  console.log('✅ Dropdown ready - ' + (isMobile ? 'MOBILE mode' : 'DESKTOP mode'));
})();
