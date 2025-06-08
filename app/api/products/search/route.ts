import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { productSearchSchema, apiRateLimiter } from '@/lib/security/validation';
import { z } from 'zod';

interface SearchFilters {
  query?: string;
  categories?: number[];
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  features?: number[];
  colors?: string[];
  materials?: string[];
  brands?: string[];
  rooms?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface ProductSearchResult extends RowDataPacket {
  product_id: number;
  name: string;
  slug: string;
  short_description: string;
  base_price: number;
  sale_price: number;
  rating: number;
  review_count: number;
  category_name: string;
  brand_name: string;
  primary_image: string;
  colors: string;
  materials: string;
  room_types: string;
  features: string;
  is_featured: number; // MySQL TINYINT(1) returns 0/1
  is_new: number; // MySQL TINYINT(1) returns 0/1
  is_on_sale: number; // MySQL TINYINT(1) returns 0/1
  search_relevance: number;
}

// GET /api/products/search - Enhanced product search
export async function GET(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limiting
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Validate and sanitize search parameters
    let validatedFilters;
    try {
      const searchData = {
        query: searchParams.get('q') || '',
        category: searchParams.get('categories')?.split(',')[0] || undefined,
        minPrice: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
        maxPrice: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: Math.min(parseInt(searchParams.get('limit') || '24'), 100)
      };
      
      validatedFilters = productSearchSchema.parse(searchData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid search parameters', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const filters: SearchFilters = {
      query: validatedFilters.query,
      categories: searchParams.get('categories')?.split(',').map(Number).filter(n => !isNaN(n) && n > 0) || [],
      priceMin: validatedFilters.minPrice,
      priceMax: validatedFilters.maxPrice,
      rating: searchParams.get('rating') ? Math.max(1, Math.min(5, parseInt(searchParams.get('rating')!))) : undefined,
      features: searchParams.get('features')?.split(',').map(Number).filter(n => !isNaN(n) && n > 0) || [],
      colors: searchParams.get('colors')?.split(',').filter(c => /^[a-zA-Z0-9\s]+$/.test(c)) || [],
      materials: searchParams.get('materials')?.split(',').filter(m => /^[a-zA-Z0-9\s]+$/.test(m)) || [],
      brands: searchParams.get('brands')?.split(',').filter(b => /^[a-zA-Z0-9\s]+$/.test(b)) || [],
      rooms: searchParams.get('rooms')?.split(',').filter(r => /^[a-zA-Z0-9\s]+$/.test(r)) || [],
      sortBy: ['price', 'rating', 'name', 'newest', 'popularity', 'relevance'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'relevance',
      sortOrder: ['asc', 'desc'].includes(searchParams.get('sortOrder') || '') ? searchParams.get('sortOrder')! : 'desc',
      page: validatedFilters.page || 1,
      limit: validatedFilters.limit || 24
    };

    const pool = await getPool();

    // Build the search query
    let baseQuery = `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.slug,
        p.short_description,
        p.base_price,
        p.sale_price,
        p.rating,
        p.review_count,
        p.is_featured,
        p.is_new,
        p.is_on_sale,
        GROUP_CONCAT(DISTINCT c.name) as category_name,
        b.name as brand_name,
        (
          SELECT image_url
          FROM product_images
          WHERE product_id = p.product_id AND is_primary = TRUE
          LIMIT 1
        ) as primary_image,
        GROUP_CONCAT(DISTINCT pcolors.color_name) as colors,
        GROUP_CONCAT(DISTINCT pm.material_name) as materials,
        GROUP_CONCAT(DISTINCT pr.room_type) as room_types,
        GROUP_CONCAT(DISTINCT pf.feature_name) as features,
        ${filters.query ? buildRelevanceScore() : '0'} as search_relevance
      FROM products p
      LEFT JOIN product_categories prodcat ON p.product_id = prodcat.product_id
      LEFT JOIN categories c ON prodcat.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_colors pcolors ON p.product_id = pcolors.product_id
      LEFT JOIN product_materials pm ON p.product_id = pm.product_id
      LEFT JOIN product_rooms pr ON p.product_id = pr.product_id
      LEFT JOIN product_features pf ON p.product_id = pf.product_id
    `;

    const whereConditions: string[] = ['p.is_active = TRUE'];
    const queryParams: any[] = [];
    
    // Add relevance score parameters first (if search query exists)
    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      // Parameters for relevance score: name LIKE, description LIKE, category LIKE, brand LIKE, MATCH AGAINST
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, filters.query);
    }

    // Add search query condition
    if (filters.query) {
      whereConditions.push(`(
        MATCH(p.name, p.short_description, p.long_description) AGAINST(? IN NATURAL LANGUAGE MODE)
        OR p.name LIKE ?
        OR p.short_description LIKE ?
        OR c.name LIKE ?
        OR b.name LIKE ?
      )`);
      const searchTerm = `%${filters.query}%`;
      queryParams.push(filters.query, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add category filter
    if (filters.categories && filters.categories.length > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_categories pc_filter
        WHERE pc_filter.product_id = p.product_id 
        AND pc_filter.category_id IN (${filters.categories.map(() => '?').join(',')})
      )`);
      queryParams.push(...filters.categories);
    }

    // Add price range filter
    if (filters.priceMin !== undefined) {
      whereConditions.push('p.base_price >= ?');
      queryParams.push(filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      whereConditions.push('p.base_price <= ?');
      queryParams.push(filters.priceMax);
    }

    // Add rating filter
    if (filters.rating !== undefined) {
      whereConditions.push('p.rating >= ?');
      queryParams.push(filters.rating);
    }

    // Add feature filter
    if (filters.features && filters.features.length > 0) {
      whereConditions.push(`p.product_id IN (
        SELECT product_id FROM product_features 
        WHERE feature_id IN (${filters.features.map(() => '?').join(',')})
      )`);
      queryParams.push(...filters.features);
    }

    // Add color filter
    if (filters.colors && filters.colors.length > 0) {
      whereConditions.push(`p.product_id IN (
        SELECT product_id FROM product_colors 
        WHERE color_name IN (${filters.colors.map(() => '?').join(',')})
      )`);
      queryParams.push(...filters.colors);
    }

    // Add material filter
    if (filters.materials && filters.materials.length > 0) {
      whereConditions.push(`p.product_id IN (
        SELECT product_id FROM product_materials 
        WHERE material_name IN (${filters.materials.map(() => '?').join(',')})
      )`);
      queryParams.push(...filters.materials);
    }

    // Add brand filter
    if (filters.brands && filters.brands.length > 0) {
      whereConditions.push(`b.name IN (${filters.brands.map(() => '?').join(',')})`);
      queryParams.push(...filters.brands);
    }

    // Add room filter
    if (filters.rooms && filters.rooms.length > 0) {
      whereConditions.push(`p.product_id IN (
        SELECT product_id FROM product_rooms 
        WHERE room_type IN (${filters.rooms.map(() => '?').join(',')})
      )`);
      queryParams.push(...filters.rooms);
    }

    // Combine conditions
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add GROUP BY
    baseQuery += ' GROUP BY p.product_id';

    // Add sorting
    const sortClause = buildSortClause(filters.sortBy!, filters.sortOrder!);
    baseQuery += ` ORDER BY ${sortClause}`;

    // Add pagination
    const offset = (filters.page! - 1) * filters.limit!;
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(filters.limit, offset);

    // Execute search query
    const [searchResults] = await pool.execute<ProductSearchResult[]>(baseQuery, queryParams);

    // Get total count for pagination
    let countQuery = baseQuery.replace(
      /SELECT DISTINCT[\s\S]*?FROM/,
      'SELECT COUNT(DISTINCT p.product_id) as total FROM'
    );
    countQuery = countQuery.replace(/GROUP BY[\s\S]*?ORDER BY[\s\S]*?LIMIT[\s\S]*$/, '');

    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
    const totalResults = countResult[0]?.total || 0;

    // Get search facets for filtering
    const facets = await getSearchFacets(filters, pool);

    // Format results
    const formattedResults = searchResults.map(product => ({
      id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.short_description,
      basePrice: product.base_price,
      salePrice: product.sale_price,
      rating: product.rating,
      reviewCount: product.review_count,
      categoryName: product.category_name,
      brandName: product.brand_name,
      primaryImage: product.primary_image,
      colors: product.colors ? product.colors.split(',') : [],
      materials: product.materials ? product.materials.split(',') : [],
      roomTypes: product.room_types ? product.room_types.split(',') : [],
      features: product.features ? product.features.split(',') : [],
      isFeatured: Boolean(product.is_featured), // Convert 0/1 to false/true
      isNew: Boolean(product.is_new), // Convert 0/1 to false/true
      isOnSale: Boolean(product.is_on_sale), // Convert 0/1 to false/true
      relevanceScore: product.search_relevance
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(totalResults / filters.limit!),
        totalResults,
        limit: filters.limit
      },
      facets,
      appliedFilters: filters
    });

  } catch (error) {
    console.error('Error in product search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Helper function to build relevance score (SQL safe - no user input injection)
function buildRelevanceScore(): string {
  return `(
    CASE 
      WHEN p.name LIKE ? THEN 100
      WHEN p.short_description LIKE ? THEN 80
      WHEN EXISTS (SELECT 1 FROM product_categories pc_rel JOIN categories c_rel ON pc_rel.category_id = c_rel.category_id WHERE pc_rel.product_id = p.product_id AND c_rel.name LIKE ?) THEN 60
      WHEN b.name LIKE ? THEN 40
      WHEN MATCH(p.name, p.short_description) AGAINST(? IN NATURAL LANGUAGE MODE) THEN 90
      ELSE 0
    END
  )`;
}

// Helper function to build sort clause
function buildSortClause(sortBy: string, sortOrder: string): string {
  const validOrders = ['asc', 'desc'];
  const order = validOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';

  switch (sortBy) {
    case 'price':
      return `p.base_price ${order}`;
    case 'rating':
      return `p.rating ${order}, p.review_count ${order}`;
    case 'name':
      return `p.name ${order}`;
    case 'newest':
      return `p.created_at ${order}`;
    case 'popularity':
      return `p.review_count ${order}, p.rating ${order}`;
    case 'relevance':
    default:
      return `search_relevance ${order}, p.rating DESC, p.review_count DESC`;
  }
}

// Helper function to get search facets
async function getSearchFacets(filters: SearchFilters, pool: any) {
  try {
    // Get available categories with counts
    const [categories] = await pool.execute<RowDataPacket[]>(`
      SELECT c.category_id, c.name, COUNT(DISTINCT p.product_id) as count
      FROM categories c
      LEFT JOIN product_categories pc ON c.category_id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.product_id AND p.is_active = TRUE
      GROUP BY c.category_id, c.name
      HAVING count > 0
      ORDER BY c.name
    `);

    // Get available brands with counts
    const [brands] = await pool.execute<RowDataPacket[]>(`
      SELECT b.brand_id, b.name, COUNT(p.product_id) as count
      FROM brands b
      LEFT JOIN products p ON b.brand_id = p.brand_id AND p.is_active = TRUE
      GROUP BY b.brand_id, b.name
      HAVING count > 0
      ORDER BY b.name
    `);

    // Get price ranges
    const [priceRanges] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        AVG(base_price) as avg_price
      FROM products
      WHERE is_active = TRUE
    `);

    // Get available colors
    const [colors] = await pool.execute<RowDataPacket[]>(`
      SELECT DISTINCT color_name, COUNT(*) as count
      FROM product_colors pc
      JOIN products p ON pc.product_id = p.product_id
      WHERE p.is_active = TRUE
      GROUP BY color_name
      ORDER BY count DESC, color_name
    `);

    // Get available materials
    const [materials] = await pool.execute<RowDataPacket[]>(`
      SELECT DISTINCT material_name, COUNT(*) as count
      FROM product_materials pm
      JOIN products p ON pm.product_id = p.product_id
      WHERE p.is_active = TRUE
      GROUP BY material_name
      ORDER BY count DESC, material_name
    `);

    // Get available features
    const [features] = await pool.execute<RowDataPacket[]>(`
      SELECT f.feature_id, f.name, f.description, COUNT(pf.product_id) as count
      FROM features f
      LEFT JOIN product_features pf ON f.feature_id = pf.feature_id
      LEFT JOIN products p ON pf.product_id = p.product_id AND p.is_active = TRUE
      GROUP BY f.feature_id, f.name, f.description
      HAVING count > 0
      ORDER BY count DESC, f.name
    `);

    return {
      categories: categories.map(cat => ({
        id: cat.category_id,
        name: cat.name,
        count: cat.count
      })),
      brands: brands.map(brand => ({
        id: brand.brand_id,
        name: brand.name,
        count: brand.count
      })),
      priceRange: priceRanges[0] || { min_price: 0, max_price: 1000, avg_price: 200 },
      colors: colors.map(color => ({
        name: color.color_name,
        count: color.count
      })),
      materials: materials.map(material => ({
        name: material.material_name,
        count: material.count
      })),
      features: features.map(feature => ({
        id: feature.feature_id,
        name: feature.name,
        description: feature.description,
        count: feature.count
      }))
    };
  } catch (error) {
    console.error('Error getting search facets:', error);
    return {
      categories: [],
      brands: [],
      priceRange: { min_price: 0, max_price: 1000, avg_price: 200 },
      colors: [],
      materials: [],
      features: []
    };
  }
}