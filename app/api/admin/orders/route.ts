import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const pool = await getPool();
    let query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.created_at,
        o.updated_at,
        o.subtotal,
        o.shipping_cost,
        o.tax_amount,
        o.discount_amount,
        o.total_amount,
        o.shipping_method,
        o.payment_method,
        o.notes,
        os.name as status,
        u.email as customer_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        (
          SELECT COUNT(*)
          FROM blinds.order_items oi
          WHERE oi.order_id = o.order_id
        ) as item_count
      FROM blinds.orders o
      JOIN blinds.order_status os ON o.status_id = os.status_id
      JOIN blinds.users u ON o.user_id = u.user_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        o.order_number ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND os.name = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    // Add sorting
    const validSortFields = ['order_number', 'created_at', 'total_amount', 'status'];
    const validSortOrders = ['asc', 'desc'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    query += ` ORDER BY o.${finalSortBy === 'status' ? 'status_id' : finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM blinds.orders o
      JOIN blinds.order_status os ON o.status_id = os.status_id
      JOIN blinds.users u ON o.user_id = u.user_id
      WHERE 1=1
      ${search ? `AND (
        o.order_number ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.first_name ILIKE $1 OR 
        u.last_name ILIKE $1
      )` : ''}
      ${status ? `AND os.name = $${search ? '2' : '1'}` : ''}
    `;
    const countResult = await pool.query(
      countQuery,
      status
        ? search ? [`%${search}%`, status] : [status]
        : search ? [`%${search}%`] : []
    );

    return NextResponse.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      items,
      subtotal,
      shippingCost = 0,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount,
      shippingMethod = 'Standard',
      paymentMethod = 'Credit Card',
      notes = '',
      status = 'Pending'
    } = body;

    // Validate required fields
    if (!userId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get status ID
      const statusResult = await client.query(
        'SELECT status_id FROM blinds.order_status WHERE name = $1',
        [status]
      );

      if (!statusResult.rows.length) {
        throw new Error(`Invalid status: ${status}`);
      }

      const statusId = statusResult.rows[0].status_id;

      // Create order
      const orderResult = await client.query(
        `INSERT INTO blinds.orders (
          user_id,
          status_id,
          subtotal,
          shipping_cost,
          tax_amount,
          discount_amount,
          total_amount,
          shipping_method,
          payment_method,
          notes,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING order_id`,
        [
          userId,
          statusId,
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          totalAmount,
          shippingMethod,
          paymentMethod,
          notes
        ]
      );

      const orderId = orderResult.rows[0].order_id;

      // Create order items
      for (const item of items) {
        await client.query(
          `INSERT INTO blinds.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            width,
            height,
            color_id,
            material_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            orderId,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice,
            item.width || null,
            item.height || null,
            item.colorId || null,
            item.materialId || null
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        orderId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 