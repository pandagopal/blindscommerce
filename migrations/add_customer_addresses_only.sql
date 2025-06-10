-- Add customer addresses table only
-- This migration adds the customer_addresses table for advanced cart features

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Customer addresses (separate from user_shipping_addresses for cart-specific addresses)
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM('shipping', 'billing', 'both') DEFAULT 'shipping',
    is_default BOOLEAN DEFAULT FALSE,
    label VARCHAR(100) NULL COMMENT 'User-friendly label like "Home", "Office", etc.',
    
    -- Address details
    recipient_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    phone VARCHAR(20) NULL,
    delivery_instructions TEXT NULL,
    is_residential BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_addresses (user_id),
    INDEX idx_address_type (address_type),
    INDEX idx_is_default (is_default),
    
    CONSTRAINT fk_customer_addresses_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Customer addresses table created successfully!' as Status;