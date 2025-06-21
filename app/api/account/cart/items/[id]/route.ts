import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const userId = 1; // Demo user

async function getOrCreateCart(pool: any) {
  // Try to find an existing cart for the user
  const [carts] = await pool.execute(
    'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (carts.length > 0) return carts[0];
  // Create a new cart
  const [result] = await pool.execute(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );
  const cart_id = result.insertId;
  return { cart_id, user_id: userId };
}

// Helper function to format cart items
function formatCartItems(items: any[]) {
  return items.map(item => {
    // Handle configuration - it might already be parsed by MySQL or be a string
    let config = {};
    if (item.configuration) {
      if (typeof item.configuration === 'string') {
        try {
          config = JSON.parse(item.configuration);
        } catch (e) {
          console.error('Error parsing configuration JSON:', e);
          config = {};
        }
      } else if (typeof item.configuration === 'object') {
        config = item.configuration;
      }
    }
    
    return {
      ...item,
      configuration: config,
      // Flatten some configuration fields for backward compatibility
      width: config.width || null,
      height: config.height || null,
      name: config.name || null,
      image: config.image || null,
      totalPrice: item.unit_price * item.quantity
    };
  });
}

// PATCH /api/account/cart/items/[id] - Update cart item quantity
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pool = await getPool();
    const cart = await getOrCreateCart(pool);
    const body = await req.json();
    const cart_item_id = parseInt(params.id);
    
    console.log('Updating cart item:', cart_item_id, 'to quantity:', body.quantity);
    
    // Update the cart item quantity
    const [result] = await pool.execute(
      `UPDATE cart_items SET quantity = ?, updated_at = NOW()
       WHERE cart_item_id = ? AND cart_id = ?`,
      [body.quantity, cart_item_id, cart.cart_id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Get all cart items for the cart with proper formatting
    const [items] = await pool.execute(
      `SELECT cart_item_id, cart_id, product_id, quantity, configuration, price_at_add as unit_price, 
              created_at, updated_at, saved_for_later, notes, is_gift, gift_message, 
              scheduled_delivery_date, installation_requested, sample_requested
       FROM cart_items WHERE cart_id = ?`,
      [cart.cart_id]
    );
    
    const formattedItems = formatCartItems(items);
    
    console.log('Cart items after update:', formattedItems.length);
    
    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error) {
    console.error('Cart item update error:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

// DELETE /api/account/cart/items/[id] - Remove cart item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pool = await getPool();
    const cart = await getOrCreateCart(pool);
    const cart_item_id = parseInt(params.id);
    
    console.log('Removing cart item:', cart_item_id);
    
    // Delete the cart item
    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
      [cart_item_id, cart.cart_id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Get all remaining cart items for the cart with proper formatting
    const [items] = await pool.execute(
      `SELECT cart_item_id, cart_id, product_id, quantity, configuration, price_at_add as unit_price, 
              created_at, updated_at, saved_for_later, notes, is_gift, gift_message, 
              scheduled_delivery_date, installation_requested, sample_requested
       FROM cart_items WHERE cart_id = ?`,
      [cart.cart_id]
    );
    
    const formattedItems = formatCartItems(items);
    
    console.log('Cart items after removal:', formattedItems.length);
    
    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error) {
    console.error('Cart item removal error:', error);
    return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 });
  }
}