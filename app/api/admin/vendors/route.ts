import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool, hashPassword } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  businessDescription?: string;
}

interface VendorRow extends RowDataPacket {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  vendor_active: boolean;
  vendor_verified: boolean;
  approval_status: string;
  total_sales: number;
  rating: number;
  created_at: Date;
}

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
      SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.is_active,
        u.is_verified,
        u.created_at,
        u.last_login,
        v.business_name,
        v.business_email,
        v.business_phone,
        v.approval_status as vendor_status,
        v.is_verified as vendor_verified,
        v.is_active as vendor_active,
        v.total_sales,
        v.rating
      FROM users u
      LEFT JOIN vendor_info v ON u.user_id = v.user_id
      WHERE u.role = 'vendor'
    `;

    const values: any[] = [];

    if (search) {
      query += ` AND (
        u.email LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.phone LIKE ? OR
        v.business_name LIKE ? OR
        v.business_email LIKE ? OR
        v.business_phone LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      values.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    // Add sorting
    const validSortFields = ['email', 'first_name', 'last_name', 'created_at', 'business_name', 'total_sales', 'rating'];
    const validSortOrders = ['asc', 'desc'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    query += ` ORDER BY u.${finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    console.log('Query:', query);
    console.log('Values:', values);

    const [result] = await pool.query<VendorRow[]>(query, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM users u
      LEFT JOIN vendor_info v ON u.user_id = v.user_id
      WHERE u.role = 'vendor'
      ${search ? `AND (
        u.email LIKE ? OR
        u.first_name LIKE ? OR
        u.last_name LIKE ? OR
        u.phone LIKE ? OR
        v.business_name LIKE ? OR
        v.business_email LIKE ? OR
        v.business_phone LIKE ?
      )` : ''}
    `;

    const [countResult] = await pool.query(
      countQuery,
      search ? [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      ] : []
    );

    // Format the response
    const vendors = result.map(row => ({
      id: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.business_name || `${row.first_name} ${row.last_name}'s Business`,
      contactEmail: row.business_email || row.email,
      contactPhone: row.business_phone || row.phone,
      isActive: row.vendor_active ?? row.is_active,
      isVerified: row.vendor_verified ?? false,
      approvalStatus: row.vendor_status || 'pending',
      totalSales: row.total_sales || 0,
      rating: row.rating || 0,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      vendors,
      total: parseInt((countResult as any[])[0].count, 10)
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

    const data = await request.json() as VendorData;
    
    // Validate required fields
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create user
      const [userResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO users (
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active,
          is_verified
        ) VALUES (?, ?, ?, ?, 'vendor', true, true)`,
        [data.email, await hashPassword(data.password), data.firstName, data.lastName]
      );

      const userId = userResult.insertId;

      // Create vendor info
      await connection.execute(
        `INSERT INTO vendor_info (
          user_id,
          business_name,
          business_email,
          business_phone,
          business_description,
          is_active,
          is_verified,
          approval_status
        ) VALUES (?, ?, ?, ?, ?, true, false, 'pending')`,
        [
          userId,
          data.companyName,
          data.contactEmail,
          data.contactPhone,
          data.businessDescription
        ]
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Vendor created successfully',
        vendorId: userId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
} 