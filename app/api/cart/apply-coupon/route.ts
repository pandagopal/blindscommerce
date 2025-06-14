import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  vendor_id: number;
  quantity: number;
  price: number;
  product_name: string;
  vendor_name: string;
}

// POST - Apply vendor coupon to cart
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const body = await request.json();
    const { cart_id, coupon_code, user_id } = body;

    if (!cart_id || !coupon_code) {
      return NextResponse.json({ 
        error: 'Cart ID and coupon code are required' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'Cart is empty' 
      }, { status: 400 });
    }

    // Validate coupon using the validation endpoint
    const validationResponse = await fetch(`${request.url.replace('/apply-coupon', '/validate')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code,
        cart_items: cartItems,
        user_id,
        total_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      })
    });

    if (!validationResponse.ok) {
      const validationError = await validationResponse.json();
      return NextResponse.json(validationError, { status: validationResponse.status });
    }

    const validationResult = await validationResponse.json();

    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: validationResult.error 
      }, { status: 400 });
    }

    const { coupon, discount_amount, applicable_items } = validationResult;

    // Check if this coupon is already applied to the cart
    const [existingCoupon] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM cart_vendor_discounts 
       WHERE cart_id = ? AND vendor_id = ? AND discount_type = 'coupon' AND discount_code = ?`,
      [cart_id, coupon.vendor_id, coupon_code]
    );

    if (existingCoupon.length > 0) {
      return NextResponse.json({ 
        error: 'This coupon is already applied to your cart' 
      }, { status: 409 });
    }

    // Check if another coupon from the same vendor is already applied (if not stackable)
    if (!coupon.stackable_with_other_coupons) {
      const [existingVendorCoupon] = await connection.execute<RowDataPacket[]>(
        `SELECT discount_code FROM cart_vendor_discounts 
         WHERE cart_id = ? AND vendor_id = ? AND discount_type = 'coupon'`,
        [cart_id, coupon.vendor_id]
      );

      if (existingVendorCoupon.length > 0) {
        return NextResponse.json({ 
          error: `You already have a coupon applied from ${coupon.vendor_name}. This coupon cannot be combined with other coupons.` 
        }, { status: 409 });
      }
    }

    // Calculate the vendor subtotal before coupon
    const vendorSubtotal = applicable_items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    // Calculate per-item discount amounts
    const appliedItems = applicable_items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscountRatio = itemSubtotal / vendorSubtotal;
      const itemDiscountAmount = discount_amount * itemDiscountRatio;
      const discountedPrice = item.price - (itemDiscountAmount / item.quantity);

      return {
        cart_item_id: item.cart_item_id,
        original_price: item.price,
        discounted_price: Math.max(0, discountedPrice),
        discount_amount: itemDiscountAmount
      };
    });

    // Store coupon application in database
    await connection.execute(
      `INSERT INTO cart_vendor_discounts 
       (cart_id, vendor_id, coupon_id, discount_type, discount_code, discount_name, discount_amount, applied_to_items, subtotal_before, subtotal_after)
       VALUES (?, ?, ?, 'coupon', ?, ?, ?, ?, ?, ?)`,
      [
        cart_id,
        coupon.vendor_id,
        coupon.coupon_id,
        coupon_code,
        coupon.display_name || coupon.coupon_name,
        discount_amount,
        JSON.stringify(appliedItems),
        vendorSubtotal,
        vendorSubtotal - discount_amount
      ]
    );

    // Record usage for analytics (but don't increment usage count until order is completed)
    await connection.execute(
      `INSERT INTO vendor_discount_usage 
       (vendor_id, coupon_id, user_id, cart_id, usage_type, discount_code, original_amount, discount_amount, final_amount, quantity)
       VALUES (?, ?, ?, ?, 'coupon', ?, ?, ?, ?, ?)`,
      [
        coupon.vendor_id,
        coupon.coupon_id,
        user_id,
        cart_id,
        coupon_code,
        vendorSubtotal,
        discount_amount,
        vendorSubtotal - discount_amount,
        applicable_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Coupon "${coupon_code}" applied successfully!`,
      coupon: {
        vendor_id: coupon.vendor_id,
        vendor_name: coupon.vendor_name,
        coupon_code: coupon_code,
        coupon_name: coupon.display_name || coupon.coupon_name,
        discount_type: coupon.discount_type,
        discount_amount: discount_amount
      },
      applied_items: appliedItems,
      subtotal_before: vendorSubtotal,
      subtotal_after: vendorSubtotal - discount_amount,
      warnings: validationResult.warnings
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove coupon from cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const cart_id = searchParams.get('cart_id');
    const coupon_code = searchParams.get('coupon_code');

    if (!cart_id || !coupon_code) {
      return NextResponse.json({ 
        error: 'Cart ID and coupon code are required' 
      }, { status: 400 });
    }

    const connection = await getConnection();

    // Remove coupon from cart
    const [result] = await connection.execute<any>(
      `DELETE FROM cart_vendor_discounts 
       WHERE cart_id = ? AND discount_type = 'coupon' AND discount_code = ?`,
      [cart_id, coupon_code]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        error: 'Coupon not found in cart' 
      }, { status: 404 });
    }

    // Remove from usage tracking (for analytics)
    await connection.execute(
      `DELETE FROM vendor_discount_usage 
       WHERE cart_id = ? AND usage_type = 'coupon' AND discount_code = ?`,
      [cart_id, coupon_code]
    );

    return NextResponse.json({
      success: true,
      message: `Coupon "${coupon_code}" removed successfully`
    });

  } catch (error) {
    console.error('Error removing coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}