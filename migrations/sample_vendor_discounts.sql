-- Sample Vendor Discounts and Coupons for Testing
-- Uses vendor_info_id = 2 (Test Vendor Business)

-- Insert sample automatic discounts
INSERT INTO `vendor_discounts` (
  `vendor_id`, `discount_name`, `display_name`, `description`,
  `discount_type`, `discount_value`, `is_automatic`, 
  `applies_to`, `minimum_order_value`, `valid_from`, `is_active`
) VALUES
(2, 'bulk_order_10_percent', 'Bulk Order Discount', 'Get 10% off orders over $500', 
 'percentage', 10.00, 1, 'all_vendor_products', 500.00, NOW(), 1),
 
(2, 'first_time_customer', 'First Time Customer', 'Welcome discount for new customers',
 'percentage', 15.00, 1, 'all_vendor_products', 100.00, NOW(), 1),

(2, 'volume_pricing', 'Volume Discount Tiers', 'Tiered discounts based on quantity',
 'tiered', 0.00, 1, 'all_vendor_products', 0.00, NOW(), 1);

-- Insert sample discount codes (manual discounts)
INSERT INTO `vendor_discounts` (
  `vendor_id`, `discount_name`, `discount_code`, `display_name`, `description`,
  `discount_type`, `discount_value`, `is_automatic`, 
  `applies_to`, `minimum_order_value`, `valid_from`, `valid_until`, `is_active`
) VALUES
(2, 'summer_sale_2024', 'SUMMER20', 'Summer Sale 2024', 'Limited time summer discount',
 'percentage', 20.00, 0, 'all_vendor_products', 200.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1),

(2, 'free_upgrade', 'UPGRADE50', 'Free Upgrade Promotion', '$50 off premium upgrades',
 'fixed_amount', 50.00, 0, 'specific_products', 0.00, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1);

-- Insert sample vendor coupons
INSERT INTO `vendor_coupons` (
  `vendor_id`, `coupon_code`, `coupon_name`, `display_name`, `description`,
  `discount_type`, `discount_value`, `minimum_order_value`, 
  `applies_to`, `valid_from`, `usage_limit_per_customer`, `is_active`, `created_by`
) VALUES
(2, 'SAVE15NOW', 'save_15_percent', 'Save 15% Today', 
 'Get 15% off your entire order from our store',
 'percentage', 15.00, 100.00, 'all_vendor_products', NOW(), 1, 1, 1),

(2, 'FREESHIP', 'free_shipping', 'Free Shipping', 
 'Free shipping on orders over $250',
 'free_shipping', 0.00, 250.00, 'all_vendor_products', NOW(), 1, 1, 1),

(2, 'WELCOME25', 'welcome_discount', 'Welcome New Customer', 
 '$25 off your first order',
 'fixed_amount', 25.00, 150.00, 'all_vendor_products', NOW(), 1, 1, 1),

(2, 'PREMIUM50', 'premium_upgrade', 'Premium Upgrade Coupon', 
 '$50 off premium product upgrades',
 'upgrade', 50.00, 0.00, 'specific_products', NOW(), 2, 1, 1);