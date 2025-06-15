-- Create bulk_product_jobs table for tracking vendor bulk operations
CREATE TABLE IF NOT EXISTS bulk_product_jobs (
    job_id VARCHAR(36) PRIMARY KEY,
    vendor_id INT NOT NULL,
    operation_type ENUM('import', 'export', 'update') NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'completed_with_errors') DEFAULT 'pending',
    file_name VARCHAR(255) NOT NULL,
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    errors JSON NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) ON DELETE CASCADE
);

-- Add missing columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) NULL AFTER sale_price,
ADD COLUMN IF NOT EXISTS finish VARCHAR(100) NULL AFTER color,
ADD COLUMN IF NOT EXISTS tags TEXT NULL AFTER meta_description,
ADD COLUMN IF NOT EXISTS room_types VARCHAR(255) NULL AFTER tags,
ADD COLUMN IF NOT EXISTS mount_types VARCHAR(255) NULL AFTER room_types,
ADD COLUMN IF NOT EXISTS control_types VARCHAR(255) NULL AFTER mount_types,
ADD COLUMN IF NOT EXISTS light_filtering VARCHAR(50) NULL AFTER control_types,
ADD COLUMN IF NOT EXISTS energy_efficiency VARCHAR(50) NULL AFTER light_filtering,
ADD COLUMN IF NOT EXISTS child_safety_certified BOOLEAN DEFAULT FALSE AFTER energy_efficiency,
ADD COLUMN IF NOT EXISTS warranty_years INT DEFAULT 1 AFTER child_safety_certified,
ADD COLUMN IF NOT EXISTS custom_width_min DECIMAL(8,3) NULL AFTER warranty_years,
ADD COLUMN IF NOT EXISTS custom_width_max DECIMAL(8,3) NULL AFTER custom_width_min,
ADD COLUMN IF NOT EXISTS custom_height_min DECIMAL(8,3) NULL AFTER custom_width_max,
ADD COLUMN IF NOT EXISTS custom_height_max DECIMAL(8,3) NULL AFTER custom_height_min,
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER custom_height_max;

-- Create product_inventory table for inventory management
CREATE TABLE IF NOT EXISTS product_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    stock_quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    allow_backorder BOOLEAN DEFAULT FALSE,
    reorder_point INT DEFAULT 10,
    reorder_quantity INT DEFAULT 50,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_product (product_id),
    INDEX idx_stock_quantity (stock_quantity),
    INDEX idx_low_stock (low_stock_threshold),
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Insert default inventory records for existing products
INSERT IGNORE INTO product_inventory (product_id, stock_quantity, low_stock_threshold, allow_backorder)
SELECT product_id, 0, 5, FALSE 
FROM products 
WHERE product_id NOT IN (SELECT product_id FROM product_inventory);