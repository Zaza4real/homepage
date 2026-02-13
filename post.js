// OPTIMIZED & SECURED Post loader
(() => {
  "use strict";

  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const CACHE_KEY_PREFIX = "lypo_post_cache_v2_";
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Cache DOM queries
  const titleEl = document.getElementById("postTitle");
  const metaEl = document.getElementById("postMeta");
  const bodyEl = document.getElementById("postBody");
  const mediaEl = document.getElementById("postMedia");

  if (!titleEl || !bodyEl) return; // Guard clause

  // SECURITY: Comprehensive HTML escaping
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;"
  };
  const esc = (s) => String(s || "").replace(/[&<>"'\/]/g, c => escapeMap[c]);

  // Sanitize URLs
  const sanitizeUrl = (url) => {
    if (!url) return "";
    const urlStr = String(url).trim().toLowerCase();
    if (urlStr.startsWith("javascript:") ||
      urlStr.startsWith("data:") ||
      urlStr.startsWith("vbscript:") ||
      urlStr.startsWith("file:")) {
      return "";
    }
    return String(url).trim();
  };

  // Fast date formatting
  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "";
    }
  };

  // SECURITY: Process and sanitize HTML content
  function processContent(html) {
    if (!html || typeof html !== 'string') return "";

    // For blog posts from the database (admin-created content),
    // we trust the HTML but strip dangerous elements as a safety measure

    let processed = html;

    // Remove any script tags
    processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove inline event handlers (onclick, onerror, etc.)
    processed = processed.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    processed = processed.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: URLs
    processed = processed.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

    // Return the HTML for proper rendering
    return processed;
  }

  // Cache helpers with validation
  function getCached(slug) {
    if (!slug) return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + slug);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
        localStorage.removeItem(CACHE_KEY_PREFIX + slug);
        return null;
      }

      const age = Date.now() - (parsed.timestamp || 0);

      if (age < CACHE_DURATION) {
        return parsed.data;
      }

      localStorage.removeItem(CACHE_KEY_PREFIX + slug);
      return null;
    } catch {
      return null;
    }
  }

  function setCache(slug, data) {
    if (!slug || !data || typeof data !== 'object') return;

    try {
      localStorage.setItem(CACHE_KEY_PREFIX + slug, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: 2
      }));
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  }

  // Render post securely
  function renderPost(p) {
    if (!p || typeof p !== 'object') {
      titleEl.textContent = "Post not found";
      if (metaEl) metaEl.textContent = "";
      if (mediaEl) mediaEl.innerHTML = "";
      bodyEl.innerHTML = '<p class="mutedCell" role="alert">This post could not be found.</p>';
      return;
    }

    // Update page title securely
    const safeTitle = String(p.title || 'Post').trim();
    document.title = `${safeTitle} • LYPO Blog`;

    // Set content safely
    titleEl.textContent = safeTitle;
    if (metaEl) metaEl.textContent = p.published_at ? fmtDate(p.published_at) : "";

    // Media (cover & video) with security
    const mediaParts = [];
    if (p.cover_url) {
      const safeCoverUrl = sanitizeUrl(p.cover_url);
      if (safeCoverUrl && safeCoverUrl.startsWith('https://')) {
        mediaParts.push(`<div class="postCover"><img src="${esc(safeCoverUrl)}" alt="${esc(safeTitle)}" loading="lazy" decoding="async" crossorigin="anonymous" /></div>`);
      }
    }
    if (p.video_url) {
      const safeVideoUrl = sanitizeUrl(p.video_url);
      if (safeVideoUrl && (safeVideoUrl.startsWith('https://') || safeVideoUrl.startsWith('http://'))) {
        mediaParts.push(`<div class="postVideo"><video controls preload="metadata" src="${esc(safeVideoUrl)}" crossorigin="anonymous"></video></div>`);
      }
    }
    if (mediaEl) mediaEl.innerHTML = mediaParts.join("");

    // Body content with security
    const content = processContent(p.content_html) || (p.excerpt ? `<p>${esc(p.excerpt)}</p>` : "");
    bodyEl.innerHTML = content;
  }

  // Load post with caching
  async function load() {
    // Get slug from URL
    const qs = new URLSearchParams(location.search || "");
    const slug = qs.get("slug") || "";

    if (!slug) {
      titleEl.textContent = "No post specified";
      bodyEl.innerHTML = '<p class="mutedCell" role="alert">Please select a post to view.</p>';
      return;
    }

    // Validate slug (prevent path traversal)
    const safeSlug = String(slug).trim();
    if (!safeSlug || safeSlug.includes('..') || safeSlug.includes('/') || safeSlug.includes('\\')) {
      titleEl.textContent = "Invalid post";
      bodyEl.innerHTML = '<p class="mutedCell" role="alert">Invalid post identifier.</p>';
      return;
    }

    // Show loading state
    titleEl.textContent = "Loading...";
    bodyEl.innerHTML = '<p class="mutedCell" role="status">Loading post...</p>';

    // Try cache first
    const cached = getCached(safeSlug);
    if (cached) {
      renderPost(cached);
      // Fetch in background to update
      fetchAndCache(safeSlug, true);
      return;
    }

    // No cache, fetch with loading state
    await fetchAndCache(safeSlug, false);
  }

  // Fetch from API with security
  async function fetchAndCache(slug, silent = false) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(`${BACKEND_BASE_URL}/api/blog/posts/${encodeURIComponent(slug)}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
          // Removed 'X-Requested-With' - causes CORS error with backend
        },
        credentials: 'omit',
        mode: 'cors',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`HTTP ${res.status}`);
      }

      // Validate content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response type');
      }

      const data = await res.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      const post = data.post;

      if (!post || typeof post !== 'object') {
        if (!silent) renderPost(null);
        return;
      }

      // Cache it
      setCache(slug, post);

      // Render if not silent
      if (!silent) {
        renderPost(post);
      }

    } catch (e) {
      console.error("Post load error:", e);

      if (silent) return;

      titleEl.textContent = "Error loading post";

      const errorMsg = e.message === 'Post not found'
        ? 'This post could not be found.'
        : e.name === 'AbortError'
          ? 'Request timed out.'
          : 'Could not load post.';

      bodyEl.innerHTML = `
        <p class="mutedCell" role="alert">
          ⚠️ ${esc(errorMsg)} 
          <button onclick="location.reload()" style="margin-left:8px; padding:4px 12px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); border-radius:6px; color:inherit; cursor:pointer; font:inherit;">
            Retry
          </button>
        </p>
      `;
    }
  }

  // Start loading
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", load, { once: true, passive: true });
  } else {
    load();
  }
})();
