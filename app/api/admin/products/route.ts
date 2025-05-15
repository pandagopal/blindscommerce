import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const pool = await getPool();
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.short_description,
        p.base_price,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        vi.business_name as vendor_name,
        (
          SELECT COUNT(*) 
          FROM blinds.reviews pr 
          WHERE pr.product_id = p.product_id
        ) as review_count,
        (
          SELECT COALESCE(AVG(rating), 0) 
          FROM blinds.reviews pr 
          WHERE pr.product_id = p.product_id
        ) as average_rating
      FROM blinds.products p
      LEFT JOIN blinds.categories c ON p.category_id = c.category_id
      LEFT JOIN blinds.vendor_info vi ON p.vendor_id = vi.vendor_info_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.short_description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add sorting
    const validSortFields = ['name', 'base_price', 'created_at', 'updated_at', 'average_rating'];
    const validSortOrders = ['asc', 'desc'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    query += ` ORDER BY p.${finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM blinds.products p 
      WHERE 1=1 ${search ? 'AND (p.name ILIKE $1 OR p.short_description ILIKE $1)' : ''}
    `;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    return NextResponse.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      shortDescription,
      basePrice,
      categoryId,
      vendorInfoId,
      isActive = true
    } = body;

    // Validate required fields
    if (!name || !slug || !shortDescription || !basePrice || !categoryId || !vendorInfoId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO blinds.products (
        name,
        slug,
        short_description,
        base_price,
        category_id,
        vendor_id,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING product_id`,
      [name, slug, shortDescription, basePrice, categoryId, vendorInfoId, isActive]
    );

    return NextResponse.json({
      success: true,
      productId: result.rows[0].product_id
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 