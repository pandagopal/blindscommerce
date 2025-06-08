import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Request product sample for cart item
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
      sample_type = 'material',
      sample_size = 'standard',
      shipping_address,
      sample_notes,
      express_shipping = false
    } = await request.json();

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.user_id, p.name as product_name, p.allows_samples
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

    // Check if product allows samples
    if (!item.allows_samples) {
      return NextResponse.json(
        { error: 'Samples are not available for this product' },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shipping_address || !shipping_address.street || !shipping_address.city || !shipping_address.postal_code) {
      return NextResponse.json(
        { error: 'Complete shipping address is required for sample requests' },
        { status: 400 }
      );
    }

    // Check user's sample request limits (max 5 samples per month)
    const [existingRequests] = await pool.execute(`
      SELECT COUNT(*) as sample_count 
      FROM sample_requests 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [user.userId]);

    const monthlyCount = (existingRequests as any[])[0].sample_count;
    if (monthlyCount >= 5) {
      return NextResponse.json(
        { error: 'You have reached the monthly limit of 5 sample requests' },
        { status: 429 }
      );
    }

    // Check if user already has a pending sample for this product
    const [pendingSamples] = await pool.execute(`
      SELECT sample_id 
      FROM sample_requests 
      WHERE user_id = ? AND product_id = ? AND status IN ('pending', 'approved', 'shipped')
    `, [user.userId, item.product_id]);

    if (pendingSamples && (pendingSamples as any[]).length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending sample request for this product' },
        { status: 409 }
      );
    }

    // Calculate sample cost
    let sample_cost = 0;
    if (sample_size === 'large') {
      sample_cost = 15;
    } else if (sample_size === 'standard') {
      sample_cost = 10;
    } else {
      sample_cost = 5; // small
    }

    if (express_shipping) {
      sample_cost += 20;
    }

    // Create sample request
    const [result] = await pool.execute(`
      INSERT INTO sample_requests (
        user_id, product_id, cart_item_id, sample_type, sample_size,
        shipping_address, sample_notes, express_shipping, sample_cost,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      user.userId,
      item.product_id,
      cart_item_id,
      sample_type,
      sample_size,
      JSON.stringify(shipping_address),
      sample_notes?.trim() || null,
      express_shipping,
      sample_cost
    ]);

    const sample_id = (result as any).insertId;

    // Update cart item with sample request reference
    const existing_sample_requests = item.sample_requests ? JSON.parse(item.sample_requests) : [];
    existing_sample_requests.push({
      sample_id,
      sample_type,
      sample_size,
      sample_cost,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    await pool.execute(`
      UPDATE cart_items 
      SET sample_requests = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [JSON.stringify(existing_sample_requests), cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, ?, 'sample_requested', ?, NOW())
    `, [
      item.cart_id,
      user.userId,
      item.product_id,
      JSON.stringify({ 
        sample_type, 
        sample_size, 
        sample_cost,
        express_shipping 
      })
    ]);

    // Get the created sample request with details
    const [newSample] = await pool.execute(`
      SELECT 
        sr.*,
        p.name as product_name,
        p.slug as product_slug
      FROM sample_requests sr
      JOIN products p ON sr.product_id = p.product_id
      WHERE sr.sample_id = ?
    `, [sample_id]);

    const sample = (newSample as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Sample request submitted successfully',
      sample_request: {
        sample_id: sample.sample_id,
        product_name: sample.product_name,
        product_slug: sample.product_slug,
        sample_type: sample.sample_type,
        sample_size: sample.sample_size,
        sample_cost: parseFloat(sample.sample_cost),
        express_shipping: Boolean(sample.express_shipping),
        status: sample.status,
        created_at: sample.created_at,
        shipping_address: JSON.parse(sample.shipping_address),
        estimated_delivery: express_shipping ? '2-3 business days' : '5-7 business days'
      }
    });

  } catch (error) {
    console.error('Sample request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit sample request' },
      { status: 500 }
    );
  }
}

// GET - Get sample requests for cart item
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

    // Verify cart item belongs to user and get sample requests
    const [items] = await pool.execute(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.allows_samples,
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

    // Get sample requests for this cart item/product
    const [sampleRequests] = await pool.execute(`
      SELECT * FROM sample_requests
      WHERE user_id = ? AND product_id = ?
      ORDER BY created_at DESC
    `, [user.userId, item.product_id]);

    const formatted_requests = (sampleRequests as any[]).map(req => ({
      sample_id: req.sample_id,
      sample_type: req.sample_type,
      sample_size: req.sample_size,
      sample_cost: parseFloat(req.sample_cost),
      express_shipping: Boolean(req.express_shipping),
      status: req.status,
      tracking_number: req.tracking_number,
      shipped_at: req.shipped_at,
      delivered_at: req.delivered_at,
      created_at: req.created_at,
      shipping_address: req.shipping_address ? JSON.parse(req.shipping_address) : null
    }));

    return NextResponse.json({
      success: true,
      cart_item_id: item.cart_item_id,
      product_name: item.product_name,
      allows_samples: Boolean(item.allows_samples),
      sample_requests: formatted_requests
    });

  } catch (error) {
    console.error('Get sample requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get sample requests' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel sample request
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sample_id = searchParams.get('sample_id');

    if (!sample_id) {
      return NextResponse.json(
        { error: 'Sample ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify sample request belongs to user and can be cancelled
    const [samples] = await pool.execute(`
      SELECT * FROM sample_requests
      WHERE sample_id = ? AND user_id = ?
    `, [sample_id, user.userId]);

    if (!samples || (samples as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Sample request not found' },
        { status: 404 }
      );
    }

    const sample = (samples as any[])[0];

    if (['shipped', 'delivered', 'cancelled'].includes(sample.status)) {
      return NextResponse.json(
        { error: `Cannot cancel sample request with status: ${sample.status}` },
        { status: 400 }
      );
    }

    // Cancel the sample request
    await pool.execute(`
      UPDATE sample_requests 
      SET status = 'cancelled', updated_at = NOW()
      WHERE sample_id = ?
    `, [sample_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        user_id, product_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'sample_cancelled', ?, NOW())
    `, [
      user.userId,
      sample.product_id,
      JSON.stringify({ sample_id, sample_type: sample.sample_type })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Sample request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel sample request error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sample request' },
      { status: 500 }
    );
  }
}