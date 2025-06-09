-- Add payment integrations support
-- This migration adds tables and updates for PayPal, Klarna, Afterpay, and Affirm integrations

-- Create payment_intents table for tracking payment provider sessions
CREATE TABLE IF NOT EXISTS payment_intents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  provider ENUM('stripe', 'paypal', 'klarna', 'afterpay', 'affirm') NOT NULL,
  provider_order_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'completed', 'failed', 'cancelled', 'expired') DEFAULT 'pending',
  captured_amount DECIMAL(10,2) NULL,
  order_data JSON NULL,
  processor_response JSON NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_order (provider, provider_order_id),
  INDEX idx_user_provider (user_id, provider),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Update saved_payment_methods table to support new payment types
-- Check and add columns one by one to avoid syntax errors
SET @sql = CONCAT('ALTER TABLE saved_payment_methods ADD COLUMN provider VARCHAR(50) DEFAULT ''stripe''');
SET @sql_check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'blindscommerce' AND TABLE_NAME = 'saved_payment_methods' AND COLUMN_NAME = 'provider');
SET @sql_final = IF(@sql_check = 0, @sql, 'SELECT ''Column provider already exists'' as message');
PREPARE stmt FROM @sql_final; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE saved_payment_methods ADD COLUMN external_id VARCHAR(255) NULL');
SET @sql_check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'blindscommerce' AND TABLE_NAME = 'saved_payment_methods' AND COLUMN_NAME = 'external_id');
SET @sql_final = IF(@sql_check = 0, @sql, 'SELECT ''Column external_id already exists'' as message');
PREPARE stmt FROM @sql_final; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE saved_payment_methods ADD COLUMN payment_data JSON NULL');
SET @sql_check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'blindscommerce' AND TABLE_NAME = 'saved_payment_methods' AND COLUMN_NAME = 'payment_data');
SET @sql_final = IF(@sql_check = 0, @sql, 'SELECT ''Column payment_data already exists'' as message');
PREPARE stmt FROM @sql_final; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add indexes for better performance
CREATE INDEX idx_saved_payment_provider ON saved_payment_methods(user_id, provider);
CREATE INDEX idx_saved_payment_external ON saved_payment_methods(provider, external_id);

-- Update payments table to support new payment methods
ALTER TABLE payments 
MODIFY COLUMN payment_method ENUM(
  'credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer',
  'klarna', 'afterpay', 'affirm', 'apple_pay', 'google_pay'
) NOT NULL;

-- Create payment_method_configurations table for storing provider settings
CREATE TABLE IF NOT EXISTS payment_method_configurations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL,
  method_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0.01,
  max_amount DECIMAL(10,2) DEFAULT 999999.99,
  supported_currencies JSON NULL,
  supported_countries JSON NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  configuration JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider_method (provider, method_id),
  INDEX idx_active_methods (is_active, sort_order)
);

-- Insert default payment method configurations
INSERT INTO payment_method_configurations (
  provider, method_id, display_name, description, 
  min_amount, max_amount, supported_currencies, supported_countries,
  is_active, sort_order, configuration
) VALUES 
-- Stripe methods
('stripe', 'card', 'Credit/Debit Card', 'Visa, Mastercard, American Express, Discover', 
 0.50, 999999.99, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
 true, 1, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant"}'),

('stripe', 'apple_pay', 'Apple Pay', 'Pay securely with Touch ID or Face ID', 
 0.50, 999999.99, '["USD", "EUR", "GBP", "CAD"]', '["US", "CA", "GB", "AU"]',
 true, 2, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant", "device_requirements": ["iOS", "macOS", "Safari"]}'),

('stripe', 'google_pay', 'Google Pay', 'Pay quickly with your Google account', 
 0.50, 999999.99, '["USD", "EUR", "GBP", "CAD"]', '["US", "CA", "GB", "AU"]',
 true, 3, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant", "device_requirements": ["Android", "Chrome"]}'),

('stripe', 'ach', 'Bank Transfer (ACH)', 'Direct debit from your US bank account', 
 0.50, 500000.00, '["USD"]', '["US"]',
 true, 4, '{"fee_fixed": 0.80, "processing_time": "3-5 business days"}'),

-- PayPal methods
('paypal', 'paypal', 'PayPal', 'Pay with your PayPal account or PayPal Credit', 
 0.01, 10000.00, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
 true, 5, '{"fee_percentage": 3.49, "fee_fixed": 0.49, "processing_time": "instant"}'),

-- BNPL methods
('klarna', 'klarna', 'Klarna', 'Pay in 4 interest-free installments', 
 1.00, 10000.00, '["USD", "EUR", "GBP", "SEK"]', '["US", "CA", "GB", "SE", "DE", "AT"]',
 true, 6, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),

('afterpay', 'afterpay', 'Afterpay', 'Pay in 4 installments, always interest-free', 
 1.00, 4000.00, '["USD", "AUD", "CAD", "GBP"]', '["US", "CA", "AU", "GB"]',
 true, 7, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),

('affirm', 'affirm', 'Affirm', 'Monthly payments as low as 0% APR', 
 50.00, 17500.00, '["USD", "CAD"]', '["US", "CA"]',
 true, 8, '{"installments": [3, 6, 12, 18, 24, 36], "installment_frequency": "monthly", "interest_rate_range": [0, 36], "credit_check": "soft", "prequalification": true}')

ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description),
  min_amount = VALUES(min_amount),
  max_amount = VALUES(max_amount),
  supported_currencies = VALUES(supported_currencies),
  supported_countries = VALUES(supported_countries),
  configuration = VALUES(configuration),
  updated_at = CURRENT_TIMESTAMP;

-- Create payment_analytics table for tracking payment method performance
CREATE TABLE IF NOT EXISTS payment_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  total_transactions INT DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  successful_transactions INT DEFAULT 0,
  failed_transactions INT DEFAULT 0,
  average_amount DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date_method (date, payment_method, provider),
  INDEX idx_date_provider (date, provider),
  INDEX idx_method_performance (payment_method, successful_transactions)
);

-- Create payment_disputes table for handling chargebacks and disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  dispute_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  dispute_type ENUM('chargeback', 'inquiry', 'retrieval_request', 'pre_arbitration') NOT NULL,
  status ENUM('open', 'under_review', 'accepted', 'disputed', 'won', 'lost') DEFAULT 'open',
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  reason_code VARCHAR(50) NULL,
  reason_description TEXT NULL,
  evidence_due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  UNIQUE KEY unique_dispute (provider, dispute_id),
  INDEX idx_status_due_date (status, evidence_due_date)
);

-- Create payment_refunds table for tracking refunds across all providers
CREATE TABLE IF NOT EXISTS payment_refunds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  refund_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  reason ENUM('requested_by_customer', 'duplicate', 'fraudulent', 'other') DEFAULT 'requested_by_customer',
  reason_description TEXT NULL,
  status ENUM('pending', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
  processor_response JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  UNIQUE KEY unique_refund (provider, refund_id),
  INDEX idx_payment_refunds (payment_id),
  INDEX idx_status_date (status, created_at)
);