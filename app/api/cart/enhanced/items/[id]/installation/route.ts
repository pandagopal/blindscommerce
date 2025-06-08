import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Add installation service to cart item
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
      needs_installation,
      installation_type = 'professional',
      installation_date,
      installation_time_slot,
      special_instructions,
      installation_address,
      contact_phone,
      emergency_contact,
      room_details
    } = await request.json();

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.user_id, p.name as product_name, p.requires_installation
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    const item = (items as any[])[0];

    // Validate installation requirements
    if (needs_installation) {
      if (!installation_date) {
        return NextResponse.json(
          { error: 'Installation date is required' },
          { status: 400 }
        );
      }

      const installationDateTime = new Date(installation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (installationDateTime < today) {
        return NextResponse.json(
          { error: 'Installation date cannot be in the past' },
          { status: 400 }
        );
      }

      // Check if installation date is at least 3 days from now for scheduling
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      if (installationDateTime < threeDaysFromNow) {
        return NextResponse.json(
          { error: 'Installation must be scheduled at least 3 days in advance' },
          { status: 400 }
        );
      }

      if (!installation_address || installation_address.trim() === '') {
        return NextResponse.json(
          { error: 'Installation address is required' },
          { status: 400 }
        );
      }

      if (!contact_phone || contact_phone.trim() === '') {
        return NextResponse.json(
          { error: 'Contact phone number is required for installation' },
          { status: 400 }
        );
      }

      // Validate time slot format (should be like "09:00-12:00")
      if (installation_time_slot && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(installation_time_slot)) {
        return NextResponse.json(
          { error: 'Invalid time slot format. Use HH:MM-HH:MM format' },
          { status: 400 }
        );
      }
    }

    // Calculate installation cost based on product and service type
    let installation_cost = 0;
    if (needs_installation) {
      // Base installation cost logic
      const base_cost = installation_type === 'premium' ? 150 : 100;
      installation_cost = base_cost * item.quantity;

      // Additional costs for complex installations
      if (room_details?.window_count && room_details.window_count > 5) {
        installation_cost += (room_details.window_count - 5) * 25;
      }
    }

    // Create installation service object
    const installation_service = needs_installation ? {
      needs_installation: true,
      installation_type,
      installation_date,
      installation_time_slot: installation_time_slot || null,
      installation_cost,
      special_instructions: special_instructions?.trim() || null,
      installation_address: installation_address?.trim(),
      contact_phone: contact_phone?.trim(),
      emergency_contact: emergency_contact?.trim() || null,
      room_details: room_details || null,
      service_status: 'scheduled',
      created_at: new Date().toISOString()
    } : null;

    // Update cart item with installation service
    await pool.execute(`
      UPDATE cart_items 
      SET installation_service = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [JSON.stringify(installation_service), cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, ?, 'installation_service_updated', ?, NOW())
    `, [
      item.cart_id,
      user.userId,
      item.product_id,
      JSON.stringify({ 
        needs_installation, 
        installation_type, 
        installation_cost,
        installation_date 
      })
    ]);

    // Get updated cart item
    const [updatedItem] = await pool.execute(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as current_price,
        p.slug as product_slug,
        p.requires_installation
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ?
    `, [cart_item_id]);

    const updated = (updatedItem as any[])[0];
    const parsed_service = updated.installation_service ? JSON.parse(updated.installation_service) : null;

    return NextResponse.json({
      success: true,
      message: needs_installation 
        ? 'Installation service added successfully' 
        : 'Installation service removed successfully',
      cart_item: {
        cart_item_id: updated.cart_item_id,
        product_id: updated.product_id,
        product_name: updated.product_name,
        product_slug: updated.product_slug,
        quantity: updated.quantity,
        unit_price: parseFloat(updated.unit_price),
        current_price: parseFloat(updated.current_price),
        installation_service: parsed_service,
        requires_installation: Boolean(updated.requires_installation),
        total_price: updated.quantity * parseFloat(updated.unit_price) + (parsed_service?.installation_cost || 0)
      }
    });

  } catch (error) {
    console.error('Installation service error:', error);
    return NextResponse.json(
      { error: 'Failed to update installation service' },
      { status: 500 }
    );
  }
}

// GET - Get installation service details for cart item
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get cart item with installation service
    const [items] = await pool.execute(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.requires_installation,
        c.user_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    const item = (items as any[])[0];
    const installation_service = item.installation_service ? JSON.parse(item.installation_service) : null;

    return NextResponse.json({
      success: true,
      cart_item_id: item.cart_item_id,
      product_name: item.product_name,
      requires_installation: Boolean(item.requires_installation),
      installation_service
    });

  } catch (error) {
    console.error('Get installation service error:', error);
    return NextResponse.json(
      { error: 'Failed to get installation service details' },
      { status: 500 }
    );
  }
}

// DELETE - Remove installation service from cart item
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

    // Remove installation service
    await pool.execute(`
      UPDATE cart_items 
      SET installation_service = NULL, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        timestamp
      ) VALUES (?, ?, ?, 'installation_service_removed', NOW())
    `, [
      (items as any[])[0].cart_id,
      user.userId,
      (items as any[])[0].product_id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Installation service removed successfully'
    });

  } catch (error) {
    console.error('Remove installation service error:', error);
    return NextResponse.json(
      { error: 'Failed to remove installation service' },
      { status: 500 }
    );
  }
}