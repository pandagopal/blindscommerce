import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { pusher } from '@/lib/pusher';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// Generate random 8-digit PIN
function generatePIN(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// POST - Customer requests sales assistance
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionType = 'cart_assistance', message } = await request.json();

    const connection = await mysql.createConnection(dbConfig);

    try {
      await connection.beginTransaction();

      // Generate unique PIN
      let accessPin: string;
      let isUnique = false;
      let attempts = 0;
      
      do {
        accessPin = generatePIN();
        // Check if PIN is already in use by an active session
        const [existingPins] = await connection.execute(
          'SELECT session_id FROM sales_assistance_sessions WHERE access_pin = ? AND status IN ("pending", "active")',
          [accessPin]
        );
        isUnique = !Array.isArray(existingPins) || existingPins.length === 0;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        await connection.rollback();
        return NextResponse.json({ 
          error: 'Unable to generate unique PIN. Please try again.' 
        }, { status: 500 });
      }

      // Get customer's active cart
      const [cartRows] = await connection.execute(
        'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
        [user.userId]
      );

      const cartId = Array.isArray(cartRows) && cartRows.length > 0 
        ? (cartRows[0] as any).cart_id 
        : null;

      // Set expiration time (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Create assistance session
      const [assistanceResult] = await connection.execute(
        `INSERT INTO sales_assistance_sessions (
          customer_user_id, 
          access_pin, 
          session_type, 
          status, 
          customer_cart_id,
          permissions,
          expires_at,
          created_at
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, NOW())`,
        [
          session.user.id,
          accessPin,
          sessionType,
          cartId,
          JSON.stringify({
            view_cart: true,
            modify_cart: true,
            apply_discounts: true,
            apply_coupons: true,
            view_customer_info: true
          }),
          expiresAt
        ]
      );

      const assistanceSessionId = (assistanceResult as any).insertId;

      // Get online sales staff to notify
      const [onlineStaff] = await connection.execute(
        `SELECT 
          ss.sales_staff_id,
          ss.user_id,
          u.first_name,
          u.last_name,
          ssos.is_available_for_assistance,
          ssos.current_active_sessions,
          ssos.max_concurrent_sessions,
          vi.company_name,
          ss.vendor_id
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        LEFT JOIN sales_staff_online_status ssos ON ss.sales_staff_id = ssos.sales_staff_id
        LEFT JOIN vendor_info vi ON ss.vendor_id = vi.vendor_info_id
        WHERE ss.is_active = 1 
        AND (ssos.is_online = 1 AND ssos.is_available_for_assistance = 1)
        AND (ssos.current_active_sessions < ssos.max_concurrent_sessions)
        ORDER BY ssos.current_active_sessions ASC, ssos.last_activity DESC`
      );

      await connection.commit();

      // Send real-time notifications to available sales staff
      if (Array.isArray(onlineStaff) && onlineStaff.length > 0) {
        const assistanceRequest = {
          sessionId: assistanceSessionId,
          customerId: user.userId,
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          sessionType,
          accessPin,
          cartId,
          message: message || 'Customer requesting assistance',
          createdAt: new Date().toISOString()
        };

        // Notify all available sales staff
        for (const staff of onlineStaff as any[]) {
          await pusher.trigger(`sales-staff-${staff.sales_staff_id}`, 'assistance-request', {
            ...assistanceRequest,
            vendorCompany: staff.company_name
          });
        }

        // Also send a general notification to all sales staff channel
        await pusher.trigger('sales-staff-notifications', 'new-assistance-request', {
          ...assistanceRequest,
          availableStaffCount: onlineStaff.length
        });
      }

      return NextResponse.json({
        success: true,
        accessPin,
        sessionId: assistanceSessionId,
        expiresAt: expiresAt.toISOString(),
        message: 'Assistance request created successfully. Share your PIN with the sales representative.',
        availableStaff: Array.isArray(onlineStaff) ? onlineStaff.length : 0
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Request assistance error:', error);
    return NextResponse.json(
      { error: 'Failed to request assistance' },
      { status: 500 }
    );
  }
}