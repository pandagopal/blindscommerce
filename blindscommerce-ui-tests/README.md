# BlindsCommerce UI Testing Suite

A comprehensive UI testing framework for the BlindsCommerce e-commerce platform using Playwright, K6, and Artillery.

## 🚀 **Quick Start (5 Minutes)**

```bash
# 1. Navigate to test directory
cd /Users/gopal/BlindsCode/blindscommerce/blindscommerce-ui-tests

# 2. Install dependencies
npm install && npm run install-browsers

# 3. Setup test data
npm run setup-test-data

# 4. Start main application (separate terminal)
cd ../
npm run dev

# 5. Run basic tests
npm test                    # All UI tests
npm run test:load          # Load testing
```

## 📋 **What This Testing Suite Covers**

### **Complete User Workflows** ✅
- **Vendor Product Creation** - Multi-step forms, bulk uploads, validation
- **Customer Product Configuration** - 7-step configurator with 1/8" precision
- **Cart & Checkout** - End-to-end purchase workflow
- **Admin Management** - User, vendor, order management
- **Role-Based Access** - 7-tier permission system testing

### **All User Roles** ✅
- **Admin** - Dashboard management, user/vendor oversight
- **Vendor** - Product creation, bulk operations, analytics
- **Sales** - Lead management, quotes, commission tracking
- **Installer** - Job scheduling, installation workflow, materials
- **Customer** - Product browsing, configuration, purchasing

### **Performance & Load Testing** ✅
- **Playwright Load Tests** - Real browser concurrent user simulation
- **K6 Load Tests** - High-performance API stress testing
- **Artillery Load Tests** - Comprehensive scenario-based testing
- **Performance Monitoring** - Memory usage, response times, throughput

### **API Integration Testing** ✅
- **Authentication** - JWT tokens, role validation, session management
- **Product APIs** - CRUD operations, search, pricing calculations
- **Cart Operations** - Add/remove/update items, pricing updates
- **Order Processing** - Creation, status updates, fulfillment
- **Error Handling** - Validation, rate limiting, graceful failures

## 🏗️ **Project Structure**

```
blindscommerce-ui-tests/
├── tests/
│   ├── workflows/           # Core user journeys
│   │   ├── vendor-product-creation.spec.ts
│   │   ├── customer-product-configuration.spec.ts
│   │   └── cart-checkout-workflow.spec.ts
│   ├── admin/              # Admin management tests
│   ├── sales/              # Sales operations
│   ├── installer/          # Installation jobs
│   ├── auth/               # Role permissions
│   ├── api/                # Backend API testing
│   ├── performance/        # Performance monitoring
│   └── load/               # Load testing (NEW!)
│       ├── load-testing.spec.ts     # Playwright load tests
│       ├── k6-load-tests.js         # K6 performance tests
│       └── artillery-load-test.yml  # Artillery scenario tests
├── scripts/
│   └── setup-test-data.js  # Auto-creates test users/products
├── test-data/              # Test data files
├── utils/                  # Test helpers and utilities
├── TEST_EXECUTION_GUIDE.md # Complete setup guide
├── LOAD_TESTING_GUIDE.md   # Load testing guide (NEW!)
└── playwright.config.ts    # Test configuration
```

## 🧪 **Test Categories**

### **1. Workflow Tests** (`npm run test:workflow`)
```bash
# Core user journeys
npm run test:vendor         # Vendor product creation
npm run test:customer       # Product configuration  
npm run test:cart          # Cart to checkout
```

### **2. Role-Based Tests**
```bash
npm run test:admin         # Admin dashboard tests
npm run test:sales         # Sales workflow tests
npm run test:installer     # Installer job tests
npm run test:auth          # Permission testing
```

### **3. API Integration** (`npm run test:api`)
```bash
# Backend API testing
# - Authentication endpoints
# - Product management APIs
# - Cart and order operations
# - Error handling validation
```

### **4. Performance Tests** (`npm run test:performance`)
```bash
# Page load performance
# Memory usage monitoring
# Resource optimization
# Mobile performance
```

### **5. Load Testing** (`npm run test:load`) **🆕**
```bash
npm run test:load          # Playwright concurrent users
npm run load:k6           # K6 API stress testing
npm run load:artillery    # Artillery scenario testing
npm run load:stress       # High-intensity stress test
```

## 🔧 **Setup Requirements**

### **System Requirements**
- **Node.js** v18+ 
- **MySQL** v8.0+
- **Chrome/Chromium** (auto-installed)
- **Main BlindsCommerce app** running on localhost:3000

### **Install Dependencies**
```bash
# Core dependencies
npm install

# Browser engines  
npm run install-browsers

# Load testing tools (optional)
brew install k6                    # macOS
npm install -g artillery           # All platforms
```

