import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

interface ProductRecommendation {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  rating: number;
  image_url?: string;
  score: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      roomType, 
      budget, 
      style, 
      currentProductId, 
      roomImage,
      recommendationType = 'general' 
    } = body;

    let recommendations: ProductRecommendation[] = [];

    switch (recommendationType) {
      case 'personalized':
        recommendations = await getPersonalizedRecommendations(userId);
        break;
      case 'room-based':
        recommendations = await getRoomBasedRecommendations(roomType, style, budget);
        break;
      case 'similar':
        recommendations = await getSimilarProducts(currentProductId);
        break;
      case 'trending':
        recommendations = await getTrendingProducts();
        break;
      case 'ai-visual':
        recommendations = await getAIVisualRecommendations(roomImage, roomType);
        break;
      default:
        recommendations = await getGeneralRecommendations();
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, 12), // Limit to 12 recommendations
      type: recommendationType
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

async function getPersonalizedRecommendations(userId: string): Promise<ProductRecommendation[]> {
  const pool = await getPool();
  
  // Get user's purchase history and preferences
  const [userProducts] = await pool.execute(`
    SELECT DISTINCT p.category_id, p.product_id
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.user_id = ? AND o.status = 'completed'
    ORDER BY o.created_at DESC
    LIMIT 10
  `, [userId]);

  // Get products from similar categories with high ratings
  const categoryIds = (userProducts as any[]).map(p => p.category_id).join(',') || '0';
  
  const [recommendations] = await pool.execute(`
    SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.base_price,
      COALESCE(AVG(pr.rating), 0) as avg_rating,
      p.primary_image_url,
      c.name as category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
    WHERE p.category_id IN (${categoryIds}) 
      AND p.status = 'active'
      AND p.product_id NOT IN (${(userProducts as any[]).map(p => p.product_id).join(',') || '0'})
    GROUP BY p.product_id
    HAVING avg_rating >= 4.0
    ORDER BY avg_rating DESC, p.created_at DESC
    LIMIT 6
  `);

  return recommendations as ProductRecommendation[];
}

async function getRoomBasedRecommendations(
  roomType: string, 
  style: string, 
  budget: number
): Promise<ProductRecommendation[]> {
  const pool = await getPool();
  
  const [recommendations] = await pool.execute(`
    SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.base_price,
      COALESCE(AVG(pr.rating), 0) as avg_rating,
      p.primary_image_url,
      c.name as category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
    LEFT JOIN product_room_types prt ON p.product_id = prt.product_id
    WHERE p.status = 'active'
      AND p.base_price <= ?
      AND (prt.room_type = ? OR prt.room_type IS NULL)
    GROUP BY p.product_id
    ORDER BY avg_rating DESC, p.featured DESC
    LIMIT 6
  `, [budget, roomType]);

  return recommendations as ProductRecommendation[];
}

async function getSimilarProducts(productId: number): Promise<ProductRecommendation[]> {
  const pool = await getPool();
  
  // Get the product's category
  const [productInfo] = await pool.execute(`
    SELECT category_id, base_price FROM products WHERE product_id = ?
  `, [productId]);

  if ((productInfo as any[]).length === 0) {
    return [];
  }

  const { category_id, base_price } = (productInfo as any[])[0];
  const priceRange = base_price * 0.3; // 30% price range

  const [recommendations] = await pool.execute(`
    SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.base_price,
      COALESCE(AVG(pr.rating), 0) as avg_rating,
      p.primary_image_url,
      c.name as category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
    WHERE p.category_id = ?
      AND p.product_id != ?
      AND p.status = 'active'
      AND p.base_price BETWEEN ? AND ?
    GROUP BY p.product_id
    ORDER BY avg_rating DESC
    LIMIT 6
  `, [category_id, productId, base_price - priceRange, base_price + priceRange]);

  return recommendations as ProductRecommendation[];
}

async function getTrendingProducts(): Promise<ProductRecommendation[]> {
  const pool = await getPool();
  
  const [recommendations] = await pool.execute(`
    SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.base_price,
      COALESCE(AVG(pr.rating), 0) as avg_rating,
      p.primary_image_url,
      c.name as category,
      COUNT(oi.product_id) as order_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id
    WHERE p.status = 'active'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY p.product_id
    ORDER BY order_count DESC, avg_rating DESC
    LIMIT 6
  `);

  return recommendations as ProductRecommendation[];
}

async function getAIVisualRecommendations(
  roomImage: string, 
  roomType: string
): Promise<ProductRecommendation[]> {
  // This would integrate with AI/ML services for visual analysis
  // For now, return room-based recommendations
  return await getRoomBasedRecommendations(roomType, 'modern', 1000);
}

async function getGeneralRecommendations(): Promise<ProductRecommendation[]> {
  const pool = await getPool();
  const [products] = await pool.execute(`
    SELECT p.*, pi.image_url,
           (p.rating * 20) as rating_score,
           (CASE WHEN p.is_featured = 1 THEN 15 ELSE 0 END) as featured_score,
           p.review_count as popularity_score
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    WHERE p.is_active = 1
    ORDER BY (rating_score + featured_score + popularity_score) DESC
    LIMIT 15
  `);

  return (products as any[]).map((product: any) => ({
    product_id: product.product_id,
    name: product.name,
    slug: product.slug,
    base_price: product.base_price,
    rating: product.rating,
    image_url: product.image_url,
    score: (product.rating_score || 0) + (product.featured_score || 0) + (product.popularity_score || 0),
    reason: 'Highly rated and popular'
  }));
}

// Helper functions - simplified for demo

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'general';
  const userId = searchParams.get('userId');
  const productId = searchParams.get('productId');
  
  let recommendations: ProductRecommendation[] = [];
  
  try {
    switch (type) {
      case 'trending':
        recommendations = await getTrendingProducts();
        break;
      case 'similar':
        if (productId) {
          recommendations = await getSimilarProducts(parseInt(productId));
        }
        break;
      case 'personalized':
        if (userId) {
          recommendations = await getPersonalizedRecommendations(userId);
        }
        break;
      default:
        recommendations = await getGeneralRecommendations();
    }
    
    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, 8),
      type
    });
    
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}