import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { homepageCache, CacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get cached data first
    const cacheKey = CacheKeys.homepage.data();
    const cachedData = homepageCache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const pool = await getPool();
    
    // Fetch categories and products in parallel to reduce connection time
    const [
      [categoryRows],
      [productRows]
    ] = await Promise.all([
      // Fetch categories
      pool.execute(
        `SELECT 
          category_id as id, 
          name, 
          slug, 
          COALESCE(image_url, '') as image, 
          COALESCE(description, '') as description 
        FROM categories 
        WHERE featured = 1 
        ORDER BY COALESCE(display_order, 0) ASC`
      ),
      
      // Fetch products
      pool.execute(
        `SELECT 
          p.product_id, 
          p.name, 
          p.slug, 
          COALESCE(c.name, '') as category_name, 
          COALESCE(p.base_price, 0) as base_price, 
          4.5 as rating,
          COALESCE(p.primary_image_url, '') as primary_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.is_active = 1
        ORDER BY p.created_at DESC
        LIMIT 8`
      )
    ]);
    
    // Fetch reviews (empty for now)
    const reviewRows = [];
    
    const responseData = {
      categories: Array.isArray(categoryRows) ? categoryRows.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        description: cat.description
      })) : [],
      products: Array.isArray(productRows) ? productRows.map((prod: any) => ({
        product_id: prod.product_id,
        name: prod.name,
        slug: prod.slug,
        category_name: prod.category_name,
        base_price: Number(prod.base_price),
        rating: Number(prod.rating),
        primary_image: prod.primary_image
      })) : [],
      reviews: Array.isArray(reviewRows) ? reviewRows.map((review: any) => ({
        id: review.id,
        author: review.author,
        rating: Number(review.rating),
        title: review.title,
        text: review.text,
        date: review.date
      })) : []
    };

    // Cache the response data
    homepageCache.set(cacheKey, responseData);
    
    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}