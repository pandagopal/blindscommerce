#!/bin/bash

echo "🎭 BlindsCommerce E2E Test Runner"
echo "================================="
echo ""

# Check if dev server is running
echo "Checking if dev server is running on port 3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server is not running!"
    echo "Please start the dev server first with: npm run dev"
    echo "Then run the tests again."
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules/@playwright" ]; then
    echo "Installing Playwright..."
    npm install
    npx playwright install chromium
fi

# Run tests
echo "Running E2E tests..."
echo ""

# First run simple navigation tests
echo "1. Running basic navigation tests..."
npx playwright test e2e/simple-navigation.spec.ts --reporter=list

# Then run basic product flow
echo ""
echo "2. Running basic product flow tests..."
npx playwright test e2e/basic-product-flow.spec.ts --reporter=list

# Run full test suite
echo ""
echo "3. Running full test suite..."
npx playwright test e2e/ --reporter=list

echo ""
echo "Test run complete!"
echo "To view detailed report, run: npx playwright show-report"