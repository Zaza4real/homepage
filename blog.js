// OPTIMIZED & SECURED Blog loader
(() => {
  "use strict";
  
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const CACHE_KEY = "lypo_blog_cache_v2"; // Bumped version
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache (reduces backend load)
  
  const list = document.getElementById("blogList");
  if (!list) return; // Guard clause

  // SECURITY: Strict HTML escaping with ALL special chars
  const escapeMap = { 
    "&": "&amp;", 
    "<": "&lt;", 
    ">": "&gt;", 
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;"
  };
  const esc = (s) => String(s || "").replace(/[&<>"'\/]/g, c => escapeMap[c]);

  // Sanitize URLs - prevent javascript: and data: URIs
  const sanitizeUrl = (url) => {
    if (!url) return "";
    const urlStr = String(url).trim().toLowerCase();
    // Block dangerous protocols
    if (urlStr.startsWith("javascript:") || 
        urlStr.startsWith("data:") || 
        urlStr.startsWith("vbscript:")) {
      return "";
    }
    return String(url).trim();
  };

  // Fast date formatting with error handling
  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "";
    }
  };

  // Cache management with integrity check
  function getCached() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data)) {
        // Corrupted cache
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      const age = Date.now() - (parsed.timestamp || 0);
      
      if (age < CACHE_DURATION) {
        return parsed.data;
      }
      
      // Expired
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (e) {
      // Corrupted or quota exceeded
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
      return null;
    }
  }

  // Save to cache with error handling
  function setCache(data) {
    if (!Array.isArray(data)) return;
    
    try {
      // Validate data before caching
      const validData = data.filter(p => p && typeof p === 'object');
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: validData,
        timestamp: Date.now(),
        version: 2
      }));
    } catch (e) {
      // Quota exceeded or other error - clear old cache
      console.warn("Cache write failed, clearing old cache:", e);
      try {
        // Clear old blog caches
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('lypo_blog_') || key.startsWith('lypo_post_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }
  }

  // Render posts with security and performance
  function renderPosts(posts) {
    if (!posts || !Array.isArray(posts) || !posts.length) {
      return '<div class="mutedCell" role="status">No posts yet.</div>';
    }

    // Limit to reasonable number
    const limitedPosts = posts.slice(0, 50);

    return limitedPosts.map(p => {
      // Validate post object
      if (!p || typeof p !== 'object' || !p.slug || !p.title) {
        return '';
      }

      // SECURITY: Sanitize all fields
      const safeSlug = encodeURIComponent(String(p.slug || '').trim());
      const safeTitle = esc(p.title);
      const safeExcerpt = esc(p.excerpt || "");
      const safeDate = esc(fmtDate(p.published_at));
      const safeCoverUrl = sanitizeUrl(p.cover_url);
      
      // Only include cover if URL is safe and starts with https
      const cover = safeCoverUrl && safeCoverUrl.startsWith('https://') 
        ? `<div class="blogCover"><img src="${esc(safeCoverUrl)}" alt="${safeTitle}" loading="lazy" decoding="async" crossorigin="anonymous" /></div>` 
        : "";
      
      return `
        <a class="blogItem" href="post.html?slug=${safeSlug}" rel="noopener" data-post="${safeSlug}">
          ${cover}
          <div class="blogMeta">
            <div class="blogTitle">${safeTitle}</div>
            <div class="blogSub">${safeExcerpt}</div>
            ${safeDate ? `<div class="blogDate">${safeDate}</div>` : ''}
          </div>
        </a>
      `;
    }).filter(Boolean).join("");
  }

  // Load posts with cache
  async function load() {
    // Show loading state immediately
    list.innerHTML = '<div class="mutedCell" role="status" aria-live="polite">Loading posts...</div>';
    
    // Try cache first
    const cached = getCached();
    if (cached && cached.length > 0) {
      list.innerHTML = renderPosts(cached);
      // Fetch in background to update cache
      fetchAndCache(true);
      return;
    }

    // No cache, fetch with loading state
    await fetchAndCache(false);
  }

  // Fetch from API with security headers
  async function fetchAndCache(silent = false) {
    let timeoutId;
    try {
      const controller = new AbortController();
      // 45s timeout to handle Render cold starts (free tier spins down after inactivity)
      timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch(`${BACKEND_BASE_URL}/api/blog/posts`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection indicator
        },
        credentials: 'omit', // Don't send credentials for public API
        mode: 'cors',
        cache: 'no-cache' // Always get fresh data from server
      });
      
      if (timeoutId) clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Validate content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response type');
      }

      const data = await res.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      const posts = Array.isArray(data.posts) ? data.posts : [];
      
      // Cache valid posts only
      if (posts.length > 0) {
        setCache(posts);
      }
      
      // Render if not silent
      if (!silent) {
        list.innerHTML = renderPosts(posts);
      }
      
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("Blog load error:", e);
      
      // Don't show error if silent (background refresh)
      if (silent) return;
      
      // Show user-friendly error with retry
      const errorMsg = e.name === 'AbortError' 
        ? '⏱ Server is waking up (free tier cold start). Please wait and retry in 10 seconds...' 
        : '⚠️ Could not load posts. Please try again.';
      
      list.innerHTML = `
        <div class="mutedCell" role="alert">
          ${esc(errorMsg)} 
          <button onclick="location.reload()" style="margin-left:8px; padding:4px 12px; background:rgba(124,58,237,.9); border:1px solid rgba(124,58,237,1); border-radius:6px; color:#fff; cursor:pointer; font:inherit; font-weight:600;">
            Retry Now
          </button>
        </div>
      `;
    }
  }

  // Start loading - check if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", load, { once: true, passive: true });
  } else {
    load();
  }
  
  // Prefetch post pages on hover (performance optimization)
  list.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a[data-post]');
    if (link && link.href) {
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = link.href;
      document.head.appendChild(prefetchLink);
    }
  }, { passive: true, capture: true });
})();
