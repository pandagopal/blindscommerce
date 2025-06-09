-- Analytics Tables Migration
-- This migration adds the required analytics tables for the admin dashboard
-- Created on: 2025-06-09

USE blindscommerce;

-- Disable foreign key checks during migrations
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- ANALYTICS CORE TABLES
-- =============================================================================

-- Analytics events table for tracking individual user actions
CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT NULL,
    event_type ENUM('page_view', 'click', 'engagement', 'conversion', 'error') NOT NULL,
    event_action VARCHAR(100) NOT NULL, -- product_view, add_to_cart, begin_checkout, purchase, etc.
    event_category VARCHAR(100) DEFAULT NULL, -- product, checkout, navigation, etc.
    event_label VARCHAR(255) DEFAULT NULL,
    event_value DECIMAL(10,2) DEFAULT NULL,
    
    -- Page/Product context
    page_path VARCHAR(500) DEFAULT NULL,
    page_title VARCHAR(255) DEFAULT NULL,
    page_referrer VARCHAR(500) DEFAULT NULL,
    product_id INT DEFAULT NULL,
    
    -- User/Session context
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT NULL,
    browser VARCHAR(100) DEFAULT NULL,
    operating_system VARCHAR(100) DEFAULT NULL,
    screen_resolution VARCHAR(20) DEFAULT NULL,
    
    -- Traffic source context
    utm_source VARCHAR(100) DEFAULT NULL,
    utm_medium VARCHAR(100) DEFAULT NULL,
    utm_campaign VARCHAR(100) DEFAULT NULL,
    utm_term VARCHAR(100) DEFAULT NULL,
    utm_content VARCHAR(100) DEFAULT NULL,
    
    -- Location context
    country VARCHAR(100) DEFAULT NULL,
    region VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    
    -- Technical context
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_analytics_session (session_id),
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_event_type (event_type),
    INDEX idx_analytics_event_action (event_action),
    INDEX idx_analytics_product (product_id),
    INDEX idx_analytics_created_at (created_at),
    INDEX idx_analytics_page_path (page_path),
    INDEX idx_analytics_device (device_type),
    INDEX idx_analytics_utm_source (utm_source),
    INDEX idx_analytics_date_range (created_at, event_type),
    
    CONSTRAINT fk_analytics_events_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_analytics_events_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily analytics summary table for faster dashboard queries
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL,
    
    -- Traffic metrics
    total_sessions INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    page_views INT DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    avg_session_duration INT DEFAULT 0, -- seconds
    
    -- E-commerce metrics
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    avg_order_value DECIMAL(10,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    cart_abandonment_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    
    -- Product metrics
    products_viewed INT DEFAULT 0,
    products_added_to_cart INT DEFAULT 0,
    
    -- User metrics
    new_users INT DEFAULT 0,
    returning_users INT DEFAULT 0,
    
    -- Device breakdown
    desktop_sessions INT DEFAULT 0,
    mobile_sessions INT DEFAULT 0,
    tablet_sessions INT DEFAULT 0,
    
    -- Traffic source breakdown
    organic_sessions INT DEFAULT 0,
    paid_sessions INT DEFAULT 0,
    social_sessions INT DEFAULT 0,
    direct_sessions INT DEFAULT 0,
    referral_sessions INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_summary_date (summary_date),
    INDEX idx_summary_date (summary_date),
    INDEX idx_summary_revenue (total_revenue),
    INDEX idx_summary_sessions (total_sessions)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics user sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS analytics_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NULL,
    
    -- Session timing
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP NULL,
    session_duration INT DEFAULT NULL, -- seconds
    
    -- Session metrics
    page_views INT DEFAULT 0,
    events_count INT DEFAULT 0,
    is_bounce BOOLEAN DEFAULT FALSE,
    
    -- First page/referrer
    landing_page VARCHAR(500) DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    
    -- User context
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT NULL,
    browser VARCHAR(100) DEFAULT NULL,
    operating_system VARCHAR(100) DEFAULT NULL,
    
    -- Traffic source
    utm_source VARCHAR(100) DEFAULT NULL,
    utm_medium VARCHAR(100) DEFAULT NULL,
    utm_campaign VARCHAR(100) DEFAULT NULL,
    
    -- Location
    country VARCHAR(100) DEFAULT NULL,
    region VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    
    -- Technical
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_start (session_start),
    INDEX idx_sessions_device (device_type),
    INDEX idx_sessions_source (utm_source),
    INDEX idx_sessions_date_range (session_start, session_end),
    
    CONSTRAINT fk_analytics_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics product performance table
CREATE TABLE IF NOT EXISTS analytics_product_performance (
    performance_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    date DATE NOT NULL,
    
    -- View metrics
    views INT DEFAULT 0,
    unique_views INT DEFAULT 0,
    
    -- Engagement metrics
    cart_adds INT DEFAULT 0,
    purchases INT DEFAULT 0,
    
    -- Revenue metrics
    revenue DECIMAL(12,2) DEFAULT 0.00,
    avg_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Conversion metrics
    view_to_cart_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    cart_to_purchase_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_product_date (product_id, date),
    INDEX idx_performance_date (date),
    INDEX idx_performance_views (views),
    INDEX idx_performance_revenue (revenue),
    
    CONSTRAINT fk_analytics_performance_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample analytics events for the last 30 days
INSERT IGNORE INTO analytics_events (
    session_id, user_id, event_type, event_action, event_category, 
    page_path, page_title, product_id, device_type, browser,
    utm_source, utm_medium, created_at
) VALUES
('sess_001', 1, 'page_view', 'page_view', 'navigation', '/', 'Home Page', NULL, 'desktop', 'Chrome', 'google', 'organic', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sess_001', 1, 'page_view', 'page_view', 'navigation', '/products', 'Products', NULL, 'desktop', 'Chrome', 'google', 'organic', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sess_002', 2, 'page_view', 'product_view', 'product', '/products/cellular-shades', 'Cellular Shades', 1, 'mobile', 'Safari', 'facebook', 'social', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('sess_003', NULL, 'page_view', 'page_view', 'navigation', '/', 'Home Page', NULL, 'desktop', 'Firefox', 'direct', 'none', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('sess_002', 2, 'engagement', 'add_to_cart', 'product', '/products/cellular-shades', 'Cellular Shades', 1, 'mobile', 'Safari', 'facebook', 'social', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('sess_004', 3, 'page_view', 'product_view', 'product', '/products/roller-shades', 'Roller Shades', 2, 'tablet', 'Chrome', 'google', 'organic', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('sess_004', 3, 'engagement', 'add_to_cart', 'product', '/products/roller-shades', 'Roller Shades', 2, 'tablet', 'Chrome', 'google', 'organic', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('sess_002', 2, 'conversion', 'begin_checkout', 'checkout', '/checkout', 'Checkout', NULL, 'mobile', 'Safari', 'facebook', 'social', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('sess_002', 2, 'conversion', 'purchase', 'checkout', '/checkout/success', 'Order Complete', NULL, 'mobile', 'Safari', 'facebook', 'social', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Insert sample sessions
INSERT IGNORE INTO analytics_sessions (
    session_id, user_id, session_start, session_end, session_duration,
    page_views, events_count, is_bounce, landing_page, referrer,
    device_type, browser, utm_source, utm_medium
) VALUES
('sess_001', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 15 MINUTE, 900, 5, 8, FALSE, '/', 'https://google.com', 'desktop', 'Chrome', 'google', 'organic'),
('sess_002', 2, DATE_SUB(NOW(), INTERVAL 2 DAYS), DATE_SUB(NOW(), INTERVAL 2 DAYS) + INTERVAL 25 MINUTE, 1500, 8, 12, FALSE, '/', 'https://facebook.com', 'mobile', 'Safari', 'facebook', 'social'),
('sess_003', NULL, DATE_SUB(NOW(), INTERVAL 3 DAYS), DATE_SUB(NOW(), INTERVAL 3 DAYS) + INTERVAL 2 MINUTE, 120, 1, 1, TRUE, '/', NULL, 'desktop', 'Firefox', 'direct', 'none'),
('sess_004', 3, DATE_SUB(NOW(), INTERVAL 4 DAYS), DATE_SUB(NOW(), INTERVAL 4 DAYS) + INTERVAL 20 MINUTE, 1200, 6, 10, FALSE, '/products', 'https://google.com', 'tablet', 'Chrome', 'google', 'organic');

-- Insert sample daily summaries for the last 30 days
INSERT IGNORE INTO analytics_daily_summary (
    summary_date, total_sessions, unique_visitors, page_views, bounce_rate,
    avg_session_duration, total_orders, total_revenue, avg_order_value,
    conversion_rate, cart_abandonment_rate, products_viewed, products_added_to_cart,
    new_users, returning_users, desktop_sessions, mobile_sessions, tablet_sessions,
    organic_sessions, paid_sessions, social_sessions, direct_sessions, referral_sessions
) VALUES
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 145, 123, 487, 35.50, 420, 12, 2450.00, 204.17, 8.28, 65.20, 89, 45, 23, 100, 89, 45, 11, 78, 15, 25, 20, 7),
(DATE_SUB(CURDATE(), INTERVAL 2 DAYS), 132, 115, 445, 38.20, 385, 8, 1680.00, 210.00, 6.06, 70.15, 76, 38, 18, 97, 82, 38, 12, 71, 12, 22, 18, 9),
(DATE_SUB(CURDATE(), INTERVAL 3 DAYS), 158, 134, 523, 32.10, 465, 15, 3125.00, 208.33, 9.49, 58.90, 98, 52, 28, 106, 95, 48, 15, 85, 18, 28, 19, 8),
(DATE_SUB(CURDATE(), INTERVAL 4 DAYS), 167, 142, 578, 29.80, 495, 18, 3780.00, 210.00, 10.78, 55.40, 108, 62, 31, 111, 102, 52, 13, 92, 20, 31, 16, 8),
(DATE_SUB(CURDATE(), INTERVAL 5 DAYS), 189, 165, 634, 28.50, 520, 22, 4620.00, 210.00, 11.64, 52.30, 125, 72, 38, 127, 115, 58, 16, 105, 25, 35, 17, 7),
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 142, 118, 456, 36.90, 398, 9, 1890.00, 210.00, 6.34, 68.75, 82, 41, 22, 96, 88, 42, 12, 76, 14, 26, 19, 7),
(DATE_SUB(CURDATE(), INTERVAL 7 DAYS), 123, 105, 389, 41.20, 345, 6, 1260.00, 210.00, 4.88, 75.60, 68, 32, 15, 90, 75, 38, 10, 68, 11, 20, 16, 8);

-- Insert sample product performance data
INSERT IGNORE INTO analytics_product_performance (
    product_id, date, views, unique_views, cart_adds, purchases,
    revenue, avg_price, view_to_cart_rate, cart_to_purchase_rate
) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 45, 38, 12, 3, 630.00, 210.00, 31.58, 25.00),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 38, 32, 8, 2, 420.00, 210.00, 25.00, 25.00),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAYS), 52, 43, 15, 4, 840.00, 210.00, 34.88, 26.67),
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAYS), 41, 35, 9, 2, 420.00, 210.00, 25.71, 22.22),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAYS), 58, 49, 18, 5, 1050.00, 210.00, 36.73, 27.78),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAYS), 46, 39, 11, 3, 630.00, 210.00, 28.21, 27.27);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_events_session_date ON analytics_events(session_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_events_user_date ON analytics_events(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_summary_date_metrics ON analytics_daily_summary(summary_date, total_sessions, total_revenue);

-- Success message
SELECT 'Analytics tables created successfully!' as Status;