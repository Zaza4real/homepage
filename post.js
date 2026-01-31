(() => {
  const BACKEND_BASE_URL = "https://lypo-backend.onrender.com";
  const titleEl = document.getElementById("postTitle");
  const metaEl = document.getElementById("postMeta");
  const bodyEl = document.getElementById("postBody");
  const mediaEl = document.getElementById("postMedia");

  function esc(s){ return String(s||"").replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }
  function fmtDate(iso){ try { return new Date(iso).toLocaleDateString(); } catch { return ""; } }
  
  function processContent(html) {
    if (!html) return "";
    
    // Debug logging
    console.log('=== BLOG POST DEBUG ===');
    console.log('Raw content (first 300 chars):', html.substring(0, 300));
    console.log('Full length:', html.length);
    console.log('Has newlines (\\n):', html.includes('\n'));
    console.log('Has <br>:', html.includes('<br'));
    console.log('Has <p>:', html.includes('<p>'));
    
    // COMPREHENSIVE FIX: Handle all possible formats
    let processed = html;
    
    // 1. Normalize line endings (Windows → Unix)
    processed = processed.replace(/\r\n/g, '\n');
    processed = processed.replace(/\r/g, '\n');
    
    // 2. If content has NO HTML tags at all, wrap and convert newlines
    if (!processed.includes('<') && !processed.includes('>')) {
      processed = '<div>' + processed.replace(/\n/g, '<br>\n') + '</div>';
      console.log('Format: Plain text, converted to HTML with <br> tags');
    }
    // 3. If content has <p> tags, add <br> for newlines inside them
    else if (processed.includes('<p>')) {
      // Replace newlines with <br> but only inside <p> tags
      processed = processed.replace(/<p>([\s\S]*?)<\/p>/gi, function(match, content) {
        return '<p>' + content.replace(/\n+/g, '<br>') + '</p>';
      });
      // Also handle newlines outside <p> tags
      processed = processed.replace(/\n/g, '<br>');
      console.log('Format: Has <p> tags, added <br> for line breaks');
    }
    // 4. If it's other HTML, just convert all newlines to <br>
    else {
      processed = processed.replace(/\n/g, '<br>');
      console.log('Format: HTML content, converted newlines to <br>');
    }
    
    console.log('Processed (first 300 chars):', processed.substring(0, 300));
    console.log('======================');
    
    return processed;
  }

  async function load() {
    const qs = new URLSearchParams(location.search||"");
    const slug = qs.get("slug") || "";
    if (!slug) { titleEl.textContent = "Not found"; return; }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/blog/posts/${encodeURIComponent(slug)}`);
      const data = await res.json();
      const p = data?.post;
      if (!p) { titleEl.textContent = "Not found"; return; }

      document.title = `${p.title} • LYPO`;
      titleEl.textContent = p.title;
      metaEl.textContent = p.published_at ? fmtDate(p.published_at) : "";

      const parts = [];
      if (p.cover_url) parts.push(`<div class="postCover"><img src="${esc(p.cover_url)}" alt="${esc(p.title)}" loading="lazy" /></div>`);
      if (p.video_url) parts.push(`<div class="postVideo"><video controls preload="metadata" src="${esc(p.video_url)}"></video></div>`);
      mediaEl.innerHTML = parts.join("");

      bodyEl.innerHTML = processContent(p.content_html) || (p.excerpt ? `<p>${esc(p.excerpt)}</p>` : "");
    } catch (e) {
      titleEl.textContent = "Could not load post";
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();