-- Add Advanced Pricing Features
-- This migration adds volume discounts, dynamic pricing, promotional pricing, and pricing rules

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Pricing rules and tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
    tier_id INT AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(100) NOT NULL,
    tier_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Tier requirements
    minimum_quantity INT DEFAULT 1,
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    customer_type ENUM('all', 'retail', 'commercial', 'trade') DEFAULT 'all',
    
    -- Discount configuration
    discount_type ENUM('percentage', 'fixed_amount', 'price_override') NOT NULL,
    discount_value DECIMAL(8,2) NOT NULL,
    max_discount_amount DECIMAL(10,2) NULL COMMENT 'Maximum discount cap for percentage discounts',
    
    -- Applicability
    applies_to ENUM('product', 'category', 'brand', 'order_total') NOT NULL,
    target_ids JSON NULL COMMENT 'Array of product/category/brand IDs this tier applies to',
    
    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE NULL,
    valid_until DATE NULL,
    
    -- Priority for stacking rules
    priority INT DEFAULT 100,
    can_stack_with_others BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tier_code (tier_code),
    INDEX idx_active_tiers (is_active, priority),
    INDEX idx_validity_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volume discount rules
CREATE TABLE IF NOT EXISTS volume_discounts (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    discount_name VARCHAR(100) NOT NULL,
    discount_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Product targeting
    product_id INT NULL COMMENT 'Specific product (null = applies to multiple products)',
    category_ids JSON NULL COMMENT 'Array of category IDs',
    brand_ids JSON NULL COMMENT 'Array of brand IDs',
    product_tags JSON NULL COMMENT 'Array of product tags for flexible matching',
    
    -- Volume tiers (quantity -> discount)
    volume_tiers JSON NOT NULL COMMENT 'Array of {min_qty, max_qty, discount_percent, discount_amount}',
    
    -- Customer restrictions
    customer_types JSON NULL COMMENT 'Array of customer types: [retail, commercial, trade]',
    customer_groups JSON NULL COMMENT 'Array of specific customer group IDs',
    
    -- Geographic restrictions
    allowed_regions JSON NULL COMMENT 'Array of state/region codes',
    excluded_regions JSON NULL COMMENT 'Array of excluded state/region codes',
    
    -- Stacking rules
    can_combine_with_promos BOOLEAN DEFAULT TRUE,
    can_combine_with_coupons BOOLEAN DEFAULT TRUE,
    max_total_discount_percent DECIMAL(5,2) DEFAULT 50.00,
    
    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATETIME NULL,
    valid_until DATETIME NULL,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    max_usage_total INT NULL,
    max_usage_per_customer INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_volume_discount_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    
    INDEX idx_discount_code (discount_code),
    INDEX idx_product_discounts (product_id),
    INDEX idx_active_volume_discounts (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dynamic pricing rules
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('time_based', 'demand_based', 'inventory_based', 'competition_based', 'seasonal') NOT NULL,
    
    -- Product targeting
    product_id INT NULL,
    category_ids JSON NULL,
    brand_ids JSON NULL,
    
    -- Rule conditions
    conditions JSON NOT NULL COMMENT 'Rule-specific conditions (time ranges, inventory levels, etc.)',
    
    -- Pricing adjustment
    adjustment_type ENUM('percentage', 'fixed_amount', 'multiply_by') NOT NULL,
    adjustment_value DECIMAL(8,4) NOT NULL,
    min_price DECIMAL(10,2) NULL COMMENT 'Minimum price floor',
    max_price DECIMAL(10,2) NULL COMMENT 'Maximum price ceiling',
    
    -- Rule priority and conflicts
    priority INT DEFAULT 100,
    conflicts_with JSON NULL COMMENT 'Array of rule IDs that conflict with this rule',
    
    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATETIME NULL,
    valid_until DATETIME NULL,
    
    -- Performance tracking
    applications_count INT DEFAULT 0,
    total_revenue_impact DECIMAL(12,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_dynamic_pricing_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    
    INDEX idx_rule_type (rule_type),
    INDEX idx_product_dynamic_pricing (product_id),
    INDEX idx_active_dynamic_rules (is_active, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promotional campaigns
CREATE TABLE IF NOT EXISTS promotional_campaigns (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(200) NOT NULL,
    campaign_code VARCHAR(50) NOT NULL UNIQUE,
    campaign_type ENUM('percentage_off', 'fixed_amount_off', 'buy_x_get_y', 'free_shipping', 'bundle_deal') NOT NULL,
    
    -- Campaign details
    description TEXT NULL,
    terms_and_conditions TEXT NULL,
    
    -- Discount configuration
    discount_percent DECIMAL(5,2) NULL,
    discount_amount DECIMAL(10,2) NULL,
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount_amount DECIMAL(10,2) NULL,
    
    -- Buy X Get Y configuration
    buy_quantity INT NULL,
    get_quantity INT NULL,
    get_discount_percent DECIMAL(5,2) NULL,
    
    -- Product/Category targeting
    applies_to ENUM('all_products', 'specific_products', 'categories', 'brands') NOT NULL DEFAULT 'all_products',
    target_product_ids JSON NULL,
    target_category_ids JSON NULL,
    target_brand_ids JSON NULL,
    excluded_product_ids JSON NULL,
    
    -- Customer targeting
    customer_segments JSON NULL COMMENT 'Array of customer segments: new, returning, vip, etc.',
    customer_types JSON NULL COMMENT 'Array of customer types: retail, commercial, trade',
    min_previous_orders INT NULL,
    min_customer_lifetime_value DECIMAL(10,2) NULL,
    
    -- Geographic targeting
    target_regions JSON NULL COMMENT 'Array of state/region codes',
    excluded_regions JSON NULL COMMENT 'Array of excluded regions',
    
    -- Timing and validity
    is_active BOOLEAN DEFAULT TRUE,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Usage limits
    usage_limit_total INT NULL,
    usage_limit_per_customer INT NULL,
    usage_count INT DEFAULT 0,
    
    -- Stacking rules
    can_stack_with_volume_discounts BOOLEAN DEFAULT TRUE,
    can_stack_with_coupons BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 100,
    
    -- Performance tracking
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_discount_given DECIMAL(12,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_campaign_code (campaign_code),
    INDEX idx_active_campaigns (is_active, starts_at, ends_at),
    INDEX idx_campaign_type (campaign_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon codes
CREATE TABLE IF NOT EXISTS coupon_codes (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    coupon_name VARCHAR(100) NOT NULL,
    
    -- Discount configuration
    discount_type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
    discount_value DECIMAL(8,2) NOT NULL,
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount_amount DECIMAL(10,2) NULL,
    
    -- Product restrictions
    applies_to ENUM('all_products', 'specific_products', 'categories', 'exclude_products') DEFAULT 'all_products',
    target_product_ids JSON NULL,
    target_category_ids JSON NULL,
    excluded_product_ids JSON NULL,
    
    -- Customer restrictions
    customer_id INT NULL COMMENT 'Specific customer only (null = any customer)',
    customer_types JSON NULL,
    first_time_customers_only BOOLEAN DEFAULT FALSE,
    
    -- Usage limits
    usage_limit_total INT NULL,
    usage_limit_per_customer INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    
    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATETIME NULL,
    valid_until DATETIME NULL,
    
    -- Auto-generation settings (for single-use codes)
    is_auto_generated BOOLEAN DEFAULT FALSE,
    generation_pattern VARCHAR(50) NULL,
    batch_id VARCHAR(50) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_coupon_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_customer_coupons (customer_id),
    INDEX idx_active_coupons (is_active, valid_from, valid_until),
    INDEX idx_batch_coupons (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing history for tracking changes
CREATE TABLE IF NOT EXISTS product_pricing_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    
    -- Price changes
    previous_price DECIMAL(10,2) NULL,
    new_price DECIMAL(10,2) NOT NULL,
    price_change_amount DECIMAL(10,2) GENERATED ALWAYS AS (new_price - IFNULL(previous_price, 0)) STORED,
    price_change_percent DECIMAL(5,2) NULL,
    
    -- Change reason and source
    change_reason ENUM('manual_update', 'dynamic_pricing', 'promotional_campaign', 'volume_discount', 'system_adjustment') NOT NULL,
    change_source VARCHAR(100) NULL COMMENT 'User ID, system process, rule ID, etc.',
    
    -- Context
    effective_from DATETIME NOT NULL,
    effective_until DATETIME NULL,
    campaign_id INT NULL,
    rule_id INT NULL,
    
    -- Metadata
    changed_by INT NULL,
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pricing_history_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_pricing_history_user 
        FOREIGN KEY (changed_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_pricing_history_campaign 
        FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(campaign_id) 
        ON DELETE SET NULL,
    
    INDEX idx_product_pricing_history (product_id, effective_from),
    INDEX idx_change_reason (change_reason),
    INDEX idx_effective_dates (effective_from, effective_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer-specific pricing (for trade/commercial customers)
CREATE TABLE IF NOT EXISTS customer_specific_pricing (
    pricing_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NULL COMMENT 'Specific product (null = applies to categories/brands)',
    category_id INT NULL,
    brand_id INT NULL,
    
    -- Pricing details
    pricing_type ENUM('fixed_price', 'discount_percent', 'discount_amount', 'markup_percent') NOT NULL,
    pricing_value DECIMAL(10,2) NOT NULL,
    minimum_quantity INT DEFAULT 1,
    
    -- Contract details
    contract_reference VARCHAR(100) NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NULL,
    
    -- Approval workflow
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_customer_pricing_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_customer_pricing_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_customer_pricing_approver 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    UNIQUE KEY unique_customer_product_pricing (customer_id, product_id, category_id, brand_id),
    INDEX idx_customer_pricing (customer_id),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default pricing tiers
INSERT IGNORE INTO pricing_tiers (tier_name, tier_code, minimum_quantity, discount_type, discount_value, applies_to) VALUES 
('Retail Customer', 'RETAIL', 1, 'percentage', 0.00, 'order_total'),
('Trade Customer - Level 1', 'TRADE_L1', 1, 'percentage', 10.00, 'order_total'),
('Trade Customer - Level 2', 'TRADE_L2', 1, 'percentage', 15.00, 'order_total'),
('Commercial - Small', 'COMMERCIAL_SM', 10, 'percentage', 12.00, 'order_total'),
('Commercial - Large', 'COMMERCIAL_LG', 50, 'percentage', 20.00, 'order_total');

-- Insert default volume discounts
INSERT IGNORE INTO volume_discounts (discount_name, discount_code, volume_tiers) VALUES 
('Bulk Blinds Discount', 'BULK_BLINDS', '[
    {"min_qty": 5, "max_qty": 9, "discount_percent": 5.0},
    {"min_qty": 10, "max_qty": 19, "discount_percent": 10.0},
    {"min_qty": 20, "max_qty": 49, "discount_percent": 15.0},
    {"min_qty": 50, "max_qty": null, "discount_percent": 20.0}
]'),
('Window Treatment Volume', 'WINDOW_VOLUME', '[
    {"min_qty": 3, "max_qty": 5, "discount_percent": 3.0},
    {"min_qty": 6, "max_qty": 10, "discount_percent": 7.0},
    {"min_qty": 11, "max_qty": null, "discount_percent": 12.0}
]');

-- Insert sample promotional campaigns
INSERT IGNORE INTO promotional_campaigns (
    campaign_name, campaign_code, campaign_type, 
    discount_percent, minimum_order_value, 
    starts_at, ends_at, applies_to
) VALUES 
('Spring Sale 2024', 'SPRING2024', 'percentage_off', 15.00, 100.00, 
 '2024-03-01 00:00:00', '2024-05-31 23:59:59', 'all_products'),
('New Customer Welcome', 'WELCOME20', 'percentage_off', 20.00, 50.00, 
 '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'all_products');

-- Insert sample coupon codes
INSERT IGNORE INTO coupon_codes (coupon_code, coupon_name, discount_type, discount_value, minimum_order_value) VALUES 
('SAVE10', '10% Off Orders Over $100', 'percentage', 10.00, 100.00),
('FREESHIP', 'Free Shipping', 'free_shipping', 0.00, 75.00),
('WELCOME25', 'Welcome $25 Off', 'fixed_amount', 25.00, 100.00);

-- Note: Triggers will be created after adding columns to orders table

-- =============================================================================
-- ADD PRICING FIELDS TO EXISTING TABLES
-- =============================================================================

-- Add pricing fields to orders table if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'campaign_id') > 0,
    'SELECT "Column campaign_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN campaign_id INT NULL COMMENT "Reference to promotional_campaigns table"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'coupon_code') > 0,
    'SELECT "Column coupon_code already exists" as Info',
    'ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL COMMENT "Applied coupon code"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'volume_discount_amount') > 0,
    'SELECT "Column volume_discount_amount already exists" as Info',
    'ALTER TABLE orders ADD COLUMN volume_discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT "Volume discount applied"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_campaign' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_campaign already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_campaign 
     FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(campaign_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- CREATE TRIGGERS AFTER COLUMNS ARE ADDED
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_track_pricing_changes;
DROP TRIGGER IF EXISTS tr_update_campaign_stats;

DELIMITER $$

-- Track pricing changes in history (using base_price instead of price)
CREATE TRIGGER tr_track_pricing_changes
    AFTER UPDATE ON products
    FOR EACH ROW
BEGIN
    IF NEW.base_price != OLD.base_price THEN
        INSERT INTO product_pricing_history (
            product_id, previous_price, new_price, change_reason, 
            change_source, effective_from
        ) VALUES (
            NEW.product_id, OLD.base_price, NEW.base_price, 'manual_update', 
            'system', NOW()
        );
    END IF;
END$$

-- Update campaign statistics
CREATE TRIGGER tr_update_campaign_stats
    AFTER INSERT ON orders
    FOR EACH ROW
BEGIN
    -- Update promotional campaign stats if campaign was used
    IF NEW.campaign_id IS NOT NULL THEN
        UPDATE promotional_campaigns 
        SET total_orders = total_orders + 1,
            total_revenue = total_revenue + NEW.total_amount,
            total_discount_given = total_discount_given + IFNULL(NEW.discount_amount, 0)
        WHERE campaign_id = NEW.campaign_id;
    END IF;
    
    -- Update coupon usage if coupon was used
    IF NEW.coupon_code IS NOT NULL THEN
        UPDATE coupon_codes 
        SET usage_count = usage_count + 1
        WHERE coupon_code = NEW.coupon_code;
    END IF;
END$$

DELIMITER ;

SELECT 'Advanced Pricing Features created successfully!' as Status;