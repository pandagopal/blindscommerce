-- Create saved payment methods table
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
  wallet_type VARCHAR(50) NULL, -- 'apple_pay', 'google_pay', 'paypal'
  wallet_email VARCHAR(255) NULL,
  
  -- Billing address (for card verification)
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
  nickname VARCHAR(100) NULL, -- User-friendly name like "Personal Card", "Business Account"
  
  -- Security and tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_stripe_pm (stripe_payment_method_id),
  INDEX idx_user_default (user_id, is_default),
  INDEX idx_user_active (user_id, is_active),
  
  -- Foreign key constraint
  CONSTRAINT fk_saved_payment_methods_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY unique_user_stripe_pm (user_id, stripe_payment_method_id)
);

-- Trigger to ensure only one default payment method per user
DELIMITER //

CREATE TRIGGER enforce_single_default_payment_method
BEFORE UPDATE ON saved_payment_methods
FOR EACH ROW
BEGIN
  -- If setting this payment method as default
  IF NEW.is_default = 1 AND OLD.is_default = 0 THEN
    -- Remove default flag from all other payment methods for this user
    UPDATE saved_payment_methods 
    SET is_default = 0 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
END//

CREATE TRIGGER enforce_single_default_payment_method_insert
BEFORE INSERT ON saved_payment_methods
FOR EACH ROW
BEGIN
  -- If inserting a new default payment method
  IF NEW.is_default = 1 THEN
    -- Remove default flag from all other payment methods for this user
    UPDATE saved_payment_methods 
    SET is_default = 0 
    WHERE user_id = NEW.user_id;
  END IF;
END//

DELIMITER ;

-- Create payment method usage tracking table
CREATE TABLE IF NOT EXISTS payment_method_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_method_id INT NOT NULL,
  order_id INT NULL,
  usage_type ENUM('order_payment', 'subscription', 'refund') DEFAULT 'order_payment',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'succeeded', 'failed', 'canceled') DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_payment_method (payment_method_id),
  INDEX idx_order_id (order_id),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_payment_usage_method FOREIGN KEY (payment_method_id) REFERENCES saved_payment_methods(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_usage_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

SELECT 'Saved payment methods tables created successfully!' as status;