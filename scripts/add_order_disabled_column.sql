-- Add is_disabled column to orders table
-- This allows admins to disable orders, hiding them from vendor dashboards

ALTER TABLE orders
ADD COLUMN is_disabled BOOLEAN DEFAULT FALSE AFTER updated_at;

-- Add index for better query performance
CREATE INDEX idx_orders_is_disabled ON orders(is_disabled);

-- Add comment for documentation
ALTER TABLE orders 
MODIFY COLUMN is_disabled BOOLEAN DEFAULT FALSE COMMENT 'If true, order is hidden from vendor dashboard';