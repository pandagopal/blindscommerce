import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

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
    const result = await pool.query(
      `SELECT 
        u.user_id as "userId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.phone,
        v.company_name as "companyName",
        v.contact_email as "contactEmail",
        v.contact_phone as "contactPhone",
        v.business_description as "businessDescription",
        v.tax_id as "taxId",
        v.business_license as "businessLicense",
        v.address_line1 as "addressLine1",
        v.address_line2 as "addressLine2",
        v.city,
        v.state,
        v.postal_code as "postalCode",
        v.country
      FROM blinds.users u
      JOIN blinds.vendors v ON u.user_id = v.user_id
      WHERE u.user_id = $1`,
      [user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    const profile = result.rows[0];
    return NextResponse.json({
      userId: profile.userId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      companyName: profile.companyName,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      businessDescription: profile.businessDescription,
      taxId: profile.taxId,
      businessLicense: profile.businessLicense,
      address: {
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        city: profile.city,
        state: profile.state,
        postalCode: profile.postalCode,
        country: profile.country
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user table
      await client.query(
        `UPDATE blinds.users
        SET 
          email = $1,
          first_name = $2,
          last_name = $3,
          phone = $4,
          updated_at = NOW()
        WHERE user_id = $5`,
        [
          data.email,
          data.firstName,
          data.lastName,
          data.phone,
          user.userId
        ]
      );

      // Update vendor table
      await client.query(
        `UPDATE blinds.vendors
        SET 
          company_name = $1,
          contact_email = $2,
          contact_phone = $3,
          business_description = $4,
          tax_id = $5,
          business_license = $6,
          address_line1 = $7,
          address_line2 = $8,
          city = $9,
          state = $10,
          postal_code = $11,
          country = $12,
          updated_at = NOW()
        WHERE user_id = $13`,
        [
          data.companyName,
          data.contactEmail,
          data.contactPhone,
          data.businessDescription,
          data.taxId,
          data.businessLicense,
          data.address.addressLine1,
          data.address.addressLine2,
          data.address.city,
          data.address.state,
          data.address.postalCode,
          data.address.country,
          user.userId
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Profile updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor profile' },
      { status: 500 }
    );
  }
} 