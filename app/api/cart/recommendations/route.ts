import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Get recommendations based on cart items
export async function POST(request: NextRequest) {
  try {
    const { product_ids } = await request.json();
    
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: []
      });
    }

    const pool = await getPool();

    // Get frequently bought together recommendations
    const [recommendations] = await pool.execute(`
      SELECT 
        pa.product_b_id as product_id,
        p.name,
        p.price,
        p.slug,
        p.stock_quantity,
        pi.image_url as image,
        pa.association_type,
        pa.association_strength as confidence,
        AVG(pr.rating) as avg_rating,
        COUNT(pr.review_id) as review_count
      FROM product_associations pa
      JOIN products p ON pa.product_b_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.status = 'approved'
      WHERE pa.product_a_id IN (${product_ids.map(() => '?').join(',')})
        AND pa.association_strength > 0.2
        AND p.status = 'active'
        AND p.stock_quantity > 0
        AND pa.product_b_id NOT IN (${product_ids.map(() => '?').join(',')})
      GROUP BY pa.product_b_id, p.name, p.price, p.slug, p.stock_quantity, 
               pi.image_url, pa.association_type, pa.association_strength
      ORDER BY pa.association_strength DESC, avg_rating DESC
      LIMIT 20
    `, [...product_ids, ...product_ids]);

    // Get category-based recommendations if we don't have enough associations
    let categoryRecommendations = [];
    if ((recommendations as any[]).length < 5) {
      const [catRecs] = await pool.execute(`
        SELECT DISTINCT
          p2.product_id,
          p2.name,
          p2.price,
          p2.slug,
          p2.stock_quantity,
          pi2.image_url as image,
          'category_match' as association_type,
          0.15 as confidence,
          AVG(pr.rating) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM products p1
        JOIN product_categories pc1 ON p1.product_id = pc1.product_id
        JOIN product_categories pc2 ON pc1.category_id = pc2.category_id
        JOIN products p2 ON pc2.product_id = p2.product_id
        LEFT JOIN product_images pi2 ON p2.product_id = pi2.product_id AND pi2.is_primary = 1
        LEFT JOIN product_reviews pr ON p2.product_id = pr.product_id AND pr.status = 'approved'
        WHERE p1.product_id IN (${product_ids.map(() => '?').join(',')})
          AND p2.product_id NOT IN (${product_ids.map(() => '?').join(',')})
          AND p2.status = 'active'
          AND p2.stock_quantity > 0
        GROUP BY p2.product_id, p2.name, p2.price, p2.slug, p2.stock_quantity, pi2.image_url
        ORDER BY avg_rating DESC, p2.created_at DESC
        LIMIT 10
      `, [...product_ids, ...product_ids]);
      
      categoryRecommendations = catRecs as any[];
    }

    // Combine and deduplicate recommendations
    const allRecommendations = [...(recommendations as any[]), ...categoryRecommendations];
    const uniqueRecommendations = allRecommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.product_id === rec.product_id)
    );

    // Format recommendations
    const formattedRecommendations = uniqueRecommendations.map(rec => ({
      product_id: rec.product_id,
      name: rec.name,
      price: parseFloat(rec.price),
      slug: rec.slug,
      image: rec.image,
      association_type: rec.association_type,
      confidence: parseFloat(rec.confidence),
      stock_quantity: rec.stock_quantity,
      avg_rating: rec.avg_rating ? parseFloat(rec.avg_rating).toFixed(1) : null,
      review_count: rec.review_count || 0
    }));

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations.slice(0, 10)
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// GET - Get trending and popular recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'trending';
    const limit = parseInt(searchParams.get('limit') || '10');

    const pool = await getPool();
    let query = '';
    let params: any[] = [];

    if (type === 'trending') {
      // Get trending products based on recent cart additions
      query = `
        SELECT 
          p.product_id,
          p.name,
          p.price,
          p.slug,
          p.stock_quantity,
          pi.image_url as image,
          COUNT(ca.analytics_id) as recent_adds,
          AVG(pr.rating) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        LEFT JOIN cart_analytics ca ON p.product_id = ca.product_id 
          AND ca.action_type = 'item_added' 
          AND ca.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.status = 'approved'
        WHERE p.status = 'active' AND p.stock_quantity > 0
        GROUP BY p.product_id, p.name, p.price, p.slug, p.stock_quantity, pi.image_url
        HAVING recent_adds > 0
        ORDER BY recent_adds DESC, avg_rating DESC
        LIMIT ?
      `;
      params = [limit];
    } else if (type === 'popular') {
      // Get popular products based on ratings and reviews
      query = `
        SELECT 
          p.product_id,
          p.name,
          p.price,
          p.slug,
          p.stock_quantity,
          pi.image_url as image,
          AVG(pr.rating) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.status = 'approved'
        WHERE p.status = 'active' AND p.stock_quantity > 0
        GROUP BY p.product_id, p.name, p.price, p.slug, p.stock_quantity, pi.image_url
        HAVING review_count >= 3 AND avg_rating >= 4.0
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT ?
      `;
      params = [limit];
    } else if (type === 'new') {
      // Get newest products
      query = `
        SELECT 
          p.product_id,
          p.name,
          p.price,
          p.slug,
          p.stock_quantity,
          pi.image_url as image,
          p.created_at,
          AVG(pr.rating) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.status = 'approved'
        WHERE p.status = 'active' AND p.stock_quantity > 0
          AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.product_id, p.name, p.price, p.slug, p.stock_quantity, pi.image_url, p.created_at
        ORDER BY p.created_at DESC
        LIMIT ?
      `;
      params = [limit];
    }

    const [results] = await pool.execute(query, params);

    const recommendations = (results as any[]).map(rec => ({
      product_id: rec.product_id,
      name: rec.name,
      price: parseFloat(rec.price),
      slug: rec.slug,
      image: rec.image,
      association_type: type,
      confidence: 0.5,
      stock_quantity: rec.stock_quantity,
      avg_rating: rec.avg_rating ? parseFloat(rec.avg_rating).toFixed(1) : null,
      review_count: rec.review_count || 0,
      recent_adds: rec.recent_adds || 0
    }));

    return NextResponse.json({
      success: true,
      recommendations,
      type
    });

  } catch (error) {
    console.error('General recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}