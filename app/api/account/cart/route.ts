import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function getOrCreateCart(pool: any, userId: number) {
  // Try to find an existing cart for the specific user
  const [carts] = await pool.execute(
    'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (carts.length > 0) return carts[0];
  // Create a new cart for this specific user
  const [result] = await pool.execute(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );
  const cart_id = result.insertId;
  return { cart_id, user_id: userId };
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Cart is only available to customers.' }, { status: 403 });
    }

    const pool = await getPool();
    const cart = await getOrCreateCart(pool, user.userId);
    const [items] = await pool.execute(
      `SELECT cart_item_id, cart_id, product_id, quantity, configuration, price_at_add as unit_price, 
              created_at, updated_at, saved_for_later, notes, is_gift, gift_message, 
              scheduled_delivery_date, installation_requested, sample_requested
       FROM cart_items WHERE cart_id = ?`,
      [cart.cart_id]
    );
    
    // Parse configuration JSON for each item
    const formattedItems = items.map(item => {
      // Handle configuration - it might already be parsed by MySQL or be a string
      let config = {};
      if (item.configuration) {
        if (typeof item.configuration === 'string') {
          try {
            config = JSON.parse(item.configuration);
          } catch (e) {
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
        slug: config.slug || null,
        image: config.image || null,
        totalPrice: item.unit_price * item.quantity
      };
    });
    
    return NextResponse.json({ cart, items: formattedItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Cart is only available to customers.' }, { status: 403 });
    }

    const pool = await getPool();
    const cart = await getOrCreateCart(pool, user.userId);
    const body = await req.json();
    
    // Prepare configuration object for JSON storage - include ALL body fields
    const configuration = {
      ...body, // Include all fields from the request
      // Ensure critical fields are explicitly set
      slug: body.slug,
      name: body.name,
      image: body.image
    };
    
    const [result] = await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity, configuration, price_at_add)
       VALUES (?, ?, ?, ?, ?)`,
      [cart.cart_id, body.product_id, body.quantity, JSON.stringify(configuration), body.unit_price]
    );
    
    // Get all cart items for the cart with proper formatting
    const [items] = await pool.execute(
      `SELECT cart_item_id, cart_id, product_id, quantity, configuration, price_at_add as unit_price, 
              created_at, updated_at, saved_for_later, notes, is_gift, gift_message, 
              scheduled_delivery_date, installation_requested, sample_requested
       FROM cart_items WHERE cart_id = ?`,
      [cart.cart_id]
    );
    
    // Parse configuration JSON for each item
    const formattedItems = items.map(item => {
      // Handle configuration - it might already be parsed by MySQL or be a string
      let config = {};
      if (item.configuration) {
        if (typeof item.configuration === 'string') {
          try {
            config = JSON.parse(item.configuration);
          } catch (e) {
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
        slug: config.slug || null,
        image: config.image || null,
        totalPrice: item.unit_price * item.quantity
      };
    });
    
    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item to cart', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Cart is only available to customers.' }, { status: 403 });
    }

    const pool = await getPool();
    const cart = await getOrCreateCart(pool, user.userId);
    const body = await req.json();
    
    const [result] = await pool.execute(
      `UPDATE cart_items SET quantity = ?, width = ?, height = ?, color_id = ?, material_id = ?, unit_price = ?, updated_at = NOW()
       WHERE cart_item_id = ? AND cart_id = ?`,
      [body.quantity, body.width, body.height, body.color_id, body.material_id, body.unit_price, body.cart_item_id, cart.cart_id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }
    
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_item_id = ?', [body.cart_item_id]);
    return NextResponse.json({ success: true, item: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Cart is only available to customers.' }, { status: 403 });
    }

    const pool = await getPool();
    const cart = await getOrCreateCart(pool, user.userId);
    const { cart_item_id } = await req.json();
    
    await pool.execute(
      'DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
      [cart_item_id, cart.cart_id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
} 