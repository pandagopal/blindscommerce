import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'New password must be at least 8 characters long' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get current user data
      const [userRows] = await connection.execute(
        'SELECT user_id, password_hash FROM users WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(userRows) || userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = userRows[0] as any;

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ 
          error: 'Current password is incorrect' 
        }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await connection.execute(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
        [hashedNewPassword, session.user.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}