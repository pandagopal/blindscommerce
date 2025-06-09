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
  // Simplified version - return general recommendations for now
  return await getGeneralRecommendations();
}

async function getRoomBasedRecommendations(
  roomType: string, 
  style: string, 
  budget: number
): Promise<ProductRecommendation[]> {
  // Simplified version - return general recommendations for now
  return await getGeneralRecommendations();
}

async function getSimilarProducts(productId: number): Promise<ProductRecommendation[]> {
  // Simplified version - return general recommendations for now
  return await getGeneralRecommendations();
}

async function getTrendingProducts(): Promise<ProductRecommendation[]> {
  // Simplified version - return general recommendations for now
  return await getGeneralRecommendations();
}

async function getAIVisualRecommendations(
  roomImage: string, 
  roomType: string
): Promise<ProductRecommendation[]> {
  // Simplified version - return general recommendations for now
  return await getGeneralRecommendations();
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