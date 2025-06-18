import { notFound } from 'next/navigation';
import VendorHomepage from '@/components/storefront/VendorHomepage';

interface VendorPageProps {
  params: Promise<{
    vendor: string;
  }>;
}

interface PageData {
  pageId: number;
  pageType: string;
  pageSlug: string;
  pageTitle: string;
  pageContent: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  displayOrder: number;
}

interface FeaturedProduct {
  productId: number;
  name: string;
  slug: string;
  shortDescription: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  vendorPrice: number | null;
}

async function getVendorPageData(subdomain: string): Promise<{
  homepage: PageData | null;
  featuredProducts: FeaturedProduct[];
  storefront: any;
}> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/storefront/${subdomain}`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    }

    return { homepage: null, featuredProducts: [], storefront: null };
  } catch (error) {
    console.error('Error fetching vendor page data from centralized API:', error);
    return { homepage: null, featuredProducts: [], storefront: null };
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { vendor } = await params;
  const { homepage, featuredProducts, storefront } = await getVendorPageData(vendor);

  if (!storefront) {
    notFound();
  }

  return (
    <VendorHomepage
      homepage={homepage}
      featuredProducts={featuredProducts}
      storefront={storefront}
      subdomain={vendor}
    />
  );
}