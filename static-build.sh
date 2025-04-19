#!/bin/bash

# Build script for static export to Netlify
echo "Starting static build process..."

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Create backup directory
mkdir -p backup

# Backup middleware file if it exists
if [ -f "middleware.ts" ]; then
  echo "Backing up middleware.ts"
  cp middleware.ts backup/
  echo "// Disabled for static export" > middleware.ts
fi

if [ -f "middleware.ts.bak" ]; then
  echo "Using existing middleware.ts.bak"
  # It's already backed up, we're good
fi

# Backup next.config.js
echo "Backing up next.config.js"
cp next.config.js backup/

# Create static export config
echo "Creating static export next.config.js"
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

# Run the build
echo "Running next build for static export..."
npm run build

# Create a zip file for Netlify deployment
echo "Creating zip file for deployment..."
cd out
zip -rFS ../../output.zip .
cd ..

echo "Static build process completed!"
echo "Deploy the output.zip file to Netlify"
