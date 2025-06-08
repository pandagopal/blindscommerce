import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Move item back to cart from saved for later
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const cart_item_id = parseInt(params.id);
    const pool = await getPool();

    // Verify item belongs to user's cart and is saved for later
    const [items] = await pool.execute(`
      SELECT ci.cart_item_id, ci.cart_id, ci.product_id, ci.saved_for_later, c.user_id 
      FROM cart_items ci 
      JOIN carts c ON ci.cart_id = c.cart_id 
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    const item = (items as any[])[0];

    if (!item.saved_for_later) {
      return NextResponse.json(
        { error: 'Item is already in cart' },
        { status: 400 }
      );
    }

    // Check stock availability before moving back to cart
    const [products] = await pool.execute(`
      SELECT stock_quantity, status 
      FROM products 
      WHERE product_id = ?
    `, [item.product_id]);

    if (products && (products as any[]).length > 0) {
      const product = (products as any[])[0];
      if (product.stock_quantity <= 0 || product.status !== 'active') {
        return NextResponse.json(
          { 
            error: 'Product is currently out of stock or unavailable',
            stock_status: product.stock_quantity <= 0 ? 'out_of_stock' : 'discontinued'
          },
          { status: 400 }
        );
      }
    }

    // Move item back to cart
    await pool.execute(`
      UPDATE cart_items 
      SET saved_for_later = false, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, product_id, timestamp
      ) VALUES (?, ?, 'moved_to_cart', ?, NOW())
    `, [item.cart_id, user.userId, item.product_id]);

    // Get updated cart items
    const [updatedItems] = await pool.execute(`
      SELECT 
        ci.*,
        p.name,
        p.price as current_price,
        p.stock_quantity,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= 5 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        pi.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE ci.cart_id = ?
      ORDER BY ci.saved_for_later ASC, ci.updated_at DESC
    `, [item.cart_id]);

    return NextResponse.json({
      success: true,
      message: 'Item moved back to cart',
      items: updatedItems
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to move item to cart' },
      { status: 500 }
    );
  }
}