import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AbandonedCartRow extends RowDataPacket {
  id: number;
  cart_id: string;
  user_id: number;
  email: string;
  cart_data: string;
  total_value: number;
  item_count: number;
  recovery_status: string;
  recovery_token: string;
  first_email_sent_at: string;
  reminder_email_sent_at: string;
  email_open_count: number;
  email_click_count: number;
  recovered_at: string;
  recovery_order_id: number;
  recovery_value: number;
  created_at: string;
  expires_at: string;
}

// GET /api/cart/abandoned - Get abandoned carts (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    const pool = await getPool();

    // Build query
    let whereClause = '1=1';
    const queryParams: any[] = [];

    if (status !== 'all') {
      whereClause += ' AND recovery_status = ?';
      queryParams.push(status);
    }

    // Add date range filter if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }

    const validSortFields = ['created_at', 'total_value', 'item_count', 'recovery_status', 'email'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    // Get abandoned carts
    const [abandonedCarts] = await pool.execute<AbandonedCartRow[]>(
      `SELECT 
        acr.*,
        u.first_name,
        u.last_name
      FROM abandoned_cart_recovery acr
      LEFT JOIN users u ON acr.user_id = u.user_id
      WHERE ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM abandoned_cart_recovery WHERE ${whereClause}`,
      queryParams
    );

    // Get summary statistics
    const [statsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_abandoned,
        SUM(CASE WHEN recovery_status = 'recovered' THEN 1 ELSE 0 END) as recovered_count,
        SUM(CASE WHEN recovery_status = 'recovered' THEN recovery_value ELSE 0 END) as total_recovered_value,
        AVG(total_value) as avg_cart_value,
        SUM(CASE WHEN recovery_status = 'email_sent' OR recovery_status = 'reminder_sent' THEN 1 ELSE 0 END) as emails_sent
      FROM abandoned_cart_recovery
      WHERE ${whereClause}`,
      queryParams
    );

    // Format results
    const formattedCarts = abandonedCarts.map(cart => ({
      id: cart.id,
      cartId: cart.cart_id,
      userId: cart.user_id,
      email: cart.email,
      customerName: cart.first_name ? `${cart.first_name} ${cart.last_name}` : 'Guest',
      cartData: JSON.parse(cart.cart_data),
      totalValue: cart.total_value,
      itemCount: cart.item_count,
      recoveryStatus: cart.recovery_status,
      recoveryToken: cart.recovery_token,
      firstEmailSentAt: cart.first_email_sent_at,
      reminderEmailSentAt: cart.reminder_email_sent_at,
      emailOpenCount: cart.email_open_count,
      emailClickCount: cart.email_click_count,
      recoveredAt: cart.recovered_at,
      recoveryOrderId: cart.recovery_order_id,
      recoveryValue: cart.recovery_value,
      createdAt: cart.created_at,
      expiresAt: cart.expires_at
    }));

    const stats = statsResult[0];

    return NextResponse.json({
      success: true,
      abandonedCarts: formattedCarts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalCarts: countResult[0].total,
        limit
      },
      statistics: {
        totalAbandoned: stats.total_abandoned,
        recoveredCount: stats.recovered_count,
        recoveryRate: stats.total_abandoned > 0 ? (stats.recovered_count / stats.total_abandoned * 100).toFixed(2) : '0.00',
        totalRecoveredValue: stats.total_recovered_value,
        averageCartValue: stats.avg_cart_value,
        emailsSent: stats.emails_sent
      }
    });

  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

// POST /api/cart/abandoned - Create abandoned cart recovery entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cartId,
      email,
      cartData,
      totalValue,
      itemCount,
      customerName,
      sourcePage,
      deviceType,
      browser,
      utmSource,
      utmMedium,
      utmCampaign
    } = body;

    if (!cartId || !email || !cartData || totalValue === undefined || !itemCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Check if abandoned cart entry already exists for this cart/email
    const [existingCarts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM abandoned_cart_recovery WHERE cart_id = ? AND email = ? AND recovery_status NOT IN ("recovered", "expired")',
      [cartId, email]
    );

    if (existingCarts.length > 0) {
      // Update existing entry
      await pool.execute(
        `UPDATE abandoned_cart_recovery 
         SET cart_data = ?, 
             total_value = ?, 
             item_count = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(cartData), totalValue, itemCount, existingCarts[0].id]
      );

      return NextResponse.json({
        success: true,
        message: 'Abandoned cart updated',
        cartRecoveryId: existingCarts[0].id
      });
    }

    // Get client info
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Create new abandoned cart entry
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO abandoned_cart_recovery (
        cart_id,
        user_id,
        email,
        cart_data,
        total_value,
        item_count,
        customer_name,
        source_page,
        device_type,
        browser,
        utm_source,
        utm_medium,
        utm_campaign
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cartId,
        user?.userId || null,
        email,
        JSON.stringify(cartData),
        totalValue,
        itemCount,
        customerName,
        sourcePage,
        deviceType,
        browser,
        utmSource,
        utmMedium,
        utmCampaign
      ]
    );

    // Log the cart abandonment interaction
    await pool.execute(
      `INSERT INTO cart_recovery_interactions (
        recovery_id,
        interaction_type,
        interaction_data,
        user_agent,
        ip_address
      ) VALUES (?, 'cart_visited', ?, ?, ?)`,
      [
        result.insertId,
        JSON.stringify({ 
          action: 'cart_abandoned',
          totalValue,
          itemCount,
          sourcePage
        }),
        userAgent,
        clientIp
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart tracked',
      cartRecoveryId: result.insertId
    });

  } catch (error) {
    console.error('Error creating abandoned cart entry:', error);
    return NextResponse.json(
      { error: 'Failed to track abandoned cart' },
      { status: 500 }
    );
  }
}