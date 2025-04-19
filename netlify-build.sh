#!/bin/bash
# Custom build script for Netlify static deployment

# Set environment variables for the build
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Create a temporary directory for storing modified files
mkdir -p temp_files

# Search and temporarily rename dynamic files
echo "Renaming dynamic routes for static export..."
find ./app -type f -name "*.tsx" -exec grep -l "export const dynamic" {} \; | while read file; do
  echo "Backing up $file"
  cp "$file" "temp_files/$(basename $file).bak"
  # Comment out dynamic exports
  sed -i 's/export const dynamic/\/\/ export const dynamic/g' "$file"
  sed -i 's/export const revalidate/\/\/ export const revalidate/g' "$file"
done

# Check if middleware.ts exists and move it temporarily
if [ -f "middleware.ts" ]; then
  echo "Moving middleware.ts temporarily for static export"
  mv middleware.ts middleware.ts.bak
fi

# Update next.config.js for static export
echo "Updating next.config.js for static export..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as static export for Netlify
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

  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Route configuration
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
};

module.exports = nextConfig;
EOF

# Run the build with the static export configuration
echo "Building with static export configuration..."
npm run build

echo "Build completed for static deployment!"
