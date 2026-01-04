-- Cache Settings Table
-- Stores system-wide cache configuration

CREATE TABLE IF NOT EXISTS cache_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),

  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default cache setting
INSERT INTO cache_settings (setting_key, setting_value, description)
VALUES ('cache_enabled', 'false', 'Enable or disable application caching')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
