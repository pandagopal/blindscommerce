import { Metadata } from "next";
import { getPool } from "@/lib/db";
import ProductFilters from "@/components/ProductFilters";
import ProductGrid from "@/components/ProductGrid";
import ProductSortHeader from "@/components/ProductSortHeader";

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

  // Fetch data from the database
  let categories = [];
  let products = [];
  let features = [];

  try {
    const pool = await getPool();
    
    // Fetch categories from database
    try {
      const [categoryRows] = await pool.query(
        `SELECT 
          category_id as id, 
          name, 
          slug, 
          description,
          image_url as image
        FROM categories 
        ORDER BY display_order ASC, name ASC`
      );
      categories = Array.isArray(categoryRows) ? categoryRows : [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      categories = [];
    }

    // Build product query with filters
    let productQuery = `
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.short_description as description,
        p.base_price,
        p.primary_image_url as image,
        c.name as category_name,
        COALESCE(AVG(pr.rating), 0) as rating,
        COUNT(DISTINCT pr.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
      WHERE p.status = 'active'
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter
    if (categoryId) {
      productQuery += ` AND p.category_id = ?`;
      queryParams.push(categoryId);
    }
    
    // Add price filters
    if (minPrice !== null) {
      productQuery += ` AND p.base_price >= ?`;
      queryParams.push(minPrice);
    }
    
    if (maxPrice !== null) {
      productQuery += ` AND p.base_price <= ?`;
      queryParams.push(maxPrice);
    }
    
    // Add search filter
    if (searchParam) {
      productQuery += ` AND (p.name LIKE ? OR p.short_description LIKE ?)`;
      queryParams.push(`%${searchParam}%`, `%${searchParam}%`);
    }
    
    // Group by product
    productQuery += ` GROUP BY p.product_id`;
    
    // Add sorting
    if (sortByParam === 'price') {
      productQuery += ` ORDER BY p.base_price ${sortOrderParam}`;
    } else if (sortByParam === 'name') {
      productQuery += ` ORDER BY p.name ${sortOrderParam}`;
    } else if (sortByParam === 'newest') {
      productQuery += ` ORDER BY p.created_at DESC`;
    } else {
      // Default to rating
      productQuery += ` ORDER BY rating DESC, review_count DESC`;
    }
    
    // Add limit
    productQuery += ` LIMIT 24`;
    
    try {
      const [productRows] = await pool.query(productQuery, queryParams);
      products = Array.isArray(productRows) ? productRows : [];
    } catch (error) {
      console.error("Error fetching products:", error);
      products = [];
    }

    // Fetch product features
    try {
      const [featureRows] = await pool.query(
        `SELECT 
          feature_id as id,
          name,
          description,
          icon,
          category
        FROM features
        WHERE is_active = 1
        ORDER BY display_order ASC, name ASC`
      );
      features = Array.isArray(featureRows) ? featureRows : [];
    } catch (error) {
      console.error("Error fetching product features:", error);
      features = [];
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
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
