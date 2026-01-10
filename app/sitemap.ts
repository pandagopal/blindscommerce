import { MetadataRoute } from 'next';

// Base URL for the site - update this to your production domain
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartblindshub.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Products
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // AI Features
    {
      url: `${BASE_URL}/ai-features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Services
    {
      url: `${BASE_URL}/measure-install`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/consultation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/samples`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/warranty`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Guides
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/guides/measuring`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides/installation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides/mounting`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides/choosing-blinds`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides/care-maintenance`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Help & Info
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Commercial & Business
    {
      url: `${BASE_URL}/commercial`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Other pages
    {
      url: `${BASE_URL}/wiki`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/inspiration`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Fetch dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || BASE_URL}/api/v2/commerce/products?limit=1000`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (response.ok) {
      const result = await response.json();
      const products = result.data?.products || result.products || [];

      productPages = products.map((product: { slug: string; updated_at?: string }) => ({
        url: `${BASE_URL}/products/configure/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Fetch category pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || BASE_URL}/api/v2/commerce/categories`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const result = await response.json();
      const categories = result.data?.categories || result.categories || [];

      categoryPages = categories.map((category: { category_id: number; slug?: string }) => ({
        url: `${BASE_URL}/products?category=${category.category_id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
