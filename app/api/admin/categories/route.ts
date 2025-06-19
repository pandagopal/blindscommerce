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
      `SELECT * FROM categories ORDER BY display_order ASC, created_at DESC`
    );

    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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
    const { name, slug, description, image_url, featured, display_order } = body;

    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO categories (name, slug, description, image_url, featured, display_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, image_url || null, featured ? 1 : 0, display_order || 0]
    );

    return NextResponse.json({ 
      success: true, 
      category_id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}