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
    // Fallback to static mock data if database fetch fails
    categories = [
      {
        id: 1,
        name: "Blinds",
        slug: "blinds",
        image: "https://source.unsplash.com/random/300x300/?blinds",
        description: "Custom blinds for every window"
      },
      {
        id: 2,
        name: "Shades",
        slug: "shades",
        image: "https://source.unsplash.com/random/300x300/?shades",
        description: "Elegant shades for your home"
      },
      {
        id: 3,
        name: "Curtains",
        slug: "curtains",
        image: "https://source.unsplash.com/random/300x300/?curtains",
        description: "Beautiful curtains for any room"
      },
      {
        id: 4,
        name: "Shutters",
        slug: "shutters",
        image: "https://source.unsplash.com/random/300x300/?shutters",
        description: "Classic shutters for style and privacy"
      },
      {
        id: 5,
        name: "Drapes",
        slug: "drapes",
        image: "https://source.unsplash.com/random/300x300/?drapes",
        description: "Luxury drapes for elegant spaces"
      },
      {
        id: 6,
        name: "Accessories",
        slug: "accessories",
        image: "https://source.unsplash.com/random/300x300/?home-accessories",
        description: "Complete your window treatments"
      }
    ];
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
    // Fallback to static mock data if database fetch fails
    products = [
      {
        product_id: 1,
        name: "Premium Wooden Blinds",
        slug: "premium-wooden-blinds",
        category_name: "Blinds",
        base_price: 89.99,
        rating: 4.7,
        primary_image: "https://source.unsplash.com/random/600x400/?wooden-blinds"
      },
      {
        product_id: 2,
        name: "Blackout Roller Shades",
        slug: "blackout-roller-shades",
        category_name: "Shades",
        base_price: 69.99,
        rating: 4.5,
        primary_image: "https://source.unsplash.com/random/600x400/?roller-shades"
      },
      {
        product_id: 3,
        name: "Elegant Linen Curtains",
        slug: "elegant-linen-curtains",
        category_name: "Curtains",
        base_price: 129.99,
        rating: 4.8,
        primary_image: "https://source.unsplash.com/random/600x400/?linen-curtains"
      },
      {
        product_id: 4,
        name: "Classic Plantation Shutters",
        slug: "classic-plantation-shutters",
        category_name: "Shutters",
        base_price: 249.99,
        rating: 4.9,
        primary_image: "https://source.unsplash.com/random/600x400/?shutters"
      },
      {
        product_id: 5,
        name: "Energy Efficient Cellular Shades",
        slug: "energy-efficient-cellular-shades",
        category_name: "Shades",
        base_price: 119.99,
        rating: 4.6,
        primary_image: "https://source.unsplash.com/random/600x400/?cellular-shades"
      },
      {
        product_id: 6,
        name: "Decorative Curtain Rods",
        slug: "decorative-curtain-rods",
        category_name: "Accessories",
        base_price: 39.99,
        rating: 4.4,
        primary_image: "https://source.unsplash.com/random/600x400/?curtain-rods"
      },
      {
        product_id: 7,
        name: "Bamboo Roman Shades",
        slug: "bamboo-roman-shades",
        category_name: "Shades",
        base_price: 149.99,
        rating: 4.7,
        primary_image: "https://source.unsplash.com/random/600x400/?bamboo-shades"
      },
      {
        product_id: 8,
        name: "Vertical Blinds for Patio Door",
        slug: "vertical-blinds-patio",
        category_name: "Blinds",
        base_price: 179.99,
        rating: 4.3,
        primary_image: "https://source.unsplash.com/random/600x400/?vertical-blinds"
      },
      {
        product_id: 9,
        name: "Motorized Smart Blinds",
        slug: "motorized-smart-blinds",
        category_name: "Blinds",
        base_price: 299.99,
        rating: 4.9,
        primary_image: "https://source.unsplash.com/random/600x400/?smart-blinds"
      }
    ];
  }

  try {
    // Fetch product features from database
    features = await getProductFeatures();
  } catch (error) {
    console.error("Error fetching product features:", error);
    // Fallback to static mock features
    features = [
      { id: 1, name: "Cordless", description: "Safe and convenient cordless operation" },
      { id: 2, name: "Blackout", description: "Blocks 100% of outside light" },
      { id: 3, name: "Energy Efficient", description: "Provides insulation to save on energy costs" },
      { id: 4, name: "Motorized", description: "Battery or electric powered for remote operation" }
    ];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop Custom Window Treatments</h1>

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
  );
}
