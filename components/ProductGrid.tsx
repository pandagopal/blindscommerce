'use client';

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  rating?: number;
  primary_image?: string;
  short_description?: string;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h3 className="text-xl font-medium mb-2 text-gray-700">
          No products found
        </h3>
        <p className="text-gray-500">
          Try adjusting your filters or check back later for new products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <div
          key={product.product_id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <a href={`/products/configure/${product.slug}`}>
            <div className="aspect-[4/3] relative overflow-hidden">
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium mb-1 text-gray-900 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {product.category_name}
              </p>
              {product.short_description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {product.short_description}
                </p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-primary-red font-bold text-sm">
                  ${(parseFloat(product?.base_price) || 0).toFixed(2)}
                </span>
                <div className="flex items-center">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-xs text-gray-600 ml-1">
                    {product?.rating ? parseFloat(product.rating).toFixed(1) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}
