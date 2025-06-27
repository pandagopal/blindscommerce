# BlindsCommerce Pricing System Documentation

## Overview

The BlindsCommerce pricing system implements a sophisticated 10-step calculation flow as documented in CLAUDE.md. This document provides technical details on the implementation.

## Pricing Calculation Flow

The pricing engine follows this exact sequence:

### 1. Base Price Foundation
- **Table**: `products.base_price`
- **Type**: `DECIMAL(10,2)`
- **Description**: Starting price for the product before any modifications

### 2. Dimensional Pricing Matrix
- **Table**: `product_pricing_matrix`
- **Key Columns**: `width_min`, `width_max`, `height_min`, `height_max`, `base_price`
- **Description**: Adjusts price based on custom dimensions

### 3. Fabric/Material Surcharges
- **Table**: `product_fabric_pricing`
- **Key Column**: `price_per_sqft DECIMAL(10,2)`
- **Calculation**: `(width × height / 144) × price_per_sqft`

### 4. Configuration Modifiers
- **Storage**: `cart_items.configuration` (JSON)
- **Implementation**: `ConfigurationContext.tsx`
- **Includes**: Mount type, control position, bottom rail options

### 5. Customer Tier Pricing
- **Tables**: `pricing_tiers`, `customer_specific_pricing`
- **Types**: B2B discounts, loyalty program tiers, negotiated rates

### 6. Volume/Quantity Breaks
- **Table**: `volume_discounts`
- **Column**: `tier_breaks` (JSON) for quantity thresholds

### 7. Vendor-Specific Discounts
- **Table**: `vendor_discounts`
- **Types**: percentage, fixed_amount, tiered, bulk_pricing

### 8. Coupon Code Application
- **Tables**: `coupon_codes`, `vendor_coupons`
- **Validation**: Expiry dates, usage limits, minimum order amounts

### 9. Tax Calculation (Cached)
- **Table**: `tax_rates`
- **Cache**: 10-minute TTL per ZIP code
- **Integration**: TaxJar API fallback

### 10. Shipping Cost Rules
- **Table**: `shipping_rates`
- **Logic**: Free shipping over $100, weight/size-based rates

## Database Schema Standards

### Column Types
- **Prices**: `DECIMAL(10,2)` - All monetary values use 2 decimal places
- **Percentages**: `DECIMAL(5,2)` - Discount percentages (e.g., 99.99%)
- **Quantities**: `INT` - Whole numbers only
- **Tax Rates**: `DECIMAL(6,4)` - 4 decimal precision (e.g., 8.2500%)

### Constraints
- All price columns must be >= 0 (CHECK constraints)
- Nullable prices default to NULL (not 0.00)
- Discount percentages capped at 100.00

## Implementation Files

### Services
- `/lib/services/ProductService.ts` - `getProductPricing()` method
- `/lib/services/CartService.ts` - Cart total calculations
- `/lib/services/OrderService.ts` - Order pricing finalization
- `/lib/services/taxCalculation.ts` - Tax computation

### API Handlers
- `/lib/api/v2/handlers/CommerceHandler.ts` - Pricing endpoints
- `/app/api/v2/commerce/pricing/calculate` - Main pricing API

### Frontend Components
- `/app/products/configure/[slug]/components/ConfigurationContext.tsx` - Dynamic pricing
- `/components/products/shared/PricingMatrix.tsx` - Price matrix UI

## Caching Strategy

Per CLAUDE.md caching requirements:
- Product prices: 10-minute cache
- Tax rates: 10-minute cache per ZIP
- Discount validation: 2-minute cache
- Vendor data: 15-minute cache

## Testing

### Unit Tests
- Price calculation accuracy
- Discount stacking rules
- Tax calculation verification

### Integration Tests
- End-to-end pricing flow
- Cache invalidation
- Performance under load

## Common Issues & Solutions

### Issue: Decimal Precision Mismatch
**Solution**: Standardize all price columns to `DECIMAL(10,2)`

### Issue: Discount Stacking
**Solution**: Apply discounts in the documented order, largest first

### Issue: Tax Cache Misses
**Solution**: Implement ZIP code normalization before caching

## Monitoring

Key metrics to track:
- Pricing calculation time (<100ms target)
- Cache hit rates (>85% target)
- Discount usage patterns
- Tax API failures

## Migration Scripts

1. `fix-pricing-columns.sql` - Standardizes column types
2. `verify-pricing-engine.ts` - Validates implementation

Run these scripts to ensure compliance with pricing standards.