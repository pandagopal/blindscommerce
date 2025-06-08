import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// PATCH - Update cart item
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const cart_item_id = parseInt(params.id);
    const updateData = await request.json();
    const pool = await getPool();

    // Verify item belongs to user's cart
    const [items] = await pool.execute(`
      SELECT ci.cart_item_id, c.user_id 
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

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (updateData.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(updateData.quantity);
    }
    if (updateData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(updateData.notes);
    }
    if (updateData.is_gift !== undefined) {
      updates.push('is_gift = ?');
      values.push(updateData.is_gift);
    }
    if (updateData.gift_message !== undefined) {
      updates.push('gift_message = ?');
      values.push(updateData.gift_message);
    }
    if (updateData.installation_requested !== undefined) {
      updates.push('installation_requested = ?');
      values.push(updateData.installation_requested);
    }
    if (updateData.sample_requested !== undefined) {
      updates.push('sample_requested = ?');
      values.push(updateData.sample_requested);
    }
    if (updateData.scheduled_delivery_date !== undefined) {
      updates.push('scheduled_delivery_date = ?');
      values.push(updateData.scheduled_delivery_date);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(cart_item_id);

      await pool.execute(`
        UPDATE cart_items 
        SET ${updates.join(', ')}
        WHERE cart_item_id = ?
      `, values);

      // Log analytics
      await pool.execute(`
        INSERT INTO cart_analytics (
          cart_id, user_id, action_type, product_id,
          previous_value, new_value, timestamp
        ) SELECT 
          ci.cart_id, ?, 'item_updated', ci.product_id,
          ?, ?, NOW()
        FROM cart_items ci WHERE ci.cart_item_id = ?
      `, [user.userId, JSON.stringify({}), JSON.stringify(updateData), cart_item_id]);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully'
    });

  } catch (error) {
    console.error('Cart item update error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE - Remove cart item
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

    // Verify item belongs to user and get details for analytics
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

    const item = (items as any[])[0];

    // Delete cart item
    await pool.execute(
      'DELETE FROM cart_items WHERE cart_item_id = ?',
      [cart_item_id]
    );

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, product_id,
        previous_value, timestamp
      ) VALUES (?, ?, 'item_removed', ?, ?, NOW())
    `, [item.cart_id, user.userId, item.product_id, JSON.stringify(item)]);

    return NextResponse.json({
      success: true,
      message: 'Cart item removed successfully'
    });

  } catch (error) {
    console.error('Cart item deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}