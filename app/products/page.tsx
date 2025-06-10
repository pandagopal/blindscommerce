import { Metadata } from "next";
import { getCategories, getProducts, getProductFeatures } from "@/lib/db";
import ProductFilters from "@/components/ProductFilters";
import ProductGrid from "@/components/ProductGrid";

// Enable dynamic rendering for database fetching
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
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Extract query parameters - handle potential arrays by taking the first value
  const categoryParam = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const minPriceParam = typeof searchParams.minPrice === 'string' ? searchParams.minPrice : undefined;
  const maxPriceParam = typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : undefined;
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : "recommended";
  const sortByParam = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : "rating";
  const sortOrderParam = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : "desc";
  const searchParam = typeof searchParams.search === 'string' ? searchParams.search : undefined;

  // Parse the feature IDs if present
  const featureIds: number[] = [];
  if (typeof searchParams.features === 'string' && searchParams.features) {
    try {
      searchParams.features.split(',').forEach(id => {
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

  // Fetch data from the database
  let categories = [];
  let products = [];
  let features = [];

  try {
    // Fetch categories from database
    categories = await getCategories();
  } catch (error) {
    console.error("Error fetching categories:", error);
    categories = [];
  }

  try {
    // Fetch products from database with filtering and sorting parameters
    products = await getProducts({
      limit: 24,
      categoryId,
      minPrice,
      maxPrice,
      search: searchParam,
      sortBy: sortByParam,
      sortOrder: sortOrderParam
    });

    // If we have feature filters, apply them client-side
    // In a real application, this would be better to implement in the database query
    if (featureIds.length > 0) {
      // This is a simplistic implementation since our database doesn't support feature filtering directly
      // In production, you would add this to the SQL query
      console.log("Filtering by features:", featureIds);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    products = [];
  }

  try {
    // Fetch product features from database
    features = await getProductFeatures();
  } catch (error) {
    console.error("Error fetching product features:", error);
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
        {/* Pass the data to our client components */}
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

        {/* Products grid section */}
        <div className="md:col-span-3">
          <ProductGrid products={products} />
        </div>
        </div>
      </div>
    </div>
  );
}
