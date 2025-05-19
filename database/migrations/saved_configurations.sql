-- Migration to add saved_configurations table if it doesn't exist
-- This allows customers to save their blind configurations for later

CREATE TABLE IF NOT EXISTS saved_configurations (
    configuration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    name VARCHAR(255) NOT NULL,
    configuration_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_configurations_user_id ON saved_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_configurations_product_id ON saved_configurations(product_id);
