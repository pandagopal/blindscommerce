import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const categoryParam = searchParams.get('category');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const sortByParam = searchParams.get('sortBy') || 'rating';
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';
    const searchParam = searchParams.get('search');
    const roomParam = searchParams.get('room');
    const pageParam = searchParams.get('page') || '1';
    
    // Parse numeric parameters
    const categoryId = categoryParam ? parseInt(categoryParam, 10) : null;
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;
    const page = parseInt(pageParam, 10);
    const itemsPerPage = 24;
    const offset = (page - 1) * itemsPerPage;

    const pool = await getPool();
    
    // Fetch categories
    const [categoryRows] = await pool.execute(
      `SELECT 
        category_id as id, 
        name, 
        slug, 
        description,
        image_url as image
      FROM categories 
      ORDER BY display_order ASC, name ASC`
    );

    // Build product query with filters (no parameters)
    let productQuery = `
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.short_description as description,
        p.base_price,
        p.primary_image_url as image,
        c.name as category_name,
        COALESCE(AVG(pr.rating), 0) as rating,
        COUNT(DISTINCT pr.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
      WHERE p.status = 'active' AND p.is_active = 1
    `;
    
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.status = 'active' AND p.is_active = 1
    `;
    
    // Add category filter
    if (categoryId && !isNaN(categoryId)) {
      productQuery += ` AND p.category_id = ${categoryId}`;
      countQuery += ` AND p.category_id = ${categoryId}`;
    }
    
    // Add price filters
    if (minPrice !== null && !isNaN(minPrice)) {
      productQuery += ` AND p.base_price >= ${minPrice}`;
      countQuery += ` AND p.base_price >= ${minPrice}`;
    }
    
    if (maxPrice !== null && !isNaN(maxPrice)) {
      productQuery += ` AND p.base_price <= ${maxPrice}`;
      countQuery += ` AND p.base_price <= ${maxPrice}`;
    }
    
    // Add search filter (with proper escaping)
    if (searchParam) {
      const escapedSearch = searchParam.replace(/'/g, "''");
      productQuery += ` AND (p.name LIKE '%${escapedSearch}%' OR p.short_description LIKE '%${escapedSearch}%')`;
      countQuery += ` AND (p.name LIKE '%${escapedSearch}%' OR p.short_description LIKE '%${escapedSearch}%')`;
    }
    
    // Get total count for pagination
    const [countRows] = await pool.execute(countQuery);
    const totalItems = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Group by product for main query
    productQuery += ` GROUP BY p.product_id`;
    
    // Add sorting
    if (sortByParam === 'price') {
      productQuery += ` ORDER BY p.base_price ${sortOrderParam}`;
    } else if (sortByParam === 'name') {
      productQuery += ` ORDER BY p.name ${sortOrderParam}`;
    } else if (sortByParam === 'newest') {
      productQuery += ` ORDER BY p.created_at DESC`;
    } else {
      // Default to rating
      productQuery += ` ORDER BY rating DESC, review_count DESC`;
    }
    
    // Add pagination
    productQuery += ` LIMIT ${itemsPerPage} OFFSET ${offset}`;
    
    const [productRows] = await pool.execute(productQuery);

    // Fetch product features
    const [featureRows] = await pool.execute(
      `SELECT 
        feature_id as id,
        name,
        description,
        icon,
        category
      FROM features
      WHERE is_active = 1
      ORDER BY display_order ASC, name ASC`
    );

    return NextResponse.json({
      success: true,
      data: {
        categories: Array.isArray(categoryRows) ? categoryRows : [],
        products: Array.isArray(productRows) ? productRows : [],
        features: Array.isArray(featureRows) ? featureRows : [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products data',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}