# API Consolidation Implementation Plan: 215 → 50 APIs

## Executive Summary
Consolidating 215 APIs down to 50 by creating role-based, feature-complete endpoints that serve entire pages/workflows rather than micro-operations.

## Target Architecture (50 APIs)

### 1. **Authentication & Session (3 APIs)**
- `/api/auth` - Unified auth for all roles
- `/api/auth/password` - Password operations
- `/api/auth/social` - Social login providers

### 2. **Admin Portal (14 APIs)**
- `/api/admin/auth`
- `/api/admin/dashboard`
- `/api/admin/users`
- `/api/admin/vendors`
- `/api/admin/products`
- `/api/admin/orders`
- `/api/admin/categories`
- `/api/admin/rooms`
- `/api/admin/pricing`
- `/api/admin/settings`
- `/api/admin/tax`
- `/api/admin/payments`
- `/api/admin/samples`
- `/api/admin/content`

### 3. **Vendor Portal (11 APIs)**
- `/api/vendor/auth`
- `/api/vendor/dashboard`
- `/api/vendor/products`
- `/api/vendor/orders`
- `/api/vendor/pricing`
- `/api/vendor/team`
- `/api/vendor/payments`
- `/api/vendor/storefront`
- `/api/vendor/profile`
- `/api/vendor/bulk`
- `/api/vendor/files`

### 4. **Customer/Shopping (10 APIs)**
- `/api/products` - Public product catalog
- `/api/products/search` - Search & filters
- `/api/products/[id]` - Product details
- `/api/cart` - Cart management
- `/api/checkout` - Checkout process
- `/api/orders` - Customer orders
- `/api/account` - Customer account
- `/api/reviews` - Product reviews
- `/api/wishlist` - Wishlist
- `/api/addresses` - Address book

### 5. **Payments (3 APIs)**
- `/api/payments/process` - Unified payment processing
- `/api/payments/methods` - Available methods
- `/api/webhooks/payments` - All payment webhooks

### 6. **Common/Shared (9 APIs)**
- `/api/homepage` - Homepage data
- `/api/settings/public` - Public settings
- `/api/notifications` - Notifications
- `/api/files/upload` - File uploads
- `/api/analytics/events` - Event tracking
- `/api/search` - Global search
- `/api/ai/recommendations` - AI features
- `/api/room-visualizer` - AR/VR features
- `/api/iot/devices` - Smart home integration

## Consolidation Examples

### Example 1: Cart APIs (22 → 1)
**Before:**
```
/api/cart/enhanced/items/[id]/gift
/api/cart/enhanced/items/[id]/installation
/api/cart/enhanced/items/[id]/sample
/api/cart/enhanced/items/[id]/save-for-later
/api/cart/enhanced/items/[id]/quantity
... (17 more endpoints)
```

**After:**
```typescript
// Single cart API with action-based operations
/api/cart
  GET - Get cart
  POST - Add item
  PUT /items/[id] - Update item (quantity, gift, installation, etc.)
  DELETE /items/[id] - Remove item
  POST /apply-coupon - Apply coupon
  POST /calculate - Calculate totals
```

### Example 2: Payment APIs (11 → 3)
**Before:**
```
/api/payments/stripe/create-payment-intent
/api/payments/paypal/create-order
/api/payments/klarna/create-session
... (8 more providers)
```

**After:**
```typescript
/api/payments/process
  POST - Process payment with provider parameter
  Body: { provider: 'stripe'|'paypal'|'klarna', amount, ... }
```

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)
1. Create base API handler utilities
2. Implement unified error handling
3. Set up response caching layer
4. Create migration tracking system

### Phase 2: Admin APIs (Week 2)
1. Implement 14 consolidated admin endpoints
2. Update admin pages to use new APIs
3. Add backwards compatibility layer
4. Test all admin workflows

### Phase 3: Vendor APIs (Week 3)
1. Implement 11 consolidated vendor endpoints
2. Update vendor portal
3. Migrate existing vendor data calls
4. Test vendor workflows

### Phase 4: Customer APIs (Week 4)
1. Consolidate cart/checkout APIs
2. Unify product APIs
3. Streamline account APIs
4. Test shopping workflows

### Phase 5: Cleanup (Week 5)
1. Remove deprecated endpoints
2. Update documentation
3. Performance optimization
4. Final testing

## Performance Improvements

### Database Connections
- **Before**: 215 APIs × 3 avg calls = 645 potential connections
- **After**: 50 APIs × 2 avg calls = 100 potential connections
- **Reduction**: 85% fewer connections

### API Calls per Page
- **Before**: 5-10 API calls per page load
- **After**: 1-2 API calls per page load
- **Reduction**: 80% fewer HTTP requests

### Code Maintenance
- **Before**: 215 files to maintain
- **After**: 50 files to maintain
- **Reduction**: 77% less code

## Migration Rules

1. **Never break existing functionality**
   - Keep old endpoints during migration
   - Use feature flags for gradual rollout

2. **Data aggregation on server**
   - Combine related data in single response
   - Use Promise.all() for parallel queries

3. **Consistent response format**
   ```typescript
   {
     success: boolean,
     data: any,
     error?: string,
     pagination?: {...},
     metadata?: {...}
   }
   ```

4. **Smart caching**
   - Cache at API level
   - Invalidate on mutations
   - Use appropriate TTLs

## Success Metrics

1. **Database connection pool usage < 50%**
2. **Average page load time < 2 seconds**
3. **API response time < 200ms (p95)**
4. **Zero downtime during migration**
5. **Developer satisfaction increase**

## Next Steps

1. Start with Phase 1 infrastructure
2. Create first consolidated endpoint (Admin Dashboard)
3. Measure performance improvement
4. Iterate based on results