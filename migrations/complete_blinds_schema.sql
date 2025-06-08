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

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;