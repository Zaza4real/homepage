// Performance Optimization Script
(function() {
  'use strict';
  
  // ========================================
  // 1. LAZY LOAD IMAGES
  // ========================================
  
  function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
    }
  }
  
  // ========================================
  // 2. PRELOAD CRITICAL RESOURCES
  // ========================================
  
  function preloadCritical() {
    const criticalAssets = [
      { href: '/style.css', as: 'style' },
      { href: '/header.js', as: 'script' },
      { href: '/script.js', as: 'script' }
    ];
    
    criticalAssets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset.href;
      link.as = asset.as;
      if (asset.as === 'script') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
  
  // ========================================
  // 3. DEBOUNCE RESIZE EVENTS
  // ========================================
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Optimize resize events
  if (window.addEventListener) {
    const debouncedResize = debounce(() => {
      // Trigger custom resize event
      window.dispatchEvent(new CustomEvent('optimizedResize'));
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
  }
  
  // ========================================
  // 4. REDUCE REFLOWS/REPAINTS
  // ========================================
  
  function optimizeAnimations() {
    // Use CSS containment for better performance
    const animatedElements = document.querySelectorAll('.orb, .miniWave, .spinner');
    animatedElements.forEach(el => {
      el.style.contain = 'layout style paint';
      el.style.willChange = 'transform, opacity';
    });
  }
  
  // ========================================
  // 5. PREFETCH NEXT PAGE
  // ========================================
  
  function prefetchNextPage() {
    const links = document.querySelectorAll('a[href^="/"], a[href^="index.html"], a[href^="blog.html"]');
    
    if ('IntersectionObserver' in window) {
      const linkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target;
            const href = link.getAttribute('href');
            
            if (href && !link.dataset.prefetched) {
              const prefetchLink = document.createElement('link');
              prefetchLink.rel = 'prefetch';
              prefetchLink.href = href;
              document.head.appendChild(prefetchLink);
              link.dataset.prefetched = 'true';
            }
          }
        });
      });
      
      links.forEach(link => linkObserver.observe(link));
    }
  }
  
  // ========================================
  // 6. REGISTER SERVICE WORKER
  // ========================================
  
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => {
            console.log('✅ Service Worker registered:', reg.scope);
          })
          .catch(err => {
            console.warn('❌ Service Worker registration failed:', err);
          });
      });
    }
  }
  
  // ========================================
  // 7. PERFORMANCE MONITORING
  // ========================================
  
  function monitorPerformance() {
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('⚠️ Long task detected:', entry.duration.toFixed(2) + 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Browser doesn't support longtask
      }
      
      // Log Core Web Vitals on page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('📊 Performance Metrics:');
            console.log('  - DOM Content Loaded:', perfData.domContentLoadedEventEnd.toFixed(0) + 'ms');
            console.log('  - Page Load:', perfData.loadEventEnd.toFixed(0) + 'ms');
            console.log('  - DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart + 'ms');
            console.log('  - TCP Connection:', perfData.connectEnd - perfData.connectStart + 'ms');
            console.log('  - Server Response:', perfData.responseEnd - perfData.requestStart + 'ms');
          }
        }, 0);
      });
    }
  }
  
  // ========================================
  // 8. CRITICAL CSS INLINE (if needed)
  // ========================================
  
  function loadNonCriticalCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/non-critical.css';
    link.media = 'print';
    link.onload = function() { this.media = 'all'; };
    document.head.appendChild(link);
  }
  
  // ========================================
  // INITIALIZE ALL OPTIMIZATIONS
  // ========================================
  
  function init() {
    // Run immediately
    optimizeAnimations();
    monitorPerformance();
    registerServiceWorker();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        lazyLoadImages();
        prefetchNextPage();
      });
    } else {
      lazyLoadImages();
      prefetchNextPage();
    }
    
    console.log('⚡ Performance optimizations loaded');
  }
  
  init();
})();
