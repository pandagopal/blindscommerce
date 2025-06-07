import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/cart/recover/[token] - Recover abandoned cart via token
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Recovery token is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Find the abandoned cart by token
    const [carts] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        acr.*,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM abandoned_cart_recovery acr
      LEFT JOIN users u ON acr.user_id = u.user_id
      WHERE acr.recovery_token = ? 
        AND acr.recovery_status NOT IN ('recovered', 'expired', 'opted_out')
        AND acr.expires_at > NOW()`,
      [token]
    );

    if (carts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired recovery link' },
        { status: 404 }
      );
    }

    const cart = carts[0];

    // Log the cart recovery interaction
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const referrer = req.headers.get('referer') || 'direct';

    await pool.execute(
      `INSERT INTO cart_recovery_interactions (
        recovery_id,
        interaction_type,
        interaction_data,
        user_agent,
        ip_address,
        referrer
      ) VALUES (?, 'cart_visited', ?, ?, ?, ?)`,
      [
        cart.id,
        JSON.stringify({ 
          action: 'recovery_link_clicked',
          source: 'email'
        }),
        userAgent,
        clientIp,
        referrer
      ]
    );

    // Update click count
    await pool.execute(
      'UPDATE abandoned_cart_recovery SET email_click_count = email_click_count + 1 WHERE id = ?',
      [cart.id]
    );

    // Parse cart data
    const cartData = JSON.parse(cart.cart_data);

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        cartId: cart.cart_id,
        email: cart.email,
        customerName: cart.customer_name || (cart.first_name ? `${cart.first_name} ${cart.last_name}` : 'Guest'),
        cartData,
        totalValue: cart.total_value,
        itemCount: cart.item_count,
        createdAt: cart.created_at,
        expiresAt: cart.expires_at
      },
      recoveryToken: token,
      message: 'Cart recovered successfully'
    });

  } catch (error) {
    console.error('Error recovering cart:', error);
    return NextResponse.json(
      { error: 'Failed to recover cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart/recover/[token] - Mark cart as recovered
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await req.json();
    const { orderId, orderValue } = body;

    if (!token || !orderId) {
      return NextResponse.json(
        { error: 'Recovery token and order ID are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Find and update the abandoned cart
    const [result] = await pool.execute(
      `UPDATE abandoned_cart_recovery 
       SET recovery_status = 'recovered',
           recovered_at = NOW(),
           recovery_order_id = ?,
           recovery_value = ?
       WHERE recovery_token = ? 
         AND recovery_status NOT IN ('recovered', 'expired', 'opted_out')`,
      [orderId, orderValue || 0, token]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Invalid recovery token or cart already processed' },
        { status: 404 }
      );
    }

    // Get the cart ID for interaction logging
    const [carts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM abandoned_cart_recovery WHERE recovery_token = ?',
      [token]
    );

    if (carts.length > 0) {
      // Log the successful recovery
      const userAgent = req.headers.get('user-agent') || 'unknown';
      const clientIp = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

      await pool.execute(
        `INSERT INTO cart_recovery_interactions (
          recovery_id,
          interaction_type,
          interaction_data,
          user_agent,
          ip_address
        ) VALUES (?, 'order_completed', ?, ?, ?)`,
        [
          carts[0].id,
          JSON.stringify({ 
            action: 'cart_recovered',
            orderId,
            orderValue: orderValue || 0
          }),
          userAgent,
          clientIp
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart recovery marked as successful'
    });

  } catch (error) {
    console.error('Error marking cart as recovered:', error);
    return NextResponse.json(
      { error: 'Failed to mark cart as recovered' },
      { status: 500 }
    );
  }
}