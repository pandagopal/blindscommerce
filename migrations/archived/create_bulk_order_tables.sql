-- Commercial bulk order tables for customer template system

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
);

-- Table for storing bulk order line items (parsed from CSV)
CREATE TABLE IF NOT EXISTS bulk_order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id VARCHAR(100) NOT NULL,
    row_number INT NOT NULL,
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
);

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
);

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
);

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
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_bulk_upload_status_date ON customer_bulk_uploads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_items_product_search ON bulk_order_items(blind_type, width_inches, height_inches);
CREATE INDEX IF NOT EXISTS idx_processing_workflow ON bulk_order_processing(processing_stage, created_at DESC);

-- Views for common queries
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