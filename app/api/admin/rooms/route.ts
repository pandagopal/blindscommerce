import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM room_types ORDER BY name ASC`
    );

    return NextResponse.json({ rooms: rows });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      image_url,
      typical_humidity,
      light_exposure,
      privacy_requirements,
      recommended_products,
      is_active 
    } = body;

    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO room_types (
        name, description, image_url, typical_humidity, light_exposure,
        privacy_requirements, recommended_products, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || null, 
        image_url || null,
        typical_humidity || null,
        light_exposure || null,
        privacy_requirements || null,
        recommended_products || null,
        is_active ? 1 : 0
      ]
    );

    return NextResponse.json({ 
      success: true, 
      room_type_id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}