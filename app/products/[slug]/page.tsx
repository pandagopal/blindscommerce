import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug);

    if (!product) {
      return {
        title: "Product Not Found | Smart Blinds Hub",
        description: "The requested product could not be found.",
      };
    }

    return {
      title: `${product.name} | Smart Blinds Hub`,
      description: product.short_description || "Custom window treatments from Smart Blinds Hub",
    };
  } catch (error) {
    return {
      title: "Error | Smart Blinds Hub",
      description: "There was an error loading this product.",
    };
  }
}

async function getProduct(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch product");
    }

    const data = await res.json();
    return data.product;
  } catch (error) {
    console.error("Error loading product:", error);
    throw error;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

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
              ${product.base_price.toFixed(2)}
            </span>
            {product.is_on_sale && product.sale_price && (
              <span className="ml-2 text-gray-500 line-through">
                ${product.sale_price.toFixed(2)}
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
