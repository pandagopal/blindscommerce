# API V2 Migration Summary

This document summarizes the API endpoint migrations from the old patterns to the V2 architecture.

## Migration Completed on: 2025-06-26

### Endpoints Migrated

1. **Account/User Endpoints**
   - `/api/account/*` → `/api/v2/users/*` or `/api/v2/commerce/*`
   - `/api/account/profile` → `/api/v2/users/profile`
   - `/api/account/shipping-addresses` → `/api/v2/users/shipping-addresses`
   - `/api/account/addresses` → `/api/v2/users/addresses`
   - `/api/account/cart` → `/api/v2/commerce/cart`
   - `/api/account/orders` → `/api/v2/commerce/orders`
   - `/api/account/wishlist` → `/api/v2/users/wishlist`
   - `/api/account/measurements` → `/api/v2/users/measurements`

2. **Admin Endpoints**
   - `/api/admin/*` → `/api/v2/admin/*`
   - `/api/admin/dashboard/stats` → `/api/v2/admin/dashboard/stats`
   - `/api/admin/dashboard/export` → `/api/v2/admin/dashboard/export`
   - `/api/admin/cache/refresh` → `/api/v2/admin/cache/refresh`

3. **Product/Commerce Endpoints**
   - `/api/products/*` → `/api/v2/commerce/products/*`
   - `/api/products/search/suggestions` → `/api/v2/commerce/products/search/suggestions`
   - `/api/recommendations` → `/api/v2/commerce/recommendations`

4. **Cart Endpoints**
   - `/api/cart/*` → `/api/v2/commerce/cart/*`
   - `/api/cart/enhanced` → `/api/v2/commerce/cart/enhanced`
   - `/api/cart/saved` → `/api/v2/commerce/cart/saved`
   - `/api/cart/analytics` → `/api/v2/commerce/cart/analytics`
   - `/api/cart/abandoned` → `/api/v2/commerce/cart/abandoned`
   - `/api/cart/recover` → `/api/v2/commerce/cart/recover`

5. **Order Endpoints**
   - `/api/orders/*` → `/api/v2/commerce/orders/*`
   - `/api/orders/create` → `/api/v2/commerce/orders/create`
   - `/api/orders/guest` → `/api/v2/commerce/orders/guest`
   - `/api/orders/reorder` → `/api/v2/commerce/orders/reorder`

6. **Vendor Endpoints**
   - `/api/vendor/*` → `/api/v2/vendors/*`
   - `/api/vendor/profile` → `/api/v2/vendors/profile`

7. **Sales Endpoints**
   - `/api/sales/*` → `/api/v2/users/sales/*`
   - `/api/sales/dashboard` → `/api/v2/users/sales/dashboard`

8. **Installer Endpoints**
   - `/api/installer/*` → `/api/v2/users/installer/*`
   - `/api/installer/appointments` → `/api/v2/users/installer/appointments`
   - `/api/installer/jobs` → `/api/v2/users/installer/jobs`
   - `/api/installer/materials` → `/api/v2/users/installer/materials`

9. **Payment Endpoints**
   - `/api/payments/*` → `/api/v2/commerce/payments/*`
   - `/api/payments/methods` → `/api/v2/commerce/payments/methods`
   - `/api/payments/paypal/create-order` → `/api/v2/commerce/payments/paypal/create-order`
   - `/api/payments/paypal/capture-order` → `/api/v2/commerce/payments/paypal/capture-order`

10. **Pricing Endpoints**
    - `/api/pricing/calculate` → `/api/v2/commerce/pricing/calculate`

### Files Updated

- Context Providers:
  - `/context/CartContext.tsx`
  - `/context/EnhancedCartContext.tsx`
  - `/context/VendorCartContext.tsx`

- Account Pages:
  - `/app/account/settings/page.tsx`
  - `/app/account/orders/page.tsx`
  - `/app/account/orders/[id]/page.tsx`
  - `/app/account/measurements/page.tsx`
  - `/app/account/wishlist/page.tsx`
  - `/app/account/payment-methods/page.tsx`

- Admin Pages:
  - `/app/admin/dashboard/page.tsx`

- Vendor Pages:
  - `/app/vendor/profile/page.tsx`

- Sales Pages:
  - `/app/sales/page.tsx`

- Installer Pages:
  - `/app/installer/page.tsx`

- Checkout:
  - `/app/checkout/page.tsx`

- Components:
  - `/components/account/ShippingAddressManager.tsx`
  - `/components/products/AIProductRecommendations.tsx`
  - `/components/payments/PayPalPayment.tsx`
  - `/components/search/EnhancedSearch.tsx`
  - `/app/components/orders/ReorderButton.tsx`

- Hooks:
  - `/lib/hooks/useAbandonedCartTracking.ts`

### Response Format Updates

All V2 endpoints now return responses in the standardized format:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "metadata": { ... }
}
```

Error responses follow the format:
```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "metadata": { ... }
}
```

### Notes

- Webhook endpoints remain unchanged at `/api/webhooks/*`
- Auth endpoints at `/api/v2/auth/*` were already using V2
- All UI components have been updated to handle the V2 response format
- Error handling has been updated to work with the new response structure