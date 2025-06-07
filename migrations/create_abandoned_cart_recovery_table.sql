-- Create abandoned cart recovery tracking table
CREATE TABLE IF NOT EXISTS abandoned_cart_recovery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Cart identification
  cart_id VARCHAR(255) NOT NULL, -- Could be session ID for guests or user cart ID
  user_id INT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Cart contents snapshot
  cart_data JSON NOT NULL, -- Full cart snapshot including items, prices, etc.
  total_value DECIMAL(10,2) NOT NULL,
  item_count INT NOT NULL,
  
  -- Recovery campaign tracking
  recovery_status ENUM('pending', 'email_sent', 'reminder_sent', 'recovered', 'expired', 'opted_out') DEFAULT 'pending',
  recovery_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for recovery links
  
  -- Email campaign tracking
  first_email_sent_at TIMESTAMP NULL,
  reminder_email_sent_at TIMESTAMP NULL,
  last_email_sent_at TIMESTAMP NULL,
  email_open_count INT DEFAULT 0,
  email_click_count INT DEFAULT 0,
  
  -- Recovery tracking
  recovered_at TIMESTAMP NULL,
  recovery_order_id INT NULL, -- If cart was converted to order
  recovery_value DECIMAL(10,2) DEFAULT 0.00, -- Value of recovered order
  
  -- Campaign settings
  send_first_email_after INT DEFAULT 1440, -- Minutes (24 hours)
  send_reminder_after INT DEFAULT 4320, -- Minutes (72 hours)
  expire_after INT DEFAULT 10080, -- Minutes (7 days)
  
  -- Personalization data
  customer_name VARCHAR(255) NULL,
  preferred_contact_time ENUM('morning', 'afternoon', 'evening', 'any') DEFAULT 'any',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Tracking and analytics
  source_page VARCHAR(500) NULL, -- Page where cart was abandoned
  device_type VARCHAR(50) NULL,
  browser VARCHAR(100) NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_cart_id (cart_id),
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_recovery_status (recovery_status),
  INDEX idx_recovery_token (recovery_token),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at),
  INDEX idx_email_timing (first_email_sent_at, reminder_email_sent_at),
  
  -- Foreign key constraints
  CONSTRAINT fk_abandoned_cart_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_abandoned_cart_order FOREIGN KEY (recovery_order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

-- Create abandoned cart email templates table
CREATE TABLE IF NOT EXISTS abandoned_cart_email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  template_type ENUM('first_email', 'reminder_email', 'final_reminder') NOT NULL,
  subject_line VARCHAR(255) NOT NULL,
  email_content TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  
  -- A/B testing support
  template_variant VARCHAR(50) DEFAULT 'default',
  test_percentage DECIMAL(5,2) DEFAULT 100.00, -- What percentage of users get this template
  
  -- Performance tracking
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  recovery_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template_type (template_type),
  INDEX idx_active (is_active),
  INDEX idx_variant (template_variant),
  UNIQUE KEY unique_template_variant (template_type, template_variant)
);

-- Create cart recovery interactions table
CREATE TABLE IF NOT EXISTS cart_recovery_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recovery_id INT NOT NULL,
  interaction_type ENUM('email_sent', 'email_opened', 'email_clicked', 'cart_visited', 'item_added', 'checkout_started', 'order_completed') NOT NULL,
  interaction_data JSON NULL, -- Additional data about the interaction
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  referrer VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_recovery_id (recovery_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_recovery_interactions FOREIGN KEY (recovery_id) REFERENCES abandoned_cart_recovery(id) ON DELETE CASCADE
);

-- Insert default email templates
INSERT IGNORE INTO abandoned_cart_email_templates (template_name, template_type, subject_line, email_content, template_variant) VALUES
('First Reminder', 'first_email', 'You left something in your cart! 🛒', '
<html>
<head><title>Complete Your Purchase</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background-color: #f8f9fa;">
    <h1 style="color: #333; text-align: center;">Don''t Let These Slip Away!</h1>
    <p>Hi {{customer_name}},</p>
    <p>We noticed you left some items in your cart. Don''t worry, we''ve saved them for you!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Your Cart ({{item_count}} items - ${{total_value}})</h3>
      {{cart_items}}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{recovery_link}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Purchase</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This cart will expire in 7 days. Complete your purchase now to secure these items!</p>
  </div>
</body>
</html>
', 'default'),

('Reminder Follow-up', 'reminder_email', 'Still thinking it over? Your cart is waiting! 💭', '
<html>
<head><title>Your Cart is Still Available</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background-color: #f8f9fa;">
    <h1 style="color: #333; text-align: center;">Your Cart is Still Waiting</h1>
    <p>Hi {{customer_name}},</p>
    <p>We understand that sometimes you need time to think about your purchase. Your cart is still available with these great items:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Your Saved Items ({{item_count}} items - ${{total_value}})</h3>
      {{cart_items}}
    </div>
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1976d2;">Why Choose Us?</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Free shipping on orders over $99</li>
        <li>30-day satisfaction guarantee</li>
        <li>Expert installation available</li>
        <li>Price match guarantee</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{recovery_link}}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Purchase</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Questions? Reply to this email or call us at (555) 123-4567</p>
  </div>
</body>
</html>
', 'default'),

('Final Reminder', 'final_reminder', 'Last chance! Your cart expires soon ⏰', '
<html>
<head><title>Final Reminder - Cart Expiring Soon</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background-color: #f8f9fa;">
    <h1 style="color: #dc3545; text-align: center;">⏰ Final Reminder</h1>
    <p>Hi {{customer_name}},</p>
    <p><strong>Your cart expires in 24 hours!</strong> Don''t miss out on these items you selected:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
      <h3>Expiring Soon ({{item_count}} items - ${{total_value}})</h3>
      {{cart_items}}
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
      <p style="margin: 0; color: #856404;"><strong>⚡ Limited Time:</strong> Complete your purchase in the next 24 hours to secure these items and current pricing!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{recovery_link}}" style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Complete Purchase Now</a>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center;">
      <a href="{{unsubscribe_link}}" style="color: #666;">Don''t want these reminders? Click here to unsubscribe</a>
    </p>
  </div>
</body>
</html>
', 'default');

-- Trigger to set expiration date when cart recovery is created
DELIMITER //

CREATE TRIGGER set_cart_recovery_expiration
BEFORE INSERT ON abandoned_cart_recovery
FOR EACH ROW
BEGIN
  -- Set expiration date based on expire_after minutes
  SET NEW.expires_at = DATE_ADD(NEW.created_at, INTERVAL NEW.expire_after MINUTE);
  
  -- Generate unique recovery token
  SET NEW.recovery_token = CONCAT(
    LEFT(MD5(CONCAT(NEW.cart_id, NEW.email, UNIX_TIMESTAMP())), 16),
    '-',
    LEFT(SHA1(CONCAT(NEW.created_at, RAND())), 16)
  );
END//

DELIMITER ;

SELECT 'Abandoned cart recovery tables created successfully!' as status;