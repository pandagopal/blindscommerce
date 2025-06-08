-- Minimal schema for bulk order system
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

USE blindscommerce;

-- Essential users table
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
    PRIMARY KEY (user_id),
    UNIQUE KEY email (email)
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
    vendor_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_license VARCHAR(100) DEFAULT NULL,
    tax_id VARCHAR(50) DEFAULT NULL,
    business_address TEXT DEFAULT NULL,
    business_phone VARCHAR(20) DEFAULT NULL,
    business_email VARCHAR(255) DEFAULT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    is_verified TINYINT(1) DEFAULT '0',
    verification_status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT '15.00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id),
    KEY user_id (user_id),
    KEY is_active (is_active),
    CONSTRAINT vendor_info_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor files table for secure file management
CREATE TABLE IF NOT EXISTS vendor_files (
    file_id VARCHAR(100) PRIMARY KEY,
    vendor_id INT NOT NULL,
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
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;