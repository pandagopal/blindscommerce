import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = parseInt(params.id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const pool = await getPool();
    const [result] = await pool.execute(
      `SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.is_active,
        u.is_verified,
        u.created_at,
        v.business_name,
        v.business_email,
        v.business_phone,
        v.business_description,
        v.is_active as vendor_active,
        v.is_verified as vendor_verified,
        v.approval_status,
        v.total_sales,
        v.rating
      FROM users u
      LEFT JOIN vendor_info v ON u.user_id = v.user_id
      WHERE u.user_id = ? AND u.role = 'vendor'`,
      [vendorId]
    );

    if (!result || (result as any[]).length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = (result as any[])[0];
    return NextResponse.json({
      id: vendor.user_id,
      email: vendor.email,
      firstName: vendor.first_name,
      lastName: vendor.last_name,
      companyName: vendor.business_name || `${vendor.first_name} ${vendor.last_name}'s Business`,
      contactEmail: vendor.business_email || vendor.email,
      contactPhone: vendor.business_phone || vendor.phone,
      isActive: Boolean(vendor.vendor_active ?? vendor.is_active),
      isVerified: Boolean(vendor.vendor_verified ?? false),
      approvalStatus: vendor.approval_status || 'pending',
      totalSales: vendor.total_sales || 0,
      rating: vendor.rating || 0,
      createdAt: vendor.created_at
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = parseInt(context.params.id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      companyName,
      contactEmail,
      contactPhone,
      businessDescription,
      firstName,
      lastName,
      email
    } = body;

    // Validate required fields
    if (!companyName || !contactEmail || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Update vendor info
    await pool.execute(
      `UPDATE vendor_info
       SET 
        business_name = ?,
        business_email = ?,
        business_phone = ?,
        business_description = ?,
        updated_at = NOW()
       WHERE vendor_info_id = ?`,
      [
        companyName,
        contactEmail,
        contactPhone,
        businessDescription,
        vendorId
      ]
    );

    // Get user_id for the vendor
    const [vendorResult] = await pool.execute(
      'SELECT user_id FROM vendor_info WHERE vendor_info_id = ?',
      [vendorId]
    );

    if (!vendorResult || (vendorResult as any[]).length === 0) {
      throw new Error('Vendor not found');
    }

    // Update user info
    await pool.execute(
      `UPDATE users
       SET 
        email = ?,
        first_name = ?,
        last_name = ?,
        updated_at = NOW()
       WHERE user_id = ?`,
      [email, firstName, lastName, (vendorResult as any[])[0].user_id]
    );

    return NextResponse.json({ message: 'Vendor updated successfully' });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = parseInt(params.id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Update user status
    await pool.execute(
      'UPDATE users SET is_active = ? WHERE user_id = ? AND role = ?',
      [isActive, vendorId, 'vendor']
    );

    // Update vendor_info status if it exists
    await pool.execute(
      'UPDATE vendor_info SET is_active = ? WHERE user_id = ?',
      [isActive, vendorId]
    );

    return NextResponse.json({ 
      message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor status' },
      { status: 500 }
    );
  }
} 