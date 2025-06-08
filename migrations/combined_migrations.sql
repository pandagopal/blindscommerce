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

-- Create products table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS products (
    product_id INT NOT NULL AUTO_INCREMENT,
    brand_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    short_description TEXT,
    full_description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,2) DEFAULT NULL,
    review_count INT DEFAULT '0',
    is_featured TINYINT(1) DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    stock_status ENUM('in_stock', 'out_of_stock', 'limited_stock') DEFAULT 'in_stock',
    sku VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    UNIQUE KEY slug (slug),
    UNIQUE KEY sku (sku),
    KEY brand_id (brand_id),
    KEY is_active (is_active),
    KEY stock_status (stock_status),
    CONSTRAINT products_ibfk_1 FOREIGN KEY (brand_id) REFERENCES brands (brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_categories junction table (many-to-many relationship)
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

-- Create order_items table (referenced by orders and products)
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_options JSON DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_item_id),
    KEY order_id (order_id),
    KEY product_id (product_id),
    CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id)
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

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wishlist_id),
    KEY user_id (user_id),
    CONSTRAINT wishlist_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_item_id INT NOT NULL AUTO_INCREMENT,
    wishlist_id INT DEFAULT NULL,
    product_id INT DEFAULT NULL,
    added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wishlist_item_id),
    KEY wishlist_id (wishlist_id),
    KEY product_id (product_id),
    CONSTRAINT wishlist_items_ibfk_1 FOREIGN KEY (wishlist_id) REFERENCES wishlist (wishlist_id) ON DELETE CASCADE,
    CONSTRAINT wishlist_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_info table
CREATE TABLE IF NOT EXISTS vendor_info (
    vendor_info_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50) DEFAULT NULL,
    business_description TEXT,
    logo_url VARCHAR(255) DEFAULT NULL,
    website_url VARCHAR(255) DEFAULT NULL,
    year_established INT DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT '0',
    verification_date TIMESTAMP NULL DEFAULT NULL,
    approval_status VARCHAR(50) DEFAULT 'pending',
    tax_id VARCHAR(100) DEFAULT NULL,
    business_address_line1 VARCHAR(255) DEFAULT NULL,
    business_address_line2 VARCHAR(255) DEFAULT NULL,
    business_city VARCHAR(100) DEFAULT NULL,
    business_state VARCHAR(100) DEFAULT NULL,
    business_postal_code VARCHAR(20) DEFAULT NULL,
    business_country VARCHAR(100) DEFAULT 'United States',
    total_sales DECIMAL(12,2) DEFAULT '0.00',
    rating DECIMAL(3,2) DEFAULT '0.00',
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_info_id),
    KEY user_id (user_id),
    CONSTRAINT vendor_info_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sales_staff table
