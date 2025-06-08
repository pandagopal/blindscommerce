import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Create price alert
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { product_id, target_price, alert_type = 'price_drop' } = await request.json();

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify product exists and get current price
    const [products] = await pool.execute(
      'SELECT product_id, name, price, status FROM products WHERE product_id = ?',
      [product_id]
    );

    if (!products || (products as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = (products as any[])[0];

    if (product.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot create alert for inactive product' },
        { status: 400 }
      );
    }

    // Validate target price for price drop alerts
    if (alert_type === 'price_drop' && target_price) {
      if (target_price >= product.price) {
        return NextResponse.json(
          { error: 'Target price must be lower than current price for price drop alerts' },
          { status: 400 }
        );
      }
    }

    // Check if alert already exists
    const [existingAlerts] = await pool.execute(`
      SELECT alert_id FROM price_alerts 
      WHERE user_id = ? AND product_id = ? AND alert_type = ? AND is_active = true
    `, [user.userId, product_id, alert_type]);

    if (existingAlerts && (existingAlerts as any[]).length > 0) {
      return NextResponse.json(
        { error: 'You already have an active alert for this product and alert type' },
        { status: 409 }
      );
    }

    // Create price alert
    const [result] = await pool.execute(`
      INSERT INTO price_alerts (
        user_id, product_id, target_price, alert_type,
        last_checked_price, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [user.userId, product_id, target_price, alert_type, product.price]);

    const alert_id = (result as any).insertId;

    // Get the created alert with product details
    const [newAlert] = await pool.execute(`
      SELECT 
        pa.*,
        p.name as product_name,
        p.price as current_price,
        p.slug as product_slug
      FROM price_alerts pa
      JOIN products p ON pa.product_id = p.product_id
      WHERE pa.alert_id = ?
    `, [alert_id]);

    return NextResponse.json({
      success: true,
      message: 'Price alert created successfully',
      alert: (newAlert as any[])[0]
    });

  } catch (error) {
    console.error('Create price alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create price alert' },
      { status: 500 }
    );
  }
}

// GET - Get user's price alerts
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
    const active_only = searchParams.get('active') === 'true';

    const pool = await getPool();

    let query = `
      SELECT 
        pa.*,
        p.name as product_name,
        p.price as current_price,
        p.slug as product_slug,
        p.status as product_status,
        pi.image_url as product_image,
        CASE 
          WHEN pa.alert_type = 'price_drop' AND p.price <= pa.target_price THEN true
          WHEN pa.alert_type = 'back_in_stock' AND p.stock_quantity > 0 THEN true
          WHEN pa.alert_type = 'price_change' AND p.price != pa.last_checked_price THEN true
          ELSE false
        END as alert_triggered
      FROM price_alerts pa
      JOIN products p ON pa.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE pa.user_id = ?
    `;

    const params = [user.userId];

    if (active_only) {
      query += ' AND pa.is_active = true';
    }

    query += ' ORDER BY pa.created_at DESC';

    const [alerts] = await pool.execute(query, params);

    const formattedAlerts = (alerts as any[]).map(alert => ({
      alert_id: alert.alert_id,
      product_id: alert.product_id,
      product_name: alert.product_name,
      product_slug: alert.product_slug,
      product_image: alert.product_image,
      product_status: alert.product_status,
      target_price: alert.target_price,
      current_price: parseFloat(alert.current_price),
      last_checked_price: alert.last_checked_price ? parseFloat(alert.last_checked_price) : null,
      alert_type: alert.alert_type,
      is_active: Boolean(alert.is_active),
      alert_triggered: Boolean(alert.alert_triggered),
      last_notification_sent: alert.last_notification_sent,
      created_at: alert.created_at,
      price_change: alert.last_checked_price 
        ? parseFloat(alert.current_price) - parseFloat(alert.last_checked_price)
        : 0
    }));

    return NextResponse.json({
      success: true,
      price_alerts: formattedAlerts,
      total_alerts: formattedAlerts.length,
      triggered_alerts: formattedAlerts.filter(alert => alert.alert_triggered).length
    });

  } catch (error) {
    console.error('Get price alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to get price alerts' },
      { status: 500 }
    );
  }
}