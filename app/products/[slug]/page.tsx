import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// Comment out dynamic rendering for static export
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// Client component for product listing with filters
function ProductListingPage({ products, searchTerm }: { products: any[], searchTerm: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {searchTerm.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Products
        </h1>
        <p className="text-gray-600">Found {products.length} products</p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200+">$200+</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Brands</option>
              {[...new Set(products.map(p => p.brand_name).filter(Boolean))].map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Categories</option>
              {[...new Set(products.map(p => p.category_name).filter(Boolean))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="name">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-200">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.short_description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary-red">
                  ${typeof product.base_price === 'number' ? product.base_price.toFixed(2) : parseFloat(product.base_price || 0).toFixed(2)}
                </span>
                <Link
                  href={`/products/configure/${product.slug}`}
                  className="bg-primary-red text-white px-4 py-2 rounded-md hover:bg-primary-red-dark transition-colors"
                >
                  Configure
                </Link>
              </div>
              {product.rating > 0 && (
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                  {product.review_count > 0 && (
                    <span className="ml-1 text-sm text-gray-500">({product.review_count})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Define a type for the product data structure
type ProductData = {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  category_slug: string;
  base_price: number;
  rating: number;
  review_count: number;
  short_description: string;
  full_description: string;
  is_on_sale: boolean;
  sale_price: number | null;
  primary_image: string;
  images: Array<{
    image_id: number;
    image_url: string;
    is_primary: boolean;
  }>;
  features: Array<{
    name: string;
    description: string;
  }>;
};


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // Await params as required in Next.js 15
  const { slug } = await params;
  
  // Try to fetch product count for metadata
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/v2/commerce/products?search=${encodeURIComponent(slug)}&limit=50`);
    if (response.ok) {
      const data = await response.json();
      const allProducts = data.data?.data || data.data?.products || data.products || data.data || [];
      
      const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        title: `${categoryName} Products | Smart Blinds Hub`,
        description: `Browse our collection of ${categoryName.toLowerCase()} products. Found ${allProducts.length} products to choose from.`,
      };
    }
  } catch (error) {
    console.error('Error fetching products for metadata:', error);
  }

  // Final fallback
  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${categoryName} Products | Smart Blinds Hub`,
    description: `Browse our collection of ${categoryName.toLowerCase()} products and window treatments.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await params as required in Next.js 15
  const { slug } = await params;
  
  // Always show product listing filtered by the slug
  let products = [];
  let searchTerm = slug.replace(/-/g, ' ');
  
  try {
    // Use V2 API to search for products by slug
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/v2/commerce/products?search=${encodeURIComponent(slug)}&limit=50`, {
      cache: 'no-store' // Ensure fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle V2 API response structure
      products = data.data?.data || data.data?.products || data.products || data.data || [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
  
  if (!products || products.length === 0) {
    notFound();
  }
  
  // Always show product listing with filters
  return <ProductListingPage products={products} searchTerm={searchTerm} />;
}
