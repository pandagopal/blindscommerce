import { Suspense } from 'react';
import HomeClient from './components/home/HomeClient';
import { productService, categoryService, contentService } from '@/lib/services/singletons';

// Enable ISR (Incremental Static Regeneration) with 5 minute revalidation
// This caches the page and revalidates every 5 minutes - preventing constant DB calls
export const revalidate = 300; // 5 minutes

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
    <Suspense fallback={<HomeLoadingFallback />}>
      <HomeClient categories={categories} products={products} reviews={reviews} heroBanners={heroBanners} rooms={rooms} />
    </Suspense>
  );
}

// Simple loading fallback for the home page
function HomeLoadingFallback() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="h-[500px] md:h-[600px] lg:h-[700px] bg-gray-200 animate-pulse" />
      {/* Trust bar skeleton */}
      <div className="h-12 bg-gray-100 animate-pulse" />
      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}