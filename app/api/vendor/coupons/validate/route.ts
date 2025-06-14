import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface CartItem {
  item_id: string;
  product_id: number;
  vendor_id: number;
  quantity: number;
  price: number;
  configuration?: any;
}

interface ValidationResult {
  isValid: boolean;
  coupon?: any;
  discount_amount?: number;
  applicable_items?: CartItem[];
  error?: string;
  warnings?: string[];
}

// POST - Validate vendor coupon for cart application
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    const body = await request.json();
    const { coupon_code, cart_items, user_id, total_amount } = body;

    if (!coupon_code || !Array.isArray(cart_items)) {
      return NextResponse.json({ 
        error: 'Missing required fields: coupon_code, cart_items' 
      }, { status: 400 });
    }

    const connection = await getConnection();

    // Find the coupon
    const [coupons] = await connection.execute<RowDataPacket[]>(
      `SELECT vc.*, vi.business_name as vendor_name 
       FROM vendor_coupons vc
       JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
       WHERE vc.coupon_code = ?`,
      [coupon_code]
    );

    if (coupons.length === 0) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: 'Coupon code not found' 
      });
    }

    const coupon = coupons[0];
    const warnings: string[] = [];
    
    // Parse JSON fields
    const target_ids = coupon.target_ids ? JSON.parse(coupon.target_ids) : null;
    const excluded_ids = coupon.excluded_ids ? JSON.parse(coupon.excluded_ids) : null;
    const customer_types = coupon.customer_types ? JSON.parse(coupon.customer_types) : null;
    const customer_groups = coupon.customer_groups ? JSON.parse(coupon.customer_groups) : null;
    const allowed_regions = coupon.allowed_regions ? JSON.parse(coupon.allowed_regions) : null;
    const excluded_regions = coupon.excluded_regions ? JSON.parse(coupon.excluded_regions) : null;

    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: 'This coupon is not active' 
      });
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: `This coupon is not valid until ${validFrom.toLocaleDateString()}` 
      });
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: 'This coupon has expired' 
      });
    }

    // Check usage limits
    if (coupon.usage_limit_total) {
      if (coupon.usage_count >= coupon.usage_limit_total) {
        return NextResponse.json<ValidationResult>({ 
          isValid: false, 
          error: 'This coupon has reached its usage limit' 
        });
      }
    }

    // Check per-customer usage limit
    if (user_id && coupon.usage_limit_per_customer > 0) {
      const [userUsage] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM vendor_discount_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.coupon_id, user_id]
      );

      if (userUsage[0].count >= coupon.usage_limit_per_customer) {
        return NextResponse.json<ValidationResult>({ 
          isValid: false, 
          error: 'You have already used this coupon the maximum number of times' 
        });
      }
    }

    // Check customer type restrictions
    if (user_id && (coupon.first_time_customers_only || coupon.existing_customers_only)) {
      const [customerOrders] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
        [user_id]
      );

      const isFirstTime = customerOrders[0].count === 0;

      if (coupon.first_time_customers_only && !isFirstTime) {
        return NextResponse.json<ValidationResult>({ 
          isValid: false, 
          error: 'This coupon is only valid for first-time customers' 
        });
      }

      if (coupon.existing_customers_only && isFirstTime) {
        return NextResponse.json<ValidationResult>({ 
          isValid: false, 
          error: 'This coupon is only valid for existing customers' 
        });
      }
    }

    // Filter cart items by vendor
    const vendorItems = cart_items.filter((item: CartItem) => item.vendor_id === coupon.vendor_id);

    if (vendorItems.length === 0) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: `This coupon is only valid for products from ${coupon.vendor_name}` 
      });
    }

    // Filter applicable items based on coupon rules
    let applicableItems = vendorItems;

    if (coupon.applies_to === 'specific_products' && target_ids) {
      applicableItems = vendorItems.filter((item: CartItem) => 
        target_ids.includes(item.product_id)
      );
    } else if (coupon.applies_to === 'specific_categories' && target_ids) {
      // Get product categories
      const productIds = vendorItems.map((item: CartItem) => item.product_id);
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        const [productCategories] = await connection.execute<RowDataPacket[]>(
          `SELECT product_id FROM products WHERE product_id IN (${placeholders}) AND category_id IN (${target_ids.map(() => '?').join(',')})`,
          [...productIds, ...target_ids]
        );
        
        const validProductIds = productCategories.map(row => row.product_id);
        applicableItems = vendorItems.filter((item: CartItem) => 
          validProductIds.includes(item.product_id)
        );
      }
    }

    // Remove excluded items
    if (excluded_ids && excluded_ids.length > 0) {
      if (coupon.applies_to === 'specific_products' || coupon.applies_to === 'all_vendor_products') {
        applicableItems = applicableItems.filter((item: CartItem) => 
          !excluded_ids.includes(item.product_id)
        );
      }
    }

    if (applicableItems.length === 0) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: 'This coupon does not apply to any items in your cart' 
      });
    }

    // Calculate applicable subtotal
    const applicableSubtotal = applicableItems.reduce((sum: number, item: CartItem) => 
      sum + (item.price * item.quantity), 0
    );

    // Check minimum order value
    if (applicableSubtotal < coupon.minimum_order_value) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: `Minimum order value for this coupon is $${coupon.minimum_order_value.toFixed(2)}. Your applicable items total $${applicableSubtotal.toFixed(2)}` 
      });
    }

    // Check minimum quantity
    const totalQuantity = applicableItems.reduce((sum: number, item: CartItem) => 
      sum + item.quantity, 0
    );

    if (totalQuantity < coupon.minimum_quantity) {
      return NextResponse.json<ValidationResult>({ 
        isValid: false, 
        error: `Minimum quantity for this coupon is ${coupon.minimum_quantity} items. You have ${totalQuantity} applicable items` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;

    switch (coupon.discount_type) {
      case 'percentage':
        discountAmount = applicableSubtotal * (coupon.discount_value / 100);
        break;
      case 'fixed_amount':
        discountAmount = coupon.discount_value;
        break;
      case 'free_shipping':
        discountAmount = 0; // Handled separately in shipping calculation
        break;
      case 'upgrade':
        discountAmount = coupon.discount_value;
        break;
    }

    // Apply maximum discount limit
    if (coupon.maximum_discount_amount && discountAmount > coupon.maximum_discount_amount) {
      discountAmount = coupon.maximum_discount_amount;
      warnings.push(`Discount capped at maximum amount of $${coupon.maximum_discount_amount.toFixed(2)}`);
    }

    // Ensure discount doesn't exceed applicable subtotal
    if (discountAmount > applicableSubtotal) {
      discountAmount = applicableSubtotal;
      warnings.push('Discount amount adjusted to not exceed item costs');
    }

    // Add usage limit warnings
    if (coupon.usage_limit_total) {
      const remaining = coupon.usage_limit_total - coupon.usage_count;
      if (remaining <= 5) {
        warnings.push(`Only ${remaining} uses remaining for this coupon`);
      }
    }

    const result: ValidationResult = {
      isValid: true,
      coupon: {
        coupon_id: coupon.coupon_id,
        vendor_id: coupon.vendor_id,
        vendor_name: coupon.vendor_name,
        coupon_code: coupon.coupon_code,
        coupon_name: coupon.coupon_name,
        display_name: coupon.display_name,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        terms_conditions: coupon.terms_conditions
      },
      discount_amount: discountAmount,
      applicable_items: applicableItems,
      warnings: warnings.length > 0 ? warnings : undefined
    };

    return NextResponse.json<ValidationResult>(result);

  } catch (error) {
    console.error('Error validating vendor coupon:', error);
    return NextResponse.json<ValidationResult>({ 
      isValid: false, 
      error: 'Internal server error during coupon validation' 
    }, { status: 500 });
  }
}