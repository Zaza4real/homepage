#!/bin/bash
# Revert HTML files to use original unminified CSS/JS

set -e

echo "🔄 Reverting HTML files to use original (unminified) CSS/JS..."
echo ""

# Function to revert HTML file references
revert_html() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Reverting: $file"
        
        # Backup current version first
        cp "$file" "${file}.minified.bak"
        
        # Revert CSS references
        sed -i '' 's/href="style\.min\.css"/href="style.css"/g' "$file"
        sed -i '' 's/href="mobile-header\.min\.css"/href="mobile-header.css"/g' "$file"
        sed -i '' 's/href="home-cleanup\.min\.css"/href="home-cleanup.css"/g' "$file"
        sed -i '' 's/href="mobile-blog\.min\.css"/href="mobile-blog.css"/g' "$file"
        
        # Revert JS references
        sed -i '' 's/src="script\.min\.js"/src="script.js"/g' "$file"
        sed -i '' 's/src="index\.min\.js"/src="index.js"/g' "$file"
        sed -i '' 's/src="dashboard\.min\.js"/src="dashboard.js"/g' "$file"
        sed -i '' 's/src="kling-video\.min\.js"/src="kling-video.js"/g' "$file"
        sed -i '' 's/src="tiktok-captions\.min\.js"/src="tiktok-captions.js"/g' "$file"
        sed -i '' 's/src="voiceover\.min\.js"/src="voiceover.js"/g' "$file"
        sed -i '' 's/src="header\.min\.js"/src="header.js"/g' "$file"
        sed -i '' 's/src="analytics\.min\.js"/src="analytics.js"/g' "$file"
        sed -i '' 's/src="auth\.min\.js"/src="auth.js"/g' "$file"
        sed -i '' 's/src="blog\.min\.js"/src="blog.js"/g' "$file"
        
        echo "  ✓ Reverted $file"
    fi
}

# Revert all HTML files
for html in *.html; do
    if [[ "$html" != *.bak && "$html" != *.tmp ]]; then
        revert_html "$html"
    fi
done

echo ""
echo "✅ HTML files reverted to use original CSS/JS!"
echo "📝 Note: Minified files still exist but are not referenced"
echo ""
echo "Reason: Basic minification broke JavaScript functionality."
echo "Solution: Use original files (gzip compression on server will handle size)"
