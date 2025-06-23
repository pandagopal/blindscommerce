import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    // If admin is viewing another user's info, use that user_id
    // Otherwise, use current user's id
    const targetUserId = (user.role === 'admin' && userId) ? parseInt(userId) : user.userId;

    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id, business_name FROM vendor_info WHERE user_id = ?',
      [targetUserId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    return NextResponse.json({
      vendor_info_id: rows[0].vendor_info_id,
      business_name: rows[0].business_name
    });
  } catch (error) {
    console.error('Error fetching vendor info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor info' },
      { status: 500 }
    );
  }
}