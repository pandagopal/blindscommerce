-- MySQL Migration Runner for BlindsCommerce Features
-- Run this script in your MySQL database to add the new features

-- First, let's add some missing tables that might be needed
CREATE TABLE IF NOT EXISTS brands (
  brand_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_brand_name (name),
  KEY idx_active (is_active)
);

CREATE TABLE IF NOT EXISTS features (
  feature_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_feature_name (name),
  KEY idx_active (is_active)
);

-- Add brand_id to products table if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id INT NULL;

-- Add the brand foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_brand 
FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL;

-- Create supporting tables for enhanced search
CREATE TABLE IF NOT EXISTS product_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  feature_id INT NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_product_feature (product_id, feature_id),
  KEY idx_product_features (product_id),
  KEY idx_feature_products (feature_id)
);

CREATE TABLE IF NOT EXISTS product_colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  color_hex VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_product_colors (product_id),
  KEY idx_color_name (color_name)
);

CREATE TABLE IF NOT EXISTS product_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  material_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_product_materials (product_id),
  KEY idx_material_name (material_name)
);

CREATE TABLE IF NOT EXISTS product_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_product_rooms (product_id),
  KEY idx_room_type (room_type)
);

-- Add foreign key constraints for supporting tables
ALTER TABLE product_features 
ADD CONSTRAINT fk_product_features_product 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_features 
ADD CONSTRAINT fk_product_features_feature 
FOREIGN KEY (feature_id) REFERENCES features(feature_id) ON DELETE CASCADE;

ALTER TABLE product_colors 
ADD CONSTRAINT fk_product_colors_product 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_materials 
ADD CONSTRAINT fk_product_materials_product 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_rooms 
ADD CONSTRAINT fk_product_rooms_product 
FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query VARCHAR(255) NOT NULL,
  result_count INT DEFAULT 0,
  clicked_result VARCHAR(255) NULL,
  search_count INT DEFAULT 1,
  last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_query (query),
  KEY idx_search_count (search_count),
  KEY idx_last_searched (last_searched)
);

-- Insert some default data
INSERT IGNORE INTO brands (name, description) VALUES
('SmartBlinds', 'Premium smart window treatments'),
('EcoShade', 'Environmentally friendly window coverings'),
('LuxuryView', 'High-end custom window treatments'),
('ModernStyle', 'Contemporary window fashion'),
('ClassicHome', 'Traditional window treatments');

INSERT IGNORE INTO features (name, description) VALUES
('Cordless', 'Safe and convenient cordless operation'),
('Blackout', 'Blocks 100% of outside light'),
('Energy Efficient', 'Provides insulation to save on energy costs'),
('Motorized', 'Battery or electric powered for remote operation'),
('UV Protection', 'Protects furniture from harmful UV rays'),
('Easy Clean', 'Simple maintenance and cleaning'),
('Child Safe', 'CPSC certified child safety features'),
('Smart Home Compatible', 'Works with Alexa, Google Home, etc.'),
('Moisture Resistant', 'Suitable for bathrooms and kitchens'),
('Sound Dampening', 'Reduces outside noise');

-- Add some sample product relationships (you can customize these)
-- Insert sample product features
INSERT IGNORE INTO product_features (product_id, feature_id, feature_name)
SELECT p.product_id, f.feature_id, f.name
FROM products p
CROSS JOIN features f
WHERE p.product_id <= 10 AND f.feature_id <= 5;

-- Insert sample product colors
INSERT IGNORE INTO product_colors (product_id, color_name, color_hex) VALUES
(1, 'White', '#FFFFFF'),
(1, 'Ivory', '#FFFFF0'),
(1, 'Beige', '#F5F5DC'),
(2, 'Gray', '#808080'),
(2, 'Charcoal', '#36454F'),
(3, 'Brown', '#8B4513'),
(3, 'Natural Wood', '#DEB887');

-- Insert sample product materials
INSERT IGNORE INTO product_materials (product_id, material_name) VALUES
(1, 'Cellular Fabric'),
(1, 'Polyester'),
(2, 'Aluminum'),
(2, 'Vinyl'),
(3, 'Real Wood'),
(3, 'Faux Wood');

-- Insert sample room types
INSERT IGNORE INTO product_rooms (product_id, room_type) VALUES
(1, 'Living Room'),
(1, 'Bedroom'),
(1, 'Office'),
(2, 'Kitchen'),
(2, 'Bathroom'),
(3, 'Dining Room'),
(3, 'Family Room');

-- Now run the main migration files
SOURCE create_reviews_table.sql;
SOURCE enhance_swatches_with_limits.sql;

-- Final message
SELECT 'MySQL migrations completed successfully!' as status;