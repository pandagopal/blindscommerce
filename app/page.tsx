import HomeClient from './components/home/HomeClient';

async function getHomePageData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Fetch homepage data and hero banners in parallel
    const [homepageResponse, heroBannersResponse] = await Promise.all([
      fetch(`${baseUrl}/api/pages/homepage`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/hero-banners`, { cache: 'no-store' })
    ]);

    let homepageData = { categories: [], products: [], reviews: [] };
    let heroBanners = [];

    if (homepageResponse.ok) {
      const data = await homepageResponse.json();
      if (data.success) {
        homepageData = data.data;
      }
    } else {
      console.error("Homepage API request failed:", homepageResponse.status, homepageResponse.statusText);
    }

    if (heroBannersResponse.ok) {
      const data = await heroBannersResponse.json();
      heroBanners = data.banners || [];
    } else {
      console.error("Hero banners API request failed:", heroBannersResponse.status, heroBannersResponse.statusText);
    }

    return {
      ...homepageData,
      heroBanners
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      categories: [],
      products: [],
      reviews: [],
      heroBanners: []
    };
  }
}

export default async function Home() {
  const { categories, products, reviews, heroBanners } = await getHomePageData();
  return (
    <HomeClient categories={categories} products={products} reviews={reviews} heroBanners={heroBanners} />
  );
}