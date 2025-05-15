import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure params.id exists and parse it
    if (!params?.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(params.id);
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
  { params }: { params: { id: string } }
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
      updateValues.push(params.id);
      await client.query(
        `UPDATE blinds.users 
         SET ${updateFields.join(', ')} 
         WHERE user_id = $${updateValues.length}`,
        updateValues
      );

      // Handle role-specific updates
      const currentRole = await client.query(
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
        [params.id]
      );

      const currentRoleValue = currentRole.rows[0]?.role;

      // Remove existing role-specific entries if role has changed
      if (currentRoleValue !== role) {
        if (currentRoleValue === 'vendor') {
          await client.query('DELETE FROM blinds.vendor_info WHERE user_id = $1', [params.id]);
        } else if (currentRoleValue === 'sales') {
          await client.query('DELETE FROM blinds.sales_staff WHERE user_id = $1', [params.id]);
        } else if (currentRoleValue === 'installer') {
          await client.query('DELETE FROM blinds.installers WHERE user_id = $1', [params.id]);
        }

        // Add new role-specific entry
        if (role === 'vendor') {
          await client.query(
            `INSERT INTO blinds.vendor_info (
              user_id, business_name, business_email, created_at, updated_at
            ) VALUES ($1, $2, $3, NOW(), NOW())`,
            [params.id, `${firstName} ${lastName}'s Business`, email]
          );
        } else if (role === 'sales') {
          await client.query(
            `INSERT INTO blinds.sales_staff (
              user_id, hire_date, created_at, updated_at
            ) VALUES ($1, NOW(), NOW(), NOW())`,
            [params.id]
          );
        } else if (role === 'installer') {
          await client.query(
            `INSERT INTO blinds.installers (
              user_id, created_at, updated_at
            ) VALUES ($1, NOW(), NOW())`,
            [params.id]
          );
        }

        // Update admin status
        await client.query(
          'UPDATE blinds.users SET is_admin = $1 WHERE user_id = $2',
          [role === 'admin', params.id]
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First await the current user check
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure params.id exists and parse it
    if (!params?.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (user.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete role-specific entries first
      await client.query('DELETE FROM blinds.vendor_info WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM blinds.sales_staff WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM blinds.installers WHERE user_id = $1', [userId]);

      // Delete the user
      const result = await client.query(
        'DELETE FROM blinds.users WHERE user_id = $1 RETURNING user_id',
        [userId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 