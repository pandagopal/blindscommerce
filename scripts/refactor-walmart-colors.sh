#!/bin/bash

# Script to refactor walmart color references to brand colors
# This script will replace all walmart-blue and walmart-yellow with appropriate brand colors

echo "Starting walmart color refactoring..."

# Find all TypeScript/TSX files (excluding node_modules and .next)
files=$(find /Users/gopal/BlindsCode/blindscommerce -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/.next/*")

count=0
for file in $files; do
  if grep -q "walmart-blue\|walmart-yellow" "$file"; then
    echo "Processing: $file"

    # Replace walmart-blue color variations with brand-red equivalents
    # Light shades (50-400) -> red-50 to red-400
    sed -i '' 's/walmart-blue-50/red-50/g' "$file"
    sed -i '' 's/walmart-blue-100/red-100/g' "$file"
    sed -i '' 's/walmart-blue-200/red-200/g' "$file"
    sed -i '' 's/walmart-blue-300/red-300/g' "$file"
    sed -i '' 's/walmart-blue-400/red-400/g' "$file"

    # Medium shades (500-700) -> primary-red, red-600, primary-dark
    sed -i '' 's/walmart-blue-500/primary-red/g' "$file"
    sed -i '' 's/walmart-blue-600/primary-red/g' "$file"
    sed -i '' 's/walmart-blue-700/primary-dark/g' "$file"

    # Dark shades (800-950) -> primary-dark, red-900, red-950
    sed -i '' 's/walmart-blue-800/primary-dark/g' "$file"
    sed -i '' 's/walmart-blue-900/red-900/g' "$file"
    sed -i '' 's/walmart-blue-950/red-950/g' "$file"

    # Replace generic walmart-blue (no number) with primary-red
    sed -i '' 's/walmart-blue/primary-red/g' "$file"

    # Replace walmart-yellow with accent-yellow
    sed -i '' 's/walmart-yellow-500/accent-yellow/g' "$file"
    sed -i '' 's/walmart-yellow/accent-yellow/g' "$file"

    ((count++))
  fi
done

echo "Refactoring complete! Modified $count files."
echo "Please review the changes and test the application."
