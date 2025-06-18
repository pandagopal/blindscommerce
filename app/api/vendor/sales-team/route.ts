import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Get vendor's sales team
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    try {
      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Get sales team members for this vendor
      const [salesRows] = await pool.execute(
        `SELECT 
          ss.sales_staff_id,
          ss.user_id,
          ss.territory,
          ss.commission_rate,
          ss.target_sales,
          ss.total_sales,
          ss.is_active,
          ss.start_date,
          u.first_name,
          u.last_name,
          u.email,
          u.phone
         FROM sales_staff ss
         JOIN users u ON ss.user_id = u.user_id
         WHERE ss.vendor_id = ?
         ORDER BY u.first_name, u.last_name`,
        [vendorId]
      );

      const salesTeam = (salesRows as any[]).map(row => ({
        salesStaffId: row.sales_staff_id,
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        territory: row.territory,
        commissionRate: parseFloat(row.commission_rate),
        targetSales: parseFloat(row.target_sales),
        totalSales: parseFloat(row.total_sales),
        isActive: Boolean(row.is_active),
        startDate: row.start_date
      }));

      return NextResponse.json({ salesTeam });

    } finally {
      }

  } catch (error) {
    console.error('Get sales team error:', error);
    return NextResponse.json(
      { error: 'Failed to get sales team' },
      { status: 500 }
    );
  }
}

// POST - Add new sales person to vendor's team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      territory,
      commissionRate,
      targetSales,
      isActive
    } = await request.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Email, first name, and last name are required' 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Check if user already exists
      const [existingUserRows] = await pool.execute(
        'SELECT user_id, role FROM users WHERE email = ?',
        [email]
      );

      let userId;

      if (Array.isArray(existingUserRows) && existingUserRows.length > 0) {
        const existingUser = existingUserRows[0] as any;
        
        // Check if user is already a sales person
        if (existingUser.role === 'sales') {
          // Check if already assigned to a vendor
          const [existingSalesRows] = await pool.execute(
            'SELECT sales_staff_id, vendor_id FROM sales_staff WHERE user_id = ?',
            [existingUser.user_id]
          );

          if (Array.isArray(existingSalesRows) && existingSalesRows.length > 0) {
            const existingSales = existingSalesRows[0] as any;
            if (existingSales.vendor_id && existingSales.vendor_id !== vendorId) {
              // Rollback handling needs review with pool
              return NextResponse.json({ 
                error: 'This sales person is already assigned to another vendor' 
              }, { status: 409 });
            }
          }
        }

        userId = existingUser.user_id;

        // Update user to sales role if not already
        if (existingUser.role !== 'sales') {
          await pool.execute(
            'UPDATE users SET role = ?, first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE user_id = ?',
            ['sales', firstName, lastName, phone, userId]
          );
        }
      } else {
        // Create new user
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const [userResult] = await pool.execute(
          `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'sales', 1, NOW(), NOW())`,
          [email, hashedPassword, firstName, lastName, phone]
        );

        userId = (userResult as any).insertId;
      }

      // Check if sales_staff record already exists for this user
      const [existingSalesStaffRows] = await pool.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ?',
        [userId]
      );

      if (Array.isArray(existingSalesStaffRows) && existingSalesStaffRows.length > 0) {
        // Update existing sales_staff record
        await pool.execute(
          `UPDATE sales_staff SET 
           vendor_id = ?, territory = ?, commission_rate = ?, target_sales = ?, 
           is_active = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [vendorId, territory, commissionRate, targetSales, isActive ? 1 : 0, userId]
        );
      } else {
        // Create new sales_staff record
        await pool.execute(
          `INSERT INTO sales_staff (user_id, vendor_id, territory, commission_rate, target_sales, is_active, start_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURDATE(), NOW(), NOW())`,
          [userId, vendorId, territory, commissionRate, targetSales, isActive ? 1 : 0]
        );
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Sales person added to team successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Add sales person error:', error);
    return NextResponse.json(
      { error: 'Failed to add sales person' },
      { status: 500 }
    );
  }
}