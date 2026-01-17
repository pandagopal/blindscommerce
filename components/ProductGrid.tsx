'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  rating?: number;
  primary_image?: string;
  short_description?: string;
  is_featured?: boolean;
  is_new?: boolean;
  discount_percentage?: number;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          No products found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Try adjusting your filters or check back later for new products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Product listing">
      {products.map((product) => (
        <article
          key={product.product_id}
          className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary-red/30 transition-all duration-300"
          role="listitem"
        >
          <Link
            href={`/products/configure/${product.slug}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 rounded-xl"
            aria-label={`Configure ${product.name} - Starting at $${(parseFloat(String(product?.base_price)) || 0).toFixed(2)}`}
          >
            {/* Image container with badges */}
            <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Badges container */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.is_new && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white shadow-sm">
                    New
                  </span>
                )}
                {product.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-sm">
                    Featured
                  </span>
                )}
                {product.discount_percentage && product.discount_percentage > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary-red text-white shadow-sm">
                    {product.discount_percentage}% Off
                  </span>
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="p-4 space-y-3">
              {/* Category tag */}
              <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                {product.category_name}
              </span>

              {/* Product name */}
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-red transition-colors leading-snug">
                {product.name}
              </h3>

              {/* Short description */}
              {product.short_description && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Price and rating row */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 block">Starting at</span>
                  <span className="text-lg font-bold text-primary-red">
                    ${(parseFloat(String(product?.base_price)) || 0).toFixed(2)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {product?.rating ? parseFloat(String(product.rating)).toFixed(1) : "N/A"}
                  </span>
                  <span className="sr-only">out of 5 stars</span>
                </div>
              </div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
