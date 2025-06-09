-- Complete Blinds Commerce Database Schema
-- Generated on: 2025-06-08
-- This file combines all migration files in a logical order for complete database setup

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Use the blindscommerce database
USE blindscommerce;

-- Disable foreign key checks during migrations
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_order_status_update;
DROP TRIGGER IF EXISTS update_product_order_count;
DROP TRIGGER IF EXISTS cleanup_recently_viewed;
DROP TRIGGER IF EXISTS cleanup_old_recently_viewed;

-- =============================================================================
-- CORE FOUNDATION TABLES (Required for all other tables)
-- =============================================================================

-- Create users table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('customer', 'admin', 'vendor', 'installer', 'sales') DEFAULT 'customer',
    is_admin TINYINT(1) DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    is_verified TINYINT(1) DEFAULT '0',
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_listing_active TINYINT(1) DEFAULT '1',
    PRIMARY KEY (user_id),
    UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create categories table (referenced by products)
CREATE TABLE IF NOT EXISTS categories (
    category_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Essential orders table for eligibility checking
CREATE TABLE IF NOT EXISTS orders (
    order_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'completed') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    KEY user_id (user_id),
    KEY order_status (order_status),
    CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor info table for file management
CREATE TABLE IF NOT EXISTS vendor_info (
    vendor_info_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_license VARCHAR(100) DEFAULT NULL,
    tax_id VARCHAR(50) DEFAULT NULL,
    business_address TEXT DEFAULT NULL,
    business_phone VARCHAR(20) DEFAULT NULL,
    business_email VARCHAR(255) NOT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    is_verified TINYINT(1) DEFAULT '0',
    verification_status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT '15.00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_info_id),
    KEY user_id (user_id),
    KEY is_active (is_active),
    CONSTRAINT vendor_info_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- COMMERCIAL BULK ORDER SYSTEM TABLES
-- =============================================================================

-- Table for storing customer bulk order uploads
CREATE TABLE IF NOT EXISTS customer_bulk_uploads (
    upload_id VARCHAR(100) PRIMARY KEY,
    customer_id INT NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    invalid_rows INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NULL,
    status ENUM('uploaded', 'validating', 'valid', 'invalid', 'processed', 'rejected') NOT NULL DEFAULT 'uploaded',
    validation_errors JSON NULL,
    validation_warnings JSON NULL,
    processing_notes TEXT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_uploads (customer_id, created_at DESC),
    INDEX idx_upload_status (status),
    INDEX idx_template_uploads (template_id),
    INDEX idx_file_hash (file_hash),
    
    CONSTRAINT fk_bulk_upload_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing bulk order line items (parsed from CSV)
CREATE TABLE IF NOT EXISTS bulk_order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id VARCHAR(100) NOT NULL,
    csv_row_number INT NOT NULL,
    room_name VARCHAR(100) NULL,
    blind_type VARCHAR(50) NULL,
    width_inches DECIMAL(6,2) NULL,
    height_inches DECIMAL(6,2) NULL,
    color VARCHAR(50) NULL,
    mount_type VARCHAR(30) NULL,
    quantity INT NULL,
    unit_price DECIMAL(8,2) NULL,
    line_total DECIMAL(10,2) NULL,
    installation_address TEXT NULL,
    preferred_install_date DATE NULL,
    room_description TEXT NULL,
    special_instructions TEXT NULL,
    contact_person VARCHAR(100) NULL,
    contact_phone VARCHAR(20) NULL,
    urgency_level ENUM('Low', 'Standard', 'High', 'Urgent') DEFAULT 'Standard',
    budget_code VARCHAR(50) NULL,
    building_floor VARCHAR(20) NULL,
    window_orientation VARCHAR(20) NULL,
    
    -- Office renovation specific fields
    project_name VARCHAR(100) NULL,
    room_type VARCHAR(50) NULL,
    room_identifier VARCHAR(20) NULL,
    color_scheme VARCHAR(50) NULL,
    building_address TEXT NULL,
    target_completion_date DATE NULL,
    room_function TEXT NULL,
    privacy_level ENUM('Low', 'Medium', 'High', 'Maximum') NULL,
    light_control_preference ENUM('Light Filtering', 'Room Darkening', 'Blackout', 'Sheer') NULL,
    energy_efficiency_rating VARCHAR(30) NULL,
    maintenance_requirements TEXT NULL,
    warranty_period VARCHAR(20) NULL,
    installation_priority ENUM('Low', 'Medium', 'High', 'Critical') NULL,
    budget_allocation VARCHAR(50) NULL,
    
    -- Status and validation
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    validation_errors JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_upload_items (upload_id),
    INDEX idx_item_validation (is_valid),
    INDEX idx_blind_type (blind_type),
    INDEX idx_room_type (room_type),
    
    CONSTRAINT fk_bulk_item_upload 
        FOREIGN KEY (upload_id) REFERENCES customer_bulk_uploads(upload_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for bulk order processing workflow
CREATE TABLE IF NOT EXISTS bulk_order_processing (
    process_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id VARCHAR(100) NOT NULL,
    customer_id INT NOT NULL,
    processing_stage ENUM('pending', 'pricing', 'review', 'approved', 'manufacturing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    assigned_processor INT NULL,
    estimated_completion_date DATE NULL,
    actual_completion_date DATE NULL,
    total_estimated_amount DECIMAL(12,2) NULL,
    final_amount DECIMAL(12,2) NULL,
    bulk_discount_percentage DECIMAL(5,2) NULL DEFAULT 0.00,
    bulk_discount_amount DECIMAL(10,2) NULL DEFAULT 0.00,
    processing_notes TEXT NULL,
    customer_notes TEXT NULL,
    approval_notes TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_processing_stage (processing_stage),
    INDEX idx_assigned_processor (assigned_processor),
    INDEX idx_customer_processing (customer_id, processing_stage),
    INDEX idx_completion_dates (estimated_completion_date, actual_completion_date),
    
    CONSTRAINT fk_processing_upload 
        FOREIGN KEY (upload_id) REFERENCES customer_bulk_uploads(upload_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_processing_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_processing_processor 
        FOREIGN KEY (assigned_processor) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for bulk order communication and updates
CREATE TABLE IF NOT EXISTS bulk_order_communications (
    communication_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id VARCHAR(100) NOT NULL,
    customer_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('customer', 'processor', 'admin') NOT NULL,
    message_type ENUM('question', 'update', 'approval_request', 'modification', 'notification') NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    requires_response BOOLEAN NOT NULL DEFAULT FALSE,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_upload_communications (upload_id, created_at DESC),
    INDEX idx_customer_communications (customer_id, created_at DESC),
    INDEX idx_sender_communications (sender_id),
    INDEX idx_response_required (requires_response, responded_at),
    
    CONSTRAINT fk_comm_upload 
        FOREIGN KEY (upload_id) REFERENCES customer_bulk_uploads(upload_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_comm_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_comm_sender 
        FOREIGN KEY (sender_id) REFERENCES users(user_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for tracking bulk order pricing history and adjustments
CREATE TABLE IF NOT EXISTS bulk_order_pricing_history (
    pricing_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id VARCHAR(100) NOT NULL,
    pricing_version INT NOT NULL DEFAULT 1,
    total_items INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    bulk_discount_tier VARCHAR(20) NULL,
    bulk_discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    bulk_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    installation_fee DECIMAL(10,2) NULL DEFAULT 0.00,
    rush_order_fee DECIMAL(10,2) NULL DEFAULT 0.00,
    shipping_fee DECIMAL(10,2) NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NULL DEFAULT 0.00,
    final_total DECIMAL(12,2) NOT NULL,
    pricing_notes TEXT NULL,
    created_by INT NOT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_upload_pricing (upload_id, pricing_version DESC),
    INDEX idx_current_pricing (upload_id, is_current),
    INDEX idx_pricing_approval (approved_by, approved_at),
    
    CONSTRAINT fk_pricing_upload 
        FOREIGN KEY (upload_id) REFERENCES customer_bulk_uploads(upload_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_pricing_creator 
        FOREIGN KEY (created_by) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_pricing_approver 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- VENDOR FILE MANAGEMENT SYSTEM
-- =============================================================================

-- Vendor files table for secure file management
CREATE TABLE IF NOT EXISTS vendor_files (
    file_id VARCHAR(100) PRIMARY KEY,
    vendor_id INT NOT NULL COMMENT 'References vendor_info.vendor_info_id',
    original_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    upload_type ENUM('productImages', 'productVideos', 'csvFiles', 'documents') NOT NULL,
    file_size BIGINT NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    width INT NULL,
    height INT NULL,
    scan_result ENUM('clean', 'suspicious', 'malicious') NOT NULL DEFAULT 'clean',
    approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    
    INDEX idx_vendor_files (vendor_id, category),
    INDEX idx_file_hash (file_hash),
    INDEX idx_upload_type (upload_type),
    INDEX idx_scan_result (scan_result),
    INDEX idx_approval_status (approval_status),
    
    CONSTRAINT fk_vendor_files_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECURITY AND AUDIT TABLES
-- =============================================================================

-- Customer file uploads tracking
CREATE TABLE IF NOT EXISTS customer_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    file_id VARCHAR(100) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    upload_type ENUM('profileAvatar', 'roomPhotos', 'measurementDocuments') NOT NULL,
    description TEXT NULL,
    file_size INT NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA256 hash for integrity
    scan_result ENUM('clean', 'suspicious', 'malicious') NOT NULL DEFAULT 'clean',
    width INT NULL, -- For images
    height INT NULL, -- For images
    processing_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
    metadata JSON NULL, -- Additional file metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_file_id (file_id),
    INDEX idx_upload_type (upload_type),
    INDEX idx_scan_result (scan_result),
    INDEX idx_processing_status (processing_status),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    
    CONSTRAINT fk_customer_files_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_files_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor upload activity logs (security audit trail)
CREATE TABLE IF NOT EXISTS vendor_upload_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    user_id INT NOT NULL,
    upload_type VARCHAR(50) NOT NULL,
    files_uploaded INT NOT NULL DEFAULT 0,
    files_rejected INT NOT NULL DEFAULT 0,
    client_ip VARCHAR(45) NOT NULL, -- Support IPv6
    user_agent TEXT NULL,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_user_id (user_id),
    INDEX idx_client_ip (client_ip),
    INDEX idx_created_at (created_at),
    INDEX idx_upload_type (upload_type),
    
    CONSTRAINT fk_vendor_upload_logs_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_upload_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer upload activity logs (security audit trail)
CREATE TABLE IF NOT EXISTS customer_upload_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    upload_type VARCHAR(50) NOT NULL,
    files_uploaded INT NOT NULL DEFAULT 0,
    files_rejected INT NOT NULL DEFAULT 0,
    client_ip VARCHAR(45) NOT NULL, -- Support IPv6
    user_agent TEXT NULL,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_client_ip (client_ip),
    INDEX idx_created_at (created_at),
    INDEX idx_upload_type (upload_type),
    
    CONSTRAINT fk_customer_upload_logs_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security incidents tracking (for malicious file uploads)
CREATE TABLE IF NOT EXISTS upload_security_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_type ENUM('vendor', 'customer', 'admin', 'guest') NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    incident_type ENUM('malicious_content', 'suspicious_pattern', 'quota_exceeded', 'invalid_format', 'oversized_file') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    details JSON NULL, -- Detailed incident information
    client_ip VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    blocked BOOLEAN DEFAULT TRUE, -- Whether the upload was blocked
    resolved BOOLEAN DEFAULT FALSE, -- Whether incident was resolved
    resolved_by INT NULL, -- Admin who resolved it
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_user_type (user_type),
    INDEX idx_incident_type (incident_type),
    INDEX idx_severity (severity),
    INDEX idx_client_ip (client_ip),
    INDEX idx_blocked (blocked),
    INDEX idx_resolved (resolved),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT fk_upload_security_incidents_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_upload_security_incidents_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System upload configuration (dynamic security settings)
CREATE TABLE IF NOT EXISTS upload_security_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'integer', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active),
    
    CONSTRAINT fk_upload_security_config_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================

-- Indexes for bulk order performance optimization (using CREATE INDEX without IF NOT EXISTS for compatibility)
CREATE INDEX idx_bulk_upload_status_date ON customer_bulk_uploads(status, created_at DESC);
CREATE INDEX idx_bulk_items_product_search ON bulk_order_items(blind_type, width_inches, height_inches);
CREATE INDEX idx_processing_workflow ON bulk_order_processing(processing_stage, created_at DESC);

-- Composite indexes for file management
CREATE INDEX idx_vendor_files_composite ON vendor_files(vendor_id, upload_type, created_at);
CREATE INDEX idx_customer_files_composite ON customer_files(customer_id, upload_type, created_at);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for bulk order summary
CREATE OR REPLACE VIEW bulk_order_summary AS
SELECT 
    cbu.upload_id,
    cbu.customer_id,
    u.first_name,
    u.last_name,
    u.email,
    cbu.template_id,
    cbu.file_name,
    cbu.status AS upload_status,
    cbu.row_count,
    cbu.valid_rows,
    cbu.invalid_rows,
    cbu.total_amount,
    cbu.created_at AS upload_date,
    bop.processing_stage,
    bop.assigned_processor,
    bop.estimated_completion_date,
    bop.final_amount,
    bop.bulk_discount_percentage,
    COUNT(DISTINCT boi.item_id) AS total_line_items,
    SUM(CASE WHEN boi.is_valid = TRUE THEN boi.quantity ELSE 0 END) AS total_quantity
FROM customer_bulk_uploads cbu
LEFT JOIN users u ON cbu.customer_id = u.user_id
LEFT JOIN bulk_order_processing bop ON cbu.upload_id = bop.upload_id
LEFT JOIN bulk_order_items boi ON cbu.upload_id = boi.upload_id
GROUP BY cbu.upload_id, cbu.customer_id, u.first_name, u.last_name, u.email, 
         cbu.template_id, cbu.file_name, cbu.status, cbu.row_count, cbu.valid_rows, 
         cbu.invalid_rows, cbu.total_amount, cbu.created_at, bop.processing_stage, 
         bop.assigned_processor, bop.estimated_completion_date, bop.final_amount, 
         bop.bulk_discount_percentage;

-- View for active vendor files (not deleted)
CREATE OR REPLACE VIEW active_vendor_files AS
SELECT vf.*, vi.business_name, u.email as vendor_email
FROM vendor_files vf
JOIN vendor_info vi ON vf.vendor_id = vi.vendor_info_id
JOIN users u ON vi.user_id = u.user_id
WHERE vf.deleted_at IS NULL;

-- View for active customer files (not deleted)
CREATE OR REPLACE VIEW active_customer_files AS
SELECT cf.*, u.email as customer_email, u.first_name, u.last_name
FROM customer_files cf
JOIN users u ON cf.customer_id = u.user_id
WHERE cf.deleted_at IS NULL;

-- View for security dashboard (recent incidents)
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    usi.incident_type,
    usi.severity,
    usi.user_type,
    COUNT(*) as incident_count,
    MAX(usi.created_at) as last_incident,
    SUM(CASE WHEN usi.blocked THEN 1 ELSE 0 END) as blocked_count
FROM upload_security_incidents usi
WHERE usi.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY usi.incident_type, usi.severity, usi.user_type;

-- =============================================================================
-- DEFAULT CONFIGURATION DATA
-- =============================================================================

-- Insert default security configuration
INSERT IGNORE INTO upload_security_config (config_key, config_value, config_type, description) VALUES
('max_file_size_vendor', '10485760', 'integer', 'Maximum file size for vendor uploads in bytes (10MB)'),
('max_file_size_customer', '5242880', 'integer', 'Maximum file size for customer uploads in bytes (5MB)'),
('allowed_image_types', '["image/jpeg", "image/png", "image/webp"]', 'json', 'Allowed image MIME types'),
('allowed_document_types', '["application/pdf"]', 'json', 'Allowed document MIME types'),
('daily_upload_limit_customer', '20', 'integer', 'Daily upload limit for customers'),
('daily_upload_limit_vendor', '100', 'integer', 'Daily upload limit for vendors'),
('scan_uploads_for_malware', 'true', 'boolean', 'Whether to scan uploads for malware'),
('quarantine_suspicious_files', 'true', 'boolean', 'Whether to quarantine suspicious files'),
('auto_approve_vendor_images', 'true', 'boolean', 'Whether to auto-approve vendor product images'),
('require_manual_review_documents', 'true', 'boolean', 'Whether business documents require manual review');

-- =============================================================================
-- CORE CART AND PAYMENT SYSTEM TABLES
-- =============================================================================

-- Products table (referenced by cart_items)
CREATE TABLE IF NOT EXISTS products (
    product_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    sale_price DECIMAL(10,2) NULL,
    sku VARCHAR(100) NULL,
    category_id INT NULL,
    vendor_id INT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    stock_quantity INT DEFAULT '0',
    weight DECIMAL(8,2) DEFAULT NULL,
    dimensions VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    KEY category_id (category_id),
    KEY vendor_id (vendor_id),
    KEY is_active (is_active),
    KEY sku (sku),
    CONSTRAINT products_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Main carts table
CREATE TABLE IF NOT EXISTS carts (
    cart_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    status ENUM('active', 'abandoned', 'converted', 'expired') DEFAULT 'active',
    total_amount DECIMAL(10,2) DEFAULT '0.00',
    tax_amount DECIMAL(10,2) DEFAULT '0.00',
    shipping_amount DECIMAL(10,2) DEFAULT '0.00',
    discount_amount DECIMAL(10,2) DEFAULT '0.00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    PRIMARY KEY (cart_id),
    KEY user_id (user_id),
    KEY session_id (session_id),
    KEY status (status),
    KEY updated_at (updated_at),
    CONSTRAINT carts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT NOT NULL AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT '1',
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    configuration JSON NULL COMMENT 'Product customization options',
    saved_for_later BOOLEAN DEFAULT FALSE,
    price_at_add DECIMAL(10,2) NULL COMMENT 'Price when item was added to track changes',
    expiry_date TIMESTAMP NULL COMMENT 'When cart item expires',
    notes TEXT NULL COMMENT 'Customer notes for this item',
    is_gift BOOLEAN DEFAULT FALSE,
    gift_message TEXT NULL,
    scheduled_delivery_date DATE NULL,
    installation_requested BOOLEAN DEFAULT FALSE,
    sample_requested BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_item_id),
    KEY cart_id (cart_id),
    KEY product_id (product_id),
    KEY updated_at (updated_at),
    KEY saved_for_later (saved_for_later),
    CONSTRAINT cart_items_ibfk_1 FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT cart_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addresses table (for billing/shipping)
CREATE TABLE IF NOT EXISTS addresses (
    address_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type ENUM('billing', 'shipping', 'both') DEFAULT 'shipping',
    is_default TINYINT(1) DEFAULT '0',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255) NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    KEY user_id (user_id),
    KEY address_type (address_type),
    KEY is_default (is_default),
    CONSTRAINT addresses_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved payment methods table
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    payment_method_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_type ENUM('credit_card', 'debit_card', 'bank_account', 'paypal', 'stripe') NOT NULL,
    provider VARCHAR(50) DEFAULT 'stripe',
    external_id VARCHAR(255) NULL,
    payment_data JSON NULL,
    is_default TINYINT(1) DEFAULT '0',
    card_brand VARCHAR(50) NULL COMMENT 'visa, mastercard, amex, etc.',
    last_four_digits VARCHAR(4) NULL,
    expiry_month INT NULL,
    expiry_year INT NULL,
    cardholder_name VARCHAR(255) NULL,
    billing_address_id INT NULL,
    stripe_payment_method_id VARCHAR(255) NULL,
    paypal_account_id VARCHAR(255) NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_method_id),
    KEY user_id (user_id),
    KEY is_default (is_default),
    KEY is_active (is_active),
    KEY payment_type (payment_type),
    KEY provider_external (provider, external_id),
    CONSTRAINT saved_payment_methods_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT saved_payment_methods_ibfk_2 FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NULL,
    user_id INT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'klarna', 'afterpay', 'affirm', 'apple_pay', 'google_pay') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    transaction_id VARCHAR(255) NULL,
    gateway_response JSON NULL,
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY order_id (order_id),
    KEY user_id (user_id),
    KEY payment_status (payment_status),
    KEY transaction_id (transaction_id),
    CONSTRAINT payments_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    CONSTRAINT payments_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment intents table for tracking payment provider sessions
CREATE TABLE IF NOT EXISTS payment_intents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    provider ENUM('stripe', 'paypal', 'klarna', 'afterpay', 'affirm') NOT NULL,
    provider_order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'expired') DEFAULT 'pending',
    captured_amount DECIMAL(10,2) NULL,
    order_data JSON NULL,
    processor_response JSON NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider_order (provider, provider_order_id),
    INDEX idx_user_provider (user_id, provider),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment method configurations table for storing provider settings
CREATE TABLE IF NOT EXISTS payment_method_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL,
    method_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0.01,
    max_amount DECIMAL(10,2) DEFAULT 999999.99,
    supported_currencies JSON NULL,
    supported_countries JSON NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    configuration JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_method (provider, method_id),
    INDEX idx_active_methods (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Advanced cart features tables
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
        FOREIGN KEY (saved_cart_id) REFERENCES saved_carts(saved_cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_cart_items_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
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
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_abandoned_carts_cart 
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
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
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_price_alerts_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
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
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_alerts_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
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
    
    UNIQUE KEY unique_product_pair (product_a_id, product_b_id),
    
    CONSTRAINT fk_product_associations_a 
        FOREIGN KEY (product_a_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_product_associations_b 
        FOREIGN KEY (product_b_id) REFERENCES products(product_id) ON DELETE CASCADE
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
        FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE
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
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_draft_configurations_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
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
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_cart_analytics_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CART AND PAYMENT PERFORMANCE INDEXES
-- =============================================================================

-- Cart performance indexes
CREATE INDEX idx_carts_user_status ON carts(user_id, status);
CREATE INDEX idx_carts_session_active ON carts(session_id, status);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX idx_cart_items_saved_for_later ON cart_items(saved_for_later, updated_at);
CREATE INDEX idx_cart_items_expiry ON cart_items(expiry_date);
CREATE INDEX idx_cart_items_price_change ON cart_items(price_at_add, updated_at);

-- Payment indexes
CREATE INDEX idx_payments_user_status ON payments(user_id, payment_status);
CREATE INDEX idx_saved_payments_user_active ON saved_payment_methods(user_id, is_active);
CREATE INDEX idx_saved_payment_provider ON saved_payment_methods(user_id, provider);

-- Address indexes
CREATE INDEX idx_addresses_user_type ON addresses(user_id, address_type);

-- =============================================================================
-- CART TRIGGERS FOR DATA CONSISTENCY
-- =============================================================================

-- Update cart totals when cart items change
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_cart_totals
    AFTER INSERT ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM cart_items 
        WHERE cart_id = NEW.cart_id AND saved_for_later = FALSE
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE cart_id = NEW.cart_id;
END$$

CREATE TRIGGER IF NOT EXISTS update_cart_totals_on_update
    AFTER UPDATE ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM cart_items 
        WHERE cart_id = NEW.cart_id AND saved_for_later = FALSE
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE cart_id = NEW.cart_id;
END$$

CREATE TRIGGER IF NOT EXISTS update_cart_totals_on_delete
    AFTER DELETE ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM cart_items 
        WHERE cart_id = OLD.cart_id AND saved_for_later = FALSE
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE cart_id = OLD.cart_id;
END$$
DELIMITER ;

-- =============================================================================
-- CART AND PAYMENT VIEWS
-- =============================================================================

-- Active cart summary view
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

-- =============================================================================
-- DEFAULT PAYMENT CONFIGURATION DATA
-- =============================================================================

-- Insert default payment method configurations
INSERT IGNORE INTO payment_method_configurations (
    provider, method_id, display_name, description, 
    min_amount, max_amount, supported_currencies, supported_countries,
    is_active, sort_order, configuration
) VALUES 
-- Stripe methods
('stripe', 'card', 'Credit/Debit Card', 'Visa, Mastercard, American Express, Discover', 
 0.50, 999999.99, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
 true, 1, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant"}'),

('stripe', 'apple_pay', 'Apple Pay', 'Pay securely with Touch ID or Face ID', 
 0.50, 999999.99, '["USD", "EUR", "GBP", "CAD"]', '["US", "CA", "GB", "AU"]',
 true, 2, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant", "device_requirements": ["iOS", "macOS", "Safari"]}'),

-- PayPal methods
('paypal', 'paypal', 'PayPal', 'Pay with your PayPal account or PayPal Credit', 
 0.01, 10000.00, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
 true, 5, '{"fee_percentage": 3.49, "fee_fixed": 0.49, "processing_time": "instant"}'),

-- BNPL methods
('klarna', 'klarna', 'Klarna', 'Pay in 4 interest-free installments', 
 1.00, 10000.00, '["USD", "EUR", "GBP", "SEK"]', '["US", "CA", "GB", "SE", "DE", "AT"]',
 true, 6, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),

('afterpay', 'afterpay', 'Afterpay', 'Pay in 4 installments, always interest-free', 
 1.00, 4000.00, '["USD", "AUD", "CAD", "GBP"]', '["US", "CA", "AU", "GB"]',
 true, 7, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),

('affirm', 'affirm', 'Affirm', 'Monthly payments as low as 0% APR', 
 50.00, 17500.00, '["USD", "CAD"]', '["US", "CA"]',
 true, 8, '{"installments": [3, 6, 12, 18, 24, 36], "installment_frequency": "monthly", "interest_rate_range": [0, 36], "credit_check": "soft", "prequalification": true}')

ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    min_amount = VALUES(min_amount),
    max_amount = VALUES(max_amount),
    supported_currencies = VALUES(supported_currencies),
    supported_countries = VALUES(supported_countries),
    configuration = VALUES(configuration),
    updated_at = CURRENT_TIMESTAMP;

-- Create payment_analytics table for tracking payment method performance
CREATE TABLE IF NOT EXISTS payment_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    total_transactions INT DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    successful_transactions INT DEFAULT 0,
    failed_transactions INT DEFAULT 0,
    average_amount DECIMAL(10,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_method (date, payment_method, provider),
    INDEX idx_date_provider (date, provider),
    INDEX idx_method_performance (payment_method, successful_transactions)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create payment_disputes table for handling chargebacks and disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    dispute_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    dispute_type ENUM('chargeback', 'inquiry', 'retrieval_request', 'pre_arbitration') NOT NULL,
    status ENUM('open', 'under_review', 'accepted', 'disputed', 'won', 'lost') DEFAULT 'open',
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    reason_code VARCHAR(50) NULL,
    reason_description TEXT NULL,
    evidence_due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dispute (provider, dispute_id),
    INDEX idx_status_due_date (status, evidence_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create payment_refunds table for tracking refunds across all providers
CREATE TABLE IF NOT EXISTS payment_refunds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    refund_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    reason ENUM('requested_by_customer', 'duplicate', 'fraudulent', 'other') DEFAULT 'requested_by_customer',
    reason_description TEXT NULL,
    status ENUM('pending', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    processor_response JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_refund (provider, refund_id),
    INDEX idx_payment_refunds (payment_id),
    INDEX idx_status_date (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ADDITIONAL CART VIEWS AND OPTIMIZATIONS
-- =============================================================================

-- Create view for cart recommendations
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

-- =============================================================================
-- VENDOR-MANAGED PRODUCT CONFIGURATION SYSTEM
-- =============================================================================

-- Product categories junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    is_primary TINYINT(1) DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, category_id),
    KEY product_id (product_id),
    KEY category_id (category_id),
    CONSTRAINT product_categories_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT product_categories_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Brands table (for product branding)
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500) DEFAULT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (brand_id),
    UNIQUE KEY slug (slug),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Features table (for product features)
CREATE TABLE IF NOT EXISTS features (
    feature_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feature_id),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    is_primary TINYINT(1) DEFAULT '0',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    KEY product_id (product_id),
    KEY is_primary (is_primary),
    KEY display_order (display_order),
    CONSTRAINT product_images_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product options table (for configurator options like Mount Type, Control Type, etc.)
CREATE TABLE IF NOT EXISTS product_options (
    option_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    option_type ENUM('dropdown', 'radio', 'checkbox', 'text', 'number', 'color', 'dimension') NOT NULL,
    is_required TINYINT(1) DEFAULT '0',
    display_order INT DEFAULT '0',
    help_text TEXT DEFAULT NULL,
    validation_rules JSON DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (option_id),
    KEY product_id (product_id),
    KEY display_order (display_order),
    CONSTRAINT product_options_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product option values table (for option choices like "Inside Mount", "Outside Mount", etc.)
CREATE TABLE IF NOT EXISTS product_option_values (
    value_id INT NOT NULL AUTO_INCREMENT,
    option_id INT NOT NULL,
    value_name VARCHAR(255) NOT NULL,
    value_data VARCHAR(255) DEFAULT NULL,
    price_modifier DECIMAL(10,2) DEFAULT '0.00',
    display_order INT DEFAULT '0',
    is_default TINYINT(1) DEFAULT '0',
    is_available TINYINT(1) DEFAULT '1',
    image_url VARCHAR(500) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (value_id),
    KEY option_id (option_id),
    KEY display_order (display_order),
    KEY is_available (is_available),
    CONSTRAINT product_option_values_ibfk_1 FOREIGN KEY (option_id) REFERENCES product_options (option_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor products table (links products to vendors)
CREATE TABLE IF NOT EXISTS vendor_products (
    vendor_product_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_sku VARCHAR(100) DEFAULT NULL,
    vendor_price DECIMAL(10,2) DEFAULT NULL,
    quantity_available INT DEFAULT '0',
    minimum_order_qty INT DEFAULT '1',
    lead_time_days INT DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    is_featured TINYINT(1) DEFAULT '0',
    vendor_description TEXT DEFAULT NULL,
    vendor_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_product_id),
    UNIQUE KEY vendor_product (vendor_id, product_id),
    KEY vendor_id (vendor_id),
    KEY product_id (product_id),
    KEY vendor_sku (vendor_sku),
    KEY is_active (is_active),
    CONSTRAINT vendor_products_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE,
    CONSTRAINT vendor_products_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product variants table (for different combinations of options)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    variant_options JSON NOT NULL COMMENT 'Stores option_id:value_id pairs',
    price_adjustment DECIMAL(10,2) DEFAULT '0.00',
    stock_quantity INT DEFAULT '0',
    weight DECIMAL(8,2) DEFAULT NULL,
    dimensions JSON DEFAULT NULL COMMENT 'Stores width, height, depth',
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_id),
    UNIQUE KEY sku (sku),
    KEY product_id (product_id),
    KEY is_active (is_active),
    CONSTRAINT product_variants_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product features junction table
CREATE TABLE IF NOT EXISTS product_features (
    product_id INT NOT NULL,
    feature_id INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, feature_id),
    KEY product_id (product_id),
    KEY feature_id (feature_id),
    CONSTRAINT product_features_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT product_features_ibfk_2 FOREIGN KEY (feature_id) REFERENCES features (feature_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product colors table (vendor-configurable colors)
CREATE TABLE IF NOT EXISTS product_colors (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(7) DEFAULT NULL,
    color_family VARCHAR(50) DEFAULT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT '0.00',
    is_available TINYINT(1) DEFAULT '1',
    swatch_image VARCHAR(500) DEFAULT NULL,
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY color_name (color_name),
    KEY color_family (color_family),
    KEY is_available (is_available),
    CONSTRAINT product_colors_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product materials table (vendor-configurable materials)
CREATE TABLE IF NOT EXISTS product_materials (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    material_type VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT '0.00',
    durability_rating TINYINT DEFAULT NULL,
    maintenance_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_eco_friendly TINYINT(1) DEFAULT '0',
    is_available TINYINT(1) DEFAULT '1',
    sample_available TINYINT(1) DEFAULT '1',
    texture_image VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY material_type (material_type),
    KEY material_name (material_name),
    KEY is_available (is_available),
    CONSTRAINT product_materials_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product rooms table (room recommendations)
CREATE TABLE IF NOT EXISTS product_rooms (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    suitability_score TINYINT DEFAULT '5',
    special_considerations TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY room_type (room_type),
    CONSTRAINT product_rooms_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    spec_name VARCHAR(100) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    spec_unit VARCHAR(50) DEFAULT NULL,
    spec_category VARCHAR(50) DEFAULT NULL,
    display_order INT DEFAULT '0',
    is_key_spec TINYINT(1) DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY spec_category (spec_category),
    KEY is_key_spec (is_key_spec),
    CONSTRAINT product_specifications_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product pricing matrix table (for size-based pricing)
CREATE TABLE IF NOT EXISTS product_pricing_matrix (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    width_min DECIMAL(8,2) NOT NULL,
    width_max DECIMAL(8,2) NOT NULL,
    height_min DECIMAL(8,2) NOT NULL,
    height_max DECIMAL(8,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    price_per_sqft DECIMAL(10,2) DEFAULT '0.00',
    effective_date DATE DEFAULT NULL,
    expires_date DATE DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY dimensions (width_min, width_max, height_min, height_max),
    KEY is_active (is_active),
    CONSTRAINT product_pricing_matrix_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product bundles table
CREATE TABLE IF NOT EXISTS product_bundles (
    bundle_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    bundle_price DECIMAL(10,2) DEFAULT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bundle_id),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product bundle items table
CREATE TABLE IF NOT EXISTS product_bundle_items (
    id INT NOT NULL AUTO_INCREMENT,
    bundle_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT '1',
    discount_percentage DECIMAL(5,2) DEFAULT '0.00',
    is_required TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY bundle_id (bundle_id),
    KEY product_id (product_id),
    CONSTRAINT product_bundle_items_ibfk_1 FOREIGN KEY (bundle_id) REFERENCES product_bundles (bundle_id) ON DELETE CASCADE,
    CONSTRAINT product_bundle_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product relations table (related products)
CREATE TABLE IF NOT EXISTS product_relations (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    related_product_id INT NOT NULL,
    relation_type ENUM('accessory', 'complement', 'upgrade', 'alternative') NOT NULL,
    strength_score TINYINT DEFAULT '5',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY product_relation (product_id, related_product_id, relation_type),
    KEY product_id (product_id),
    KEY related_product_id (related_product_id),
    KEY relation_type (relation_type),
    CONSTRAINT product_relations_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT product_relations_ibfk_2 FOREIGN KEY (related_product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    rating TINYINT NOT NULL,
    review_title VARCHAR(255) DEFAULT NULL,
    review_text TEXT DEFAULT NULL,
    is_verified_purchase TINYINT(1) DEFAULT '0',
    is_approved TINYINT(1) DEFAULT '0',
    helpful_count INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    KEY product_id (product_id),
    KEY user_id (user_id),
    KEY rating (rating),
    KEY is_approved (is_approved),
    CONSTRAINT product_reviews_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT product_reviews_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CONFIGURATION RULE SYSTEM (for complex dependencies)
-- =============================================================================

-- Configuration rules table (for option dependencies and validation)
CREATE TABLE IF NOT EXISTS product_configuration_rules (
    rule_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('dependency', 'exclusion', 'requirement', 'price_modifier', 'availability') NOT NULL,
    condition_data JSON NOT NULL COMMENT 'Conditions that trigger this rule',
    action_data JSON NOT NULL COMMENT 'Actions to take when rule is triggered',
    priority INT DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rule_id),
    KEY product_id (product_id),
    KEY rule_type (rule_type),
    KEY priority (priority),
    KEY is_active (is_active),
    CONSTRAINT product_configuration_rules_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration steps table (for multi-step wizard)
CREATE TABLE IF NOT EXISTS product_configuration_steps (
    step_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_title VARCHAR(255) NOT NULL,
    step_description TEXT DEFAULT NULL,
    step_order INT NOT NULL,
    is_required TINYINT(1) DEFAULT '1',
    validation_rules JSON DEFAULT NULL,
    help_content TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (step_id),
    KEY product_id (product_id),
    KEY step_order (step_order),
    CONSTRAINT product_configuration_steps_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step options mapping (which options appear in which steps)
CREATE TABLE IF NOT EXISTS product_step_options (
    id INT NOT NULL AUTO_INCREMENT,
    step_id INT NOT NULL,
    option_id INT NOT NULL,
    display_order INT DEFAULT '0',
    is_primary TINYINT(1) DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY step_option (step_id, option_id),
    KEY step_id (step_id),
    KEY option_id (option_id),
    KEY display_order (display_order),
    CONSTRAINT product_step_options_ibfk_1 FOREIGN KEY (step_id) REFERENCES product_configuration_steps (step_id) ON DELETE CASCADE,
    CONSTRAINT product_step_options_ibfk_2 FOREIGN KEY (option_id) REFERENCES product_options (option_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PERFORMANCE INDEXES FOR PRODUCT SYSTEM
-- =============================================================================

-- Product configuration indexes
CREATE INDEX idx_product_options_type ON product_options(product_id, option_type);
CREATE INDEX idx_product_option_values_default ON product_option_values(option_id, is_default, is_available);
CREATE INDEX idx_product_variants_options ON product_variants(product_id, is_active);
CREATE INDEX idx_configuration_rules_active ON product_configuration_rules(product_id, rule_type, is_active);
CREATE INDEX idx_step_options_order ON product_step_options(step_id, display_order);

-- Insert some default categories if they don't exist
INSERT IGNORE INTO categories (name, slug, description) VALUES
('Blinds', 'blinds', 'Window blinds for all room types'),
('Curtains', 'curtains', 'Fabric window treatments'),
('Shades', 'shades', 'Various types of window shades'),
('Shutters', 'shutters', 'Decorative and functional window shutters'),
('Accessories', 'accessories', 'Window treatment accessories and hardware');

-- Insert some default brands
INSERT IGNORE INTO brands (name, slug, description, is_active) VALUES
('SmartBlinds', 'smartblinds', 'Premium smart window treatment solutions', 1),
('Classic Windows', 'classic-windows', 'Traditional window treatments', 1),
('Modern Living', 'modern-living', 'Contemporary window solutions', 1);

-- Insert some default features
INSERT IGNORE INTO features (name, description, is_active) VALUES
('Cordless Operation', 'Safe, cord-free operation perfect for homes with children', 1),
('Motorized Control', 'Electric operation with remote or smart home integration', 1),
('Light Filtering', 'Allows natural light while maintaining privacy', 1),
('Room Darkening', 'Blocks most light for better sleep and privacy', 1),
('Energy Efficient', 'Insulating properties help reduce energy costs', 1),
('Easy Installation', 'Simple DIY installation with included hardware', 1),
('Custom Sizing', 'Made to measure for perfect fit', 1),
('Moisture Resistant', 'Suitable for high-humidity areas like bathrooms', 1);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;