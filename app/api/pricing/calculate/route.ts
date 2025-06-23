import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getFreeShippingThreshold, getMinimumOrderAmount } from '@/lib/settings';
import { calculateTax } from '@/lib/services/taxCalculation';

interface PricingCalculationRequest {
  items: Array<{
    product_id: number;
    quantity: number;
    base_price?: number;
  }>;
  customer_id?: number;
  customer_type?: 'retail' | 'commercial' | 'trade';
  coupon_code?: string;
  campaign_code?: string;
  shipping_state?: string;
  zip_code?: string;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  name: string;
  base_price: number;
  category_id: number;
  brand_id: number;
}

interface VolumeDiscountRow extends RowDataPacket {
  discount_id: number;
  discount_name: string;
  volume_tiers: string;
  product_id: number;
  category_ids: string;
  brand_ids: string;
}

interface CustomerPricingRow extends RowDataPacket {
  pricing_type: string;
  pricing_value: number;
  minimum_quantity: number;
}

interface CouponRow extends RowDataPacket {
  coupon_id: number;
  discount_type: string;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount_amount: number;
  usage_count: number;
  usage_limit_total: number;
  usage_limit_per_customer: number;
}

interface CampaignRow extends RowDataPacket {
  campaign_id: number;
  campaign_type: string;
  discount_percent: number;
  discount_amount: number;
  minimum_order_value: number;
  maximum_discount_amount: number;
}

interface DynamicPricingRow extends RowDataPacket {
  rule_id: number;
  rule_type: string;
  adjustment_type: string;
  adjustment_value: number;
  min_price: number;
  max_price: number;
  conditions: string;
}

