-- Create loyalty program tiers table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tier_name VARCHAR(100) NOT NULL,
  tier_level INT NOT NULL,
  minimum_spending DECIMAL(10,2) NOT NULL,
  points_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  -- Tier benefits
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  free_shipping_threshold DECIMAL(10,2) NULL,
  early_access_hours INT DEFAULT 0, -- Hours of early access to sales
  exclusive_products TINYINT(1) DEFAULT 0,
  priority_support TINYINT(1) DEFAULT 0,
  
  -- Tier styling
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
);

-- Create user loyalty accounts table
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
  tier_anniversary_date DATE NULL, -- When tier status resets
  next_tier_id INT NULL,
  points_to_next_tier INT DEFAULT 0,
  spending_to_next_tier DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  account_status ENUM('active', 'suspended', 'closed') DEFAULT 'active',
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_current_tier (current_tier_id),
  INDEX idx_account_status (account_status),
  INDEX idx_lifetime_spending (lifetime_spending),
  INDEX idx_last_activity (last_activity_date),
  
  CONSTRAINT fk_loyalty_account_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_loyalty_account_tier FOREIGN KEY (current_tier_id) REFERENCES loyalty_tiers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loyalty_account_next_tier FOREIGN KEY (next_tier_id) REFERENCES loyalty_tiers(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_user_loyalty (user_id)
);

