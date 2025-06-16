# Load Testing Guide for BlindsCommerce

This comprehensive guide covers all load testing capabilities included in the BlindsCommerce UI testing suite.

## 🎯 **What is Load Testing and Why Do It?**

Load testing simulates real-world traffic to your application to:
- **Find breaking points** - How many users can your system handle?
- **Identify bottlenecks** - Which parts slow down under pressure?
- **Validate performance** - Do pages load fast enough for users?
- **Test scalability** - Can you handle Black Friday traffic?
- **Prevent outages** - Fix problems before customers experience them

## 📊 Load Testing Overview

The testing suite includes **3 complementary approaches**:

### 1. **Playwright Load Tests** 🎭
- **What**: Real browser simulation with multiple users
- **Best for**: UI performance, JavaScript execution, memory leaks
- **Simulates**: Actual users clicking, typing, navigating
- **Example**: 10 users simultaneously configuring products

### 2. **K6 Load Tests** ⚡
- **What**: High-performance API testing without browsers  
- **Best for**: Backend performance, database stress, API limits
- **Simulates**: Direct API calls at high volume
- **Example**: 1000 API requests per second

### 3. **Artillery Load Tests** 🎯
- **What**: Scenario-based testing with realistic user journeys
- **Best for**: Complete workflows, business metrics, user behavior
- **Simulates**: Real customer shopping patterns
- **Example**: 40% browsers, 30% shoppers, 20% configurators

## 🔧 Setup Requirements

### Install Load Testing Tools

```bash
# K6 (macOS)
brew install k6

# K6 (Linux)
sudo apt-get install k6

# Artillery
npm install -g artillery

# Faker.js for realistic test data
npm install @faker-js/faker
```

### Environment Configuration

Update your `.env` file with load testing parameters:

```bash
# Load Testing Configuration
LOAD_TEST_DURATION=300000      # 5 minutes
CONCURRENT_USERS=50            # Number of concurrent users
API_RATE_LIMIT=100            # Requests per second
STRESS_TEST_USERS=200         # Stress test user count
```

## 🎯 Load Testing Scenarios

### 1. Playwright Load Testing

**File**: `tests/load/load-testing.spec.ts`

```bash
# Run Playwright load tests
npm run test:load

# Run specific load test scenarios
npx playwright test tests/load/load-testing.spec.ts --grep "concurrent users"
```

**Features**:
- ✅ 10 concurrent users simulation
- ✅ Multiple user behavior patterns (browser, configurator, shopper, researcher)
- ✅ API load testing with 20 concurrent requests
- ✅ Database stress testing
- ✅ Memory leak detection
- ✅ Network performance testing
- ✅ Resource exhaustion testing

**Test Scenarios**:

```typescript
// 1. Concurrent User Simulation
test('Simulate 10 concurrent users browsing products')

// 2. API Load Testing  
test('API load testing with concurrent requests')

// 3. Database Stress
test('Heavy product search load testing')
test('Cart operations stress testing')

// 4. Memory Testing
test('Extended session memory leak testing')
test('Resource exhaustion testing')

// 5. Network Testing
test('Slow network performance testing')
```

### 2. K6 Load Testing

**File**: `tests/load/k6-load-tests.js`

```bash
# Run K6 load tests
npm run load:k6

# Run stress test
npm run load:stress

# Custom K6 execution
k6 run --vus 50 --duration 10m tests/load/k6-load-tests.js
```

**Load Test Stages**:
```javascript
stages: [
  { duration: '2m', target: 10 },   // Ramp up
  { duration: '5m', target: 50 },   // Normal load  
  { duration: '2m', target: 100 },  // Increased load
  { duration: '5m', target: 100 },  // Sustained load
  { duration: '2m', target: 200 },  // Spike test
  { duration: '1m', target: 200 },  // Peak load
  { duration: '2m', target: 0 },    // Ramp down
]
```

**User Scenarios** (K6):
- **30%** Anonymous browsing
- **30%** Product search and configuration  
- **20%** Shopping workflow
- **20%** Admin/Vendor operations

**Performance Thresholds**:
```javascript
thresholds: {
  http_req_duration: ['p(95)<2000'], // 95% under 2 seconds
  http_req_failed: ['rate<0.05'],    // <5% error rate
  errors: ['rate<0.05'],             // <5% custom errors
}
```

### 3. Artillery Load Testing

**File**: `tests/load/artillery-load-test.yml`

```bash
# Run Artillery load tests
npm run load:artillery

# Custom Artillery execution
artillery run tests/load/artillery-load-test.yml --output report.json
artillery report report.json
```

