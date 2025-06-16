# Complete Test Execution Guide
## BlindsCommerce UI Testing Suite

This comprehensive guide covers everything you need to know to run the BlindsCommerce UI testing suite independently.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Test User Creation](#test-user-creation)
5. [Running Tests](#running-tests)
6. [Test Categories](#test-categories)
7. [Configuration Options](#configuration-options)
8. [Troubleshooting](#troubleshooting)
9. [CI/CD Integration](#cicd-integration)
10. [Advanced Usage](#advanced-usage)

## 🚀 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher  
- **MySQL**: v8.0 or higher
- **Chrome/Chromium**: Latest version (auto-installed by Playwright)
- **Operating System**: macOS, Linux, or Windows

### Main Application
The BlindsCommerce main application must be running on `http://localhost:3000`

```bash
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev
```

## 🔧 Environment Setup

### 1. Navigate to Test Project
```bash
cd /Users/gopal/BlindsCode/blindscommerce/blindscommerce-ui-tests
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Browser Engines
```bash
npm run install-browsers
```

### 4. Configure Environment Variables
Copy the example environment file and customize:

```bash
cp .env.example .env
```

Edit `.env` file:
```bash
# Test Environment Configuration
BASE_URL=http://localhost:3000

# Test User Credentials
TEST_ADMIN_EMAIL=admin@smartblindshub.com
TEST_ADMIN_PASSWORD=Admin@1234
TEST_VENDOR_EMAIL=vendor@smartblindshub.com
TEST_VENDOR_PASSWORD=Admin@1234
TEST_CUSTOMER_EMAIL=customer@smartblindshub.com
TEST_CUSTOMER_PASSWORD=Admin@1234
TEST_SALES_EMAIL=sales@smartblindshub.com
TEST_SALES_PASSWORD=Admin@1234
TEST_INSTALLER_EMAIL=installer@smartblindshub.com
TEST_INSTALLER_PASSWORD=Admin@1234

# Database Configuration
TEST_DB_HOST=localhost
TEST_DB_USER=root
TEST_DB_PASSWORD=your_mysql_password
TEST_DB_NAME=blindscommerce_test

# API Configuration
API_BASE_URL=http://localhost:3000/api

# Test Configuration
HEADLESS=true
TIMEOUT=30000
SCREENSHOT_ON_FAILURE=true
VIDEO_ON_FAILURE=true
```

## 🗄️ Database Setup

### 1. Create Test Database
```sql
CREATE DATABASE blindscommerce_test;
USE blindscommerce_test;
```

### 2. Import Schema
```bash
mysql -u root -p blindscommerce_test < ../migrations/complete_blinds_schema.sql
```

### 3. Run Database Updates
```bash
cd ../
node scripts/updateRoleSchema.js
cd blindscommerce-ui-tests
```

## 👥 Test User Creation

Create the required test users in your database:

```sql
-- Admin User
INSERT INTO users (email, password, role, name, phone, status, created_at) VALUES 
('admin@smartblindshub.com', '$2b$10$hashed_password_here', 'admin', 'Test Admin', '555-000-0001', 'active', NOW());

-- Vendor User  
INSERT INTO users (email, password, role, name, phone, status, created_at) VALUES 
('vendor@smartblindshub.com', '$2b$10$hashed_password_here', 'vendor', 'Test Vendor', '555-000-0002', 'active', NOW());

-- Customer User
INSERT INTO users (email, password, role, name, phone, status, created_at) VALUES 
('customer@smartblindshub.com', '$2b$10$hashed_password_here', 'customer', 'Test Customer', '555-000-0003', 'active', NOW());

-- Sales User
INSERT INTO users (email, password, role, name, phone, status, created_at) VALUES 
('sales@smartblindshub.com', '$2b$10$hashed_password_here', 'sales', 'Test Sales Rep', '555-000-0004', 'active', NOW());

-- Installer User
INSERT INTO users (email, password, role, name, phone, status, created_at) VALUES 
('installer@smartblindshub.com', '$2b$10$hashed_password_here', 'installer', 'Test Installer', '555-000-0005', 'active', NOW());
```

**Note**: Replace `$2b$10$hashed_password_here` with properly hashed passwords for `Admin@1234`

### Generate Password Hash
```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('Admin@1234', 10);
console.log(hash);
```

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with visible browser
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run tests with UI mode (interactive)
npm run test:ui

# Generate and view HTML report
npm run report
```

### Specific Test Categories

```bash
# Workflow tests
npm run test:workflow

# Vendor tests
npm run test:vendor

# Customer tests  
npm run test:customer

# API tests
npm test tests/api/

# Performance tests
npm test tests/performance/

# Admin tests
npm test tests/admin/

# Role-based access tests
npm test tests/auth/
```

### Single Test Files

```bash
# Run specific test file
npx playwright test tests/workflows/vendor-product-creation.spec.ts

# Run specific test by name
npx playwright test --grep "Complete vendor product creation flow"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in specific directory
npx playwright test tests/workflows/
```

## 📂 Test Categories

### 1. **Workflow Tests** (`tests/workflows/`)
- **vendor-product-creation.spec.ts**: Complete vendor product management
- **customer-product-configuration.spec.ts**: 7-step product configurator  
- **cart-checkout-workflow.spec.ts**: Cart to order completion

### 2. **Role-Based Tests**
- **admin/admin-dashboard.spec.ts**: Admin management functions
- **sales/sales-workflow.spec.ts**: Sales representative operations
- **installer/installer-workflow.spec.ts**: Installation job management
- **auth/role-based-access.spec.ts**: Permission testing

### 3. **API Integration** (`tests/api/`)
- **api-integration.spec.ts**: Backend API testing
  - Authentication endpoints
  - Product management APIs
  - Cart and order APIs
  - Vendor operations
  - Error handling

### 4. **Performance Tests** (`tests/performance/`)
- **performance.spec.ts**: Load times, memory usage, optimization

## ⚙️ Configuration Options

### Browser Configuration
Edit `playwright.config.ts`:

```typescript
// Run tests in different browsers
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
]
```

### Test Timeout
```typescript
// Global timeout
timeout: 30 * 1000, // 30 seconds

// Per-test timeout
test.setTimeout(60000); // 60 seconds for specific test
```

### Parallel Execution
```typescript
// Number of parallel workers
workers: process.env.CI ? 1 : undefined, // Single worker in CI, auto-detect locally

// Run tests in parallel
fullyParallel: true,
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Main Application Not Running**
```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Start the main application first
```bash
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev
```

#### 2. **Database Connection Issues**
```bash
Error: ER_ACCESS_DENIED_ERROR: Access denied for user
```
**Solution**: Check database credentials in `.env`

#### 3. **Test Users Don't Exist**
```bash
Error: Invalid credentials
```
**Solution**: Create test users in database as shown above

#### 4. **Port Already in Use**
```bash
Error: listen EADDRINUSE :::3000
```
**Solution**: Kill existing process or change port
```bash
lsof -ti:3000 | xargs kill -9
```

#### 5. **Browser Download Issues**
```bash
Error: Executable doesn't exist at /path/to/browser
```
**Solution**: Reinstall browsers
```bash
npx playwright install --force
```

#### 6. **Permission Denied Errors**
```bash
Error: EACCES: permission denied
```
**Solution**: Fix permissions
```bash
sudo chown -R $(whoami) node_modules
```

### Debug Mode

Run tests in debug mode for step-by-step execution:
```bash
npm run test:debug tests/workflows/vendor-product-creation.spec.ts
```

### Verbose Logging
```bash
DEBUG=pw:api npx playwright test
```

### Visual Debugging
```bash
# Run with headed browser
npx playwright test --headed --slowMo=1000

# Pause on failure
npx playwright test --pause-on-failure
```

## 🔄 CI/CD Integration

### GitHub Actions
Create `.github/workflows/tests.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: blindscommerce_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        
    - name: Install main app dependencies
      run: npm ci
      
    - name: Setup database
      run: |
        mysql -h 127.0.0.1 -u root -proot blindscommerce_test < migrations/complete_blinds_schema.sql
        node scripts/updateRoleSchema.js
        
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 30
        
    - name: Install test dependencies
      working-directory: ./blindscommerce-ui-tests
      run: npm ci
      
    - name: Install Playwright Browsers
      working-directory: ./blindscommerce-ui-tests
      run: npx playwright install --with-deps
      
    - name: Run Playwright tests
      working-directory: ./blindscommerce-ui-tests
      run: npm test
      
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: blindscommerce-ui-tests/playwright-report/
        retention-days: 30
```

### Docker Integration
Create `Dockerfile.test`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy main application
COPY package*.json ./
COPY . .
RUN npm ci && npm run build

# Copy test suite
COPY blindscommerce-ui-tests/package*.json ./blindscommerce-ui-tests/
COPY blindscommerce-ui-tests/ ./blindscommerce-ui-tests/
WORKDIR /app/blindscommerce-ui-tests
RUN npm ci

# Install browsers
RUN npx playwright install --with-deps

CMD ["npm", "test"]
```

## 🚀 Advanced Usage

### Custom Test Data
Create `test-data/` directory with:

```bash
test-data/
├── products.json       # Test product data
├── users.json         # Additional test users  
├── orders.json        # Sample order data
└── configurations.json # Product configurations
```

### Test Data Setup Script
Create `scripts/setup-test-data.js`:

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupTestData() {
  const connection = await mysql.createConnection({
    host: process.env.TEST_DB_HOST,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME
  });

  // Insert test products, users, etc.
  const products = JSON.parse(fs.readFileSync('test-data/products.json'));
  
  for (const product of products) {
    await connection.execute(
      'INSERT INTO products (name, description, base_price, sku) VALUES (?, ?, ?, ?)',
      [product.name, product.description, product.price, product.sku]
    );
  }

  await connection.end();
}

setupTestData().catch(console.error);
```

### Custom Assertions
Create `utils/custom-assertions.ts`:

```typescript
import { expect } from '@playwright/test';

export async function expectPriceFormat(locator: any) {
  const text = await locator.textContent();
  expect(text).toMatch(/^\$\d{1,3}(,\d{3})*(\.\d{2})?$/);
}

export async function expectValidEmail(locator: any) {
  const value = await locator.inputValue();
  expect(value).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}
```

### Test Report Customization
Modify `playwright.config.ts`:

```typescript
reporter: [
  ['html', { 
    outputFolder: 'test-results/html-report',
    open: 'never' 
  }],
  ['json', { 
    outputFile: 'test-results/results.json' 
  }],
  ['junit', { 
    outputFile: 'test-results/junit.xml' 
  }],
  ['allure-playwright'] // Requires allure-playwright package
],
```

### Parallel Test Execution
```bash
# Run specific number of workers
npx playwright test --workers=4

# Run tests in series
npx playwright test --workers=1

# Run on specific projects only
npx playwright test --project=chromium,firefox
```

### Test Filtering
```bash
# Run only smoke tests
npx playwright test --grep="@smoke"

# Skip flaky tests
npx playwright test --grep-invert="@flaky"

# Run tests by tag
npx playwright test --grep="@critical"
```

### Environment-Specific Runs
```bash
# Production-like testing
BASE_URL=https://staging.smartblindshub.com npm test

# Local development
BASE_URL=http://localhost:3000 npm test

# Different database
TEST_DB_NAME=blindscommerce_staging npm test
```

## 📊 Test Metrics and Reporting

### Key Metrics Tracked
- **Test Coverage**: Workflow completion rates
- **Performance**: Page load times, API response times
- **Reliability**: Test pass/fail rates
- **Browser Compatibility**: Cross-browser test results

### Report Analysis
After running tests, check:

1. **HTML Report**: `test-results/html-report/index.html`
2. **Screenshots**: `test-results/screenshots/`
3. **Videos**: `test-results/videos/`
4. **Traces**: `test-results/traces/`

### Continuous Monitoring
Set up alerts for:
- Test failure rates > 5%
- Page load times > 3 seconds
- API response times > 1 second
- Memory usage increases > 100MB

## 🎯 Best Practices

1. **Test Independence**: Each test should run independently
2. **Data Cleanup**: Clean up test data after each test
3. **Realistic Scenarios**: Mirror real user workflows
4. **Error Handling**: Test both success and failure paths
5. **Performance Awareness**: Monitor test execution times
6. **Documentation**: Keep test documentation updated

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- Update test data monthly
- Review and update selectors quarterly  
- Performance benchmark updates
- Browser compatibility checks

### Getting Help
1. Check this documentation first
2. Review test logs and screenshots
3. Run tests in debug mode
4. Check main application logs
5. Verify database state

This comprehensive guide should enable you to run the BlindsCommerce UI testing suite completely independently. The test suite covers the entire workflow from vendor product creation through customer order placement, ensuring the reliability and performance of your e-commerce platform.