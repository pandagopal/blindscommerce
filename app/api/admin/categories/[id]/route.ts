import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, image_url, featured, display_order } = body;
    const categoryId = params.id;

    const pool = await getPool();
    await pool.execute(
      `UPDATE categories 
       SET name = ?, slug = ?, description = ?, image_url = ?, featured = ?, display_order = ?, updated_at = NOW()
       WHERE category_id = ?`,
      [name, slug, description || null, image_url || null, featured ? 1 : 0, display_order || 0, categoryId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = params.id;
    const pool = await getPool();

    // Check if category has products
    const [products] = await pool.execute(
      `SELECT COUNT(*) as count FROM products WHERE category_id = ?`,
      [categoryId]
    );

    if ((products as any)[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' }, 
        { status: 400 }
      );
    }

    await pool.execute(
      `DELETE FROM categories WHERE category_id = ?`,
      [categoryId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}