**Load Test Phases**:
```yaml
phases:
  - duration: 60,  arrivalRate: 5   # Warm-up
  - duration: 300, arrivalRate: 20  # Load test  
  - duration: 180, arrivalRate: 50  # Peak load
  - duration: 120, arrivalRate: 100 # Stress test
  - duration: 60,  arrivalRate: 5   # Cool down
```

**Scenario Distribution**:
- **40%** Anonymous Browsing
- **30%** Shopping Workflow
- **20%** Configuration Heavy
- **10%** Admin Operations

**Advanced Features**:
- ✅ Realistic user behavior simulation
- ✅ Custom JavaScript functions
- ✅ CSV data injection
- ✅ Performance thresholds
- ✅ Real-time monitoring
- ✅ Memory usage tracking

## 📈 Performance Metrics

### Key Performance Indicators (KPIs)

#### Response Time Targets
- **Homepage**: < 2 seconds
- **Product Catalog**: < 3 seconds  
- **Product Configuration**: < 2 seconds
- **API Endpoints**: < 1 second
- **Search**: < 2 seconds

#### Throughput Targets  
- **Concurrent Users**: 100+ simultaneous users
- **Requests per Second**: 500+ RPS
- **Database Queries**: 1000+ QPS

#### Error Rate Targets
- **HTTP 2xx Success Rate**: > 95%
- **HTTP 4xx Client Errors**: < 5%
- **HTTP 5xx Server Errors**: < 1%

#### Resource Usage Targets
- **Memory Growth**: < 200% over 10 minutes
- **CPU Usage**: < 80% average
- **Database Connections**: < 80% of pool

### Monitoring and Alerting

The load tests track these custom metrics:

```javascript
// Business Metrics
- user_sessions_total
- cart_operations_total  
- product_configurations_total
- search_queries_total
- order_attempts_total

// Performance Metrics  
- response_time_95th_percentile
- error_rate_percentage
- throughput_requests_per_second
- database_query_time

// User Behavior Metrics
- behavior_type_distribution
- device_type_distribution  
- cart_abandonment_rate
- conversion_rate
```

## 🚀 **STEP-BY-STEP: How to Run Load Tests**

### **Prerequisites Checklist** ✅

Before running load tests, ensure you have:

```bash
# ✅ 1. Main application running
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev
# ➜ Should see: "Server running on http://localhost:3000"

# ✅ 2. Database running and accessible
mysql -u root -p blindscommerce_test
# ➜ Should connect without errors

# ✅ 3. Load testing tools installed
k6 version              # Should show K6 version
artillery --version     # Should show Artillery version

# ✅ 4. Test data exists
cd blindscommerce-ui-tests
npm run setup-test-data
# ➜ Should see: "🎉 Test data setup completed successfully!"
```

### **🎯 Method 1: Playwright Load Tests (Beginner-Friendly)**

**What it does**: Simulates real users in browsers clicking and typing

```bash
# Navigate to test directory
cd /Users/gopal/BlindsCode/blindscommerce/blindscommerce-ui-tests

# Run basic load test (10 concurrent users)
npm run test:load

# Expected output:
# 📊 Load Test Results:
#    Successful Users: 9/10 (90.0%)
#    Average User Session: 58234ms
#    📈 API Load Test Results:
#    Average Response Time: 245.67ms
```

**What to look for**:
- ✅ **Success rate > 90%** = Good
- ✅ **Response time < 3000ms** = Good  
- ❌ **Success rate < 80%** = Problem
- ❌ **Response time > 5000ms** = Problem

### **⚡ Method 2: K6 Load Tests (High Performance)**

**What it does**: Tests APIs directly with high volume requests

```bash
# Install K6 first
brew install k6                    # macOS
# OR
sudo apt-get install k6           # Linux

# Run K6 load test
npm run load:k6

# Expected output:
# ✓ login successful................: 95.23%
# ✓ search API works...............: 97.45% 
# http_req_duration................: avg=245ms p(95)=1.2s
# http_reqs........................: 2989   24.9/s
```

**What to look for**:
- ✅ **Check success > 95%** = Excellent
- ✅ **p(95) < 2000ms** = Good response time
- ❌ **http_req_failed > 5%** = Too many errors
- ❌ **http_req_duration > 3000ms** = Too slow

### **🎯 Method 3: Artillery Load Tests (Most Comprehensive)**

**What it does**: Complete user journey simulation with realistic behavior

