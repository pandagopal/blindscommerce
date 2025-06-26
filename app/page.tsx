import HomeClient from './components/home/HomeClient';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getHomePageData() {
  try {
    const pool = await getPool();
    
    // Fetch all data directly from database
    const [categoriesResult, productsResult, heroBannersResult, roomsResult] = await Promise.all([
      // Fetch featured categories
      pool.execute<RowDataPacket[]>(
        `SELECT 
          category_id,
          name,
          slug,
          description,
          image_url,
          display_order,
          featured
        FROM categories
        WHERE featured = 1
        ORDER BY display_order ASC, name ASC
        LIMIT 8`
      ),
      // Fetch featured products
      pool.execute<RowDataPacket[]>(
        `SELECT 
          p.product_id,
          p.name,
          p.slug,
          p.short_description as description,
          p.base_price,
          p.cost_price,
          p.is_featured,
          COALESCE(pi.image_url, p.primary_image_url) as image_url,
          c.name as category_name,
          c.slug as category_slug
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id AND pc.is_primary = 1
        LEFT JOIN categories c ON pc.category_id = c.category_id
        WHERE p.is_active = 1 AND p.is_featured = 1
        ORDER BY p.created_at DESC
        LIMIT 12`
      ),
      // Fetch hero banners
      pool.execute<RowDataPacket[]>(
        `SELECT 
          banner_id,
          title,
          subtitle,
          description,
          background_image as image_url,
          right_side_image,
          primary_cta_text as button_text,
          primary_cta_link as button_link,
          secondary_cta_text,
          secondary_cta_link,
          is_active,
          display_order,
          created_at,
          updated_at
        FROM hero_banners
        WHERE is_active = 1
        ORDER BY display_order ASC, created_at DESC`
      ),
      // Fetch rooms
      pool.execute<RowDataPacket[]>(
        `SELECT 
          room_type_id,
          name,
          description,
          image_url,
          typical_humidity,
          light_exposure,
          privacy_requirements,
          created_at,
          updated_at
        FROM room_types
        ORDER BY name ASC`
      )
    ]);

    const [categories] = categoriesResult;
    const [products] = productsResult;
    const [heroBanners] = heroBannersResult;
    const [rooms] = roomsResult;

    const homepageData = {
      categories: categories || [],
      products: products || [],
      reviews: [] // Placeholder - table might not exist
    };

    return {
      ...homepageData,
      heroBanners,
      rooms
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      categories: [],
      products: [],
      reviews: [],
      heroBanners: [],
      rooms: []
    };
  }
}

export default async function Home() {
  const { categories, products, reviews, heroBanners, rooms } = await getHomePageData();
  return (
    <HomeClient categories={categories} products={products} reviews={reviews} heroBanners={heroBanners} rooms={rooms} />
  );
}