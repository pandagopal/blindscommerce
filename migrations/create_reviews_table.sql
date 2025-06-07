-- Create product reviews table
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
);

-- Create review helpfulness tracking table
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
);

-- Create review images table for photo reviews
CREATE TABLE IF NOT EXISTS review_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_alt TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_review_images (review_id),
  KEY idx_display_order (display_order)
);

-- Update products table to include review aggregation
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_score DECIMAL(4,2) DEFAULT 0.0;

-- Add foreign key constraints (after table creation)
ALTER TABLE product_reviews 
ADD CONSTRAINT fk_product_reviews_product 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_reviews 
ADD CONSTRAINT fk_product_reviews_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE review_helpfulness 
ADD CONSTRAINT fk_review_helpfulness_review 
FOREIGN KEY (review_id) REFERENCES product_reviews(review_id) ON DELETE CASCADE;

ALTER TABLE review_helpfulness 
ADD CONSTRAINT fk_review_helpfulness_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE review_images 
ADD CONSTRAINT fk_review_images_review 
FOREIGN KEY (review_id) REFERENCES product_reviews(review_id) ON DELETE CASCADE;

-- Create trigger to update product rating when review is added/updated
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_product_rating_insert
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN
  IF NEW.is_approved = 1 THEN
    UPDATE products 
    SET 
      review_count = (
        SELECT COUNT(*) 
        FROM product_reviews 
        WHERE product_id = NEW.product_id AND is_approved = 1
      ),
      rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM product_reviews 
        WHERE product_id = NEW.product_id AND is_approved = 1
      ),
      review_score = (
        SELECT 
          COALESCE((AVG(rating) * COUNT(*)) / (COUNT(*) + 1), 0)
        FROM product_reviews 
        WHERE product_id = NEW.product_id AND is_approved = 1
      )
    WHERE product_id = NEW.product_id;
  END IF;
END//

CREATE TRIGGER IF NOT EXISTS update_product_rating_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
BEGIN
  UPDATE products 
  SET 
    review_count = (
      SELECT COUNT(*) 
      FROM product_reviews 
      WHERE product_id = NEW.product_id AND is_approved = 1
    ),
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM product_reviews 
      WHERE product_id = NEW.product_id AND is_approved = 1
    ),
    review_score = (
      SELECT 
        COALESCE((AVG(rating) * COUNT(*)) / (COUNT(*) + 1), 0)
      FROM product_reviews 
      WHERE product_id = NEW.product_id AND is_approved = 1
    )
  WHERE product_id = NEW.product_id;
END//

CREATE TRIGGER IF NOT EXISTS update_product_rating_delete
AFTER DELETE ON product_reviews
FOR EACH ROW
BEGIN
  UPDATE products 
  SET 
    review_count = (
      SELECT COUNT(*) 
      FROM product_reviews 
      WHERE product_id = OLD.product_id AND is_approved = 1
    ),
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM product_reviews 
      WHERE product_id = OLD.product_id AND is_approved = 1
    ),
    review_score = (
      SELECT 
        COALESCE((AVG(rating) * COUNT(*)) / (COUNT(*) + 1), 0)
      FROM product_reviews 
      WHERE product_id = OLD.product_id AND is_approved = 1
    )
  WHERE product_id = OLD.product_id;
END//

DELIMITER ;