import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get user's shipping addresses and cart items grouped by address
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
    const include_cart_items = searchParams.get('include_items') === 'true';

    const pool = await getPool();

    // Get user's saved shipping addresses
    const [savedAddresses] = await pool.execute(`
      SELECT 
        address_id,
        label,
        recipient_name,
        street_address,
        apartment,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_business,
        delivery_instructions,
        created_at
      FROM shipping_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, label ASC
    `, [user.userId]);

    let addressGroups = [];

    if (include_cart_items) {
      // Get cart items with their assigned shipping addresses
      const [cartItems] = await pool.execute(`
        SELECT 
          ci.*,
          p.name as product_name,
          p.price as current_price,
          p.slug as product_slug,
          p.weight,
          p.dimensions,
          p.requires_special_shipping,
          pi.image_url as product_image,
          sa.address_id,
          sa.label as address_label,
          sa.recipient_name,
          sa.street_address,
          sa.city,
          sa.state,
          sa.postal_code
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        LEFT JOIN shipping_addresses sa ON ci.shipping_address_id = sa.address_id
        WHERE c.user_id = ? AND c.status = 'active' AND ci.saved_for_later = false
        ORDER BY sa.address_id, ci.created_at ASC
      `, [user.userId]);

      // Group cart items by shipping address
      const groupedItems = {};
      
      for (const item of (cartItems as any[])) {
        const addressKey = item.address_id || 'unassigned';
        
        if (!groupedItems[addressKey]) {
          groupedItems[addressKey] = {
            address: item.address_id ? {
              address_id: item.address_id,
              label: item.address_label,
              recipient_name: item.recipient_name,
              street_address: item.street_address,
              city: item.city,
              state: item.state,
              postal_code: item.postal_code
            } : null,
            items: [],
            total_items: 0,
            total_weight: 0,
            subtotal: 0,
            requires_special_shipping: false
          };
        }

        const formattedItem = {
          cart_item_id: item.cart_item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_slug: item.product_slug,
          product_image: item.product_image,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          current_price: parseFloat(item.current_price),
          weight: item.weight,
          dimensions: item.dimensions ? JSON.parse(item.dimensions) : null,
          requires_special_shipping: Boolean(item.requires_special_shipping),
          configuration: item.configuration ? JSON.parse(item.configuration) : null,
          total_price: item.quantity * parseFloat(item.current_price)
        };

        groupedItems[addressKey].items.push(formattedItem);
        groupedItems[addressKey].total_items += item.quantity;
        groupedItems[addressKey].total_weight += (item.weight || 0) * item.quantity;
        groupedItems[addressKey].subtotal += formattedItem.total_price;
        
        if (item.requires_special_shipping) {
          groupedItems[addressKey].requires_special_shipping = true;
        }
      }

      addressGroups = Object.values(groupedItems);
    }

    return NextResponse.json({
      success: true,
      saved_addresses: savedAddresses,
      cart_groups: addressGroups,
      total_groups: addressGroups.length
    });

  } catch (error) {
    console.error('Get shipping addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping addresses' },
      { status: 500 }
    );
  }
}

