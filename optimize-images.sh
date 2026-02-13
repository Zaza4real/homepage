#!/bin/bash
# Image optimization script for LYPO website
# Converts PNG images to WebP format with quality 80

set -e

echo "🖼️  Starting image optimization..."
echo ""

# Get the base directory
BASE_DIR="$(pwd)"
BACKUP_DIR="$BASE_DIR/original_images_backup"

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/assets"

# Function to convert PNG to WebP
convert_to_webp() {
    local png_file="$1"
    local webp_file="${png_file%.png}.webp"
    local backup_path="$2"
    
    if [ -f "$png_file" ]; then
        echo "Converting: $png_file"
        
        # Backup original if not already backed up
        if [ ! -f "$backup_path/$(basename "$png_file")" ]; then
            cp "$png_file" "$backup_path/"
        fi
        
        # Convert to WebP with quality 80
        cwebp -q 80 "$png_file" -o "$webp_file" 2>/dev/null
        
        if [ -f "$webp_file" ]; then
            original_size=$(du -h "$png_file" | cut -f1)
            new_size=$(du -h "$webp_file" | cut -f1)
            echo "  ✓ Created $webp_file ($original_size → $new_size)"
        fi
    fi
}

# Convert all PNG images in assets folder
echo "📁 Converting images in assets/"
cd "$BASE_DIR/assets"
for png in *.png; do
    if [ -f "$png" ]; then
        convert_to_webp "$png" "$BACKUP_DIR/assets"
    fi
done

# Convert root-level PNG images
echo ""
echo "📁 Converting root-level images"
cd "$BASE_DIR"
for png in cover-*.png favicon.png favicon-512.png; do
    if [ -f "$png" ]; then
        convert_to_webp "$png" "$BACKUP_DIR"
    fi
done

echo ""
echo "✅ Image optimization complete!"
echo "📊 Backup of original PNGs saved to: $BACKUP_DIR"
echo ""
echo "Summary:"
du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print "  Original size: " $1}'
find . -name "*.webp" -exec du -ch {} + 2>/dev/null | tail -1 | awk '{print "  WebP size: " $1}'
