# BlindsCommerce Testing Checklist

## Critical Features to Test

### 1. Cart & Pricing
- [ ] Add products to cart with different configurations
- [ ] Apply SAVE10 coupon code - verify 10% discount shows
- [ ] Volume discounts auto-apply based on quantity (3+ items)
- [ ] Vendor automatic discounts (20% Summer Sale) apply
- [ ] Multiple discounts stack correctly
- [ ] Cart persists after login
- [ ] Edit cart items returns to configurator with correct data
- [ ] Remove items updates cart count
- [ ] Cart shows all product details (name, image, price, configuration)

### 2. Authentication & Routing
- [ ] Customer login from product page returns to product page
- [ ] Customer login from login page goes to home
- [ ] Other roles go to their dashboards
- [ ] Cart merges guest items with user cart on login
- [ ] Social login works for customers only

### 3. Product Configuration
- [ ] All configuration options save correctly
- [ ] Pricing updates dynamically
- [ ] Valance and bottom rail prices add correctly
- [ ] Edit mode pre-populates all fields
- [ ] Vendor ID included in cart items

### 4. Discount Rules
- [ ] Usage limits enforced (total and per-customer)
- [ ] Minimum order values checked
- [ ] Maximum discount amounts applied
- [ ] Expired discounts don't apply
- [ ] Customer-specific limits tracked

### 5. API Endpoints
- [ ] All V2 endpoints return consistent format
- [ ] Error handling doesn't cause infinite loops
- [ ] order-stats endpoint works
- [ ] Vendor discount/coupon update endpoints work

## Common Issues to Watch For

1. **Property Naming**: Check for userId vs user_id inconsistencies
2. **JSON Configuration**: Ensure vendorId is always included
3. **SQL Queries**: Verify vendor_id extraction with COALESCE
4. **State Updates**: Wait for async operations to complete
5. **Error Messages**: Provide clear, actionable error messages

## Before Deployment

1. Clear browser cache and test fresh
2. Test with both guest and logged-in users
3. Test with products from different vendors
4. Verify all discounts calculate correctly
5. Check cart persistence across sessions