import Image from "next/image";
import Link from "next/link";

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await res.json();
    return data.categories;
  } catch (error) {
    console.error("Error loading categories:", error);
    return [];
  }
}

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await res.json();
    return data.products;
  } catch (error) {
    console.error("Error loading products:", error);
    return [];
  }
}

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="container mx-auto px-4 pt-6">
      {/* Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-primary-red text-white p-8 rounded-lg">
          <div className="max-w-lg">
            <div className="bg-[#b31029] text-white inline-block px-2 py-1 rounded text-xs font-bold mb-3">
              SUPER SPRING SAVINGS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">UP TO 40% OFF SITEWIDE</h2>
            <Link
              href="/products"
              className="bg-white text-primary-red font-bold py-2 px-6 rounded hover:bg-gray-100 text-sm inline-block"
            >
              SHOP NOW
            </Link>
            <p className="mt-3 text-sm">SALE ENDS 5/20</p>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-primary-red text-white p-4 rounded-lg">
            <div className="mb-2">
              <h3 className="font-bold text-sm">PRO MEASURE BY EXPERTS</h3>
              <p className="text-xs">Let the pros handle it</p>
            </div>
            <div className="flex mb-3">
              <div className="w-full h-24 bg-gray-700 rounded">
                {/* Will be replaced with actual image */}
              </div>
            </div>
            <Link
              href="/measure-install"
              className="w-full bg-white text-primary-red text-xs text-center py-1 px-2 rounded font-medium inline-block"
            >
              CHECK AVAILABILITY
            </Link>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-primary-red text-sm mb-1">BIG SPRING SPECIAL BUYS</h3>
            <div className="mb-3">
              <div className="w-full h-24 bg-gray-200 rounded">
                {/* Will be replaced with actual image */}
              </div>
            </div>
            <Link
              href="/products"
              className="w-full bg-primary-red text-white text-xs text-center py-1 px-2 rounded font-medium inline-block"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Rather have a pro do it?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Let our professional measure and install team handle everything so that you don't have to
          </p>
          <Link
            href="/measure-install"
            className="border border-primary-red text-primary-red px-4 py-1 rounded text-sm hover:bg-red-50 inline-block"
          >
            Check Availability
          </Link>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Buy Risk-Free</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get the perfect fit and our 100% satisfaction guarantee
          </p>
          <Link
            href="/help"
            className="border border-primary-red text-primary-red px-4 py-1 rounded text-sm hover:bg-red-50 inline-block"
          >
            Read Our Guarantee
          </Link>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Find your Inspiration</h3>
          <p className="text-sm text-gray-600 mb-4">
            See real customer photos and shop the looks your local stores don't carry
          </p>
          <Link
            href="/gallery"
            className="border border-primary-red text-primary-red px-4 py-1 rounded text-sm hover:bg-red-50 inline-block"
          >
            Shop Our Gallery
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-medium mb-2">
          We are the Experts in Custom Blinds, Shades and Shutters
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          We're 100% online so the showroom is in your pocket. Whether you're a DIY warrior or prefer to use our professional services, you can count on us to deliver high-quality blinds, shades, and shutters at an affordable price.
        </p>
      </div>

      {/* Featured Products Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-medium mb-4 text-center">Save on Spring Styles</h2>
        <p className="text-center mb-6 text-sm">
          <Link href="/products" className="hover:underline">
            Shop All Deals
          </Link>
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products && products.length > 0 ? (
            products.map((product: any) => (
              <div
                key={product.product_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {product.primary_image ? (
                      <div className="w-full h-full relative">
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-1 text-gray-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {product.category_name}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-red font-bold">
                        ${product.base_price?.toFixed(2) || '0.00'}
                      </span>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600 ml-1">
                          {product.rating ? product.rating : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-medium mb-4 text-center">Marketplace Highlights</h2>
        <p className="text-center mb-6 text-sm">
          Discover unique products from our verified vendors
          <Link href="/marketplace" className="ml-2 text-primary-red hover:underline">
            View All
          </Link>
        </p>

        {/* Placeholder for marketplace vendors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-medium mb-8 text-center">Shop Our Most Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {categories && categories.length > 0 ? (
            categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="text-center hover:opacity-90 transition-opacity"
              >
                <div className="rounded-lg h-28 mb-2 flex items-center justify-center overflow-hidden bg-gray-200">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500">{category.name}</span>
                  )}
                </div>
                <p className="text-sm font-medium">{category.name}</p>
              </Link>
            ))
          ) : (
            // Placeholder for categories
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="text-center animate-pulse">
                <div className="rounded-lg h-28 mb-2 bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
