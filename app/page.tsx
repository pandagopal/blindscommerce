import HomeClient from './components/home/HomeClient';

async function getHomePageData() {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/homepage`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } else {
      console.error("Homepage API request failed:", response.status, response.statusText);
    }

    return {
      categories: [],
      products: [],
      reviews: []
    };
  } catch (error) {
    console.error('Error fetching homepage data from centralized API:', error);
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