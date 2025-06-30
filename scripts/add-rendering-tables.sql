-- Add rendering parameters to existing tables
ALTER TABLE product_fabric_options 
ADD COLUMN texture_url VARCHAR(500) AFTER description,
ADD COLUMN material_properties JSON AFTER texture_url,
ADD COLUMN texture_scale DECIMAL(5,2) DEFAULT 1.0 AFTER material_properties;

-- New table for 3D models
CREATE TABLE IF NOT EXISTS product_3d_models (
  model_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  model_url VARCHAR(500),
  model_type ENUM('gltf', 'obj', 'fbx') DEFAULT 'gltf',
  scale_factor DECIMAL(10,2) DEFAULT 1.0,
  default_camera_position JSON,
  default_environment VARCHAR(100) DEFAULT 'studio',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
);

-- Rendering presets for different product types
CREATE TABLE IF NOT EXISTS rendering_presets (
  preset_id INT PRIMARY KEY AUTO_INCREMENT,
  product_type_id INT,
  preset_name VARCHAR(100),
  lighting_config JSON,
  camera_config JSON,
  environment_map VARCHAR(500),
  shadow_settings JSON,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_type_id) REFERENCES product_types(type_id) ON DELETE CASCADE,
  INDEX idx_product_type (product_type_id)
);

-- Cached renders table
CREATE TABLE IF NOT EXISTS cached_renders (
  cache_id INT PRIMARY KEY AUTO_INCREMENT,
  cache_key VARCHAR(500) UNIQUE,
  render_url VARCHAR(500),
  render_params JSON,
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INT DEFAULT 0,
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires (expires_at)
);

-- Add sample data for testing
INSERT INTO rendering_presets (product_type_id, preset_name, lighting_config, camera_config, environment_map, is_default) VALUES
(1, 'Roller Shades Standard', 
 '{"ambientIntensity": 0.4, "directionalIntensity": 0.6, "shadowSoftness": 0.5}',
 '{"position": [0, 0, 5], "fov": 45, "near": 0.1, "far": 100}',
 '/environments/studio-soft.hdr',
 TRUE),
(2, 'Cellular Shades Standard',
 '{"ambientIntensity": 0.5, "directionalIntensity": 0.5, "shadowSoftness": 0.7}',
 '{"position": [0, 0, 4.5], "fov": 50, "near": 0.1, "far": 100}',
 '/environments/studio-warm.hdr',
 TRUE);