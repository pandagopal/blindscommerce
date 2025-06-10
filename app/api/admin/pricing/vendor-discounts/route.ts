import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorDiscountRequest {
  vendor_id: number;
  discount_name: string;
  discount_type: 'percentage' | 'fixed_amount' | 'tiered';
  discount_value: number;
  minimum_order_value?: number;
  maximum_discount_amount?: number;
  applies_to: 'all_vendor_products' | 'specific_products' | 'specific_categories';
  target_ids?: number[];
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  requires_admin_approval?: boolean;
}

// GET /api/admin/pricing/vendor-discounts - Get all vendor discounts (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();

    let query = `
      SELECT vd.*, v.business_name, v.business_email,
             u.first_name, u.last_name
      FROM vendor_discounts vd
      JOIN vendor_info v ON vd.vendor_id = v.vendor_id
      JOIN users u ON v.user_id = u.user_id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (vendorId) {
      query += ` AND vd.vendor_id = ?`;
      values.push(vendorId);
    }

    query += ` ORDER BY vd.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [discounts] = await pool.execute<RowDataPacket[]>(query, values);

    return NextResponse.json({
      discounts: discounts.map(discount => ({
        ...discount,
        target_ids: discount.target_ids ? JSON.parse(discount.target_ids) : null
      }))
    });

  } catch (error) {
    console.error('Error fetching vendor discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor discounts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing/vendor-discounts - Create/approve vendor discount (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body: VendorDiscountRequest = await request.json();

    if (!body.vendor_id || !body.discount_name || !body.discount_type) {
      return NextResponse.json(
        { error: 'Vendor ID, name, and type are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify vendor exists
    const [vendors] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_id FROM vendor_info WHERE vendor_id = ? AND is_active = TRUE',
      [body.vendor_id]
    );

    if (vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor not found or inactive' },
        { status: 404 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO vendor_discounts (
        vendor_id, discount_name, discount_type, discount_value,
        minimum_order_value, maximum_discount_amount, applies_to, target_ids,
        valid_from, valid_until, usage_limit, admin_approved, approved_by, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, NOW())`,
      [
        body.vendor_id,
        body.discount_name,
        body.discount_type,
        body.discount_value,
        body.minimum_order_value || 0,
        body.maximum_discount_amount || null,
        body.applies_to,
        body.target_ids ? JSON.stringify(body.target_ids) : null,
        body.valid_from || new Date().toISOString(),
        body.valid_until || null,
        body.usage_limit || null,
        user.userId
      ]
    );

    return NextResponse.json({
      success: true,
      discount_id: result.insertId,
      message: 'Vendor discount created and approved'
    });

  } catch (error) {
    console.error('Error creating vendor discount:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor discount' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/pricing/vendor-discounts/[id] - Approve/reject vendor discount request
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const discountId = searchParams.get('id');
    const { action, notes } = await request.json(); // action: 'approve' | 'reject'

    if (!discountId || !action) {
      return NextResponse.json(
        { error: 'Discount ID and action are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE vendor_discounts 
       SET admin_approved = ?, approved_by = ?, approved_at = NOW(), admin_notes = ?
       WHERE discount_id = ?`,
      [action === 'approve', user.userId, notes || null, discountId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Vendor discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Vendor discount ${action}d successfully`
    });

  } catch (error) {
    console.error('Error updating vendor discount:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor discount' },
      { status: 500 }
    );
  }
}