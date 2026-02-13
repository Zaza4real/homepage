/* ========================================
   MOBILE HEADER - HAMBURGER MENU
   Professional mobile navigation without horizontal scrolling
   ======================================== */

(() => {
  // Only run on mobile devices
  if (window.innerWidth > 768) return;
  
  let mobileMenuBtn = null;
  let mobileMenuOverlay = null;
  let isMenuOpen = false;
  
  // Initialize mobile menu
  function initMobileMenu() {
    console.log('🍔 Initializing mobile hamburger menu');
    
    // Find header
    const header = document.querySelector('.header');
    if (!header) {
      console.error('❌ Header not found');
      return;
    }
    
    // Create hamburger button
    createHamburgerButton(header);
    
    // Create mobile menu overlay
    createMobileMenuOverlay();
    
    // Attach event listeners
    attachEventListeners();
    
    console.log('✅ Mobile menu initialized');
  }
  
  // Create hamburger button
  function createHamburgerButton(header) {
    const headerRight = header.querySelector('.headerRight');
    if (!headerRight) {
      console.error('❌ headerRight not found');
      return;
    }
    
    // Create button
    mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.id = 'mobileMenuBtn';
    mobileMenuBtn.setAttribute('type', 'button');
    mobileMenuBtn.setAttribute('aria-label', 'Menu');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    
    // Create hamburger icon (3 lines) + MENU text
    mobileMenuBtn.innerHTML = `
      <div class="hamburgerIcon">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="menuText">MENU</span>
    `;
    
    // Insert before auth button
    const authBtn = headerRight.querySelector('.headerAuthBtn');
    if (authBtn) {
      headerRight.insertBefore(mobileMenuBtn, authBtn);
    } else {
      headerRight.appendChild(mobileMenuBtn);
    }
    
    console.log('✅ Hamburger button created');
  }
  
  // Create mobile menu overlay
  function createMobileMenuOverlay() {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Get auth state
    const token = localStorage.getItem('lypo_token_v1');
    const isLoggedIn = !!token;
    
    // Create overlay
    mobileMenuOverlay = document.createElement('div');
    mobileMenuOverlay.id = 'mobileMenuOverlay';
    
    // Build menu content
    mobileMenuOverlay.innerHTML = `
      <div class="mobileMenuContent">
        <!-- Main Navigation -->
        <a href="index.html" class="mobileMenuItem ${currentPage === 'index.html' ? 'isActive' : ''}">
          Home
        </a>
        <a href="blog.html" class="mobileMenuItem ${currentPage === 'blog.html' ? 'isActive' : ''}">
          Blog
        </a>
        <a href="features.html" class="mobileMenuItem ${currentPage === 'features.html' ? 'isActive' : ''}">
          Features
        </a>
        <a href="about.html" class="mobileMenuItem ${currentPage === 'about.html' ? 'isActive' : ''}">
          About
        </a>
        <a href="support.html" class="mobileMenuItem ${currentPage === 'support.html' ? 'isActive' : ''}">
          Support
        </a>
        
        <!-- Tools Section -->
        <div class="mobileToolsSection">
          <div class="mobileToolsTitle">Tools</div>
          
          <a href="index.html" class="mobileTool">
            <div class="mobileToolInfo">
              <div class="mobileToolName">Video Translator</div>
              <div class="mobileToolDesc">Translate & dub videos with AI</div>
            </div>
          </a>
          
          <a href="tiktok-captions.html" class="mobileTool">
            <div class="mobileToolInfo">
              <div class="mobileToolName">TikTok Captions</div>
              <div class="mobileToolDesc">Auto-generate viral captions</div>
            </div>
          </a>
          
          <a href="kling-video.html" class="mobileTool">
            <div class="mobileToolInfo">
              <div class="mobileToolName">Kling AI Video</div>
              <div class="mobileToolDesc">Generate AI videos from text/image</div>
            </div>
          </a>
          
          <a href="voiceover.html" class="mobileTool">
            <div class="mobileToolInfo">
              <div class="mobileToolName">AI Voiceover</div>
              <div class="mobileToolDesc">Text-to-speech with natural voices</div>
            </div>
          </a>
        </div>
        
        <!-- Auth Button -->
        ${isLoggedIn 
          ? '<a href="dashboard.html" class="mobileMenuItem">Dashboard</a>'
          : '<a href="auth.html" class="mobileMenuItem">Login / Sign up</a>'
        }
      </div>
    `;
    
    // Add to body
    document.body.appendChild(mobileMenuOverlay);
    
    console.log('✅ Mobile menu overlay created');
  }
  
  // Attach event listeners
  function attachEventListeners() {
    if (!mobileMenuBtn || !mobileMenuOverlay) {
      console.error('❌ Menu elements not found');
      return;
    }
    
    // Toggle menu on button click
    mobileMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    
    // Close menu on overlay click
    mobileMenuOverlay.addEventListener('click', (e) => {
      // Only close if clicking the overlay itself, not menu items
      if (e.target === mobileMenuOverlay || e.target.classList.contains('mobileMenuContent')) {
        closeMenu();
      }
    });
    
    // Close menu on any menu item click
    const menuItems = mobileMenuOverlay.querySelectorAll('.mobileMenuItem, .mobileTool');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        closeMenu();
      });
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    });
    
    console.log('✅ Event listeners attached');
  }
  
  // Toggle menu
  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  
  // Open menu
  function openMenu() {
    console.log('📂 Opening mobile menu');
    isMenuOpen = true;
    
    mobileMenuBtn.classList.add('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    
    mobileMenuOverlay.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  // Close menu
  function closeMenu() {
    console.log('📁 Closing mobile menu');
    isMenuOpen = false;
    
    mobileMenuBtn.classList.remove('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    
    mobileMenuOverlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
  
  // Re-check on resize (in case user rotates device)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      
      // Close menu if resized to desktop
      if (width > 768 && isMenuOpen) {
        closeMenu();
      }
      
      // Re-initialize if resized to mobile and menu doesn't exist
      if (width <= 768 && !mobileMenuBtn) {
        initMobileMenu();
      }
    }, 250);
  });
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
