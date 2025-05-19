import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const pool = await getPool();
    const [rows] = await pool.query<UserRow[]>(
      `SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.is_active,
        u.is_verified,
        u.last_login,
        u.created_at,
        u.updated_at,
        v.business_name,
        v.business_email,
        v.business_phone,
        v.approval_status as vendor_status,
        v.is_verified as vendor_verified,
        v.is_active as vendor_active,
        s.territory as sales_territory,
        s.commission_rate,
        s.is_active as sales_active,
        i.certification_number,
        i.service_area,
        i.is_active as installer_active
      FROM users u
      LEFT JOIN vendor_info v ON u.user_id = v.user_id
      LEFT JOIN sales_staff s ON u.user_id = s.user_id
      LEFT JOIN installers i ON u.user_id = i.user_id
      WHERE u.user_id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = rows[0];
    return NextResponse.json({
      user: {
        user_id: userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        is_verified: userData.is_verified,
        last_login: userData.last_login,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        // Include role-specific data
        vendor_info: userData.role === 'vendor' ? {
          business_name: userData.business_name,
          business_email: userData.business_email,
          business_phone: userData.business_phone,
          approval_status: userData.vendor_status,
          is_verified: userData.vendor_verified,
          is_active: userData.vendor_active
        } : null,
        sales_info: userData.role === 'sales' ? {
          territory: userData.sales_territory,
          commission_rate: userData.commission_rate,
          is_active: userData.sales_active
        } : null,
        installer_info: userData.role === 'installer' ? {
          certification_number: userData.certification_number,
          service_area: userData.service_area,
          is_active: userData.installer_active
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      isActive
    } = body;

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user table
      const updateFields = [
        'email = ?',
        'first_name = ?',
        'last_name = ?',
        'phone = ?',
        'role = ?',
        'is_active = ?',
        'updated_at = NOW()'
      ];
      const updateValues = [email, firstName, lastName, phone, role, isActive];

      // Add password update if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ?');
        updateValues.push(hashedPassword);
      }

      // Update user
      updateValues.push(userId);
      await client.query(
        `UPDATE users 
         SET ${updateFields.join(', ')} 
         WHERE user_id = ?`,
        updateValues
      );

      // Handle role-specific updates
      if (role === 'vendor') {
        await client.query(
          `INSERT INTO vendor_info (
            user_id, business_name, business_email, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            business_name = VALUES(business_name),
            business_email = VALUES(business_email),
            is_active = VALUES(is_active),
            updated_at = NOW()`,
          [userId, `${firstName} ${lastName}'s Business`, email, isActive]
        );
      } else if (role === 'sales') {
        await client.query(
          `INSERT INTO sales_staff (
            user_id, hire_date, is_active, created_at, updated_at
          ) VALUES (?, NOW(), ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            is_active = VALUES(is_active),
            updated_at = NOW()`,
          [userId, isActive]
        );
      } else if (role === 'installer') {
        await client.query(
          `INSERT INTO installers (
            user_id, is_active, created_at, updated_at
          ) VALUES (?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            is_active = VALUES(is_active),
            updated_at = NOW()`,
          [userId, isActive]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deactivation
    if (user.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own account status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user status
      await client.query(
        'UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?',
        [is_active, userId]
      );

      // Update related records
      await client.query(
        'UPDATE vendor_info SET is_active = ? WHERE user_id = ?',
        [is_active, userId]
      );
      await client.query(
        'UPDATE sales_staff SET is_active = ? WHERE user_id = ?',
        [is_active, userId]
      );
      await client.query(
        'UPDATE installers SET is_active = ? WHERE user_id = ?',
        [is_active, userId]
      );

      await client.query('COMMIT');

      return NextResponse.json({ 
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
} 