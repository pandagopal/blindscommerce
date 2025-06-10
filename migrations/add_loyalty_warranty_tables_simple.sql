-- Simple Loyalty and Warranty System Tables
-- This migration adds just the core tables without complex indexes

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Loyalty tiers table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    tier_id INT AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_color VARCHAR(7) DEFAULT '#6B7280',
    tier_icon VARCHAR(100) DEFAULT 'star',
    minimum_points INT NOT NULL DEFAULT 0,
    minimum_annual_spending DECIMAL(10,2) DEFAULT 0.00,
    points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    benefits JSON NULL,
    free_shipping BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    exclusive_access BOOLEAN DEFAULT FALSE,
    extended_returns_days INT DEFAULT 30,
    tier_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User loyalty accounts table
CREATE TABLE IF NOT EXISTS user_loyalty_accounts (
    loyalty_account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    current_tier_id INT NOT NULL DEFAULT 1,
    total_points_earned BIGINT DEFAULT 0,
    current_points_balance BIGINT DEFAULT 0,
    total_points_redeemed BIGINT DEFAULT 0,
    annual_spending DECIMAL(12,2) DEFAULT 0.00,
    lifetime_spending DECIMAL(12,2) DEFAULT 0.00,
    annual_spending_year YEAR DEFAULT (YEAR(NOW())),
    points_to_next_tier INT DEFAULT 0,
    next_tier_id INT NULL,
    tier_achieved_date TIMESTAMP NULL,
    tier_anniversary_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT NULL,
    last_points_earned TIMESTAMP NULL,
    last_points_redeemed TIMESTAMP NULL,
    referral_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'refunded') NOT NULL,
    points_amount INT NOT NULL,
    points_balance_before INT NOT NULL,
    points_balance_after INT NOT NULL,
    source_type ENUM('purchase', 'review', 'referral', 'signup', 'birthday', 'social_share', 'manual', 'redemption', 'expiration') NOT NULL,
    source_id VARCHAR(100) NULL,
    reference_amount DECIMAL(10,2) NULL,
    description TEXT NOT NULL,
    internal_notes TEXT NULL,
    expiry_date DATE NULL,
    processed_by INT NULL,
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_by_transaction_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
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
    reward_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reward_type ENUM('discount_percentage', 'discount_fixed', 'free_shipping', 'free_product', 'store_credit', 'experience') NOT NULL,
    points_cost INT NOT NULL,
    cash_value DECIMAL(10,2) NULL,
    minimum_tier_id INT NULL,
    minimum_purchase_amount DECIMAL(10,2) NULL,
    maximum_redemptions_per_user INT NULL,
    maximum_redemptions_total INT NULL,
    current_redemptions INT DEFAULT 0,
    reward_data JSON NULL,
    terms_and_conditions TEXT NULL,
    valid_from DATE NULL,
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500) NULL,
    icon VARCHAR(100) NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    points_cost INT NOT NULL,
    cash_value DECIMAL(10,2) NULL,
    coupon_code VARCHAR(100) NULL,
    redemption_status ENUM('pending', 'active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    used_date TIMESTAMP NULL,
    used_order_id INT NULL,
    expires_at TIMESTAMP NULL,
    redemption_data JSON NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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

-- Product warranties table
CREATE TABLE IF NOT EXISTS product_warranties (
    warranty_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NULL,
    serial_number VARCHAR(255) NOT NULL,
    model_number VARCHAR(255) NULL,
    warranty_type ENUM('manufacturer', 'extended', 'service_plan') DEFAULT 'manufacturer',
    warranty_duration_months INT NOT NULL DEFAULT 12,
    purchase_date DATE NOT NULL,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE AS (DATE_ADD(warranty_start_date, INTERVAL warranty_duration_months MONTH)) STORED,
    status ENUM('active', 'expired', 'voided', 'transferred') DEFAULT 'active',
    is_transferable BOOLEAN DEFAULT FALSE,
    coverage_details JSON NULL,
    exclusions TEXT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_method ENUM('online', 'mail', 'phone', 'auto') DEFAULT 'online',
    installation_date DATE NULL,
    installer_company VARCHAR(255) NULL,
    installer_notes TEXT NULL,
    notes TEXT NULL,
    internal_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_serial_customer (serial_number, customer_id),
    
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
    claim_type ENUM('repair', 'replacement', 'refund', 'service') NOT NULL,
    issue_description TEXT NOT NULL,
    customer_report TEXT NULL,
    status ENUM('pending', 'under_review', 'approved', 'denied', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_due_date DATE NULL,
    resolution_target_date DATE NULL,
    resolved_date TIMESTAMP NULL,
    closed_date TIMESTAMP NULL,
    assigned_to INT NULL,
    department ENUM('customer_service', 'technical', 'quality_assurance', 'management') DEFAULT 'customer_service',
    resolution_type ENUM('repaired', 'replaced', 'refunded', 'no_action', 'user_error') NULL,
    resolution_description TEXT NULL,
    resolution_cost DECIMAL(10,2) NULL,
    last_contact_date TIMESTAMP NULL,
    next_follow_up_date DATE NULL,
    customer_satisfaction_rating TINYINT NULL,
    internal_notes TEXT NULL,
    public_notes TEXT NULL,
    claim_number VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    photo_url VARCHAR(500) NOT NULL,
    photo_type ENUM('issue_photo', 'receipt', 'installation', 'repair_progress', 'completion') DEFAULT 'issue_photo',
    description TEXT NULL,
    uploaded_by INT NULL,
    file_size BIGINT NULL,
    file_format VARCHAR(20) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_claim_photos_claim 
        FOREIGN KEY (claim_id) REFERENCES warranty_claims(claim_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_claim_photos_uploader 
        FOREIGN KEY (uploaded_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default loyalty tiers
INSERT IGNORE INTO loyalty_tiers (tier_name, tier_color, tier_icon, minimum_points, minimum_annual_spending, points_multiplier, tier_order) VALUES 
('Bronze', '#CD7F32', 'bronze-medal', 0, 0.00, 1.00, 1),
('Silver', '#C0C0C0', 'silver-medal', 1000, 500.00, 1.25, 2),
('Gold', '#FFD700', 'gold-medal', 2500, 1000.00, 1.50, 3),
('Platinum', '#E5E4E2', 'platinum', 5000, 2000.00, 2.00, 4);

SELECT 'Loyalty and Warranty System tables created successfully!' as Status;