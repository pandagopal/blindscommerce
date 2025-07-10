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
                  href={`/products/${product.slug}`}
                  className="bg-primary-red text-white px-4 py-2 rounded-md hover:bg-primary-red-dark transition-colors"
                >
                  View Details
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
  
  // Try to fetch real product data for metadata
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/products/${slug}`);
    if (response.ok) {
      const data = await response.json();
      const products = data.products;
      
      if (products && products.length > 0) {
        if (products.length === 1) {
          // Single product
          const product = products[0];
          return {
            title: `${product.name} | Smart Blinds Hub`,
            description: product.short_description || "Custom window treatments from Smart Blinds Hub",
          };
        } else {
          // Multiple products - create category-style metadata
          const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return {
            title: `${categoryName} Products | Smart Blinds Hub`,
            description: `Browse our collection of ${categoryName.toLowerCase()} products. Found ${products.length} products to choose from.`,
          };
        }
      }
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
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
  
  // Try to fetch real product data first
  let products = null;
  let isMultiple = false;
  let searchTerm = slug;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/products/${slug}`, {
      cache: 'no-store' // Ensure fresh data
    });
    if (response.ok) {
      const data = await response.json();
      products = data.products;
      isMultiple = data.isMultiple;
      searchTerm = data.searchTerm || slug;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
  

  if (!products || products.length === 0) {
    notFound();
  }
  
  // If multiple products, show product listing with filters
  if (isMultiple || products.length > 1) {
    return <ProductListingPage products={products} searchTerm={searchTerm} />;
  }
  
  // Single product - show detailed view
  const product = products[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/products"
          className="text-primary-red hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.slice(0, 5).map((image: any, index: number) => (
                <div
                  key={image.image_id || index}
                  className="aspect-square border border-gray-200 rounded overflow-hidden"
                >
                  <img
                    src={image.image_url}
                    alt={`${product.name} - View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Category and Rating */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link
              href={`/products?category=${product.category_slug}`}
              className="hover:text-primary-red"
            >
              {product.category_name}
            </Link>
            <span className="mx-2">•</span>
            <div className="flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              <span>{product.rating || "N/A"}</span>
              {product.review_count > 0 && (
                <span className="ml-1">({product.review_count} reviews)</span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-2xl font-bold text-primary-red">
              ${typeof product.base_price === 'number' ? product.base_price.toFixed(2) : parseFloat(product.base_price || 0).toFixed(2)}
            </span>
            {product.is_on_sale && product.sale_price && (
              <span className="ml-2 text-gray-500 line-through">
                ${typeof product.sale_price === 'number' ? product.sale_price.toFixed(2) : parseFloat(product.sale_price || 0).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-600">{product.short_description}</p>
            {product.full_description && (
              <div className="mt-2 text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.full_description }}
              />
            )}
          </div>

          {/* Configure Button */}
          <div className="space-y-4">
            <Link
              href={`/products/configure/${product.slug}`}
              className="w-full bg-primary-red hover:bg-primary-red-dark text-white py-3 px-6 rounded-lg font-medium text-center block transition-colors"
            >
              Configure This Product
            </Link>

            <button
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Product Features */}
      {product.features && product.features.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-medium mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.features.map((feature: any, index: number) => (
              <div key={index} className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-red mr-2 flex-shrink-0 mt-1"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-medium mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Placeholder for related products */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
            >
              <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
