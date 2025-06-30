-- Add texture and rendering columns to product_fabric_options table
-- Check if columns exist before adding them

-- Check and add texture_url
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'product_fabric_options' 
  AND column_name = 'texture_url';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options ADD COLUMN texture_url VARCHAR(500) AFTER description',
    'SELECT ''texture_url already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add texture_scale
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'product_fabric_options' 
  AND column_name = 'texture_scale';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options ADD COLUMN texture_scale DECIMAL(5,2) DEFAULT 1.0 AFTER texture_url',
    'SELECT ''texture_scale already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add material_finish
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'product_fabric_options' 
  AND column_name = 'material_finish';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options ADD COLUMN material_finish ENUM(''matte'', ''satin'', ''glossy'', ''metallic'') DEFAULT ''matte'' AFTER texture_scale',
    'SELECT ''material_finish already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add opacity
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'product_fabric_options' 
  AND column_name = 'opacity';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options ADD COLUMN opacity DECIMAL(3,2) DEFAULT 1.0 AFTER material_finish',
    'SELECT ''opacity already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add render_priority
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'product_fabric_options' 
  AND column_name = 'render_priority';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options ADD COLUMN render_priority INT DEFAULT 0 AFTER opacity',
    'SELECT ''render_priority already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update sample texture URLs for testing
UPDATE product_fabric_options 
SET texture_url = CASE 
    WHEN fabric_name = 'Arctic White' THEN '/textures/fabrics/arctic-white-texture.jpg'
    WHEN fabric_name = 'Midnight Blue' THEN '/textures/fabrics/midnight-blue-texture.jpg'
    WHEN fabric_name = 'Complete Blackout' THEN '/textures/fabrics/blackout-texture.jpg'
    ELSE texture_url
END
WHERE product_id = 242 AND texture_url IS NULL;