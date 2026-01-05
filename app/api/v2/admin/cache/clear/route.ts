import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/api/v2/utils/auth';
import { getPool } from '@/lib/db';
import { clearAllCache } from '@/lib/cache/cacheManager';

export async function POST(req: NextRequest) {
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

    // Clear all cache
    clearAllCache();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
