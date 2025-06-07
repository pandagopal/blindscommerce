-- Create recently viewed products tracking table
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
  
  CONSTRAINT fk_recently_viewed_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_recently_viewed_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  
  -- Ensure at least user_id or session_id is provided
  CONSTRAINT chk_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_cleanup ON recently_viewed (viewed_at);

-- Trigger to clean up old records (keep only last 50 per user/session)
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
    AND rv.user_id IS NULL
    AND rv.id NOT IN (
      SELECT id FROM (
        SELECT id FROM recently_viewed 
        WHERE session_id = NEW.session_id 
        AND user_id IS NULL
        ORDER BY viewed_at DESC 
        LIMIT 20
      ) AS keep_recent
    );
  END IF;
  
  -- Clean up records older than 90 days
  DELETE FROM recently_viewed 
  WHERE viewed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END//

DELIMITER ;

SELECT 'Recently viewed tracking table created successfully!' as status;