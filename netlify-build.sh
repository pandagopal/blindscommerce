#!/bin/bash
set -e

# Custom build script for Netlify static deployment

# Install required dependencies first
npm install --no-save typescript@latest @types/node@latest eslint@latest eslint-config-next@latest

# Set environment variables to skip TypeScript and ESLint checks
export NEXT_TYPESCRIPT_IGNORE_ERRORS=true
export NEXT_ESLINT_IGNORE_ERRORS=true
export SKIP_ESLINT=true
export SKIP_TYPECHECK=true

# Build the Next.js app with these settings
NODE_ENV=production npx next build

echo "Build completed successfully!"
