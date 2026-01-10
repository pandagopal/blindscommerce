import { Metadata } from 'next';
import { siteConfig } from '@/lib/seo-config';

// Generate dynamic metadata for product pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Fetch product data for metadata - use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v2/commerce/products?search=${encodeURIComponent(slug)}&limit=5`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (res.ok) {
      const data = await res.json();
      const products = data.data?.data || data.data?.products || data.products || [];
      const product = Array.isArray(products) ? products.find((p: any) => p.slug === slug) : null;

      if (product) {
        const title = `${product.name} - Custom ${product.category_name || 'Window Treatment'}`;
        const description = product.description?.slice(0, 160) ||
          `Shop ${product.name} at ${siteConfig.name}. Custom-made to fit your windows. Starting at $${product.base_price?.toFixed(2) || '0.00'}. Free shipping on orders over $100.`;
        const productUrl = `${siteConfig.url}/products/configure/${slug}`;
        const imageUrl = product.images?.[0]?.image_url || product.image_url;

        return {
          title,
          description,
          keywords: [
            product.name.toLowerCase(),
            `buy ${product.name.toLowerCase()}`,
            `custom ${product.name.toLowerCase()}`,
            product.category_name?.toLowerCase() || 'window blinds',
            'custom blinds',
            'window treatments',
          ],
          openGraph: {
            title,
            description,
            url: productUrl,
            siteName: siteConfig.name,
            type: 'website',
            images: imageUrl ? [
              {
                url: imageUrl.startsWith('http') ? imageUrl : `${siteConfig.url}${imageUrl}`,
                width: 800,
                height: 600,
                alt: product.name,
              },
            ] : undefined,
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: imageUrl ? [imageUrl.startsWith('http') ? imageUrl : `${siteConfig.url}${imageUrl}`] : undefined,
          },
          alternates: {
            canonical: productUrl,
          },
        };
      }
    }
  } catch (error) {
    console.error('Error fetching product metadata:', error);
  }

  // Fallback metadata if product not found
  const formattedSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${formattedSlug} - Custom Window Treatment`,
    description: `Shop ${formattedSlug} at ${siteConfig.name}. Custom-made to fit your windows perfectly. Free shipping on orders over $100.`,
    alternates: {
      canonical: `${siteConfig.url}/products/configure/${slug}`,
    },
  };
}

export default function ProductConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
