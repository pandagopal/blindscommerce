import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Add gift options to cart item
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
    const { 
      is_gift, 
      gift_message, 
      gift_wrap_type = 'standard',
      gift_wrap_price = 0,
      recipient_name,
      recipient_email,
      delivery_date 
    } = await request.json();

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.user_id 
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

    // Validate gift options
    if (is_gift) {
      if (!recipient_name || recipient_name.trim() === '') {
        return NextResponse.json(
          { error: 'Recipient name is required for gift items' },
          { status: 400 }
        );
      }

      if (gift_message && gift_message.length > 500) {
        return NextResponse.json(
          { error: 'Gift message cannot exceed 500 characters' },
          { status: 400 }
        );
      }

      if (delivery_date) {
        const deliveryDateTime = new Date(delivery_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deliveryDateTime < today) {
          return NextResponse.json(
            { error: 'Delivery date cannot be in the past' },
            { status: 400 }
          );
        }
      }
    }

    // Update cart item with gift options
    const gift_options = is_gift ? {
      is_gift: true,
      gift_message: gift_message?.trim() || null,
      gift_wrap_type,
      gift_wrap_price: parseFloat(gift_wrap_price) || 0,
      recipient_name: recipient_name?.trim(),
      recipient_email: recipient_email?.trim() || null,
      delivery_date: delivery_date || null
    } : null;

    await pool.execute(`
      UPDATE cart_items 
      SET gift_options = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [JSON.stringify(gift_options), cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, ?, 'gift_options_updated', ?, NOW())
    `, [
      (items as any[])[0].cart_id,
      user.userId,
      (items as any[])[0].product_id,
      JSON.stringify({ is_gift, gift_wrap_type })
    ]);

    // Get updated cart item with gift options
    const [updatedItem] = await pool.execute(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as current_price,
        p.slug as product_slug
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ?
    `, [cart_item_id]);

    const item = (updatedItem as any[])[0];
    const parsed_gift_options = item.gift_options ? JSON.parse(item.gift_options) : null;

    return NextResponse.json({
      success: true,
      message: is_gift ? 'Gift options added successfully' : 'Gift options removed successfully',
      cart_item: {
        cart_item_id: item.cart_item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_slug: item.product_slug,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        current_price: parseFloat(item.current_price),
        gift_options: parsed_gift_options,
        total_price: item.quantity * parseFloat(item.unit_price) + (parsed_gift_options?.gift_wrap_price || 0)
      }
    });

  } catch (error) {
    console.error('Gift options error:', error);
    return NextResponse.json(
      { error: 'Failed to update gift options' },
      { status: 500 }
    );
  }
}

// DELETE - Remove gift options from cart item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.user_id 
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

    // Remove gift options
    await pool.execute(`
      UPDATE cart_items 
      SET gift_options = NULL, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        timestamp
      ) VALUES (?, ?, ?, 'gift_options_removed', NOW())
    `, [
      (items as any[])[0].cart_id,
      user.userId,
      (items as any[])[0].product_id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Gift options removed successfully'
    });

  } catch (error) {
    console.error('Remove gift options error:', error);
    return NextResponse.json(
      { error: 'Failed to remove gift options' },
      { status: 500 }
    );
  }
}