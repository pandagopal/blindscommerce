import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get user's recoverable abandoned carts
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const include_items = searchParams.get('include_items') === 'true';

    const pool = await getPool();

    // Get user's abandoned carts that can be recovered
    const [abandonedCarts] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(ci.cart_item_id) as item_count,
        SUM(ci.quantity * ci.unit_price) as cart_value,
        MAX(ci.updated_at) as last_item_activity
      FROM carts c
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id AND ci.saved_for_later = false
      WHERE c.user_id = ? 
        AND c.status = 'active'
        AND c.updated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND c.cart_id NOT IN (
          SELECT cart_id FROM abandoned_carts WHERE user_id = ? AND recovery_status = 'recovered'
        )
      GROUP BY c.cart_id
      HAVING item_count > 0
      ORDER BY c.updated_at DESC
      LIMIT ?
    `, [user.userId, user.userId, limit]);

    let formattedCarts = (abandonedCarts as any[]).map(cart => ({
      cart_id: cart.cart_id,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
      last_item_activity: cart.last_item_activity,
      item_count: cart.item_count || 0,
      cart_value: parseFloat(cart.cart_value || 0),
      hours_since_last_activity: Math.floor((Date.now() - new Date(cart.updated_at).getTime()) / (1000 * 60 * 60)),
      is_recoverable: true
    }));

    // Include cart items if requested
    if (include_items) {
      for (let cart of formattedCarts) {
        const [items] = await pool.execute(`
          SELECT 
            ci.*,
            p.name as product_name,
            p.price as current_price,
            p.slug as product_slug,
            p.stock_quantity,
            pi.image_url as product_image,
            CASE 
              WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
              WHEN p.stock_quantity < ci.quantity THEN 'insufficient_stock'
              WHEN p.stock_quantity <= 5 THEN 'low_stock'
              ELSE 'in_stock'
            END as stock_status,
            p.status as product_status
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.product_id
          LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
          WHERE ci.cart_id = ? AND ci.saved_for_later = false
          ORDER BY ci.created_at ASC
        `, [cart.cart_id]);

        cart.items = (items as any[]).map(item => ({
          cart_item_id: item.cart_item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_slug: item.product_slug,
          product_image: item.product_image,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          current_price: parseFloat(item.current_price),
          stock_quantity: item.stock_quantity,
          stock_status: item.stock_status,
          product_status: item.product_status,
          configuration: item.configuration ? JSON.parse(item.configuration) : null,
          price_changed: parseFloat(item.unit_price) !== parseFloat(item.current_price),
          is_available: item.product_status === 'active' && item.stock_quantity >= item.quantity,
          total_price: item.quantity * parseFloat(item.current_price)
        }));

        // Update cart availability status
        cart.all_items_available = cart.items.every(item => item.is_available);
        cart.unavailable_items = cart.items.filter(item => !item.is_available).length;
      }
    }

    return NextResponse.json({
      success: true,
      recoverable_carts: formattedCarts,
      total_count: formattedCarts.length
    });

  } catch (error) {
    console.error('Get recoverable carts error:', error);
    return NextResponse.json(
      { error: 'Failed to get recoverable carts' },
      { status: 500 }
    );
  }
}

// POST - Recover an abandoned cart
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { cart_id, recovery_action = 'activate' } = await request.json();

    if (!cart_id) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify the cart belongs to user
    const [carts] = await pool.execute(`
      SELECT * FROM carts 
      WHERE cart_id = ? AND user_id = ?
    `, [cart_id, user.userId]);

    if (!carts || (carts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const cart = (carts as any[])[0];

    // Check if there's already an active cart
    const [activeCarts] = await pool.execute(`
      SELECT cart_id FROM carts 
      WHERE user_id = ? AND status = 'active' AND cart_id != ?
    `, [user.userId, cart_id]);

    if (recovery_action === 'activate') {
      // If there's an active cart, we need to handle the merge
      if ((activeCarts as any[]).length > 0) {
        const active_cart_id = (activeCarts as any[])[0].cart_id;

        // Get items from the cart to recover
        const [itemsToRecover] = await pool.execute(`
          SELECT ci.*, p.stock_quantity, p.status as product_status
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_id = ? AND ci.saved_for_later = false
        `, [cart_id]);

        let recovered_items = 0;
        let merged_items = 0;
        let updated_items = 0;

        // Process each item
        for (const item of (itemsToRecover as any[])) {
          if (item.product_status !== 'active' || item.stock_quantity < item.quantity) {
            continue; // Skip unavailable items
          }

          // Check if this product already exists in active cart
          const [existingItems] = await pool.execute(`
            SELECT * FROM cart_items 
            WHERE cart_id = ? AND product_id = ? AND saved_for_later = false
          `, [active_cart_id, item.product_id]);

          if ((existingItems as any[]).length > 0) {
            // Update quantity in existing item
            const existingItem = (existingItems as any[])[0];
            const newQuantity = existingItem.quantity + item.quantity;

            // Check if new quantity exceeds stock
            if (newQuantity <= item.stock_quantity) {
              await pool.execute(`
                UPDATE cart_items 
                SET quantity = ?, updated_at = NOW()
                WHERE cart_item_id = ?
              `, [newQuantity, existingItem.cart_item_id]);
              updated_items++;
            }
          } else {
            // Move item to active cart
            await pool.execute(`
              UPDATE cart_items 
              SET cart_id = ?, updated_at = NOW()
              WHERE cart_item_id = ?
            `, [active_cart_id, item.cart_item_id]);
            merged_items++;
          }
          recovered_items++;
        }

        // Mark the old cart as recovered
        await pool.execute(`
          UPDATE carts 
          SET status = 'recovered', updated_at = NOW()
          WHERE cart_id = ?
        `, [cart_id]);

        // Update active cart timestamp
        await pool.execute(`
          UPDATE carts 
          SET updated_at = NOW()
          WHERE cart_id = ?
        `, [active_cart_id]);

        return NextResponse.json({
          success: true,
          message: 'Cart items merged into active cart successfully',
          recovery_action: 'merged',
          active_cart_id,
          recovery_summary: {
            original_cart_id: cart_id,
            total_items_processed: (itemsToRecover as any[]).length,
            recovered_items,
            merged_items,
            updated_items
          }
        });

      } else {
        // No active cart, just activate this one
        await pool.execute(`
          UPDATE carts 
          SET status = 'active', updated_at = NOW()
          WHERE cart_id = ?
        `, [cart_id]);

        // Update stock availability for items
        const [items] = await pool.execute(`
          SELECT ci.*, p.stock_quantity, p.status as product_status
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_id = ? AND ci.saved_for_later = false
        `, [cart_id]);

        let available_items = 0;
        let removed_items = 0;

        for (const item of (items as any[])) {
          if (item.product_status !== 'active' || item.stock_quantity < item.quantity) {
            // Remove unavailable items
            await pool.execute(`
              DELETE FROM cart_items WHERE cart_item_id = ?
            `, [item.cart_item_id]);
            removed_items++;
          } else {
            available_items++;
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Cart activated successfully',
          recovery_action: 'activated',
          active_cart_id: cart_id,
          recovery_summary: {
            available_items,
            removed_items
          }
        });
      }
    }

    // Log recovery analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'cart_recovery_attempted', ?, NOW())
    `, [
      cart_id,
      user.userId,
      JSON.stringify({ recovery_action })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Recovery action completed'
    });

  } catch (error) {
    console.error('Cart recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to recover cart' },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete an abandoned cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cart_id = searchParams.get('cart_id');

    if (!cart_id) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify the cart belongs to user
    const [carts] = await pool.execute(`
      SELECT * FROM carts 
      WHERE cart_id = ? AND user_id = ? AND status != 'active'
    `, [cart_id, user.userId]);

    if (!carts || (carts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart not found or cannot be deleted' },
        { status: 404 }
      );
    }

    // Delete cart items first
    await pool.execute(`
      DELETE FROM cart_items WHERE cart_id = ?
    `, [cart_id]);

    // Delete the cart
    await pool.execute(`
      DELETE FROM carts WHERE cart_id = ?
    `, [cart_id]);

    // Log deletion analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, 'cart_permanently_deleted', ?, NOW())
    `, [
      user.userId,
      JSON.stringify({ deleted_cart_id: cart_id })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Cart deleted permanently'
    });

  } catch (error) {
    console.error('Delete cart error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cart' },
      { status: 500 }
    );
  }
}