// POST /api/pricing/calculate - Calculate pricing with all discounts and rules
export async function POST(req: NextRequest) {
  try {
    const body: PricingCalculationRequest = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get product details
    const productIds = body.items.map(item => item.product_id);
    const [products] = await pool.execute<ProductRow[]>(
      `SELECT product_id, name, base_price, category_id, brand_id 
       FROM products 
       WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found' },
        { status: 404 }
      );
    }

    const productMap = new Map(products.map(p => [p.product_id, p]));
    const calculatedItems = [];
    let subtotal = 0;

    // Calculate base pricing for each item
    for (const item of body.items) {
      const product = productMap.get(item.product_id);
      if (!product) continue;

      let finalPrice = item.base_price || product.base_price;
      const originalPrice = finalPrice;
      let appliedDiscounts = [];

      // Apply customer-specific pricing
      if (body.customer_id) {
        const [customerPricing] = await pool.execute<CustomerPricingRow[]>(
          `SELECT pricing_type, pricing_value, minimum_quantity
           FROM customer_specific_pricing 
           WHERE customer_id = ? 
           AND (product_id = ? OR (product_id IS NULL AND category_id = ?) OR (product_id IS NULL AND category_id IS NULL AND brand_id = ?))
           AND approval_status = 'approved'
           AND (valid_until IS NULL OR valid_until >= CURDATE())
           AND ? >= minimum_quantity
           ORDER BY 
             CASE WHEN product_id IS NOT NULL THEN 1
                  WHEN category_id IS NOT NULL THEN 2
                  WHEN brand_id IS NOT NULL THEN 3
                  ELSE 4 END
           LIMIT 1`,
          [body.customer_id, product.product_id, product.category_id, product.brand_id, item.quantity]
        );

        if (customerPricing.length > 0) {
          const pricing = customerPricing[0];
          switch (pricing.pricing_type) {
            case 'fixed_price':
              finalPrice = pricing.pricing_value;
              break;
            case 'discount_percent':
              finalPrice = originalPrice * (1 - pricing.pricing_value / 100);
              break;
            case 'discount_amount':
              finalPrice = Math.max(0, originalPrice - pricing.pricing_value);
              break;
            case 'markup_percent':
              finalPrice = originalPrice * (1 + pricing.pricing_value / 100);
              break;
          }
          appliedDiscounts.push({
            type: 'customer_specific',
            description: `Customer-specific ${pricing.pricing_type}`,
            value: pricing.pricing_value,
            amount: originalPrice - finalPrice
          });
        }
      }

      // Apply dynamic pricing rules
      const [dynamicRules] = await pool.execute<DynamicPricingRow[]>(
        `SELECT rule_id, rule_type, adjustment_type, adjustment_value, min_price, max_price, conditions
         FROM dynamic_pricing_rules 
         WHERE is_active = TRUE
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (product_id = ? OR product_id IS NULL)
         ORDER BY priority ASC`,
        [product.product_id]
      );

      for (const rule of dynamicRules) {
        let shouldApply = false;
        let conditions;
        try {
          conditions = JSON.parse(rule.conditions);
        } catch (error) {
          console.error('Invalid conditions JSON for rule', rule.rule_id, ':', rule.conditions);
          continue; // Skip this rule if JSON is invalid
        }

        // Check rule conditions based on rule type
        switch (rule.rule_type) {
          case 'time_based':
            const now = new Date();
            const currentHour = now.getHours();
            if (conditions.hours && conditions.hours.includes(currentHour)) {
              shouldApply = true;
            }
            break;
          case 'inventory_based':
            // Could add inventory checks here
            shouldApply = true;
            break;
          case 'seasonal':
            const currentMonth = new Date().getMonth() + 1;
            if (conditions.months && conditions.months.includes(currentMonth)) {
              shouldApply = true;
            }
            break;
          default:
            shouldApply = true;
        }

        if (shouldApply) {
          const previousPrice = finalPrice;
          switch (rule.adjustment_type) {
            case 'percentage':
              finalPrice = finalPrice * (1 + rule.adjustment_value / 100);
              break;
            case 'fixed_amount':
              finalPrice = finalPrice + rule.adjustment_value;
              break;
            case 'multiply_by':
              finalPrice = finalPrice * rule.adjustment_value;
              break;
          }

          // Apply min/max price constraints
          if (rule.min_price && finalPrice < rule.min_price) {
            finalPrice = rule.min_price;
          }
          if (rule.max_price && finalPrice > rule.max_price) {
            finalPrice = rule.max_price;
          }

          if (finalPrice !== previousPrice) {
            appliedDiscounts.push({
              type: 'dynamic_pricing',
              description: `${rule.rule_type} pricing rule`,
              amount: previousPrice - finalPrice
            });
          }
        }
      }

      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;

      calculatedItems.push({
        product_id: item.product_id,
        name: product.name,
        quantity: item.quantity,
        original_price: originalPrice,
        final_price: finalPrice,
        item_total: itemTotal,
        applied_discounts: appliedDiscounts
      });
    }

    // MULTI-VENDOR DISCOUNT SYSTEM:
    // 1. Only vendor-specific discounts/coupons (no platform-wide)
    // 2. Order: Vendor discounts first (automatic) → then vendor coupons (automatic)  
    // 3. Each vendor's discounts apply ONLY to their own products
    // 4. Track all applied discounts per vendor for cart display
    
    let appliedDiscountsList = [];
    let totalDiscountAmount = 0;

    // STEP 1: Get vendor mapping for all products in cart
    const productIds = calculatedItems.map(item => item.product_id);
    const [vendorMappings] = await pool.execute<any[]>(
      `SELECT vp.product_id, vp.vendor_id, vi.business_name as vendor_name
       FROM vendor_products vp
       JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
       WHERE vp.product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    // Create vendor mapping lookup
    const productVendorMap = new Map();
    vendorMappings.forEach(mapping => {
      productVendorMap.set(mapping.product_id, {
        vendor_id: mapping.vendor_id,
        vendor_name: mapping.vendor_name
      });
    });

    // STEP 2: Group cart items by vendor
    const itemsByVendor = new Map();
    calculatedItems.forEach(item => {
      const vendorInfo = productVendorMap.get(item.product_id);
      if (vendorInfo) {
        const vendorId = vendorInfo.vendor_id;
        if (!itemsByVendor.has(vendorId)) {
          itemsByVendor.set(vendorId, {
            vendor_name: vendorInfo.vendor_name,
            items: [],
            subtotal: 0,
            total_quantity: 0
          });
        }
        const vendorData = itemsByVendor.get(vendorId);
        vendorData.items.push({...item, vendor_id: vendorId});
        vendorData.subtotal += item.item_total;
        vendorData.total_quantity += item.quantity;
      }
    });

    // STEP 3: Apply vendor discounts first (automatic) - per vendor
    for (const [vendorId, vendorData] of itemsByVendor) {
      // Get automatic discounts for this specific vendor
      const [vendorDiscounts] = await pool.execute<any[]>(
        `SELECT discount_id, discount_name, discount_type, discount_value, minimum_order_value, 
                maximum_discount_amount, minimum_quantity, applies_to, target_ids, volume_tiers
         FROM vendor_discounts 
         WHERE vendor_id = ? AND is_active = TRUE AND is_automatic = TRUE
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         ORDER BY priority DESC`,
        [vendorId]
      );

      let bestDiscount = null;
      let bestDiscountAmount = 0;

      for (const discount of vendorDiscounts) {
        // Check if vendor's subtotal and quantity meet requirements
        if (vendorData.subtotal >= discount.minimum_order_value && 
            vendorData.total_quantity >= discount.minimum_quantity) {
          
          let discountAmount = 0;
          let applicableItems = vendorData.items;

          // Filter items based on discount target
          if (discount.applies_to === 'specific_products' && discount.target_ids) {
            try {
              const targetIds = JSON.parse(discount.target_ids);
              applicableItems = vendorData.items.filter(item => targetIds.includes(item.product_id));
            } catch (e) {
              console.error('Invalid target_ids JSON:', discount.target_ids);
              continue;
            }
          } else if (discount.applies_to === 'specific_categories' && discount.target_ids) {
            try {
              const targetCategoryIds = JSON.parse(discount.target_ids);
              // Get categories for vendor items
              const vendorProductIds = vendorData.items.map(item => item.product_id);
              const [productCategories] = await pool.execute<any[]>(
                `SELECT product_id, category_id FROM products WHERE product_id IN (${vendorProductIds.map(() => '?').join(',')})`,
                vendorProductIds
              );
              const productCategoryMap = new Map();
              productCategories.forEach(pc => productCategoryMap.set(pc.product_id, pc.category_id));
              
              applicableItems = vendorData.items.filter(item => 
                targetCategoryIds.includes(productCategoryMap.get(item.product_id))
              );
            } catch (e) {
              console.error('Invalid category target_ids JSON:', discount.target_ids);
              continue;
            }
          }

          if (applicableItems.length === 0) continue;

          const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.item_total, 0);
          const applicableQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);

          // Calculate discount amount
          switch (discount.discount_type) {
            case 'percentage':
              discountAmount = applicableSubtotal * (discount.discount_value / 100);
              break;
            case 'fixed_amount':
              discountAmount = discount.discount_value;
              break;
            case 'tiered':
              if (discount.volume_tiers) {
                try {
                  const tiers = JSON.parse(discount.volume_tiers);
                  const tier = tiers.find(t => 
                    applicableQuantity >= t.min_qty && 
                    (!t.max_qty || applicableQuantity <= t.max_qty)
                  );
                  if (tier) {
                    if (tier.discount_percent) {
                      discountAmount = applicableSubtotal * (tier.discount_percent / 100);
                    } else if (tier.discount_amount) {
                      discountAmount = tier.discount_amount;
                    }
                  }
                } catch (e) {
                  console.error('Invalid volume_tiers JSON:', discount.volume_tiers);
                }
              }
              break;
          }

          // Apply maximum discount limit
          if (discount.maximum_discount_amount && discountAmount > discount.maximum_discount_amount) {
            discountAmount = discount.maximum_discount_amount;
          }

          // Ensure discount doesn't exceed applicable subtotal
          discountAmount = Math.min(discountAmount, applicableSubtotal);

          // Keep track of best discount for this vendor
          if (discountAmount > bestDiscountAmount) {
            bestDiscount = discount;
            bestDiscountAmount = discountAmount;
          }
        }
      }

      // Apply the best discount found for this vendor
      if (bestDiscount && bestDiscountAmount > 0) {
        totalDiscountAmount += bestDiscountAmount;
        appliedDiscountsList.push({
          type: 'vendor_discount',
          vendor_id: vendorId,
          vendor_name: vendorData.vendor_name,
          discount_id: bestDiscount.discount_id,
          name: bestDiscount.discount_name,
          discount_type: bestDiscount.discount_type,
          amount: bestDiscountAmount,
          applied_to: bestDiscount.applies_to,
          vendor_subtotal: vendorData.subtotal,
          vendor_subtotal_after: vendorData.subtotal - bestDiscountAmount
        });
      }
    }

    // STEP 4: Apply vendor coupons after discounts (if provided)
    let couponError = null;
    if (body.coupon_code) {
      // Only check vendor-specific coupons (NO platform-wide coupons)
      const [vendorCoupons] = await pool.execute<any[]>(
        `SELECT vc.coupon_id, vc.vendor_id, vc.discount_type, vc.discount_value, vc.minimum_order_value, 
                vc.maximum_discount_amount, vc.usage_count, vc.usage_limit_total, vc.usage_limit_per_customer,
                vc.coupon_name, vi.business_name as vendor_name
         FROM vendor_coupons vc
         JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
         WHERE vc.coupon_code = ? 
         AND vc.is_active = TRUE
         AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
         AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())`,
        [body.coupon_code]
      );

      if (vendorCoupons.length === 0) {
        couponError = 'Invalid or expired coupon code';
      } else {
        const vendorCoupon = vendorCoupons[0];
        const couponVendorId = vendorCoupon.vendor_id;
        
        // Check if cart has products from this vendor
        const vendorData = itemsByVendor.get(couponVendorId);
        if (!vendorData) {
          couponError = `No products from ${vendorCoupon.vendor_name} in your cart`;
        } else {
          // Calculate vendor subtotal after any discounts already applied
          let vendorSubtotalAfterDiscounts = vendorData.subtotal;
          const existingVendorDiscount = appliedDiscountsList.find(d => 
            d.type === 'vendor_discount' && d.vendor_id === couponVendorId
          );
          if (existingVendorDiscount) {
            vendorSubtotalAfterDiscounts -= existingVendorDiscount.amount;
          }

          // Check coupon requirements
          if (vendorCoupon.usage_limit_total && vendorCoupon.usage_count >= vendorCoupon.usage_limit_total) {
            couponError = 'Coupon usage limit exceeded';
          } else if (vendorSubtotalAfterDiscounts < vendorCoupon.minimum_order_value) {
            couponError = `Minimum order value of $${vendorCoupon.minimum_order_value} required for ${vendorCoupon.vendor_name}`;
          } else {
            let couponDiscountAmount = 0;
            
            switch (vendorCoupon.discount_type) {
              case 'percentage':
                couponDiscountAmount = vendorSubtotalAfterDiscounts * (vendorCoupon.discount_value / 100);
                if (vendorCoupon.maximum_discount_amount) {
                  couponDiscountAmount = Math.min(couponDiscountAmount, vendorCoupon.maximum_discount_amount);
                }
                break;
              case 'fixed_amount':
                couponDiscountAmount = Math.min(vendorCoupon.discount_value, vendorSubtotalAfterDiscounts);
                break;
              case 'free_shipping':
                // Free shipping logic handled separately
                couponDiscountAmount = 0;
                break;
            }

            if (couponDiscountAmount > 0) {
              totalDiscountAmount += couponDiscountAmount;
              appliedDiscountsList.push({
                type: 'vendor_coupon',
                vendor_id: couponVendorId,
                vendor_name: vendorCoupon.vendor_name,
                coupon_id: vendorCoupon.coupon_id,
                coupon_code: body.coupon_code,
                name: vendorCoupon.coupon_name,
                discount_type: vendorCoupon.discount_type,
                amount: couponDiscountAmount,
                applied_to: 'vendor_products',
                vendor_subtotal_before_coupon: vendorSubtotalAfterDiscounts,
                vendor_subtotal_after_coupon: vendorSubtotalAfterDiscounts - couponDiscountAmount
              });
            }
          }
        }
      }
    }

    // Calculate final totals with vendor-specific discounts
    const discountedSubtotal = Math.max(0, subtotal - totalDiscountAmount);

    // Get admin settings for shipping
    const freeShippingThreshold = await getFreeShippingThreshold();
    const minimumOrderAmount = await getMinimumOrderAmount();

    // Check minimum order amount
    if (discountedSubtotal < minimumOrderAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount of $${minimumOrderAmount.toFixed(2)} is required. Current total: $${discountedSubtotal.toFixed(2)}`,
        pricing: {
          items: calculatedItems,
          subtotal,
          vendor_discounts: appliedDiscountsList.filter(d => d.type === 'vendor_discount'),
          vendor_coupons: appliedDiscountsList.filter(d => d.type === 'vendor_coupon'),
          total_discount_amount: totalDiscountAmount,
          applied_discounts_list: appliedDiscountsList,
          discounted_subtotal: discountedSubtotal,
          minimum_order_required: minimumOrderAmount,
          shipping: 0,
          tax: 0,
          total: 0,
          vendors_in_cart: Array.from(itemsByVendor.keys()).length
        }
      }, { status: 400 });
    }

    // Calculate shipping (free if above threshold)
    let shippingCost = 0;
    const isFreeShipping = discountedSubtotal >= freeShippingThreshold;
    
    if (!isFreeShipping) {
      // Calculate shipping cost - enhanced with vendor-specific shipping rules
      shippingCost = 9.99;
      
      // Check if any applied vendor coupons provide free shipping
      const freeShippingCoupon = appliedDiscountsList.find(
        discount => discount.type === 'vendor_coupon' && discount.discount_type === 'free_shipping'
      );
      
      if (freeShippingCoupon) {
        shippingCost = 0;
      }
    }

    // Calculate tax using ZIP code-based rates (only if ZIP code is provided)
    let taxCalculation = null;
    if (body.zip_code && body.zip_code.trim().length >= 5) {
      taxCalculation = await calculateTax(discountedSubtotal + shippingCost, body.zip_code.trim());
    }
    
    const finalTotal = discountedSubtotal + shippingCost + (taxCalculation?.tax_amount || 0);

    return NextResponse.json({
      success: true,
      pricing: {
        items: calculatedItems,
        subtotal,
        vendor_discounts: appliedDiscountsList.filter(d => d.type === 'vendor_discount'),
        vendor_coupons: appliedDiscountsList.filter(d => d.type === 'vendor_coupon'),
        total_discount_amount: totalDiscountAmount,
        applied_discounts_list: appliedDiscountsList,
        discounted_subtotal: discountedSubtotal,
        shipping: shippingCost,
        is_free_shipping: isFreeShipping,
        free_shipping_threshold: freeShippingThreshold,
        tax_rate: taxCalculation?.tax_rate || 0,
        tax: taxCalculation?.tax_amount || 0,
        tax_breakdown: taxCalculation?.tax_breakdown,
        tax_jurisdiction: taxCalculation?.tax_jurisdiction,
        zip_code: taxCalculation?.zip_code,
        total: finalTotal,
        vendors_in_cart: Array.from(itemsByVendor.keys()).length,
        applied_promotions: {
          ...(body.coupon_code && !couponError && { coupon_code: body.coupon_code })
        }
      },
      ...(couponError && { coupon_error: couponError })
    });

  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}