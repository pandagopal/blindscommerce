# BlindsCommerce E2E Tests

High-priority Playwright tests for the BlindsCommerce platform.

## Test Coverage

### Basic Tests (Run First)
- **Simple Navigation** - Basic page accessibility checks
- **Basic Product Flow** - Simple product browsing test

### Full Test Suite
1. **Customer Product Configuration** - Product selection, customization, and add to cart
2. **Customer Checkout Flow** - Complete purchase process including payment
3. **Vendor Product Pricing** - Vendor pricing matrix and fabric management
4. **Customer Auth Flow** - Registration, login, password reset
5. **Admin Vendor Approval** - Vendor application review and approval workflow
6. **Customer Account Dashboard** - Profile, orders, addresses, measurements

## Running Tests

```bash
# Install dependencies
npm install
npx playwright install chromium

# Make sure dev server is running
cd .. && npm run dev

# Run basic tests first to verify setup
npx playwright test e2e/simple-navigation.spec.ts
npx playwright test e2e/basic-product-flow.spec.ts

# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed browser
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/customer-checkout-flow.spec.ts

# Use the test runner script
../run-e2e-tests.sh
```

## Test Data

Tests expect the following test accounts:
- Customer: customer@example.com / Test123!
- Vendor: vendor@example.com / Test123!
- Admin: admin@blindscommerce.com / AdminSecure123!

## Notes

- Tests use data-testid attributes for element selection
- Screenshots are taken on failure
- Tests run against localhost:3000 by default