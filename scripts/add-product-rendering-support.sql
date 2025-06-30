-- Extend existing tables for rendering support
-- Add texture and rendering properties to fabric options (vendor-specific)
-- First check if columns exist
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'product_fabric_options' AND column_name = 'texture_url';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE product_fabric_options 
     ADD COLUMN texture_url VARCHAR(500) AFTER description,
     ADD COLUMN texture_scale DECIMAL(5,2) DEFAULT 1.0 AFTER texture_url,
     ADD COLUMN material_finish ENUM(''matte'', ''satin'', ''glossy'', ''metallic'') DEFAULT ''matte'' AFTER texture_scale,
     ADD COLUMN opacity DECIMAL(3,2) DEFAULT 1.0 AFTER material_finish,
     ADD COLUMN render_priority INT DEFAULT 0 AFTER opacity',
    'SELECT ''Columns already exist'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add 3D model support to vendor products
CREATE TABLE IF NOT EXISTS vendor_product_3d_models (
  model_id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id INT NOT NULL,
  vendor_id INT NOT NULL,
  model_url VARCHAR(500),
  model_type ENUM('gltf', 'obj', 'fbx', 'usdz') DEFAULT 'gltf',
  model_version VARCHAR(20) DEFAULT '1.0',
  scale_factor DECIMAL(10,2) DEFAULT 1.0,
  default_camera_position JSON,
  default_lighting JSON,
  supported_customizations JSON COMMENT 'Which parts can be customized',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(vendor_product_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_vendor (vendor_id)
);

-- Vendor-specific rendering configurations
CREATE TABLE IF NOT EXISTS vendor_rendering_configs (
  config_id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  product_type_id INT,
  config_name VARCHAR(100),
  render_engine ENUM('canvas2d', 'webgl', 'three.js', 'babylon.js') DEFAULT 'three.js',
  environment_preset VARCHAR(100) DEFAULT 'studio',
  lighting_config JSON,
  camera_presets JSON,
  watermark_settings JSON,
  quality_settings JSON COMMENT 'Resolution, antialiasing, etc',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  FOREIGN KEY (product_type_id) REFERENCES product_types(type_id) ON DELETE SET NULL,
  INDEX idx_vendor (vendor_id),
  INDEX idx_product_type (product_type_id)
);

-- Cache rendered images with vendor isolation
CREATE TABLE IF NOT EXISTS vendor_render_cache (
  cache_id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  cache_key VARCHAR(500) NOT NULL,
  render_url VARCHAR(500),
  render_params JSON,
  file_size INT,
  mime_type VARCHAR(50) DEFAULT 'image/png',
  width INT,
  height INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INT DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  UNIQUE KEY uk_vendor_cache (vendor_id, cache_key),
  INDEX idx_vendor (vendor_id),
  INDEX idx_expires (expires_at),
  INDEX idx_cache_key (cache_key)
);

-- Product visualization templates (vendor can create custom templates)
CREATE TABLE IF NOT EXISTS vendor_visualization_templates (
  template_id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  template_name VARCHAR(100),
  template_type ENUM('room_scene', 'product_only', 'comparison', 'lifestyle') DEFAULT 'product_only',
  base_scene_url VARCHAR(500),
  placeholder_config JSON COMMENT 'Where products are placed in the scene',
  default_props JSON COMMENT 'Default props in the scene',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  INDEX idx_vendor (vendor_id)
);

-- Sample data for testing (vendor 2)
INSERT INTO vendor_rendering_configs (vendor_id, product_type_id, config_name, lighting_config, camera_presets, is_default) VALUES
(2, 1, 'Roller Shades Studio', 
 '{"ambient": {"intensity": 0.4, "color": "#ffffff"}, "directional": {"intensity": 0.6, "position": [5, 10, 5], "castShadow": true}}',
 '{"default": {"position": [0, 0, 5], "fov": 45}, "closeup": {"position": [0, 0, 2.5], "fov": 35}}',
 TRUE);

-- Add sample texture URLs to existing fabric options
UPDATE product_fabric_options 
SET texture_url = CASE 
    WHEN fabric_name = 'Arctic White' THEN '/textures/fabrics/arctic-white-texture.jpg'
    WHEN fabric_name = 'Midnight Blue' THEN '/textures/fabrics/midnight-blue-texture.jpg'
    WHEN fabric_name = 'Complete Blackout' THEN '/textures/fabrics/blackout-texture.jpg'
    ELSE texture_url
END
WHERE vendor_id = 2 AND product_id = 242;