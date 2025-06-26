# Admin API Consolidation Plan

## Current State: 32 Admin APIs → Target: 14 APIs

### Admin Pages Requiring APIs:
1. Dashboard
2. Users Management
3. Vendors Management  
4. Products Management
5. Orders Management
6. Categories Management
7. Rooms Management
8. Pricing & Commissions
9. Settings & Configuration
10. Tax Rates
11. Payments & Analytics
12. Sample Orders
13. Hero Banners
14. Cache Management

### Consolidated API Structure:

#### 1. `/api/admin/auth` - Authentication & Session
- **Combines**: Login, logout, session check
- **Methods**: POST (login), DELETE (logout), GET (session)

#### 2. `/api/admin/dashboard` - Dashboard Data
- **Combines**: 
  - `/admin/dashboard/stats`
  - `/admin/dashboard/export`
- **Methods**: 
  - GET: Fetch all dashboard stats
  - GET with ?export=true: Export data
  - Query params: ?dateRange=7d|30d|90d&metrics=all|sales|users

#### 3. `/api/admin/users` - User Management
- **Combines**:
  - `/admin/users` (list)
  - `/admin/users/[id]` (CRUD)
- **Methods**:
  - GET: List users with filters
  - POST: Create user
  - GET /[id]: Get user details
  - PUT /[id]: Update user
  - DELETE /[id]: Delete user
- **Query params**: ?role=customer|vendor|admin&status=active|inactive&search=

#### 4. `/api/admin/vendors` - Vendor Management  
- **Combines**:
  - `/admin/vendors` (list)
  - `/admin/vendors/[id]` (CRUD)
  - `/admin/vendor-dashboard/[id]`
  - `/admin/vendor-reviews`
- **Methods**:
  - GET: List vendors
  - POST: Create vendor
  - GET /[id]: Get vendor details + dashboard data
  - PUT /[id]: Update vendor
  - DELETE /[id]: Delete vendor
  - GET /[id]/reviews: Get vendor reviews
- **Query params**: ?includeStats=true&includeReviews=true

#### 5. `/api/admin/products` - Product Management
- **Combines**:
  - `/admin/products` (list)
  - `/admin/products/[id]/configuration`
  - `/admin/products/[id]/vendors`
- **Methods**:
  - GET: List products
  - POST: Create product
  - GET /[id]: Get product + configuration + vendors
  - PUT /[id]: Update product
  - DELETE /[id]: Delete product
  - PUT /[id]/vendors: Update vendor assignments
- **Query params**: ?includeConfig=true&includeVendors=true

#### 6. `/api/admin/orders` - Order Management
- **Single endpoint** for all order operations
- **Methods**:
  - GET: List orders with filters
  - GET /[id]: Get order details
  - PUT /[id]: Update order status
- **Query params**: ?status=pending|completed&dateRange=

#### 7. `/api/admin/categories` - Category Management
- **Combines**:
  - `/admin/categories` (list)
  - `/admin/categories/[id]` (CRUD)
- **Methods**:
  - GET: List categories
  - POST: Create category
  - PUT /[id]: Update category
  - DELETE /[id]: Delete category

#### 8. `/api/admin/rooms` - Room Management
- **Combines**:
  - `/admin/rooms` (list)
  - `/admin/rooms/[id]` (CRUD)
- **Methods**:
  - GET: List room types
  - POST: Create room type
  - PUT /[id]: Update room
  - DELETE /[id]: Delete room

#### 9. `/api/admin/pricing` - All Pricing Configuration
- **Combines**:
  - `/admin/pricing/commissions`
  - `/admin/pricing/global-discounts`
  - `/admin/pricing/vendor-discounts`
  - `/admin/pricing/volume-discounts`
- **Methods**:
  - GET: Get all pricing configurations
  - PUT: Update pricing (with type parameter)
- **Body params**: { type: 'commission'|'global'|'vendor'|'volume', data: {...} }

#### 10. `/api/admin/settings` - System Settings
- **Combines**:
  - `/admin/settings`
  - `/admin/settings/test-taxjar`
- **Methods**:
  - GET: Get all settings
  - PUT: Update settings
  - POST /test: Test configurations (taxjar, email, etc.)
- **Query params**: ?category=tax|email|payment

#### 11. `/api/admin/tax` - Tax Management
- **Combines**:
  - `/admin/tax-rates`
  - `/admin/tax-rates/upload`
- **Methods**:
  - GET: List tax rates
  - POST: Create/Update tax rates
  - POST /upload: Bulk upload CSV
  - DELETE /[id]: Delete tax rate

#### 12. `/api/admin/payments` - Payment Analytics
- **Combines**:
  - `/admin/payments/analytics`
  - `/admin/payments/methods`
- **Methods**:
  - GET /analytics: Payment analytics data
  - GET /methods: Available payment methods
  - PUT /methods: Update payment method settings

#### 13. `/api/admin/samples` - Sample Orders
- **Combines**:
  - `/admin/sample-orders`
  - `/admin/sample-orders/[orderId]`
  - `/admin/sample-orders/stats`
- **Methods**:
  - GET: List sample orders
  - GET /stats: Sample order statistics
  - GET /[id]: Get sample order details
  - PUT /[id]: Update sample order status

#### 14. `/api/admin/content` - Content Management
- **Combines**:
  - `/admin/hero-banners`
  - `/admin/hero-banners/[id]`
  - `/admin/cache/refresh`
- **Methods**:
  - GET /banners: List hero banners
  - POST /banners: Create banner
  - PUT /banners/[id]: Update banner
  - DELETE /banners/[id]: Delete banner
  - POST /cache/refresh: Refresh cache

## Implementation Benefits:

### Before: 32 APIs
- Fragmented endpoints
- Multiple API calls per page
- Complex client-side data aggregation
- High database connection usage

### After: 14 APIs
- Logical grouping by feature
- Single API call per page (most cases)
- Server-side data aggregation
- Reduced database connections
- Cleaner client code
- Better performance

## Migration Strategy:

1. **Phase 1**: Create new consolidated endpoints
2. **Phase 2**: Update admin pages to use new endpoints
3. **Phase 3**: Deprecate old endpoints
4. **Phase 4**: Remove old API files

## Example Usage:

```typescript
// Before: Multiple calls for vendor dashboard
const vendor = await fetch('/api/admin/vendors/123');
const dashboard = await fetch('/api/admin/vendor-dashboard/123');
const reviews = await fetch('/api/admin/vendor-reviews?vendorId=123');

// After: Single call
const vendorData = await fetch('/api/admin/vendors/123?includeStats=true&includeReviews=true');
```