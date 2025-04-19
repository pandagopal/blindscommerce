import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        Sorry, we couldn't find the product you're looking for.
      </p>
      <Link
        href="/products"
        className="bg-primary-red hover:bg-primary-red-dark text-white py-2 px-6 rounded-lg font-medium transition-colors inline-block"
      >
        Browse All Products
      </Link>
    </div>
  );
}
