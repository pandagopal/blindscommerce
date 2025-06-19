import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM hero_banners ORDER BY display_order ASC, created_at DESC`
    );

    return NextResponse.json({ banners: rows });
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json({ error: 'Failed to fetch hero banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO hero_banners (
        title, subtitle, description, background_image, right_side_image,
        primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
        display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        is_active ? 1 : 0
      ]
    );

    return NextResponse.json({ 
      success: true, 
      banner_id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating hero banner:', error);
    return NextResponse.json({ error: 'Failed to create hero banner' }, { status: 500 });
  }
}