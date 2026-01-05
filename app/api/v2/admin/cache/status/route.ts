import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/api/v2/utils/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getPool();

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

    // Get cache status from database
    const [settings] = await db.query(
      'SELECT setting_value FROM cache_settings WHERE setting_key = ?',
      ['cache_enabled']
    ) as any[];

    const cacheEnabled = settings && settings.length > 0 && settings[0].setting_value === 'true';

    return NextResponse.json({
      success: true,
      data: {
        enabled: cacheEnabled,
      },
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
