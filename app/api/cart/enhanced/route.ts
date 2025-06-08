import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Retrieve enhanced cart with all features
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // Get or create cart for user
    let [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
      [user.userId]
    );

    let cart_id;
    if (!carts || (carts as any[]).length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO carts (user_id, status, created_at) VALUES (?, "active", NOW())',
        [user.userId]
      );
      cart_id = (result as any).insertId;
    } else {
      cart_id = (carts as any[])[0].cart_id;
    }

    // Get all cart items with product details
    const [items] = await pool.execute(`
      SELECT 
        ci.*,
        p.name,
        p.slug,
        p.price as current_price,
        p.stock_quantity,
        p.status as product_status,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= 5 THEN 'low_stock'
          WHEN p.status = 'discontinued' THEN 'discontinued'
          ELSE 'in_stock'
        END as stock_status,
        CASE 
          WHEN ci.price_at_add IS NOT NULL AND p.price != ci.price_at_add THEN true
          ELSE false
        END as price_changed,
        pi.image_url as image,
        c.color_name,
        m.material_name,
        addr.address_id as shipping_address_id,
        addr.recipient_name,
        addr.address_line1,
        addr.city,
        addr.state
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN colors c ON ci.configuration->'$.color_id' = c.color_id
      LEFT JOIN materials m ON ci.configuration->'$.material_id' = m.material_id
      LEFT JOIN cart_item_shipping cis ON ci.cart_item_id = cis.cart_item_id
      LEFT JOIN addresses addr ON cis.address_id = addr.address_id
      WHERE ci.cart_id = ?
      ORDER BY ci.saved_for_later ASC, ci.updated_at DESC
    `, [cart_id]);

    // Get cart recommendations based on current items
    const activeItems = (items as any[]).filter(item => !item.saved_for_later);
    let recommendations = [];
    
    if (activeItems.length > 0) {
      const productIds = activeItems.map(item => item.product_id);
      const [recResults] = await pool.execute(`
        SELECT 
          pa.product_b_id as product_id,
          p.name,
          p.price,
          p.slug,
          pi.image_url as image,
          pa.association_type,
          pa.association_strength as confidence
        FROM product_associations pa
        JOIN products p ON pa.product_b_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        WHERE pa.product_a_id IN (${productIds.map(() => '?').join(',')})
          AND pa.association_strength > 0.3
          AND p.status = 'active'
          AND pa.product_b_id NOT IN (${productIds.map(() => '?').join(',')})
        ORDER BY pa.association_strength DESC
        LIMIT 10
      `, [...productIds, ...productIds]);
      
      recommendations = recResults;
    }

    // Get active price alerts for user
    const [alerts] = await pool.execute(`
      SELECT 
        pa.*,
        p.name as product_name,
        p.price as current_price
      FROM price_alerts pa
      JOIN products p ON pa.product_id = p.product_id
      WHERE pa.user_id = ? AND pa.is_active = 1
      ORDER BY pa.created_at DESC
    `, [user.userId]);

    return NextResponse.json({
      success: true,
      cart_id,
      items: items as any[],
      recommendations: recommendations as any[],
      price_alerts: alerts as any[]
    });

  } catch (error) {
    console.error('Enhanced cart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to enhanced cart
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const itemData = await request.json();
    const pool = await getPool();

    // Get or create cart
    let [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
      [user.userId]
    );

    let cart_id;
    if (!carts || (carts as any[]).length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO carts (user_id, status, created_at) VALUES (?, "active", NOW())',
        [user.userId]
      );
      cart_id = (result as any).insertId;
    } else {
      cart_id = (carts as any[])[0].cart_id;
    }

    // Check if similar item already exists
    const [existingItems] = await pool.execute(`
      SELECT cart_item_id, quantity 
      FROM cart_items 
      WHERE cart_id = ? AND product_id = ? 
        AND JSON_EXTRACT(configuration, '$.width') = ?
        AND JSON_EXTRACT(configuration, '$.height') = ?
        AND JSON_EXTRACT(configuration, '$.color_id') = ?
        AND saved_for_later = false
    `, [
      cart_id, 
      itemData.product_id,
      itemData.width || null,
      itemData.height || null,
      itemData.color_id || null
    ]);

    let result;
    if (existingItems && (existingItems as any[]).length > 0) {
      // Update existing item quantity
      const existingItem = (existingItems as any[])[0];
      const newQuantity = existingItem.quantity + (itemData.quantity || 1);
      
      await pool.execute(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = NOW()
        WHERE cart_item_id = ?
      `, [newQuantity, existingItem.cart_item_id]);
    } else {
      // Get current product price
      const [products] = await pool.execute(
        'SELECT price FROM products WHERE product_id = ?',
        [itemData.product_id]
      );
      
      const currentPrice = products && (products as any[]).length > 0 
        ? (products as any[])[0].price 
        : itemData.unit_price;

      // Add new item
      const configuration = {
        width: itemData.width,
        height: itemData.height,
        color_id: itemData.color_id,
        material_id: itemData.material_id,
        mount_type: itemData.mount_type,
        control_type: itemData.control_type,
        headrail_id: itemData.headrail_id,
        bottom_rail_id: itemData.bottom_rail_id
      };

      [result] = await pool.execute(`
        INSERT INTO cart_items (
          cart_id, product_id, quantity, configuration,
          saved_for_later, price_at_add, notes, is_gift,
          installation_requested, sample_requested,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        cart_id,
        itemData.product_id,
        itemData.quantity || 1,
        JSON.stringify(configuration),
        false,
        currentPrice,
        itemData.notes || null,
        itemData.is_gift || false,
        itemData.installation_requested || false,
        itemData.sample_requested || false
      ]);
    }

    // Log cart analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, product_id,
        page_url, timestamp
      ) VALUES (?, ?, 'item_added', ?, ?, NOW())
    `, [cart_id, user.userId, itemData.product_id, itemData.page_url || null]);

    // Update abandoned cart tracking
    await pool.execute(`
      DELETE FROM abandoned_carts WHERE cart_id = ? AND user_id = ?
    `, [cart_id, user.userId]);

    // Return updated cart
    const response = await GET(request);
    return response;

  } catch (error) {
    console.error('Enhanced cart add error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // Get user's active cart
    const [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active"',
      [user.userId]
    );

    if (carts && (carts as any[]).length > 0) {
      const cart_id = (carts as any[])[0].cart_id;

      // Delete all cart items
      await pool.execute(
        'DELETE FROM cart_items WHERE cart_id = ?',
        [cart_id]
      );

      // Log analytics
      await pool.execute(`
        INSERT INTO cart_analytics (
          cart_id, user_id, action_type, timestamp
        ) VALUES (?, ?, 'cart_cleared', NOW())
      `, [cart_id, user.userId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Cart clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}