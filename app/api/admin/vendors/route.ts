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
        v.vendor_info_id,
        v.business_name,
        v.business_email,
        v.business_phone,
        v.business_address,
        v.tax_id,
        v.is_active,
        v.created_at,
        v.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.phone as user_phone,
        (
          SELECT COUNT(*)
          FROM blinds.products p
          WHERE p.vendor_id = v.vendor_info_id
        ) as product_count,
        (
          SELECT COALESCE(SUM(oi.subtotal), 0)
          FROM blinds.order_items oi
          JOIN blinds.products p ON oi.product_id = p.product_id
          WHERE p.vendor_id = v.vendor_info_id
        ) as total_sales
      FROM blinds.vendor_info v
      JOIN blinds.users u ON v.user_id = u.user_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        v.business_name ILIKE $${paramCount} OR 
        v.business_email ILIKE $${paramCount} OR 
        v.business_phone ILIKE $${paramCount} OR
        u.email ILIKE $${paramCount} OR
        u.first_name ILIKE $${paramCount} OR
        u.last_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'active') {
      query += ` AND v.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND v.is_active = false`;
    }

    // Add sorting
    const validSortFields = ['business_name', 'created_at', 'total_sales', 'product_count'];
    const validSortOrders = ['asc', 'desc'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    if (finalSortBy === 'total_sales') {
      query = `WITH vendor_data AS (${query})
        SELECT * FROM vendor_data
        ORDER BY total_sales ${finalSortOrder}`;
    } else if (finalSortBy === 'product_count') {
      query = `WITH vendor_data AS (${query})
        SELECT * FROM vendor_data
        ORDER BY product_count ${finalSortOrder}`;
    } else {
      query += ` ORDER BY v.${finalSortBy} ${finalSortOrder}`;
    }

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM blinds.vendor_info v
      JOIN blinds.users u ON v.user_id = u.user_id
      WHERE 1=1
      ${search ? `AND (
        v.business_name ILIKE $1 OR 
        v.business_email ILIKE $1 OR 
        v.business_phone ILIKE $1 OR
        u.email ILIKE $1 OR
        u.first_name ILIKE $1 OR
        u.last_name ILIKE $1
      )` : ''}
      ${status === 'active' ? 'AND v.is_active = true' : ''}
      ${status === 'inactive' ? 'AND v.is_active = false' : ''}
    `;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    return NextResponse.json({
      vendors: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
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
      email,
      password,
      firstName,
      lastName,
      phone,
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      taxId,
      isActive = true
    } = body;

    // Validate required fields
    if (!email || !password || !businessName || !businessEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create user account
      const userResult = await client.query(
        `INSERT INTO blinds.users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING user_id`,
        [email, password, firstName, lastName, phone, isActive]
      );

      const userId = userResult.rows[0].user_id;

      // Create vendor info
      const vendorResult = await client.query(
        `INSERT INTO blinds.vendor_info (
          user_id,
          business_name,
          business_email,
          business_phone,
          business_address,
          tax_id,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING vendor_info_id`,
        [
          userId,
          businessName,
          businessEmail,
          businessPhone || null,
          businessAddress || null,
          taxId || null,
          isActive
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        vendorId: vendorResult.rows[0].vendor_info_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
} 