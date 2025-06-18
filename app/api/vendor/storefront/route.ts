import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get vendor storefront details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    try {
      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Get storefront details
      const [storefrontRows] = await pool.execute(
        `SELECT vs.*, vi.company_name, vi.email, vi.phone
         FROM vendor_storefronts vs
         JOIN vendor_info vi ON vs.vendor_id = vi.vendor_info_id
         WHERE vs.vendor_id = ?`,
        [vendorId]
      );

      if (!Array.isArray(storefrontRows) || storefrontRows.length === 0) {
        return NextResponse.json({ 
          error: 'Storefront not found',
          hasStorefront: false 
        }, { status: 404 });
      }

      const storefront = storefrontRows[0] as any;

      // Get storefront pages
      const [pageRows] = await pool.execute(
        'SELECT * FROM vendor_storefront_pages WHERE storefront_id = ? ORDER BY page_type, display_order',
        [storefront.storefront_id]
      );

      return NextResponse.json({
        storefront: {
          storefrontId: storefront.storefront_id,
          vendorId: storefront.vendor_id,
          subdomain: storefront.subdomain,
          customDomain: storefront.custom_domain,
          storefrontName: storefront.storefront_name,
          description: storefront.description,
          logoUrl: storefront.logo_url,
          bannerUrl: storefront.banner_url,
          themeSettings: storefront.theme_settings ? JSON.parse(storefront.theme_settings) : null,
          customCss: storefront.custom_css,
          seoTitle: storefront.seo_title,
          seoDescription: storefront.seo_description,
          seoKeywords: storefront.seo_keywords,
          socialLinks: storefront.social_links ? JSON.parse(storefront.social_links) : null,
          contactInfo: storefront.contact_info ? JSON.parse(storefront.contact_info) : null,
          businessHours: storefront.business_hours ? JSON.parse(storefront.business_hours) : null,
          shippingInfo: storefront.shipping_info,
          returnPolicy: storefront.return_policy,
          aboutSection: storefront.about_section,
          featuredProducts: storefront.featured_products ? JSON.parse(storefront.featured_products) : null,
          isActive: storefront.is_active,
          isApproved: storefront.is_approved,
          createdAt: storefront.created_at,
          updatedAt: storefront.updated_at,
          companyName: storefront.company_name
        },
        pages: pageRows,
        hasStorefront: true
      });

    } finally {
      }

  } catch (error) {
    console.error('Get storefront error:', error);
    return NextResponse.json(
      { error: 'Failed to get storefront details' },
      { status: 500 }
    );
  }
}

