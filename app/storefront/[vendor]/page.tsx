import { notFound } from 'next/navigation';
import VendorHomepage from '@/components/storefront/VendorHomepage';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

interface VendorPageProps {
  params: {
    vendor: string;
  };
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
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Get storefront info
    const [storefrontRows] = await connection.execute(
      `SELECT vs.*, vi.company_name
       FROM vendor_storefronts vs
       JOIN vendor_info vi ON vs.vendor_id = vi.vendor_info_id
       WHERE vs.subdomain = ? AND vs.is_active = 1 AND vs.is_approved = 1`,
      [subdomain]
    );

    if (!Array.isArray(storefrontRows) || storefrontRows.length === 0) {
      return { homepage: null, featuredProducts: [], storefront: null };
    }

    const storefront = storefrontRows[0] as any;

    // Get homepage content
    const [pageRows] = await connection.execute(
      `SELECT * FROM vendor_storefront_pages 
       WHERE storefront_id = ? AND page_type = 'home' AND is_published = 1
       ORDER BY display_order ASC
       LIMIT 1`,
      [storefront.storefront_id]
    );

    const homepage = Array.isArray(pageRows) && pageRows.length > 0 ? pageRows[0] as any : null;

    // Get featured products for this vendor
    const [productRows] = await connection.execute(
      `SELECT p.product_id, p.name, p.slug, p.short_description, p.base_price, 
              p.rating, p.review_count, vp.vendor_price,
              pi.image_url
       FROM vendor_products vp
       JOIN products p ON vp.product_id = p.product_id
       LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
       WHERE vp.vendor_id = ? AND vp.status = 'active' AND p.status = 'active'
       ORDER BY vp.is_featured DESC, p.rating DESC, p.review_count DESC
       LIMIT 8`,
      [storefront.vendor_id]
    );

    const featuredProducts = Array.isArray(productRows) ? productRows.map((row: any) => ({
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      basePrice: row.base_price,
      rating: row.rating,
      reviewCount: row.review_count,
      imageUrl: row.image_url,
      vendorPrice: row.vendor_price
    })) : [];

    return {
      homepage: homepage ? {
        pageId: homepage.page_id,
        pageType: homepage.page_type,
        pageSlug: homepage.page_slug,
        pageTitle: homepage.page_title,
        pageContent: homepage.page_content,
        metaTitle: homepage.meta_title,
        metaDescription: homepage.meta_description,
        isPublished: homepage.is_published,
        displayOrder: homepage.display_order
      } : null,
      featuredProducts,
      storefront: {
        storefrontId: storefront.storefront_id,
        vendorId: storefront.vendor_id,
        storefrontName: storefront.storefront_name,
        description: storefront.description,
        logoUrl: storefront.logo_url,
        bannerUrl: storefront.banner_url,
        aboutSection: storefront.about_section,
        featuredProducts: storefront.featured_products ? JSON.parse(storefront.featured_products) : null,
        companyName: storefront.company_name
      }
    };

  } finally {
    await connection.end();
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { homepage, featuredProducts, storefront } = await getVendorPageData(params.vendor);

  if (!storefront) {
    notFound();
  }

  return (
    <VendorHomepage
      homepage={homepage}
      featuredProducts={featuredProducts}
      storefront={storefront}
      subdomain={params.vendor}
    />
  );
}