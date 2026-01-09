import { Metadata } from "next";
import { EnhancedProductsClient } from "@/components/products";

// Enable caching with 5 minute revalidation
export const revalidate = 300; // 5 minutes

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

  // Map sort parameters - validate and correct invalid values
  let sortByParam = typeof params.sortBy === 'string' ? params.sortBy : "rating";
  const sortOrderParam = typeof params.sortOrder === 'string' ? params.sortOrder : "desc";

  // Map legacy/invalid sortBy values to valid ones
  const sortByMapping: Record<string, string> = {
    'base_price': 'price',
    'product_id': 'created_at'
  };
  if (sortByMapping[sortByParam]) {
    sortByParam = sortByMapping[sortByParam];
  }

  // Validate sortBy is in allowed list
  const allowedSortColumns = ['name', 'price', 'rating', 'created_at'];
  if (!allowedSortColumns.includes(sortByParam)) {
    sortByParam = 'rating'; // Fallback to default
  }

  const searchParam = typeof params.search === 'string' ? params.search : undefined;
  const saleParam = typeof params.sale === 'string' ? params.sale : undefined;

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

  // Use singleton service instances to prevent connection pool exhaustion
  const { productService, categoryService } = await import('@/lib/services/singletons');

  let categories = [];
  let products = [];
  let features = [];
  let totalCount = 0;

  try {
    // Fetch data in parallel (caching happens at API level via cacheManager)
    const [categoriesResult, productsResult] = await Promise.all([
      categoryService.getCategories({}),
      productService.getProducts({
        categoryId: categoryId || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy: sortByParam as any,
        sortOrder: sortOrderParam.toUpperCase() as 'ASC' | 'DESC',
        search: searchParam,
        isActive: true,
        vendorOnly: true,
        limit: 50,
        offset: 0
      })
    ]);

    categories = categoriesResult || [];
    products = productsResult?.products || [];
    totalCount = productsResult?.total || products.length;

    // Features will be empty for now
    features = [];

    // Update page context with category name
    if (categoryId && categories.length > 0) {
      const selectedCategory = categories.find((cat: any) => cat.category_id === categoryId);
      if (selectedCategory) {
        pageContext.categoryName = selectedCategory.name;
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    categories = [];
    products = [];
    features = [];
  }

  return (
    <div className="min-h-screen bg-warm-gray-50">
      {/* Hero Header */}
      <div className="bg-primary-red text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="text-sm text-white/70 mb-4">
              <a href="/" className="hover:text-white">Home</a>
              <span className="mx-2">/</span>
              <span className="text-white">Products</span>
              {pageContext.isRoomFiltered && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-white">{pageContext.roomName}</span>
                </>
              )}
              {pageContext.isCategoryFiltered && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-white">{pageContext.categoryName}</span>
                </>
              )}
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {pageContext.isRoomFiltered
                ? `${pageContext.roomName} Window Treatments`
                : pageContext.isCategoryFiltered
                ? pageContext.categoryName
                : pageContext.isSaleFiltered
                ? "Sale Items"
                : pageContext.isSearchFiltered
                ? `Results for "${searchParam}"`
                : "Shop All Window Treatments"}
            </h1>

            {/* Subtitle */}
            <p className="text-white/80 text-lg">
              {pageContext.isRoomFiltered
                ? `Find the perfect blinds and shades for your ${pageContext.roomName?.toLowerCase()}`
                : pageContext.isCategoryFiltered
                ? `Premium quality ${pageContext.categoryName?.toLowerCase()} for every home`
                : pageContext.isSaleFiltered
                ? "Limited time offers - up to 50% off select items"
                : pageContext.isSearchFiltered
                ? `Found ${totalCount} products matching your search`
                : "Discover premium blinds, shades & shutters for your home"}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Products Section */}
      <EnhancedProductsClient
        initialProducts={products}
        categories={categories}
        features={features}
        totalCount={totalCount}
        initialCategoryId={categoryId}
        initialMinPrice={minPrice}
        initialMaxPrice={maxPrice}
        initialSort={sortParam}
        initialFeatures={featureIds}
        initialRoom={roomParam}
        initialSale={saleParam === 'true'}
        initialSearch={searchParam}
      />
    </div>
  );
}
