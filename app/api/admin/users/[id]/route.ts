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

    // Ensure params.id exists and parse it
    if (!context.params?.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.is_admin,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        u.is_verified,
        CASE 
          WHEN vi.vendor_info_id IS NOT NULL THEN 'vendor'
          WHEN ss.sales_staff_id IS NOT NULL THEN 'sales'
          WHEN i.installer_id IS NOT NULL THEN 'installer'
          WHEN u.is_admin THEN 'admin'
          ELSE 'customer'
        END as role
      FROM blinds.users u
      LEFT JOIN blinds.vendor_info vi ON u.user_id = vi.user_id
      LEFT JOIN blinds.sales_staff ss ON u.user_id = ss.user_id
      LEFT JOIN blinds.installers i ON u.user_id = i.user_id
      WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
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
        'email = $1',
        'first_name = $2',
        'last_name = $3',
        'phone = $4',
        'is_active = $5',
        'updated_at = NOW()'
      ];
      const updateValues = [email, firstName, lastName, phone, isActive];

      // Add password update if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = $' + (updateValues.length + 1));
        updateValues.push(hashedPassword);
      }

      // Update user
      updateValues.push(context.params.id);
      await client.query(
        `UPDATE blinds.users 
         SET ${updateFields.join(', ')} 
         WHERE user_id = $${updateValues.length}`,
        updateValues
      );

      // Get current role
      const roleResult = await client.query(
        `SELECT 
          CASE 
            WHEN vi.vendor_info_id IS NOT NULL THEN 'vendor'
            WHEN ss.sales_staff_id IS NOT NULL THEN 'sales'
            WHEN i.installer_id IS NOT NULL THEN 'installer'
            WHEN u.is_admin THEN 'admin'
            ELSE 'customer'
          END as role
        FROM blinds.users u
        LEFT JOIN blinds.vendor_info vi ON u.user_id = vi.user_id
        LEFT JOIN blinds.sales_staff ss ON u.user_id = ss.user_id
        LEFT JOIN blinds.installers i ON u.user_id = i.user_id
        WHERE u.user_id = $1`,
        [context.params.id]
      );

      const currentRoleValue = roleResult.rows[0]?.role || 'customer';

      // Update role if changed
      if (role !== currentRoleValue) {
        // Remove current role
        if (currentRoleValue === 'vendor') {
          await client.query('UPDATE blinds.vendor_info SET is_active = $1 WHERE user_id = $2', [isActive, context.params.id]);
        } else if (currentRoleValue === 'sales') {
          await client.query('UPDATE blinds.sales_staff SET is_active = $1 WHERE user_id = $2', [isActive, context.params.id]);
        } else if (currentRoleValue === 'installer') {
          await client.query('UPDATE blinds.installers SET is_active = $1 WHERE user_id = $2', [isActive, context.params.id]);
        }

        // Add new role-specific entry
        if (role === 'vendor') {
          await client.query(
            `INSERT INTO blinds.vendor_info (
              user_id, business_name, business_email, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [context.params.id, `${firstName} ${lastName}'s Business`, email, isActive]
          );
        } else if (role === 'sales') {
          await client.query(
            `INSERT INTO blinds.sales_staff (
              user_id, hire_date, is_active, created_at, updated_at
            ) VALUES ($1, NOW(), $2, NOW(), NOW())`,
            [context.params.id, isActive]
          );
        } else if (role === 'installer') {
          await client.query(
            `INSERT INTO blinds.installers (
              user_id, is_active, created_at, updated_at
            ) VALUES ($1, $2, NOW(), NOW())`,
            [context.params.id, isActive]
          );
        }

        // Update admin status
        await client.query(
          'UPDATE blinds.users SET is_admin = $1 WHERE user_id = $2',
          [role === 'admin', context.params.id]
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

    const userId = parseInt(context.params.id);
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
        'UPDATE blinds.users SET is_active = $1, updated_at = NOW() WHERE user_id = $2',
        [is_active, userId]
      );

      // Update role-specific status
      await client.query(
        'UPDATE blinds.vendor_info SET is_active = $1 WHERE user_id = $2',
        [is_active, userId]
      );
      await client.query(
        'UPDATE blinds.sales_staff SET is_active = $1 WHERE user_id = $2',
        [is_active, userId]
      );
      await client.query(
        'UPDATE blinds.installers SET is_active = $1 WHERE user_id = $2',
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