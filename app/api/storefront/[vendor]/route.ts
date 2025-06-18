import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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

    const [rows] = await pool.execute(
      `SELECT vs.*, vi.company_name
       FROM vendor_storefronts vs
       JOIN vendor_info vi ON vs.vendor_id = vi.vendor_info_id
       WHERE vs.subdomain = ? AND vs.is_active = 1 AND vs.is_approved = 1`,
      [subdomain]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    const storefrontRow = rows[0] as any;

    const storefrontData: StorefrontData = {
      storefrontId: storefrontRow.storefront_id,
      vendorId: storefrontRow.vendor_id,
      subdomain: storefrontRow.subdomain,
      customDomain: storefrontRow.custom_domain,
      storefrontName: storefrontRow.storefront_name,
      description: storefrontRow.description,
      logoUrl: storefrontRow.logo_url,
      bannerUrl: storefrontRow.banner_url,
      themeSettings: storefrontRow.theme_settings ? JSON.parse(storefrontRow.theme_settings) : {},
      seoTitle: storefrontRow.seo_title,
      seoDescription: storefrontRow.seo_description,
      seoKeywords: storefrontRow.seo_keywords,
      socialLinks: storefrontRow.social_links ? JSON.parse(storefrontRow.social_links) : {},
      contactInfo: storefrontRow.contact_info ? JSON.parse(storefrontRow.contact_info) : {},
      businessHours: storefrontRow.business_hours ? JSON.parse(storefrontRow.business_hours) : {},
      isActive: Boolean(storefrontRow.is_active),
      isApproved: Boolean(storefrontRow.is_approved),
      companyName: storefrontRow.company_name
    };

    return NextResponse.json({
      success: true,
      data: storefrontData
    });

  } catch (error) {
    console.error('Error fetching storefront data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storefront data' },
      { status: 500 }
    );
  }
}