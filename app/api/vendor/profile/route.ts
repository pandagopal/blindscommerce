import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface VendorProfileRow extends RowDataPacket {
  vendor_info_id: number;
  user_id: number;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  business_description: string | null;
  logo_url: string | null;
  website_url: string | null;
  year_established: number | null;
  is_verified: number;
  verification_date: string | null;
  approval_status: string;
  tax_id: string | null;
  business_address_line1: string | null;
  business_address_line2: string | null;
  business_city: string | null;
  business_state: string | null;
  business_postal_code: string | null;
  business_country: string;
  total_sales: number;
  rating: number;
  is_active: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
}

// GET /api/vendor/profile - Get vendor profile
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pool = await getPool();
    const [rows] = await pool.execute<VendorProfileRow[]>(
      `SELECT 
        vi.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        (SELECT COUNT(*) FROM vendor_products WHERE vendor_id = vi.vendor_info_id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM orders o 
         JOIN order_items oi ON o.order_id = oi.order_id 
         JOIN vendor_products vp ON oi.product_id = vp.product_id 
         WHERE vp.vendor_id = vi.vendor_info_id) as total_orders
      FROM vendor_info vi
      JOIN users u ON vi.user_id = u.user_id
      WHERE vi.user_id = ?`,
      [user.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    const profile = rows[0];
    return NextResponse.json({
      success: true,
      profile: {
        vendorInfoId: profile.vendor_info_id,
        userId: profile.user_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        businessName: profile.business_name,
        businessEmail: profile.business_email,
        businessPhone: profile.business_phone,
        businessDescription: profile.business_description,
        logoUrl: profile.logo_url,
        websiteUrl: profile.website_url,
        yearEstablished: profile.year_established,
        isVerified: Boolean(profile.is_verified),
        verificationDate: profile.verification_date,
        approvalStatus: profile.approval_status,
        taxId: profile.tax_id,
        totalSales: profile.total_sales,
        rating: profile.rating,
        isActive: Boolean(profile.is_active),
        address: {
          addressLine1: profile.business_address_line1,
          addressLine2: profile.business_address_line2,
          city: profile.business_city,
          state: profile.business_state,
          postalCode: profile.business_postal_code,
          country: profile.business_country
        },
        stats: {
          productCount: profile.product_count || 0,
          totalOrders: profile.total_orders || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor profile' },
      { status: 500 }
    );
  }
}

// PUT /api/vendor/profile - Update vendor profile
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const pool = await getPool();

    // Update user table
    await pool.execute(
      `UPDATE users
      SET 
        email = ?,
        first_name = ?,
        last_name = ?,
        phone = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [
        data.email || null,
        data.firstName || null,
        data.lastName || null,
        data.phone || null,
        user.userId
      ]
    );

    // Update vendor_info table
    await pool.execute(
      `UPDATE vendor_info
      SET 
        business_name = ?,
        business_email = ?,
        business_phone = ?,
        business_description = ?,
        logo_url = ?,
        website_url = ?,
        year_established = ?,
        tax_id = ?,
        business_address_line1 = ?,
        business_address_line2 = ?,
        business_city = ?,
        business_state = ?,
        business_postal_code = ?,
        business_country = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [
        data.businessName || null,
        data.businessEmail || null,
        data.businessPhone || null,
        data.businessDescription || null,
        data.logoUrl || null,
        data.websiteUrl || null,
        data.yearEstablished || null,
        data.taxId || null,
        data.address?.addressLine1 || null,
        data.address?.addressLine2 || null,
        data.address?.city || null,
        data.address?.state || null,
        data.address?.postalCode || null,
        data.address?.country || 'United States',
        user.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor profile' },
      { status: 500 }
    );
  }
} 