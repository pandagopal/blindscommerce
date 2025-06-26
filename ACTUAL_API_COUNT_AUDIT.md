# API Count Audit - BlindsCommerce

## Discrepancy Found
- **My Original Documentation**: ~90 APIs
- **Actual Count**: 215 API route files
- **Missing from Documentation**: 125 APIs

## Complete API Inventory by Category

### Authentication & User Management (8 APIs)
1. `/api/auth/[...nextauth]/route.ts`
2. `/api/auth/change-password/route.ts`
3. `/api/auth/login/route.ts`
4. `/api/auth/logout/route.ts`
5. `/api/auth/me/route.ts`
6. `/api/auth/register/route.ts`
7. `/api/auth/reset-password/route.ts`
8. `/api/auth/trade-application/route.ts`

### User Account Management (13 APIs)
1. `/api/account/cart/items/[id]/route.ts`
2. `/api/account/cart/route.ts`
3. `/api/account/configurations/route.ts`
4. `/api/account/dashboard/route.ts`
5. `/api/account/measurements/route.ts`
6. `/api/account/orders/[id]/route.ts`
7. `/api/account/orders/route.ts`
8. `/api/account/payment-methods/[id]/route.ts`
9. `/api/account/payment-methods/route.ts`
10. `/api/account/shipping-addresses/[id]/default/route.ts`
11. `/api/account/shipping-addresses/[id]/route.ts`
12. `/api/account/shipping-addresses/route.ts`
13. `/api/account/wishlist/route.ts`

### Shopping Cart System (20 APIs) - **MAJOR EXPANSION**
1. `/api/cart/abandoned/route.ts`
2. `/api/cart/analytics/route.ts`
3. `/api/cart/apply-coupon/route.ts`
4. `/api/cart/auto-save/route.ts`
5. `/api/cart/bulk/route.ts`
6. `/api/cart/enhanced/items/[id]/gift/route.ts`
7. `/api/cart/enhanced/items/[id]/installation/route.ts`
8. `/api/cart/enhanced/items/[id]/move-to-cart/route.ts`
9. `/api/cart/enhanced/items/[id]/route.ts`
10. `/api/cart/enhanced/items/[id]/sample/route.ts`
11. `/api/cart/enhanced/items/[id]/save-for-later/route.ts`
12. `/api/cart/enhanced/route.ts`
13. `/api/cart/price-alerts/[id]/route.ts`
14. `/api/cart/price-alerts/route.ts`
15. `/api/cart/recommendations/route.ts`
16. `/api/cart/recover/[token]/route.ts`
17. `/api/cart/recovery/route.ts`
18. `/api/cart/saved/route.ts`
19. `/api/cart/share/route.ts`
20. `/api/cart/shipping-addresses/route.ts`
21. `/api/cart/stock-check/route.ts`
22. `/api/cart/vendor-discounts/route.ts`

### Product Management (12 APIs)
1. `/api/products/[slug]/configuration/route.ts`
2. `/api/products/[slug]/fabric-pricing/route.ts`
3. `/api/products/[slug]/pricing/route.ts`
4. `/api/products/[slug]/reviews/route.ts`
5. `/api/products/[slug]/route.ts`
6. `/api/products/[slug]/vendor-options/route.ts`
7. `/api/products/compare/route.ts`
8. `/api/products/create/route.ts`
9. `/api/products/data/route.ts`
10. `/api/products/route.ts`
11. `/api/products/search/route.ts`
12. `/api/products/search/suggestions/route.ts`

