#!/bin/bash

# BlindsCommerce End-of-Day Regression Check
# Run this script at the end of your coding day to ensure everything still works
# Usage: ./end-of-day-check.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BOLD}${BLUE}============================================${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}============================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BOLD}${YELLOW}📋 $1${NC}"
    echo "----------------------------------------"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the __tests__ directory"
    echo ""
    echo "Usage:"
    echo "  cd /path/to/blindscommerce/__tests__"
    echo "  ./end-of-day-check.sh"
    exit 1
fi

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

print_header "BLINDSCOMMERCE END-OF-DAY REGRESSION CHECK"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}Purpose: Verify no regressions introduced during today's development${NC}"
echo ""

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_section "Installing Dependencies"
    print_status "Test dependencies not found. Installing..."
    npm install
    print_success "Dependencies installed"
fi

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
FAILED_TEST_DETAILS=()

# Function to run individual test files and track results
run_individual_test() {
    local test_name="$1"
    local test_file="$2"
    local category="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "  $test_name... "
    
    # Run the test and capture output
    if npm test -- "$test_file" --silent --verbose=false &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_DETAILS+=("$category: $test_name ($test_file)")
        return 1
    fi
}

# 1. Component Unit Tests
print_section "Component Unit Tests"
print_status "Testing individual component files..."

run_individual_test "PricingMatrix Component" "unit/components/PricingMatrix.test.tsx" "Component"
run_individual_test "Features Component" "unit/components/Features.test.tsx" "Component"
run_individual_test "RoomRecommendations Component" "unit/components/RoomRecommendations.test.tsx" "Component"

# 2. Vendor Dashboard Tests
print_section "Vendor Dashboard Tests"
print_status "Testing individual vendor dashboard components..."

run_individual_test "Vendor Dashboard Main" "vendor-dashboard/VendorDashboard.test.tsx" "Vendor"
run_individual_test "Vendor Sales Team" "vendor-dashboard/VendorSalesTeam.test.tsx" "Vendor"
run_individual_test "Vendor Products" "vendor-dashboard/VendorProducts.test.tsx" "Vendor"
run_individual_test "Vendor Orders" "vendor-dashboard/VendorOrders.test.tsx" "Vendor"
run_individual_test "Vendor Discounts" "vendor-dashboard/VendorDiscounts.test.tsx" "Vendor"

# 3. Admin Dashboard Tests
print_section "Admin Dashboard Tests"
print_status "Testing individual admin dashboard components..."

run_individual_test "Admin Dashboard Main" "admin-dashboard/AdminDashboard.test.tsx" "Admin"
run_individual_test "Admin Users" "admin-dashboard/AdminUsers.test.tsx" "Admin"
run_individual_test "Admin Vendors" "admin-dashboard/AdminVendors.test.tsx" "Admin"
run_individual_test "Admin Products" "admin-dashboard/AdminProducts.test.tsx" "Admin"
run_individual_test "Admin Orders" "admin-dashboard/AdminOrders.test.tsx" "Admin"

# 4. Customer Dashboard Tests
print_section "Customer Dashboard Tests"
print_status "Testing individual customer dashboard components..."

run_individual_test "Customer Dashboard Main" "customer-dashboard/CustomerDashboard.test.tsx" "Customer"
run_individual_test "Customer Orders" "customer-dashboard/CustomerOrders.test.tsx" "Customer"
run_individual_test "Customer Measurements" "customer-dashboard/CustomerMeasurements.test.tsx" "Customer"

# 5. Sales Dashboard Tests
print_section "Sales Dashboard Tests"
print_status "Testing individual sales dashboard components..."

run_individual_test "Sales Dashboard Main" "sales-dashboard/SalesDashboard.test.tsx" "Sales"
run_individual_test "Sales Leads" "sales-dashboard/SalesLeads.test.tsx" "Sales"
run_individual_test "Sales Quotes" "sales-dashboard/SalesQuotes.test.tsx" "Sales"

# 6. Installer Dashboard Tests
print_section "Installer Dashboard Tests"
print_status "Testing individual installer dashboard components..."

run_individual_test "Installer Dashboard Main" "installer-dashboard/InstallerDashboard.test.tsx" "Installer"

# 7. Generate Detailed Summary Report
print_section "Detailed Test Results Summary"

echo ""
print_header "TEST RESULTS BREAKDOWN"

