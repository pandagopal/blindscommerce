import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST - Create a shareable cart link
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { share_type = 'view', expires_hours = 24 } = await request.json();
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

    // Check if cart has items
    const [items] = await pool.execute(
      'SELECT COUNT(*) as item_count FROM cart_items WHERE cart_id = ? AND saved_for_later = false',
      [cart_id]
    );

    if ((items as any[])[0].item_count === 0) {
      return NextResponse.json(
        { error: 'Cannot share an empty cart' },
        { status: 400 }
      );
    }

    // Generate share token and ID
    const share_id = randomUUID();
    const share_token = randomUUID().replace(/-/g, '');
    const expires_at = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

    // Create share record
    await pool.execute(`
      INSERT INTO shared_carts (
        share_id, cart_id, shared_by, share_token, 
        share_type, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [share_id, cart_id, user.userId, share_token, share_type, expires_at]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'shared', ?, NOW())
    `, [cart_id, user.userId, JSON.stringify({ share_type, expires_hours })]);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const share_url = `${baseUrl}/cart/shared/${share_token}`;

    return NextResponse.json({
      success: true,
      share_id,
      share_url,
      share_token,
      share_type,
      expires_at: expires_at.toISOString(),
      expires_in_hours: expires_hours
    });

  } catch (error) {
    console.error('Cart sharing error:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable link' },
      { status: 500 }
    );
  }
}

// GET - Get user's shared carts
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

    // Get user's shared carts
    const [sharedCarts] = await pool.execute(`
      SELECT 
        sc.*,
        COUNT(ci.cart_item_id) as item_count,
        SUM(ci.quantity * p.price) as estimated_total
      FROM shared_carts sc
      JOIN carts c ON sc.cart_id = c.cart_id
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id AND ci.saved_for_later = false
      LEFT JOIN products p ON ci.product_id = p.product_id
      WHERE sc.shared_by = ? AND sc.is_active = true
      GROUP BY sc.share_id
      ORDER BY sc.created_at DESC
    `, [user.userId]);

    const formattedShares = (sharedCarts as any[]).map(share => ({
      share_id: share.share_id,
      share_token: share.share_token,
      share_type: share.share_type,
      expires_at: share.expires_at,
      access_count: share.access_count,
      is_active: share.is_active && new Date(share.expires_at) > new Date(),
      created_at: share.created_at,
      item_count: share.item_count || 0,
      estimated_total: share.estimated_total || 0,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart/shared/${share.share_token}`
    }));

    return NextResponse.json({
      success: true,
      shared_carts: formattedShares
    });

  } catch (error) {
    console.error('Get shared carts error:', error);
    return NextResponse.json(
      { error: 'Failed to get shared carts' },
      { status: 500 }
    );
  }
}