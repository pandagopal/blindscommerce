# Brand to Vendor Migration Documentation

## Overview
This document describes the changes made to remove references to the `brands` table and use `vendor_info.business_name` as the brand name instead, following the concept that Vendor Company Name = Brand Name.

## Database Schema Changes

### Migration Required
A migration file has been created at `/migrations/add_vendor_id_to_products.sql` that needs to be run to:
1. Add a `vendor_id` column to the `products` table
2. Populate it with data from the `vendor_products` table
3. Identify any products with multiple vendors for manual review

**Important**: Run this migration before deploying the code changes.

## Code Changes Made

### 1. Product API Route (`/app/api/vendor/products/[id]/route.ts`)
- **GET method**: Updated queries to join with `vendor_info` through `vendor_products` table instead of `brands` table
- **PUT method**: Removed brand handling logic, set `brand_id` to NULL in updates
- Now uses `vi.business_name as brand_name` in queries

### 2. Vendor Catalog Route (`/app/api/vendor/catalog/route.ts`)
- Updated both catalog listing and available products queries
- Changed from `JOIN brands b` to `JOIN vendor_info vi` through `vendor_products`
- Returns vendor's business name as the brand name

### 3. Bulk Export Route (`/app/api/vendor/bulk-products/export/route.ts`)
- Updated to join with `vendor_info` through `vendor_products`
- Changed filter from `p.vendor_id` to `vp.vendor_id` since products don't have direct vendor_id yet
- Returns vendor's business name as brand name in exports

### 4. Bulk Import Route (`/app/api/vendor/bulk-products/import/route.ts`)
- Removed brand creation/lookup logic
- Removed `brand_id` from INSERT and UPDATE statements
- Added comment noting that brand_name in imports is ignored

### 5. Product Search Route (`/app/api/products/search/route.ts`)
- Updated main query to join with `vendor_info` through `vendor_products`
- Updated brand filter to use `vi.business_name`
- Modified brand aggregation query to count products by vendor

### 6. Product Search Suggestions (`/app/api/products/search/suggestions/route.ts`)
- Updated brand suggestions to query `vendor_info` table
- Returns vendor business names as brand suggestions

### 7. Recently Viewed Route (`/app/api/recently-viewed/route.ts`)
- Updated to join with `vendor_info` through `vendor_products`
- Returns vendor's business name as brand name

### 8. Product Configuration Routes
- `/app/api/products/[slug]/configuration/route.ts`
- `/app/api/admin/products/[id]/configuration/route.ts`
- Both updated to use `vendor_info` for brand names

## Important Notes

1. **Frontend Compatibility**: The frontend components (like `ProductFilters.tsx`) don't need changes as they continue to receive "brand" data - just now it's vendor business names.

2. **Database Constraint**: Currently, products are linked to vendors through the `vendor_products` junction table. The migration adds a direct `vendor_id` column to products table for better performance and simpler queries.

3. **Multiple Vendors**: The current implementation assumes one product belongs to one vendor. The migration script will identify any products with multiple vendors for manual review.

4. **Brand ID**: The `brand_id` column in products table is now deprecated but not removed. It's being set to NULL in updates.

## Testing Recommendations

1. Test product creation and editing through vendor portal
2. Verify product search and filtering by "brand" (vendor name)
3. Check bulk import/export functionality
4. Ensure product catalog displays correct vendor names as brands
5. Test recently viewed products display

## Future Considerations

1. After running the migration and verifying data integrity, consider:
   - Dropping the `brand_id` column from products table
   - Dropping the `brands` table entirely
   - Updating queries to use direct `p.vendor_id` joins instead of going through `vendor_products`

2. Update any reporting or analytics that may rely on the brands table

3. Consider adding an index on `vendor_info.business_name` for better search performance