import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Create saved cart
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { cart_name, description, project_type = 'residential', items = [] } = await request.json();

    if (!cart_name || cart_name.trim() === '') {
      return NextResponse.json(
        { error: 'Cart name is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Create saved cart
    const [result] = await pool.execute(`
      INSERT INTO saved_carts (
        user_id, cart_name, description, project_type,
        total_items, estimated_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      user.userId,
      cart_name.trim(),
      description?.trim() || null,
      project_type,
      items.length,
      0 // Will be calculated after adding items
    ]);

    const saved_cart_id = (result as any).insertId;
    let estimated_total = 0;

    // Add items to saved cart if provided
    if (items.length > 0) {
      for (const item of items) {
        // Get current product price
        const [products] = await pool.execute(
          'SELECT price FROM products WHERE product_id = ?',
          [item.product_id]
        );

        const price = products && (products as any[]).length > 0 
          ? (products as any[])[0].price 
          : item.unit_price || 0;

        await pool.execute(`
          INSERT INTO saved_cart_items (
            saved_cart_id, product_id, quantity, 
            configuration, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          saved_cart_id,
          item.product_id,
          item.quantity || 1,
          JSON.stringify(item.configuration || {}),
          item.notes || null
        ]);

        estimated_total += price * (item.quantity || 1);
      }

      // Update estimated total
      await pool.execute(
        'UPDATE saved_carts SET estimated_total = ? WHERE saved_cart_id = ?',
        [estimated_total, saved_cart_id]
      );
    }

    // Get the created saved cart with details
    const [savedCart] = await pool.execute(`
      SELECT 
        sc.*,
        COUNT(sci.saved_item_id) as actual_items
      FROM saved_carts sc
      LEFT JOIN saved_cart_items sci ON sc.saved_cart_id = sci.saved_cart_id
      WHERE sc.saved_cart_id = ?
      GROUP BY sc.saved_cart_id
    `, [saved_cart_id]);

    return NextResponse.json({
      success: true,
      message: 'Cart saved successfully',
      saved_cart: (savedCart as any[])[0]
    });

  } catch (error) {
    console.error('Save cart error:', error);
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    );
  }
}

// GET - Get user's saved carts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const include_items = searchParams.get('include_items') === 'true';
    
    const pool = await getPool();

    // Get saved carts
    const [savedCarts] = await pool.execute(`
      SELECT 
        sc.*,
        COUNT(sci.saved_item_id) as actual_items,
        SUM(sci.quantity * COALESCE(p.price, 0)) as current_total
      FROM saved_carts sc
      LEFT JOIN saved_cart_items sci ON sc.saved_cart_id = sci.saved_cart_id
      LEFT JOIN products p ON sci.product_id = p.product_id
      WHERE sc.user_id = ?
      GROUP BY sc.saved_cart_id
      ORDER BY sc.is_favorite DESC, sc.updated_at DESC
    `, [user.userId]);

    let formattedCarts = (savedCarts as any[]).map(cart => ({
      saved_cart_id: cart.saved_cart_id,
      cart_name: cart.cart_name,
      description: cart.description,
      project_type: cart.project_type,
      is_template: Boolean(cart.is_template),
      is_favorite: Boolean(cart.is_favorite),
      total_items: cart.actual_items || 0,
      estimated_total: parseFloat(cart.estimated_total || 0),
      current_total: parseFloat(cart.current_total || 0),
      created_at: cart.created_at,
      updated_at: cart.updated_at
    }));

    // Include items if requested
    if (include_items) {
      for (let cart of formattedCarts) {
        const [items] = await pool.execute(`
          SELECT 
            sci.*,
            p.name as product_name,
            p.price as current_price,
            p.slug as product_slug,
            pi.image_url as product_image
          FROM saved_cart_items sci
          JOIN products p ON sci.product_id = p.product_id
          LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
          WHERE sci.saved_cart_id = ?
          ORDER BY sci.created_at ASC
        `, [cart.saved_cart_id]);

        cart.items = items;
      }
    }

    return NextResponse.json({
      success: true,
      saved_carts: formattedCarts,
      total_count: formattedCarts.length
    });

  } catch (error) {
    console.error('Get saved carts error:', error);
    return NextResponse.json(
      { error: 'Failed to get saved carts' },
      { status: 500 }
    );
  }
}