CREATE TABLE IF NOT EXISTS sales_staff (
    sales_staff_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    territory VARCHAR(255) DEFAULT NULL,
    commission_rate DECIMAL(5,2) DEFAULT '0.00',
    target_sales DECIMAL(10,2) DEFAULT '0.00',
    total_sales DECIMAL(10,2) DEFAULT '0.00',
    is_active TINYINT(1) DEFAULT '1',
    start_date DATE DEFAULT NULL,
    manager_id INT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (sales_staff_id),
    KEY user_id (user_id),
    KEY manager_id (manager_id),
    CONSTRAINT sales_staff_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT sales_staff_ibfk_2 FOREIGN KEY (manager_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create installers table
CREATE TABLE IF NOT EXISTS installers (
    installer_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    certification_number VARCHAR(100) DEFAULT NULL,
    service_area VARCHAR(255) DEFAULT NULL,
    specialties JSON DEFAULT NULL,
    hourly_rate DECIMAL(8,2) DEFAULT '0.00',
    rating DECIMAL(3,2) DEFAULT '0.00',
    total_installations INT DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    is_certified TINYINT(1) DEFAULT '0',
    certification_date DATE DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (installer_id),
    KEY user_id (user_id),
    KEY service_area (service_area),
    CONSTRAINT installers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
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
INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (1, 'admin@smartblindshub.com', '$2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6', 'Admin', 'User', 'admin', 1, 1, 1, NOW(), NOW(), 1);

INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (2, 'vendor@smartblindshub.com', '$2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6', 'vendor', 'User', 'vendor', 0, 1, 1, NOW(), NOW(), 1);

INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (3, 'customer@smartblindshub.com', '$2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6', 'customer', 'User', 'customer', 0, 1, 1, NOW(), NOW(), 1);

INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (4, 'sales@smartblindshub.com', '$2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6', 'sales', 'User', 'sales', 0, 1, 1, NOW(), NOW(), 1);

INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_admin, is_active, is_verified, created_at, updated_at, is_listing_active) 
VALUES (5, 'installer@smartblindshub.com', '$2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6', 'installer', 'User', 'installer', 0, 1, 1, NOW(), NOW(), 1);

-- Insert vendor_info for the test vendor user
INSERT IGNORE INTO vendor_info (user_id, business_name, business_email, business_phone, business_description, is_active, is_verified, approval_status) 
VALUES (2, 'Test Vendor Business', 'vendor@smartblindshub.com', '555-0123', 'Test vendor for development', 1, 1, 'approved');

-- Insert sample sales staff data
INSERT IGNORE INTO sales_staff (user_id, territory, commission_rate, target_sales, total_sales, is_active, start_date) 
VALUES (4, 'North Region', 5.00, 100000.00, 45000.00, 1, '2024-01-01');

-- Insert sample installer data
INSERT IGNORE INTO installers (user_id, certification_number, service_area, hourly_rate, rating, total_installations, is_active, is_certified, certification_date) 
VALUES (5, 'CERT-12345', 'Metro Area', 75.00, 4.8, 156, 1, 1, '2023-06-15');

-- Create brands table
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
    UNIQUE KEY name (name),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    is_primary TINYINT(1) DEFAULT '0',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    KEY product_id (product_id),
    KEY is_primary (is_primary),
    KEY display_order (display_order),
    CONSTRAINT product_images_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(255) DEFAULT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_data JSON DEFAULT NULL,
    page_url VARCHAR(500) DEFAULT NULL,
    referrer_url VARCHAR(500) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    KEY user_id (user_id),
    KEY session_id (session_id),
    KEY event_type (event_type),
    KEY event_name (event_name),
    KEY created_at (created_at),
    CONSTRAINT analytics_events_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (preference_id),
    UNIQUE KEY user_preference (user_id, preference_key),
    KEY user_id (user_id),
    CONSTRAINT user_preferences_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('order', 'promotion', 'system', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT '0',
    action_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (notification_id),
    KEY user_id (user_id),
    KEY is_read (is_read),
    KEY created_at (created_at),
    CONSTRAINT user_notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_id VARCHAR(255) DEFAULT NULL,
    gateway_response JSON DEFAULT NULL,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY order_id (order_id),
    KEY payment_status (payment_status),
    KEY transaction_id (transaction_id),
    CONSTRAINT payments_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_options table
CREATE TABLE IF NOT EXISTS product_options (
    option_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    option_type ENUM('dropdown', 'radio', 'checkbox', 'text', 'number') NOT NULL,
    is_required TINYINT(1) DEFAULT '0',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (option_id),
    KEY product_id (product_id),
    KEY display_order (display_order),
    CONSTRAINT product_options_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_option_values table
CREATE TABLE IF NOT EXISTS product_option_values (
    value_id INT NOT NULL AUTO_INCREMENT,
    option_id INT NOT NULL,
    value_name VARCHAR(255) NOT NULL,
    value_data VARCHAR(255) DEFAULT NULL,
    price_modifier DECIMAL(10,2) DEFAULT '0.00',
    display_order INT DEFAULT '0',
    is_default TINYINT(1) DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (value_id),
    KEY option_id (option_id),
    KEY display_order (display_order),
    CONSTRAINT product_option_values_ibfk_1 FOREIGN KEY (option_id) REFERENCES product_options (option_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_products table (critical for vendor product management)
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

-- Create vendor_commissions table (for commission tracking)
CREATE TABLE IF NOT EXISTS vendor_commissions (
    commission_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    order_id INT NOT NULL,
    order_item_id INT DEFAULT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    payment_date TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (commission_id),
    KEY vendor_id (vendor_id),
    KEY order_id (order_id),
    KEY order_item_id (order_item_id),
    KEY commission_status (commission_status),
    CONSTRAINT vendor_commissions_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE,
    CONSTRAINT vendor_commissions_ibfk_2 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT vendor_commissions_ibfk_3 FOREIGN KEY (order_item_id) REFERENCES order_items (order_item_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_performance table (for analytics and reporting)
CREATE TABLE IF NOT EXISTS vendor_performance (
    performance_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_orders INT DEFAULT '0',
    total_sales DECIMAL(12,2) DEFAULT '0.00',
    total_commission DECIMAL(12,2) DEFAULT '0.00',
    avg_order_value DECIMAL(10,2) DEFAULT '0.00',
    customer_satisfaction_score DECIMAL(3,2) DEFAULT NULL,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT NULL,
    return_rate DECIMAL(5,2) DEFAULT NULL,
    response_time_hours DECIMAL(8,2) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (performance_id),
    UNIQUE KEY vendor_period (vendor_id, period_start, period_end),
    KEY vendor_id (vendor_id),
    KEY period_start (period_start),
    CONSTRAINT vendor_performance_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_inventory table (for stock management)
CREATE TABLE IF NOT EXISTS vendor_inventory (
    inventory_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_on_hand INT DEFAULT '0',
    quantity_committed INT DEFAULT '0',
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    reorder_point INT DEFAULT '0',
    reorder_quantity INT DEFAULT '0',
    cost_per_unit DECIMAL(10,2) DEFAULT NULL,
    last_restocked_date TIMESTAMP NULL DEFAULT NULL,
    last_updated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    UNIQUE KEY vendor_product_inventory (vendor_id, product_id),
    KEY vendor_id (vendor_id),
    KEY product_id (product_id),
    KEY quantity_available (quantity_available),
    CONSTRAINT vendor_inventory_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE,
    CONSTRAINT vendor_inventory_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_ratings table (for customer feedback)
CREATE TABLE IF NOT EXISTS vendor_ratings (
    rating_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(255) DEFAULT NULL,
    review_text TEXT DEFAULT NULL,
    service_quality_rating TINYINT DEFAULT NULL CHECK (service_quality_rating BETWEEN 1 AND 5),
    communication_rating TINYINT DEFAULT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    delivery_rating TINYINT DEFAULT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
    is_verified TINYINT(1) DEFAULT '0',
    is_approved TINYINT(1) DEFAULT '0',
    helpful_count INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rating_id),
    UNIQUE KEY vendor_user_order (vendor_id, user_id, order_id),
    KEY vendor_id (vendor_id),
    KEY user_id (user_id),
    KEY order_id (order_id),
    KEY rating (rating),
    KEY is_approved (is_approved),
    CONSTRAINT vendor_ratings_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE,
    CONSTRAINT vendor_ratings_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT vendor_ratings_ibfk_3 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_catalogs table (for product organization)
CREATE TABLE IF NOT EXISTS vendor_catalogs (
    catalog_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    catalog_name VARCHAR(255) NOT NULL,
    catalog_description TEXT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    is_public TINYINT(1) DEFAULT '1',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_id),
    KEY vendor_id (vendor_id),
    KEY is_active (is_active),
    KEY is_public (is_public),
    CONSTRAINT vendor_catalogs_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_catalog_products table (linking catalogs to products)
CREATE TABLE IF NOT EXISTS vendor_catalog_products (
    catalog_product_id INT NOT NULL AUTO_INCREMENT,
    catalog_id INT NOT NULL,
    product_id INT NOT NULL,
    display_order INT DEFAULT '0',
    is_featured TINYINT(1) DEFAULT '0',
    added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_product_id),
    UNIQUE KEY catalog_product (catalog_id, product_id),
    KEY catalog_id (catalog_id),
    KEY product_id (product_id),
    CONSTRAINT vendor_catalog_products_ibfk_1 FOREIGN KEY (catalog_id) REFERENCES vendor_catalogs (catalog_id) ON DELETE CASCADE,
    CONSTRAINT vendor_catalog_products_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_payments table (for vendor payout tracking)
CREATE TABLE IF NOT EXISTS vendor_payments (
    payment_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    payment_type ENUM('commission', 'bonus', 'refund', 'adjustment') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('bank_transfer', 'paypal', 'stripe', 'check') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    reference_number VARCHAR(255) DEFAULT NULL,
    payment_date TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    commission_ids JSON DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY vendor_id (vendor_id),
    KEY payment_status (payment_status),
    KEY payment_date (payment_date),
    CONSTRAINT vendor_payments_ibfk_1 FOREIGN KEY (vendor_id) REFERENCES vendor_info (vendor_info_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_variants table (for size, color, style variations)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE DEFAULT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT '0.00',
    stock_quantity INT DEFAULT '0',
    weight DECIMAL(8,2) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_id),
    UNIQUE KEY sku (sku),
    KEY product_id (product_id),
    KEY is_active (is_active),
    CONSTRAINT product_variants_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create features table (master features)
CREATE TABLE IF NOT EXISTS features (
    feature_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(100) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feature_id),
    UNIQUE KEY name (name),
    KEY category (category),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_features table (product-feature relationships)
CREATE TABLE IF NOT EXISTS product_features (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    feature_id INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY product_feature (product_id, feature_id),
    KEY product_id (product_id),
    KEY feature_id (feature_id),
    CONSTRAINT product_features_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT product_features_ibfk_2 FOREIGN KEY (feature_id) REFERENCES features (feature_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_colors table
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

-- Create product_materials table
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

-- Create product_rooms table (room recommendations)
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

-- Create product_specifications table
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

-- Create product_pricing_matrix table (for configurator)
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

-- Create product_bundles table
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

-- Create product_bundle_items table
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

-- Create product_relations table (related products)
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

-- Feature #3: Comprehensive Warranty System
CREATE TABLE IF NOT EXISTS warranty_registrations (
    registration_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    order_item_id INT DEFAULT NULL,
    registration_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    warranty_type ENUM('standard', 'extended', 'lifetime') DEFAULT 'standard',
    serial_number VARCHAR(100) DEFAULT NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) DEFAULT NULL,
    installer_id INT DEFAULT NULL,
    status ENUM('active', 'expired', 'voided', 'transferred') DEFAULT 'active',
    notes TEXT DEFAULT NULL,
    PRIMARY KEY (registration_id),
    KEY user_id (user_id),
    KEY product_id (product_id),
    KEY order_id (order_id),
    KEY warranty_end_date (warranty_end_date),
    KEY status (status),
    CONSTRAINT warranty_registrations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT warranty_registrations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT warranty_registrations_ibfk_3 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE SET NULL,
    CONSTRAINT warranty_registrations_ibfk_4 FOREIGN KEY (installer_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warranty_claims (
    claim_id INT NOT NULL AUTO_INCREMENT,
    registration_id INT NOT NULL,
    user_id INT NOT NULL,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    issue_description TEXT NOT NULL,
    claim_type ENUM('defect', 'damage', 'malfunction', 'installation_issue') NOT NULL,
    status ENUM('submitted', 'under_review', 'approved', 'denied', 'completed', 'cancelled') DEFAULT 'submitted',
    resolution_type ENUM('repair', 'replacement', 'refund', 'no_action') DEFAULT NULL,
    resolution_date TIMESTAMP NULL DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    claim_amount DECIMAL(10,2) DEFAULT NULL,
    images JSON DEFAULT NULL,
    assigned_to INT DEFAULT NULL,
    PRIMARY KEY (claim_id),
    UNIQUE KEY claim_number (claim_number),
    KEY registration_id (registration_id),
    KEY user_id (user_id),
    KEY status (status),
    KEY claim_date (claim_date),
    CONSTRAINT warranty_claims_ibfk_1 FOREIGN KEY (registration_id) REFERENCES warranty_registrations (registration_id) ON DELETE CASCADE,
    CONSTRAINT warranty_claims_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT warranty_claims_ibfk_3 FOREIGN KEY (assigned_to) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature #7: Content & Education Hub
CREATE TABLE IF NOT EXISTS content_categories (
    category_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    parent_id INT DEFAULT NULL,
    icon VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    display_order INT DEFAULT '0',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY slug (slug),
    KEY parent_id (parent_id),
    KEY is_active (is_active),
    CONSTRAINT content_categories_ibfk_1 FOREIGN KEY (parent_id) REFERENCES content_categories (category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_articles (
    article_id INT NOT NULL AUTO_INCREMENT,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT DEFAULT NULL,
    content LONGTEXT NOT NULL,
    content_type ENUM('guide', 'tutorial', 'faq', 'blog', 'video', 'tip') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    estimated_read_time INT DEFAULT NULL,
    video_url VARCHAR(500) DEFAULT NULL,
    featured_image VARCHAR(500) DEFAULT NULL,
    images JSON DEFAULT NULL,
    tags JSON DEFAULT NULL,
    meta_title VARCHAR(255) DEFAULT NULL,
    meta_description TEXT DEFAULT NULL,
    author_id INT DEFAULT NULL,
    is_published TINYINT(1) DEFAULT '0',
    is_featured TINYINT(1) DEFAULT '0',
    view_count INT DEFAULT '0',
    rating DECIMAL(3,2) DEFAULT NULL,
    rating_count INT DEFAULT '0',
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id),
    UNIQUE KEY slug (slug),
    KEY category_id (category_id),
    KEY author_id (author_id),
    KEY content_type (content_type),
    KEY is_published (is_published),
    KEY is_featured (is_featured),
    KEY published_at (published_at),
    CONSTRAINT content_articles_ibfk_1 FOREIGN KEY (category_id) REFERENCES content_categories (category_id) ON DELETE CASCADE,
    CONSTRAINT content_articles_ibfk_2 FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature #14: Trade Professional Portal
CREATE TABLE IF NOT EXISTS trade_applications (
    application_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type ENUM('interior_designer', 'contractor', 'architect', 'decorator', 'retailer', 'other') NOT NULL,
    license_number VARCHAR(100) DEFAULT NULL,
    years_in_business INT DEFAULT NULL,
    annual_volume_estimate DECIMAL(12,2) DEFAULT NULL,
    business_address TEXT DEFAULT NULL,
    business_phone VARCHAR(20) DEFAULT NULL,
    business_email VARCHAR(255) DEFAULT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    references JSON DEFAULT NULL,
    portfolio_links JSON DEFAULT NULL,
    application_status ENUM('pending', 'under_review', 'approved', 'denied', 'additional_info_needed') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    approval_date TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    trade_discount_percentage DECIMAL(5,2) DEFAULT '15.00',
    net_payment_terms INT DEFAULT '30',
    credit_limit DECIMAL(12,2) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (application_id),
    KEY user_id (user_id),
    KEY application_status (application_status),
    KEY reviewed_by (reviewed_by),
    CONSTRAINT trade_applications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT trade_applications_ibfk_2 FOREIGN KEY (reviewed_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_projects (
    project_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_type ENUM('residential', 'commercial', 'hospitality', 'healthcare', 'education', 'other') NOT NULL,
    project_address TEXT DEFAULT NULL,
    estimated_budget DECIMAL(12,2) DEFAULT NULL,
    project_timeline VARCHAR(255) DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    completion_date DATE DEFAULT NULL,
    status ENUM('planning', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'planning',
    notes TEXT DEFAULT NULL,
    room_count INT DEFAULT NULL,
    window_count INT DEFAULT NULL,
    project_data JSON DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id),
    KEY user_id (user_id),
    KEY status (status),
    KEY start_date (start_date),
    CONSTRAINT trade_projects_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature #5: Room Planning Tools
CREATE TABLE IF NOT EXISTS room_measurements (
    measurement_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    room_type VARCHAR(100) DEFAULT NULL,
    room_dimensions JSON DEFAULT NULL,
    window_measurements JSON NOT NULL,
    measurement_notes TEXT DEFAULT NULL,
    measurement_images JSON DEFAULT NULL,
    is_professional_measured TINYINT(1) DEFAULT '0',
    measured_by INT DEFAULT NULL,
    measurement_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (measurement_id),
    KEY user_id (user_id),
    KEY measured_by (measured_by),
    KEY room_type (room_type),
    CONSTRAINT room_measurements_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT room_measurements_ibfk_2 FOREIGN KEY (measured_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_shopping_lists (
    list_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    list_name VARCHAR(255) NOT NULL,
    room_measurement_id INT DEFAULT NULL,
    estimated_total DECIMAL(10,2) DEFAULT '0.00',
    is_active TINYINT(1) DEFAULT '1',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id),
    KEY user_id (user_id),
    KEY room_measurement_id (room_measurement_id),
    KEY is_active (is_active),
    CONSTRAINT room_shopping_lists_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT room_shopping_lists_ibfk_2 FOREIGN KEY (room_measurement_id) REFERENCES room_measurements (measurement_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_shopping_list_items (
    item_id INT NOT NULL AUTO_INCREMENT,
    list_id INT NOT NULL,
    product_id INT NOT NULL,
    window_name VARCHAR(255) DEFAULT NULL,
    configuration_data JSON DEFAULT NULL,
    estimated_price DECIMAL(10,2) DEFAULT NULL,
    quantity INT DEFAULT '1',
    notes TEXT DEFAULT NULL,
    is_purchased TINYINT(1) DEFAULT '0',
    added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id),
    KEY list_id (list_id),
    KEY product_id (product_id),
    KEY is_purchased (is_purchased),
    CONSTRAINT room_shopping_list_items_ibfk_1 FOREIGN KEY (list_id) REFERENCES room_shopping_lists (list_id) ON DELETE CASCADE,
    CONSTRAINT room_shopping_list_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature #1: Enhanced Search & Discovery
CREATE TABLE IF NOT EXISTS search_suggestions (
    suggestion_id INT NOT NULL AUTO_INCREMENT,
    suggestion_text VARCHAR(255) NOT NULL,
    suggestion_type ENUM('product', 'category', 'brand', 'feature', 'room') NOT NULL,
    reference_id INT DEFAULT NULL,
    search_count INT DEFAULT '0',
    is_active TINYINT(1) DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (suggestion_id),
    UNIQUE KEY suggestion_text (suggestion_text),
    KEY suggestion_type (suggestion_type),
    KEY search_count (search_count),
    KEY is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories if they don't exist
INSERT IGNORE INTO categories (name, slug, description) VALUES 
('Blinds', 'blinds', 'Premium window blinds for every room'),
('Shades', 'shades', 'Elegant window shades and treatments'),
('Shutters', 'shutters', 'Classic wooden and composite shutters'),
('Curtains', 'curtains', 'Beautiful curtains and drapes');

-- Insert sample brands
INSERT IGNORE INTO brands (brand_id, name, slug, description, is_active) VALUES 
(1, 'Hunter Douglas', 'hunter-douglas', 'Premium window treatment manufacturer known for innovative designs', 1),
(2, 'Levolor', 'levolor', 'Quality blinds and shades for every home', 1),
(3, 'Bali', 'bali', 'Stylish and affordable window treatments', 1),
(4, 'Graber', 'graber', 'Custom window treatments with superior craftsmanship', 1);

-- Insert sample products
INSERT IGNORE INTO products (product_id, category_id, brand_id, name, slug, short_description, full_description, base_price, rating, review_count, is_featured, is_active, stock_status, sku) VALUES 
(1, 1, 1, 'Venetian Wood Blinds', 'venetian-wood-blinds', 'Premium basswood venetian blinds with 2-inch slats', 'Beautiful basswood venetian blinds featuring 2-inch slats for excellent light control and privacy. Perfect for living rooms, bedrooms, and offices.', 129.99, 4.5, 24, 1, 1, 'in_stock', 'VWB-001'),
(2, 1, 2, 'Aluminum Mini Blinds', 'aluminum-mini-blinds', 'Durable 1-inch aluminum mini blinds', 'Sleek and modern aluminum mini blinds with 1-inch slats. Rust-resistant and easy to clean, perfect for kitchens and bathrooms.', 49.99, 4.2, 18, 0, 1, 'in_stock', 'AMB-001'),
(3, 2, 1, 'Cellular Honeycomb Shades', 'cellular-honeycomb-shades', 'Energy-efficient cellular shades with honeycomb design', 'Insulating cellular shades with honeycomb construction for superior energy efficiency. Available in light filtering and blackout options.', 179.99, 4.7, 31, 1, 1, 'in_stock', 'CHS-001'),
(4, 2, 3, 'Roman Fabric Shades', 'roman-fabric-shades', 'Elegant Roman shades in premium fabrics', 'Classic Roman shades crafted from high-quality fabrics. Add sophistication and warmth to any room with these timeless window treatments.', 149.99, 4.3, 15, 0, 1, 'in_stock', 'RFS-001'),
(5, 3, 4, 'Plantation Shutters', 'plantation-shutters', 'Traditional plantation shutters in hardwood', 'Handcrafted hardwood plantation shutters with adjustable louvers. Adds value and elegance to your home while providing excellent light control.', 299.99, 4.8, 42, 1, 1, 'limited_stock', 'PS-001'),
(6, 4, 3, 'Blackout Curtains', 'blackout-curtains', 'Room darkening blackout curtains', 'Premium blackout curtains that block 99% of light. Perfect for bedrooms, media rooms, and nurseries. Available in multiple colors and sizes.', 89.99, 4.4, 27, 0, 1, 'in_stock', 'BC-001');

-- Insert sample product images
INSERT IGNORE INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES 
(1, '/images/products/venetian-wood-blinds-1.jpg', 'Venetian Wood Blinds - Main View', 1, 1),
(1, '/images/products/venetian-wood-blinds-2.jpg', 'Venetian Wood Blinds - Close Up', 0, 2),
(2, '/images/products/aluminum-mini-blinds-1.jpg', 'Aluminum Mini Blinds - Main View', 1, 1),
(3, '/images/products/cellular-honeycomb-shades-1.jpg', 'Cellular Honeycomb Shades - Main View', 1, 1),
(4, '/images/products/roman-fabric-shades-1.jpg', 'Roman Fabric Shades - Main View', 1, 1),
(5, '/images/products/plantation-shutters-1.jpg', 'Plantation Shutters - Main View', 1, 1),
(6, '/images/products/blackout-curtains-1.jpg', 'Blackout Curtains - Main View', 1, 1);

-- Insert sample orders
INSERT IGNORE INTO orders (order_id, user_id, order_number, status, subtotal, tax_amount, shipping_amount, total_amount, payment_status, payment_method, notes) VALUES 
(1, 3, 'ORD-2024-001', 'pending', 129.99, 10.40, 15.00, 155.39, 'pending', 'credit_card', 'Customer requested expedited processing'),
(2, 3, 'ORD-2024-002', 'processing', 179.99, 14.40, 0.00, 194.39, 'paid', 'credit_card', 'Free shipping applied'),
(3, 3, 'ORD-2024-003', 'shipped', 299.99, 24.00, 25.00, 348.99, 'paid', 'paypal', 'Special order - plantation shutters'),
(4, 3, 'ORD-2024-004', 'delivered', 89.99, 7.20, 12.00, 109.19, 'paid', 'credit_card', 'Delivered to front door');

-- Insert sample order items
INSERT IGNORE INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, total_price) VALUES 
(1, 1, 1, 1, 129.99, 129.99),
(2, 2, 3, 1, 179.99, 179.99),
(3, 3, 5, 1, 299.99, 299.99),
(4, 4, 6, 1, 89.99, 89.99);

-- Insert sample vendor products (linking vendors to products)
INSERT IGNORE INTO vendor_products (vendor_id, product_id, vendor_sku, vendor_price, quantity_available, minimum_order_qty, lead_time_days, is_active, is_featured, vendor_description) VALUES 
(1, 1, 'VEN-VWB-001', 125.99, 50, 1, 5, 1, 1, 'Premium quality basswood venetian blinds with superior finish'),
(1, 2, 'VEN-AMB-001', 47.99, 100, 1, 3, 1, 0, 'Durable aluminum mini blinds perfect for high-moisture areas'),
(1, 3, 'VEN-CHS-001', 175.99, 25, 1, 7, 1, 1, 'Energy-efficient cellular shades with lifetime warranty'),
(1, 4, 'VEN-RFS-001', 145.99, 30, 1, 10, 1, 0, 'Handcrafted Roman shades using premium designer fabrics'),
(1, 5, 'VEN-PS-001', 295.99, 15, 1, 14, 1, 1, 'Custom plantation shutters made from sustainable hardwood'),
(1, 6, 'VEN-BC-001', 87.99, 75, 1, 2, 1, 0, 'Professional-grade blackout curtains with thermal insulation');

-- Insert sample vendor inventory
INSERT IGNORE INTO vendor_inventory (vendor_id, product_id, quantity_on_hand, quantity_committed, reorder_point, reorder_quantity, cost_per_unit, last_restocked_date) VALUES 
(1, 1, 50, 5, 10, 25, 95.00, '2024-05-15'),
(1, 2, 100, 10, 20, 50, 35.00, '2024-05-20'),
(1, 3, 25, 3, 5, 15, 135.00, '2024-05-10'),
(1, 4, 30, 2, 8, 20, 110.00, '2024-05-12'),
(1, 5, 15, 1, 3, 10, 225.00, '2024-05-08'),
(1, 6, 75, 8, 15, 40, 65.00, '2024-05-18');

-- Insert sample vendor commissions
INSERT IGNORE INTO vendor_commissions (vendor_id, order_id, order_item_id, commission_rate, commission_amount, commission_status) VALUES 
(1, 1, 1, 15.00, 19.50, 'approved'),
(1, 2, 2, 15.00, 27.00, 'paid'),
(1, 3, 3, 15.00, 44.99, 'paid'),
(1, 4, 4, 15.00, 13.50, 'approved');

-- Insert sample vendor catalogs
INSERT IGNORE INTO vendor_catalogs (vendor_id, catalog_name, catalog_description, is_active, is_public, display_order) VALUES 
(1, 'Premium Window Treatments', 'Our flagship collection of high-end window treatments for luxury homes', 1, 1, 1),
(1, 'Commercial Solutions', 'Professional-grade window treatments for offices and commercial spaces', 1, 1, 2),
(1, 'Budget-Friendly Options', 'Quality window treatments at affordable prices', 1, 1, 3);

-- Insert sample vendor catalog products
INSERT IGNORE INTO vendor_catalog_products (catalog_id, product_id, display_order, is_featured) VALUES 
(1, 1, 1, 1),
(1, 3, 2, 1),
(1, 5, 3, 1),
(2, 2, 1, 0),
(2, 4, 2, 0),
(3, 6, 1, 1);

-- Insert sample vendor performance
INSERT IGNORE INTO vendor_performance (vendor_id, period_start, period_end, total_orders, total_sales, total_commission, avg_order_value, customer_satisfaction_score, on_time_delivery_rate, return_rate, response_time_hours) VALUES 
(1, '2024-05-01', '2024-05-31', 15, 2350.50, 352.58, 156.70, 4.7, 95.50, 2.30, 3.5);

-- Insert sample vendor ratings
INSERT IGNORE INTO vendor_ratings (vendor_id, user_id, order_id, rating, review_title, review_text, service_quality_rating, communication_rating, delivery_rating, is_verified, is_approved) VALUES 
(1, 3, 1, 5, 'Excellent Service!', 'Outstanding quality and fast delivery. Very professional vendor with great customer service.', 5, 5, 5, 1, 1),
(1, 3, 2, 4, 'Good Quality Products', 'Products are of good quality and arrived on time. Would recommend this vendor.', 4, 4, 5, 1, 1);

-- Insert sample features
INSERT IGNORE INTO features (feature_id, name, description, icon, category, is_active, display_order) VALUES 
(1, 'Light Control', 'Precise control over natural light entering your room', 'sun', 'operation', 1, 1),
(2, 'Privacy Protection', 'Complete privacy when needed', 'eye-off', 'operation', 1, 2),
(3, 'Energy Efficient', 'Helps reduce heating and cooling costs', 'zap', 'energy', 1, 3),
(4, 'Easy Operation', 'Simple and smooth operation mechanisms', 'settings', 'operation', 1, 4),
(5, 'Moisture Resistant', 'Suitable for high-humidity environments', 'droplets', 'material', 1, 5),
(6, 'Child Safe', 'Cordless or cord-safe design for child safety', 'shield', 'safety', 1, 6),
(7, 'UV Protection', 'Blocks harmful UV rays from damaging furniture', 'umbrella', 'protection', 1, 7),
(8, 'Sound Dampening', 'Reduces outside noise for a quieter environment', 'volume-x', 'comfort', 1, 8);

-- Insert sample product features
INSERT IGNORE INTO product_features (product_id, feature_id) VALUES 
(1, 1), (1, 2), (1, 7), -- Venetian Wood Blinds
(2, 1), (2, 2), (2, 5), (2, 6), -- Aluminum Mini Blinds
(3, 1), (3, 2), (3, 3), (3, 7), (3, 8), -- Cellular Honeycomb Shades
(4, 1), (4, 2), (4, 7), (4, 8), -- Roman Fabric Shades
(5, 1), (5, 2), (5, 3), (5, 7), (5, 8), -- Plantation Shutters
(6, 2), (6, 3), (6, 7), (6, 8); -- Blackout Curtains

-- Insert sample product colors
INSERT IGNORE INTO product_colors (product_id, color_name, color_code, color_family, price_adjustment, is_available, display_order) VALUES 
(1, 'Natural Wood', '#D4A574', 'warm', 0.00, 1, 1),
(1, 'White', '#FFFFFF', 'neutral', 0.00, 1, 2),
(1, 'Dark Walnut', '#5D4037', 'warm', 15.00, 1, 3),
(2, 'White', '#FFFFFF', 'neutral', 0.00, 1, 1),
(2, 'Silver', '#C0C0C0', 'neutral', 0.00, 1, 2),
(2, 'Bronze', '#CD7F32', 'warm', 5.00, 1, 3),
(3, 'White', '#FFFFFF', 'neutral', 0.00, 1, 1),
(3, 'Beige', '#F5F5DC', 'warm', 0.00, 1, 2),
(3, 'Light Gray', '#D3D3D3', 'cool', 0.00, 1, 3),
(4, 'Ivory', '#FFFFF0', 'neutral', 0.00, 1, 1),
(4, 'Sage Green', '#9CAF88', 'cool', 10.00, 1, 2),
(4, 'Burgundy', '#800020', 'warm', 10.00, 1, 3),
(5, 'Natural Wood', '#D4A574', 'warm', 0.00, 1, 1),
(5, 'White', '#FFFFFF', 'neutral', 25.00, 1, 2),
(5, 'Espresso', '#3C2414', 'warm', 35.00, 1, 3),
(6, 'Black', '#000000', 'neutral', 0.00, 1, 1),
(6, 'Navy Blue', '#000080', 'cool', 0.00, 1, 2),
(6, 'Charcoal Gray', '#36454F', 'neutral', 0.00, 1, 3);

-- Insert sample product materials
INSERT IGNORE INTO product_materials (product_id, material_name, material_type, description, price_adjustment, durability_rating, maintenance_level, is_eco_friendly, is_available) VALUES 
(1, 'Basswood', 'wood', 'Premium basswood with smooth finish', 0.00, 4, 'medium', 1, 1),
(1, 'Bamboo', 'wood', 'Sustainable bamboo alternative', 20.00, 5, 'low', 1, 1),
(2, 'Aluminum', 'metal', 'Lightweight and rust-resistant aluminum', 0.00, 5, 'low', 0, 1),
(3, 'Polyester Fabric', 'fabric', 'Durable polyester honeycomb cells', 0.00, 4, 'low', 0, 1),
(3, 'Recycled Polyester', 'fabric', 'Eco-friendly recycled materials', 15.00, 4, 'low', 1, 1),
(4, 'Cotton Blend', 'fabric', 'Natural cotton blend fabric', 0.00, 3, 'medium', 1, 1),
(4, 'Linen', 'fabric', 'Premium natural linen', 25.00, 3, 'high', 1, 1),
(5, 'Hardwood', 'wood', 'Solid hardwood construction', 0.00, 5, 'medium', 1, 1),
(5, 'Composite', 'composite', 'Durable composite material', -50.00, 4, 'low', 0, 1),
(6, 'Blackout Fabric', 'fabric', 'Triple-weave blackout material', 0.00, 4, 'low', 0, 1);

-- Insert sample product rooms
INSERT IGNORE INTO product_rooms (product_id, room_type, suitability_score, special_considerations) VALUES 
(1, 'living_room', 9, 'Perfect for living rooms with natural wood aesthetic'),
(1, 'bedroom', 8, 'Provides excellent light control for sleep'),
(1, 'office', 9, 'Professional appearance suitable for home offices'),
(2, 'kitchen', 9, 'Moisture-resistant, easy to clean'),
(2, 'bathroom', 8, 'Suitable for high-humidity environments'),
(2, 'laundry_room', 9, 'Durable and practical for utility spaces'),
(3, 'bedroom', 10, 'Excellent insulation for better sleep'),
(3, 'living_room', 8, 'Energy-efficient for main living areas'),
(3, 'nursery', 9, 'Safe and energy-efficient for babies'),
(4, 'living_room', 9, 'Elegant design enhances room aesthetics'),
(4, 'dining_room', 8, 'Sophisticated look for formal dining'),
(4, 'bedroom', 7, 'Soft light filtering for comfortable ambiance'),
(5, 'living_room', 10, 'Premium appearance adds home value'),
(5, 'master_bedroom', 9, 'Luxury feel for primary bedroom'),
(5, 'study', 8, 'Classic look perfect for home libraries'),
(6, 'bedroom', 10, 'Complete darkness for optimal sleep'),
(6, 'media_room', 10, 'Perfect for home theaters'),
(6, 'nursery', 8, 'Helps maintain baby sleep schedules');

-- Insert sample product specifications
INSERT IGNORE INTO product_specifications (product_id, spec_name, spec_value, spec_unit, spec_category, display_order, is_key_spec) VALUES 
(1, 'Slat Width', '2', 'inches', 'dimensions', 1, 1),
(1, 'Light Control', 'Excellent', NULL, 'performance', 2, 1),
(1, 'Privacy Level', 'Complete when closed', NULL, 'performance', 3, 1),
(1, 'Operating System', 'Cordless lift', NULL, 'operation', 4, 0),
(2, 'Slat Width', '1', 'inches', 'dimensions', 1, 1),
(2, 'Material Thickness', '0.006', 'inches', 'technical', 2, 0),
(2, 'Rust Resistance', 'Yes', NULL, 'performance', 3, 1),
(2, 'Weight', 'Lightweight', NULL, 'technical', 4, 0),
(3, 'Cell Size', 'Single Cell', NULL, 'technical', 1, 1),
(3, 'R-Value', '3.8', NULL, 'energy', 2, 1),
(3, 'Opacity', 'Light Filtering', NULL, 'performance', 3, 1),
(3, 'Sound Absorption', 'High', NULL, 'comfort', 4, 0),
(4, 'Fold Style', 'Flat Roman', NULL, 'design', 1, 1),
(4, 'Fabric Weight', 'Medium', NULL, 'technical', 2, 0),
(4, 'Light Filtering', 'Moderate', NULL, 'performance', 3, 1),
(4, 'Cordless Operation', 'Yes', NULL, 'operation', 4, 1),
(5, 'Louver Width', '3.5', 'inches', 'dimensions', 1, 1),
(5, 'Frame Style', 'Z-Frame', NULL, 'technical', 2, 0),
(5, 'Tilt Control', '180 degrees', NULL, 'operation', 3, 1),
(5, 'Installation Type', 'Inside or Outside Mount', NULL, 'installation', 4, 0),
(6, 'Light Blocking', '99%', 'percent', 'performance', 1, 1),
(6, 'Fabric Layers', 'Triple Weave', NULL, 'technical', 2, 1),
(6, 'Thermal Insulation', 'High', NULL, 'energy', 3, 1),
(6, 'Noise Reduction', 'Excellent', NULL, 'comfort', 4, 0);

-- Insert sample product pricing matrix
INSERT IGNORE INTO product_pricing_matrix (product_id, width_min, width_max, height_min, height_max, base_price, price_per_sqft, is_active) VALUES 
(1, 12.00, 36.00, 12.00, 72.00, 89.99, 2.50, 1),
(1, 36.01, 60.00, 12.00, 72.00, 129.99, 3.00, 1),
(1, 60.01, 84.00, 12.00, 72.00, 169.99, 3.50, 1),
(2, 12.00, 36.00, 12.00, 72.00, 29.99, 1.25, 1),
(2, 36.01, 60.00, 12.00, 72.00, 49.99, 1.50, 1),
(2, 60.01, 84.00, 12.00, 72.00, 69.99, 1.75, 1),
(3, 12.00, 36.00, 12.00, 72.00, 119.99, 4.00, 1),
(3, 36.01, 60.00, 12.00, 72.00, 179.99, 4.50, 1),
(3, 60.01, 84.00, 12.00, 72.00, 239.99, 5.00, 1);

-- Insert sample product bundles
INSERT IGNORE INTO product_bundles (bundle_id, name, description, bundle_price, discount_percentage, is_active) VALUES 
(1, 'Complete Bedroom Package', 'Venetian blinds and blackout curtains for perfect bedroom privacy', 199.99, 10.00, 1),
(2, 'Kitchen & Bath Combo', 'Aluminum mini blinds perfect for moisture-prone areas', 89.99, 15.00, 1),
(3, 'Living Room Luxury', 'Plantation shutters and cellular shades for elegant living spaces', 449.99, 12.00, 1);

-- Insert sample product bundle items
INSERT IGNORE INTO product_bundle_items (bundle_id, product_id, quantity, discount_percentage, is_required) VALUES 
(1, 1, 1, 5.00, 1),
(1, 6, 1, 5.00, 1),
(2, 2, 2, 7.50, 1),
(3, 5, 1, 6.00, 1),
(3, 3, 1, 6.00, 1);

-- Insert sample product relations
INSERT IGNORE INTO product_relations (product_id, related_product_id, relation_type, strength_score) VALUES 
(1, 6, 'complement', 8), -- Venetian blinds + blackout curtains
(1, 3, 'alternative', 6), -- Venetian blinds alternative to cellular shades
(2, 1, 'upgrade', 7), -- Aluminum to wood upgrade
(3, 1, 'alternative', 6), -- Cellular shades alternative to venetian
(4, 5, 'complement', 5), -- Roman shades + shutters
(5, 1, 'alternative', 8), -- Shutters alternative to blinds
(6, 1, 'complement', 9), -- Blackout curtains + venetian blinds
(6, 3, 'complement', 7); -- Blackout curtains + cellular shades

-- Insert sample content categories
INSERT IGNORE INTO content_categories (category_id, name, slug, description, icon, is_active, display_order) VALUES 
(1, 'Installation Guides', 'installation-guides', 'Step-by-step installation instructions', 'tool', 1, 1),
(2, 'Measuring Tutorials', 'measuring-tutorials', 'How to measure windows accurately', 'ruler', 1, 2),
(3, 'Style Guides', 'style-guides', 'Design inspiration and style tips', 'palette', 1, 3),
(4, 'Care & Maintenance', 'care-maintenance', 'How to care for your window treatments', 'shield-check', 1, 4),
(5, 'FAQs', 'faqs', 'Frequently asked questions', 'help-circle', 1, 5);

-- Insert sample content articles
INSERT IGNORE INTO content_articles (category_id, title, slug, excerpt, content, content_type, difficulty_level, estimated_read_time, is_published, is_featured, view_count) VALUES 
(1, 'How to Install Venetian Blinds', 'how-to-install-venetian-blinds', 'Complete guide to installing venetian blinds inside or outside mount.', 'Step-by-step installation guide with photos and video...', 'guide', 'beginner', 15, 1, 1, 245),
(2, 'Measuring Windows for Blinds', 'measuring-windows-for-blinds', 'Learn the proper technique for measuring windows accurately.', 'Accurate measuring is crucial for a perfect fit...', 'tutorial', 'beginner', 10, 1, 1, 182),
(3, 'Choosing Colors for Your Room', 'choosing-colors-for-your-room', 'Expert tips on selecting the perfect colors for your space.', 'Color selection can make or break your interior design...', 'guide', 'intermediate', 20, 1, 0, 98),
(4, 'Cleaning Cellular Shades', 'cleaning-cellular-shades', 'Proper care techniques to keep your shades looking new.', 'Regular maintenance extends the life of your shades...', 'tip', 'beginner', 5, 1, 0, 67);

-- Insert sample search suggestions
INSERT IGNORE INTO search_suggestions (suggestion_text, suggestion_type, reference_id, search_count, is_active) VALUES 
('blackout curtains', 'product', 6, 45, 1),
('cellular shades', 'product', 3, 38, 1),
('venetian blinds', 'product', 1, 52, 1),
('bedroom', 'room', NULL, 29, 1),
('living room', 'room', NULL, 41, 1),
('kitchen', 'room', NULL, 23, 1),
('energy efficient', 'feature', 3, 19, 1),
('child safe', 'feature', 6, 15, 1),
('hunter douglas', 'brand', 1, 34, 1),
('plantation shutters', 'product', 5, 31, 1);

-- Insert sample trade applications
INSERT IGNORE INTO trade_applications (user_id, business_name, business_type, license_number, years_in_business, annual_volume_estimate, business_phone, business_email, application_status, trade_discount_percentage, net_payment_terms) VALUES 
(4, 'Elite Interior Design Studio', 'interior_designer', 'ID-2024-789', 8, 250000.00, '555-DESIGN', 'sales@smartblindshub.com', 'approved', 20.00, 30);

-- Insert sample trade projects
INSERT IGNORE INTO trade_projects (user_id, client_name, project_name, project_type, estimated_budget, project_timeline, start_date, status, room_count, window_count) VALUES 
(4, 'Johnson Residence', 'Master Bedroom & Living Room Makeover', 'residential', 15000.00, '4 weeks', '2024-07-01', 'planning', 2, 8);

-- Insert sample room measurements
INSERT IGNORE INTO room_measurements (user_id, room_name, room_type, window_measurements, measurement_notes, is_professional_measured) VALUES 
(3, 'Master Bedroom', 'bedroom', '{"windows": [{"name": "Main Window", "width": 48, "height": 60, "depth": 3}]}', 'Large window facing east with morning sun', 0),
(3, 'Living Room', 'living_room', '{"windows": [{"name": "Front Window", "width": 72, "height": 48}, {"name": "Side Window", "width": 36, "height": 60}]}', 'Two windows, main one faces street', 0);

-- Insert sample room shopping lists
INSERT IGNORE INTO room_shopping_lists (user_id, list_name, room_measurement_id, estimated_total, notes) VALUES 
(3, 'Master Bedroom Window Treatments', 1, 189.99, 'Need blackout for better sleep'),
(3, 'Living Room Upgrade', 2, 299.99, 'Looking for elegant plantation shutters');

-- Insert sample room shopping list items
INSERT IGNORE INTO room_shopping_list_items (list_id, product_id, window_name, estimated_price, quantity, notes) VALUES 
(1, 6, 'Main Window', 89.99, 1, 'Black blackout curtains for bedroom'),
(2, 5, 'Front Window', 299.99, 1, 'White plantation shutters for main window'),
(2, 1, 'Side Window', 129.99, 1, 'Matching wood blinds for side window');

-- Re-enable foreign key checks after migrations
SET FOREIGN_KEY_CHECKS = 1;

-- Verify all tables were created successfully
SHOW TABLES;
