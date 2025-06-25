import { Metadata } from "next";
import ProductFilters from "@/components/ProductFilters";
import ProductGrid from "@/components/ProductGrid";
import ProductSortHeader from "@/components/ProductSortHeader";

// Generate dynamic metadata based on search parameters
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  
  const categoryParam = typeof params.category === 'string' ? params.category : undefined;
  const roomParam = typeof params.room === 'string' ? params.room : undefined;
  const saleParam = typeof params.sale === 'string' ? params.sale : undefined;
  const searchParam = typeof params.search === 'string' ? params.search : undefined;
  
  // Category ID to name mapping for SEO
  const categoryNames: Record<string, string> = {
    '1': 'Venetian Blinds',
    '2': 'Vertical Blinds', 
    '3': 'Roller Blinds',
    '4': 'Roman Blinds',
    '5': 'Wooden Blinds',
    '6': 'Faux Wood Blinds',
    '7': 'Cellular Shades',
    '8': 'Roller Shades',
    '9': 'Solar Shades',
    '10': 'Woven Wood Shades',
    '11': 'Pleated Shades',
    '12': 'Plantation Shutters',
    '13': 'Vinyl Shutters',
    '14': 'Wood Shutters',
    '15': 'Composite Shutters',
    '22': 'Motorized Window Treatments'
  };
  
  let title = "Shop Custom Window Treatments | Smart Blinds Hub";
  let description = "Browse our wide selection of custom blinds, shades, and shutters. Find the perfect window treatment for your home.";
  
  if (roomParam) {
    const roomName = roomParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title = `${roomName} Window Treatments | Smart Blinds Hub`;
    description = `Perfect window treatments designed specifically for your ${roomName.toLowerCase()}. Custom blinds, shades, and shutters.`;
  } else if (categoryParam && categoryNames[categoryParam]) {
    const categoryName = categoryNames[categoryParam];
    title = `${categoryName} | Custom Window Treatments | Smart Blinds Hub`;
    description = `Shop premium ${categoryName.toLowerCase()} - custom made to fit your windows perfectly. Free shipping on orders over $100.`;
  } else if (saleParam === 'true') {
    title = "Sale - Up to 50% Off Window Treatments | Smart Blinds Hub";
    description = "Limited time offers on premium blinds, shades, and shutters. Save big on custom window treatments for your home.";
  } else if (searchParam) {
    title = `Search Results: "${searchParam}" | Smart Blinds Hub`;
    description = `Find window treatments matching "${searchParam}". Browse our selection of custom blinds, shades, and shutters.`;
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Smart Blinds Hub'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

// Caching disabled - manual refresh only from Admin dashboard

// Dynamic metadata will be generated in generateMetadata function

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
  const roomParam = typeof params.room === 'string' ? params.room : undefined;
  const minPriceParam = typeof params.minPrice === 'string' ? params.minPrice : undefined;
  const maxPriceParam = typeof params.maxPrice === 'string' ? params.maxPrice : undefined;
  const sortParam = typeof params.sort === 'string' ? params.sort : "recommended";
  const sortByParam = typeof params.sortBy === 'string' ? params.sortBy : "rating";
  const sortOrderParam = typeof params.sortOrder === 'string' ? params.sortOrder : "desc";
  const searchParam = typeof params.search === 'string' ? params.search : undefined;
  const saleParam = typeof params.sale === 'string' ? params.sale : undefined;
  const messageParam = typeof params.message === 'string' ? params.message : undefined;

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
  
  // Determine page context for dynamic content
  const pageContext = {
    isRoomFiltered: !!roomParam,
    isCategoryFiltered: !!categoryId,
    isSaleFiltered: saleParam === 'true',
    isSearchFiltered: !!searchParam,
    roomName: roomParam?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    categoryName: '', // Will be populated from API data
  };

  // Fetch data from API
  let categories = [];
  let products = [];
  let features = [];

  try {
    // Build centralized API URL with query parameters
    const apiUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/products`);
    
    if (categoryId) apiUrl.searchParams.set('category', categoryId.toString());
    if (roomParam) apiUrl.searchParams.set('room', roomParam);
    if (minPrice !== null) apiUrl.searchParams.set('minPrice', minPrice.toString());
    if (maxPrice !== null) apiUrl.searchParams.set('maxPrice', maxPrice.toString());
    if (sortByParam) apiUrl.searchParams.set('sortBy', sortByParam);
    if (sortOrderParam) apiUrl.searchParams.set('sortOrder', sortOrderParam);
    if (searchParam) apiUrl.searchParams.set('search', searchParam);
    if (saleParam) apiUrl.searchParams.set('sale', saleParam);
    if (featureIds.length > 0) apiUrl.searchParams.set('features', featureIds.join(','));

    const response = await fetch(apiUrl.toString()); // Manual cache refresh only

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        categories = data.data.categories || [];
        products = data.data.products || [];
        features = data.data.features || [];
        
        // Update page context with category name
        if (categoryId && categories.length > 0) {
          const selectedCategory = categories.find(cat => cat.id === categoryId);
          if (selectedCategory) {
            pageContext.categoryName = selectedCategory.name;
          }
        }
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
        {/* Dynamic Header Based on Filters */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {pageContext.isRoomFiltered 
              ? `${pageContext.roomName} Window Treatments`
              : pageContext.isCategoryFiltered 
              ? `${pageContext.categoryName} Collection`
              : pageContext.isSaleFiltered
              ? `Sale - Up to 50% Off Window Treatments`
              : pageContext.isSearchFiltered
              ? `Search Results: "${searchParam}"`
              : `Shop Custom Window Treatments`}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {pageContext.isRoomFiltered 
              ? `Perfect window treatments designed specifically for your ${pageContext.roomName?.toLowerCase()}`
              : pageContext.isCategoryFiltered 
              ? `Explore our premium ${pageContext.categoryName?.toLowerCase()} collection`
              : pageContext.isSaleFiltered
              ? `Limited time offers on premium blinds, shades, and shutters`
              : pageContext.isSearchFiltered
              ? `Found ${products.length} products matching your search`
              : `Discover our premium collection of blinds, shades, and window treatments crafted for your home`}
          </p>
          
          {/* Breadcrumb Navigation */}
          <div className="mt-4 text-sm text-gray-500">
            <span>Home</span>
            <span className="mx-2">›</span>
            <span>Products</span>
            {pageContext.isRoomFiltered && (
              <>
                <span className="mx-2">›</span>
                <span className="text-primary-red">{pageContext.roomName}</span>
              </>
            )}
            {pageContext.isCategoryFiltered && (
              <>
                <span className="mx-2">›</span>
                <span className="text-primary-red">{pageContext.categoryName}</span>
              </>
            )}
            {pageContext.isSaleFiltered && (
              <>
                <span className="mx-2">›</span>
                <span className="text-primary-red">Sale</span>
              </>
            )}
          </div>
        </div>

        {/* Message Alert */}
        {messageParam === 'category-not-found' && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  We couldn't find that specific category
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  {searchParam 
                    ? `We're showing results for "${searchParam}" instead. Browse all our products below or use the filters to find what you need.`
                    : "Browse all our window treatments below or use the filters to find exactly what you're looking for."}
                </p>
              </div>
            </div>
          </div>
        )}

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
            initialRoom={roomParam}
            initialSale={saleParam === 'true'}
            productCount={products.length}
            pageContext={pageContext}
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
