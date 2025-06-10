-- Add Loyalty and Warranty System Tables
-- This migration adds the complete loyalty and warranty management systems

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Use the blindscommerce database
USE blindscommerce;

-- =============================================================================
-- LOYALTY PROGRAM SYSTEM TABLES
-- =============================================================================

-- Loyalty tiers table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    tier_id INT AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_color VARCHAR(7) DEFAULT '#6B7280' COMMENT 'Hex color for UI',
    tier_icon VARCHAR(100) DEFAULT 'star' COMMENT 'Icon name for UI',
    minimum_points INT NOT NULL DEFAULT 0,
    minimum_annual_spending DECIMAL(10,2) DEFAULT 0.00,
    points_multiplier DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Points earning multiplier',
    
    -- Tier benefits
    benefits JSON NULL COMMENT 'JSON array of tier benefits',
    free_shipping BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    exclusive_access BOOLEAN DEFAULT FALSE,
    extended_returns_days INT DEFAULT 30,
    
    -- Tier progression
    tier_order INT NOT NULL DEFAULT 0 COMMENT 'Order for tier progression',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tier_order (tier_order),
    INDEX idx_minimum_points (minimum_points),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User loyalty accounts table
CREATE TABLE IF NOT EXISTS user_loyalty_accounts (
    loyalty_account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Current status
    current_tier_id INT NOT NULL DEFAULT 1,
    total_points_earned BIGINT DEFAULT 0 COMMENT 'Lifetime points earned',
    current_points_balance BIGINT DEFAULT 0 COMMENT 'Available points to spend',
    total_points_redeemed BIGINT DEFAULT 0 COMMENT 'Lifetime points redeemed',
    
    -- Spending tracking
    annual_spending DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Current year spending',
    lifetime_spending DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total lifetime spending',
    annual_spending_year YEAR DEFAULT (YEAR(NOW())),
    
    -- Tier progression tracking
    points_to_next_tier INT DEFAULT 0,
    next_tier_id INT NULL,
    tier_achieved_date TIMESTAMP NULL,
    tier_anniversary_date DATE NULL,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT NULL,
    
    -- Engagement metrics
    last_points_earned TIMESTAMP NULL,
    last_points_redeemed TIMESTAMP NULL,
    referral_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_current_tier (current_tier_id),
    INDEX idx_points_balance (current_points_balance),
    INDEX idx_annual_spending (annual_spending_year, annual_spending),
    INDEX idx_active_status (is_active, is_suspended),
    
    CONSTRAINT fk_loyalty_accounts_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_loyalty_accounts_current_tier 
        FOREIGN KEY (current_tier_id) REFERENCES loyalty_tiers(tier_id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_loyalty_accounts_next_tier 
        FOREIGN KEY (next_tier_id) REFERENCES loyalty_tiers(tier_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Points transactions table
CREATE TABLE IF NOT EXISTS loyalty_points_transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Transaction details
    transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'refunded') NOT NULL,
    points_amount INT NOT NULL COMMENT 'Positive for earned, negative for redeemed/expired',
    points_balance_before INT NOT NULL,
    points_balance_after INT NOT NULL,
    
    -- Source information
    source_type ENUM('purchase', 'review', 'referral', 'signup', 'birthday', 'social_share', 'manual', 'redemption', 'expiration') NOT NULL,
    source_id VARCHAR(100) NULL COMMENT 'Order ID, review ID, etc.',
    reference_amount DECIMAL(10,2) NULL COMMENT 'Purchase amount or redemption value',
    
    -- Transaction metadata
    description TEXT NOT NULL,
    internal_notes TEXT NULL,
    expiry_date DATE NULL COMMENT 'When these points expire (if applicable)',
    
    -- Processing info
    processed_by INT NULL COMMENT 'Admin user who processed manual transactions',
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_by_transaction_id BIGINT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_transactions (user_id, created_at DESC),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_source (source_type, source_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_processing (processed_by),
    INDEX idx_reversed (is_reversed, reversed_by_transaction_id),
    
    CONSTRAINT fk_loyalty_transactions_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_loyalty_transactions_processor 
        FOREIGN KEY (processed_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_loyalty_transactions_reversal 
        FOREIGN KEY (reversed_by_transaction_id) REFERENCES loyalty_points_transactions(transaction_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty rewards catalog table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Reward details
    reward_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reward_type ENUM('discount_percentage', 'discount_fixed', 'free_shipping', 'free_product', 'store_credit', 'experience') NOT NULL,
    
    -- Cost and availability
    points_cost INT NOT NULL,
    cash_value DECIMAL(10,2) NULL COMMENT 'Monetary equivalent value',
    
    -- Redemption rules
    minimum_tier_id INT NULL COMMENT 'Minimum tier required to redeem',
    minimum_purchase_amount DECIMAL(10,2) NULL COMMENT 'Minimum purchase required',
    maximum_redemptions_per_user INT NULL COMMENT 'Limit per customer',
    maximum_redemptions_total INT NULL COMMENT 'Total available redemptions',
    current_redemptions INT DEFAULT 0,
    
    -- Reward configuration
    reward_data JSON NULL COMMENT 'Type-specific configuration (discount %, product IDs, etc.)',
    terms_and_conditions TEXT NULL,
    
    -- Validity
    valid_from DATE NULL,
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Display
    image_url VARCHAR(500) NULL,
    icon VARCHAR(100) NULL,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_points_cost (points_cost),
    INDEX idx_reward_type (reward_type),
    INDEX idx_minimum_tier (minimum_tier_id),
    INDEX idx_active_featured (is_active, is_featured),
    INDEX idx_validity (valid_from, valid_until),
    INDEX idx_availability (maximum_redemptions_total, current_redemptions),
    INDEX idx_sort_order (sort_order),
    
    CONSTRAINT fk_loyalty_rewards_tier 
        FOREIGN KEY (minimum_tier_id) REFERENCES loyalty_tiers(tier_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reward redemptions table
CREATE TABLE IF NOT EXISTS loyalty_reward_redemptions (
    redemption_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_transaction_id BIGINT NOT NULL,
    
    -- Redemption details
    points_cost INT NOT NULL,
    cash_value DECIMAL(10,2) NULL,
    coupon_code VARCHAR(100) NULL COMMENT 'Generated coupon code if applicable',
    
    -- Usage tracking
    redemption_status ENUM('pending', 'active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    used_date TIMESTAMP NULL,
    used_order_id INT NULL,
    expires_at TIMESTAMP NULL,
    
    -- Metadata
    redemption_data JSON NULL COMMENT 'Specific redemption details',
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_redemptions (user_id, created_at DESC),
    INDEX idx_reward_redemptions (reward_id),
    INDEX idx_points_transaction (points_transaction_id),
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_status (redemption_status),
    INDEX idx_expiry (expires_at),
    INDEX idx_usage (used_date, used_order_id),
    
    CONSTRAINT fk_loyalty_redemptions_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_loyalty_redemptions_reward 
        FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(reward_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_loyalty_redemptions_transaction 
        FOREIGN KEY (points_transaction_id) REFERENCES loyalty_points_transactions(transaction_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_loyalty_redemptions_order 
        FOREIGN KEY (used_order_id) REFERENCES orders(order_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- WARRANTY MANAGEMENT SYSTEM TABLES
-- =============================================================================

-- Product warranties table
CREATE TABLE IF NOT EXISTS product_warranties (
    warranty_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Product and customer information
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NULL COMMENT 'Original purchase order',
    
    -- Warranty details
    serial_number VARCHAR(255) NOT NULL COMMENT 'Product serial number',
    model_number VARCHAR(255) NULL,
    warranty_type ENUM('manufacturer', 'extended', 'service_plan') DEFAULT 'manufacturer',
    warranty_duration_months INT NOT NULL DEFAULT 12,
    
    -- Dates
    purchase_date DATE NOT NULL,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE AS (DATE_ADD(warranty_start_date, INTERVAL warranty_duration_months MONTH)) STORED,
    
    -- Status
    status ENUM('active', 'expired', 'voided', 'transferred') DEFAULT 'active',
    is_transferable BOOLEAN DEFAULT FALSE,
    
    -- Coverage details
    coverage_details JSON NULL COMMENT 'What is covered under warranty',
    exclusions TEXT NULL COMMENT 'What is not covered',
    
    -- Registration
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_method ENUM('online', 'mail', 'phone', 'auto') DEFAULT 'online',
    
    -- Installation information
    installation_date DATE NULL,
    installer_company VARCHAR(255) NULL,
    installer_notes TEXT NULL,
    
    -- Metadata
    notes TEXT NULL,
    internal_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_serial_customer (serial_number, customer_id),
    INDEX idx_product_warranty (product_id),
    INDEX idx_customer_warranty (customer_id),
    INDEX idx_order_warranty (order_id),
    INDEX idx_serial_number (serial_number),
    INDEX idx_warranty_dates (warranty_start_date, warranty_end_date),
    INDEX idx_status (status),
    INDEX idx_registration_date (registration_date),
    
    CONSTRAINT fk_warranties_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_warranties_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_warranties_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warranty claims table
CREATE TABLE IF NOT EXISTS warranty_claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    warranty_id INT NOT NULL,
    customer_id INT NOT NULL,
    
    -- Claim details
    claim_type ENUM('repair', 'replacement', 'refund', 'service') NOT NULL,
    issue_description TEXT NOT NULL,
    customer_report TEXT NULL COMMENT 'Customer description of the issue',
    
    -- Claim status
    status ENUM('pending', 'under_review', 'approved', 'denied', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Dates
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_due_date DATE NULL,
    resolution_target_date DATE NULL,
    resolved_date TIMESTAMP NULL,
    closed_date TIMESTAMP NULL,
    
    -- Assignment and processing
    assigned_to INT NULL COMMENT 'Staff member handling the claim',
    department ENUM('customer_service', 'technical', 'quality_assurance', 'management') DEFAULT 'customer_service',
    
    -- Resolution details
    resolution_type ENUM('repaired', 'replaced', 'refunded', 'no_action', 'user_error') NULL,
    resolution_description TEXT NULL,
    resolution_cost DECIMAL(10,2) NULL,
    
    -- Communication
    last_contact_date TIMESTAMP NULL,
    next_follow_up_date DATE NULL,
    customer_satisfaction_rating TINYINT NULL COMMENT '1-5 rating',
    
    -- Internal tracking
    internal_notes TEXT NULL,
    public_notes TEXT NULL COMMENT 'Notes visible to customer',
    claim_number VARCHAR(100) NULL COMMENT 'Human-readable claim reference',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_warranty_claims (warranty_id),
    INDEX idx_customer_claims (customer_id, claim_date DESC),
    INDEX idx_status_priority (status, priority),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_department (department),
    INDEX idx_resolution_type (resolution_type),
    INDEX idx_claim_dates (claim_date, resolved_date),
    INDEX idx_follow_up (next_follow_up_date),
    INDEX idx_claim_number (claim_number),
    
    CONSTRAINT fk_warranty_claims_warranty 
        FOREIGN KEY (warranty_id) REFERENCES product_warranties(warranty_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_warranty_claims_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_warranty_claims_assigned 
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warranty claim photos table
CREATE TABLE IF NOT EXISTS warranty_claim_photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    
    -- Photo details
    photo_url VARCHAR(500) NOT NULL,
    photo_type ENUM('issue_photo', 'receipt', 'installation', 'repair_progress', 'completion') DEFAULT 'issue_photo',
    description TEXT NULL,
    
    -- Upload information
    uploaded_by INT NULL COMMENT 'User who uploaded the photo',
    file_size BIGINT NULL COMMENT 'File size in bytes',
    file_format VARCHAR(20) NULL COMMENT 'jpg, png, pdf, etc.',
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_claim_photos (claim_id),
    INDEX idx_photo_type (photo_type),
    INDEX idx_uploaded_by (uploaded_by),
    
    CONSTRAINT fk_claim_photos_claim 
        FOREIGN KEY (claim_id) REFERENCES warranty_claims(claim_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_claim_photos_uploader 
        FOREIGN KEY (uploaded_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warranty claim communications table
CREATE TABLE IF NOT EXISTS warranty_claim_communications (
    communication_id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    
    -- Communication details
    communication_type ENUM('customer_message', 'staff_response', 'system_update', 'email', 'phone_call') NOT NULL,
    sender_id INT NULL COMMENT 'User who sent the communication',
    sender_type ENUM('customer', 'staff', 'system') NOT NULL,
    
    -- Content
    subject VARCHAR(500) NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE COMMENT 'Internal staff notes vs customer-visible',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    requires_response BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_claim_communications (claim_id, created_at DESC),
    INDEX idx_sender (sender_id),
    INDEX idx_communication_type (communication_type),
    INDEX idx_internal (is_internal),
    INDEX idx_requires_response (requires_response, is_read),
    
    CONSTRAINT fk_claim_communications_claim 
        FOREIGN KEY (claim_id) REFERENCES warranty_claims(claim_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_claim_communications_sender 
        FOREIGN KEY (sender_id) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Views will be created after tables are successfully created

-- Default data will be inserted after table creation is confirmed

-- =============================================================================
-- SIMPLE TRIGGERS FOR LOYALTY AND WARRANTY SYSTEMS
-- =============================================================================

DELIMITER $$

-- Generate warranty claim number
CREATE TRIGGER IF NOT EXISTS generate_claim_number
    BEFORE INSERT ON warranty_claims
    FOR EACH ROW
BEGIN
    IF NEW.claim_number IS NULL THEN
        SET NEW.claim_number = CONCAT('WC', DATE_FORMAT(NOW(), '%Y%m'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Additional indexes for optimal performance
CREATE INDEX idx_loyalty_points_expiry ON loyalty_points_transactions(user_id, expiry_date);
CREATE INDEX idx_loyalty_redemptions_active ON loyalty_reward_redemptions(redemption_status, expires_at);
CREATE INDEX idx_warranty_expiring ON product_warranties(warranty_end_date, status);
CREATE INDEX idx_warranty_claims_processing ON warranty_claims(status, assigned_to, response_due_date);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'Loyalty and Warranty System tables created successfully!' as Status;