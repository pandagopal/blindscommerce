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
    const featuresParam = searchParams.get('features');
    const pageParam = searchParams.get('page') || '1';
    
    // Parse numeric parameters
    const categoryId = categoryParam ? parseInt(categoryParam, 10) : null;
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;
    const page = parseInt(pageParam, 10);
    const itemsPerPage = 24;
    const offset = (page - 1) * itemsPerPage;
    
    // Parse feature IDs
    const featureIds: number[] = [];
    if (featuresParam) {
      try {
        featuresParam.split(',').forEach(id => {
          const parsedId = parseInt(id, 10);
          if (!isNaN(parsedId)) {
            featureIds.push(parsedId);
          }
        });
      } catch (error) {
        console.error("Error parsing feature IDs:", error);
      }
    }

    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
      // Fetch categories
      const [categoryRows] = await connection.execute(
        `SELECT 
          category_id as id, 
          name, 
          slug, 
          description,
          image_url as image
        FROM categories 
        ORDER BY display_order ASC, name ASC`
      );

    // Build product query with filters
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
    
    const countQueryParams: any[] = [];
    const productQueryParams: any[] = [];
    
    // Add category filter
    if (categoryId && !isNaN(categoryId)) {
      productQuery += ` AND p.category_id = ?`;
      countQuery += ` AND p.category_id = ?`;
      countQueryParams.push(categoryId);
      productQueryParams.push(categoryId);
    }
    
    // Add price filters
    if (minPrice !== null && !isNaN(minPrice)) {
      productQuery += ` AND p.base_price >= ?`;
      countQuery += ` AND p.base_price >= ?`;
      countQueryParams.push(minPrice);
      productQueryParams.push(minPrice);
    }
    
    if (maxPrice !== null && !isNaN(maxPrice)) {
      productQuery += ` AND p.base_price <= ?`;
      countQuery += ` AND p.base_price <= ?`;
      countQueryParams.push(maxPrice);
      productQueryParams.push(maxPrice);
    }
    
    // Add search filter
    if (searchParam) {
      productQuery += ` AND (p.name LIKE ? OR p.short_description LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.short_description LIKE ?)`;
      countQueryParams.push(`%${searchParam}%`, `%${searchParam}%`);
      productQueryParams.push(`%${searchParam}%`, `%${searchParam}%`);
    }
    
      // Get total count for pagination
      const [countRows] = await connection.execute(countQuery, countQueryParams);
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
      productQuery += ` LIMIT ? OFFSET ?`;
      productQueryParams.push(itemsPerPage, offset);
    
      const [productRows] = await connection.execute(productQuery, productQueryParams);

      // Fetch product features
      const [featureRows] = await connection.execute(
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
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching products data:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch products data',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}