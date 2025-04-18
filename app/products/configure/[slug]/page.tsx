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
      title: `Configure ${product.name} | Smart Blinds Hub`,
      description: `Customize your ${product.name} with our easy-to-use configurator.`,
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

export default async function ProductConfiguratorPage({
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
          href={`/products/${params.slug}`}
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
          Back to Product
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Configure Your {product.name}
        </h1>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div className="bg-primary-red h-2.5 rounded-full w-[25%]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Product Preview */}
          <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 flex items-center justify-center h-[400px]">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400">Product Preview</div>
            )}
          </div>

          {/* Right side - Configuration Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-3">1. Select Mount Type</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 text-center hover:border-primary-red cursor-pointer">
                  <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400">Inside</span>
                  </div>
                  <span className="text-sm">Inside Mount</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center hover:border-primary-red cursor-pointer">
                  <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400">Outside</span>
                  </div>
                  <span className="text-sm">Outside Mount</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">2. Enter Dimensions</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (inches)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="0.125"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Width"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="0.125"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">Current Price</h2>
              <div className="text-2xl font-bold text-primary-red">
                ${product.base_price.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">
                Price based on selected options
              </p>
            </div>

            <button className="w-full bg-primary-red hover:bg-primary-red-dark text-white py-3 px-6 rounded-lg font-medium transition-colors">
              Next: Select Colors
            </button>
          </div>
        </div>
      </div>

      {/* Information Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">Need Help Measuring?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Our guides make it easy to get accurate measurements for the perfect fit.
          </p>
          <Link
            href="/measure-install"
            className="text-primary-red hover:underline text-sm font-medium"
          >
            View Measuring Guide
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">Professional Installation</h3>
          <p className="text-sm text-gray-600 mb-3">
            Let the pros handle it for you. We offer professional installation services.
          </p>
          <Link
            href="/measure-install"
            className="text-primary-red hover:underline text-sm font-medium"
          >
            Learn About Installation
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">100% Satisfaction Guarantee</h3>
          <p className="text-sm text-gray-600 mb-3">
            Not happy with your purchase? We'll make it right.
          </p>
          <Link
            href="/help"
            className="text-primary-red hover:underline text-sm font-medium"
          >
            Read Our Guarantee
          </Link>
        </div>
      </div>
    </div>
  );
}
