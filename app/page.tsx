import HomeClient from './components/home/HomeClient';
import { productService, categoryService, contentService } from '@/lib/services/singletons';

// Caching disabled temporarily for testing
export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getHomePageData() {
  try {
    // Use singleton service instances to prevent connection pool exhaustion
    
    // Fetch all data in parallel
    const [categoriesResult, productsResult, heroBannersResult, roomsResult, reviewsResult] = await Promise.all([
      categoryService.getCategories({ isFeatured: true }),
      productService.getProducts({ 
        isFeatured: true, 
        isActive: true,
        vendorOnly: true,
        limit: 15,
        offset: 0,
        sortBy: 'name',
        sortOrder: 'ASC'
      }),
      contentService.getHeroBanners(),
      contentService.getRooms(),
      contentService.getReviews(10)
    ]);

    return {
      categories: categoriesResult || [],
      products: productsResult?.products || [],
      reviews: reviewsResult?.reviews || [],
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