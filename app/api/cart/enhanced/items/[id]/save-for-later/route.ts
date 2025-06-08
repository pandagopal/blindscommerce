import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Save item for later
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

    // Verify item belongs to user's cart
    const [items] = await pool.execute(`
      SELECT ci.cart_item_id, ci.cart_id, ci.product_id, c.user_id 
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

    // Update item to saved for later
    await pool.execute(`
      UPDATE cart_items 
      SET saved_for_later = true, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, product_id, timestamp
      ) VALUES (?, ?, 'saved_for_later', ?, NOW())
    `, [item.cart_id, user.userId, item.product_id]);

    // Get updated cart items
    const [updatedItems] = await pool.execute(`
      SELECT 
        ci.*,
        p.name,
        p.price as current_price,
        pi.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE ci.cart_id = ?
      ORDER BY ci.saved_for_later ASC, ci.updated_at DESC
    `, [item.cart_id]);

    return NextResponse.json({
      success: true,
      message: 'Item saved for later',
      items: updatedItems
    });

  } catch (error) {
    console.error('Save for later error:', error);
    return NextResponse.json(
      { error: 'Failed to save item for later' },
      { status: 500 }
    );
  }
}