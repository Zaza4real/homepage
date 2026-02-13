#!/bin/bash
# Update HTML files to use minified CSS/JS

set -e

echo "🔄 Updating HTML files to use minified assets..."
echo ""

# Function to update HTML file references
update_html() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating: $file"
        
        # Backup original
        cp "$file" "${file}.bak"
        
        # Replace CSS references
        sed -i '' 's/href="style\.css"/href="style.min.css"/g' "$file"
        sed -i '' 's/href="mobile-header\.css"/href="mobile-header.min.css"/g' "$file"
        sed -i '' 's/href="home-cleanup\.css"/href="home-cleanup.min.css"/g' "$file"
        sed -i '' 's/href="mobile-blog\.css"/href="mobile-blog.min.css"/g' "$file"
        
        # Replace JS references
        sed -i '' 's/src="script\.js"/src="script.min.js"/g' "$file"
        sed -i '' 's/src="index\.js"/src="index.min.js"/g' "$file"
        sed -i '' 's/src="dashboard\.js"/src="dashboard.min.js"/g' "$file"
        sed -i '' 's/src="kling-video\.js"/src="kling-video.min.js"/g' "$file"
        sed -i '' 's/src="tiktok-captions\.js"/src="tiktok-captions.min.js"/g' "$file"
        sed -i '' 's/src="voiceover\.js"/src="voiceover.min.js"/g' "$file"
        sed -i '' 's/src="header\.js"/src="header.min.js"/g' "$file"
        sed -i '' 's/src="analytics\.js"/src="analytics.min.js"/g' "$file"
        sed -i '' 's/src="auth\.js"/src="auth.min.js"/g' "$file"
        sed -i '' 's/src="blog\.js"/src="blog.min.js"/g' "$file"
        
        echo "  ✓ Updated $file"
    fi
}

# Update all HTML files
for html in *.html; do
    if [[ "$html" != *.bak && "$html" != *.tmp ]]; then
        update_html "$html"
    fi
done

echo ""
echo "✅ HTML files updated to use minified assets!"
echo "📝 Original files backed up with .bak extension"
