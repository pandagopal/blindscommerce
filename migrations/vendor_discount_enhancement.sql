-- ================================================================
-- Enhanced Vendor Discount & Coupon System
-- Migrates from Global Admin Control to Vendor-Level Control
-- ================================================================

-- 1. Enhanced Vendor Discounts Table (update existing structure)
-- ================================================================
ALTER TABLE `vendor_discounts` 
ADD COLUMN `discount_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `discount_name`,
ADD COLUMN `is_automatic` tinyint(1) DEFAULT '1' AFTER `discount_type`,
ADD COLUMN `volume_tiers` json DEFAULT NULL COMMENT 'Array of {min_qty, max_qty, discount_percent, discount_amount}' AFTER `discount_value`,
ADD COLUMN `stackable_with_coupons` tinyint(1) DEFAULT '1' AFTER `is_automatic`,
ADD COLUMN `priority` int DEFAULT '0' COMMENT 'Higher number = higher priority' AFTER `stackable_with_coupons`,
ADD COLUMN `display_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `discount_name`,
ADD COLUMN `description` text COLLATE utf8mb4_unicode_ci AFTER `display_name`,
ADD COLUMN `terms_conditions` text COLLATE utf8mb4_unicode_ci AFTER `description`,
DROP COLUMN `admin_approved`,
DROP COLUMN `approved_by`,
DROP COLUMN `approved_at`,
DROP COLUMN `admin_notes`,
DROP COLUMN `requested_by`,
DROP COLUMN `request_reason`;

-- Add index for discount codes
ALTER TABLE `vendor_discounts` 
ADD UNIQUE KEY `unique_vendor_discount_code` (`vendor_id`, `discount_code`),
ADD KEY `idx_vendor_discount_active` (`vendor_id`, `is_active`, `valid_from`, `valid_until`),
ADD KEY `idx_discount_code` (`discount_code`);

