-- BlindsCommerce Pricing System Migration
-- Based on Excel pricing analysis showing multiple systems per product

-- 1. Add system_type and fabric_code to product_pricing_matrix
ALTER TABLE product_pricing_matrix 
ADD COLUMN system_type VARCHAR(100) DEFAULT NULL COMMENT 'e.g., square cassette, no cassette, enclosed' AFTER product_id,
ADD COLUMN fabric_code VARCHAR(50) DEFAULT NULL COMMENT 'e.g., S1001, RS20282, A282' AFTER system_type,
ADD INDEX idx_system_fabric (product_id, system_type, fabric_code);

-- 2. Update product_pricing_formulas to support system/fabric variations
ALTER TABLE product_pricing_formulas 
ADD COLUMN system_type VARCHAR(100) DEFAULT NULL COMMENT 'System type for this formula' AFTER vendor_id,
ADD COLUMN fabric_code VARCHAR(50) DEFAULT NULL COMMENT 'Fabric code for this formula' AFTER system_type;

-- Drop the unique constraint on product_id if it exists and add new composite unique key
ALTER TABLE product_pricing_formulas 
DROP INDEX IF EXISTS product_id,
ADD UNIQUE KEY uk_product_system_fabric (product_id, system_type, fabric_code);

-- 3. Create table for per-square-unit pricing (for vertical blinds, skylights, etc.)
CREATE TABLE IF NOT EXISTS product_pricing_per_square (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    product_type VARCHAR(100) NOT NULL COMMENT 'e.g., vertical blinds, skylight, aluminum mini',
    system_type VARCHAR(100) DEFAULT NULL COMMENT 'e.g., pull bead, spring, electric',
    price_per_square DECIMAL(10,2) NOT NULL COMMENT 'Price per square unit',
    square_unit VARCHAR(10) DEFAULT 'sqft' COMMENT 'sqft or sqm',
    min_squares DECIMAL(5,2) DEFAULT 1.00 COMMENT 'Minimum square footage',
    add_on_motor DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Electric/motor add-on price',
    add_on_no_drill DECIMAL(10,2) DEFAULT 0.00 COMMENT 'No-drill add-on price',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_system (product_id, system_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create table for system types available per product
CREATE TABLE IF NOT EXISTS product_system_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    system_type VARCHAR(100) NOT NULL COMMENT 'e.g., square cassette, no cassette',
    system_name VARCHAR(200) NOT NULL COMMENT 'Display name for the system',
    sort_order INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_system (product_id, system_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add pricing_model column to products table
ALTER TABLE products 
ADD COLUMN pricing_model ENUM('grid', 'formula', 'per_square', 'hybrid') DEFAULT 'grid' 
COMMENT 'Primary pricing model for this product' AFTER base_price;

-- 6. Update existing addon pricing table or create new columns
-- First check and add missing columns to existing product_addon_pricing table
ALTER TABLE product_addon_pricing 
ADD COLUMN IF NOT EXISTS price_type ENUM('fixed', 'per_unit') DEFAULT 'fixed' AFTER price,
ADD COLUMN IF NOT EXISTS min_size DECIMAL(8,2) DEFAULT NULL COMMENT 'Minimum size for tiered pricing' AFTER price_type,
ADD COLUMN IF NOT EXISTS max_size DECIMAL(8,2) DEFAULT NULL COMMENT 'Maximum size for tiered pricing' AFTER min_size;

-- Skip creating new table since product_addon_pricing already exists
-- CREATE TABLE IF NOT EXISTS product_addon_pricing_new (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    addon_type VARCHAR(50) NOT NULL COMMENT 'e.g., motor, side_track, no_drill',
    addon_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    price_type ENUM('fixed', 'per_unit') DEFAULT 'fixed',
    min_size DECIMAL(8,2) DEFAULT NULL COMMENT 'Minimum size for tiered pricing',
    max_size DECIMAL(8,2) DEFAULT NULL COMMENT 'Maximum size for tiered pricing',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_addon (product_id, addon_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Sample data for testing (based on Excel analysis)

-- Example: Corded Roller Blind with multiple systems
INSERT INTO product_system_types (product_id, system_type, system_name, sort_order, is_default) VALUES
(1, 'square_cassette', 'Square/Fabric Insert Cassette', 1, true),
(1, 'no_cassette', 'No Cassette System', 2, false),
(1, 'new_cassette', 'New Cassette', 3, false),
(1, 'full_enclosed', 'Full Enclosed System', 4, false);

-- Example: Vertical Blinds with per-square pricing
INSERT INTO product_pricing_per_square (product_id, product_type, system_type, price_per_square, square_unit, min_squares, add_on_motor) VALUES
(10, 'vertical_blind', 'pull_bead', 13.99, 'sqm', 1.00, 79.00),
(10, 'vertical_blind', 'pull_rod', 13.99, 'sqm', 1.00, 79.00);

-- Example: Add-on pricing for side tracks
INSERT INTO product_addon_pricing (product_id, addon_type, addon_name, price, min_size, max_size) VALUES
(1, 'side_track', 'Side Track Set (<60")', 18.99, 0, 60),
(1, 'side_track', 'Side Track Set (60"-120")', 38.99, 60, 120),
(1, 'side_track', 'Side Track Set (>120")', 58.99, 120, 999);

-- 8. Create view for easy pricing lookup
CREATE OR REPLACE VIEW v_product_pricing_complete AS
SELECT 
    p.product_id,
    p.name as product_name,
    p.pricing_model,
    pm.system_type,
    pm.fabric_code,
    pm.width_min,
    pm.width_max,
    pm.height_min,
    pm.height_max,
    pm.base_price as matrix_price,
    pf.pricing_type as formula_type,
    pf.fixed_base,
    pf.width_rate,
    pf.height_rate,
    pf.area_rate,
    ps.price_per_square,
    ps.square_unit,
    ps.min_squares
FROM products p
LEFT JOIN product_pricing_matrix pm ON p.product_id = pm.product_id AND pm.is_active = 1
LEFT JOIN product_pricing_formulas pf ON p.product_id = pf.product_id AND pf.is_active = 1
LEFT JOIN product_pricing_per_square ps ON p.product_id = ps.product_id AND ps.is_active = 1;

-- 9. Grant permissions if needed
-- GRANT SELECT, INSERT, UPDATE, DELETE ON blindscommerce_test.product_pricing_per_square TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON blindscommerce_test.product_system_types TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON blindscommerce_test.product_addon_pricing_new TO 'your_app_user'@'localhost';