```bash
# Install Artillery first
npm install -g artillery

# Run Artillery load test
npm run load:artillery

# Expected output:
# Summary report @ 14:32:15(+0000)
# Scenarios launched:  1425
# Scenarios completed: 1398
# Requests completed:  8947
# Mean response/sec:   29.82
# Response time (msec):
#   min: 89
#   max: 5234
#   median: 245
#   p95: 1876
#   p99: 3456
```

**What to look for**:
- ✅ **Scenarios completed > 95%** = Good
- ✅ **p95 < 2000ms** = Good performance
- ✅ **Mean response/sec > 20** = Good throughput
- ❌ **Scenarios completed < 90%** = Issues
- ❌ **p95 > 5000ms** = Performance problems

## **🚨 Troubleshooting Guide**

### **Problem**: Tests are failing immediately
```bash
# Check if main app is running
curl http://localhost:3000
# Should return HTML, not "connection refused"

# If not running:
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev
```

### **Problem**: Database errors in tests
```bash
# Check database connection
mysql -u root -p blindscommerce_test -e "SELECT COUNT(*) FROM users;"
# Should return a number, not an error

# If errors, recreate test data:
npm run setup-clean
npm run setup-test-data
```

### **Problem**: High error rates (>10%)
```bash
# Check application logs
cd /Users/gopal/BlindsCode/blindscommerce
tail -f logs/app.log

# Common issues:
# - Database connection pool exhausted
# - Memory leaks
# - Rate limiting triggered
```

### **Problem**: Slow response times (>5 seconds)
```bash
# Check system resources
top -p $(pgrep node)    # CPU and memory usage
iostat 1 5             # Disk I/O
netstat -an | grep 3000 # Network connections

# Common solutions:
# - Increase database connection pool
# - Add database indexes
# - Enable caching
# - Optimize slow queries
```

## **📊 Understanding Your Results**

### **Good Performance Indicators** ✅
```bash
✅ Response Time p95 < 2 seconds
✅ Success Rate > 95%
✅ Error Rate < 5%
✅ Memory growth < 200% over test duration
✅ Database connections < 80% of pool
✅ CPU usage < 80% average
```

### **Warning Signs** ⚠️
```bash
⚠️  Response Time p95 > 3 seconds
⚠️  Success Rate 90-95%
⚠️  Error Rate 5-10%
⚠️  Memory growth 200-400%
⚠️  Database connections > 80% of pool
⚠️  CPU usage > 80% sustained
```

### **Critical Issues** ❌
```bash
❌ Response Time p95 > 5 seconds
❌ Success Rate < 90%
❌ Error Rate > 10%
❌ Memory growth > 400%
❌ Database connection pool exhausted
❌ CPU usage > 95% sustained
❌ Application crashes or becomes unresponsive
```

## **🎯 Quick Start Guide (5 Minutes)**

**For someone who just wants to run a basic load test:**

```bash
# 1. Start the application (separate terminal)
cd /Users/gopal/BlindsCode/blindscommerce
npm run dev

# 2. Run basic load test (this terminal)
cd /Users/gopal/BlindsCode/blindscommerce/blindscommerce-ui-tests
npm install
npm run setup-test-data
npm run test:load

# 3. Check results
# Look for "Load Test Results" in output
# Success rate should be > 90%
# Response times should be < 3000ms
```

**That's it!** If everything looks good, your application can handle basic load. For more advanced testing, continue with the detailed sections below.

### Comprehensive Load Testing Suite

```bash
# Run all load tests sequentially
npm run test:load && npm run load:k6 && npm run load:artillery

# Generate comprehensive report
mkdir -p load-test-results
npm run test:load > load-test-results/playwright-results.txt
npm run load:k6 --out json=load-test-results/k6-results.json
npm run load:artillery --output load-test-results/artillery-results.json
```

### Stress Testing

```bash
# High-intensity stress test
k6 run --vus 200 --duration 10m tests/load/k6-load-tests.js

# Database stress test
npx playwright test tests/load/load-testing.spec.ts --grep "Database stress"

# Memory stress test  
npx playwright test tests/load/load-testing.spec.ts --grep "memory leak"
```

## 📊 Result Analysis

### Playwright Results

Results appear in the console with detailed metrics:

```
📊 Load Test Results:
   Total Duration: 62847ms
   Successful Users: 9/10 (90.0%)
   Failed Users: 1
   Average User Session: 58234ms

📈 API Load Test Results:
   Total Requests: 100
   Successful: 97 (97.0%)
   Failed: 3
   Average Response Time: 245.67ms
   Min/Max Response Time: 89ms / 1245ms
```

### K6 Results

