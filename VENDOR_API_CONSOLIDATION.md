# Vendor API Consolidation Plan

## Current State: 32 Vendor APIs → Target: 11 APIs

### Vendor Portal Pages:
1. Dashboard
2. Products Management
3. Orders Management
4. Discounts & Coupons
5. Sales Team
6. Analytics & Reports
7. Payments & Commissions
8. Storefront Settings
9. Profile Settings
10. Bulk Operations
11. File Management

### Consolidated API Structure:

#### 1. `/api/vendor/auth` - Authentication
- **Purpose**: Vendor login/logout/session
- **Methods**: POST (login), DELETE (logout), GET (session)

#### 2. `/api/vendor/dashboard` - Dashboard & Analytics
- **Combines**:
  - `/vendor/dashboard`
  - `/vendor/analytics`
  - `/vendor/commissions`
- **Methods**:
  - GET: All dashboard data including stats, analytics, commissions
- **Query params**: ?dateRange=7d|30d|90d&includeAnalytics=true

#### 3. `/api/vendor/products` - Product Management
- **Combines**:
  - `/vendor/products` (list)
  - `/vendor/products/[id]` (CRUD)
  - `/vendor/products/[id]/activate`
  - `/vendor/products/clone`
  - `/vendor/products/inheritance`
  - `/vendor/catalog`
- **Methods**:
  - GET: List products with catalog data
  - POST: Create product
  - GET /[id]: Get product details
  - PUT /[id]: Update product
  - DELETE /[id]: Delete product
  - POST /[id]/activate: Activate/deactivate
  - POST /clone: Clone product
- **Query params**: ?status=active|inactive&includeCatalog=true

#### 4. `/api/vendor/orders` - Order Management
- **Combines**:
  - `/vendor/orders` (list)
  - `/vendor/orders/[orderId]`
  - `/vendor/orders/export`
- **Methods**:
  - GET: List orders
  - GET /[id]: Get order details
  - PUT /[id]: Update order status
  - GET /export: Export orders (CSV/PDF)
- **Query params**: ?status=pending|shipped&export=csv|pdf

#### 5. `/api/vendor/pricing` - Discounts & Coupons
- **Combines**:
  - `/vendor/discounts` (list)
  - `/vendor/discounts/[id]`
  - `/vendor/discounts/bulk`
  - `/vendor/coupons` (list)
  - `/vendor/coupons/[id]`
  - `/vendor/coupons/validate`
- **Methods**:
  - GET /discounts: List discounts
  - POST /discounts: Create discount
  - PUT /discounts/[id]: Update discount
  - DELETE /discounts/[id]: Delete discount
  - POST /discounts/bulk: Bulk operations
  - GET /coupons: List coupons
  - POST /coupons: Create coupon
  - PUT /coupons/[id]: Update coupon
  - DELETE /coupons/[id]: Delete coupon
  - POST /coupons/validate: Validate coupon code

#### 6. `/api/vendor/team` - Sales Team Management
- **Combines**:
  - `/vendor/sales-team` (list)
  - `/vendor/sales-team/[id]`
- **Methods**:
  - GET: List team members
  - POST: Add team member
  - GET /[id]: Get member details
  - PUT /[id]: Update member
  - DELETE /[id]: Remove member

#### 7. `/api/vendor/payments` - Payments & Commissions
- **Combines**:
  - `/vendor/payments`
  - `/vendor/payments/export`
- **Methods**:
  - GET: List payments and commission history
  - GET /export: Export payment records
- **Query params**: ?dateRange=&export=csv|pdf

#### 8. `/api/vendor/storefront` - Storefront Configuration
- **Single endpoint** for storefront settings
- **Methods**:
  - GET: Get storefront settings
  - PUT: Update storefront settings
  - POST /preview: Preview storefront

#### 9. `/api/vendor/profile` - Vendor Profile
- **Combines**:
  - `/vendor/profile`
  - `/vendor/info`
- **Methods**:
  - GET: Get vendor profile and business info
  - PUT: Update profile and business info

#### 10. `/api/vendor/bulk` - Bulk Operations
- **Combines**:
  - `/vendor/bulk-products/import`
  - `/vendor/bulk-products/export`
  - `/vendor/bulk-products/template`
  - `/vendor/bulk-products/jobs`
  - `/vendor/bulk-products/stats`
- **Methods**:
  - POST /import: Import products CSV
  - GET /export: Export products
  - GET /template: Download import template
  - GET /jobs: List bulk job status
  - GET /stats: Bulk operation statistics

#### 11. `/api/vendor/files` - File Management
- **Combines**:
  - `/vendor/files`
  - `/vendor/upload`
- **Methods**:
  - GET: List uploaded files
  - POST: Upload file
  - DELETE /[id]: Delete file
- **Query params**: ?type=image|document

## Benefits of Consolidation:

### Before: 32 APIs
- 5 separate APIs for bulk operations
- 3 APIs for discounts, 3 for coupons
- Multiple calls for dashboard data
- Fragmented product operations

### After: 11 APIs
- Single bulk operations endpoint
- Unified pricing endpoint for discounts & coupons
- One dashboard call for all stats
- Streamlined product management

## Example Implementation:

```typescript
// New consolidated vendor dashboard API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
  const dateRange = searchParams.get('dateRange') || '30d';
  
  const vendor = await getCurrentVendor();
  const pool = await getPool();
  
  // Parallel fetch all dashboard data
  const [
    stats,
    recentOrders,
    topProducts,
    commissions,
    analytics
  ] = await Promise.all([
    getDashboardStats(vendor.id, dateRange),
    getRecentOrders(vendor.id),
    getTopProducts(vendor.id),
    getCommissionData(vendor.id),
    includeAnalytics ? getAnalytics(vendor.id, dateRange) : null
  ]);
  
  return NextResponse.json({
    stats,
    recentOrders,
    topProducts,
    commissions,
    ...(analytics && { analytics })
  });
}
```

## Migration Path:

1. **Week 1**: Implement consolidated endpoints
2. **Week 2**: Update vendor portal pages
3. **Week 3**: Test and optimize
4. **Week 4**: Remove old endpoints