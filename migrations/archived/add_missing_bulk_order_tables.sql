-- Add missing tables for bulk order system
USE blindscommerce;

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