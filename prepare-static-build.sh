#!/bin/bash

# Script to prepare the application for static export
echo "Preparing application for static export..."

# Create backup directory
mkdir -p backup_pages

# Backup middleware file
if [ -f "middleware.ts" ]; then
  echo "Backing up and removing middleware.ts"
  cp middleware.ts backup_pages/
  rm middleware.ts
fi

if [ -f "middleware.ts.bak" ]; then
  echo "Moving middleware.ts.bak to backup_pages"
  cp middleware.ts.bak backup_pages/
fi

# Backup next.config.js
echo "Backing up next.config.js"
cp next.config.js backup_pages/

# Update next.config.js
echo "Updating next.config.js for static export..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
EOF

# Function to temporarily modify page files to remove dynamic exports
modify_page_files() {
  echo "Searching for and modifying dynamic page exports..."

  # Find all page.tsx files with dynamic exports
  find ./app -type f -name "*.tsx" -exec grep -l "export const dynamic" {} \; | while read file; do
    echo "Backing up and modifying: $file"

    # Create backup
    cp "$file" "backup_pages/$(basename $file)"

    # Comment out dynamic and revalidate exports
    sed -i 's/export const dynamic/\/\/ export const dynamic/g' "$file"
    sed -i 's/export const revalidate/\/\/ export const revalidate/g' "$file"

    # Check if file has async function and convert to static
    if grep -q "export default async function" "$file"; then
      echo "Converting async function to static in $file"
      sed -i 's/export default async function/export default function/g' "$file"

      # If there are await calls, we need to handle them
      if grep -q "await" "$file"; then
        echo "Warning: $file has await calls that may need manual handling"
      fi
    fi
  done
}

# Call the function to modify page files
modify_page_files

echo "Static export preparation completed!"
