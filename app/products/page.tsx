import { Metadata } from "next";
import ProductFilters from "@/components/ProductFilters";
import ProductGrid from "@/components/ProductGrid";
import ProductSortHeader from "@/components/ProductSortHeader";

// Enable dynamic rendering for API fetching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Shop Custom Window Treatments | Smart Blinds Hub",
  description: "Browse our wide selection of custom blinds, shades, and shutters. Find the perfect window treatment for your home.",
};

// Function to parse category ID from URL
const getCategoryIdFromParam = (categoryParam: string | undefined): number | null => {
  if (!categoryParam) return null;
  try {
    return parseInt(categoryParam, 10);
  } catch (e) {
    console.error("Invalid category ID:", e);
    return null;
  }
};

// Function to parse price from URL
const getPriceFromParam = (priceParam: string | undefined): number | null => {
  if (!priceParam) return null;
  try {
    return parseFloat(priceParam);
  } catch (e) {
    console.error("Invalid price:", e);
    return null;
  }
};

// Main page component
export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams as required in Next.js 15
  const params = await searchParams;
  
  // Extract query parameters - handle potential arrays by taking the first value
  const categoryParam = typeof params.category === 'string' ? params.category : undefined;
  const minPriceParam = typeof params.minPrice === 'string' ? params.minPrice : undefined;
  const maxPriceParam = typeof params.maxPrice === 'string' ? params.maxPrice : undefined;
  const sortParam = typeof params.sort === 'string' ? params.sort : "recommended";
  const sortByParam = typeof params.sortBy === 'string' ? params.sortBy : "rating";
  const sortOrderParam = typeof params.sortOrder === 'string' ? params.sortOrder : "desc";
  const searchParam = typeof params.search === 'string' ? params.search : undefined;

  // Parse the feature IDs if present
  const featureIds: number[] = [];
  if (typeof params.features === 'string' && params.features) {
    try {
      params.features.split(',').forEach(id => {
        featureIds.push(parseInt(id, 10));
      });
    } catch (error) {
      console.error("Error parsing feature IDs:", error);
    }
  }

  // Parse numeric parameters
  const categoryId = getCategoryIdFromParam(categoryParam);
  const minPrice = getPriceFromParam(minPriceParam);
  const maxPrice = getPriceFromParam(maxPriceParam);

  // Fetch data from API
  let categories = [];
  let products = [];
  let features = [];

  try {
    // Build centralized API URL with query parameters
    const apiUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/products`);
    
    if (categoryId) apiUrl.searchParams.set('category', categoryId.toString());
    if (minPrice !== null) apiUrl.searchParams.set('minPrice', minPrice.toString());
    if (maxPrice !== null) apiUrl.searchParams.set('maxPrice', maxPrice.toString());
    if (sortByParam) apiUrl.searchParams.set('sortBy', sortByParam);
    if (sortOrderParam) apiUrl.searchParams.set('sortOrder', sortOrderParam);
    if (searchParam) apiUrl.searchParams.set('search', searchParam);
    if (featureIds.length > 0) apiUrl.searchParams.set('features', featureIds.join(','));

    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        categories = data.data.categories || [];
        products = data.data.products || [];
        features = data.data.features || [];
      }
    } else {
      console.error("Centralized API request failed:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error fetching data from centralized API:", error);
    categories = [];
    products = [];
    features = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Shop Custom Window Treatments</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover our premium collection of blinds, shades, and window treatments crafted for your home</p>
        </div>

      {/* Filters and products section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-1">
          <ProductFilters
            categories={categories}
            features={features}
            defaultCategoryId={categoryId}
            initialMinPrice={minPrice}
            initialMaxPrice={maxPrice}
            initialSort={sortParam}
            initialFeatures={featureIds}
            productCount={products.length}
          />
        </div>

        {/* Products section with sorting header */}
        <div className="md:col-span-3">
          <ProductSortHeader
            productCount={products.length}
            initialSort={sortParam}
          />
          <ProductGrid products={products} />
        </div>
        </div>
      </div>
    </div>
  );
}
