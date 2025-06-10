-- Add Vendor Discount and Commission Management System
-- This migration adds vendor-specific discounts and commission tracking

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Vendor-specific discount rules (managed by vendors, approved by admin)
CREATE TABLE IF NOT EXISTS vendor_discounts (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    
    -- Discount details
    discount_name VARCHAR(200) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount', 'tiered', 'bulk_pricing') NOT NULL,
    discount_value DECIMAL(8,2) NOT NULL,
    
    -- Conditions
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount_amount DECIMAL(10,2) NULL,
    minimum_quantity INT DEFAULT 1,
    
    -- Product targeting
    applies_to ENUM('all_vendor_products', 'specific_products', 'specific_categories') NOT NULL DEFAULT 'all_vendor_products',
    target_ids JSON NULL COMMENT 'Array of product/category IDs',
    
    -- Customer restrictions
    customer_types JSON NULL COMMENT 'Array of customer types: retail, trade, commercial',
    customer_groups JSON NULL COMMENT 'Array of specific customer group IDs',
    
    -- Geographic restrictions
    allowed_regions JSON NULL COMMENT 'Array of state/region codes where discount applies',
    excluded_regions JSON NULL COMMENT 'Array of excluded regions',
    
    -- Validity
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    usage_limit_total INT NULL,
    usage_limit_per_customer INT NULL,
    
    -- Admin approval workflow
    admin_approved BOOLEAN DEFAULT FALSE,
    approved_by INT NULL COMMENT 'Admin user who approved',
    approved_at TIMESTAMP NULL,
    admin_notes TEXT NULL,
    
    -- Request details
    requested_by INT NOT NULL COMMENT 'Vendor user who requested',
    request_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_vendor_discount_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_vendor_discount_approver 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_vendor_discount_requester 
        FOREIGN KEY (requested_by) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    
    INDEX idx_vendor_discounts (vendor_id, is_active),
    INDEX idx_admin_approval (admin_approved, approved_at),
    INDEX idx_validity_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission rules and structures
CREATE TABLE IF NOT EXISTS commission_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    
    -- What this rule applies to
    applies_to ENUM('vendor', 'sales_staff', 'category', 'product', 'global') NOT NULL,
    target_id INT NULL COMMENT 'ID of vendor, sales staff, category, or product',
    
    -- Commission structure
    commission_type ENUM('percentage', 'fixed_amount', 'tiered') NOT NULL,
    commission_value DECIMAL(8,2) NOT NULL COMMENT 'Percentage or fixed amount',
    
    -- Conditions
    minimum_sale_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_commission_amount DECIMAL(10,2) NULL,
    
    -- Tiered commission (for complex structures)
    tiers JSON NULL COMMENT 'Array of {min_amount, max_amount, commission_percent, commission_amount}',
    
    -- Rule hierarchy
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Default rule when no specific rule applies',
    priority INT DEFAULT 100,
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by INT NOT NULL,
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_commission_rule_creator 
        FOREIGN KEY (created_by) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    
    INDEX idx_applies_to (applies_to, target_id),
    INDEX idx_default_rules (is_default, priority),
    INDEX idx_active_rules (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission calculations and tracking
CREATE TABLE IF NOT EXISTS commission_calculations (
    calculation_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    
    -- Commission recipients
    vendor_id INT NULL,
    sales_staff_id INT NULL,
    
    -- Order details
    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Rule applied
    rule_id INT NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    
    -- Payment status
    payment_status ENUM('pending', 'paid', 'disputed', 'cancelled') DEFAULT 'pending',
    payment_date DATE NULL,
    payment_reference VARCHAR(100) NULL,
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    
    CONSTRAINT fk_commission_calc_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_calc_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_calc_sales 
        FOREIGN KEY (sales_staff_id) REFERENCES sales_staff(staff_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_calc_rule 
        FOREIGN KEY (rule_id) REFERENCES commission_rules(rule_id) 
        ON DELETE RESTRICT,
    
    UNIQUE KEY unique_order_commission (order_id, vendor_id, sales_staff_id),
    INDEX idx_vendor_commissions (vendor_id, payment_status),
    INDEX idx_sales_commissions (sales_staff_id, payment_status),
    INDEX idx_payment_status (payment_status, payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission payments and payouts
CREATE TABLE IF NOT EXISTS commission_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Recipient
    vendor_id INT NULL,
    sales_staff_id INT NULL,
    
    -- Payment period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment details
    commission_amount DECIMAL(12,2) NOT NULL,
    order_count INT NOT NULL,
    payment_method ENUM('bank_transfer', 'check', 'paypal', 'stripe', 'manual') NOT NULL,
    payment_reference VARCHAR(200) NULL,
    
    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    processed_by INT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Details
    notes TEXT NULL,
    failure_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_commission_payment_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_payment_sales 
        FOREIGN KEY (sales_staff_id) REFERENCES sales_staff(staff_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_payment_processor 
        FOREIGN KEY (processed_by) REFERENCES users(user_id) 
        ON DELETE RESTRICT,
    
    INDEX idx_vendor_payments (vendor_id, period_start, period_end),
    INDEX idx_sales_payments (sales_staff_id, period_start, period_end),
    INDEX idx_payment_status (status, processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin pricing controls and overrides
CREATE TABLE IF NOT EXISTS admin_pricing_controls (
    control_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Control type
    control_type ENUM('global_markup', 'vendor_margin_limit', 'category_pricing_rule', 'emergency_override') NOT NULL,
    control_name VARCHAR(200) NOT NULL,
    
    -- Target
    applies_to ENUM('all_products', 'vendor', 'category', 'specific_products') NOT NULL,
    target_id INT NULL,
    target_ids JSON NULL COMMENT 'Array of IDs for specific products',
    
    -- Pricing rule
    rule_type ENUM('markup_percent', 'markup_amount', 'max_price', 'min_price', 'fixed_price') NOT NULL,
    rule_value DECIMAL(10,2) NOT NULL,
    
    -- Conditions
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    customer_types JSON NULL COMMENT 'Array of customer types this applies to',
    
    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NULL,
    
    -- Emergency controls
    is_emergency_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT NULL,
    
    -- Metadata
    created_by INT NOT NULL,
    approved_by INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pricing_control_creator 
        FOREIGN KEY (created_by) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_pricing_control_approver 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    INDEX idx_control_type (control_type, applies_to),
    INDEX idx_active_controls (is_active, valid_from, valid_until),
    INDEX idx_emergency_overrides (is_emergency_override, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default commission rules
INSERT IGNORE INTO commission_rules (rule_name, applies_to, commission_type, commission_value, valid_from, created_by, is_default) VALUES 
('Default Vendor Commission', 'vendor', 'percentage', 15.00, CURDATE(), 1, TRUE),
('Default Sales Commission', 'sales_staff', 'percentage', 5.00, CURDATE(), 1, TRUE),
('High-Volume Vendor Tier', 'vendor', 'tiered', 0.00, CURDATE(), 1, FALSE),
('Premium Sales Tier', 'sales_staff', 'tiered', 0.00, CURDATE(), 1, FALSE);

-- Update the high-volume vendor tier with tiered structure
UPDATE commission_rules 
SET tiers = '[
  {"min_amount": 0, "max_amount": 5000, "commission_percent": 10.0},
  {"min_amount": 5001, "max_amount": 15000, "commission_percent": 15.0},
  {"min_amount": 15001, "max_amount": 50000, "commission_percent": 20.0},
  {"min_amount": 50001, "max_amount": null, "commission_percent": 25.0}
]'
WHERE rule_name = 'High-Volume Vendor Tier';

-- Update the premium sales tier with tiered structure
UPDATE commission_rules 
SET tiers = '[
  {"min_amount": 0, "max_amount": 2000, "commission_percent": 3.0},
  {"min_amount": 2001, "max_amount": 10000, "commission_percent": 5.0},
  {"min_amount": 10001, "max_amount": 25000, "commission_percent": 7.0},
  {"min_amount": 25001, "max_amount": null, "commission_percent": 10.0}
]'
WHERE rule_name = 'Premium Sales Tier';

-- Insert default admin pricing controls
INSERT IGNORE INTO admin_pricing_controls (control_name, control_type, applies_to, rule_type, rule_value, valid_from, created_by) VALUES 
('Global Minimum Markup', 'global_markup', 'all_products', 'markup_percent', 20.00, NOW(), 1),
('Premium Category Markup', 'category_pricing_rule', 'category', 'markup_percent', 35.00, NOW(), 1),
('Vendor Margin Limit', 'vendor_margin_limit', 'vendor', 'markup_percent', 45.00, NOW(), 1);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_calculate_commission_on_order;
DROP TRIGGER IF EXISTS tr_update_vendor_discount_usage;
DROP TRIGGER IF EXISTS tr_track_commission_payments;

DELIMITER $$

-- Automatically calculate commission when order is completed
CREATE TRIGGER tr_calculate_commission_on_order
    AFTER UPDATE ON orders
    FOR EACH ROW
BEGIN
    DECLARE vendor_commission_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE sales_commission_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE vendor_rule_id INT DEFAULT NULL;
    DECLARE sales_rule_id INT DEFAULT NULL;
    DECLARE vendor_rule_name VARCHAR(200) DEFAULT '';
    DECLARE sales_rule_name VARCHAR(200) DEFAULT '';
    
    -- Only calculate commission when order status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Get vendor commission rule
        SELECT rule_id, rule_name, commission_value INTO vendor_rule_id, vendor_rule_name, vendor_commission_rate
        FROM commission_rules 
        WHERE (applies_to = 'vendor' AND target_id = NEW.vendor_id) 
           OR (applies_to = 'global' AND is_default = TRUE)
        AND is_active = TRUE 
        AND (valid_until IS NULL OR valid_until >= CURDATE())
        ORDER BY 
            CASE WHEN applies_to = 'vendor' THEN 1 ELSE 2 END,
            priority ASC
        LIMIT 1;
        
        -- Get sales commission rule
        IF NEW.sales_staff_id IS NOT NULL THEN
            SELECT rule_id, rule_name, commission_value INTO sales_rule_id, sales_rule_name, sales_commission_rate
            FROM commission_rules 
            WHERE (applies_to = 'sales_staff' AND target_id = NEW.sales_staff_id) 
               OR (applies_to = 'global' AND is_default = TRUE)
            AND is_active = TRUE 
            AND (valid_until IS NULL OR valid_until >= CURDATE())
            ORDER BY 
                CASE WHEN applies_to = 'sales_staff' THEN 1 ELSE 2 END,
                priority ASC
            LIMIT 1;
        END IF;
        
        -- Insert vendor commission calculation
        IF vendor_commission_rate > 0 AND vendor_rule_id IS NOT NULL THEN
            INSERT INTO commission_calculations (
                order_id, vendor_id, order_amount, commission_rate, 
                commission_amount, rule_id, rule_name
            ) VALUES (
                NEW.order_id, NEW.vendor_id, NEW.total_amount, vendor_commission_rate,
                NEW.total_amount * vendor_commission_rate / 100, vendor_rule_id, vendor_rule_name
            ) ON DUPLICATE KEY UPDATE
                commission_rate = vendor_commission_rate,
                commission_amount = NEW.total_amount * vendor_commission_rate / 100,
                rule_id = vendor_rule_id,
                rule_name = vendor_rule_name;
        END IF;
        
        -- Insert sales commission calculation
        IF sales_commission_rate > 0 AND sales_rule_id IS NOT NULL AND NEW.sales_staff_id IS NOT NULL THEN
            INSERT INTO commission_calculations (
                order_id, sales_staff_id, order_amount, commission_rate, 
                commission_amount, rule_id, rule_name
            ) VALUES (
                NEW.order_id, NEW.sales_staff_id, NEW.total_amount, sales_commission_rate,
                NEW.total_amount * sales_commission_rate / 100, sales_rule_id, sales_rule_name
            ) ON DUPLICATE KEY UPDATE
                commission_rate = sales_commission_rate,
                commission_amount = NEW.total_amount * sales_commission_rate / 100,
                rule_id = sales_rule_id,
                rule_name = sales_rule_name;
        END IF;
        
    END IF;
END$$

-- Update vendor discount usage when applied to order
CREATE TRIGGER tr_update_vendor_discount_usage
    AFTER INSERT ON orders
    FOR EACH ROW
BEGIN
    -- Update usage count if vendor discount was applied
    IF NEW.vendor_discount_id IS NOT NULL THEN
        UPDATE vendor_discounts 
        SET usage_count = usage_count + 1
        WHERE discount_id = NEW.vendor_discount_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- ADD VENDOR DISCOUNT FIELDS TO ORDERS TABLE
-- =============================================================================

-- Add vendor discount fields to orders table if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'vendor_discount_id') > 0,
    'SELECT "Column vendor_discount_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN vendor_discount_id INT NULL COMMENT "Reference to vendor_discounts table"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'vendor_discount_amount') > 0,
    'SELECT "Column vendor_discount_amount already exists" as Info',
    'ALTER TABLE orders ADD COLUMN vendor_discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT "Vendor discount applied to order"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'sales_staff_id') > 0,
    'SELECT "Column sales_staff_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN sales_staff_id INT NULL COMMENT "Sales staff who handled this order"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_vendor_discount' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_vendor_discount already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_vendor_discount 
     FOREIGN KEY (vendor_discount_id) REFERENCES vendor_discounts(discount_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_sales_staff' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_sales_staff already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_sales_staff 
     FOREIGN KEY (sales_staff_id) REFERENCES sales_staff(staff_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Vendor Discount and Commission Management system created successfully!' as Status;