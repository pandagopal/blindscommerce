import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { roomsCache, CacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get cached data first
    const cacheKey = CacheKeys.rooms.active();
    const cachedRooms = roomsCache.get(cacheKey);
    
    if (cachedRooms) {
      return NextResponse.json({ 
        rooms: cachedRooms,
        cached: true
      });
    }

    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT room_type_id as id, name, description, image_url as image, 
              typical_humidity, light_exposure, privacy_requirements 
       FROM room_types 
       WHERE is_active = 1 
       ORDER BY name ASC`
    );

    // Cache the results
    roomsCache.set(cacheKey, rows);

    return NextResponse.json({ 
      rooms: rows,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}