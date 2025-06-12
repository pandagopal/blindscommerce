import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    
    const [categories] = await pool.execute(
      `SELECT 
        category_id as id,
        name,
        slug,
        description,
        image_url,
        featured,
        display_order
      FROM categories 
      ORDER BY display_order ASC, name ASC`
    );
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}