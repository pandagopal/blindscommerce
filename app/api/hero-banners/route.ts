import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM hero_banners WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC LIMIT 5`
    );

    return NextResponse.json({ banners: rows });
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json({ error: 'Failed to fetch hero banners' }, { status: 500 });
  }
}