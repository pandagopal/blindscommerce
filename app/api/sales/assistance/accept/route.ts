import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { pusher } from '@/lib/pusher';

// POST - Sales staff accepts assistance request using PIN
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessPin } = await request.json();

    if (!accessPin) {
      return NextResponse.json({ 
        error: 'Access PIN is required' 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Verify user is sales staff
      const [salesStaffRows] = await pool.execute(
        'SELECT sales_staff_id, vendor_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [user.userId]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Only sales staff can accept assistance requests' 
        }, { status: 403 });
      }

      const salesStaff = salesStaffRows[0] as any;

      // Find the assistance session with the PIN
      const [sessionRows] = await pool.execute(
        `SELECT 
          sas.*,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.email as customer_email,
          c.cart_id,
          c.total_amount
        FROM sales_assistance_sessions sas
        JOIN users u ON sas.customer_user_id = u.user_id
        LEFT JOIN carts c ON sas.customer_cart_id = c.cart_id
        WHERE sas.access_pin = ? 
        AND sas.status = 'pending' 
        AND sas.expires_at > NOW()`,
        [accessPin]
      );

      if (!Array.isArray(sessionRows) || sessionRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Invalid or expired PIN' 
        }, { status: 404 });
      }

      const assistanceSession = sessionRows[0] as any;

      // Check if sales staff is available
      const [statusRows] = await pool.execute(
        `SELECT 
          is_online,
          is_available_for_assistance,
          current_active_sessions,
          max_concurrent_sessions
        FROM sales_staff_online_status 
        WHERE sales_staff_id = ?`,
        [salesStaff.sales_staff_id]
      );

      if (Array.isArray(statusRows) && statusRows.length > 0) {
        const status = statusRows[0] as any;
        if (!status.is_online || !status.is_available_for_assistance) {
          // Rollback handling needs review with pool
          return NextResponse.json({ 
            error: 'You are not currently available for assistance' 
          }, { status: 403 });
        }

        if (status.current_active_sessions >= status.max_concurrent_sessions) {
          // Rollback handling needs review with pool
          return NextResponse.json({ 
            error: 'You have reached your maximum concurrent sessions limit' 
          }, { status: 403 });
        }
      }

      // Update assistance session
      await pool.execute(
        `UPDATE sales_assistance_sessions 
        SET 
          sales_staff_id = ?,
          status = 'active',
          accepted_at = NOW()
        WHERE session_id = ?`,
        [salesStaff.sales_staff_id, assistanceSession.session_id]
      );

      // Update sales staff active sessions count
      await pool.execute(
        `INSERT INTO sales_staff_online_status (
          sales_staff_id, 
          current_active_sessions,
          last_activity
        ) VALUES (?, 1, NOW())
        ON DUPLICATE KEY UPDATE 
          current_active_sessions = current_active_sessions + 1,
          last_activity = NOW()`,
        [salesStaff.sales_staff_id]
      );

      // Get customer cart details if exists
      let cartDetails = null;
      if (assistanceSession.customer_cart_id) {
        const [cartItems] = await pool.execute(
          `SELECT 
            ci.*,
            p.name as product_name,
            p.price as current_price,
            p.stock_quantity,
            vp.vendor_id
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.product_id
          LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
          WHERE ci.cart_id = ?`,
          [assistanceSession.customer_cart_id]
        );

        cartDetails = {
          cartId: assistanceSession.customer_cart_id,
          totalAmount: assistanceSession.total_amount,
          items: cartItems
        };
      }

      // Commit handling needs review with pool

      // Notify customer that their request has been accepted
      await pusher.trigger(`customer-${assistanceSession.customer_user_id}`, 'assistance-accepted', {
        sessionId: assistanceSession.session_id,
        salesStaffName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        acceptedAt: new Date().toISOString()
      });

      // Log the access
      await pool.execute(
        `INSERT INTO sales_cart_access_log (
          assistance_session_id,
          sales_staff_id,
          customer_user_id,
          cart_id,
          action_type,
          action_details
        ) VALUES (?, ?, ?, ?, 'view_cart', ?)`,
        [
          assistanceSession.session_id,
          salesStaff.sales_staff_id,
          assistanceSession.customer_user_id,
          assistanceSession.customer_cart_id || null,
          JSON.stringify({ message: 'Sales staff accepted assistance request' })
        ]
      );

      return NextResponse.json({
        success: true,
        sessionId: assistanceSession.session_id,
        customer: {
          userId: assistanceSession.customer_user_id,
          firstName: assistanceSession.customer_first_name,
          lastName: assistanceSession.customer_last_name,
          email: assistanceSession.customer_email
        },
        sessionType: assistanceSession.session_type,
        permissions: JSON.parse(assistanceSession.permissions || '{}'),
        cartDetails,
        message: 'Assistance session started successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Accept assistance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept assistance request' },
      { status: 500 }
    );
  }
}