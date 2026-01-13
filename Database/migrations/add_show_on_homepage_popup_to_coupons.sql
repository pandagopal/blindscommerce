-- Migration: Add show_on_homepage_popup column to vendor_coupons table
-- This allows vendors to designate a coupon to be displayed in the exit-intent popup

-- Add the column to vendor_coupons
ALTER TABLE vendor_coupons
ADD COLUMN show_on_homepage_popup TINYINT(1) NOT NULL DEFAULT 0
AFTER is_active;

-- Add index for faster lookup of homepage popup coupons
CREATE INDEX idx_vendor_coupons_homepage_popup
ON vendor_coupons (show_on_homepage_popup, is_active, valid_from, valid_until);

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'vendor_coupons' AND COLUMN_NAME = 'show_on_homepage_popup';
