#!/bin/bash

# BlindsCommerce Daily Regression Check
# Simple, reliable end-of-day verification
# Usage: ./daily-check.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}🎯 BlindsCommerce Daily Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if in correct directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Run from __tests__ directory${NC}"
    exit 1
fi

PASSED=0
TOTAL=0

# Simple test function
check() {
    local name="$1"
    local cmd="$2"
    TOTAL=$((TOTAL + 1))
    
    echo -n "$name... "
    if $cmd &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

echo -e "${YELLOW}📦 Component Tests${NC}"
check "PricingMatrix" "npm run test:unit -- --testNamePattern='PricingMatrix' --silent"
check "Features" "npm run test:unit -- --testNamePattern='Features' --silent"
check "RoomRecommendations" "npm run test:unit -- --testNamePattern='RoomRecommendations' --silent"

echo ""
echo -e "${YELLOW}📊 Results${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $PASSED -eq $TOTAL ]]; then
    echo -e "${GREEN}🎉 ALL $TOTAL TESTS PASSED${NC}"
    echo -e "${GREEN}✅ No regressions detected${NC}"
    echo -e "${GREEN}✅ Safe to commit/deploy${NC}"
    echo ""
    echo -e "${BLUE}💡 For full tests: ./run-tests.sh all${NC}"
    exit 0
else
    FAILED=$((TOTAL - PASSED))
    echo -e "${RED}⚠️  $FAILED/$TOTAL tests failed${NC}"
    echo -e "${YELLOW}📋 Review changes before deployment${NC}"
    echo ""
    echo -e "${BLUE}💡 For diagnostics: ./run-tests.sh all${NC}"
    exit 1
fi