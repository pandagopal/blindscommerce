import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const pool = await getPool();
    connection = await pool.getConnection();

    // Build the base query
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.short_description,
        p.sku,
        p.base_price,
        p.stock_status,
        p.category_id,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
    `;

    const conditions = [];
    const values = [];

    // Add search condition
    if (search) {
      conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add category filter
    if (category) {
      conditions.push('p.category_id = ?');
      values.push(category);
    }

    // Add status filter
    if (status) {
      conditions.push('p.is_active = ?');
      values.push(status === 'active' ? 1 : 0);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add GROUP BY
    query += ' GROUP BY p.product_id';

    // Add sorting
    const validSortFields = ['name', 'base_price', 'stock_status', 'created_at', 'total_sold'];
    const validSortOrders = ['asc', 'desc'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    // Execute the query
    const [rows] = await connection.query(query, values);

    // Convert boolean fields for each product
    const products = (rows || []).map(product => ({
      ...product,
      is_active: Boolean(product.is_active)
    }));

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
    `;

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countRows] = await connection.query(countQuery, values.slice(0, -2));
    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      products,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: 'Failed to fetch products'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      price,
      stock_status = 'in_stock',
      category_id,
      is_active = true,
      images = [],
      variants = []
    } = body;

    const pool = await getPool();
    connection = await pool.getConnection();

    try {
      await connection.query('BEGIN');

      // Insert the product
      const [productResult] = await connection.query(
        `INSERT INTO products (
          name,
          short_description,
          sku,
          base_price,
          stock_status,
          category_id,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, description, sku, price, stock_status, category_id, is_active]
      );

      const productId = productResult.insertId;

      // Insert product images if provided
      if (images.length > 0) {
        const imageQuery = `
          INSERT INTO product_images (
            product_id,
            image_url,
            is_primary,
            created_at
          ) VALUES (?, ?, ?, NOW())
        `;

        for (const image of images) {
          await connection.query(imageQuery, [
            productId,
            image.url,
            image.isPrimary || false
          ]);
        }
      }

      // Insert product variants if provided
      if (variants.length > 0) {
        const variantQuery = `
          INSERT INTO product_variants (
            product_id,
            name,
            price_adjustment,
            stock,
            created_at
          ) VALUES (?, ?, ?, ?, NOW())
        `;

        for (const variant of variants) {
          await connection.query(variantQuery, [
            productId,
            variant.name,
            variant.priceAdjustment || 0,
            variant.stock || 0
          ]);
        }
      }

      await connection.query('COMMIT');

      return NextResponse.json({
        message: 'Product created successfully',
        product_id: productId
      });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 