#!/bin/bash

# BlindsCommerce End-of-Day Regression Check
# Run this script at the end of your coding day to ensure everything still works
# Usage: ./end-of-day-check.sh

set -e

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
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a test category and track results
run_test_check() {
    local test_name="$1"
    local test_command="$2"
    local critical="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    print_status "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "$test_name - PASSED"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [[ "$critical" == "critical" ]]; then
            print_error "$test_name - FAILED (CRITICAL)"
        else
            print_warning "$test_name - FAILED (NON-CRITICAL)"
        fi
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 1. Critical Component Health Check
print_section "Critical Component Health Check"
print_status "Checking if core components can be imported without errors..."

run_test_check "Component Unit Tests" "npm run test:unit" "critical"

# 2. Database Connection Check
print_section "Database & Environment Check" 
print_status "Verifying database connectivity and environment setup..."

run_test_check "Health Check Tests" "npm test -- --testPathPattern=health" "critical"

# 3. Dashboard Regression Check
print_section "Dashboard Regression Check"
print_status "Testing all dashboard components for regressions..."

run_test_check "Vendor Dashboard" "npm run test:vendor-dashboard" "critical"
run_test_check "Admin Dashboard" "npm test -- --testPathPattern=admin-dashboard" "critical"
run_test_check "Customer Dashboard" "npm test -- --testPathPattern=customer-dashboard" "critical"
run_test_check "Sales Dashboard" "npm test -- --testPathPattern=sales-dashboard" "critical"
run_test_check "Installer Dashboard" "npm test -- --testPathPattern=installer-dashboard" "critical"

# 4. Critical Path Tests
print_section "Critical Path Tests"
print_status "Running tests marked as CRITICAL for regression prevention..."

run_test_check "Critical Regression Tests" "npm run test:critical" "critical"

# 5. Generate Summary Report
print_section "End-of-Day Summary Report"

echo ""
print_header "TEST RESULTS SUMMARY"

echo -e "${BOLD}📊 Test Statistics:${NC}"
echo -e "   Total Checks: ${TOTAL_CHECKS}"
echo -e "   ✅ Passed: ${PASSED_CHECKS}"
echo -e "   ❌ Failed: ${FAILED_CHECKS}"
echo ""

# Calculate percentage
if [[ $TOTAL_CHECKS -gt 0 ]]; then
    PASS_PERCENTAGE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    echo -e "${BOLD}📈 Pass Rate: ${PASS_PERCENTAGE}%${NC}"
else
    echo -e "${BOLD}📈 Pass Rate: N/A${NC}"
fi

echo ""

# Final verdict
if [[ $FAILED_CHECKS -eq 0 ]]; then
    print_header "🎉 ALL CHECKS PASSED"
    echo -e "${GREEN}${BOLD}✅ NO REGRESSIONS DETECTED${NC}"
    echo -e "${GREEN}✅ Application is stable${NC}"
    echo -e "${GREEN}✅ Safe to commit changes${NC}"
    echo -e "${GREEN}✅ Safe to deploy${NC}"
    echo ""
    echo -e "${BLUE}💡 Next Steps:${NC}"
    echo -e "   • Commit your changes with confidence"
    echo -e "   • Create pull request if ready"
    echo -e "   • Deploy to staging/production"
    
elif [[ $FAILED_CHECKS -le 2 ]]; then
    print_header "⚠️  MINOR ISSUES DETECTED"
    echo -e "${YELLOW}${BOLD}⚠️  Some non-critical tests failed${NC}"
    echo -e "${YELLOW}⚠️  Review failures but may proceed with caution${NC}"
    echo ""
    echo -e "${BLUE}💡 Recommended Actions:${NC}"
    echo -e "   • Review failed tests for potential issues"
    echo -e "   • Run detailed diagnostics: ./run-tests.sh all"
    echo -e "   • Fix critical issues before deployment"
    
else
    print_header "🚨 REGRESSIONS DETECTED"
    echo -e "${RED}${BOLD}❌ MULTIPLE TEST FAILURES${NC}"
    echo -e "${RED}❌ Potential regressions introduced${NC}"
    echo -e "${RED}❌ DO NOT DEPLOY${NC}"
    echo ""
    echo -e "${BLUE}💡 Required Actions:${NC}"
    echo -e "   • Review all test failures immediately"
    echo -e "   • Run full diagnostics: ./run-tests.sh all"
    echo -e "   • Fix failing components before proceeding"
    echo -e "   • Re-run this check after fixes"
    
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Detailed Test Logs:${NC}"
echo -e "   • Run individual tests: ./run-tests.sh [category]"
echo -e "   • Full test suite: ./run-tests.sh all"
echo -e "   • Coverage report: ./run-tests.sh coverage"

echo ""
print_status "End-of-day check completed at $(date '+%H:%M:%S')"

# Log results to file
LOG_FILE="end-of-day-results.log"
echo "[$TIMESTAMP] End-of-day check: $PASSED_CHECKS/$TOTAL_CHECKS passed ($PASS_PERCENTAGE%)" >> "$LOG_FILE"

exit 0