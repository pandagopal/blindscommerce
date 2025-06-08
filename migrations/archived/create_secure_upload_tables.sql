-- Security-focused file upload tracking tables
-- These tables provide comprehensive audit trails and security monitoring for all file uploads

-- Vendor file uploads tracking
CREATE TABLE IF NOT EXISTS vendor_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    file_id VARCHAR(100) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    upload_type ENUM('productImages', 'businessDocuments', 'catalogs') NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    file_size INT NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA256 hash for integrity
    scan_result ENUM('clean', 'suspicious', 'malicious') NOT NULL DEFAULT 'clean',
    approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    width INT NULL, -- For images
    height INT NULL, -- For images
    metadata JSON NULL, -- Additional file metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_file_id (file_id),
    INDEX idx_upload_type (upload_type),
    INDEX idx_approval_status (approval_status),
    INDEX idx_scan_result (scan_result),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
);

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
    
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
);

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
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

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
    
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Customer upload quota tracking (prevent abuse)
CREATE TABLE IF NOT EXISTS customer_upload_quota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    upload_type VARCHAR(50) NOT NULL,
    files_uploaded INT NOT NULL DEFAULT 0,
    quota_limit INT NOT NULL DEFAULT 20, -- Daily limit
    quota_period ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
    last_upload_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_customer_upload_type (customer_id, upload_type),
    INDEX idx_customer_id (customer_id),
    INDEX idx_upload_type (upload_type),
    INDEX idx_last_upload_date (last_upload_date),
    
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

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
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- File access logs (track who accessed what files when)
CREATE TABLE IF NOT EXISTS file_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id VARCHAR(100) NOT NULL,
    user_id INT NULL,
    access_type ENUM('view', 'download', 'delete', 'update') NOT NULL,
    file_type ENUM('vendor_file', 'customer_file', 'product_image', 'other') NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    referer VARCHAR(500) NULL,
    access_granted BOOLEAN NOT NULL DEFAULT TRUE,
    denial_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_file_id (file_id),
    INDEX idx_user_id (user_id),
    INDEX idx_access_type (access_type),
    INDEX idx_file_type (file_type),
    INDEX idx_client_ip (client_ip),
    INDEX idx_access_granted (access_granted),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Blacklisted file hashes (prevent re-upload of known malicious files)
CREATE TABLE IF NOT EXISTS blacklisted_file_hashes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_hash VARCHAR(64) NOT NULL UNIQUE,
    hash_type ENUM('sha256', 'md5') NOT NULL DEFAULT 'sha256',
    reason TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    source VARCHAR(100) NOT NULL, -- Where the hash came from (manual, automated, external)
    added_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_file_hash (file_hash),
    INDEX idx_hash_type (hash_type),
    INDEX idx_severity (severity),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (added_by) REFERENCES users(user_id) ON DELETE SET NULL
);

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
    
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Insert default security configuration
INSERT INTO upload_security_config (config_key, config_value, config_type, description) VALUES
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

-- Create indexes for performance optimization
CREATE INDEX idx_vendor_files_composite ON vendor_files(vendor_id, upload_type, created_at);
CREATE INDEX idx_customer_files_composite ON customer_files(customer_id, upload_type, created_at);
CREATE INDEX idx_upload_logs_composite ON vendor_upload_logs(vendor_id, created_at);
CREATE INDEX idx_security_incidents_composite ON upload_security_incidents(severity, created_at, resolved);

-- Create a view for active vendor files (not deleted)
CREATE VIEW active_vendor_files AS
SELECT vf.*, vi.business_name, u.email as vendor_email
FROM vendor_files vf
JOIN vendor_info vi ON vf.vendor_id = vi.vendor_id
JOIN users u ON vi.user_id = u.user_id
WHERE vf.deleted_at IS NULL;

-- Create a view for active customer files (not deleted)
CREATE VIEW active_customer_files AS
SELECT cf.*, u.email as customer_email, u.first_name, u.last_name
FROM customer_files cf
JOIN users u ON cf.customer_id = u.user_id
WHERE cf.deleted_at IS NULL;

-- Create a view for security dashboard (recent incidents)
CREATE VIEW security_dashboard AS
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