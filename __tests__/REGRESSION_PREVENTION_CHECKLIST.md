# 🛡️ Regression Prevention Checklist

## **Before Making ANY Code Changes**

### ✅ **Pre-Change Validation**
```bash
# 1. Run baseline tests
cd __tests__
./run-tests.sh critical

# 2. Verify main app is running
curl http://localhost:3000 # Should return HTML

# 3. Check current database connection count
mysql -u root -p -e "SHOW PROCESSLIST;" | wc -l
```

**All baseline tests should PASS before starting work.**

---

## **During Development**

### 🔧 **Component Changes** (Frontend)
If modifying: `PricingMatrix`, `Features`, `RoomRecommendations`, or similar components:

```bash
# Run component-specific tests
./run-tests.sh unit

# Watch for specific component
npm run test:watch -- --testNamePattern="PricingMatrix"
```

**Key Things to Check:**
- [ ] Component state updates correctly
- [ ] Data saves and loads without loss
- [ ] Key formats remain consistent (use `_` not `-`)
- [ ] Error handling works

### 🗄️ **Database Changes** (Backend)
If modifying: Database queries, connections, or transactions:

```bash
# Run database tests
./run-tests.sh database

# Check connection count during tests
mysql -u root -p -e "SHOW PROCESSLIST;"
```

**Critical Patterns to Follow:**
- [ ] Use `pool.execute()` for simple queries
- [ ] Use `getConnection()` ONLY for transactions
- [ ] ALWAYS call `connection.release()` in finally block
- [ ] Never use deprecated options (acquireTimeout, timeout, reconnect)

### 🌐 **API Changes** (Backend)
If modifying: API routes, request/response formats:

```bash
# Run API tests
./run-tests.sh api

# Test specific endpoint
npm run test:watch -- --testNamePattern="vendor/products"
```

**Response Schema Requirements:**
- [ ] Include `features` array with proper structure
- [ ] Include `roomRecommendations` array
- [ ] Use correct pricing matrix key format (`width_height`)
- [ ] Return proper error format on failures

---

## **After Making Changes**

### 🧪 **Immediate Testing**
```bash
# 1. Run tests for changed area
./run-tests.sh [unit|database|api]

# 2. Run all critical tests
./run-tests.sh critical

# 3. Quick smoke test in browser
# - Load a product edit page
# - Verify features tab populates
# - Verify pricing matrix loads
# - Try saving a change
```

### 📊 **Deeper Validation**
```bash
# 1. Run full test suite
./run-tests.sh all

# 2. Check test coverage
./run-tests.sh coverage

# 3. Monitor database connections
mysql -u root -p -e "SHOW PROCESSLIST;" | wc -l
# Should be < 10 connections
```

---

## **Before Committing**

### 🔍 **Final Checks**
```bash
# 1. Full regression test suite
./run-tests.sh ci

# 2. Lint and type check main project
cd ../
npm run lint

# 3. Build succeeds
npm run build
```

**All tests must PASS before committing.**

---

## **Specific Issue Prevention**

### 🚨 **Pricing Matrix Issues**
**Before changing PricingMatrix component or related APIs:**

```bash
# Test current pricing functionality
npm run test:watch -- --testNamePattern="PricingMatrix"
```

**Key Validation Points:**
- [ ] Key format uses underscore: `11-20_21-30`
- [ ] Parser splits on underscore correctly
- [ ] Database conversion preserves all data
- [ ] No data loss in save/load cycle

### 🏷️ **Features Tab Issues**
**Before changing Features component or `/api/vendor/products/[id]`:**

```bash
# Test features functionality
npm run test:watch -- --testNamePattern="Features"
```

**Key Validation Points:**
- [ ] Features array loads from database
- [ ] Database query joins features table correctly
- [ ] Component populates on edit page load
- [ ] Save/load cycle preserves all features

### 🏠 **Room Recommendations Issues**  
**Before changing RoomRecommendations component or room APIs:**

```bash
# Test room functionality
npm run test:watch -- --testNamePattern="RoomRecommendations"
```

**Key Validation Points:**
- [ ] Room types load from `/api/rooms`
- [ ] Recommendations save to `product_rooms` table
- [ ] Component populates existing recommendations
- [ ] Priority mapping works correctly

### 🔌 **Database Connection Issues**
**Before changing any database code:**

```bash
# Test connection management
npm run test:watch -- --testNamePattern="connection"

# Monitor connections during development
watch 'mysql -u root -p -e "SHOW PROCESSLIST;" | wc -l'
```

**Critical Patterns:**
- [ ] ✅ `pool.execute('SELECT...', [params])`
- [ ] ❌ `pool.getConnection()` without `release()`
- [ ] ✅ Transaction pattern with try/finally
- [ ] ❌ Missing `connection.release()`

---

## **Emergency Rollback Checklist**

### 🚨 **If Regressions Detected in Production**

1. **Immediate Assessment:**
   ```bash
   # Run full test suite against production API
   ./run-tests.sh all
   
   # Check specific failing area
   ./run-tests.sh [unit|database|api]
   ```

2. **Quick Fixes:**
   - Database connection leaks → Check SHOW PROCESSLIST
   - Features not loading → Check API response format
   - Pricing matrix errors → Verify key format
   - Data loss → Check save/load workflow

3. **Rollback Decision Matrix:**
   - Critical path broken → Immediate rollback
   - Data loss detected → Immediate rollback  
   - Connection leaks → Immediate rollback
   - UI issues only → Hot fix acceptable

---

## **Daily Best Practices**

### 🌅 **Start of Day**
```bash
# Verify everything is working
./run-tests.sh critical
```

### 🌇 **End of Day**
```bash
# Full regression check
./run-tests.sh all

# Check for any connection leaks
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 📝 **Code Review Checklist**
- [ ] Relevant tests added/updated
- [ ] No database anti-patterns introduced
- [ ] API changes maintain backward compatibility
- [ ] Component changes preserve state integrity
- [ ] All tests pass in CI

---

## **Getting Help**

### 🆘 **If Tests Are Failing**
1. Read the test failure message carefully
2. Check if it matches a known regression pattern
3. Look at the test file for expected vs actual behavior
4. Run tests individually to isolate the issue
5. Check recent code changes for related patterns

### 📚 **Key Files to Understand**
- `__tests__/unit/components/PricingMatrix.test.tsx` - Pricing issues
- `__tests__/unit/components/Features.test.tsx` - Features tab issues  
- `__tests__/database/connection-validation.test.ts` - Connection leaks
- `__tests__/api/critical-endpoints.test.ts` - API breaking changes

---

**Remember: A few minutes of testing prevents hours of debugging! 🛡️**