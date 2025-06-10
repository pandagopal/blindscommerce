import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  name: string;
  price: number;
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
      `SELECT product_id, name, price, category_id, brand_id 
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

      let finalPrice = item.base_price || product.price;
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
        const conditions = JSON.parse(rule.conditions);

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

    // Apply volume discounts
    let volumeDiscountAmount = 0;
    const [volumeDiscounts] = await pool.execute<VolumeDiscountRow[]>(
      `SELECT discount_id, discount_name, volume_tiers, product_id, category_ids, brand_ids
       FROM volume_discounts 
       WHERE is_active = TRUE
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())`
    );

    for (const discount of volumeDiscounts) {
      const tiers = JSON.parse(discount.volume_tiers);
      const totalQuantity = body.items.reduce((sum, item) => {
        const product = productMap.get(item.product_id);
        if (!product) return sum;

        // Check if discount applies to this product
        if (discount.product_id && discount.product_id === product.product_id) {
          return sum + item.quantity;
        }
        if (discount.category_ids) {
          const categoryIds = JSON.parse(discount.category_ids);
          if (categoryIds.includes(product.category_id)) {
            return sum + item.quantity;
          }
        }
        if (discount.brand_ids) {
          const brandIds = JSON.parse(discount.brand_ids);
          if (brandIds.includes(product.brand_id)) {
            return sum + item.quantity;
          }
        }
        return sum;
      }, 0);

      // Find applicable tier
      for (const tier of tiers) {
        if (totalQuantity >= tier.min_qty && (!tier.max_qty || totalQuantity <= tier.max_qty)) {
          if (tier.discount_percent) {
            volumeDiscountAmount += subtotal * (tier.discount_percent / 100);
          }
          if (tier.discount_amount) {
            volumeDiscountAmount += tier.discount_amount;
          }
          break;
        }
      }
    }

    // Apply coupon discount
    let couponDiscountAmount = 0;
    let couponError = null;
    if (body.coupon_code) {
      const [coupons] = await pool.execute<CouponRow[]>(
        `SELECT * FROM coupon_codes 
         WHERE coupon_code = ? 
         AND is_active = TRUE
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())`,
        [body.coupon_code]
      );

      if (coupons.length === 0) {
        couponError = 'Invalid or expired coupon code';
      } else {
        const coupon = coupons[0];
        
        // Check usage limits
        if (coupon.usage_limit_total && coupon.usage_count >= coupon.usage_limit_total) {
          couponError = 'Coupon usage limit exceeded';
        } else if (subtotal < coupon.minimum_order_value) {
          couponError = `Minimum order value of $${coupon.minimum_order_value} required`;
        } else {
          switch (coupon.discount_type) {
            case 'percentage':
              couponDiscountAmount = subtotal * (coupon.discount_value / 100);
              if (coupon.maximum_discount_amount) {
                couponDiscountAmount = Math.min(couponDiscountAmount, coupon.maximum_discount_amount);
              }
              break;
            case 'fixed_amount':
              couponDiscountAmount = coupon.discount_value;
              break;
            case 'free_shipping':
              // Free shipping logic would be handled separately
              break;
          }
        }
      }
    }

    // Apply campaign discount
    let campaignDiscountAmount = 0;
    if (body.campaign_code) {
      const [campaigns] = await pool.execute<CampaignRow[]>(
        `SELECT * FROM promotional_campaigns 
         WHERE campaign_code = ? 
         AND is_active = TRUE
         AND starts_at <= NOW()
         AND ends_at >= NOW()`,
        [body.campaign_code]
      );

      if (campaigns.length > 0) {
        const campaign = campaigns[0];
        if (subtotal >= campaign.minimum_order_value) {
          switch (campaign.campaign_type) {
            case 'percentage_off':
              campaignDiscountAmount = subtotal * (campaign.discount_percent / 100);
              if (campaign.maximum_discount_amount) {
                campaignDiscountAmount = Math.min(campaignDiscountAmount, campaign.maximum_discount_amount);
              }
              break;
            case 'fixed_amount_off':
              campaignDiscountAmount = campaign.discount_amount;
              break;
          }
        }
      }
    }

    const totalDiscountAmount = volumeDiscountAmount + couponDiscountAmount + campaignDiscountAmount;
    const total = Math.max(0, subtotal - totalDiscountAmount);

    return NextResponse.json({
      success: true,
      pricing: {
        items: calculatedItems,
        subtotal,
        discounts: {
          volume_discount: volumeDiscountAmount,
          coupon_discount: couponDiscountAmount,
          campaign_discount: campaignDiscountAmount,
          total_discount: totalDiscountAmount
        },
        total,
        applied_promotions: {
          ...(body.coupon_code && !couponError && { coupon_code: body.coupon_code }),
          ...(body.campaign_code && campaignDiscountAmount > 0 && { campaign_code: body.campaign_code })
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