K6 provides detailed performance statistics:

```
     ✓ login successful
     ✓ search API works  
     ✓ cart operations successful

     checks.........................: 95.23% ✓ 2847 ✗ 142
     data_received..................: 4.2 MB 35 kB/s
     data_sent......................: 1.1 MB 9.2 kB/s
     http_req_duration..............: avg=245ms p(95)=1.2s
     http_req_failed................: 4.76% ✓ 142  ✗ 2847
     http_reqs......................: 2989   24.9/s
     iteration_duration.............: avg=2.1s  min=1.2s
     iterations.....................: 1425   11.87/s
     vus............................: 50     min=10 max=200
     vus_max........................: 200    min=200 max=200
```

### Artillery Results

Artillery generates comprehensive HTML reports:

```bash
artillery report load-test-results/artillery-results.json
```

Key metrics include:
- Request rate over time
- Response time distribution  
- Error rate trends
- Scenario completion rates
- Custom business metrics

## 🔍 Troubleshooting Load Tests

### Common Issues

#### 1. **High Error Rates (>5%)**
```bash
# Check application logs
tail -f ../logs/app.log

# Verify database connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check memory usage
top -p $(pgrep node)
```

#### 2. **Slow Response Times**
```bash
# Monitor database performance
mysql -u root -p -e "SHOW ENGINE INNODB STATUS;"

# Check Node.js event loop
node --inspect ../server.js

# Profile application
npm run dev --inspect
```

#### 3. **Memory Leaks**
```bash
# Run memory-specific tests
npx playwright test tests/load/load-testing.spec.ts --grep "memory leak"

# Monitor with tools
node --inspect --inspect-brk ../server.js
```

#### 4. **Database Connection Exhaustion**
```sql
-- Check connection limits
SHOW VARIABLES LIKE 'max_connections';

-- Check current connections  
SHOW STATUS LIKE 'Threads_connected';

-- Optimize connection pool
-- Update database configuration
```

### Performance Optimization Tips

#### Application Level
```javascript
// 1. Enable compression
app.use(compression());

// 2. Implement caching
app.use('/api', cache('5 minutes'));

// 3. Optimize database queries
// Add indexes, use query optimization

// 4. Connection pooling
const pool = mysql.createPool({
  connectionLimit: 100,
  acquireTimeout: 60000,
  timeout: 60000
});
```

#### Database Level
```sql
-- 1. Add indexes for frequently queried columns
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_status ON orders(status);

-- 2. Optimize query cache
SET GLOBAL query_cache_size = 1048576;

-- 3. Tune InnoDB settings
SET GLOBAL innodb_buffer_pool_size = 2147483648;
```

#### Infrastructure Level
```bash
# 1. Increase system limits
ulimit -n 65536

# 2. Optimize network settings
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf

# 3. Use load balancer
# Configure nginx or similar load balancer
```

## 📈 Continuous Load Testing

### CI/CD Integration

Create `.github/workflows/load-tests.yml`:

```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          npm ci
          cd blindscommerce-ui-tests && npm ci
      
      - name: Start application
        run: |
          npm start &
          sleep 30
      
      - name: Run load tests
        working-directory: ./blindscommerce-ui-tests
        run: |
          npm run test:load
          npm run load:k6
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: blindscommerce-ui-tests/load-test-results/
```

### Performance Monitoring

Set up continuous monitoring:

```javascript
// Performance alerts
const performanceThresholds = {
  responseTime95th: 2000,    // 2 seconds
  errorRate: 0.05,           // 5%
  throughput: 100,           // 100 RPS minimum
  memoryGrowth: 2.0          // 200% growth max
};

// Alert on threshold violations
if (metrics.responseTime95th > performanceThresholds.responseTime95th) {
  sendAlert('High response time detected');
}
```

## 🎯 Load Testing Best Practices

### 1. **Test Environment**
- Use production-like data volumes
- Match production hardware specs
- Test with realistic network conditions
- Include all third-party integrations

### 2. **Test Design**  
- Start with baseline performance tests
- Gradually increase load to find breaking points
- Test different user behavior patterns
- Include error scenarios and edge cases

### 3. **Monitoring**
- Monitor application, database, and infrastructure
- Track business metrics alongside technical metrics  
- Set up real-time alerting
- Capture performance baselines

### 4. **Analysis**
- Compare results across test runs
- Identify performance bottlenecks
- Correlate performance with business impact
- Document optimization recommendations

This comprehensive load testing suite ensures your BlindsCommerce platform can handle real-world traffic patterns and provides the insights needed to optimize performance at scale.