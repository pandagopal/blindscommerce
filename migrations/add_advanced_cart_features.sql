-- Advanced Cart Features Database Schema
-- This adds Amazon-level cart functionality to the existing system

USE blindscommerce;

-- Add advanced fields to existing cart_items table
ALTER TABLE cart_items 
ADD COLUMN saved_for_later BOOLEAN DEFAULT FALSE,
ADD COLUMN price_at_add DECIMAL(10,2) NULL COMMENT 'Price when item was added to track changes',
ADD COLUMN expiry_date TIMESTAMP NULL COMMENT 'When cart item expires',
ADD COLUMN notes TEXT NULL COMMENT 'Customer notes for this item',
ADD COLUMN is_gift BOOLEAN DEFAULT FALSE,
ADD COLUMN gift_message TEXT NULL,
ADD COLUMN scheduled_delivery_date DATE NULL,
ADD COLUMN installation_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN sample_requested BOOLEAN DEFAULT FALSE;

-- Cart sharing and management
CREATE TABLE IF NOT EXISTS shared_carts (
    share_id VARCHAR(100) PRIMARY KEY,
    cart_id INT NOT NULL,
    shared_by INT NOT NULL,
    share_token VARCHAR(100) NOT NULL UNIQUE,
    share_type ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    expires_at TIMESTAMP NULL,
    access_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cart_shares (cart_id),
    INDEX idx_share_token (share_token),
    INDEX idx_expires_at (expires_at),
    
    CONSTRAINT fk_shared_carts_cart 
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_shared_carts_user 
        FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Multiple cart management (projects/saved carts)
CREATE TABLE IF NOT EXISTS saved_carts (
    saved_cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cart_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    project_type ENUM('residential', 'commercial', 'renovation', 'new_construction', 'other') DEFAULT 'residential',
    is_template BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    total_items INT DEFAULT 0,
    estimated_total DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_saved_carts (user_id),
    INDEX idx_project_type (project_type),
    INDEX idx_is_template (is_template),
    
    CONSTRAINT fk_saved_carts_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved cart items
CREATE TABLE IF NOT EXISTS saved_cart_items (
    saved_item_id INT AUTO_INCREMENT PRIMARY KEY,
    saved_cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    configuration JSON NULL,
    notes TEXT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    room_assignment VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_saved_cart_items (saved_cart_id),
    INDEX idx_product_saved (product_id),
    
    CONSTRAINT fk_saved_cart_items_cart 
        FOREIGN KEY (saved_cart_id) REFERENCES saved_carts(saved_cart_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Abandoned cart tracking
CREATE TABLE IF NOT EXISTS abandoned_carts (
    abandoned_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    cart_value DECIMAL(10,2) NOT NULL,
    item_count INT NOT NULL,
    abandoned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recovery_email_sent BOOLEAN DEFAULT FALSE,
    recovery_emails_count INT DEFAULT 0,
    last_recovery_email TIMESTAMP NULL,
    recovered_at TIMESTAMP NULL,
    recovery_order_id INT NULL,
    
    INDEX idx_abandoned_user (user_id),
    INDEX idx_abandoned_session (session_id),
    INDEX idx_abandoned_at (abandoned_at),
    INDEX idx_recovery_status (recovery_email_sent, recovered_at),
    
    CONSTRAINT fk_abandoned_carts_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price change tracking and notifications
CREATE TABLE IF NOT EXISTS price_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    target_price DECIMAL(10,2) NULL COMMENT 'Alert when price drops to this level',
    alert_type ENUM('price_drop', 'back_in_stock', 'price_change') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_price DECIMAL(10,2) NULL,
    last_notification_sent TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_price_alerts_user (user_id),
    INDEX idx_price_alerts_product (product_id),
    INDEX idx_active_alerts (is_active),
    
    CONSTRAINT fk_price_alerts_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock availability tracking
CREATE TABLE IF NOT EXISTS stock_alerts (
    stock_alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    configuration JSON NULL COMMENT 'Specific variant configuration',
    email_when_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    
    INDEX idx_stock_alerts_user (user_id),
    INDEX idx_stock_alerts_product (product_id),
    INDEX idx_stock_alerts_active (notified_at),
    
    UNIQUE KEY unique_user_product_config (user_id, product_id),
    
    CONSTRAINT fk_stock_alerts_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Frequently bought together tracking
CREATE TABLE IF NOT EXISTS product_associations (
    association_id INT AUTO_INCREMENT PRIMARY KEY,
    product_a_id INT NOT NULL,
    product_b_id INT NOT NULL,
    association_strength DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Confidence score 0-1',
    times_bought_together INT DEFAULT 1,
    association_type ENUM('frequently_together', 'substitute', 'complement', 'upgrade') DEFAULT 'frequently_together',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_product_a (product_a_id),
    INDEX idx_product_b (product_b_id),
    INDEX idx_association_strength (association_strength DESC),
    INDEX idx_association_type (association_type),
    
    UNIQUE KEY unique_product_pair (product_a_id, product_b_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer shipping addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM('shipping', 'billing', 'both') DEFAULT 'shipping',
    is_default BOOLEAN DEFAULT FALSE,
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

-- Cart item shipping assignments
CREATE TABLE IF NOT EXISTS cart_item_shipping (
    shipping_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_item_id INT NOT NULL,
    address_id INT NOT NULL,
    delivery_date DATE NULL,
    shipping_method VARCHAR(100) DEFAULT 'standard',
    special_instructions TEXT NULL,
    
    INDEX idx_cart_item_shipping (cart_item_id),
    INDEX idx_shipping_address (address_id),
    
    CONSTRAINT fk_cart_shipping_item 
        FOREIGN KEY (cart_item_id) REFERENCES cart_items(cart_item_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_shipping_address 
        FOREIGN KEY (address_id) REFERENCES customer_addresses(address_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-save configurations (for incomplete customizations)
CREATE TABLE IF NOT EXISTS draft_configurations (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    product_id INT NOT NULL,
    configuration JSON NOT NULL,
    completion_percentage DECIMAL(3,2) DEFAULT 0.00 COMMENT 'How complete the configuration is',
    page_context VARCHAR(255) NULL COMMENT 'Where user was configuring',
    auto_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 7 DAY)),
    
    INDEX idx_draft_user (user_id),
    INDEX idx_draft_session (session_id),
    INDEX idx_draft_product (product_id),
    INDEX idx_expires_at (expires_at),
    
    CONSTRAINT fk_draft_configurations_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bundle and promotion tracking
CREATE TABLE IF NOT EXISTS cart_promotions (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    promotion_code VARCHAR(100) NULL,
    promotion_type ENUM('percentage', 'fixed_amount', 'free_shipping', 'bundle_discount', 'loyalty_discount') NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    conditions JSON NULL COMMENT 'Conditions that triggered this promotion',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cart_promotions (cart_id),
    INDEX idx_promotion_code (promotion_code),
    INDEX idx_promotion_type (promotion_type),
    
    CONSTRAINT fk_cart_promotions_cart 
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart analytics and behavior tracking
CREATE TABLE IF NOT EXISTS cart_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    action_type ENUM('item_added', 'item_removed', 'quantity_changed', 'saved_for_later', 'moved_to_cart', 'shared', 'abandoned', 'converted') NOT NULL,
    product_id INT NULL,
    previous_value JSON NULL COMMENT 'Previous state before action',
    new_value JSON NULL COMMENT 'New state after action',
    page_url VARCHAR(500) NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cart_analytics_cart (cart_id),
    INDEX idx_cart_analytics_user (user_id),
    INDEX idx_cart_analytics_action (action_type),
    INDEX idx_cart_analytics_timestamp (timestamp),
    
    CONSTRAINT fk_cart_analytics_cart 
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_analytics_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_cart_items_saved_for_later ON cart_items(saved_for_later, updated_at);
CREATE INDEX idx_cart_items_expiry ON cart_items(expiry_date);
CREATE INDEX idx_cart_items_price_change ON cart_items(price_at_add, updated_at);

-- Create views for common queries
CREATE OR REPLACE VIEW active_cart_summary AS
SELECT 
    c.cart_id,
    c.user_id,
    c.session_id,
    COUNT(ci.cart_item_id) as total_items,
    SUM(ci.quantity) as total_quantity,
    SUM(CASE WHEN ci.saved_for_later = FALSE THEN ci.quantity ELSE 0 END) as active_quantity,
    SUM(CASE WHEN ci.saved_for_later = TRUE THEN ci.quantity ELSE 0 END) as saved_quantity,
    MAX(ci.updated_at) as last_activity,
    CASE 
        WHEN MAX(ci.updated_at) < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN TRUE 
        ELSE FALSE 
    END as is_abandoned
FROM carts c
LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
WHERE c.status = 'active'
GROUP BY c.cart_id, c.user_id, c.session_id;

CREATE OR REPLACE VIEW cart_recommendations AS
SELECT 
    ci.cart_id,
    ci.product_id as cart_product_id,
    pa.product_b_id as recommended_product_id,
    pa.association_strength,
    pa.association_type,
    p.name as recommended_product_name,
    p.price as recommended_product_price
FROM cart_items ci
JOIN product_associations pa ON ci.product_id = pa.product_a_id
JOIN products p ON pa.product_b_id = p.product_id
WHERE ci.saved_for_later = FALSE 
  AND pa.association_strength > 0.3
ORDER BY ci.cart_id, pa.association_strength DESC;