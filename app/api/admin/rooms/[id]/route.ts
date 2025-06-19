import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const roomId = params.id;

    const pool = await getPool();
    await pool.execute(
      `UPDATE room_types 
       SET name = ?, description = ?, image_url = ?, typical_humidity = ?, 
           light_exposure = ?, privacy_requirements = ?, recommended_products = ?, 
           is_active = ?, updated_at = NOW()
       WHERE room_type_id = ?`,
      [
        name, 
        description || null, 
        image_url || null,
        typical_humidity || null,
        light_exposure || null,
        privacy_requirements || null,
        recommended_products || null,
        is_active ? 1 : 0, 
        roomId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = params.id;
    const pool = await getPool();

    await pool.execute(
      `DELETE FROM room_types WHERE room_type_id = ?`,
      [roomId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}