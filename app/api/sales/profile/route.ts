import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// GET - Get sales person profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get sales staff info with vendor details
      const [profileRows] = await connection.execute(
        `SELECT 
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          ss.sales_staff_id,
          ss.territory,
          ss.commission_rate,
          ss.target_sales,
          ss.total_sales,
          ss.is_active,
          ss.start_date,
          vi.company_name,
          vi.contact_email,
          vi.contact_phone
         FROM users u
         JOIN sales_staff ss ON u.user_id = ss.user_id
         LEFT JOIN vendor_info vi ON ss.vendor_id = vi.vendor_info_id
         WHERE u.user_id = ? AND u.role = 'sales'`,
        [session.user.id]
      );

      if (!Array.isArray(profileRows) || profileRows.length === 0) {
        return NextResponse.json({ 
          error: 'Sales profile not found' 
        }, { status: 404 });
      }

      const row = profileRows[0] as any;

      const profile = {
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        territory: row.territory,
        commissionRate: parseFloat(row.commission_rate),
        targetSales: parseFloat(row.target_sales),
        totalSales: parseFloat(row.total_sales),
        isActive: Boolean(row.is_active),
        startDate: row.start_date,
        vendorInfo: {
          companyName: row.company_name || 'Not assigned',
          contactEmail: row.contact_email || 'Not available',
          contactPhone: row.contact_phone || 'Not available'
        }
      };

      return NextResponse.json({ profile });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get sales profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get sales profile' },
      { status: 500 }
    );
  }
}

// PUT - Update sales person profile (limited fields)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, phone } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Update user record
      await connection.execute(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE user_id = ? AND role = "sales"',
        [firstName, lastName, phone, session.user.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Update sales profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}