import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SearchSuggestion {
  type: 'product' | 'category' | 'brand' | 'feature';
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
}

// GET /api/products/search/suggestions - Get search suggestions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    const pool = await getPool();
    const searchTerm = `%${query}%`;
    const suggestions: SearchSuggestion[] = [];

    // Search for products (top 3)
    const [products] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.base_price,
        GROUP_CONCAT(DISTINCT c.name) as category_name,
        (
          SELECT image_url
          FROM product_images
          WHERE product_id = p.product_id AND is_primary = TRUE
          LIMIT 1
        ) as primary_image
      FROM products p
      LEFT JOIN product_categories pc ON p.product_id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.category_id
      WHERE p.is_active = TRUE
        AND (p.name LIKE ? OR p.short_description LIKE ?)
      GROUP BY p.product_id, p.name, p.slug, p.base_price
      ORDER BY 
        CASE WHEN p.name LIKE ? THEN 1 ELSE 2 END,
        p.rating DESC,
        p.review_count DESC
      LIMIT 3
    `, [searchTerm, searchTerm, `${query}%`]);

    products.forEach(product => {
      suggestions.push({
        type: 'product',
        title: product.name,
        subtitle: `${product.category_name} • $${product.base_price}`,
        url: `/products/${product.slug}`,
        image: product.primary_image
      });
    });

    // Search for categories (top 2)
    const [categories] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.category_id,
        c.name,
        c.slug,
        COUNT(DISTINCT p.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.category_id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.product_id AND p.is_active = TRUE
      WHERE c.is_active = TRUE AND c.name LIKE ?
      GROUP BY c.category_id, c.name, c.slug
      HAVING product_count > 0
      ORDER BY 
        CASE WHEN c.name LIKE ? THEN 1 ELSE 2 END,
        product_count DESC
      LIMIT 2
    `, [searchTerm, `${query}%`]);

    categories.forEach(category => {
      suggestions.push({
        type: 'category',
        title: category.name,
        subtitle: `${category.product_count} products`,
        url: `/products?category=${category.category_id}`
      });
    });

    // Search for brands (top 2)
    const [brands] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        b.brand_id,
        b.name,
        COUNT(p.product_id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.brand_id = p.brand_id AND p.is_active = TRUE
      WHERE b.is_active = TRUE AND b.name LIKE ?
      GROUP BY b.brand_id, b.name
      HAVING product_count > 0
      ORDER BY 
        CASE WHEN b.name LIKE ? THEN 1 ELSE 2 END,
        product_count DESC
      LIMIT 2
    `, [searchTerm, `${query}%`]);

    brands.forEach(brand => {
      suggestions.push({
        type: 'brand',
        title: brand.name,
        subtitle: `${brand.product_count} products`,
        url: `/products?brands=${encodeURIComponent(brand.name)}`
      });
    });

    // Search for features (top 1)
    const [features] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        f.feature_id,
        f.name,
        f.description,
        COUNT(pf.product_id) as product_count
      FROM features f
      LEFT JOIN product_features pf ON f.feature_id = pf.feature_id
      LEFT JOIN products p ON pf.product_id = p.product_id AND p.is_active = TRUE
      WHERE f.is_active = TRUE AND f.name LIKE ?
      GROUP BY f.feature_id, f.name, f.description
      HAVING product_count > 0
      ORDER BY 
        CASE WHEN f.name LIKE ? THEN 1 ELSE 2 END,
        product_count DESC
      LIMIT 1
    `, [searchTerm, `${query}%`]);

    features.forEach(feature => {
      suggestions.push({
        type: 'feature',
        title: feature.name,
        subtitle: `${feature.product_count} products with this feature`,
        url: `/products?features=${feature.feature_id}`
      });
    });

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, limit);

    return NextResponse.json({
      success: true,
      suggestions: limitedSuggestions
    });

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

// POST /api/products/search/suggestions - Track search queries for analytics
export async function POST(req: NextRequest) {
  try {
    const { query, resultCount, clickedResult } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Store search analytics (optional - for improving search)
    await pool.execute(`
      INSERT INTO search_analytics (
        query,
        result_count,
        clicked_result,
        created_at
      ) VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        search_count = search_count + 1,
        last_searched = NOW()
    `, [query.toLowerCase(), resultCount || 0, clickedResult || null]);

    return NextResponse.json({
      success: true,
      message: 'Search tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking search:', error);
    return NextResponse.json(
      { error: 'Failed to track search' },
      { status: 500 }
    );
  }
}