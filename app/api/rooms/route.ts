import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT room_type_id as id, name, description, image_url as image, 
              typical_humidity, light_exposure, privacy_requirements 
       FROM room_types 
       WHERE is_active = 1 
       ORDER BY name ASC`
    );

    return NextResponse.json({ rooms: rows });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}