// POST - Assign shipping addresses to cart items
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { assignments, create_address } = await request.json();

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'Address assignments are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get user's active cart
    const [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
      [user.userId]
    );

    if (!carts || (carts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'No active cart found' },
        { status: 404 }
      );
    }

    const cart_id = (carts as any[])[0].cart_id;
    let new_address_id = null;

    // Create new address if provided
    if (create_address) {
      const {
        label,
        recipient_name,
        street_address,
        apartment,
        city,
        state,
        postal_code,
        country = 'US',
        phone,
        is_default = false,
        is_business = false,
        delivery_instructions
      } = create_address;

      // Validate required fields
      if (!recipient_name || !street_address || !city || !state || !postal_code) {
        return NextResponse.json(
          { error: 'Missing required address fields' },
          { status: 400 }
        );
      }

      // If this is set as default, unset other defaults first
      if (is_default) {
        await pool.execute(
          'UPDATE shipping_addresses SET is_default = false WHERE user_id = ?',
          [user.userId]
        );
      }

      const [addressResult] = await pool.execute(`
        INSERT INTO shipping_addresses (
          user_id, label, recipient_name, street_address, apartment,
          city, state, postal_code, country, phone, is_default,
          is_business, delivery_instructions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        user.userId, label, recipient_name, street_address, apartment,
        city, state, postal_code, country, phone, is_default,
        is_business, delivery_instructions
      ]);

      new_address_id = (addressResult as any).insertId;
    }

    // Process assignments
    let successful_assignments = 0;
    let failed_assignments = 0;
    const assignment_results = [];

    for (const assignment of assignments) {
      const { cart_item_ids, address_id, shipping_notes } = assignment;
      
      if (!cart_item_ids || !Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
        failed_assignments++;
        assignment_results.push({
          error: 'Invalid cart item IDs',
          assignment
        });
        continue;
      }

      const target_address_id = address_id === 'new' ? new_address_id : address_id;

      // Verify address belongs to user (if not null for unassigned)
      if (target_address_id) {
        const [addressCheck] = await pool.execute(
          'SELECT address_id FROM shipping_addresses WHERE address_id = ? AND user_id = ?',
          [target_address_id, user.userId]
        );

        if (!addressCheck || (addressCheck as any[]).length === 0) {
          failed_assignments++;
          assignment_results.push({
            error: 'Invalid address ID',
            assignment
          });
          continue;
        }
      }

      // Verify cart items belong to user's cart
      const [itemCheck] = await pool.execute(`
        SELECT ci.cart_item_id, p.name as product_name
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
          AND c.user_id = ? AND ci.saved_for_later = false
      `, [...cart_item_ids, user.userId]);

      if ((itemCheck as any[]).length !== cart_item_ids.length) {
        failed_assignments++;
        assignment_results.push({
          error: 'Some cart items not found',
          assignment
        });
        continue;
      }

      // Update cart items with shipping address
      await pool.execute(`
        UPDATE cart_items 
        SET shipping_address_id = ?, shipping_notes = ?, updated_at = NOW()
        WHERE cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
      `, [target_address_id, shipping_notes || null, ...cart_item_ids]);

      successful_assignments++;
      assignment_results.push({
        success: true,
        address_id: target_address_id,
        cart_item_ids,
        items: (itemCheck as any[]).map(item => ({
          cart_item_id: item.cart_item_id,
          product_name: item.product_name
        }))
      });
    }

    // Log assignment analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'shipping_addresses_assigned', ?, NOW())
    `, [
      cart_id,
      user.userId,
      JSON.stringify({
        total_assignments: assignments.length,
        successful_assignments,
        failed_assignments,
        new_address_created: new_address_id ? true : false
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Shipping address assignments processed',
      new_address_id,
      assignment_summary: {
        total_assignments: assignments.length,
        successful_assignments,
        failed_assignments
      },
      assignment_results
    });

  } catch (error) {
    console.error('Assign shipping addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to assign shipping addresses' },
      { status: 500 }
    );
  }
}

// PUT - Update shipping address assignment for specific items
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { cart_item_id, address_id, shipping_notes } = await request.json();

    if (!cart_item_id) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.cart_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ? AND ci.saved_for_later = false
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify address belongs to user (if provided)
    if (address_id) {
      const [addresses] = await pool.execute(
        'SELECT address_id FROM shipping_addresses WHERE address_id = ? AND user_id = ?',
        [address_id, user.userId]
      );

      if (!addresses || (addresses as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Shipping address not found' },
          { status: 404 }
        );
      }
    }

    // Update shipping address assignment
    await pool.execute(`
      UPDATE cart_items 
      SET shipping_address_id = ?, shipping_notes = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [address_id || null, shipping_notes || null, cart_item_id]);

    // Log assignment analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'item_shipping_address_updated', ?, NOW())
    `, [
      (items as any[])[0].cart_id,
      user.userId,
      JSON.stringify({
        cart_item_id,
        new_address_id: address_id,
        has_shipping_notes: Boolean(shipping_notes)
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Shipping address updated successfully',
      cart_item_id,
      address_id: address_id || null
    });

  } catch (error) {
    console.error('Update shipping address error:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping address' },
      { status: 500 }
    );
  }
}