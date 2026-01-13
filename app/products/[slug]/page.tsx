import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/products/ProductGrid";

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

  // Use the client component with wishlist functionality
  return <ProductGrid products={products} searchTerm={searchTerm} />;
}