### **Environment Setup**
```bash
# Copy and configure environment
cp .env.example .env

# Key settings:
BASE_URL=http://localhost:3000
TEST_DB_NAME=blindscommerce_test
TEST_ADMIN_EMAIL=admin@smartblindshub.com
TEST_ADMIN_PASSWORD=Admin@1234
```

### **Test Data Setup**
```bash
# Auto-create test users, products, orders
npm run setup-test-data

# Clean and recreate (if needed)
npm run setup-clean
```

## 🎯 **Key Features**

### **Industry-Standard Testing** ✅
- **Fraction Precision** - Tests 1/8" measurement inputs
- **Multi-Vendor** - Tests marketplace functionality
- **Role Hierarchy** - 7-tier user permission system
- **Real E-commerce Workflows** - Complete purchase journeys

### **Comprehensive Coverage** ✅
- **Cross-Browser** - Chrome, Firefox, Safari, Mobile
- **Multiple Devices** - Desktop, tablet, mobile testing
- **Performance Monitoring** - Load times, memory usage
- **Error Scenarios** - Validation, edge cases, failures

### **Advanced Load Testing** ✅
- **Concurrent Users** - Simulate 10-200+ simultaneous users
- **Realistic Behavior** - Browser, configurator, shopper patterns
- **API Stress Testing** - High-volume backend testing
- **Performance Thresholds** - Industry-standard benchmarks

### **Self-Contained** ✅
- **Independent Database** - Uses separate test database
- **Auto Test Data** - Creates users, products, orders automatically
- **Complete Documentation** - Step-by-step guides
- **CI/CD Ready** - GitHub Actions, Docker support

## 📊 **Understanding Test Results**

### **Success Indicators** ✅
```bash
✅ Test Pass Rate > 95%
✅ Page Load Times < 3 seconds
✅ API Response Times < 1 second
✅ Load Test Success Rate > 90%
✅ Memory Growth < 200% over test duration
```

### **Warning Signs** ⚠️
```bash
⚠️  Test Pass Rate 90-95%
⚠️  Page Load Times 3-5 seconds
⚠️  API Response Times 1-2 seconds
⚠️  Load Test Success Rate 80-90%
⚠️  Memory Growth 200-400%
```

### **Critical Issues** ❌
```bash
❌ Test Pass Rate < 90%
❌ Page Load Times > 5 seconds
❌ API Response Times > 2 seconds
❌ Load Test Success Rate < 80%
❌ Memory Growth > 400%
❌ Application crashes during testing
```

## 🚀 **Common Commands**

### **Daily Testing**
```bash
npm test                   # Run all UI tests
npm run test:smoke        # Quick smoke tests
npm run test:critical     # Critical path tests
```

### **Development Testing**
```bash
npm run test:headed       # Watch tests run in browser
npm run test:debug        # Debug failing tests
npm run test:ui           # Interactive test UI
```

### **Performance Testing**
```bash
npm run test:performance  # Performance monitoring
npm run test:load         # Load testing suite
npm run load:stress       # Stress test (200 users)
```

### **Reporting**
```bash
npm run report            # View HTML test reports
playwright show-report    # Detailed test results
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### Tests Failing Immediately
```bash
# Check if main app is running
curl http://localhost:3000
# Should return HTML, not connection error

# Start main application
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev
```

#### Database Connection Errors
```bash
# Verify database exists
mysql -u root -p blindscommerce_test -e "SHOW TABLES;"

# Recreate test data
npm run setup-clean
npm run setup-test-data
```

#### Load Tests Showing High Error Rates
```bash
# Check system resources
top -p $(pgrep node)
iostat 1 5

# Common solutions:
# - Increase database connection pool
# - Add memory to system
# - Optimize slow database queries
```

## 📚 **Documentation**

- **TEST_EXECUTION_GUIDE.md** - Complete setup and execution guide
- **LOAD_TESTING_GUIDE.md** - Comprehensive load testing documentation
- **Test Helper Classes** - Reusable functions for all workflows
- **Example Test Files** - Reference implementations

## 🎯 **What Makes This Special**

1. **Complete E-commerce Coverage** - Tests entire workflow from vendor → customer → order
2. **Industry-Standard Measurements** - Uses 1/8" fraction inputs like real blinds companies
3. **Multi-Role Architecture** - Tests 7-tier role hierarchy (admin, vendor, sales, installer, customer)
4. **Realistic Load Testing** - Simulates actual user behavior patterns
5. **Self-Contained** - Independent project with own database and test data
6. **Production-Ready** - Can be used for continuous monitoring and CI/CD

## 🚀 **Get Started Now**

1. **Quick Test**: `npm install && npm run setup-test-data && npm test`
2. **Load Testing**: See `LOAD_TESTING_GUIDE.md` for comprehensive load testing
3. **Full Documentation**: See `TEST_EXECUTION_GUIDE.md` for complete setup

This testing suite ensures your BlindsCommerce platform can handle real-world traffic and provides the confidence to scale your business! 🎯