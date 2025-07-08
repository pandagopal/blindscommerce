#!/bin/bash

# BlindsCommerce Quick End-of-Day Check
# Simplified version that focuses on core functionality
# Usage: ./quick-check.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
    echo -e "${BOLD}${BLUE}🎯 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the __tests__ directory"
    exit 1
fi

print_header "BlindsCommerce Quick End-of-Day Check"
echo ""

# Track results
PASSED=0
FAILED=0

# Function to run a quick test
quick_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if $test_command &>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. Component Tests
print_info "Checking core components..."
quick_test "PricingMatrix Component" "npm run test:unit -- --testNamePattern='PricingMatrix'"
quick_test "Features Component" "npm run test:unit -- --testNamePattern='Features'"
quick_test "RoomRecommendations Component" "npm run test:unit -- --testNamePattern='RoomRecommendations'"

echo ""

# 2. Critical Tests Only
print_info "Checking critical functionality..."
quick_test "Critical Vendor Tests" "npm test -- --testPathPattern=vendor-dashboard --testNamePattern='CRITICAL'"
quick_test "Critical Admin Tests" "npm test -- --testPathPattern=admin-dashboard --testNamePattern='CRITICAL'"

echo ""

# Summary
TOTAL=$((PASSED + FAILED))
print_header "Summary"

if [[ $FAILED -eq 0 ]]; then
    print_success "All $TOTAL tests passed! No regressions detected."
    print_success "Safe to commit and deploy."
    echo ""
    print_info "To run comprehensive tests: ./run-tests.sh all"
    exit 0
else
    print_error "$FAILED out of $TOTAL tests failed."
    print_error "Please review failures before committing."
    echo ""
    print_info "For detailed diagnostics: ./run-tests.sh all"
    exit 1
fi