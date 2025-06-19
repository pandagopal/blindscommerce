import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    
    // Fetch featured categories
    const [categoryRows] = await pool.execute(
      `SELECT 
        category_id as id, 
        name, 
        slug, 
        image_url as image, 
        description 
      FROM categories 
      WHERE featured = 1 
      ORDER BY display_order ASC`
    );
    
    // Fetch featured products
    const [productRows] = await pool.execute(
      `SELECT 
        p.product_id, 
        p.name, 
        p.slug, 
        c.name as category_name, 
        p.base_price, 
        COALESCE(AVG(pr.rating), 0) as rating,
        p.primary_image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
      WHERE p.featured = 1 AND p.status = 'active' AND p.is_active = 1
      GROUP BY p.product_id
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT 8`
    );

    // Fetch featured reviews for homepage
    const [reviewRows] = await pool.execute(
      `SELECT 
        pr.review_id as id,
        COALESCE(CONCAT(u.first_name, ' ', SUBSTRING(u.last_name, 1, 1), '.'), pr.guest_name, 'Anonymous') as author,
        pr.rating,
        pr.title,
        pr.review_text as text,
        DATE_FORMAT(pr.created_at, '%Y-%m-%d') as date
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.user_id
      WHERE pr.is_approved = 1 AND pr.rating >= 4
      ORDER BY pr.created_at DESC
      LIMIT 6`
    );
    
    return NextResponse.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}