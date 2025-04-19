#!/bin/bash

# Script to build and deploy the static site to Netlify
echo "Starting static build and deploy process..."

# Run the build
echo "Building the static site..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo "Build failed. Please check the errors above."
  exit 1
fi

# Create a zip file for Netlify deployment
echo "Creating zip file for deployment..."
cd out
zip -rFS ../../output.zip .
cd ..

echo "Static site build and packaging completed!"
echo "The output.zip file is ready for deployment to Netlify."
