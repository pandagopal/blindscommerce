-- Add commission and revenue sharing system
-- This migration adds tables for tracking vendor commissions and payments

USE blindscommerce;

-- Disable foreign key checks during migration
SET FOREIGN_KEY_CHECKS = 0;

-- Create vendor_commissions table for tracking individual commission records
CREATE TABLE IF NOT EXISTS vendor_commissions (
    commission_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    order_id INT NOT NULL,
    order_item_id INT NOT NULL,
    product_id INT NOT NULL,
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_status ENUM('pending', 'approved', 'paid', 'disputed') DEFAULT 'pending',
    commission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP NULL,
    payment_reference VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_commissions (vendor_id, commission_status),
    INDEX idx_order_commissions (order_id),
    INDEX idx_commission_date (commission_date),
    INDEX idx_payment_status (commission_status, payment_date),
    
    UNIQUE KEY unique_order_item_commission (order_item_id),
    
    CONSTRAINT fk_commission_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_order_item 
        FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_commission_product 
        FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_payments table for tracking bulk payments to vendors
CREATE TABLE IF NOT EXISTS vendor_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('bank_transfer', 'paypal', 'check', 'stripe', 'other') DEFAULT 'bank_transfer',
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_reference VARCHAR(255) NULL,
    payment_date TIMESTAMP NULL,
    commission_ids JSON NULL COMMENT 'Array of commission IDs included in this payment',
    payment_notes TEXT NULL,
    processed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_payments (vendor_id, payment_status),
    INDEX idx_payment_period (payment_period_start, payment_period_end),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_status (payment_status),
    
    CONSTRAINT fk_vendor_payment_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_vendor_payment_processor 
        FOREIGN KEY (processed_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_ratings table for customer ratings of vendors
CREATE TABLE IF NOT EXISTS vendor_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review_title VARCHAR(255) NULL,
    review_text TEXT NULL,
    delivery_rating DECIMAL(2,1) NULL CHECK (delivery_rating >= 1.0 AND delivery_rating <= 5.0),
    product_quality_rating DECIMAL(2,1) NULL CHECK (product_quality_rating >= 1.0 AND product_quality_rating <= 5.0),
    communication_rating DECIMAL(2,1) NULL CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_ratings (vendor_id, is_approved),
    INDEX idx_order_ratings (order_id),
    INDEX idx_user_ratings (user_id),
    INDEX idx_rating_value (rating),
    
    UNIQUE KEY unique_vendor_order_rating (vendor_id, order_id, user_id),
    
    CONSTRAINT fk_vendor_rating_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_vendor_rating_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_vendor_rating_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create commission_disputes table for handling commission disputes
CREATE TABLE IF NOT EXISTS commission_disputes (
    dispute_id INT AUTO_INCREMENT PRIMARY KEY,
    commission_id INT NOT NULL,
    vendor_id INT NOT NULL,
    dispute_type ENUM('amount', 'payment_delay', 'order_issue', 'other') NOT NULL,
    dispute_reason TEXT NOT NULL,
    dispute_status ENUM('open', 'under_review', 'resolved', 'rejected') DEFAULT 'open',
    vendor_evidence TEXT NULL,
    admin_response TEXT NULL,
    resolution_notes TEXT NULL,
    disputed_amount DECIMAL(10,2) NULL,
    resolved_amount DECIMAL(10,2) NULL,
    created_by INT NOT NULL,
    assigned_to INT NULL,
    resolved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    INDEX idx_commission_disputes (commission_id),
    INDEX idx_vendor_disputes (vendor_id, dispute_status),
    INDEX idx_dispute_status (dispute_status),
    INDEX idx_assigned_disputes (assigned_to),
    
    CONSTRAINT fk_dispute_commission 
        FOREIGN KEY (commission_id) REFERENCES vendor_commissions(commission_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_dispute_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_dispute_creator 
        FOREIGN KEY (created_by) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_dispute_assignee 
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_dispute_resolver 
        FOREIGN KEY (resolved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update vendor_info table to include more commission-related fields
ALTER TABLE vendor_info 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00 COMMENT 'Commission percentage for this vendor',
ADD COLUMN IF NOT EXISTS payment_terms ENUM('weekly', 'bi_weekly', 'monthly', 'quarterly') DEFAULT 'monthly' COMMENT 'How often vendor gets paid',
ADD COLUMN IF NOT EXISTS minimum_payout DECIMAL(8,2) DEFAULT 50.00 COMMENT 'Minimum amount before payout',
ADD COLUMN IF NOT EXISTS payment_method ENUM('bank_transfer', 'paypal', 'check', 'stripe') DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS bank_account_info JSON NULL COMMENT 'Encrypted bank account details',
ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS tax_form_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_payout_enabled BOOLEAN DEFAULT FALSE;

-- Create view for vendor commission summary
CREATE OR REPLACE VIEW vendor_commission_summary AS
SELECT 
    vi.vendor_info_id,
    vi.user_id,
    vi.business_name,
    vi.commission_rate,
    vi.total_sales,
    COUNT(vc.commission_id) as total_commission_records,
    SUM(CASE WHEN vc.commission_status = 'pending' THEN vc.commission_amount ELSE 0 END) as pending_commissions,
    SUM(CASE WHEN vc.commission_status = 'approved' THEN vc.commission_amount ELSE 0 END) as approved_commissions,
    SUM(CASE WHEN vc.commission_status = 'paid' THEN vc.commission_amount ELSE 0 END) as paid_commissions,
    SUM(vc.commission_amount) as total_commissions,
    MAX(vc.commission_date) as last_commission_date,
    AVG(vr.rating) as average_rating,
    COUNT(vr.rating_id) as total_ratings
FROM vendor_info vi
LEFT JOIN vendor_commissions vc ON vi.vendor_info_id = vc.vendor_id
LEFT JOIN vendor_ratings vr ON vi.vendor_info_id = vr.vendor_id AND vr.is_approved = TRUE
GROUP BY vi.vendor_info_id, vi.user_id, vi.business_name, vi.commission_rate, vi.total_sales;

-- Create performance indexes
CREATE INDEX idx_commission_calculations ON vendor_commissions(vendor_id, commission_status, commission_date);
CREATE INDEX idx_payment_processing ON vendor_payments(vendor_id, payment_status, payment_period_end);
CREATE INDEX idx_vendor_performance ON vendor_ratings(vendor_id, rating, created_at);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Commission system tables created successfully' AS Status;