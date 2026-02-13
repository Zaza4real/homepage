/**
 * LYPO Generating Modal - Mobile-First Edition
 * Shows a modal overlay during generation to prevent user actions
 */

(function() {
  'use strict';
  
  console.log('🚀 [MODAL] Script loading...');
  
  let modal = null;
  let savedScrollY = 0;

  // Play success sound
  function playSuccessSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (frequency, startTime, duration, fadeOutDuration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + duration - fadeOutDuration);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(523.25, now, 0.3, 0.2);
      playTone(659.25, now + 0.2, 0.5, 0.35);
      
      console.log('🔊 [MODAL] Success sound played');
    } catch (error) {
      console.log('❌ [MODAL] Sound error:', error);
    }
  }

  // Create modal element
  function createModal() {
    console.log('🔨 [MODAL] Creating modal element...');
    
    const modalEl = document.createElement('div');
    modalEl.className = 'generating-modal';
    modalEl.id = 'generatingModal';
    modalEl.innerHTML = `
      <div class="generating-modal-content">
        <div class="generating-modal-icon">
          <img src="favicon.png" alt="LYPO" class="generating-modal-logo" />
        </div>
        <h2 class="generating-modal-title" id="modalTitle">Generating...</h2>
        <p class="generating-modal-message" id="modalMessage">
          Your content is being processed by AI.<br>
          This may take a few moments.
        </p>
        <div class="generating-modal-spinner"></div>
        <div class="generating-modal-warning">
          ⚠️ Please do not close or refresh this page
        </div>
      </div>
    `;
    
    // Aggressive touch blocking for mobile
    const blockEvent = function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };
    
    modalEl.addEventListener('touchstart', blockEvent, { passive: false, capture: true });
    modalEl.addEventListener('touchmove', blockEvent, { passive: false, capture: true });
    modalEl.addEventListener('touchend', blockEvent, { passive: false, capture: true });
    modalEl.addEventListener('touchcancel', blockEvent, { passive: false, capture: true });
    modalEl.addEventListener('click', blockEvent, { capture: true });
    modalEl.addEventListener('mousedown', blockEvent, { capture: true });
    modalEl.addEventListener('wheel', blockEvent, { passive: false, capture: true });
    
    // Add to page
    if (document.body) {
      document.body.appendChild(modalEl);
      console.log('✅ [MODAL] Modal created and added to DOM');
    } else {
      console.log('⚠️ [MODAL] Body not ready, will retry...');
    }
    
    return modalEl;
  }

  // Initialize modal immediately
  function initModal() {
    if (!modal) {
      if (document.body) {
        modal = createModal();
        console.log('✅ [MODAL] Initialized');
      } else {
        console.log('⚠️ [MODAL] Waiting for body...');
        setTimeout(initModal, 50);
      }
    }
  }

  // Public API
  window.GeneratingModal = {
    show: function(title, message) {
      console.log('👁️ [MODAL] show() called');
      
      try {
        // Ensure modal exists
        if (!modal) {
          console.log('🔨 [MODAL] Modal not found, creating now...');
          modal = createModal();
        }
        
        if (!modal) {
          console.error('❌ [MODAL] Failed to create modal!');
          return;
        }
        
        // Update content
        const titleEl = document.getElementById('modalTitle');
        const messageEl = document.getElementById('modalMessage');
        
        if (titleEl && title) {
          titleEl.textContent = title;
        }
        if (messageEl && message) {
          messageEl.innerHTML = message;
        }
        
        // Save scroll position
        savedScrollY = window.scrollY || window.pageYOffset || 0;
        console.log('📍 [MODAL] Saved scroll:', savedScrollY);
        
        // Lock scrolling - AGGRESSIVE mobile approach
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100vh';
        
        // Disable ALL interactive elements
        let disabledCount = 0;
        document.querySelectorAll('button, input, textarea, select, a, [onclick], [tabindex]').forEach(el => {
          // Skip modal elements
          if (modal && modal.contains(el)) return;
          
          if (!el.hasAttribute('data-modal-disabled')) {
            el.setAttribute('data-modal-disabled', 'true');
            el.setAttribute('data-modal-was-disabled', el.disabled ? 'true' : 'false');
            el.disabled = true;
            el.style.pointerEvents = 'none';
            el.style.userSelect = 'none';
            disabledCount++;
          }
        });
        
        console.log(`🔒 [MODAL] Disabled ${disabledCount} elements`);
        
        // Show modal
        modal.classList.add('active');
        modal.style.display = 'flex';
        
        console.log('✅ [MODAL] Shown successfully');
        
      } catch (error) {
        console.error('❌ [MODAL] Error in show():', error);
      }
    },
    
    hide: function(playSound = true) {
      console.log('🙈 [MODAL] hide() called');
      
      try {
        if (!modal) {
          console.log('⚠️ [MODAL] Modal not found, nothing to hide');
          return;
        }
        
        // Play sound if requested
        if (playSound) {
          playSuccessSound();
        }
        
        // Hide modal
        modal.classList.remove('active');
        modal.style.display = 'none';
        
        // Unlock scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.height = '';
        
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        
        // Restore scroll position
        window.scrollTo(0, savedScrollY);
        console.log('📍 [MODAL] Restored scroll:', savedScrollY);
        
        // Re-enable all elements
        let enabledCount = 0;
        document.querySelectorAll('[data-modal-disabled]').forEach(el => {
          const wasDisabled = el.getAttribute('data-modal-was-disabled') === 'true';
          el.disabled = wasDisabled;
          el.style.pointerEvents = '';
          el.style.userSelect = '';
          el.removeAttribute('data-modal-disabled');
          el.removeAttribute('data-modal-was-disabled');
          enabledCount++;
        });
        
        console.log(`🔓 [MODAL] Enabled ${enabledCount} elements`);
        console.log('✅ [MODAL] Hidden successfully');
        
      } catch (error) {
        console.error('❌ [MODAL] Error in hide():', error);
      }
    },
    
    updateMessage: function(message) {
      const messageEl = document.getElementById('modalMessage');
      if (messageEl) {
        messageEl.innerHTML = message;
        console.log('📝 [MODAL] Message updated');
      }
    },
    
    updateTitle: function(title) {
      const titleEl = document.getElementById('modalTitle');
      if (titleEl) {
        titleEl.textContent = title;
        console.log('📝 [MODAL] Title updated');
      }
    },
    
    // Debug helper
    isInitialized: function() {
      return modal !== null;
    }
  };

  // Initialize ASAP
  if (document.readyState === 'loading') {
    console.log('⏳ [MODAL] DOM loading, waiting...');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('📄 [MODAL] DOMContentLoaded fired');
      initModal();
    });
  } else {
    console.log('⚡ [MODAL] DOM ready, initializing now');
    initModal();
  }
  
  // Fallback initialization
  window.addEventListener('load', function() {
    console.log('🌐 [MODAL] Window load event');
    if (!modal) {
      console.log('🔧 [MODAL] Fallback initialization');
      initModal();
    }
  });
  
  // Emergency initialization after 100ms
  setTimeout(function() {
    if (!modal) {
      console.log('⚠️ [MODAL] Emergency initialization (timeout)');
      initModal();
    }
  }, 100);

  console.log('✅ [MODAL] Script loaded, API exposed as window.GeneratingModal');
  
})();
