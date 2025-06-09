import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorCatalogRow extends RowDataPacket {
  vendor_product_id: number;
  vendor_id: number;
  product_id: number;
  vendor_sku: string | null;
  vendor_price: number | null;
  quantity_available: number;
  minimum_order_qty: number;
  lead_time_days: number;
  is_active: number;
  is_featured: number;
  vendor_description: string | null;
  vendor_notes: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  short_description: string | null;
  base_price: number;
  product_is_active: number;
  category_name: string | null;
  brand_name: string | null;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  name: string;
  slug: string;
  short_description: string | null;
  base_price: number;
  is_active: number;
  category_name: string | null;
  brand_name: string | null;
  is_associated: number;
}

// GET: List vendor's product catalog (associated products)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    if (action === 'available') {
      // Get products NOT associated with this vendor
      const [availableProducts] = await pool.execute<ProductRow[]>(
        `SELECT 
          p.product_id,
          p.name,
          p.slug,
          p.short_description,
          p.base_price,
          p.is_active,
          c.name as category_name,
          b.name as brand_name,
          CASE WHEN vp.product_id IS NOT NULL THEN 1 ELSE 0 END as is_associated
        FROM products p
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id AND pc.is_primary = 1
        LEFT JOIN categories c ON pc.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN vendor_products vp ON p.product_id = vp.product_id AND vp.vendor_id = ?
        WHERE p.is_active = 1 AND vp.product_id IS NULL
        ORDER BY p.name ASC`,
        [vendorId]
      );

      return NextResponse.json({ 
        success: true, 
        products: availableProducts.map(product => ({
          ...product,
          is_active: Boolean(product.is_active),
          is_associated: Boolean(product.is_associated)
        }))
      });
    }

    // Default: Get vendor's associated products
    const [catalog] = await pool.execute<VendorCatalogRow[]>(
      `SELECT 
        vp.*,
        p.name,
        p.slug,
        p.short_description,
        p.base_price,
        p.is_active as product_is_active,
        c.name as category_name,
        b.name as brand_name
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN product_categories pc ON p.product_id = pc.product_id AND pc.is_primary = 1
      LEFT JOIN categories c ON pc.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE vp.vendor_id = ?
      ORDER BY vp.created_at DESC`,
      [vendorId]
    );

    return NextResponse.json({ 
      success: true, 
      catalog: catalog.map(item => ({
        ...item,
        is_active: Boolean(item.is_active),
        is_featured: Boolean(item.is_featured),
        product_is_active: Boolean(item.product_is_active)
      }))
    });

  } catch (error) {
    console.error('Error fetching vendor catalog:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor catalog' }, { status: 500 });
  }
}

// POST: Associate a product with vendor (add to catalog)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, vendor_sku, vendor_price, quantity_available, minimum_order_qty, lead_time_days, vendor_description, vendor_notes } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Check if product exists and is active
    const [productCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE product_id = ? AND is_active = 1',
      [product_id]
    );

    if (productCheck.length === 0) {
      return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
    }

    // Check if association already exists
    const [existingAssociation] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_product_id FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
      [vendorId, product_id]
    );

    if (existingAssociation.length > 0) {
      return NextResponse.json({ error: 'Product already associated with vendor' }, { status: 409 });
    }

    // Create association
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO vendor_products (
        vendor_id, product_id, vendor_sku, vendor_price, quantity_available,
        minimum_order_qty, lead_time_days, is_active, is_featured,
        vendor_description, vendor_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [
        vendorId,
        product_id,
        vendor_sku || null,
        vendor_price || null,
        quantity_available || 0,
        minimum_order_qty || 1,
        lead_time_days || 0,
        vendor_description || null,
        vendor_notes || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Product added to catalog successfully',
      vendor_product_id: result.insertId 
    });

  } catch (error) {
    console.error('Error adding product to catalog:', error);
    return NextResponse.json({ error: 'Failed to add product to catalog' }, { status: 500 });
  }
}

// PUT: Update vendor product association
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vendor_product_id, vendor_sku, vendor_price, quantity_available, minimum_order_qty, lead_time_days, is_active, is_featured, vendor_description, vendor_notes } = body;

    if (!vendor_product_id) {
      return NextResponse.json({ error: 'Vendor product ID is required' }, { status: 400 });
    }

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Update association
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE vendor_products SET 
        vendor_sku = ?,
        vendor_price = ?,
        quantity_available = ?,
        minimum_order_qty = ?,
        lead_time_days = ?,
        is_active = ?,
        is_featured = ?,
        vendor_description = ?,
        vendor_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE vendor_product_id = ? AND vendor_id = ?`,
      [
        vendor_sku || null,
        vendor_price || null,
        quantity_available || 0,
        minimum_order_qty || 1,
        lead_time_days || 0,
        is_active ? 1 : 0,
        is_featured ? 1 : 0,
        vendor_description || null,
        vendor_notes || null,
        vendor_product_id,
        vendorId
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Vendor product not found or not owned by vendor' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully' 
    });

  } catch (error) {
    console.error('Error updating vendor product:', error);
    return NextResponse.json({ error: 'Failed to update vendor product' }, { status: 500 });
  }
}

// DELETE: Remove product association from vendor catalog
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendor_product_id } = await req.json();

    if (!vendor_product_id) {
      return NextResponse.json({ error: 'Vendor product ID is required' }, { status: 400 });
    }

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Remove association
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM vendor_products WHERE vendor_product_id = ? AND vendor_id = ?',
      [vendor_product_id, vendorId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Vendor product not found or not owned by vendor' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product removed from catalog successfully' 
    });

  } catch (error) {
    console.error('Error removing product from catalog:', error);
    return NextResponse.json({ error: 'Failed to remove product from catalog' }, { status: 500 });
  }
}