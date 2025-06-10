-- Add Sample Management System Tables
-- This migration adds the complete sample management system for blinds/curtains e-commerce

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Use the blindscommerce database
USE blindscommerce;

-- =============================================================================
-- SAMPLE MANAGEMENT SYSTEM TABLES
-- =============================================================================

-- Material swatches table (available samples)
CREATE TABLE IF NOT EXISTS material_swatches (
    swatch_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_code VARCHAR(7) NULL COMMENT 'Hex color code',
    material_name VARCHAR(100) NOT NULL,
    material_type VARCHAR(50) NULL,
    texture_description TEXT NULL,
    category_id INT NULL,
    brand_id INT NULL,
    
    -- Pricing and availability
    sample_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Fee to request this sample',
    is_premium BOOLEAN DEFAULT FALSE COMMENT 'Premium samples have higher fees',
    is_available BOOLEAN DEFAULT TRUE COMMENT 'Currently available for ordering',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active in catalog',
    
    -- Sample information
    image_url VARCHAR(500) NULL COMMENT 'High-res sample image',
    thumbnail_url VARCHAR(500) NULL COMMENT 'Thumbnail image',
    texture_image_url VARCHAR(500) NULL COMMENT 'Close-up texture image',
    
    -- Physical properties
    fabric_weight DECIMAL(8,2) NULL COMMENT 'Weight in oz/sq yard',
    opacity_level ENUM('sheer', 'semi-sheer', 'semi-opaque', 'opaque', 'blackout') NULL,
    light_filtering_percentage DECIMAL(5,2) NULL COMMENT '0-100% light filtering',
    uv_protection_percentage DECIMAL(5,2) NULL COMMENT '0-100% UV protection',
    
    -- Care and maintenance
    care_instructions TEXT NULL,
    fabric_content VARCHAR(255) NULL COMMENT 'Material composition',
    durability_rating TINYINT DEFAULT 5 COMMENT '1-10 durability scale',
    fade_resistance ENUM('low', 'medium', 'high', 'excellent') DEFAULT 'medium',
    
    -- Metadata
    sku VARCHAR(100) NULL,
    manufacturer VARCHAR(255) NULL,
    manufacturer_part_number VARCHAR(100) NULL,
    lead_time_days INT DEFAULT 0 COMMENT 'Lead time for full orders',
    minimum_order_yards DECIMAL(8,2) DEFAULT 1.0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category_id),
    INDEX idx_material_type (material_type),
    INDEX idx_available (is_available, is_active),
    INDEX idx_premium (is_premium),
    INDEX idx_opacity (opacity_level),
    INDEX idx_brand (brand_id),
    INDEX idx_sku (sku),
    
    CONSTRAINT fk_swatches_category 
        FOREIGN KEY (category_id) REFERENCES categories(category_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_swatches_brand 
        FOREIGN KEY (brand_id) REFERENCES brands(brand_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample orders table (customer sample requests)
CREATE TABLE IF NOT EXISTS sample_orders (
    sample_order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'External order ID for tracking',
    user_id INT NULL COMMENT 'Registered user ID, null for guests',
    
    -- Customer information
    email VARCHAR(255) NOT NULL,
    
    -- Shipping information
    shipping_name VARCHAR(255) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_zip VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'United States',
    shipping_phone VARCHAR(20) NULL,
    
    -- Order details
    priority ENUM('STANDARD', 'EXPRESS') DEFAULT 'STANDARD',
    sample_count INT NOT NULL DEFAULT 0,
    sample_fees DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total fees for samples',
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Status and tracking
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    tracking_number VARCHAR(100) NULL,
    shipping_carrier VARCHAR(50) NULL,
    estimated_delivery DATE NULL,
    actual_delivery_date DATE NULL,
    
    -- Notes and special instructions
    customer_notes TEXT NULL,
    internal_notes TEXT NULL,
    fulfillment_notes TEXT NULL,
    
    -- Processing information
    processed_at TIMESTAMP NULL,
    processed_by INT NULL COMMENT 'Staff member who processed order',
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_date (created_at),
    INDEX idx_processing (status, priority, created_at),
    INDEX idx_tracking (tracking_number),
    INDEX idx_delivery_date (estimated_delivery, actual_delivery_date),
    
    CONSTRAINT fk_sample_orders_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_sample_orders_processor 
        FOREIGN KEY (processed_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample order items table (individual samples in an order)
CREATE TABLE IF NOT EXISTS sample_order_items (
    sample_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sample_order_id INT NOT NULL,
    swatch_id VARCHAR(100) NOT NULL,
    
    -- Item details
    quantity INT DEFAULT 1 COMMENT 'Usually 1 for samples',
    sample_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Fee for this specific sample',
    item_notes TEXT NULL COMMENT 'Customer notes for this specific sample',
    
    -- Fulfillment tracking
    fulfillment_status ENUM('pending', 'picked', 'packed', 'shipped') DEFAULT 'pending',
    fulfillment_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sample_order (sample_order_id),
    INDEX idx_swatch (swatch_id),
    INDEX idx_fulfillment_status (fulfillment_status),
    
    CONSTRAINT fk_sample_items_order 
        FOREIGN KEY (sample_order_id) REFERENCES sample_orders(sample_order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_sample_items_swatch 
        FOREIGN KEY (swatch_id) REFERENCES material_swatches(swatch_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample request limits table (already exists in main schema, ensuring it's here)
CREATE TABLE IF NOT EXISTS sample_request_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Limit tracking
    total_requests INT DEFAULT 0 COMMENT 'Total samples requested lifetime',
    current_period_requests INT DEFAULT 0 COMMENT 'Samples requested this period',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Limit configuration
    lifetime_limit INT DEFAULT 15 COMMENT 'Maximum samples per customer lifetime',
    period_limit INT DEFAULT 10 COMMENT 'Maximum samples per 3-month period',
    
    -- Account status
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT NULL,
    suspension_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_limits (user_id),
    INDEX idx_email_limits (email),
    INDEX idx_period_dates (period_start, period_end),
    INDEX idx_suspended (is_suspended),
    
    CONSTRAINT fk_sample_limits_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample request history table (already exists in main schema, ensuring it's here)
CREATE TABLE IF NOT EXISTS sample_request_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    
    -- Request details
    sample_count INT NOT NULL,
    request_type ENUM('standard', 'premium', 'bulk') DEFAULT 'standard',
    is_express BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status tracking
    request_status ENUM('pending', 'approved', 'denied', 'fulfilled') DEFAULT 'pending',
    denial_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_history (user_id, created_at DESC),
    INDEX idx_email_history (email, created_at DESC),
    INDEX idx_order_history (order_id),
    INDEX idx_request_type (request_type),
    INDEX idx_status (request_status),
    
    CONSTRAINT fk_sample_history_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample review and feedback table
CREATE TABLE IF NOT EXISTS sample_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    sample_order_id INT NOT NULL,
    swatch_id VARCHAR(100) NOT NULL,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Review content
    rating TINYINT NOT NULL COMMENT '1-5 star rating',
    review_title VARCHAR(255) NULL,
    review_text TEXT NULL,
    would_recommend BOOLEAN NULL,
    
    -- Review categories
    color_accuracy_rating TINYINT NULL COMMENT '1-5 rating for color accuracy',
    texture_rating TINYINT NULL COMMENT '1-5 rating for texture representation',
    quality_rating TINYINT NULL COMMENT '1-5 rating for sample quality',
    
    -- Feedback for business
    feedback_for_business TEXT NULL COMMENT 'Private feedback not shown publicly',
    
    -- Moderation
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    moderated_by INT NULL,
    moderated_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sample_order_reviews (sample_order_id),
    INDEX idx_swatch_reviews (swatch_id),
    INDEX idx_user_reviews (user_id),
    INDEX idx_email_reviews (email),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved, is_featured),
    INDEX idx_moderation (moderated_by, moderated_at),
    
    CONSTRAINT fk_sample_reviews_order 
        FOREIGN KEY (sample_order_id) REFERENCES sample_orders(sample_order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_sample_reviews_swatch 
        FOREIGN KEY (swatch_id) REFERENCES material_swatches(swatch_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_sample_reviews_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_sample_reviews_moderator 
        FOREIGN KEY (moderated_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample inventory tracking table
CREATE TABLE IF NOT EXISTS sample_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    swatch_id VARCHAR(100) NOT NULL,
    
    -- Inventory levels
    current_stock INT DEFAULT 0 COMMENT 'Current sample pieces in stock',
    reserved_stock INT DEFAULT 0 COMMENT 'Reserved for pending orders',
    available_stock INT AS (current_stock - reserved_stock) STORED,
    
    -- Reorder information
    minimum_stock_level INT DEFAULT 5 COMMENT 'Reorder threshold',
    reorder_quantity INT DEFAULT 20 COMMENT 'How many to reorder',
    supplier_id INT NULL COMMENT 'Primary supplier for this swatch',
    supplier_lead_time_days INT DEFAULT 14,
    
    -- Cost tracking
    cost_per_sample DECIMAL(8,2) DEFAULT 0.00,
    last_reorder_date DATE NULL,
    last_reorder_quantity INT NULL,
    last_reorder_cost DECIMAL(10,2) NULL,
    
    -- Location tracking
    storage_location VARCHAR(255) NULL COMMENT 'Warehouse location',
    storage_bin VARCHAR(50) NULL,
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_swatch_inventory (swatch_id),
    INDEX idx_available_stock (available_stock),
    INDEX idx_minimum_stock (minimum_stock_level, available_stock),
    INDEX idx_supplier (supplier_id),
    INDEX idx_storage_location (storage_location, storage_bin),
    
    CONSTRAINT fk_sample_inventory_swatch 
        FOREIGN KEY (swatch_id) REFERENCES material_swatches(swatch_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_sample_inventory_supplier 
        FOREIGN KEY (supplier_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SAMPLE SYSTEM VIEWS
-- =============================================================================

-- View for available samples with inventory information
CREATE OR REPLACE VIEW available_samples AS
SELECT 
    s.swatch_id,
    s.name,
    s.description,
    s.color_code,
    s.material_name,
    s.material_type,
    s.category_id,
    c.name as category_name,
    s.sample_fee,
    s.is_premium,
    s.image_url,
    s.opacity_level,
    s.light_filtering_percentage,
    s.care_instructions,
    COALESCE(si.available_stock, 0) as available_stock,
    CASE 
        WHEN COALESCE(si.available_stock, 0) > 0 THEN true 
        ELSE false 
    END as is_in_stock,
    AVG(sr.rating) as average_rating,
    COUNT(sr.review_id) as review_count
FROM material_swatches s
LEFT JOIN categories c ON s.category_id = c.category_id
LEFT JOIN sample_inventory si ON s.swatch_id = si.swatch_id
LEFT JOIN sample_reviews sr ON s.swatch_id = sr.swatch_id AND sr.is_approved = true
WHERE s.is_active = true
GROUP BY s.swatch_id, s.name, s.description, s.color_code, s.material_name, 
         s.material_type, s.category_id, c.name, s.sample_fee, s.is_premium, 
         s.image_url, s.opacity_level, s.light_filtering_percentage, 
         s.care_instructions, si.available_stock;

-- View for sample order management
CREATE OR REPLACE VIEW sample_order_management AS
SELECT 
    so.sample_order_id,
    so.order_id,
    so.email,
    so.shipping_name,
    so.status,
    so.priority,
    so.sample_count,
    so.total_amount,
    so.created_at,
    so.estimated_delivery,
    u.first_name,
    u.last_name,
    COUNT(soi.sample_item_id) as items_count,
    SUM(CASE WHEN soi.fulfillment_status = 'shipped' THEN 1 ELSE 0 END) as items_shipped,
    CASE 
        WHEN COUNT(soi.sample_item_id) = SUM(CASE WHEN soi.fulfillment_status = 'shipped' THEN 1 ELSE 0 END) 
        THEN true ELSE false 
    END as fully_shipped
FROM sample_orders so
LEFT JOIN users u ON so.user_id = u.user_id
LEFT JOIN sample_order_items soi ON so.sample_order_id = soi.sample_order_id
GROUP BY so.sample_order_id, so.order_id, so.email, so.shipping_name, 
         so.status, so.priority, so.sample_count, so.total_amount, 
         so.created_at, so.estimated_delivery, u.first_name, u.last_name;

-- =============================================================================
-- SAMPLE DATA AND DEFAULTS
-- =============================================================================

-- Insert some sample swatches for testing
INSERT IGNORE INTO material_swatches (
    swatch_id, name, description, color_code, material_name, material_type,
    category_id, sample_fee, is_premium, opacity_level, light_filtering_percentage,
    fabric_content, care_instructions, image_url
) VALUES 
-- Blinds samples
('SW-001-WHT-ALU', 'Pure White Aluminum', 'Classic white aluminum slats with smooth finish', '#FFFFFF', 'Aluminum', 'Metal', 1, 0.00, false, 'semi-opaque', 75.0, '100% Aluminum', 'Wipe clean with damp cloth', '/images/samples/white-aluminum.jpg'),
('SW-002-BLK-ALU', 'Charcoal Black Aluminum', 'Modern black aluminum with matte finish', '#2C2C2C', 'Aluminum', 'Metal', 1, 0.00, false, 'semi-opaque', 80.0, '100% Aluminum', 'Wipe clean with damp cloth', '/images/samples/black-aluminum.jpg'),
('SW-003-WD-FAU', 'Natural Oak Faux Wood', 'Realistic oak wood grain pattern', '#D2B48C', 'Faux Wood', 'Composite', 1, 2.99, false, 'semi-opaque', 70.0, 'PVC with wood grain finish', 'Dust regularly, wipe with damp cloth', '/images/samples/oak-faux-wood.jpg'),

-- Curtain samples
('SW-101-LIN-NAT', 'Natural Linen Weave', 'Elegant natural linen with loose weave', '#F5F5DC', 'Linen', 'Natural Fiber', 2, 3.99, true, 'semi-sheer', 30.0, '100% Linen', 'Dry clean only', '/images/samples/natural-linen.jpg'),
('SW-102-SLK-CRM', 'Cream Silk Dupioni', 'Luxurious silk with subtle sheen', '#FFF8DC', 'Silk', 'Natural Fiber', 2, 5.99, true, 'semi-opaque', 60.0, '100% Silk', 'Dry clean only', '/images/samples/cream-silk.jpg'),
('SW-103-COT-NVY', 'Navy Cotton Canvas', 'Heavy-duty cotton in rich navy blue', '#000080', 'Cotton', 'Natural Fiber', 2, 2.99, false, 'opaque', 90.0, '100% Cotton', 'Machine wash cold, hang dry', '/images/samples/navy-cotton.jpg'),

-- Shade samples
('SW-201-CEL-WHT', 'White Cellular Honeycomb', 'Energy-efficient cellular shade material', '#FAFAFA', 'Cellular Fabric', 'Synthetic', 3, 1.99, false, 'semi-opaque', 65.0, 'Polyester honeycomb', 'Vacuum or dust regularly', '/images/samples/white-cellular.jpg'),
('SW-202-ROM-BEI', 'Beige Roman Weave', 'Classic roman shade with woven texture', '#F5DEB3', 'Roman Weave', 'Natural Blend', 3, 3.99, false, 'semi-opaque', 55.0, '70% Cotton, 30% Polyester', 'Spot clean only', '/images/samples/beige-roman.jpg');

-- Initialize sample inventory for the swatches
INSERT IGNORE INTO sample_inventory (
    swatch_id, current_stock, minimum_stock_level, reorder_quantity, cost_per_sample, storage_location
) VALUES 
('SW-001-WHT-ALU', 25, 5, 20, 0.50, 'Warehouse A - Bin A1'),
('SW-002-BLK-ALU', 30, 5, 20, 0.50, 'Warehouse A - Bin A2'),
('SW-003-WD-FAU', 20, 5, 15, 1.25, 'Warehouse A - Bin B1'),
('SW-101-LIN-NAT', 15, 3, 10, 2.50, 'Warehouse B - Bin C1'),
('SW-102-SLK-CRM', 8, 3, 10, 3.75, 'Warehouse B - Bin C2'),
('SW-103-COT-NVY', 22, 5, 15, 1.50, 'Warehouse B - Bin C3'),
('SW-201-CEL-WHT', 35, 8, 25, 0.75, 'Warehouse A - Bin D1'),
('SW-202-ROM-BEI', 18, 5, 15, 2.00, 'Warehouse A - Bin D2');

-- =============================================================================
-- TRIGGERS FOR SAMPLE MANAGEMENT
-- =============================================================================

DELIMITER $$

-- Update inventory when sample orders are created
CREATE TRIGGER IF NOT EXISTS reserve_sample_inventory
    AFTER INSERT ON sample_order_items
    FOR EACH ROW
BEGIN
    UPDATE sample_inventory 
    SET reserved_stock = reserved_stock + NEW.quantity
    WHERE swatch_id = NEW.swatch_id;
END$$

-- Release inventory when orders are cancelled
CREATE TRIGGER IF NOT EXISTS release_sample_inventory
    AFTER UPDATE ON sample_orders
    FOR EACH ROW
BEGIN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE sample_inventory si
        JOIN sample_order_items soi ON si.swatch_id = soi.swatch_id
        SET si.reserved_stock = si.reserved_stock - soi.quantity
        WHERE soi.sample_order_id = NEW.sample_order_id;
    END IF;
END$$

-- Update inventory when samples are shipped
CREATE TRIGGER IF NOT EXISTS ship_sample_inventory
    AFTER UPDATE ON sample_order_items
    FOR EACH ROW
BEGIN
    IF OLD.fulfillment_status != 'shipped' AND NEW.fulfillment_status = 'shipped' THEN
        UPDATE sample_inventory 
        SET current_stock = current_stock - NEW.quantity,
            reserved_stock = reserved_stock - NEW.quantity
        WHERE swatch_id = NEW.swatch_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Additional indexes for optimal performance
CREATE INDEX idx_swatches_search ON material_swatches(name, material_name, material_type);
CREATE INDEX idx_swatches_filtering ON material_swatches(category_id, is_available, is_premium, opacity_level);
CREATE INDEX idx_orders_fulfillment ON sample_orders(status, priority, created_at);
CREATE INDEX idx_orders_customer_lookup ON sample_orders(email, user_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_sample_items_fulfillment ON sample_order_items(sample_order_id, fulfillment_status);
CREATE INDEX idx_reviews_display ON sample_reviews(swatch_id, is_approved, rating DESC);
CREATE INDEX idx_inventory_alerts ON sample_inventory(available_stock, minimum_stock_level);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'Sample Management System tables created successfully!' as Status;