import HomeClient from './components/home/HomeClient';
import { getPool } from '@/lib/db';

async function getHomePageData() {
  try {
    const pool = await getPool();
    
    // Fetch featured categories
    const [categoryRows] = await pool.query(
      `SELECT 
        category_id as id, 
        name, 
        slug, 
        image_url as image, 
        description 
      FROM categories 
      WHERE featured = 1 
      ORDER BY display_order ASC 
      LIMIT 6`
    );
    
    // Fetch featured products
    const [productRows] = await pool.query(
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
      WHERE p.featured = 1 AND p.status = 'active'
      GROUP BY p.product_id
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT 8`
    );

    // Fetch featured reviews for homepage
    const [reviewRows] = await pool.query(
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
    
    return {
      categories: categoryRows as any[],
      products: productRows as any[],
      reviews: reviewRows as any[]
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return {
      categories: [],
      products: [],
      reviews: []
    };
  }
}

export default async function Home() {
  const { categories, products, reviews } = await getHomePageData();
  return (
    <HomeClient categories={categories} products={products} reviews={reviews} />
  );
}