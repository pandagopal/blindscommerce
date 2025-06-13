import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorProduct extends RowDataPacket {
  product_id: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category_name: string;
  status: string;
  vendor_price: number;
  quantity_available: number;
  vendor_active: number;
  total_sales: number;
  avg_rating: number;
  created_at: Date;
  updated_at: Date;
}

// GET /api/vendor/products - Get vendor's products
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const pool = await getPool();

    // First, get the vendor_info_id for this user
    const [vendorInfo] = await pool.query<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Build dynamic query using vendor_products table - simplified version
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.full_description as description,
        p.base_price,
        COALESCE(c.name, 'Unknown') as category_name,
        p.status,
        vp.vendor_price,
        vp.quantity_available,
        vp.is_active as vendor_active,
        0 as total_sales,
        0 as avg_rating,
        p.created_at,
        p.updated_at
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE vp.vendor_id = ?
    `;

    const queryParams: any[] = [vendorId];

    // Add filters
    if (status) {
      query += ' AND p.status = ?';
      queryParams.push(status);
    }

    if (category) {
      query += ' AND c.slug = ?';
      queryParams.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.full_description LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    query += `
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure limit and offset are proper integers
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
    
    queryParams.push(safeLimit, safeOffset);

    // Try using query instead of execute to avoid prepared statement issues
    const [products] = await pool.query<VendorProduct[]>(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE vp.vendor_id = ?
    `;

    const countParams: any[] = [vendorId];

    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }

    if (category) {
      countQuery += ' AND c.slug = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.full_description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;

    // Format products for response to match component expectations
    const formattedProducts = products.map(product => ({
      id: product.product_id,
      product_id: product.product_id, // For edit links
      name: product.name,
      slug: product.slug,
      description: product.description,
      base_price: parseFloat(product.base_price.toString()),
      price: parseFloat(product.base_price.toString()),
      vendorPrice: parseFloat(product.vendor_price.toString()),
      category: product.category_name,
      status: product.status,
      quantityAvailable: product.quantity_available,
      is_active: Boolean(product.vendor_active), // Vendor's active status
      is_listing_enabled: Boolean(product.vendor_active), // Same as vendor active for now
      vendorActive: Boolean(product.vendor_active),
      totalSales: parseInt(product.total_sales.toString()) || 0,
      avgRating: parseFloat(product.avg_rating.toString()) || 0,
      created_at: product.created_at,
      createdAt: product.created_at,
      updated_at: product.updated_at,
      updatedAt: product.updated_at
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total: parseInt(total.toString()),
        limit,
        offset,
        hasMore: offset + limit < parseInt(total.toString())
      }
    });

  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/vendor/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      base_price,
      category_id,
      specifications,
      features,
      images
    } = body;

    // Validate required fields
    if (!name || !description || !base_price || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, base_price, category_id' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get vendor info
    const [vendorInfo] = await pool.query<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Insert product
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (
        name, slug, full_description, base_price, category_id,
        primary_image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [
        name,
        slug,
        description,
        base_price,
        category_id,
        images && images.length > 0 ? images[0] : null
      ]
    );

    const productId = result.insertId;

    // Create vendor_products relationship
    await pool.query(
      `INSERT INTO vendor_products (
        vendor_id, product_id, vendor_price, quantity_available, 
        vendor_description, is_active
      ) VALUES (?, ?, ?, ?, ?, 1)`,
      [
        vendorId,
        productId,
        base_price,
        0, // Initial quantity
        description
      ]
    );

    // Insert additional images if provided
    if (images && images.length > 1) {
      for (let i = 1; i < images.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
          [productId, images[i], i]
        );
      }
    }

    return NextResponse.json({
      success: true,
      product_id: productId,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}