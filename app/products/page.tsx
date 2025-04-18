import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Custom Window Treatments | Smart Blinds Hub",
  description: "Browse our wide selection of custom blinds, shades, and shutters. Find the perfect window treatment for your home.",
};

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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
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

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop Custom Window Treatments</h1>

      {/* Filters and products section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Filters</h2>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Categories</h3>
            <div className="space-y-2">
              {categories && categories.length > 0 ? (
                categories.map((category: any) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {category.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No categories found</p>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Price Range</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="sr-only" htmlFor="min-price">
                    Minimum Price
                  </label>
                  <input
                    type="number"
                    id="min-price"
                    placeholder="Min"
                    className="w-full rounded border-gray-300 text-sm p-2"
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="max-price">
                    Maximum Price
                  </label>
                  <input
                    type="number"
                    id="max-price"
                    placeholder="Max"
                    className="w-full rounded border-gray-300 text-sm p-2"
                  />
                </div>
              </div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded transition-colors">
                Apply
              </button>
            </div>
          </div>

          {/* Other filters */}
          <div>
            <h3 className="text-sm font-medium mb-2">Features</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-cordless"
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <label
                  htmlFor="feature-cordless"
                  className="ml-2 text-sm text-gray-700"
                >
                  Cordless
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-blackout"
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <label
                  htmlFor="feature-blackout"
                  className="ml-2 text-sm text-gray-700"
                >
                  Blackout
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-energy-efficient"
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <label
                  htmlFor="feature-energy-efficient"
                  className="ml-2 text-sm text-gray-700"
                >
                  Energy Efficient
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-motorized"
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <label
                  htmlFor="feature-motorized"
                  className="ml-2 text-sm text-gray-700"
                >
                  Motorized
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="md:col-span-3">
          {/* Sorting controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
            <div className="mb-4 sm:mb-0">
              <span className="text-sm text-gray-500">
                {products ? products.length : 0} products
              </span>
            </div>
            <div className="flex space-x-2">
              <label className="text-sm text-gray-700 mr-2" htmlFor="sort-by">
                Sort by:
              </label>
              <select
                id="sort-by"
                className="rounded border-gray-300 text-sm py-1 pr-8 pl-3"
                defaultValue="recommended"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <div
                  key={product.product_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <a href={`/products/${product.slug}`}>
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
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-1 text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {product.category_name}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-primary-red font-bold">
                          ${product.base_price.toFixed(2)}
                        </span>
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating ? product.rating : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h3 className="text-xl font-medium mb-2 text-gray-700">
                No products found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later for new products.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
