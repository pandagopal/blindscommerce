import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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
  primaryImageUrl: string | null;
  categoryName: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { vendor: string } }
) {
  try {
    const subdomain = params.vendor;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Vendor subdomain is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get storefront info
    const [storefrontRows] = await pool.execute(
      `SELECT vs.*, vi.company_name
       FROM vendor_storefronts vs
       JOIN vendor_info vi ON vs.vendor_id = vi.vendor_info_id
       WHERE vs.subdomain = ? AND vs.is_active = 1 AND vs.is_approved = 1`,
      [subdomain]
    );

    if (!Array.isArray(storefrontRows) || storefrontRows.length === 0) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    const storefront = storefrontRows[0] as any;

    // Get homepage content
    const [pageRows] = await pool.execute(
      `SELECT * FROM vendor_pages 
       WHERE vendor_id = ? AND page_type = 'homepage' AND is_published = 1 
       ORDER BY created_at DESC LIMIT 1`,
      [storefront.vendor_id]
    );

    let homepage: PageData | null = null;
    if (Array.isArray(pageRows) && pageRows.length > 0) {
      const page = pageRows[0] as any;
      homepage = {
        pageId: page.page_id,
        pageType: page.page_type,
        pageSlug: page.page_slug,
        pageTitle: page.page_title,
        pageContent: page.page_content,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
        isPublished: Boolean(page.is_published),
        displayOrder: page.display_order
      };
    }

    // Get featured products for this vendor
    const [productRows] = await pool.execute(
      `SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.short_description,
        p.base_price,
        p.primary_image_url,
        c.name as category_name,
        COALESCE(AVG(pr.rating), 0) as rating,
        COUNT(pr.review_id) as review_count
       FROM vendor_products vp
       JOIN products p ON vp.product_id = p.product_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
       WHERE vp.vendor_id = ? AND vp.status = 'active' AND p.is_active = 1
       GROUP BY p.product_id
       ORDER BY p.created_at DESC
       LIMIT 8`,
      [storefront.vendor_id]
    );

    const featuredProducts: FeaturedProduct[] = Array.isArray(productRows) 
      ? (productRows as any[]).map(product => ({
          productId: product.product_id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.short_description,
          basePrice: parseFloat(product.base_price),
          rating: parseFloat(product.rating),
          reviewCount: parseInt(product.review_count),
          primaryImageUrl: product.primary_image_url,
          categoryName: product.category_name
        }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        homepage,
        featuredProducts,
        storefront: {
          storefrontId: storefront.storefront_id,
          vendorId: storefront.vendor_id,
          subdomain: storefront.subdomain,
          customDomain: storefront.custom_domain,
          storefrontName: storefront.storefront_name,
          description: storefront.description,
          logoUrl: storefront.logo_url,
          bannerUrl: storefront.banner_url,
          themeSettings: storefront.theme_settings ? JSON.parse(storefront.theme_settings) : {},
          seoTitle: storefront.seo_title,
          seoDescription: storefront.seo_description,
          seoKeywords: storefront.seo_keywords,
          socialLinks: storefront.social_links ? JSON.parse(storefront.social_links) : {},
          contactInfo: storefront.contact_info ? JSON.parse(storefront.contact_info) : {},
          businessHours: storefront.business_hours ? JSON.parse(storefront.business_hours) : {},
          isActive: Boolean(storefront.is_active),
          isApproved: Boolean(storefront.is_approved),
          companyName: storefront.company_name
        }
      }
    });

  } catch (error) {
    console.error('Error fetching storefront page data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storefront page data' },
      { status: 500 }
    );
  }
}