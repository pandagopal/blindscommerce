import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface GlobalDiscountRequest {
  discount_name: string;
  discount_code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  discount_value: number;
  minimum_order_value?: number;
  maximum_discount_amount?: number;
  applies_to: 'all_products' | 'specific_categories' | 'specific_brands' | 'specific_products';
  target_ids?: number[];
  customer_types?: string[];
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  is_stackable?: boolean;
  priority?: number;
}

// GET /api/admin/pricing/global-discounts - Get all global discounts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    const pool = await getPool();

    let query = `
      SELECT * FROM promotional_campaigns
      WHERE 1=1
    `;
    const values: any[] = [];

    if (search) {
      query += ` AND (campaign_name LIKE ? OR campaign_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [discounts] = await pool.execute<RowDataPacket[]>(query, values);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM promotional_campaigns WHERE 1=1`;
    const countValues: any[] = [];

    if (search) {
      countQuery += ` AND (campaign_name LIKE ? OR campaign_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      countValues.push(searchPattern, searchPattern);
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countValues);

    const processedDiscounts = discounts.map(discount => ({
      ...discount,
      target_product_ids: discount.target_product_ids ? JSON.parse(discount.target_product_ids) : null,
      target_category_ids: discount.target_category_ids ? JSON.parse(discount.target_category_ids) : null,
      target_brand_ids: discount.target_brand_ids ? JSON.parse(discount.target_brand_ids) : null,
      customer_segments: discount.customer_segments ? JSON.parse(discount.customer_segments) : null,
      customer_types: discount.customer_types ? JSON.parse(discount.customer_types) : null,
      target_regions: discount.target_regions ? JSON.parse(discount.target_regions) : null
    }));

    return NextResponse.json({
      discounts: processedDiscounts,
      total: countResult[0].count
    });

  } catch (error) {
    console.error('Error fetching global discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global discounts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing/global-discounts - Create global discount
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body: GlobalDiscountRequest = await request.json();

    if (!body.discount_name || !body.discount_code || !body.discount_type) {
      return NextResponse.json(
        { error: 'Name, code, and type are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if code already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT campaign_id FROM promotional_campaigns WHERE campaign_code = ?',
      [body.discount_code]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO promotional_campaigns (
        campaign_name, campaign_code, campaign_type, discount_percent, discount_amount,
        minimum_order_value, maximum_discount_amount, applies_to, target_product_ids,
        target_category_ids, target_brand_ids, customer_types, starts_at, ends_at,
        can_stack_with_volume_discounts, can_stack_with_coupons, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.discount_name,
        body.discount_code,
        body.discount_type,
        body.discount_type === 'percentage' ? body.discount_value : null,
        body.discount_type === 'fixed_amount' ? body.discount_value : null,
        body.minimum_order_value || 0,
        body.maximum_discount_amount || null,
        body.applies_to,
        body.applies_to === 'specific_products' ? JSON.stringify(body.target_ids) : null,
        body.applies_to === 'specific_categories' ? JSON.stringify(body.target_ids) : null,
        body.applies_to === 'specific_brands' ? JSON.stringify(body.target_ids) : null,
        body.customer_types ? JSON.stringify(body.customer_types) : null,
        body.valid_from || new Date().toISOString(),
        body.valid_until || null,
        body.is_stackable ?? true,
        body.is_stackable ?? true,
        body.priority || 100
      ]
    );

    return NextResponse.json({
      success: true,
      campaign_id: result.insertId,
      message: 'Global discount created successfully'
    });

  } catch (error) {
    console.error('Error creating global discount:', error);
    return NextResponse.json(
      { error: 'Failed to create global discount' },
      { status: 500 }
    );
  }
}