echo -e "${BOLD}📊 Overall Statistics:${NC}"
echo -e "   Total Tests Run: ${TOTAL_TESTS}"
echo -e "   ✅ Passed: ${PASSED_TESTS}"
echo -e "   ❌ Failed: ${FAILED_TESTS}"
echo ""

# Calculate percentage
if [[ $TOTAL_TESTS -gt 0 ]]; then
    PASS_PERCENTAGE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${BOLD}📈 Pass Rate: ${PASS_PERCENTAGE}%${NC}"
else
    echo -e "${BOLD}📈 Pass Rate: N/A${NC}"
fi

echo ""

# Show detailed failed tests
if [[ $FAILED_TESTS -gt 0 ]]; then
    echo -e "${BOLD}${RED}❌ FAILED TESTS DETAILS:${NC}"
    echo "----------------------------------------"
    for failed_test in "${FAILED_TEST_DETAILS[@]}"; do
        echo -e "   ${RED}• $failed_test${NC}"
    done
    echo ""
    
    echo -e "${BOLD}🔍 INVESTIGATION STEPS:${NC}"
    echo "   1. Run individual failing tests for details:"
    for failed_test in "${FAILED_TEST_DETAILS[@]}"; do
        test_file=$(echo "$failed_test" | sed 's/.*(\(.*\))/\1/')
        echo -e "      ${BLUE}npm test -- $test_file${NC}"
    done
    echo ""
    echo -e "   2. Check specific error messages:"
    echo -e "      ${BLUE}./run-tests.sh all${NC}"
    echo ""
fi

# Final verdict
if [[ $FAILED_TESTS -eq 0 ]]; then
    print_header "🎉 ALL TESTS PASSED"
    echo -e "${GREEN}${BOLD}✅ NO REGRESSIONS DETECTED${NC}"
    echo -e "${GREEN}✅ All $TOTAL_TESTS tests passed successfully${NC}"
    echo -e "${GREEN}✅ Application is stable${NC}"
    echo -e "${GREEN}✅ Safe to commit changes${NC}"
    echo -e "${GREEN}✅ Safe to deploy${NC}"
    echo ""
    echo -e "${BLUE}💡 Next Steps:${NC}"
    echo -e "   • Commit your changes with confidence"
    echo -e "   • Create pull request if ready"
    echo -e "   • Deploy to staging/production"
    
elif [[ $FAILED_TESTS -le 3 ]]; then
    print_header "⚠️  MINOR ISSUES DETECTED"
    echo -e "${YELLOW}${BOLD}⚠️  $FAILED_TESTS out of $TOTAL_TESTS tests failed${NC}"
    echo -e "${YELLOW}⚠️  Review failures but may proceed with caution${NC}"
    echo ""
    echo -e "${BLUE}💡 Recommended Actions:${NC}"
    echo -e "   • Review failed tests above for potential issues"
    echo -e "   • Fix critical regressions before deployment"
    echo -e "   • Run full diagnostics if needed"
    
else
    print_header "🚨 SIGNIFICANT REGRESSIONS DETECTED"
    echo -e "${RED}${BOLD}❌ $FAILED_TESTS OUT OF $TOTAL_TESTS TESTS FAILED${NC}"
    echo -e "${RED}❌ Multiple regressions detected${NC}"
    echo -e "${RED}❌ DO NOT DEPLOY${NC}"
    echo ""
    echo -e "${BLUE}💡 Required Actions:${NC}"
    echo -e "   • Review all test failures immediately"
    echo -e "   • Fix failing components before proceeding"
    echo -e "   • Re-run this check after fixes"
    echo -e "   • Consider reverting recent changes"
    
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Additional Diagnostics:${NC}"
echo -e "   • Individual test: ${BLUE}npm test -- [test-file]${NC}"
echo -e "   • Category tests: ${BLUE}./run-tests.sh [category]${NC}"
echo -e "   • Full test suite: ${BLUE}./run-tests.sh all${NC}"
echo -e "   • Coverage report: ${BLUE}./run-tests.sh coverage${NC}"

echo ""
print_status "End-of-day check completed at $(date '+%H:%M:%S')"

# Log results to file
LOG_FILE="end-of-day-results.log"
echo "[$TIMESTAMP] End-of-day check: $PASSED_TESTS/$TOTAL_TESTS passed ($PASS_PERCENTAGE%) - $([ $FAILED_TESTS -eq 0 ] && echo "ALL PASS" || echo "$FAILED_TESTS FAILED")" >> "$LOG_FILE"

exit 0