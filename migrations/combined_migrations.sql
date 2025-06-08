-- Combined SQL Migrations
-- Generated on: 2025-06-07
-- This file combines all migration files in a logical order

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Disable foreign key checks during migrations
SET FOREIGN_KEY_CHECKS = 0;

-- Core Foundation Tables (Required for all other tables)
use blinds;
-- Create users table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    is_admin TINYINT(1) DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    is_verified TINYINT(1) DEFAULT '0',
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

-- Create products table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS products (
    product_id INT NOT NULL AUTO_INCREMENT,
    category_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    short_description TEXT,
    full_description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,2) DEFAULT NULL,
    review_count INT DEFAULT '0',
    is_featured TINYINT(1) DEFAULT '0',
    sku VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    UNIQUE KEY slug (slug),
    UNIQUE KEY sku (sku),
    KEY category_id (category_id),
    CONSTRAINT products_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create orders table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS orders (
    order_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    guest_email VARCHAR(255) DEFAULT NULL,
    order_number VARCHAR(50) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT '0.00',
    shipping_amount DECIMAL(10,2) DEFAULT '0.00',
    discount_amount DECIMAL(10,2) DEFAULT '0.00',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT NULL,
    payment_reference VARCHAR(255) DEFAULT NULL,
    shipping_address_id INT DEFAULT NULL,
    billing_address_id INT DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    UNIQUE KEY order_number (order_number),
    KEY user_id (user_id),
    KEY status (status),
    KEY payment_status (payment_status),
    CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create addresses table (referenced by orders and users)
CREATE TABLE IF NOT EXISTS addresses (
    address_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type ENUM('shipping','billing') DEFAULT 'shipping',
    street_address VARCHAR(255) NOT NULL,
    apartment VARCHAR(50) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    is_default TINYINT(1) DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    KEY user_id (user_id),
    CONSTRAINT addresses_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Base Tables - Consultation System
-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
    consultation_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    consultant_id INT,
    status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    consultation_type ENUM('measurement', 'installation', 'design', 'general') NOT NULL,
    preferred_date DATE,
    preferred_time_slot VARCHAR(50),
    timezone VARCHAR(50),
    consultation_mode ENUM('video', 'voice', 'chat', 'in_person') NOT NULL DEFAULT 'video',
    notes TEXT,
    duration_minutes INT DEFAULT 30,
    room_id VARCHAR(255) NULL,
    meeting_link VARCHAR(255) NULL,
    has_started BOOLEAN DEFAULT FALSE,
    has_ended BOOLEAN DEFAULT FALSE,
    actual_start_time TIMESTAMP NULL,
    actual_end_time TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    PRIMARY KEY (consultation_id),
    INDEX idx_user (user_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_status (status),
    INDEX idx_date (preferred_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (consultant_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create consultation supporting tables
CREATE TABLE IF NOT EXISTS consultation_details (
    detail_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    window_type VARCHAR(100),
    room_type VARCHAR(100),
    window_measurements JSON,
    product_interest JSON,
    design_preferences JSON,
    budget_range VARCHAR(50),
    property_type VARCHAR(100),
    measurement_photos JSON,
    room_photos JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (detail_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    INDEX idx_consultation (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_notes (
    note_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    note_type ENUM('measurement', 'recommendation', 'follow_up', 'general') NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_recommendations (
    recommendation_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    consultant_id INT NOT NULL,
    product_id INT,
    recommendation_type ENUM('product', 'style', 'measurement', 'installation') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    specifications JSON,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (recommendation_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (consultant_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_availability (
    availability_id BIGINT NOT NULL AUTO_INCREMENT,
    consultant_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    consultation_type ENUM('measurement', 'installation', 'design', 'general') NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (availability_id),
    FOREIGN KEY (consultant_id) REFERENCES users(user_id),
    INDEX idx_consultant (consultant_id),
    INDEX idx_day_time (day_of_week, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_consultation_messages (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_consultation_history (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_ratings (
    rating_id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rating_id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY unique_consultation_rating (consultation_id, user_id),
    INDEX idx_consultation (consultation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews System
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NULL COMMENT 'NULL for guest reviews',
    guest_name VARCHAR(100) NULL,
    guest_email VARCHAR(255) NULL,
    rating INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    review_text TEXT NOT NULL,
    is_verified_purchase TINYINT(1) DEFAULT 0,
    is_approved TINYINT(1) DEFAULT 0,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
    
    KEY idx_product_reviews (product_id),
    KEY idx_user_reviews (user_id),
    KEY idx_rating (rating),
    KEY idx_approved (is_approved),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_helpfulness (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(255) NULL COMMENT 'For guest users',
    is_helpful TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_review (review_id, user_id),
    UNIQUE KEY unique_session_review (review_id, session_id),
    
    KEY idx_review_helpfulness (review_id),
    KEY idx_user_helpfulness (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_alt TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    KEY idx_review_images (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recently Viewed System
CREATE TABLE IF NOT EXISTS recently_viewed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    product_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_product_id (product_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_user_viewed (user_id, viewed_at DESC),
    INDEX idx_session_viewed (session_id, viewed_at DESC),
    INDEX idx_cleanup (viewed_at),
    
    CONSTRAINT fk_recently_viewed_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recently_viewed_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT chk_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add composite index for recently viewed products
CREATE INDEX idx_product_viewed_at ON recently_viewed(product_id, viewed_at DESC);

-- Room Visualization System
CREATE TABLE IF NOT EXISTS room_visualizations (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    room_image LONGTEXT NOT NULL,
    result_image LONGTEXT NOT NULL,
    placement JSON NULL COMMENT 'Stores window placement data: x, y, width, height, scale, rotation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_user_visualizations (user_id, created_at),
    INDEX idx_product_visualizations (product_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Modification System
CREATE TABLE IF NOT EXISTS order_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    modification_type ENUM('item_quantity', 'add_item', 'remove_item', 'shipping_address', 'shipping_method', 'special_instructions', 'cancel_order') NOT NULL,
    
    -- State tracking
    previous_state JSON NULL,
    new_state JSON NULL,
    
    -- Item-specific modifications
    item_id INT NULL,
    previous_quantity INT NULL,
    new_quantity INT NULL,
    previous_price DECIMAL(10,2) NULL,
    new_price DECIMAL(10,2) NULL,
    
    -- Price calculations
    price_difference DECIMAL(10,2) DEFAULT 0.00,
    tax_difference DECIMAL(10,2) DEFAULT 0.00,
    shipping_difference DECIMAL(10,2) DEFAULT 0.00,
    total_difference DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status and workflow
    status ENUM('pending', 'approved', 'rejected', 'applied', 'payment_required', 'refund_issued') DEFAULT 'pending',
    reason_for_modification TEXT NULL,
    admin_notes TEXT NULL,
    
    -- Payment handling
    requires_additional_payment TINYINT(1) DEFAULT 0,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    stripe_refund_id VARCHAR(255) NULL,
    stripe_payment_intent_id VARCHAR(255) NULL,
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    applied_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    
    -- Tracking
    created_by INT NULL,
    approved_by INT NULL,
    
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_modification_type (modification_type),
    INDEX idx_requested_at (requested_at),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Methods System
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    payment_type ENUM('card', 'bank_account', 'digital_wallet') DEFAULT 'card',
    
    -- Card details (masked/last 4 digits only)
    card_brand VARCHAR(50) NULL,
    card_last_four VARCHAR(4) NULL,
    card_exp_month INT NULL,
    card_exp_year INT NULL,
    
    -- Bank account details (masked)
    bank_name VARCHAR(100) NULL,
    account_last_four VARCHAR(4) NULL,
    account_type ENUM('checking', 'savings') NULL,
    
    -- Digital wallet details
    wallet_type VARCHAR(50) NULL,
    wallet_email VARCHAR(255) NULL,
    
    -- Billing address
    billing_name VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255) NULL,
    billing_address_line1 VARCHAR(255) NULL,
    billing_address_line2 VARCHAR(255) NULL,
    billing_city VARCHAR(100) NULL,
    billing_state VARCHAR(50) NULL,
    billing_postal_code VARCHAR(20) NULL,
    billing_country VARCHAR(2) DEFAULT 'US',
    
    -- Metadata
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    nickname VARCHAR(100) NULL,
    
    -- Security and tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_pm (stripe_payment_method_id),
    INDEX idx_user_default (user_id, is_default),
    INDEX idx_user_active (user_id, is_active),
    
    CONSTRAINT fk_saved_payment_methods_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Recovery System
CREATE TABLE IF NOT EXISTS abandoned_cart_recovery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Cart identification
    cart_id VARCHAR(255) NOT NULL,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Cart contents
    cart_data JSON NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    item_count INT NOT NULL,
    
    -- Recovery tracking
    recovery_status ENUM('pending', 'email_sent', 'reminder_sent', 'recovered', 'expired', 'opted_out') DEFAULT 'pending',
    recovery_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Email campaign tracking
    first_email_sent_at TIMESTAMP NULL,
    reminder_email_sent_at TIMESTAMP NULL,
    last_email_sent_at TIMESTAMP NULL,
    email_open_count INT DEFAULT 0,
    email_click_count INT DEFAULT 0,
    
    -- Recovery details
    recovered_at TIMESTAMP NULL,
    recovery_order_id INT NULL,
    recovery_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Campaign settings
    send_first_email_after INT DEFAULT 1440,
    send_reminder_after INT DEFAULT 4320,
    expire_after INT DEFAULT 10080,
    
    -- Personalization
    customer_name VARCHAR(255) NULL,
    preferred_contact_time ENUM('morning', 'afternoon', 'evening', 'any') DEFAULT 'any',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Analytics
    source_page VARCHAR(500) NULL,
    device_type VARCHAR(50) NULL,
    browser VARCHAR(100) NULL,
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(100) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cart_id (cart_id),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_recovery_token (recovery_token),
    INDEX idx_recovery_status (recovery_status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (recovery_order_id) REFERENCES orders(order_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty Program System
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(100) NOT NULL,
    tier_level INT NOT NULL,
    minimum_spending DECIMAL(10,2) NOT NULL,
    points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Benefits
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    free_shipping_threshold DECIMAL(10,2) NULL,
    early_access_hours INT DEFAULT 0,
    exclusive_products TINYINT(1) DEFAULT 0,
    priority_support TINYINT(1) DEFAULT 0,
    
    -- Styling
    tier_color VARCHAR(7) DEFAULT '#6B7280',
    tier_icon VARCHAR(100) NULL,
    tier_description TEXT NULL,
    
    -- Settings
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tier_level (tier_level),
    INDEX idx_minimum_spending (minimum_spending),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_tier_name (tier_name),
    UNIQUE KEY unique_tier_level (tier_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_loyalty_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_tier_id INT NOT NULL,
    
    -- Points tracking
    total_points_earned INT DEFAULT 0,
    available_points INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    points_expired INT DEFAULT 0,
    
    -- Spending tracking
    lifetime_spending DECIMAL(10,2) DEFAULT 0.00,
    current_year_spending DECIMAL(10,2) DEFAULT 0.00,
    last_purchase_date TIMESTAMP NULL,
    
    -- Tier tracking
    tier_anniversary_date DATE NULL,
    next_tier_progress DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tier_id (current_tier_id),
    INDEX idx_active (is_active),
    INDEX idx_anniversary (tier_anniversary_date),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (current_tier_id) REFERENCES loyalty_tiers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty Points Transaction System
CREATE TABLE IF NOT EXISTS loyalty_points_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'referral') NOT NULL,
    points_amount INT NOT NULL, -- Positive for earned, negative for redeemed/expired
    
    -- Transaction context
    order_id INT NULL,
    product_id INT NULL,
    review_id INT NULL,
    referral_user_id INT NULL,
    
    -- Transaction details
    description VARCHAR(255) NOT NULL,
    reference_type ENUM('purchase', 'review', 'referral', 'birthday', 'signup', 'social_share', 'survey', 'admin_adjustment') NULL,
    reference_id VARCHAR(255) NULL,
    
    -- Point lifecycle
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    redeemed_date TIMESTAMP NULL,
    
    -- Metadata
    multiplier_applied DECIMAL(3,2) DEFAULT 1.00,
    tier_id INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_points (user_id, transaction_type),
    INDEX idx_expiry (expiry_date),
    INDEX idx_reference (reference_type, reference_id),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES product_reviews(review_id) ON DELETE SET NULL,
    FOREIGN KEY (referral_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (tier_id) REFERENCES loyalty_tiers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reward_type ENUM('discount', 'free_shipping', 'free_product', 'gift_card', 'service') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    points_cost INT NOT NULL,
    
    -- Reward value
    discount_percentage DECIMAL(5,2) NULL,
    discount_amount DECIMAL(10,2) NULL,
    free_product_id INT NULL,
    gift_card_amount DECIMAL(10,2) NULL,
    
    -- Availability
    valid_from TIMESTAMP NULL,
    valid_until TIMESTAMP NULL,
    min_tier_level INT DEFAULT 0,
    max_tier_level INT NULL,
    quantity_available INT NULL,
    quantity_claimed INT DEFAULT 0,
    
    -- Display
    reward_image VARCHAR(500) NULL,
    terms_conditions TEXT NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_reward_type (reward_type),
    INDEX idx_points_cost (points_cost),
    INDEX idx_min_tier (min_tier_level),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_validity (valid_from, valid_until),
    
    FOREIGN KEY (free_product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_reward_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    order_id INT NULL,
    
    -- Redemption details
    points_used INT NOT NULL,
    discount_applied DECIMAL(10,2) NULL,
    product_received_id INT NULL,
    gift_card_code VARCHAR(255) NULL,
    
    -- Status
    status ENUM('pending', 'approved', 'rejected', 'fulfilled', 'expired', 'refunded') DEFAULT 'pending',
    expiry_date TIMESTAMP NULL,
    fulfilled_date TIMESTAMP NULL,
    refund_date TIMESTAMP NULL,
    admin_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_redemption (user_id, created_at),
    INDEX idx_reward (reward_id),
    INDEX idx_status (status),
    INDEX idx_expiry (expiry_date),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (product_received_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Media Integration System
CREATE TABLE IF NOT EXISTS social_media_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok') NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_url VARCHAR(500) NOT NULL,
    account_id VARCHAR(255) NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    
    -- Settings
    is_active TINYINT(1) DEFAULT 1,
    auto_post TINYINT(1) DEFAULT 0,
    post_schedule JSON NULL,
    
    -- Display
    display_order INT DEFAULT 0,
    show_in_footer TINYINT(1) DEFAULT 1,
    show_in_header TINYINT(1) DEFAULT 0,
    icon_class VARCHAR(100) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_platform (platform),
    INDEX idx_active (is_active),
    INDEX idx_display_order (display_order),
    UNIQUE KEY unique_platform_account (platform, account_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS social_media_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    post_type ENUM('product_showcase', 'room_inspiration', 'customer_review', 'promotion', 'educational', 'company_news', 'custom') NOT NULL,
    
    -- Content
    title VARCHAR(255) NULL,
    content TEXT NOT NULL,
    image_urls JSON NULL,
    video_url VARCHAR(500) NULL,
    
    -- References
    product_id INT NULL,
    order_id INT NULL,
    review_id INT NULL,
    category_id INT NULL,
    
    -- Status
    post_status ENUM('draft', 'scheduled', 'published', 'failed', 'deleted') DEFAULT 'draft',
    scheduled_time TIMESTAMP NULL,
    published_time TIMESTAMP NULL,
    platform_post_id VARCHAR(255) NULL,
    engagement_metrics JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_account_id (account_id),
    INDEX idx_post_type (post_type),
    INDEX idx_status (post_status),
    INDEX idx_scheduled (scheduled_time),
    INDEX idx_product (product_id),
    
    FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES product_reviews(review_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample and Swatch Management System
CREATE TABLE IF NOT EXISTS sample_request_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('guest', 'registered', 'designer', 'trade') NOT NULL,
    max_monthly_requests INT NOT NULL DEFAULT 5,
    max_total_requests INT NOT NULL DEFAULT 15,
    max_active_requests INT NOT NULL DEFAULT 3,
    cool_down_days INT NOT NULL DEFAULT 30,
    max_samples_per_request INT NOT NULL DEFAULT 5,
    requires_approval TINYINT(1) DEFAULT 0,
    
    -- Cost settings
    is_free TINYINT(1) DEFAULT 1,
    cost_per_sample DECIMAL(10,2) DEFAULT 0.00,
    free_shipping_threshold DECIMAL(10,2) NULL,
    
    -- Additional privileges
    can_request_custom_sizes TINYINT(1) DEFAULT 0,
    can_request_large_samples TINYINT(1) DEFAULT 0,
    
    -- Management
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    
    INDEX idx_user_type (user_type),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sample_request_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    request_type ENUM('swatch', 'sample', 'custom') NOT NULL,
    status ENUM('pending', 'approved', 'shipped', 'delivered', 'rejected', 'cancelled') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    shipped_date TIMESTAMP NULL,
    tracking_number VARCHAR(100) NULL,
    sample_count INT NOT NULL DEFAULT 1,
    
    -- Sample details
    product_ids JSON NOT NULL,
    color_ids JSON NOT NULL,
    custom_notes TEXT,
    
    -- Contact info (for guest requests)
    guest_name VARCHAR(255) NULL,
    guest_email VARCHAR(255) NULL,
    shipping_address_id INT NULL,
    
    -- Tracking
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    INDEX idx_user_tracking (user_id, request_date),
    INDEX idx_session_tracking (session_id, request_date),
    INDEX idx_status (status),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS swatch_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_name (name),
    INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes and constraints for existing swatch tables if they exist
SET @sql = (SELECT IF(
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'swatch_orders'
    ),
    'ALTER TABLE swatch_orders 
     ADD INDEX idx_user_requests (user_id, request_date),
     ADD INDEX idx_status (status),
     ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL',
    'SELECT "swatch_orders table does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Video Chat System
CREATE TABLE IF NOT EXISTS video_chat_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    provider ENUM('twilio', 'agora', 'custom') NOT NULL DEFAULT 'twilio',
    room_name VARCHAR(255) NOT NULL,
    room_sid VARCHAR(255) NULL,
    status ENUM('pending', 'active', 'ended', 'failed') DEFAULT 'pending',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(500) NULL,
    
    -- Connection info
    ice_servers JSON NULL,
    signaling_url VARCHAR(255) NULL,
    
    -- Settings
    max_participants INT DEFAULT 2,
    video_enabled BOOLEAN DEFAULT TRUE,
    audio_enabled BOOLEAN DEFAULT TRUE,
    chat_enabled BOOLEAN DEFAULT TRUE,
    screen_share_enabled BOOLEAN DEFAULT TRUE,
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    INDEX idx_consultation (consultation_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS video_chat_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    role ENUM('host', 'participant', 'observer') NOT NULL DEFAULT 'participant',
    join_time TIMESTAMP NULL,
    leave_time TIMESTAMP NULL,
    device_info JSON NULL,
    connection_quality JSON NULL,
    
    FOREIGN KEY (session_id) REFERENCES video_chat_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_session_user (session_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recently Viewed Cleanup Trigger
DELIMITER //

CREATE TRIGGER cleanup_recently_viewed 
AFTER INSERT ON recently_viewed
FOR EACH ROW
BEGIN
    -- Clean up old records for authenticated users (keep last 50)
    IF NEW.user_id IS NOT NULL THEN
        DELETE rv FROM recently_viewed rv
        WHERE rv.user_id = NEW.user_id
        AND rv.id NOT IN (
            SELECT id FROM (
                SELECT id FROM recently_viewed 
                WHERE user_id = NEW.user_id 
                ORDER BY viewed_at DESC 
                LIMIT 50
            ) AS keep_recent
        );
    END IF;
    
    -- Clean up old records for guest sessions (keep last 20)
    IF NEW.session_id IS NOT NULL THEN
        DELETE rv FROM recently_viewed rv
        WHERE rv.session_id = NEW.session_id
        AND rv.id NOT IN (
            SELECT id FROM (
                SELECT id FROM recently_viewed 
                WHERE session_id = NEW.session_id 
                ORDER BY viewed_at DESC 
                LIMIT 20
            ) AS keep_recent
        );
    END IF;
END //

DELIMITER ;

-- Add cleanup trigger for old records if not exists
DELIMITER //

DROP TRIGGER IF EXISTS cleanup_old_recently_viewed //

CREATE TRIGGER cleanup_old_recently_viewed
BEFORE INSERT ON recently_viewed
FOR EACH ROW
BEGIN
    -- Delete records older than 90 days
    DELETE FROM recently_viewed 
    WHERE viewed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //

DELIMITER ;

-- Insert default admin user if it doesn't exist
INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (1, 'admin@smartblindshub.com', '$2b$10$sCXjcAfIxXMlHgWYFCzXnOFUEcK5.oiUS7xAIDUxfNQZ3L.QH05Ni', 'Admin', 'User', 1, 1, 1, NOW(), NOW(), 1);

-- Insert default categories if they don't exist
INSERT IGNORE INTO categories (name, slug, description) VALUES 
('Blinds', 'blinds', 'Premium window blinds for every room'),
('Shades', 'shades', 'Elegant window shades and treatments'),
('Shutters', 'shutters', 'Classic wooden and composite shutters'),
('Curtains', 'curtains', 'Beautiful curtains and drapes');

-- Re-enable foreign key checks after migrations
SET FOREIGN_KEY_CHECKS = 1;

-- Verify all tables were created successfully
SHOW TABLES;
