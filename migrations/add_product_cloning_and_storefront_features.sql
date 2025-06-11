-- Migration: Add Product Cloning, Status Workflow, Vendor Storefronts, and Product Inheritance
-- Date: 2025-01-10

-- 1. Update products table to support status workflow
ALTER TABLE `products` 
ADD COLUMN `status` ENUM('draft', 'inactive', 'active', 'suspended') DEFAULT 'active' AFTER `is_active`;

-- Add indexes for performance
ALTER TABLE `products` 
ADD INDEX `idx_status` (`status`);

-- 2. Update vendor_products table to support status workflow
ALTER TABLE `vendor_products` 
ADD COLUMN `status` ENUM('draft', 'inactive', 'active', 'suspended') DEFAULT 'draft' AFTER `is_active`;

-- Add indexes for vendor_products
ALTER TABLE `vendor_products` 
ADD INDEX `idx_vp_status` (`status`);

-- 3. Create vendor storefronts table
CREATE TABLE `vendor_storefronts` (
  `storefront_id` INT NOT NULL AUTO_INCREMENT,
  `vendor_id` INT NOT NULL,
  `subdomain` VARCHAR(50) NOT NULL,
  `custom_domain` VARCHAR(255) DEFAULT NULL,
  `storefront_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `banner_url` VARCHAR(500) DEFAULT NULL,
  `theme_settings` JSON DEFAULT NULL,
  `custom_css` TEXT DEFAULT NULL,
  `seo_title` VARCHAR(255) DEFAULT NULL,
  `seo_description` TEXT DEFAULT NULL,
  `seo_keywords` TEXT DEFAULT NULL,
  `social_links` JSON DEFAULT NULL,
  `contact_info` JSON DEFAULT NULL,
  `business_hours` JSON DEFAULT NULL,
  `shipping_info` TEXT DEFAULT NULL,
  `return_policy` TEXT DEFAULT NULL,
  `about_section` TEXT DEFAULT NULL,
  `featured_products` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_approved` TINYINT(1) DEFAULT 0,
  `approved_by` INT DEFAULT NULL,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`storefront_id`),
  UNIQUE KEY `unique_subdomain` (`subdomain`),
  UNIQUE KEY `unique_custom_domain` (`custom_domain`),
  UNIQUE KEY `unique_vendor_storefront` (`vendor_id`),
  KEY `idx_subdomain` (`subdomain`),
  KEY `idx_custom_domain` (`custom_domain`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_approved` (`is_approved`),
  CONSTRAINT `vendor_storefronts_vendor_fk` 
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_storefronts_approved_by_fk` 
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create vendor storefront pages table
CREATE TABLE `vendor_storefront_pages` (
  `page_id` INT NOT NULL AUTO_INCREMENT,
  `storefront_id` INT NOT NULL,
  `page_type` ENUM('home', 'about', 'contact', 'catalog', 'custom') NOT NULL,
  `page_slug` VARCHAR(100) NOT NULL,
  `page_title` VARCHAR(255) NOT NULL,
  `page_content` LONGTEXT,
  `meta_title` VARCHAR(255) DEFAULT NULL,
  `meta_description` TEXT DEFAULT NULL,
  `is_published` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`page_id`),
  UNIQUE KEY `unique_storefront_page_slug` (`storefront_id`, `page_slug`),
  KEY `idx_storefront_id` (`storefront_id`),
  KEY `idx_page_type` (`page_type`),
  KEY `idx_is_published` (`is_published`),
  CONSTRAINT `vendor_storefront_pages_storefront_fk` 
    FOREIGN KEY (`storefront_id`) REFERENCES `vendor_storefronts` (`storefront_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create product inheritance relationships table
CREATE TABLE `product_inheritance` (
  `inheritance_id` INT NOT NULL AUTO_INCREMENT,
  `parent_product_id` INT NOT NULL,
  `child_product_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `inheritance_type` ENUM('clone', 'variant', 'template_instance') DEFAULT 'clone',
  `inherited_fields` JSON DEFAULT NULL, -- Fields inherited from parent
  `custom_fields` JSON DEFAULT NULL,   -- Fields customized by vendor
  `sync_enabled` TINYINT(1) DEFAULT 0, -- Auto-sync with parent updates
  `last_synced_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inheritance_id`),
  UNIQUE KEY `unique_child_product` (`child_product_id`),
  KEY `idx_parent_product` (`parent_product_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_inheritance_type` (`inheritance_type`),
  CONSTRAINT `product_inheritance_parent_fk` 
    FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_inheritance_child_fk` 
    FOREIGN KEY (`child_product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_inheritance_vendor_fk` 
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create product status change log
CREATE TABLE `product_status_log` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `changed_by` INT NOT NULL,
  `old_status` ENUM('draft', 'inactive', 'active', 'suspended') NOT NULL,
  `new_status` ENUM('draft', 'inactive', 'active', 'suspended') NOT NULL,
  `change_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `product_status_log_product_fk` 
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_status_log_vendor_fk` 
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `product_status_log_user_fk` 
    FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create product cloning activity log
CREATE TABLE `product_cloning_log` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `original_product_id` INT NOT NULL,
  `cloned_product_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `cloned_by` INT NOT NULL,
  `cloning_reason` TEXT DEFAULT NULL,
  `customizations_made` JSON DEFAULT NULL,
  `cloning_status` ENUM('initiated', 'completed', 'failed') DEFAULT 'initiated',
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_original_product` (`original_product_id`),
  KEY `idx_cloned_product` (`cloned_product_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_cloned_by` (`cloned_by`),
  KEY `idx_cloning_status` (`cloning_status`),
  CONSTRAINT `product_cloning_log_original_fk` 
    FOREIGN KEY (`original_product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_cloning_log_cloned_fk` 
    FOREIGN KEY (`cloned_product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_cloning_log_vendor_fk` 
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `product_cloning_log_user_fk` 
    FOREIGN KEY (`cloned_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create vendor storefront analytics table
CREATE TABLE `vendor_storefront_analytics` (
  `analytics_id` INT NOT NULL AUTO_INCREMENT,
  `storefront_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `page_views` INT DEFAULT 0,
  `unique_visitors` INT DEFAULT 0,
  `product_views` INT DEFAULT 0,
  `cart_additions` INT DEFAULT 0,
  `orders_placed` INT DEFAULT 0,
  `revenue` DECIMAL(10,2) DEFAULT 0.00,
  `bounce_rate` DECIMAL(5,2) DEFAULT 0.00,
  `avg_session_duration` INT DEFAULT 0, -- in seconds
  `top_products` JSON DEFAULT NULL,
  `traffic_sources` JSON DEFAULT NULL,
  `conversion_rate` DECIMAL(5,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`analytics_id`),
  UNIQUE KEY `unique_storefront_date` (`storefront_id`, `date`),
  KEY `idx_storefront_id` (`storefront_id`),
  KEY `idx_date` (`date`),
  CONSTRAINT `vendor_storefront_analytics_storefront_fk` 
    FOREIGN KEY (`storefront_id`) REFERENCES `vendor_storefronts` (`storefront_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Update existing data - migrate is_active to status
UPDATE `products` SET `status` = 'active' WHERE `is_active` = 1;
UPDATE `products` SET `status` = 'inactive' WHERE `is_active` = 0;

UPDATE `vendor_products` SET `status` = 'active' WHERE `is_active` = 1;
UPDATE `vendor_products` SET `status` = 'inactive' WHERE `is_active` = 0;

-- 10. Add some indexes for better performance on new features
ALTER TABLE `products` ADD INDEX `idx_status_active` (`status`, `is_active`);
ALTER TABLE `vendor_products` ADD INDEX `idx_vp_status_active` (`status`, `is_active`);

-- 11. Create sample data for testing (optional)
-- This creates a default storefront for existing vendors
INSERT INTO `vendor_storefronts` (
  `vendor_id`, 
  `subdomain`, 
  `storefront_name`, 
  `description`,
  `is_active`,
  `is_approved`
)
SELECT 
  `vendor_info_id`,
  LOWER(REPLACE(REPLACE(`company_name`, ' ', '-'), '.', '')),
  CONCAT(`company_name`, ' Store'),
  CONCAT('Welcome to ', `company_name`, ' - Your trusted blinds and window treatments specialist.'),
  1,
  1
FROM `vendor_info` 
WHERE `vendor_info_id` NOT IN (SELECT `vendor_id` FROM `vendor_storefronts`)
AND `company_name` IS NOT NULL 
AND `company_name` != '';

-- Create default home pages for new storefronts
INSERT INTO `vendor_storefront_pages` (
  `storefront_id`,
  `page_type`,
  `page_slug`,
  `page_title`,
  `page_content`,
  `is_published`
)
SELECT 
  `storefront_id`,
  'home',
  'home',
  'Welcome to Our Store',
  '<h1>Welcome to Our Blinds Store</h1><p>Discover our wide selection of premium blinds and window treatments.</p>',
  1
FROM `vendor_storefronts`
WHERE `storefront_id` NOT IN (
  SELECT `storefront_id` FROM `vendor_storefront_pages` WHERE `page_type` = 'home'
);