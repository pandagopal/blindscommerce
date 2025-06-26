import HomeClient from './components/home/HomeClient';

async function getHomePageData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    
    // Fetch all data using internal API calls
    const [categoriesRes, productsRes, heroBannersRes, roomsRes] = await Promise.all([
      fetch(`${baseUrl}/v2/commerce/categories?featured=true&limit=8`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/v2/commerce/products?featured=true&limit=12`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/v2/content/hero-banners`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/v2/content/rooms`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    const [categoriesData, productsData, heroBannersData, roomsData] = await Promise.all([
      categoriesRes.json(),
      productsRes.json(),
      heroBannersRes.json(),
      roomsRes.json()
    ]);

    return {
      categories: categoriesData.data?.categories || [],
      products: productsData.data?.products || [],
      reviews: [],
      heroBanners: heroBannersData.data?.banners || [],
      rooms: roomsData.data?.rooms || []
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