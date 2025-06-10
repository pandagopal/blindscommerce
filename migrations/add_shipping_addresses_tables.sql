-- Add Multiple Shipping Addresses Support
-- This migration adds tables for managing multiple shipping addresses per user

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- User shipping addresses table
CREATE TABLE IF NOT EXISTS user_shipping_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Address details
    address_name VARCHAR(100) NOT NULL COMMENT 'User-friendly name like "Home", "Office", "Mom\'s House"',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255) NULL COMMENT 'Optional company name',
    
    -- Address information
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL COMMENT 'Apartment, suite, etc.',
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    
    -- Contact information
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL COMMENT 'Optional different email for this address',
    
    -- Address preferences
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Default shipping address for this user',
    is_billing_address BOOLEAN DEFAULT FALSE COMMENT 'Can this address be used for billing',
    
    -- Delivery instructions
    delivery_instructions TEXT NULL COMMENT 'Special delivery notes for this address',
    delivery_preference ENUM('standard', 'signature_required', 'leave_at_door', 'front_desk') DEFAULT 'standard',
    access_code VARCHAR(50) NULL COMMENT 'Building access code',
    
    -- Address validation and verification
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Has this address been validated by shipping service',
    verification_source VARCHAR(50) NULL COMMENT 'UPS, FedEx, USPS address validation',
    last_verified_at TIMESTAMP NULL,
    
    -- Usage tracking
    last_used_at TIMESTAMP NULL COMMENT 'When this address was last used for an order',
    usage_count INT DEFAULT 0 COMMENT 'How many times this address has been used',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_shipping_addresses_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    
    INDEX idx_user_addresses (user_id),
    INDEX idx_default_address (user_id, is_default),
    INDEX idx_active_addresses (user_id, is_active),
    INDEX idx_address_name (user_id, address_name),
    INDEX idx_last_used (last_used_at),
    INDEX idx_verification (is_verified, verification_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Address validation history table
CREATE TABLE IF NOT EXISTS address_validation_history (
    validation_id INT AUTO_INCREMENT PRIMARY KEY,
    address_id INT NOT NULL,
    
    -- Validation details
    validation_service ENUM('ups', 'fedex', 'usps', 'google', 'manual') NOT NULL,
    validation_status ENUM('valid', 'invalid', 'corrected', 'ambiguous') NOT NULL,
    
    -- Original vs corrected addresses
    original_address JSON NOT NULL COMMENT 'Original address as entered',
    suggested_address JSON NULL COMMENT 'Address suggested by validation service',
    
    -- Validation metadata
    confidence_score DECIMAL(3,2) NULL COMMENT 'Validation confidence from 0.00 to 1.00',
    validation_errors JSON NULL COMMENT 'Any errors or warnings from validation',
    service_response JSON NULL COMMENT 'Full response from validation service',
    
    -- Processing info
    validated_by INT NULL COMMENT 'User ID if manually validated',
    validation_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_validation_address 
        FOREIGN KEY (address_id) REFERENCES user_shipping_addresses(address_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_validation_user 
        FOREIGN KEY (validated_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    INDEX idx_address_validations (address_id, created_at DESC),
    INDEX idx_validation_service (validation_service),
    INDEX idx_validation_status (validation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipping zones and rates table (for different delivery options by location)
CREATE TABLE IF NOT EXISTS shipping_zones (
    zone_id INT AUTO_INCREMENT PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    zone_code VARCHAR(20) NOT NULL UNIQUE,
    
    -- Geographic coverage
    countries JSON NOT NULL COMMENT 'Array of supported countries',
    states_provinces JSON NULL COMMENT 'Array of supported states/provinces if country-specific',
    postal_code_patterns JSON NULL COMMENT 'Regex patterns for postal codes',
    
    -- Zone settings
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0 COMMENT 'Zone matching priority (higher = checked first)',
    
    -- Shipping options
    supports_standard BOOLEAN DEFAULT TRUE,
    supports_expedited BOOLEAN DEFAULT TRUE,
    supports_overnight BOOLEAN DEFAULT FALSE,
    supports_weekend BOOLEAN DEFAULT FALSE,
    
    -- Restrictions
    max_weight_lbs DECIMAL(8,2) NULL COMMENT 'Maximum package weight for this zone',
    max_dimensions_inches JSON NULL COMMENT 'Max length/width/height in inches',
    restricted_items JSON NULL COMMENT 'Product categories not allowed in this zone',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_zone_code (zone_code),
    INDEX idx_active_zones (is_active, priority),
    INDEX idx_zone_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipping rates by zone and method
CREATE TABLE IF NOT EXISTS shipping_rates (
    rate_id INT AUTO_INCREMENT PRIMARY KEY,
    zone_id INT NOT NULL,
    
    -- Rate details
    service_type ENUM('standard', 'expedited', 'overnight', 'weekend', 'white_glove') NOT NULL,
    service_name VARCHAR(100) NOT NULL COMMENT 'Display name like "Standard Ground", "Next Day Air"',
    carrier VARCHAR(50) NOT NULL COMMENT 'UPS, FedEx, USPS, etc.',
    
    -- Pricing structure
    base_rate DECIMAL(10,2) NOT NULL COMMENT 'Base shipping cost',
    per_pound_rate DECIMAL(10,2) DEFAULT 0.00,
    per_item_rate DECIMAL(10,2) DEFAULT 0.00,
    minimum_rate DECIMAL(10,2) DEFAULT 0.00,
    maximum_rate DECIMAL(10,2) NULL,
    
    -- Thresholds
    free_shipping_threshold DECIMAL(10,2) NULL COMMENT 'Order amount for free shipping',
    weight_threshold_lbs DECIMAL(8,2) NULL COMMENT 'Weight where different pricing applies',
    
    -- Delivery timeframes
    estimated_days_min INT NOT NULL DEFAULT 1,
    estimated_days_max INT NOT NULL DEFAULT 7,
    business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Rate conditions
    requires_signature BOOLEAN DEFAULT FALSE,
    requires_adult_signature BOOLEAN DEFAULT FALSE,
    includes_insurance BOOLEAN DEFAULT FALSE,
    max_insurance_value DECIMAL(10,2) NULL,
    
    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NULL,
    effective_until DATE NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_shipping_rates_zone 
        FOREIGN KEY (zone_id) REFERENCES shipping_zones(zone_id) 
        ON DELETE CASCADE,
    
    INDEX idx_zone_rates (zone_id, service_type),
    INDEX idx_active_rates (is_active, effective_from, effective_until),
    INDEX idx_free_shipping (free_shipping_threshold),
    INDEX idx_service_type (service_type),
    INDEX idx_carrier (carrier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERT DEFAULT DATA
-- =============================================================================

-- Insert default shipping zones
INSERT IGNORE INTO shipping_zones (zone_name, zone_code, countries, is_active, priority, supports_standard, supports_expedited, supports_overnight) VALUES 
('United States Domestic', 'US_DOMESTIC', '["United States"]', TRUE, 100, TRUE, TRUE, TRUE),
('Canada', 'CANADA', '["Canada"]', TRUE, 90, TRUE, TRUE, FALSE),
('International', 'INTERNATIONAL', '["*"]', TRUE, 10, TRUE, FALSE, FALSE);

-- Insert default shipping rates for US Domestic
INSERT IGNORE INTO shipping_rates (zone_id, service_type, service_name, carrier, base_rate, per_pound_rate, estimated_days_min, estimated_days_max, free_shipping_threshold, is_active) VALUES 
((SELECT zone_id FROM shipping_zones WHERE zone_code = 'US_DOMESTIC'), 'standard', 'Standard Ground', 'UPS', 9.99, 0.50, 3, 7, 100.00, TRUE),
((SELECT zone_id FROM shipping_zones WHERE zone_code = 'US_DOMESTIC'), 'expedited', '2-Day Express', 'UPS', 19.99, 1.00, 2, 2, NULL, TRUE),
((SELECT zone_id FROM shipping_zones WHERE zone_code = 'US_DOMESTIC'), 'overnight', 'Next Day Air', 'UPS', 39.99, 2.00, 1, 1, NULL, TRUE);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC MANAGEMENT
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_ensure_single_default_address;
DROP TRIGGER IF EXISTS tr_update_default_address;
DROP TRIGGER IF EXISTS tr_update_address_usage;

DELIMITER $$

-- Ensure only one default address per user
CREATE TRIGGER tr_ensure_single_default_address
    BEFORE INSERT ON user_shipping_addresses
    FOR EACH ROW
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE user_shipping_addresses 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND is_default = TRUE;
    END IF;
END$$

-- Update default when updating existing address
CREATE TRIGGER tr_update_default_address
    BEFORE UPDATE ON user_shipping_addresses
    FOR EACH ROW
BEGIN
    IF NEW.is_default = TRUE AND OLD.is_default = FALSE THEN
        UPDATE user_shipping_addresses 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND address_id != NEW.address_id AND is_default = TRUE;
    END IF;
END$$

-- Update usage statistics when address is used
CREATE TRIGGER tr_update_address_usage
    AFTER UPDATE ON orders
    FOR EACH ROW
BEGIN
    -- Update shipping address usage if order has shipping address
    IF NEW.shipping_address_id IS NOT NULL AND NEW.shipping_address_id != OLD.shipping_address_id THEN
        UPDATE user_shipping_addresses 
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE address_id = NEW.shipping_address_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- ADD SHIPPING ADDRESS REFERENCES TO ORDERS TABLE
-- =============================================================================

-- Add shipping address reference to orders table if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'shipping_address_id') > 0,
    'SELECT "Column shipping_address_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN shipping_address_id INT NULL COMMENT "Reference to user_shipping_addresses table"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'billing_address_id') > 0,
    'SELECT "Column billing_address_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN billing_address_id INT NULL COMMENT "Reference to user_shipping_addresses table for billing"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_shipping_address' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_shipping_address already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_shipping_address 
     FOREIGN KEY (shipping_address_id) REFERENCES user_shipping_addresses(address_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_billing_address' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_billing_address already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_billing_address 
     FOREIGN KEY (billing_address_id) REFERENCES user_shipping_addresses(address_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Multiple Shipping Addresses system created successfully!' as Status;