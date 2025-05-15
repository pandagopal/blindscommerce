import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'business_name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const search = searchParams.get('search') || '';

    const pool = await getPool();
    let query = `
      WITH vendor_users AS (
        SELECT 
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.is_active as user_is_active,
          COALESCE(vi.vendor_info_id, 0) as vendor_info_id,
          COALESCE(vi.business_name, CONCAT(u.first_name, ' ', u.last_name, '''s Business')) as business_name,
          COALESCE(vi.business_email, u.email) as business_email,
          vi.business_phone as contact_phone,
          vi.business_description,
          COALESCE(vi.is_active, true) as is_active,
          vi.is_verified,
          vi.approval_status,
          COALESCE(vi.created_at, u.created_at) as created_at,
          COALESCE(vi.updated_at, u.updated_at) as updated_at
        FROM blinds.users u
        LEFT JOIN blinds.vendor_info vi ON u.user_id = vi.user_id
        WHERE EXISTS (
          SELECT 1 FROM blinds.vendor_info v
          WHERE v.user_id = u.user_id
        )
      )
      SELECT * FROM vendor_users
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        business_name ILIKE $${paramCount} OR
        business_email ILIKE $${paramCount} OR
        contact_phone ILIKE $${paramCount} OR
        email ILIKE $${paramCount} OR
        first_name ILIKE $${paramCount} OR
        last_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add sorting
    const validSortFields = ['business_name', 'created_at', 'business_email'];
    const validSortOrders = ['asc', 'desc'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'business_name';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';

    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM (
        SELECT u.user_id
        FROM blinds.users u
        WHERE EXISTS (
          SELECT 1 FROM blinds.vendor_info v
          WHERE v.user_id = u.user_id
        )
        ${search ? `AND (
          u.email ILIKE $1 OR
          u.first_name ILIKE $1 OR
          u.last_name ILIKE $1 OR
          EXISTS (
            SELECT 1 FROM blinds.vendor_info v
            WHERE v.user_id = u.user_id
            AND (
              v.business_name ILIKE $1 OR
              v.business_email ILIKE $1 OR
              v.contact_phone ILIKE $1
            )
          )
        )` : ''}
      ) as count_query
    `;

    const countResult = await pool.query(
      countQuery,
      search ? [`%${search}%`] : []
    );

    // Format the response
    const vendors = result.rows.map(row => ({
      vendor_info_id: row.vendor_info_id,
      user_id: row.user_id,
      company_name: row.business_name,
      contact_email: row.business_email,
      contact_phone: row.contact_phone,
      business_description: row.business_description,
      is_active: row.is_active && row.user_is_active,
      is_verified: row.is_verified,
      approval_status: row.approval_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name
      }
    }));

    return NextResponse.json({
      vendors,
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
      companyName,
      contactEmail,
      contactPhone,
      businessDescription
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
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
          is_admin,
          is_active,
          is_verified
        ) VALUES ($1, $2, $3, $4, FALSE, TRUE, TRUE)
        RETURNING user_id`,
        [email, await hashPassword(password), firstName, lastName]
      );

      const userId = userResult.rows[0].user_id;

      // Create vendor info
      await client.query(
        `INSERT INTO blinds.vendor_info (
          user_id,
          business_name,
          business_email,
          business_phone,
          business_description,
          is_active,
          is_verified,
          approval_status
        ) VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, 'pending')`,
        [
          userId,
          companyName,
          contactEmail,
          contactPhone,
          businessDescription
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { message: 'Vendor created successfully' },
        { status: 201 }
      );
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