-- Create order modifications tracking table
CREATE TABLE IF NOT EXISTS order_modifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  modification_type ENUM('item_quantity', 'add_item', 'remove_item', 'shipping_address', 'shipping_method', 'special_instructions', 'cancel_order') NOT NULL,
  
  -- Previous state (JSON or specific fields)
  previous_state JSON NULL,
  new_state JSON NULL,
  
  -- Specific modification fields
  item_id INT NULL, -- For item-specific modifications
  previous_quantity INT NULL,
  new_quantity INT NULL,
  previous_price DECIMAL(10,2) NULL,
  new_price DECIMAL(10,2) NULL,
  
  -- Price difference calculation
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
  expires_at TIMESTAMP NULL, -- Time limit for modifications
  
  -- Tracking
  created_by INT NULL, -- User who requested (could be admin on behalf of customer)
  approved_by INT NULL, -- Admin who approved
  
  INDEX idx_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_modification_type (modification_type),
  INDEX idx_requested_at (requested_at),
  INDEX idx_expires_at (expires_at),
  
  CONSTRAINT fk_order_modifications_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_modifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_modifications_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_order_modifications_approved_by FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create order modification items table for tracking item-level changes
CREATE TABLE IF NOT EXISTS order_modification_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modification_id INT NOT NULL,
  order_item_id INT NULL, -- NULL for new items being added
  product_id INT NOT NULL,
  
  -- Change details
  action ENUM('add', 'remove', 'quantity_change', 'price_change') NOT NULL,
  previous_quantity INT DEFAULT 0,
  new_quantity INT DEFAULT 0,
  previous_price DECIMAL(10,2) DEFAULT 0.00,
  new_price DECIMAL(10,2) DEFAULT 0.00,
  
  -- Product configuration (for custom products)
  configuration_data JSON NULL,
  
  INDEX idx_modification_id (modification_id),
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_product_id (product_id),
  
  CONSTRAINT fk_order_mod_items_modification FOREIGN KEY (modification_id) REFERENCES order_modifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_mod_items_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_mod_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Add modification window and flags to orders table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'orders' 
     AND table_schema = DATABASE()
     AND column_name = 'can_be_modified') > 0,
    'SELECT "can_be_modified column already exists" as status',
    'ALTER TABLE orders ADD COLUMN can_be_modified TINYINT(1) DEFAULT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'orders' 
     AND table_schema = DATABASE()
     AND column_name = 'modification_deadline') > 0,
    'SELECT "modification_deadline column already exists" as status',
    'ALTER TABLE orders ADD COLUMN modification_deadline TIMESTAMP NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'orders' 
     AND table_schema = DATABASE()
     AND column_name = 'has_modifications') > 0,
    'SELECT "has_modifications column already exists" as status',
    'ALTER TABLE orders ADD COLUMN has_modifications TINYINT(1) DEFAULT 0'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Trigger to set modification deadline when order is placed
DELIMITER //

CREATE TRIGGER set_order_modification_deadline
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  -- Set modification deadline to 2 hours after order placement for regular orders
  -- Custom orders get 24 hours
  DECLARE deadline_hours INT DEFAULT 2;
  
  -- Check if order contains custom products (simplified check)
  IF EXISTS (
    SELECT 1 FROM order_items oi 
    JOIN products p ON oi.product_id = p.product_id 
    WHERE oi.order_id = NEW.order_id 
    AND p.product_type = 'custom'
  ) THEN
    SET deadline_hours = 24;
  END IF;
  
  -- Only set deadline for orders that aren't already shipped
  IF NEW.order_status IN ('pending', 'confirmed', 'processing') THEN
    UPDATE orders 
    SET modification_deadline = DATE_ADD(NEW.created_at, INTERVAL deadline_hours HOUR)
    WHERE order_id = NEW.order_id;
  END IF;
END//

-- Trigger to update modification flags when modifications are made
CREATE TRIGGER update_order_modification_flags
AFTER INSERT ON order_modifications
FOR EACH ROW
BEGIN
  UPDATE orders 
  SET has_modifications = 1 
  WHERE order_id = NEW.order_id;
END//

-- Trigger to disable modifications when order status changes
CREATE TRIGGER disable_modifications_on_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  -- Disable modifications when order moves to shipped, delivered, or cancelled
  IF NEW.order_status IN ('shipped', 'delivered', 'cancelled', 'refunded') 
     AND OLD.order_status != NEW.order_status THEN
    UPDATE orders 
    SET can_be_modified = 0 
    WHERE order_id = NEW.order_id;
  END IF;
END//

DELIMITER ;

-- Create indexes for performance
CREATE INDEX idx_orders_can_modify ON orders (can_be_modified, order_status);
CREATE INDEX idx_orders_mod_deadline ON orders (modification_deadline);

SELECT 'Order modifications tables created successfully!' as status;