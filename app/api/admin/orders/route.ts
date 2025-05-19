import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const pool = await getPool();
    connection = await pool.getConnection();

    // Build the base query
    let query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.user_id,
        o.status_id,
        o.subtotal,
        o.shipping_cost,
        o.tax_amount,
        o.total_amount,
        o.shipping_address_id,
        o.billing_address_id,
        o.payment_method,
        o.payment_status,
        o.notes,
        o.created_at,
        o.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        os.name as status_name,
        COUNT(oi.order_item_id) as total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_status os ON o.status_id = os.status_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
    `;

    const conditions = [];
    const values = [];

    // Add search condition
    if (search) {
      conditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add status filter
    if (status) {
      conditions.push('os.name = ?');
      values.push(status);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add GROUP BY
    query += ' GROUP BY o.order_id';

    // Add sorting
    const validSortFields = ['order_number', 'total_amount', 'status_name', 'created_at', 'total_items'];
    const validSortOrders = ['asc', 'desc'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Handle special case for status_name sorting
    if (finalSortBy === 'status_name') {
      query += ` ORDER BY os.name ${finalSortOrder}`;
    } else {
      query += ` ORDER BY o.${finalSortBy} ${finalSortOrder}`;
    }

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    // Execute the query
    const [rows] = await connection.query(query, values);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_status os ON o.status_id = os.status_id
    `;

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countRows] = await connection.query(countQuery, values.slice(0, -2));
    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      orders: rows || [],
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      orders: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: 'Failed to fetch orders'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
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
      totalAmount,
      shippingMethod = 'Standard',
      paymentMethod = 'Credit Card',
      notes = '',
      status = 'Pending',
      shippingAddressId,
      billingAddressId,
      paymentStatus = 'Pending'
    } = body;

    // Validate required fields
    if (!userId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    try {
      await connection.query('BEGIN');

      // Get status ID
      const [statusResult] = await connection.query(
        'SELECT status_id FROM order_status WHERE name = ?',
        [status]
      );

      if (!statusResult.length) {
        throw new Error(`Invalid status: ${status}`);
      }

      const statusId = statusResult[0].status_id;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          user_id,
          order_number,
          status_id,
          subtotal,
          shipping_cost,
          tax_amount,
          total_amount,
          shipping_address_id,
          billing_address_id,
          payment_method,
          payment_status,
          notes,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          orderNumber,
          statusId,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          shippingAddressId,
          billingAddressId,
          paymentMethod,
          paymentStatus,
          notes
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            width,
            height,
            color_name,
            material_name,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.width,
            item.height,
            item.colorName,
            item.materialName
          ]
        );
      }

      await connection.query('COMMIT');

      return NextResponse.json({
        message: 'Order created successfully',
        order_id: orderId,
        order_number: orderNumber
      });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 