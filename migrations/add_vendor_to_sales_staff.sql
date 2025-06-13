-- Migration: Add vendor_id to sales_staff table
-- This establishes the one-to-many relationship: One vendor can have multiple sales people

ALTER TABLE `sales_staff` 
ADD COLUMN `vendor_id` int DEFAULT NULL 
AFTER `user_id`;

-- Add foreign key constraint
ALTER TABLE `sales_staff` 
ADD CONSTRAINT `fk_sales_staff_vendor` 
FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX `idx_sales_staff_vendor` ON `sales_staff` (`vendor_id`);

-- Update existing sales staff records to link them to vendor (if any exist)
-- Note: This would need to be done manually based on business logic
-- UPDATE sales_staff SET vendor_id = 1 WHERE sales_staff_id = 1; -- Example