-- ================================================================
-- Enhanced Vendor Discount & Coupon System - Simple Migration
-- Create new tables and sample data only
-- ================================================================

-- ================================================================
-- 1. New Vendor Coupons Table
-- ================================================================
CREATE TABLE IF NOT EXISTS `vendor_coupons` (
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
-- 2. Vendor Discount Usage Tracking
-- ================================================================
CREATE TABLE IF NOT EXISTS `vendor_discount_usage` (
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
-- 3. Cart Item Vendor Discounts (for multi-vendor cart support)
-- ================================================================
CREATE TABLE IF NOT EXISTS `cart_vendor_discounts` (
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