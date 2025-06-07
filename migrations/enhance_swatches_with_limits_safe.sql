-- Safe MySQL migration for swatch enhancements
-- This version handles existing columns gracefully

-- Add sample request tracking and limits (with error handling)
-- Note: If columns already exist, these will show warnings but won't fail

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'user_id') > 0,
    'SELECT "user_id column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN user_id INT NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'request_count') > 0,
    'SELECT "request_count column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN request_count INT DEFAULT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'expires_at') > 0,
    'SELECT "expires_at column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN expires_at TIMESTAMP NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'tracking_number') > 0,
    'SELECT "tracking_number column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN tracking_number VARCHAR(100) NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'delivery_status') > 0,
    'SELECT "delivery_status column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN delivery_status ENUM(\'PENDING\', \'SHIPPED\', \'DELIVERED\', \'RETURNED\') DEFAULT \'PENDING\''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'notes') > 0,
    'SELECT "notes column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN notes TEXT NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND column_name = 'priority') > 0,
    'SELECT "priority column already exists" as status',
    'ALTER TABLE swatch_orders ADD COLUMN priority ENUM(\'STANDARD\', \'EXPRESS\') DEFAULT \'STANDARD\''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (with error handling)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE table_name = 'swatch_orders' 
     AND table_schema = DATABASE()
     AND constraint_name = 'fk_swatch_orders_user') > 0,
    'SELECT "Foreign key fk_swatch_orders_user already exists" as status',
    'ALTER TABLE swatch_orders ADD CONSTRAINT fk_swatch_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create sample request limits tracking table
CREATE TABLE IF NOT EXISTS sample_request_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  email VARCHAR(255) NOT NULL,
  total_requests INT DEFAULT 0,
  current_period_requests INT DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  lifetime_limit INT DEFAULT 15,
  period_limit INT DEFAULT 10,
  is_suspended TINYINT(1) DEFAULT 0,
  suspension_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_email (user_id, email),
  KEY idx_email (email),
  KEY idx_period (period_start, period_end),
  KEY idx_suspended (is_suspended)
);

-- Add foreign key constraint for sample_request_limits
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE table_name = 'sample_request_limits' 
     AND table_schema = DATABASE()
     AND constraint_name = 'fk_sample_request_limits_user') > 0,
    'SELECT "Foreign key fk_sample_request_limits_user already exists" as status',
    'ALTER TABLE sample_request_limits ADD CONSTRAINT fk_sample_request_limits_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create sample request history table
CREATE TABLE IF NOT EXISTS sample_request_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  email VARCHAR(255) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  sample_count INT NOT NULL,
  request_type ENUM('PHYSICAL', 'DIGITAL') DEFAULT 'PHYSICAL',
  shipping_cost DECIMAL(8,2) DEFAULT 0.00,
  is_express TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_user_email (user_id, email),
  KEY idx_order_id (order_id),
  KEY idx_created_at (created_at)
);

-- Add foreign key constraint for sample_request_history
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE table_name = 'sample_request_history' 
     AND table_schema = DATABASE()
     AND constraint_name = 'fk_sample_request_history_user') > 0,
    'SELECT "Foreign key fk_sample_request_history_user already exists" as status',
    'ALTER TABLE sample_request_history ADD CONSTRAINT fk_sample_request_history_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create swatch categories table
CREATE TABLE IF NOT EXISTS swatch_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_name (name),
  KEY idx_display_order (display_order),
  KEY idx_active (is_active)
);

-- Add category relationship to swatches (with error handling)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatches' 
     AND table_schema = DATABASE()
     AND column_name = 'category_id') > 0,
    'SELECT "category_id column already exists" as status',
    'ALTER TABLE swatches ADD COLUMN category_id INT NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatches' 
     AND table_schema = DATABASE()
     AND column_name = 'is_premium') > 0,
    'SELECT "is_premium column already exists" as status',
    'ALTER TABLE swatches ADD COLUMN is_premium TINYINT(1) DEFAULT 0'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatches' 
     AND table_schema = DATABASE()
     AND column_name = 'stock_count') > 0,
    'SELECT "stock_count column already exists" as status',
    'ALTER TABLE swatches ADD COLUMN stock_count INT DEFAULT 0'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'swatches' 
     AND table_schema = DATABASE()
     AND column_name = 'reorder_threshold') > 0,
    'SELECT "reorder_threshold column already exists" as status',
    'ALTER TABLE swatches ADD COLUMN reorder_threshold INT DEFAULT 10'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for swatches
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE table_name = 'swatches' 
     AND table_schema = DATABASE()
     AND constraint_name = 'fk_swatches_category') > 0,
    'SELECT "Foreign key fk_swatches_category already exists" as status',
    'ALTER TABLE swatches ADD CONSTRAINT fk_swatches_category FOREIGN KEY (category_id) REFERENCES swatch_categories(id) ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default swatch categories
INSERT IGNORE INTO swatch_categories (name, description, display_order) VALUES
('Window Blinds', 'Samples for window blind materials', 1),
('Roller Shades', 'Roller shade fabric samples', 2),
('Cellular Shades', 'Cellular shade material samples', 3),
('Roman Shades', 'Roman shade fabric samples', 4),
('Shutters', 'Shutter material and color samples', 5),
('Hardware', 'Hardware finish samples', 6);

-- Create trigger to update sample limits when order is created
DROP TRIGGER IF EXISTS update_sample_limits_on_order;

DELIMITER //

CREATE TRIGGER update_sample_limits_on_order
AFTER INSERT ON swatch_orders
FOR EACH ROW
BEGIN
  DECLARE sample_count INT DEFAULT 0;
  
  -- Use request_count from the order (simpler than complex join)
  SET sample_count = COALESCE(NEW.request_count, 1);
  
  -- Insert/Update sample request limits
  INSERT INTO sample_request_limits (
    user_id, 
    email, 
    total_requests, 
    current_period_requests, 
    period_start, 
    period_end
  ) VALUES (
    NEW.user_id,
    NEW.email,
    sample_count,
    sample_count,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
  ) ON DUPLICATE KEY UPDATE
    total_requests = total_requests + sample_count,
    current_period_requests = CASE 
      WHEN CURDATE() > period_end THEN sample_count
      ELSE current_period_requests + sample_count
    END,
    period_start = CASE 
      WHEN CURDATE() > period_end THEN CURDATE()
      ELSE period_start
    END,
    period_end = CASE 
      WHEN CURDATE() > period_end THEN DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
      ELSE period_end
    END,
    updated_at = CURRENT_TIMESTAMP;
    
  -- Insert into history
  INSERT INTO sample_request_history (
    user_id,
    email,
    order_id,
    sample_count,
    request_type,
    is_express
  ) VALUES (
    NEW.user_id,
    NEW.email,
    NEW.id,
    sample_count,
    'PHYSICAL',
    CASE WHEN NEW.priority = 'EXPRESS' THEN 1 ELSE 0 END
  );
END//

DELIMITER ;

SELECT 'Swatch enhancement migration completed successfully!' as status;