// POST - Create new vendor storefront
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      subdomain,
      storefrontName,
      description,
      logoUrl,
      bannerUrl,
      themeSettings,
      customCss,
      seoTitle,
      seoDescription,
      seoKeywords,
      socialLinks,
      contactInfo,
      businessHours,
      shippingInfo,
      returnPolicy,
      aboutSection
    } = await request.json();

    if (!subdomain || !storefrontName) {
      return NextResponse.json({ 
        error: 'Subdomain and storefront name are required' 
      }, { status: 400 });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 50) {
      return NextResponse.json({ 
        error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only (3-50 characters)' 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Check if vendor already has a storefront
      const [existingRows] = await pool.execute(
        'SELECT storefront_id FROM vendor_storefronts WHERE vendor_id = ?',
        [vendorId]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Vendor already has a storefront' 
        }, { status: 409 });
      }

      // Check if subdomain is already taken
      const [subdomainRows] = await pool.execute(
        'SELECT storefront_id FROM vendor_storefronts WHERE subdomain = ?',
        [subdomain]
      );

      if (Array.isArray(subdomainRows) && subdomainRows.length > 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Subdomain is already taken' 
        }, { status: 409 });
      }

      // Create storefront
      const [storefrontResult] = await pool.execute(
        `INSERT INTO vendor_storefronts (
          vendor_id, subdomain, storefront_name, description,
          logo_url, banner_url, theme_settings, custom_css,
          seo_title, seo_description, seo_keywords,
          social_links, contact_info, business_hours,
          shipping_info, return_policy, about_section,
          is_active, is_approved, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
        [
          vendorId,
          subdomain,
          storefrontName,
          description,
          logoUrl,
          bannerUrl,
          themeSettings ? JSON.stringify(themeSettings) : null,
          customCss,
          seoTitle,
          seoDescription,
          seoKeywords,
          socialLinks ? JSON.stringify(socialLinks) : null,
          contactInfo ? JSON.stringify(contactInfo) : null,
          businessHours ? JSON.stringify(businessHours) : null,
          shippingInfo,
          returnPolicy,
          aboutSection
        ]
      );

      const storefrontId = (storefrontResult as any).insertId;

      // Create default pages
      const defaultPages = [
        {
          page_type: 'home',
          page_slug: 'home',
          page_title: 'Welcome to Our Store',
          page_content: `<h1>Welcome to ${storefrontName}</h1><p>Discover our premium selection of blinds and window treatments.</p>`,
          display_order: 1
        },
        {
          page_type: 'about',
          page_slug: 'about',
          page_title: 'About Us',
          page_content: aboutSection || `<h1>About ${storefrontName}</h1><p>Learn more about our company and commitment to quality.</p>`,
          display_order: 2
        },
        {
          page_type: 'catalog',
          page_slug: 'products',
          page_title: 'Our Products',
          page_content: '<h1>Our Product Catalog</h1><p>Browse our complete selection of blinds and window treatments.</p>',
          display_order: 3
        },
        {
          page_type: 'contact',
          page_slug: 'contact',
          page_title: 'Contact Us',
          page_content: '<h1>Contact Us</h1><p>Get in touch with us for quotes and inquiries.</p>',
          display_order: 4
        }
      ];

      for (const page of defaultPages) {
        await pool.execute(
          `INSERT INTO vendor_storefront_pages (
            storefront_id, page_type, page_slug, page_title,
            page_content, is_published, display_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
          [
            storefrontId,
            page.page_type,
            page.page_slug,
            page.page_title,
            page.page_content,
            page.display_order
          ]
        );
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Storefront created successfully',
        storefront: {
          storefrontId: storefrontId,
          subdomain: subdomain,
          storefrontName: storefrontName,
          url: `https://${subdomain}.blindscommerce.com`,
          isApproved: false
        }
      });

    } finally {
      }

  } catch (error) {
    console.error('Create storefront error:', error);
    return NextResponse.json(
      { error: 'Failed to create storefront' },
      { status: 500 }
    );
  }
}

// PUT - Update vendor storefront
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();
    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Get existing storefront
      const [storefrontRows] = await pool.execute(
        'SELECT storefront_id FROM vendor_storefronts WHERE vendor_id = ?',
        [vendorId]
      );

      if (!Array.isArray(storefrontRows) || storefrontRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Storefront not found' }, { status: 404 });
      }

      const storefrontId = (storefrontRows[0] as any).storefront_id;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      const allowedFields = {
        storefrontName: 'storefront_name',
        description: 'description',
        logoUrl: 'logo_url',
        bannerUrl: 'banner_url',
        themeSettings: 'theme_settings',
        customCss: 'custom_css',
        seoTitle: 'seo_title',
        seoDescription: 'seo_description',
        seoKeywords: 'seo_keywords',
        socialLinks: 'social_links',
        contactInfo: 'contact_info',
        businessHours: 'business_hours',
        shippingInfo: 'shipping_info',
        returnPolicy: 'return_policy',
        aboutSection: 'about_section'
      };

      for (const [key, dbField] of Object.entries(allowedFields)) {
        if (updateData.hasOwnProperty(key)) {
          updateFields.push(`${dbField} = ?`);
          
          // Handle JSON fields
          if (['themeSettings', 'socialLinks', 'contactInfo', 'businessHours'].includes(key)) {
            updateValues.push(updateData[key] ? JSON.stringify(updateData[key]) : null);
          } else {
            updateValues.push(updateData[key]);
          }
        }
      }

      if (updateFields.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(storefrontId);

      await pool.execute(
        `UPDATE vendor_storefronts SET ${updateFields.join(', ')} WHERE storefront_id = ?`,
        updateValues
      );

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Storefront updated successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Update storefront error:', error);
    return NextResponse.json(
      { error: 'Failed to update storefront' },
      { status: 500 }
    );
  }
}