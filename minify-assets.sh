#!/bin/bash
# CSS/JS Minification script
# Uses basic minification techniques

set -e

echo "📦 Starting CSS/JS minification..."
echo ""

# Function to minify CSS (basic)
minify_css() {
    local input="$1"
    local output="${input%.css}.min.css"
    
    if [ -f "$input" ]; then
        echo "Minifying: $input"
        # Basic CSS minification: remove comments, extra whitespace, newlines
        sed 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' "$input" | \
        tr '\n' ' ' | \
        sed 's/  \+/ /g' | \
        sed 's/ *{ */ {/g' | \
        sed 's/ *} */} /g' | \
        sed 's/ *: */:/g' | \
        sed 's/ *; */;/g' | \
        sed 's/ *, */,/g' > "$output"
        
        original_size=$(du -h "$input" | cut -f1)
        new_size=$(du -h "$output" | cut -f1)
        echo "  ✓ Created $output ($original_size → $new_size)"
    fi
}

# Function to minify JS (basic)
minify_js() {
    local input="$1"
    local output="${input%.js}.min.js"
    
    if [ -f "$input" ]; then
        echo "Minifying: $input"
        # Basic JS minification: remove comments, extra whitespace
        sed 's|//.*$||g' "$input" | \
        sed 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' | \
        tr '\n' ' ' | \
        sed 's/  \+/ /g' > "$output"
        
        original_size=$(du -h "$input" | cut -f1)
        new_size=$(du -h "$output" | cut -f1)
        echo "  ✓ Created $output ($original_size → $new_size)"
    fi
}

# Minify main CSS files
echo "📝 Minifying CSS files..."
minify_css "style.css"
minify_css "mobile-header.css"
minify_css "home-cleanup.css"
minify_css "mobile-blog.css"

echo ""
echo "📝 Minifying JS files..."
# Minify main JS files
minify_js "script.js"
minify_js "index.js"
minify_js "dashboard.js"
minify_js "kling-video.js"
minify_js "tiktok-captions.js"
minify_js "voiceover.js"
minify_js "header.js"
minify_js "analytics.js"
minify_js "auth.js"
minify_js "blog.js"

echo ""
echo "✅ Minification complete!"
echo ""
echo "Summary:"
find . -maxdepth 1 -name "*.min.css" -exec du -ch {} + 2>/dev/null | tail -1 | awk '{print "  Minified CSS: " $1}'
find . -maxdepth 1 -name "*.min.js" -exec du -ch {} + 2>/dev/null | tail -1 | awk '{print "  Minified JS: " $1}'
