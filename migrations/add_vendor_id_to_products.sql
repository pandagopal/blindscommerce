-- Add vendor_id column to products table to establish direct vendor relationship
ALTER TABLE `products` 
ADD COLUMN `vendor_id` int DEFAULT NULL AFTER `brand_id`,
ADD KEY `idx_vendor_id` (`vendor_id`),
ADD CONSTRAINT `fk_products_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE SET NULL;

-- Update existing products with vendor_id from vendor_products table
-- This assumes one product is associated with only one vendor (which should be the case)
UPDATE products p
INNER JOIN (
    SELECT product_id, vendor_id 
    FROM vendor_products 
    GROUP BY product_id 
    HAVING COUNT(DISTINCT vendor_id) = 1
) vp ON p.product_id = vp.product_id
SET p.vendor_id = vp.vendor_id;

-- For products with multiple vendors (if any), log them for manual review
SELECT p.product_id, p.name, GROUP_CONCAT(vp.vendor_id) as vendor_ids
FROM products p
INNER JOIN vendor_products vp ON p.product_id = vp.product_id
GROUP BY p.product_id, p.name
HAVING COUNT(DISTINCT vp.vendor_id) > 1;