-- ================================================================
-- 2. New Vendor Coupons Table
-- ================================================================
CREATE TABLE `vendor_coupons` (
  `coupon_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `coupon_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coupon_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci,
  
  -- Discount Configuration
  `discount_type` enum('percentage','fixed_amount','free_shipping','upgrade') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(8,2) NOT NULL,
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL,
  
  -- Application Rules
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `minimum_quantity` int DEFAULT '1',
  `applies_to` enum('all_vendor_products','specific_products','specific_categories') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_vendor_products',
  `target_ids` json DEFAULT NULL COMMENT 'Array of product/category IDs',
  `excluded_ids` json DEFAULT NULL COMMENT 'Array of excluded product/category IDs',
  
  -- Customer Targeting
  `customer_types` json DEFAULT NULL COMMENT 'Array: retail, trade, commercial',
  `customer_groups` json DEFAULT NULL COMMENT 'Array of customer group IDs',
  `first_time_customers_only` tinyint(1) DEFAULT '0',
  `existing_customers_only` tinyint(1) DEFAULT '0',
  
  -- Geographic Restrictions
  `allowed_regions` json DEFAULT NULL COMMENT 'Array of state/region codes',
  `excluded_regions` json DEFAULT NULL COMMENT 'Array of excluded regions',
  
  -- Usage Limitations
  `usage_limit_total` int DEFAULT NULL,
  `usage_limit_per_customer` int DEFAULT '1',
  `usage_count` int DEFAULT '0',
  
  -- Scheduling
  `valid_from` datetime NOT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `auto_activate` tinyint(1) DEFAULT '0',
  `auto_deactivate` tinyint(1) DEFAULT '0',
  
  -- Combination Rules
  `stackable_with_discounts` tinyint(1) DEFAULT '1',
  `stackable_with_other_coupons` tinyint(1) DEFAULT '0',
  `priority` int DEFAULT '0' COMMENT 'Higher number = higher priority',
  
  -- Tracking
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int NOT NULL COMMENT 'Vendor user who created',
  
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `unique_vendor_coupon_code` (`vendor_id`, `coupon_code`),
  KEY `idx_vendor_coupon_active` (`vendor_id`, `is_active`, `valid_from`, `valid_until`),
  KEY `idx_coupon_code_lookup` (`coupon_code`),
  KEY `fk_vendor_coupon_vendor` (`vendor_id`),
  KEY `fk_vendor_coupon_creator` (`created_by`),
  CONSTRAINT `fk_vendor_coupon_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_coupon_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. Vendor Discount Usage Tracking
-- ================================================================
CREATE TABLE `vendor_discount_usage` (
  `usage_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `discount_id` int DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `cart_id` int DEFAULT NULL,
  `usage_type` enum('discount','coupon') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `quantity` int DEFAULT '1',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `order_completed_at` timestamp NULL DEFAULT NULL,
  
  PRIMARY KEY (`usage_id`),
  KEY `idx_vendor_usage` (`vendor_id`, `usage_type`, `applied_at`),
  KEY `idx_discount_usage` (`discount_id`),
  KEY `idx_coupon_usage` (`coupon_id`),
  KEY `idx_user_usage` (`user_id`),
  KEY `idx_order_usage` (`order_id`),
  CONSTRAINT `fk_vendor_usage_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_discount` FOREIGN KEY (`discount_id`) REFERENCES `vendor_discounts` (`discount_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `vendor_coupons` (`coupon_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vendor_usage_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. Cart Item Vendor Discounts (for multi-vendor cart support)
-- ================================================================
CREATE TABLE `cart_vendor_discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `discount_id` int DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `discount_type` enum('automatic','coupon') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_to_items` json NOT NULL COMMENT 'Array of cart_item_ids and their discount amounts',
  `subtotal_before` decimal(10,2) NOT NULL,
  `subtotal_after` decimal(10,2) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_vendor_discount` (`cart_id`, `vendor_id`, `discount_type`, `discount_code`),
  KEY `idx_cart_vendor_discounts` (`cart_id`, `vendor_id`),
  KEY `fk_cart_discount_vendor` (`vendor_id`),
  KEY `fk_cart_discount_discount` (`discount_id`),
  KEY `fk_cart_discount_coupon` (`coupon_id`),
  CONSTRAINT `fk_cart_discount_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_discount` FOREIGN KEY (`discount_id`) REFERENCES `vendor_discounts` (`discount_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `vendor_coupons` (`coupon_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. Sample Data - Volume Discount Tiers
-- ================================================================
-- Insert sample volume discount for a vendor
INSERT INTO `vendor_discounts` (
  `vendor_id`, `discount_name`, `display_name`, `description`,
  `discount_type`, `is_automatic`, `volume_tiers`,
  `applies_to`, `valid_from`, `is_active`
) VALUES (
  1, 'volume_discount_5_plus', 'Volume Discount - 5+ Items',
  'Get increasing discounts when you buy more items from our store',
  'tiered', 1,
  '[
    {"min_qty": 5, "max_qty": 9, "discount_percent": 5.0},
    {"min_qty": 10, "max_qty": 14, "discount_percent": 10.0},
    {"min_qty": 15, "max_qty": null, "discount_percent": 15.0}
  ]',
  'all_vendor_products', NOW(), 1
);

-- Insert sample product-specific discount
INSERT INTO `vendor_discounts` (
  `vendor_id`, `discount_name`, `discount_code`, `display_name`, 
  `discount_type`, `is_automatic`, `discount_value`,
  `applies_to`, `target_ids`, `valid_from`, `valid_until`, `is_active`
) VALUES (
  1, 'cordless_upgrade_free', 'CORDLESS2024', 'Free Cordless Upgrade',
  'fixed_amount', 0, 50.00,
  'specific_products', '[101, 102, 103]',
  '2024-01-01 00:00:00', '2024-12-31 23:59:59', 1
);

-- Insert sample vendor coupon
INSERT INTO `vendor_coupons` (
  `vendor_id`, `coupon_code`, `coupon_name`, `display_name`,
  `description`, `discount_type`, `discount_value`,
  `minimum_order_value`, `applies_to`, `valid_from`, `usage_limit_per_customer`,
  `is_active`, `created_by`
) VALUES (
  1, 'SAVE10NOW', 'save_10_percent', 'Save 10% Today',
  'Get 10% off your entire order from our store',
  'percentage', 10.00, 50.00, 'all_vendor_products',
  NOW(), 1, 1, 1
);

-- ================================================================
-- 6. Disable Global Discount Tables (Admin Level)
-- ================================================================
-- Note: We keep these tables but mark them as deprecated
-- The admin interface will only show commission settings

-- Add deprecated flag to global tables
ALTER TABLE `coupon_codes` 
ADD COLUMN `deprecated` tinyint(1) DEFAULT '1' COMMENT 'Moved to vendor-level control';

ALTER TABLE `promotional_campaigns` 
ADD COLUMN `deprecated` tinyint(1) DEFAULT '1' COMMENT 'Moved to vendor-level control';

ALTER TABLE `volume_discounts` 
ADD COLUMN `deprecated` tinyint(1) DEFAULT '1' COMMENT 'Moved to vendor-level control';

-- ================================================================
-- 7. Update existing data (if needed)
-- ================================================================
-- Mark existing global discounts as deprecated
UPDATE `coupon_codes` SET `deprecated` = 1;
UPDATE `promotional_campaigns` SET `deprecated` = 1;
UPDATE `volume_discounts` SET `deprecated` = 1;

-- ================================================================
-- 8. Create indexes for performance
-- ================================================================
CREATE INDEX `idx_vendor_discounts_lookup` ON `vendor_discounts` (`vendor_id`, `is_active`, `applies_to`);
CREATE INDEX `idx_vendor_coupons_lookup` ON `vendor_coupons` (`vendor_id`, `is_active`, `coupon_code`);
CREATE INDEX `idx_discount_usage_analytics` ON `vendor_discount_usage` (`vendor_id`, `applied_at`, `usage_type`);