-- Create loyalty points transactions table
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
  tier_bonus DECIMAL(3,2) DEFAULT 0.00,
  campaign_bonus DECIMAL(3,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_order_id (order_id),
  INDEX idx_earned_date (earned_date),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_reference (reference_type, reference_id),
  
  CONSTRAINT fk_loyalty_points_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_loyalty_points_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
  CONSTRAINT fk_loyalty_points_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  CONSTRAINT fk_loyalty_points_referral FOREIGN KEY (referral_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create loyalty rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reward_name VARCHAR(255) NOT NULL,
  reward_type ENUM('discount_percentage', 'discount_fixed', 'free_product', 'free_shipping', 'upgrade', 'exclusive_access') NOT NULL,
  
  -- Reward value
  points_cost INT NOT NULL,
  discount_value DECIMAL(10,2) NULL,
  discount_percentage DECIMAL(5,2) NULL,
  free_product_id INT NULL,
  
  -- Availability
  min_tier_level INT DEFAULT 1,
  max_uses_per_user INT NULL, -- NULL means unlimited
  total_available INT NULL, -- NULL means unlimited
  total_redeemed INT DEFAULT 0,
  
  -- Validity
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Restrictions
  applicable_categories JSON NULL, -- Array of category IDs
  excluded_products JSON NULL, -- Array of product IDs
  stackable_with_other_offers TINYINT(1) DEFAULT 0,
  
  -- Display
  reward_description TEXT NULL,
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
  
  CONSTRAINT fk_loyalty_reward_product FOREIGN KEY (free_product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- Create loyalty reward redemptions table
CREATE TABLE IF NOT EXISTS loyalty_reward_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reward_id INT NOT NULL,
  order_id INT NULL,
  
  -- Redemption details
  points_used INT NOT NULL,
  reward_value DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(100) NULL,
  
  -- Status tracking
  redemption_status ENUM('pending', 'applied', 'used', 'expired', 'cancelled') DEFAULT 'pending',
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  
  -- Usage tracking
  discount_applied DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_reward_id (reward_id),
  INDEX idx_order_id (order_id),
  INDEX idx_redemption_status (redemption_status),
  INDEX idx_redeemed_at (redeemed_at),
  INDEX idx_expires_at (expires_at),
  
  CONSTRAINT fk_loyalty_redemption_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_loyalty_redemption_reward FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  CONSTRAINT fk_loyalty_redemption_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

-- Insert default loyalty tiers
INSERT IGNORE INTO loyalty_tiers (tier_name, tier_level, minimum_spending, points_multiplier, discount_percentage, free_shipping_threshold, early_access_hours, tier_color, tier_description) VALUES
('Bronze', 1, 0.00, 1.00, 0.00, 99.00, 0, '#CD7F32', 'Welcome to our loyalty program! Earn points on every purchase.'),
('Silver', 2, 500.00, 1.25, 5.00, 75.00, 12, '#C0C0C0', 'Enjoy 5% discount and early access to sales.'),
('Gold', 3, 1500.00, 1.50, 10.00, 50.00, 24, '#FFD700', 'Get 10% discount, priority support, and exclusive products.'),
('Platinum', 4, 3000.00, 2.00, 15.00, 0.00, 48, '#E5E4E2', 'Our highest tier with 15% discount and all premium benefits.');

-- Insert default loyalty rewards
INSERT IGNORE INTO loyalty_rewards (reward_name, reward_type, points_cost, discount_percentage, min_tier_level, reward_description, is_active) VALUES
('5% Off Next Purchase', 'discount_percentage', 500, 5.00, 1, 'Get 5% off your next order (minimum $50)', 1),
('$10 Off', 'discount_fixed', 750, 10.00, 1, 'Get $10 off your next order (minimum $100)', 1),
('Free Shipping', 'free_shipping', 300, NULL, 1, 'Free shipping on your next order', 1),
('10% Off Premium Products', 'discount_percentage', 1000, 10.00, 2, 'Get 10% off any premium product (Silver tier and above)', 1),
('$25 Off', 'discount_fixed', 1500, 25.00, 2, 'Get $25 off your next order (minimum $200)', 1),
('15% Off Everything', 'discount_percentage', 2000, 15.00, 3, 'Get 15% off your entire order (Gold tier and above)', 1),
('$50 Off', 'discount_fixed', 3000, 50.00, 3, 'Get $50 off your next order (minimum $300)', 1),
('VIP Early Access', 'exclusive_access', 1200, NULL, 3, '48-hour early access to new products and sales', 1);

-- Trigger to automatically enroll users in loyalty program
DELIMITER //

CREATE TRIGGER auto_enroll_loyalty_program
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  DECLARE bronze_tier_id INT;
  
  -- Get Bronze tier ID
  SELECT id INTO bronze_tier_id FROM loyalty_tiers WHERE tier_level = 1 LIMIT 1;
  
  -- Create loyalty account for new user
  INSERT INTO user_loyalty_accounts (
    user_id,
    current_tier_id,
    tier_anniversary_date
  ) VALUES (
    NEW.user_id,
    bronze_tier_id,
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
  );
  
  -- Give signup bonus points
  INSERT INTO loyalty_points_transactions (
    user_id,
    transaction_type,
    points_amount,
    description,
    reference_type,
    expiry_date
  ) VALUES (
    NEW.user_id,
    'bonus',
    100,
    'Welcome bonus for joining our loyalty program',
    'signup',
    DATE_ADD(NOW(), INTERVAL 2 YEAR)
  );
  
  -- Update available points
  UPDATE user_loyalty_accounts 
  SET total_points_earned = 100,
      available_points = 100,
      last_activity_date = NOW()
  WHERE user_id = NEW.user_id;
END//

-- Trigger to award points on order completion
CREATE TRIGGER award_loyalty_points_on_order
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  DECLARE points_to_award INT;
  DECLARE tier_multiplier DECIMAL(3,2);
  DECLARE user_tier_id INT;
  
  -- Only process when order status changes to completed
  IF NEW.order_status = 'completed' AND OLD.order_status != 'completed' THEN
    
    -- Get user's current tier multiplier
    SELECT ula.current_tier_id, lt.points_multiplier 
    INTO user_tier_id, tier_multiplier
    FROM user_loyalty_accounts ula
    JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
    WHERE ula.user_id = NEW.user_id;
    
    -- Calculate points (1 point per dollar spent, multiplied by tier bonus)
    SET points_to_award = FLOOR(NEW.total_amount * tier_multiplier);
    
    -- Insert points transaction
    INSERT INTO loyalty_points_transactions (
      user_id,
      transaction_type,
      points_amount,
      order_id,
      description,
      reference_type,
      multiplier_applied,
      expiry_date
    ) VALUES (
      NEW.user_id,
      'earned',
      points_to_award,
      NEW.order_id,
      CONCAT('Points earned from order #', NEW.order_id),
      'purchase',
      tier_multiplier,
      DATE_ADD(NOW(), INTERVAL 2 YEAR)
    );
    
    -- Update user loyalty account
    UPDATE user_loyalty_accounts 
    SET total_points_earned = total_points_earned + points_to_award,
        available_points = available_points + points_to_award,
        lifetime_spending = lifetime_spending + NEW.total_amount,
        current_year_spending = current_year_spending + NEW.total_amount,
        last_purchase_date = NOW(),
        last_activity_date = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Check for tier upgrade
    CALL check_tier_upgrade(NEW.user_id);
  END IF;
END//

-- Procedure to check and upgrade user tier
CREATE PROCEDURE check_tier_upgrade(IN p_user_id INT)
BEGIN
  DECLARE current_spending DECIMAL(10,2);
  DECLARE current_tier_level INT;
  DECLARE new_tier_id INT;
  DECLARE new_tier_level INT;
  
  -- Get current user data
  SELECT ula.lifetime_spending, lt.tier_level
  INTO current_spending, current_tier_level
  FROM user_loyalty_accounts ula
  JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
  WHERE ula.user_id = p_user_id;
  
  -- Find the highest tier the user qualifies for
  SELECT id, tier_level
  INTO new_tier_id, new_tier_level
  FROM loyalty_tiers
  WHERE minimum_spending <= current_spending
    AND tier_level > current_tier_level
    AND is_active = 1
  ORDER BY tier_level DESC
  LIMIT 1;
  
  -- Update tier if user qualifies for upgrade
  IF new_tier_id IS NOT NULL THEN
    UPDATE user_loyalty_accounts 
    SET current_tier_id = new_tier_id,
        tier_anniversary_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
    WHERE user_id = p_user_id;
    
    -- Award tier upgrade bonus points
    INSERT INTO loyalty_points_transactions (
      user_id,
      transaction_type,
      points_amount,
      description,
      reference_type,
      expiry_date
    ) VALUES (
      p_user_id,
      'bonus',
      new_tier_level * 100, -- 200 for Silver, 300 for Gold, 400 for Platinum
      CONCAT('Tier upgrade bonus - Welcome to ', (SELECT tier_name FROM loyalty_tiers WHERE id = new_tier_id)),
      'signup',
      DATE_ADD(NOW(), INTERVAL 2 YEAR)
    );
    
    -- Update available points
    UPDATE user_loyalty_accounts 
    SET total_points_earned = total_points_earned + (new_tier_level * 100),
        available_points = available_points + (new_tier_level * 100)
    WHERE user_id = p_user_id;
  END IF;
END//

DELIMITER ;

SELECT 'Loyalty program tables created successfully!' as status;