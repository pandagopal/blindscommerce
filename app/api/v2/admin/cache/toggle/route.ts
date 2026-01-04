import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/api/v2/utils/auth';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbConnect();

    // Check if user is admin
    const [users] = await db.query(
      'SELECT role FROM users WHERE user_id = ?',
      [userId]
    ) as any[];

    if (!users || users.length === 0 || users[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update cache setting in database
    await db.query(
      `UPDATE cache_settings
       SET setting_value = ?, updated_by = ?, updated_at = NOW()
       WHERE setting_key = ?`,
      [enabled ? 'true' : 'false', userId, 'cache_enabled']
    );

    return NextResponse.json({
      success: true,
      message: `Cache ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        enabled,
      },
    });
  } catch (error) {
    console.error('Error toggling cache:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
