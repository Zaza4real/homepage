/**
 * BULLETPROOF MOBILE DROPDOWN FIX
 * This replaces the complex dropdown logic with something that ACTUALLY WORKS
 * Copy this entire file and replace header.js dropdown section (lines 100-227)
 */

// ========================================
// TOOLS DROPDOWN - SIMPLE & BULLETPROOF
// ========================================

(function() {
  const toolsBtn = document.getElementById('toolsBtn');
  const toolsMenu = document.getElementById('toolsMenu');
  
  if (!toolsBtn || !toolsMenu) return;
  
  let isOpen = false;
  
  // Simple toggle
  function toggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    isOpen = !isOpen;
    
    if (isOpen) {
      // OPEN
      toolsMenu.classList.add('show');
      toolsMenu.classList.remove('hide');
      toolsBtn.setAttribute('aria-expanded', 'true');
      console.log('✅ DROPDOWN OPEN');
    } else {
      // CLOSE
      toolsMenu.classList.remove('show');
      toolsMenu.classList.add('hide');
      toolsBtn.setAttribute('aria-expanded', 'false');
      console.log('❌ DROPDOWN CLOSED');
    }
  }
  
  // Button click - works on ALL devices
  toolsBtn.addEventListener('click', toggle);
  toolsBtn.addEventListener('touchend', toggle);
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (isOpen && !toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) {
      toggle();
    }
  });
  
  // Close on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      toggle();
    }
  });
  
  console.log('✅ Bulletproof dropdown initialized');
})();
