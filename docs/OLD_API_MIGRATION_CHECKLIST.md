# Old API Migration Checklist

This document lists all remaining old API endpoints that need to be migrated to V2 API.

## Status Legend
- ✅ Fixed
- 🔧 In Progress
- ❌ Not Started

## Migration Progress

### Product Configuration APIs
- ✅ `/api/products/${slug}/pricing` → `/api/v2/commerce/products/${id}/pricing`
- ✅ `/api/products/${slug}/fabric-pricing` → Use product data from V2 API
- ✅ `/api/products/${slug}/vendor-options` → Use product data from V2 API

### Vendor Dashboard APIs
- ✅ `/api/vendor/dashboard` → `/api/v2/vendors/dashboard`
- ❌ `/api/vendor/info` → `/api/v2/vendors/profile`

### Admin APIs (Multiple Files Need Fixing)
#### `/app/admin/vendors/page.tsx`
- ❌ `/api/admin/vendors` → `/api/v2/admin/vendors`
- ❌ `/api/admin/vendors/${id}` → `/api/v2/admin/vendors/${id}`

#### `/app/admin/users/page.tsx`
- ❌ `/api/admin/users` → `/api/v2/admin/users`
- ❌ `/api/admin/users/${id}` → `/api/v2/admin/users/${id}`

#### `/app/admin/orders/page.tsx`
- ❌ `/api/admin/orders` → `/api/v2/admin/orders`
- ❌ `/api/admin/orders/${id}` → `/api/v2/admin/orders/${id}`

#### `/app/admin/analytics/page.tsx`
- ❌ `/api/admin/analytics/overview` → `/api/v2/analytics/overview`
- ❌ `/api/admin/analytics/revenue` → `/api/v2/analytics/revenue`
- ❌ `/api/admin/analytics/products` → `/api/v2/analytics/products`

#### `/app/admin/categories/page.tsx`
- ❌ `/api/admin/categories` → `/api/v2/admin/categories`
- ❌ `/api/admin/categories/${id}` → `/api/v2/admin/categories/${id}`

#### `/app/admin/hero-banners/page.tsx`
- ❌ `/api/admin/hero-banners` → `/api/v2/content/hero-banners`
- ❌ `/api/admin/hero-banners/${id}` → `/api/v2/content/hero-banners/${id}`

#### `/app/admin/rooms/page.tsx`
- ❌ `/api/admin/rooms` → `/api/v2/content/rooms`
- ❌ `/api/admin/rooms/${id}` → `/api/v2/content/rooms/${id}`

#### `/app/admin/tax-rates/page.tsx`
- ❌ `/api/admin/tax-rates` → `/api/v2/admin/tax-rates`
- ❌ `/api/admin/tax-rates/${id}` → `/api/v2/admin/tax-rates/${id}`

#### `/app/admin/trade-applications/page.tsx`
- ❌ `/api/admin/trade-applications` → `/api/v2/admin/trade-applications`
- ❌ `/api/admin/trade-applications/${id}/approve` → `/api/v2/admin/trade-applications/${id}/approve`

#### `/app/admin/bulk-operations/page.tsx`
- ❌ `/api/admin/bulk/products` → `/api/v2/admin/bulk/products`
- ❌ `/api/admin/bulk/categories` → `/api/v2/admin/bulk/categories`

#### `/app/admin/pricing/commissions/page.tsx`
- ❌ `/api/admin/commissions` → `/api/v2/admin/commissions`
- ❌ `/api/admin/commissions/${id}` → `/api/v2/admin/commissions/${id}`

### Vendor APIs (Multiple Files Need Fixing)
#### `/app/vendor/orders/page.tsx`
- ❌ `/api/vendor/orders` → `/api/v2/vendors/orders`
- ❌ `/api/vendor/orders/${id}` → `/api/v2/vendors/orders/${id}`

#### `/app/vendor/analytics/page.tsx`
- ❌ `/api/vendor/analytics/overview` → `/api/v2/vendors/analytics`
- ❌ `/api/vendor/analytics/products` → `/api/v2/vendors/analytics/products`
- ❌ `/api/vendor/analytics/revenue` → `/api/v2/vendors/analytics/revenue`

#### `/app/vendor/discounts/page.tsx`
- ❌ `/api/vendor/discounts` → `/api/v2/vendors/discounts`
- ❌ `/api/vendor/discounts/${id}` → `/api/v2/vendors/discounts/${id}`

#### `/app/vendor/sales-team/page.tsx`
- ❌ `/api/vendor/sales-team` → `/api/v2/vendors/sales-team`
- ❌ `/api/vendor/sales-team/${id}` → `/api/v2/vendors/sales-team/${id}`

#### `/app/vendor/shipments/page.tsx`
- ❌ `/api/vendor/shipments` → `/api/v2/vendors/shipments`
- ❌ `/api/vendor/shipments/${id}` → `/api/v2/vendors/shipments/${id}`

