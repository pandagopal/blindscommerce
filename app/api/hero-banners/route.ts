import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { heroBannerCache, CacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const cacheKey = CacheKeys.heroBanner.active();
    const cachedData = heroBannerCache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({ banners: cachedData, cached: true });
    }

    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM hero_banners WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC LIMIT 5`
    );

    heroBannerCache.set(cacheKey, rows);
    return NextResponse.json({ banners: rows, cached: false });
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json({ error: 'Failed to fetch hero banners' }, { status: 500 });
  }
}