### Admin Dashboard (26 APIs) - **MAJOR EXPANSION**
1. `/api/admin/cache/refresh/route.ts`
2. `/api/admin/categories/[id]/route.ts`
3. `/api/admin/categories/route.ts`
4. `/api/admin/dashboard/export/route.ts`
5. `/api/admin/dashboard/stats/route.ts`
6. `/api/admin/hero-banners/[id]/route.ts`
7. `/api/admin/hero-banners/route.ts`
8. `/api/admin/orders/route.ts`
9. `/api/admin/payments/analytics/route.ts`
10. `/api/admin/payments/methods/route.ts`
11. `/api/admin/pricing/commissions/route.ts`
12. `/api/admin/pricing/global-discounts/route.ts`
13. `/api/admin/pricing/vendor-discounts/route.ts`
14. `/api/admin/pricing/volume-discounts/route.ts`
15. `/api/admin/products/[id]/configuration/route.ts`
16. `/api/admin/products/[id]/vendors/route.ts`
17. `/api/admin/products/route.ts`
18. `/api/admin/rooms/[id]/route.ts`
19. `/api/admin/rooms/route.ts`
20. `/api/admin/sample-orders/[orderId]/route.ts`
21. `/api/admin/sample-orders/route.ts`
22. `/api/admin/sample-orders/stats/route.ts`
23. `/api/admin/settings/route.ts`
24. `/api/admin/settings/test-taxjar/route.ts`
25. `/api/admin/tax-rates/route.ts`
26. `/api/admin/tax-rates/upload/route.ts`
27. `/api/admin/users/[id]/route.ts`
28. `/api/admin/users/route.ts`
29. `/api/admin/vendor-dashboard/[id]/route.ts`
30. `/api/admin/vendor-reviews/route.ts`
31. `/api/admin/vendors/[id]/route.ts`
32. `/api/admin/vendors/route.ts`

### Vendor Portal (25 APIs) - **MAJOR EXPANSION**
1. `/api/vendor/analytics/route.ts`
2. `/api/vendor/bulk-products/export/route.ts`
3. `/api/vendor/bulk-products/import/route.ts`
4. `/api/vendor/bulk-products/jobs/route.ts`
5. `/api/vendor/bulk-products/stats/route.ts`
6. `/api/vendor/bulk-products/template/route.ts`
7. `/api/vendor/catalog/route.ts`
8. `/api/vendor/commissions/route.ts`
9. `/api/vendor/coupons/[id]/route.ts`
10. `/api/vendor/coupons/route.ts`
11. `/api/vendor/coupons/validate/route.ts`
12. `/api/vendor/dashboard/route.ts`
13. `/api/vendor/discounts/[id]/route.ts`
14. `/api/vendor/discounts/bulk/route.ts`
15. `/api/vendor/discounts/route.ts`
16. `/api/vendor/files/route.ts`
17. `/api/vendor/info/route.ts`
18. `/api/vendor/orders/[orderId]/route.ts`
19. `/api/vendor/orders/export/route.ts`
20. `/api/vendor/orders/route.ts`
21. `/api/vendor/payments/export/route.ts`
22. `/api/vendor/payments/route.ts`
23. `/api/vendor/products/[id]/activate/route.ts`
24. `/api/vendor/products/[id]/route.ts`
25. `/api/vendor/products/clone/route.ts`
26. `/api/vendor/products/inheritance/route.ts`
27. `/api/vendor/products/route.ts`
28. `/api/vendor/profile/route.ts`
29. `/api/vendor/sales-team/[id]/route.ts`
30. `/api/vendor/sales-team/route.ts`
31. `/api/vendor/storefront/route.ts`
32. `/api/vendor/upload/route.ts`

### Payment Processing (11 APIs)
1. `/api/payments/affirm/capture-payment/route.ts`
2. `/api/payments/affirm/create-checkout/route.ts`
3. `/api/payments/afterpay/capture-payment/route.ts`
4. `/api/payments/afterpay/create-checkout/route.ts`
5. `/api/payments/klarna/create-session/route.ts`
6. `/api/payments/klarna/webhook/route.ts`
7. `/api/payments/methods/route.ts`
8. `/api/payments/paypal/capture-order/route.ts`
9. `/api/payments/paypal/create-order/route.ts`
10. `/api/stripe/config/route.ts`
11. `/api/stripe/create-payment-intent/route.ts`

### Sales Representative Tools (7 APIs)
1. `/api/sales/assistance/accept/route.ts`
2. `/api/sales/assistance/cart/route.ts`
3. `/api/sales/auto-online/route.ts`
4. `/api/sales/dashboard/route.ts`
5. `/api/sales/leads/route.ts`
6. `/api/sales/orders/route.ts`
7. `/api/sales/profile/route.ts`
8. `/api/sales/status/route.ts`

### Installer Management (6 APIs)
1. `/api/installation/availability/route.ts`
2. `/api/installation/book/route.ts`
3. `/api/installer/appointments/[id]/route.ts`
4. `/api/installer/appointments/route.ts`
5. `/api/installer/jobs/[id]/route.ts`
6. `/api/installer/jobs/route.ts`
7. `/api/installer/materials/[id]/route.ts`
8. `/api/installer/materials/route.ts`

