-- Migration to add saved_configurations table if it doesn't exist
-- This allows customers to save their blind configurations for later

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'blinds' AND table_name = 'saved_configurations') THEN
        CREATE TABLE blinds.saved_configurations (
            configuration_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            configuration_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Add indexes for better performance
        CREATE INDEX idx_saved_configurations_user_id ON blinds.saved_configurations(user_id);
        CREATE INDEX idx_saved_configurations_product_id ON blinds.saved_configurations(product_id);
    END IF;
END
$$;
