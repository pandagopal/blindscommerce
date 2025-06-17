-- Remove unused generic option junction tables
-- These tables were never properly used in favor of direct product columns

-- Drop the tables (foreign key constraints will be handled automatically)
DROP TABLE IF EXISTS `product_option_values`;
DROP TABLE IF EXISTS `product_options`;

-- Add comment to document why these were removed
-- The product options are now stored directly in the products table columns:
-- - mount_types (varchar)
-- - control_types (varchar)
-- And fabric options are stored in the existing dedicated tables:
-- - product_fabric_options
-- - product_fabric_images  
-- - product_fabric_pricing