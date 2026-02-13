import os
import re

def update_refs(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # JS files to minify
    js_files = [
        "script.js", "index.js", "dashboard.js", "kling-video.js", 
        "tiktok-captions.js", "voiceover.js", "header.js", 
        "analytics.js", "auth.js", "blog.js", "post.js", "mobile-header.js"
    ]
    
    # CSS files to minify
    css_files = [
        "style.css", "mobile-header.css", "home-cleanup.css", "mobile-blog.css"
    ]

    changed = False
    
    # Update JS refs
    for js in js_files:
        min_js = js.replace(".js", ".min.js")
        # Match src="file.js" but not src="file.min.js"
        pattern = f'src="{js}"'
        if pattern in content:
            content = content.replace(pattern, f'src="{min_js}"')
            changed = True
            print(f"  Updated {js} -> {min_js} in {file_path}")

    # Update CSS refs
    for css in css_files:
        min_css = css.replace(".css", ".min.css")
        pattern = f'href="{css}"'
        if pattern in content:
            content = content.replace(pattern, f'href="{min_css}"')
            changed = True
            print(f"  Updated {css} -> {min_css} in {file_path}")

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

print("📦 Updating HTML references to minified assets...")
for html in html_files:
    update_refs(html)
print("✅ Done!")
