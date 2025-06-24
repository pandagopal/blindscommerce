import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CacheInvalidation } from '@/lib/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      subtitle, 
      description, 
      background_image, 
      right_side_image,
      primary_cta_text,
      primary_cta_link,
      secondary_cta_text,
      secondary_cta_link,
      display_order,
      is_active 
    } = body;
    const { id: bannerId } = await params;

    const pool = await getPool();
    await pool.execute(
      `UPDATE hero_banners 
       SET title = ?, subtitle = ?, description = ?, background_image = ?, right_side_image = ?,
           primary_cta_text = ?, primary_cta_link = ?, secondary_cta_text = ?, secondary_cta_link = ?,
           display_order = ?, is_active = ?, updated_at = NOW()
       WHERE banner_id = ?`,
      [
        title, 
        subtitle || null, 
        description || null, 
        background_image || null, 
        right_side_image || null,
        primary_cta_text || null,
        primary_cta_link || null,
        secondary_cta_text || null,
        secondary_cta_link || null,
        display_order || 0, 
        is_active ? 1 : 0, 
        bannerId
      ]
    );

    // Invalidate hero banner caches
    CacheInvalidation.heroBanners();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating hero banner:', error);
    return NextResponse.json({ error: 'Failed to update hero banner' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bannerId } = await params;
    const pool = await getPool();

    await pool.execute(
      `DELETE FROM hero_banners WHERE banner_id = ?`,
      [bannerId]
    );

    // Invalidate hero banner caches
    CacheInvalidation.heroBanners();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hero banner:', error);
    return NextResponse.json({ error: 'Failed to delete hero banner' }, { status: 500 });
  }
}