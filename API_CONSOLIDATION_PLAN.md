# API Consolidation Plan: 215 → 50 APIs

## Current Problem: Massive API Bloat
- **Current**: 215 separate API endpoints
- **Optimal**: 50 well-designed APIs
- **Bloat Factor**: 4.3x over-engineering

## Root Causes of API Bloat

### 1. **Over-Granular CRUD Operations**
**Problem**: Separate APIs for every tiny operation
- `/api/cart/enhanced/items/[id]/gift/route.ts`
- `/api/cart/enhanced/items/[id]/installation/route.ts`
- `/api/cart/enhanced/items/[id]/sample/route.ts`
- `/api/cart/enhanced/items/[id]/save-for-later/route.ts`

**Solution**: Consolidate into `/api/cart/items/[id]` with action parameters

### 2. **Separate APIs Per Payment Method**
**Problem**: 11 payment APIs for essentially the same function
- `/api/payments/stripe/create-payment-intent`
- `/api/payments/paypal/create-order`
- `/api/payments/klarna/create-session`
- `/api/payments/afterpay/create-checkout`
- `/api/payments/affirm/create-checkout`

**Solution**: Unified `/api/payments/process` with provider parameter

### 3. **Admin Feature Fragmentation**
**Problem**: 32 admin APIs for features that should be consolidated
- `/api/admin/pricing/commissions`
- `/api/admin/pricing/global-discounts`
- `/api/admin/pricing/vendor-discounts`
- `/api/admin/pricing/volume-discounts`

**Solution**: `/api/admin/pricing` with type parameters

### 4. **Vendor Portal Over-Engineering**
**Problem**: 32 vendor APIs with excessive separation
- `/api/vendor/bulk-products/export`
- `/api/vendor/bulk-products/import`
- `/api/vendor/bulk-products/jobs`
- `/api/vendor/bulk-products/stats`
- `/api/vendor/bulk-products/template`

**Solution**: `/api/vendor/products/bulk` with action parameters

## Consolidation Strategy

### **Target API Structure (50 APIs)**

#### **Authentication (4 APIs)**
1. `/api/auth/session` - login, logout, refresh, verify
2. `/api/auth/password` - reset, change, validate
3. `/api/auth/register` - all registration types
4. `/api/auth/social` - social login providers

#### **User Management (6 APIs)**
1. `/api/users` - CRUD for all user types
2. `/api/users/[id]/profile` - profile management
3. `/api/users/[id]/addresses` - address management
4. `/api/users/[id]/payment-methods` - payment methods
5. `/api/users/[id]/preferences` - user settings
6. `/api/users/[id]/orders` - order history

#### **Products (8 APIs)**
1. `/api/products` - list, search, filter
2. `/api/products/[id]` - product details, reviews, configurations
3. `/api/products/compare` - product comparison
4. `/api/products/recommendations` - AI recommendations
5. `/api/categories` - category management
6. `/api/products/search/visual` - visual search
7. `/api/products/bulk` - bulk operations
8. `/api/products/analytics` - product analytics

#### **Shopping & Cart (4 APIs)**
1. `/api/cart` - complete cart management
2. `/api/cart/items/[id]` - item operations with actions
3. `/api/pricing/calculate` - unified pricing engine
4. `/api/coupons` - coupon validation and application

#### **Orders (4 APIs)**
1. `/api/orders` - create, list, manage orders
2. `/api/orders/[id]` - order details and modifications
3. `/api/orders/[id]/tracking` - shipping and delivery
4. `/api/orders/analytics` - order analytics

#### **Payments (3 APIs)**
1. `/api/payments/process` - unified payment processing
2. `/api/payments/methods` - available payment methods
3. `/api/webhooks/payments` - all payment webhooks

#### **Admin (8 APIs)**
1. `/api/admin/dashboard` - analytics and stats
2. `/api/admin/users` - user management
3. `/api/admin/products` - product administration
4. `/api/admin/orders` - order management
5. `/api/admin/vendors` - vendor management
6. `/api/admin/pricing` - all pricing configurations
7. `/api/admin/settings` - system settings
8. `/api/admin/reports` - reporting and exports

#### **Vendor Portal (6 APIs)**
1. `/api/vendor/dashboard` - vendor analytics
2. `/api/vendor/products` - product management with bulk operations
3. `/api/vendor/orders` - vendor orders
4. `/api/vendor/pricing` - discounts, coupons, commissions
5. `/api/vendor/team` - sales team management
6. `/api/vendor/analytics` - vendor-specific analytics

#### **Content & Utility (7 APIs)**
1. `/api/content/homepage` - homepage data
2. `/api/content/pages` - dynamic page content
3. `/api/settings/public` - public settings
4. `/api/files/upload` - file upload handling
5. `/api/notifications` - all notification types
6. `/api/analytics/events` - event tracking
7. `/api/search/global` - unified search

## Implementation Strategy

### **Phase 1: Critical Path (Week 1)**
Fix immediate connection leaks:
- ✅ Dashboard APIs (completed)
- ✅ Homepage APIs (completed)
- ✅ Product APIs (completed)
- 🔄 Payment APIs (in progress)
- 🔄 Cart APIs (pending)

### **Phase 2: API Consolidation (Week 2-3)**
1. **Merge Cart APIs**: 22 → 4 APIs
2. **Consolidate Payment APIs**: 11 → 3 APIs
3. **Simplify Admin APIs**: 32 → 8 APIs
4. **Streamline Vendor APIs**: 32 → 6 APIs

### **Phase 3: Performance Optimization (Week 4)**
1. Implement unified caching strategy
2. Add comprehensive input validation
3. Optimize database queries
4. Add rate limiting and security

## Benefits of Consolidation

### **Database Connections**
- **Before**: 215 APIs × average 3 calls = 645 potential connections
- **After**: 50 APIs × average 2 calls = 100 potential connections
- **Reduction**: 85% fewer connection requirements

### **Code Maintainability**
- **Before**: 215 separate files to maintain
- **After**: 50 well-organized, feature-complete APIs
- **Reduction**: 77% fewer files to maintain

### **Developer Experience**
- **Before**: Confusing maze of micro-APIs
- **After**: Clear, logical API structure
- **Benefit**: Faster development and easier integration

### **Performance**
- **Before**: Multiple round trips for related operations
- **After**: Single API calls with comprehensive responses
- **Benefit**: Faster page loads and better UX

## Next Steps
1. **Immediate**: Complete database connection fixes for remaining high-traffic APIs
2. **Short-term**: Start consolidating cart and payment APIs
3. **Medium-term**: Implement comprehensive API consolidation plan
4. **Long-term**: Monitor and optimize the streamlined API architecture