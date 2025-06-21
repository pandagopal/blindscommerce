#!/bin/bash

# BlindsCommerce Regression Prevention Test Runner
# Usage: ./run-tests.sh [category]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the __tests__ directory"
    exit 1
fi

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing test dependencies..."
    npm install
fi

# Default to running all tests
TEST_CATEGORY=${1:-"all"}

print_status "Running BlindsCommerce Regression Prevention Tests"
print_status "Category: $TEST_CATEGORY"
echo ""

case $TEST_CATEGORY in
    "critical")
        print_status "Running CRITICAL regression tests only..."
        npm run test:critical
        ;;
    "unit")
        print_status "Running component unit tests..."
        npm run test:unit
        ;;
    "database")
        print_status "Running database connection tests..."
        npm run test:database
        ;;
    "api")
        print_status "Running API endpoint tests..."
        npm run test:api
        ;;
    "vendor-dashboard")
        print_status "Running ALL vendor dashboard tests..."
        npm run test:vendor-dashboard
        ;;
    "vendor-products")
        print_status "Running vendor products tests..."
        npm run test:vendor-products
        ;;
    "vendor-discounts")
        print_status "Running vendor discounts tests..."
        npm run test:vendor-discounts
        ;;
    "vendor-sales")
        print_status "Running vendor sales team tests..."
        npm run test:vendor-sales
        ;;
    "vendor-orders")
        print_status "Running vendor orders tests..."
        npm run test:vendor-orders
        ;;
    "fast")
        print_status "Running fast tests (unit + api)..."
        npm run test:unit && npm run test:api
        ;;
    "coverage")
        print_status "Running tests with coverage report..."
        npm run test:coverage
        ;;
    "ci")
        print_status "Running CI test suite..."
        npm run test:ci
        ;;
    "all")
        print_status "Running ALL regression tests..."
        npm test
        ;;
    *)
        print_error "Unknown test category: $TEST_CATEGORY"
        echo ""
        echo "Available categories:"
        echo "  critical           - Critical path tests only"
        echo "  unit               - Component unit tests"
        echo "  database           - Database connection tests"
        echo "  api                - API endpoint tests"
        echo "  vendor-dashboard   - All vendor dashboard tests"
        echo "  vendor-products    - Vendor products management"
        echo "  vendor-discounts   - Vendor discounts & coupons"
        echo "  vendor-sales       - Vendor sales team management"
        echo "  vendor-orders      - Vendor orders management"
        echo "  fast               - Quick unit + api tests"
        echo "  coverage           - Tests with coverage report"
        echo "  ci                 - Full CI test suite"
        echo "  all                - All tests (default)"
        exit 1
        ;;
esac

# Check exit code
if [[ $? -eq 0 ]]; then
    echo ""
    print_success "All tests passed! ✅"
    print_success "No regressions detected."
    echo ""
    print_status "Safe to proceed with deployment."
else
    echo ""
    print_error "Some tests failed! ❌"
    print_error "Potential regressions detected."
    echo ""
    print_warning "Review test failures before deploying."
    exit 1
fi