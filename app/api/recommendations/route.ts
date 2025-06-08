import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  // Get user's purchase history and preferences
  const userBehavior = await db.query(`
    SELECT DISTINCT p.*, pi.image_url,
           COUNT(o.order_id) as purchase_frequency,
           AVG(pr.rating) as avg_user_rating
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.user_id = ?
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.user_id = ?
    WHERE p.is_active = 1
    GROUP BY p.product_id
    ORDER BY purchase_frequency DESC, p.rating DESC
    LIMIT 20
  `, [userId, userId]);

  // Get user's recently viewed products for style analysis
  const recentlyViewed = await db.query(`
    SELECT p.*, rv.viewed_at
    FROM recently_viewed rv
    JOIN products p ON rv.product_id = p.product_id
    WHERE rv.user_id = ?
    ORDER BY rv.viewed_at DESC
    LIMIT 10
  `, [userId]);

  // Calculate personalization scores
  return userBehavior.map((product: any) => ({
    ...product,
    score: calculatePersonalizationScore(product, recentlyViewed),
    reason: 'Based on your purchase history and preferences'
  }));
}

async function getRoomBasedRecommendations(
  roomType: string, 
  style: string, 
  budget: number
): Promise<ProductRecommendation[]> {
  const budgetRange = getBudgetRange(budget);
  
  const products = await db.query(`
    SELECT p.*, pi.image_url, pr.room_type_id,
           (CASE 
             WHEN pr.room_type_id = (SELECT room_type_id FROM room_types WHERE name = ?) THEN 20
             ELSE 0
           END) as room_match_score,
           (CASE 
             WHEN p.base_price BETWEEN ? AND ? THEN 15
             WHEN p.base_price < ? THEN 10
             ELSE 5
           END) as budget_score,
           p.rating * 2 as rating_score
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    LEFT JOIN product_rooms pr ON p.product_id = pr.product_id
    WHERE p.is_active = 1 
    AND p.base_price <= ?
    ORDER BY (room_match_score + budget_score + rating_score) DESC
    LIMIT 15
  `, [roomType, budgetRange.min, budgetRange.max, budgetRange.max * 1.2, budget * 1.5]);

  return products.map((product: any) => ({
    ...product,
    score: product.room_match_score + product.budget_score + product.rating_score,
    reason: `Perfect for ${roomType} rooms within your budget`
  }));
}

async function getSimilarProducts(productId: number): Promise<ProductRecommendation[]> {
  // Get the current product details
  const currentProduct = await db.query(`
    SELECT p.*, pc.category_id
    FROM products p
    JOIN product_categories pc ON p.product_id = pc.product_id
    WHERE p.product_id = ?
  `, [productId]);

  if (!currentProduct.length) return [];

  const product = currentProduct[0];

  // Find similar products based on category, price range, and features
  const similarProducts = await db.query(`
    SELECT DISTINCT p.*, pi.image_url,
           (CASE 
             WHEN pc.category_id = ? THEN 25
             ELSE 0
           END) as category_score,
           (CASE 
             WHEN ABS(p.base_price - ?) / ? < 0.3 THEN 20
             WHEN ABS(p.base_price - ?) / ? < 0.5 THEN 15
             ELSE 10
           END) as price_score,
           p.rating * 3 as rating_score
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    JOIN product_categories pc ON p.product_id = pc.product_id
    WHERE p.product_id != ? 
    AND p.is_active = 1
    ORDER BY (category_score + price_score + rating_score) DESC
    LIMIT 12
  `, [
    product.category_id, 
    product.base_price, 
    product.base_price, 
    product.base_price, 
    product.base_price,
    productId
  ]);

  return similarProducts.map((prod: any) => ({
    ...prod,
    score: prod.category_score + prod.price_score + prod.rating_score,
    reason: 'Similar style and features'
  }));
}

