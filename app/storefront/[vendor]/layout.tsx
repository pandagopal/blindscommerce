import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VendorStorefront from '@/components/storefront/VendorStorefront';

interface VendorLayoutProps {
  children: React.ReactNode;
  params: {
    vendor: string;
  };
}

interface StorefrontData {
  storefrontId: number;
  vendorId: number;
  subdomain: string;
  customDomain: string | null;
  storefrontName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeSettings: any;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  socialLinks: any;
  contactInfo: any;
  businessHours: any;
  isActive: boolean;
  isApproved: boolean;
  companyName: string;
}

async function getStorefrontData(subdomain: string): Promise<StorefrontData | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/storefront/${subdomain}`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result.data.storefront;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching storefront data from centralized API:', error);
    return null;
  }
}

export async function generateMetadata({ params }: VendorLayoutProps): Promise<Metadata> {
  const storefront = await getStorefrontData(params.vendor);

  if (!storefront) {
    return {
      title: 'Storefront Not Found',
      description: 'The requested vendor storefront could not be found.',
    };
  }

  return {
    title: storefront.seoTitle || `${storefront.storefrontName} - Premium Blinds & Window Treatments`,
    description: storefront.seoDescription || storefront.description || `Shop premium blinds and window treatments at ${storefront.storefrontName}. Quality products with professional installation.`,
    keywords: storefront.seoKeywords || 'blinds, window treatments, shades, shutters, custom blinds',
    openGraph: {
      title: storefront.storefrontName,
      description: storefront.description || `Premium blinds and window treatments from ${storefront.storefrontName}`,
      images: storefront.logoUrl ? [storefront.logoUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: storefront.storefrontName,
      description: storefront.description || `Premium blinds and window treatments from ${storefront.storefrontName}`,
      images: storefront.logoUrl ? [storefront.logoUrl] : [],
    },
    alternates: {
      canonical: `https://${storefront.subdomain}.blindscommerce.com`,
    },
  };
}

export default async function VendorLayout({ children, params }: VendorLayoutProps) {
  const storefront = await getStorefrontData(params.vendor);

  if (!storefront) {
    notFound();
  }

  return (
    <VendorStorefront storefront={storefront}>
      {children}
    </VendorStorefront>
  );
}