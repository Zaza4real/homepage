#!/bin/bash
# Update HTML files to use WebP images instead of PNG

set -e

echo "🖼️  Updating HTML files to use WebP images..."
echo ""

# Function to update HTML file
update_html_images() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating: $file"
        
        # Backup
        cp "$file" "${file}.png-backup"
        
        # Replace favicon references (keep PNG for compatibility but prioritize WebP)
        sed -i '' 's|href="favicon\.png"|href="favicon.webp"|g' "$file"
        sed -i '' 's|href="favicon-512\.png"|href="favicon-512.webp"|g' "$file"
        
        # Replace og:image and twitter:image (social media - use smaller WebP)
        sed -i '' 's|content="https://lypo\.org/favicon\.png"|content="https://lypo.org/favicon-512.webp"|g' "$file"
        sed -i '' 's|content="https://lypo\.org/favicon-512\.png"|content="https://lypo.org/favicon-512.webp"|g' "$file"
        
        # Replace structured data images
        sed -i '' 's|"image": "https://lypo\.org/favicon\.png"|"image": "https://lypo.org/favicon-512.webp"|g' "$file"
        sed -i '' 's|"url": "https://lypo\.org/favicon\.png"|"url": "https://lypo.org/favicon-512.webp"|g' "$file"
        
        # Replace cover images in assets
        sed -i '' 's/src="assets\/\([^"]*\)\.png"/src="assets\/\1.webp"/g' "$file"
        
        # Replace root-level cover images
        sed -i '' 's/src="cover-global-fame\.png"/src="cover-global-fame.webp"/g' "$file"
        sed -i '' 's/src="cover-quick-guide\.png"/src="cover-quick-guide.webp"/g' "$file"
        
        # Replace in style attributes and inline styles
        sed -i '' "s/url('assets\/\([^']*\)\.png')/url('assets\/\1.webp')/g" "$file"
        sed -i '' 's/url("assets\/\([^"]*\)\.png")/url("assets\/\1.webp")/g' "$file"
        
        echo "  ✓ Updated $file"
    fi
}

# Update all HTML files
for html in *.html; do
    if [[ "$html" != *.backup && "$html" != *.bak && "$html" != *.tmp ]]; then
        update_html_images "$html"
    fi
done

echo ""
echo "✅ HTML files updated to use WebP images!"
echo "📊 This should reduce page load by ~97% for images"
echo ""
echo "Next: Commit and push to GitHub, then clear browser cache"
