# V2 API System Recovery Guide

## Issue Summary

After the V2 API migration, the system experienced failures due to:

1. **Circular Dependency**: The authentication system (`lib/auth.ts`) was calling the V2 API to get user data, but the V2 API requires authentication, creating an infinite loop.

2. **Database Connection Issues**: Once the auth failed, cascading failures occurred throughout the system.

3. **Pricing Column Inconsistencies**: Some decimal precision issues that could cause calculation errors.

## Fixes Applied

### 1. Authentication Circular Dependency Fix

**File**: `lib/auth.ts`
**Change**: Modified `getCurrentUser()` to use direct database queries instead of V2 API calls.

```typescript
// Before (PROBLEMATIC):
const response = await fetch(`/api/v2/users/${decoded.userId}`);

// After (FIXED):
const pool = await getPool();
const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [decoded.userId]);
```

### 2. Database Scripts Created

1. **`scripts/fix-pricing-columns.sql`** - Standardizes all pricing columns to DECIMAL(10,2)
2. **`scripts/verify-pricing-engine.ts`** - Validates pricing calculation flow
3. **`scripts/system-health-check.ts`** - Comprehensive system diagnostics
4. **`scripts/emergency-recovery.sh`** - Quick recovery script

### 3. Documentation Created

- **`docs/PRICING_SYSTEM.md`** - Complete pricing system documentation
- **`lib/auth-fixed.ts`** - Reference implementation without circular dependency

## Recovery Steps

### Quick Recovery (Recommended)

```bash
# 1. Run the emergency recovery script
./scripts/emergency-recovery.sh

# 2. Start the application
npm run dev

# 3. Verify system health
ts-node scripts/system-health-check.ts
```

### Manual Recovery

1. **Fix Authentication**:
   ```bash
   # The auth.ts file has already been patched
   # Verify the fix is in place:
   grep "FIXED: Direct database query" lib/auth.ts
   ```

2. **Clear Caches**:
   ```bash
   rm -rf .next
   npm install
   ```

3. **Apply Database Fixes** (Optional):
   ```bash
   mysql -u root -p blindscommerce_test < scripts/fix-pricing-columns.sql
   ```

4. **Restart Application**:
   ```bash
   npm run dev
   ```

## Monitoring

### Health Check Command
```bash
ts-node scripts/system-health-check.ts
```

This will check:
- Environment variables
- Database connection
- Critical tables
- Authentication system
- V2 API endpoints
- Pricing column consistency

### Key Metrics to Monitor

1. **Database Connections**: Should stay under 10 (pool limit)
2. **API Response Times**: Should be <1s
3. **Auth Token Generation**: Should work without API calls
4. **Error Logs**: Check for circular dependency errors

## Prevention

To prevent similar issues:

1. **Never call V2 APIs from auth functions** - Use direct DB queries
2. **Test circular dependencies** before deploying
3. **Monitor connection pool usage**
4. **Keep emergency recovery scripts updated**

## Additional Notes

- The pricing SQL migration is optional but recommended for consistency
- The auth fix is critical and must remain in place
- Regular health checks help catch issues early
- All V2 APIs should now work correctly with the auth fix

## Support

If issues persist after recovery:

1. Check application logs for specific errors
2. Run the health check script with verbose mode:
   ```bash
   VERBOSE=true ts-node scripts/system-health-check.ts
   ```
3. Verify all environment variables are correctly set
4. Ensure MySQL server is running and accessible

---

*Last Updated: 2025-06-27*
*Critical Fix Applied: Authentication circular dependency resolved*