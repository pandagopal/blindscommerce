import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VendorStorefront from '@/components/storefront/VendorStorefront';
import { getPool } from '@/lib/db';

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
  const pool = await getPool();

  try {
    const [rows] = await pool.execute(
      `SELECT vs.*, vi.company_name
       FROM vendor_storefronts vs
       JOIN vendor_info vi ON vs.vendor_id = vi.vendor_info_id
       WHERE vs.subdomain = ? AND vs.is_active = 1 AND vs.is_approved = 1`,
      [subdomain]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const storefront = rows[0] as any;
    
    return {
      storefrontId: storefront.storefront_id,
      vendorId: storefront.vendor_id,
      subdomain: storefront.subdomain,
      customDomain: storefront.custom_domain,
      storefrontName: storefront.storefront_name,
      description: storefront.description,
      logoUrl: storefront.logo_url,
      bannerUrl: storefront.banner_url,
      themeSettings: storefront.theme_settings ? JSON.parse(storefront.theme_settings) : null,
      seoTitle: storefront.seo_title,
      seoDescription: storefront.seo_description,
      seoKeywords: storefront.seo_keywords,
      socialLinks: storefront.social_links ? JSON.parse(storefront.social_links) : null,
      contactInfo: storefront.contact_info ? JSON.parse(storefront.contact_info) : null,
      businessHours: storefront.business_hours ? JSON.parse(storefront.business_hours) : null,
      isActive: storefront.is_active,
      isApproved: storefront.is_approved,
      companyName: storefront.company_name
    };

  } finally {
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