### Order Management (5 APIs)
1. `/api/orders/[id]/modifications/[modId]/route.ts`
2. `/api/orders/[id]/modifications/route.ts`
3. `/api/orders/create/route.ts`
4. `/api/orders/guest/route.ts`
5. `/api/orders/reorder/route.ts`

### Content & Pages (8 APIs)
1. `/api/categories/[slug]/route.ts`
2. `/api/categories/route.ts`
3. `/api/hero-banners/route.ts`
4. `/api/homepage/content/route.ts`
5. `/api/homepage/data/route.ts`
6. `/api/pages/homepage/route.ts`
7. `/api/pages/products/route.ts`
8. `/api/rooms/route.ts`

### Utility & Support (24 APIs) - **MAJOR EXPANSION**
1. `/api/analytics/dashboard/route.ts`
2. `/api/analytics/events/route.ts`
3. `/api/analytics/predictive/route.ts`
4. `/api/company-info/route.ts`
5. `/api/consultations/[id]/notes/route.ts`
6. `/api/consultations/route.ts`
7. `/api/cron/abandoned-cart/route.ts`
8. `/api/customer/bulk-order/route.ts`
9. `/api/customer/commercial-templates/route.ts`
10. `/api/customer/request-assistance/route.ts`
11. `/api/customer/sample-orders/route.ts`
12. `/api/customer/upload/route.ts`
13. `/api/debug/vendor-products/route.ts`
14. `/api/delivery/schedule/route.ts`
15. `/api/delivery/slots/route.ts`
16. `/api/iot/smart-home/route.ts`
17. `/api/loyalty/account/route.ts`
18. `/api/loyalty/rewards/route.ts`
19. `/api/measurements/route.ts`
20. `/api/price-match/route.ts`
21. `/api/pricing/calculate/route.ts`
22. `/api/recently-viewed/route.ts`
23. `/api/recommendations/route.ts`
24. `/api/settings/route.ts`
25. `/api/shipping/rates/route.ts`
26. `/api/samples/limits/route.ts`
27. `/api/swatches/route.ts`

### Advanced Features (10 APIs)
1. `/api/ai-designer/emotion-detection/route.ts`
2. `/api/ai-designer/generate-designs/route.ts`
3. `/api/room-visualizer/analyze/route.ts`
4. `/api/room-visualizer/route.ts`
5. `/api/search/visual/route.ts`
6. `/api/reviews/[reviewId]/helpful/route.ts`
7. `/api/sms/opt-out/route.ts`
8. `/api/sms/send/route.ts`
9. `/api/social/accounts/route.ts`
10. `/api/social/posts/route.ts`
11. `/api/socketio/route.ts`

### File Upload System (5 APIs)
1. `/api/upload/categories/route.ts`
2. `/api/upload/hero-banners/route.ts`
3. `/api/upload/images/route.ts`
4. `/api/upload/rooms/route.ts`

### Storefront & Multi-vendor (3 APIs)
1. `/api/storefront/[vendor]/page-data/route.ts`
2. `/api/storefront/[vendor]/route.ts`
3. `/api/vendors/[vendorId]/ratings/route.ts`

### Warranty System (4 APIs)
1. `/api/warranty/claims/[id]/route.ts`
2. `/api/warranty/claims/route.ts`
3. `/api/warranty/lookup/route.ts`
4. `/api/warranty/register/route.ts`

### Webhooks (3 APIs)
1. `/api/webhooks/afterpay/route.ts`
2. `/api/webhooks/paypal/route.ts`
3. `/api/webhooks/stripe/route.ts`

### Super Admin (2 APIs)
1. `/api/super-admin/security-alerts/route.ts`
2. `/api/super-admin/stats/route.ts`

### Supply Chain (1 API)
1. `/api/supply-chain/autonomous/route.ts`

## Summary
- **Total Actual APIs**: 215
- **My Original Count**: ~90
- **Discrepancy**: 125 missing APIs

## Major Categories I Underestimated:
1. **Shopping Cart**: 22 APIs (vs 7 documented)
2. **Admin Dashboard**: 32 APIs (vs 8 documented)  
3. **Vendor Portal**: 32 APIs (vs 6 documented)
4. **Utility & Support**: 27 APIs (vs 6 documented)

## Database Connection Issue Root Cause:
With 215 APIs (not 90), and many of them high-traffic, the connection leak problem is much more severe than initially estimated. Each API that doesn't properly release connections multiplies the issue.

## Immediate Priority:
Focus on the highest-traffic APIs that are likely causing the 33/10 connection leak.