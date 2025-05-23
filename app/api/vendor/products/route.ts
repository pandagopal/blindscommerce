import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getPool from '@/lib/db';

// GET: List all products for the current vendor
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM vendor_products WHERE vendor_id = ? ORDER BY created_at DESC`,
      [user.userId]
    );
    return NextResponse.json({ products: rows });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO vendor_products (vendor_id, name, slug, type_id, series_name, material_type, short_description, full_description, features, benefits, is_active, is_listing_enabled, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.userId, body.name, body.slug, body.type_id, body.series_name, body.material_type, body.short_description, body.full_description, JSON.stringify(body.features || []), JSON.stringify(body.benefits || []), body.is_active ?? true, body.is_listing_enabled ?? true, body.base_price]
    );
    return NextResponse.json({ success: true, product_id: result.insertId });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT: Update a product (by product_id)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    if (!body.product_id) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
    }
    const pool = await getPool();
    const [result] = await pool.execute(
      `UPDATE vendor_products SET name=?, slug=?, type_id=?, series_name=?, material_type=?, short_description=?, full_description=?, features=?, benefits=?, is_active=?, is_listing_enabled=?, base_price=?, updated_at=NOW() WHERE product_id=? AND vendor_id=?`,
      [body.name, body.slug, body.type_id, body.series_name, body.material_type, body.short_description, body.full_description, JSON.stringify(body.features || []), JSON.stringify(body.benefits || []), body.is_active, body.is_listing_enabled, body.base_price, body.product_id, user.userId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Product not found or not owned by vendor' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE: Delete a product (by product_id)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { product_id } = await req.json();
    if (!product_id) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
    }
    const pool = await getPool();
    const [result] = await pool.execute(
      `DELETE FROM vendor_products WHERE product_id=? AND vendor_id=?`,
      [product_id, user.userId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Product not found or not owned by vendor' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 