async function getTrendingProducts(): Promise<ProductRecommendation[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trending = await db.query(`
    SELECT p.*, pi.image_url,
           COUNT(oi.product_id) as sales_count,
           COUNT(DISTINCT rv.user_id) as view_count,
           AVG(pr.rating) as recent_rating
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.created_at >= ?
    LEFT JOIN recently_viewed rv ON p.product_id = rv.product_id AND rv.viewed_at >= ?
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id AND pr.created_at >= ?
    WHERE p.is_active = 1
    GROUP BY p.product_id
    HAVING sales_count > 0 OR view_count > 5
    ORDER BY (sales_count * 3 + view_count + COALESCE(recent_rating, 0) * 2) DESC
    LIMIT 15
  `, [thirtyDaysAgo, thirtyDaysAgo, thirtyDaysAgo]);

  return trending.map((product: any) => ({
    ...product,
    score: (product.sales_count * 3) + product.view_count + (product.recent_rating || 0) * 2,
    reason: 'Trending this month'
  }));
}

async function getAIVisualRecommendations(
  roomImage: string, 
  roomType: string
): Promise<ProductRecommendation[]> {
  // Simulate AI visual analysis (in real implementation, you'd use ML services)
  // For now, we'll analyze based on room type and return curated recommendations
  
  const colorAnalysis = await analyzeRoomColors(roomImage);
  const styleAnalysis = await analyzeRoomStyle(roomImage);
  
  const products = await db.query(`
    SELECT p.*, pi.image_url, pc.color_id, pm.material_id
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
    LEFT JOIN product_colors pc ON p.product_id = pc.product_id
    LEFT JOIN product_materials pm ON p.product_id = pm.product_id
    WHERE p.is_active = 1
    AND (pc.color_id IN (${colorAnalysis.recommendedColors.join(',')}) 
         OR pm.material_id IN (${styleAnalysis.recommendedMaterials.join(',')}))
    ORDER BY p.rating DESC
    LIMIT 12
  `);

  return products.map((product: any) => ({
    ...product,
    score: calculateVisualScore(product, colorAnalysis, styleAnalysis),
    reason: 'AI-matched to your room style and colors'
  }));
}

async function getGeneralRecommendations(): Promise<ProductRecommendation[]> {
  const products = await db.query(`
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

  return products.map((product: any) => ({
    ...product,
    score: product.rating_score + product.featured_score + product.popularity_score,
    reason: 'Highly rated and popular'
  }));
}

// Helper functions
function calculatePersonalizationScore(product: any, recentlyViewed: any[]): number {
  let score = product.rating * 10;
  
  if (product.purchase_frequency > 0) score += 30;
  if (product.avg_user_rating) score += product.avg_user_rating * 5;
  
  // Boost score if similar to recently viewed products
  const similarViewed = recentlyViewed.filter(rv => 
    Math.abs(rv.base_price - product.base_price) / product.base_price < 0.4
  );
  score += similarViewed.length * 5;
  
  return score;
}

function getBudgetRange(budget: number) {
  return {
    min: budget * 0.7,
    max: budget * 1.3
  };
}

async function analyzeRoomColors(roomImage: string) {
  // Simulate color analysis - in production, use AI vision services
  return {
    dominantColors: ['neutral', 'warm', 'cool'],
    recommendedColors: [1, 2, 3, 4] // Color IDs from colors table
  };
}

async function analyzeRoomStyle(roomImage: string) {
  // Simulate style analysis - in production, use AI vision services
  return {
    detectedStyle: 'modern',
    recommendedMaterials: [1, 2, 3] // Material IDs from materials table
  };
}

function calculateVisualScore(product: any, colorAnalysis: any, styleAnalysis: any): number {
  let score = product.rating * 10;
  
  if (colorAnalysis.recommendedColors.includes(product.color_id)) {
    score += 20;
  }
  
  if (styleAnalysis.recommendedMaterials.includes(product.material_id)) {
    score += 15;
  }
  
  return score;
}

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