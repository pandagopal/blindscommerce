import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';
import { 
  parseJsonSafely, 
  getVendorNameFromItems,
  calculatePercentage,
  clampNumber 
} from '@/lib/utils/vendorDiscountHelpers';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  vendor_id: number;
  quantity: number;
  price: number;
  product_name: string;
  vendor_name: string;
}

interface VendorDiscount {
  discount_id: number;
  vendor_id: number;
  discount_name: string;
  discount_type: string;
  discount_value: number;
  volume_tiers: any;
  minimum_order_value: number;
  maximum_discount_amount: number | null;
  minimum_quantity: number;
  applies_to: string;
  target_ids: any;
  stackable_with_coupons: boolean;
  priority: number;
}

interface AppliedDiscount {
  vendor_id: number;
  vendor_name: string;
  discount_id: number;
  discount_name: string;
  discount_type: string;
  discount_amount: number;
  applied_items: Array<{
    cart_item_id: number;
    original_price: number;
    discounted_price: number;
    discount_amount: number;
  }>;
  subtotal_before: number;
  subtotal_after: number;
}

// POST - Calculate and apply automatic vendor discounts to cart
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const body = await request.json();
    const { cart_id, user_id } = body;

    if (!cart_id) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 });
    }

    const connection = await getConnection();

    // Get cart items with vendor information
    const [cartItems] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        ci.cart_item_id,
        ci.product_id,
        ci.quantity,
        ci.price,
        p.product_name,
        vp.vendor_id,
        vi.business_name as vendor_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN vendor_products vp ON p.product_id = vp.product_id
      JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      WHERE ci.cart_id = ?
      ORDER BY vp.vendor_id, ci.cart_item_id`,
      [cart_id]
    );

    if (cartItems.length === 0) {
      return NextResponse.json({ applied_discounts: [], total_discount_amount: 0 });
    }

    // Group items by vendor
    const itemsByVendor = cartItems.reduce((acc: Record<number, CartItem[]>, item: any) => {
      if (!acc[item.vendor_id]) {
        acc[item.vendor_id] = [];
      }
      acc[item.vendor_id].push(item);
      return acc;
    }, {});

    const appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscountAmount = 0;

    // Process each vendor separately
    for (const [vendorIdStr, items] of Object.entries(itemsByVendor)) {
      const vendorId = parseInt(vendorIdStr);
      const vendorItems = items as CartItem[];

      // Get active automatic discounts for this vendor
      const [vendorDiscounts] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM vendor_discounts 
         WHERE vendor_id = ? 
         AND is_active = 1 
         AND is_automatic = 1
         AND valid_from <= NOW() 
         AND (valid_until IS NULL OR valid_until > NOW())
         ORDER BY priority DESC, discount_id`,
        [vendorId]
      );

      if (vendorDiscounts.length === 0) continue;

      // Calculate vendor subtotal and total quantity
      const vendorSubtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vendorQuantity = vendorItems.reduce((sum, item) => sum + item.quantity, 0);

      // Find best applicable discount for this vendor
      let bestDiscount: VendorDiscount | null = null;
      let bestDiscountAmount = 0;

      for (const discount of vendorDiscounts as VendorDiscount[]) {
        // Parse JSON fields safely
        const volumeTiers = parseJsonSafely<any[]>(discount.volume_tiers, null);
        const targetIds = parseJsonSafely<number[]>(discount.target_ids, null);

        // Check minimum requirements
        if (vendorSubtotal < discount.minimum_order_value) continue;
        if (vendorQuantity < discount.minimum_quantity) continue;

        // Filter applicable items
        let applicableItems = vendorItems;
        
        if (discount.applies_to === 'specific_products' && targetIds) {
          applicableItems = vendorItems.filter(item => targetIds.includes(item.product_id));
        } else if (discount.applies_to === 'specific_categories' && targetIds) {
          // Get product categories for vendor items
          const productIds = vendorItems.map(item => item.product_id);
          const placeholders = productIds.map(() => '?').join(',');
          const [productCategories] = await connection.execute<RowDataPacket[]>(
            `SELECT product_id FROM products WHERE product_id IN (${placeholders}) AND category_id IN (${targetIds.map(() => '?').join(',')})`,
            [...productIds, ...targetIds]
          );
          
          const validProductIds = productCategories.map(row => row.product_id);
          applicableItems = vendorItems.filter(item => validProductIds.includes(item.product_id));
        }

        if (applicableItems.length === 0) continue;

        const applicableSubtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const applicableQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);

        let discountAmount = 0;

        // Calculate discount based on type
        switch (discount.discount_type) {
          case 'percentage':
            discountAmount = calculatePercentage(applicableSubtotal, discount.discount_value);
            break;
          
          case 'fixed_amount':
            discountAmount = discount.discount_value;
            break;
          
          case 'tiered':
            if (volumeTiers) {
              // Find applicable tier
              const tier = volumeTiers.find((t: any) => 
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
            }
            break;
          
          case 'bulk_pricing':
            // Similar to tiered but applies per item
            if (volumeTiers) {
              const tier = volumeTiers.find((t: any) => 
                applicableQuantity >= t.min_qty && 
                (!t.max_qty || applicableQuantity <= t.max_qty)
              );
              
              if (tier && tier.discount_percent) {
                discountAmount = applicableSubtotal * (tier.discount_percent / 100);
              }
            }
            break;
        }

        // Apply maximum discount limit
        if (discount.maximum_discount_amount && discountAmount > discount.maximum_discount_amount) {
          discountAmount = discount.maximum_discount_amount;
        }

        // Ensure discount doesn't exceed applicable subtotal
        if (discountAmount > applicableSubtotal) {
          discountAmount = applicableSubtotal;
        }

        // Check if this is the best discount so far
        if (discountAmount > bestDiscountAmount) {
          bestDiscount = discount;
          bestDiscountAmount = discountAmount;
        }
      }

      // Apply the best discount found
      if (bestDiscount && bestDiscountAmount > 0) {
        const discount = bestDiscount;
        const volumeTiers = parseJsonSafely<any[]>(discount.volume_tiers, null);
        const targetIds = parseJsonSafely<number[]>(discount.target_ids, null);

        // Filter applicable items again for the selected discount
        let applicableItems = vendorItems;
        
        if (discount.applies_to === 'specific_products' && targetIds) {
          applicableItems = vendorItems.filter(item => targetIds.includes(item.product_id));
        } else if (discount.applies_to === 'specific_categories' && targetIds) {
          const productIds = vendorItems.map(item => item.product_id);
          const placeholders = productIds.map(() => '?').join(',');
          const [productCategories] = await connection.execute<RowDataPacket[]>(
            `SELECT product_id FROM products WHERE product_id IN (${placeholders}) AND category_id IN (${targetIds.map(() => '?').join(',')})`,
            [...productIds, ...targetIds]
          );
          
          const validProductIds = productCategories.map(row => row.product_id);
          applicableItems = vendorItems.filter(item => validProductIds.includes(item.product_id));
        }

        const applicableSubtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Calculate per-item discount amounts
        const appliedItems = applicableItems.map(item => {
          const itemSubtotal = item.price * item.quantity;
          const itemDiscountRatio = itemSubtotal / applicableSubtotal;
          const itemDiscountAmount = bestDiscountAmount * itemDiscountRatio;
          const discountedPrice = item.price - (itemDiscountAmount / item.quantity);

          return {
            cart_item_id: item.cart_item_id,
            original_price: item.price,
            discounted_price: Math.max(0, discountedPrice),
            discount_amount: itemDiscountAmount
          };
        });

        // Get vendor name safely
        const vendorName = getVendorNameFromItems(vendorItems);
        if (!vendorName) {
          console.error(`Missing vendor name for vendor ID: ${vendorId}`);
          continue; // Skip this vendor if no name found
        }

        const vendorDiscount: AppliedDiscount = {
          vendor_id: vendorId,
          vendor_name: vendorName,
          discount_id: discount.discount_id,
          discount_name: discount.discount_name,
          discount_type: discount.discount_type,
          discount_amount: bestDiscountAmount,
          applied_items: appliedItems,
          subtotal_before: vendorSubtotal,
          subtotal_after: vendorSubtotal - bestDiscountAmount
        };

        appliedDiscounts.push(vendorDiscount);
        totalDiscountAmount += bestDiscountAmount;

        // Store discount application in database for tracking
        await pool.execute(
          `INSERT INTO cart_vendor_discounts 
           (cart_id, vendor_id, discount_id, discount_type, discount_name, discount_amount, applied_to_items, subtotal_before, subtotal_after)
           VALUES (?, ?, ?, 'automatic', ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           discount_amount = VALUES(discount_amount),
           applied_to_items = VALUES(applied_to_items),
           subtotal_before = VALUES(subtotal_before),
           subtotal_after = VALUES(subtotal_after),
           updated_at = CURRENT_TIMESTAMP`,
          [
            cart_id,
            vendorId,
            discount.discount_id,
            discount.discount_name,
            bestDiscountAmount,
            JSON.stringify(appliedItems),
            vendorSubtotal,
            vendorSubtotal - bestDiscountAmount
          ]
        );
      }
    }

    return NextResponse.json({
      applied_discounts: appliedDiscounts,
      total_discount_amount: totalDiscountAmount,
      vendors_processed: Object.keys(itemsByVendor).length
    });

  } catch (error) {
    console.error('Error calculating vendor discounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}