#### `/app/vendor/payments/page.tsx`
- ❌ `/api/vendor/payments` → `/api/v2/vendors/financial-summary`
- ❌ `/api/vendor/payouts` → `/api/v2/vendors/payouts`

#### `/app/vendor/bulk-products/page.tsx`
- ❌ `/api/vendor/bulk/upload` → `/api/v2/vendors/products/bulk`
- ❌ `/api/vendor/bulk/status` → `/api/v2/vendors/products/bulk/status`

### Account/Customer APIs
#### `/app/account/page.tsx`
- ❌ `/api/account/profile` → `/api/v2/users/me`
- ❌ `/api/account/orders` → `/api/v2/users/orders`
- ❌ `/api/account/addresses` → `/api/v2/users/addresses`

#### `/app/account/orders/page.tsx`
- ❌ `/api/orders` → `/api/v2/commerce/orders`
- ❌ `/api/orders/${id}` → `/api/v2/commerce/orders/${id}`

#### `/app/account/wishlist/page.tsx`
- ❌ `/api/wishlist` → `/api/v2/users/wishlist`
- ❌ `/api/wishlist/add` → `/api/v2/users/wishlist/add`
- ❌ `/api/wishlist/remove` → `/api/v2/users/wishlist/remove`

#### `/app/account/configurations/page.tsx`
- ❌ `/api/configurations` → `/api/v2/users/configurations`
- ❌ `/api/configurations/${id}` → `/api/v2/users/configurations/${id}`

### Cart/Checkout APIs
#### `/context/CartContext.tsx`
- ❌ `/api/cart` → `/api/v2/commerce/cart`
- ❌ `/api/cart/add` → `/api/v2/commerce/cart/add`
- ❌ `/api/cart/update` → `/api/v2/commerce/cart/items/${id}`
- ❌ `/api/cart/remove` → `/api/v2/commerce/cart/items/${id}`

#### `/app/checkout/page.tsx`
- ❌ `/api/checkout/calculate` → `/api/v2/commerce/checkout/calculate`
- ❌ `/api/checkout/create-order` → `/api/v2/commerce/orders/create`
- ❌ `/api/checkout/payment-intent` → `/api/v2/commerce/payment/intent`

### Installer APIs
#### `/app/installer/page.tsx`
- ❌ `/api/installer/dashboard` → `/api/v2/installers/dashboard`
- ❌ `/api/installer/jobs` → `/api/v2/installers/jobs`

#### `/app/installer/jobs/page.tsx`
- ❌ `/api/installer/jobs` → `/api/v2/installers/jobs`
- ❌ `/api/installer/jobs/${id}` → `/api/v2/installers/jobs/${id}`
- ❌ `/api/installer/jobs/${id}/complete` → `/api/v2/installers/jobs/${id}/complete`

### Sales Representative APIs
#### `/app/sales/page.tsx`
- ❌ `/api/sales/dashboard` → `/api/v2/sales/dashboard`
- ❌ `/api/sales/leads` → `/api/v2/sales/leads`

#### `/app/sales/leads/page.tsx`
- ❌ `/api/sales/leads` → `/api/v2/sales/leads`
- ❌ `/api/sales/leads/${id}` → `/api/v2/sales/leads/${id}`
- ❌ `/api/sales/leads/${id}/convert` → `/api/v2/sales/leads/${id}/convert`

### Authentication APIs
#### `/app/login/page.tsx`
- ❌ `/api/auth/login` → `/api/v2/auth/login`
- ❌ `/api/auth/social` → `/api/v2/auth/social`

#### `/app/register/page.tsx`
- ❌ `/api/auth/register` → `/api/v2/auth/register`
- ❌ `/api/auth/verify-email` → `/api/v2/auth/verify-email`

### Other APIs
#### `/components/Navbar.tsx`
- ❌ `/api/search` → `/api/v2/commerce/products/search`
- ❌ `/api/categories` → `/api/v2/commerce/categories`

#### `/components/reviews/ProductReviews.tsx`
- ❌ `/api/products/${id}/reviews` → `/api/v2/commerce/products/${id}/reviews`
- ❌ `/api/reviews/create` → `/api/v2/commerce/reviews/create`

## Summary
- Total APIs to migrate: ~100+
- Fixed: 4
- Remaining: ~96+

## Priority Order
1. Cart/Checkout APIs (critical for purchases)
2. Authentication APIs (critical for login)
3. Admin APIs (for management)
4. Vendor APIs (for vendor operations)
5. Account APIs (for customer features)
6. Other APIs

## Notes
- Some V2 endpoints may need to be created in handlers
- Role-based access control is handled automatically in V2
- All V2 APIs follow consistent response format: `{ success, data, error, metadata }`