import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
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

    const pool = await getPool();
    const result = await pool.query(
      `SELECT 
        vi.vendor_info_id,
        vi.user_id,
        vi.business_name as company_name,
        vi.business_email as contact_email,
        vi.business_phone as contact_phone,
        vi.business_description,
        vi.is_active,
        vi.is_verified,
        vi.approval_status,
        vi.created_at,
        vi.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM blinds.vendor_info vi
      JOIN blinds.users u ON vi.user_id = u.user_id
      WHERE vi.vendor_info_id = $1`,
      [vendorId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = {
      vendor_info_id: result.rows[0].vendor_info_id,
      user_id: result.rows[0].user_id,
      company_name: result.rows[0].company_name,
      contact_email: result.rows[0].contact_email,
      contact_phone: result.rows[0].contact_phone,
      business_description: result.rows[0].business_description,
      is_active: result.rows[0].is_active,
      is_verified: result.rows[0].is_verified,
      approval_status: result.rows[0].approval_status,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
      user: {
        email: result.rows[0].user_email,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name
      }
    };

    return NextResponse.json(vendor);
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update vendor info
      await client.query(
        `UPDATE blinds.vendor_info
         SET 
          business_name = $1,
          business_email = $2,
          business_phone = $3,
          business_description = $4,
          updated_at = NOW()
         WHERE vendor_info_id = $5`,
        [
          companyName,
          contactEmail,
          contactPhone,
          businessDescription,
          vendorId
        ]
      );

      // Get user_id for the vendor
      const vendorResult = await client.query(
        'SELECT user_id FROM blinds.vendor_info WHERE vendor_info_id = $1',
        [vendorId]
      );

      if (vendorResult.rows.length === 0) {
        throw new Error('Vendor not found');
      }

      // Update user info
      await client.query(
        `UPDATE blinds.users
         SET 
          email = $1,
          first_name = $2,
          last_name = $3,
          updated_at = NOW()
         WHERE user_id = $4`,
        [email, firstName, lastName, vendorResult.rows[0].user_id]
      );

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Vendor updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    await pool.query(
      'UPDATE blinds.vendor_info SET is_active = $1, updated_at = NOW() WHERE vendor_info_id = $2',
      [is_active, vendorId]
    );

    return NextResponse.json({ message: 'Vendor status updated successfully' });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user_id for the vendor
      const vendorResult = await client.query(
        'SELECT user_id FROM blinds.vendor_info WHERE vendor_info_id = $1',
        [vendorId]
      );

      if (vendorResult.rows.length === 0) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      // Delete vendor info
      await client.query(
        'DELETE FROM blinds.vendor_info WHERE vendor_info_id = $1',
        [vendorId]
      );

      // Update user status to inactive
      await client.query(
        'UPDATE blinds.users SET is_active = FALSE WHERE user_id = $1',
        [vendorResult.rows[0].user_id]
      );

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
} 