# BlindsCommerce UI Testing Suite

A comprehensive UI testing framework for the BlindsCommerce e-commerce platform using Playwright.

## Overview

This testing suite validates the complete product workflow from vendor creation to order placement, including:

- **Vendor Product Creation** - Multi-step product forms, bulk uploads, validation
- **Customer Product Configuration** - 7-step configurator with industry-standard measurements
- **Cart & Checkout** - Cart management, guest checkout, payment processing
- **Role-Based Access Control** - 7-tier user hierarchy permissions

## Quick Start

```bash
# Install dependencies
npm install

# Install browser engines
npm run install-browsers

# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run specific workflow tests
npm run test:workflow
```

## Test Structure

```
tests/
├── workflows/
│   ├── vendor-product-creation.spec.ts     # Vendor product management
│   ├── customer-product-configuration.spec.ts  # Product configurator
│   └── cart-checkout-workflow.spec.ts      # Cart to order completion
├── auth/
│   └── role-based-access.spec.ts           # Permission testing
└── utils/
    └── test-helpers.ts                      # Reusable test utilities
```

## Key Test Scenarios

### Vendor Workflow
- Complete product creation with validation
- Bulk product upload via CSV
- Product editing and status management
- Multi-vendor isolation testing

### Customer Workflow  
- 7-step product configuration:
  1. Dimensions (with 1/8" fraction inputs)
  2. Colors & Materials
  3. Control Options
  4. Rail Configurations
  5. Room Visualization
  6. Configuration Review
  7. Add to Cart
- Price calculation accuracy
- Configuration persistence
- Mobile responsive testing

### Cart & Checkout
- Multi-item cart management
- Guest vs. authenticated checkout
- Sample requests & installation booking
- Coupon application
- Multi-vendor order handling
- Payment processing (Stripe integration)

### Access Control
- 7-tier role hierarchy validation
- Permission inheritance testing
- Cross-role data isolation
- Session management

## Configuration

### Environment Setup
Copy `.env.example` to `.env` and configure:

```bash
BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@test.com
TEST_VENDOR_EMAIL=vendor@test.com
TEST_CUSTOMER_EMAIL=customer@test.com
# ... additional config
```

### Browser Configuration
Tests run across multiple browsers and devices:
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5, iPhone 12

## Test Data Requirements

### Required Test Users
The following test users must exist in your database:

```sql
-- Admin user
INSERT INTO users (email, password, role) VALUES 
('admin@test.com', 'hashed_password', 'admin');

-- Vendor user
INSERT INTO users (email, password, role) VALUES 
('vendor@test.com', 'hashed_password', 'vendor');

-- Customer user
INSERT INTO users (email, password, role) VALUES 
('customer@test.com', 'hashed_password', 'customer');
```

### Required Test Products
Sample products with slugs:
- `premium-roller-shade`
- `cellular-shade`
- `vendor-a-roller-shade`
- `vendor-b-cellular-shade`

## Running Tests

### Local Development
```bash
# Start the main application
cd ../
npm run dev

# In parallel, run tests
cd blindscommerce-ui-tests
npm test
```

### CI/CD Integration
```bash
# Headless mode for CI
npm test

# Generate reports
npm run report
```

### Debug Mode
```bash
# Debug failing tests
npm run test:debug

# Run with browser visible
npm run test:headed
```

## Test Utilities

The `TestHelpers` class provides reusable functions:

```typescript
// Login as different roles
await helpers.loginAs('vendor');
await helpers.loginAs('customer');

// Product configuration
await helpers.navigateToProductConfiguration('product-slug');
await helpers.completeBasicProductConfiguration();

// Cart operations
await helpers.addToCart();
await helpers.proceedToCheckout();

// Form helpers
await helpers.fillFractionInput('[data-testid="width"]', 48, '3/8');
await helpers.fillShippingAddress();
await helpers.fillPaymentInfo();
```

## Data Attributes

Tests rely on `data-testid` attributes in the application:

### Required Test IDs
- Navigation: `user-menu`, `logout-button`
- Forms: `email`, `password`, `login-button`
- Product Config: `width-input`, `height-input`, `next-step`
- Cart: `add-to-cart`, `checkout-button`, `cart-item`
- Checkout: `place-order`, `order-confirmation`

## Reporting

Tests generate multiple report formats:
- **HTML Report**: Interactive test results with screenshots
- **JSON Report**: Machine-readable results for CI integration
- **JUnit XML**: Compatible with most CI systems

## Best Practices

1. **Test Independence**: Each test is isolated and can run independently
2. **Data Cleanup**: Tests use fresh data or clean up after themselves
3. **Realistic Scenarios**: Tests mirror real user workflows
4. **Error Handling**: Tests validate both success and failure paths
5. **Performance**: Tests include timing validations for UX

## Troubleshooting

### Common Issues

**Test Timeout**
- Increase timeout in `playwright.config.ts`
- Add explicit waits: `await page.waitForSelector()`

**Authentication Failures**
- Verify test user credentials in database
- Check session timeout settings

**Element Not Found**
- Ensure `data-testid` attributes exist in application
- Use browser dev tools to verify selectors

**Database State**
- Reset test database between runs
- Ensure test products exist with correct slugs

## Contributing

1. Add new test scenarios in appropriate workflow files
2. Update `TestHelpers` for reusable functionality
3. Maintain `data-testid` attributes in application code
4. Document new test requirements in this README

## Integration with Main Application

This testing suite validates the workflow analyzed in the main application:

1. **Vendor Creation** → `app/vendor/products/new/page.tsx`
2. **Product Configuration** → `app/products/configure/[slug]/page.tsx`
3. **Cart Management** → `context/CartContext.tsx`
4. **Order Creation** → `app/api/orders/create/route.ts`

The tests ensure the complete product lifecycle functions correctly end-to-end.