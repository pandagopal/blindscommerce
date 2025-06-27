import HomeClient from './components/home/HomeClient';
import { ProductService, CategoryService, ContentService } from '@/lib/services';

// Caching disabled temporarily for testing
export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getHomePageData() {
  try {
    // Use direct service calls for server-side data fetching
    const productService = new ProductService();
    const categoryService = new CategoryService();
    const contentService = new ContentService();
    
    // Fetch all data in parallel
    const [categoriesResult, productsResult, heroBannersResult, roomsResult] = await Promise.all([
      categoryService.getCategories({ isFeatured: true, limit: 8 }),
      productService.getProducts({ 
        isFeatured: true, 
        isActive: true,
        limit: 12,
        offset: 0,
        sortBy: 'name',
        sortOrder: 'ASC'
      }),
      contentService.getHeroBanners(),
      contentService.getRooms()
    ]);

    return {
      categories: categoriesResult?.categories || [],
      products: productsResult?.products || [],
      reviews: [],
      heroBanners: heroBannersResult?.banners || [],
      rooms: roomsResult?.rooms || []
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