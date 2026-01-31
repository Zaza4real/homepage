(() => {
  const BACKEND_BASE_URL = "https://api.lypo.org";

  const list = document.getElementById("blogList");
  function esc(s){ return String(s||"").replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  function fmtDate(iso){
    try { return new Date(iso).toLocaleDateString(); } catch { return ""; }
  }

  async function load() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/blog/posts`);
      const data = await res.json();
      const posts = data?.posts || [];
      if (!posts.length) {
        list.innerHTML = '<div class="mutedCell">No posts yet.</div>';
        return;
      }
      list.innerHTML = posts.map(p => {
        const cover = p.cover_url ? `<div class="blogCover"><img src="${esc(p.cover_url)}" alt="${esc(p.title)}" loading="lazy" /></div>` : "";
        const date = p.published_at ? fmtDate(p.published_at) : "";
        return `
          <a class="blogItem" href="post.html?slug=${encodeURIComponent(p.slug)}">
            ${cover}
            <div class="blogMeta">
              <div class="blogTitle">${esc(p.title)}</div>
              <div class="blogSub">${esc(p.excerpt || "")}</div>
              <div class="blogDate">${esc(date)}</div>
            </div>
          </a>
        `;
      }).join("");
    } catch (e) {
      list.innerHTML = `<div class="mutedCell">Could not load posts.</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();