-- Fix Pricing Column Inconsistencies in BlindsCommerce Database
-- Generated: 2025-06-27
-- Purpose: Standardize pricing columns and ensure consistency with CLAUDE.md specifications

-- 1. Standardize decimal precision for price per square foot columns
-- Change from decimal(10,4) to decimal(10,2) for consistency
ALTER TABLE product_fabric_pricing 
MODIFY COLUMN price_per_sqft DECIMAL(10,2) NOT NULL 
COMMENT 'Price per square foot in dollars, standardized to 2 decimal places';

-- 2. Add missing columns for configuration modifiers
ALTER TABLE cart_items 
ADD COLUMN configuration_price DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Additional price from product configuration options';

ALTER TABLE order_items 
ADD COLUMN configuration_price DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Additional price from product configuration options';

-- 3. Add columns for fabric/material surcharges
ALTER TABLE cart_items 
ADD COLUMN material_surcharge DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Additional charge for premium materials';

ALTER TABLE order_items 
ADD COLUMN material_surcharge DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Additional charge for premium materials';

-- 4. Add seasonal discount tracking
ALTER TABLE orders 
ADD COLUMN seasonal_discount_amount DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Amount discounted from seasonal promotions';

ALTER TABLE cart_items 
ADD COLUMN seasonal_discount_amount DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Amount discounted from seasonal promotions per item';

-- 5. Enhance discount type columns to support more flexible values
-- Convert ENUMs to VARCHAR for more flexibility
ALTER TABLE coupon_codes 
MODIFY COLUMN discount_type VARCHAR(50) NOT NULL 
COMMENT 'Type of discount: percentage, fixed_amount, free_shipping, buy_one_get_one, etc.';

ALTER TABLE vendor_discounts 
MODIFY COLUMN discount_type VARCHAR(50) NOT NULL 
COMMENT 'Type of discount: percentage, fixed_amount, tiered, bulk_pricing, seasonal, etc.';

ALTER TABLE pricing_tiers 
MODIFY COLUMN discount_type VARCHAR(50) NOT NULL 
COMMENT 'Type of discount: percentage, fixed_amount, price_override, etc.';

-- 6. Add tiered pricing support
ALTER TABLE volume_discounts 
ADD COLUMN tier_breaks JSON 
COMMENT 'JSON array of quantity breaks and discount values';

-- 7. Add pricing calculation audit columns
ALTER TABLE orders 
ADD COLUMN pricing_calculation_log JSON 
COMMENT 'Detailed log of how the final price was calculated';

ALTER TABLE order_items 
ADD COLUMN price_breakdown JSON 
COMMENT 'Breakdown of base price, discounts, surcharges, etc.';

-- 8. Ensure all monetary columns have proper constraints
ALTER TABLE products 
MODIFY COLUMN base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (base_price >= 0);

ALTER TABLE products 
MODIFY COLUMN cost_price DECIMAL(10,2) DEFAULT NULL CHECK (cost_price IS NULL OR cost_price >= 0);

-- 9. Add indexes for pricing-related queries
CREATE INDEX idx_product_pricing_lookup ON products(product_id, base_price);
CREATE INDEX idx_vendor_pricing ON vendor_products(product_id, vendor_id, vendor_price);
CREATE INDEX idx_customer_pricing ON customer_specific_pricing(product_id, customer_id);
CREATE INDEX idx_active_discounts ON vendor_discounts(vendor_id, is_active, valid_from, valid_until);
CREATE INDEX idx_coupon_lookup ON coupon_codes(code, is_active, valid_from, valid_until);

-- 10. Add computed column for effective price (MySQL 5.7+)
ALTER TABLE product_pricing_matrix 
ADD COLUMN effective_price DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
        WHEN price_per_sqft IS NOT NULL AND price_per_sqft > 0 
        THEN price_per_sqft 
        ELSE base_price 
    END
) STORED;

-- 11. Create view for product pricing with all discounts
CREATE OR REPLACE VIEW v_product_effective_pricing AS
SELECT 
    p.product_id,
    p.name as product_name,
    p.base_price,
    vp.vendor_id,
    vp.vendor_price,
    COALESCE(vp.vendor_price, p.base_price) as list_price,
    vd.discount_type as vendor_discount_type,
    vd.discount_value as vendor_discount_value,
    pt.tier_name,
    pt.discount_value as tier_discount,
    CASE 
        WHEN vd.discount_type = 'percentage' THEN 
            COALESCE(vp.vendor_price, p.base_price) * (1 - vd.discount_value / 100)
        WHEN vd.discount_type = 'fixed_amount' THEN 
            COALESCE(vp.vendor_price, p.base_price) - vd.discount_value
        ELSE 
            COALESCE(vp.vendor_price, p.base_price)
    END as discounted_price
FROM products p
LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
LEFT JOIN vendor_discounts vd ON vp.vendor_id = vd.vendor_id 
    AND vd.is_active = 1 
    AND (vd.valid_from IS NULL OR vd.valid_from <= NOW())
    AND (vd.valid_until IS NULL OR vd.valid_until >= NOW())
LEFT JOIN pricing_tiers pt ON pt.is_active = 1;

-- 12. Add triggers to ensure price consistency
DELIMITER //

CREATE TRIGGER before_cart_item_insert 
BEFORE INSERT ON cart_items 
FOR EACH ROW
BEGIN
    IF NEW.price_at_add < 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Price cannot be negative';
    END IF;
END//

CREATE TRIGGER before_order_item_insert 
BEFORE INSERT ON order_items 
FOR EACH ROW
BEGIN
    IF NEW.unit_price < 0 OR NEW.total_price < 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Prices cannot be negative';
    END IF;
END//

DELIMITER ;

-- 13. Add comments to document the pricing flow per CLAUDE.md
ALTER TABLE products COMMENT = 'Base product catalog with foundation pricing (Step 1 of pricing engine)';
ALTER TABLE product_pricing_matrix COMMENT = 'Dimensional pricing matrix for custom sizes (Step 2 of pricing engine)';
ALTER TABLE product_fabric_pricing COMMENT = 'Fabric and material surcharges (Step 3 of pricing engine)';
ALTER TABLE pricing_tiers COMMENT = 'Customer tier-based pricing (Step 5 of pricing engine)';
ALTER TABLE volume_discounts COMMENT = 'Volume/quantity break pricing (Step 6 of pricing engine)';
ALTER TABLE vendor_discounts COMMENT = 'Vendor-specific discount rules (Step 7 of pricing engine)';
ALTER TABLE coupon_codes COMMENT = 'Coupon code discounts (Step 8 of pricing engine)';
ALTER TABLE tax_rates COMMENT = 'Tax calculation data (Step 9 of pricing engine)';
ALTER TABLE shipping_rates COMMENT = 'Shipping cost rules (Step 10 of pricing engine)';