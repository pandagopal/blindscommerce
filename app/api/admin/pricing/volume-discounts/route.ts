import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VolumeDiscountRow extends RowDataPacket {
  discount_id: number;
  discount_name: string;
  discount_code: string;
  product_id: number;
  category_ids: string;
  brand_ids: string;
  product_tags: string;
  volume_tiers: string;
  customer_types: string;
  customer_groups: string;
  allowed_regions: string;
  excluded_regions: string;
  can_combine_with_promos: boolean;
  can_combine_with_coupons: boolean;
  max_total_discount_percent: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  usage_count: number;
  max_usage_total: number;
  max_usage_per_customer: number;
  created_at: string;
  updated_at: string;
}

interface CreateVolumeDiscountRequest {
  discount_name: string;
  discount_code: string;
  product_id?: number;
  category_ids?: number[];
  brand_ids?: number[];
  product_tags?: string[];
  volume_tiers: Array<{
    min_qty: number;
    max_qty?: number;
    discount_percent?: number;
    discount_amount?: number;
  }>;
  customer_types?: string[];
  customer_groups?: number[];
  allowed_regions?: string[];
  excluded_regions?: string[];
  can_combine_with_promos?: boolean;
  can_combine_with_coupons?: boolean;
  max_total_discount_percent?: number;
  valid_from?: string;
  valid_until?: string;
  max_usage_total?: number;
  max_usage_per_customer?: number;
}

// GET /api/admin/pricing/volume-discounts - Get all volume discounts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'sales'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');

    const pool = await getPool();

    let query = `
      SELECT vd.*, p.name as product_name
      FROM volume_discounts vd
      LEFT JOIN products p ON vd.product_id = p.product_id
      WHERE 1=1
    `;

    const values: any[] = [];

    if (search) {
      query += ` AND (vd.discount_name LIKE ? OR vd.discount_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern);
    }

    if (isActive !== null && isActive !== '') {
      query += ` AND vd.is_active = ?`;
      values.push(isActive === 'true');
    }

    query += ` ORDER BY vd.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [discounts] = await pool.execute<VolumeDiscountRow[]>(query, values);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count
      FROM volume_discounts vd
      WHERE 1=1
    `;
    const countValues: any[] = [];

    if (search) {
      countQuery += ` AND (vd.discount_name LIKE ? OR vd.discount_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      countValues.push(searchPattern, searchPattern);
    }

    if (isActive !== null && isActive !== '') {
      countQuery += ` AND vd.is_active = ?`;
      countValues.push(isActive === 'true');
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countValues);

    const processedDiscounts = discounts.map(discount => ({
      ...discount,
      volume_tiers: JSON.parse(discount.volume_tiers || '[]'),
      category_ids: discount.category_ids ? JSON.parse(discount.category_ids) : null,
      brand_ids: discount.brand_ids ? JSON.parse(discount.brand_ids) : null,
      product_tags: discount.product_tags ? JSON.parse(discount.product_tags) : null,
      customer_types: discount.customer_types ? JSON.parse(discount.customer_types) : null,
      customer_groups: discount.customer_groups ? JSON.parse(discount.customer_groups) : null,
      allowed_regions: discount.allowed_regions ? JSON.parse(discount.allowed_regions) : null,
      excluded_regions: discount.excluded_regions ? JSON.parse(discount.excluded_regions) : null
    }));

    return NextResponse.json({
      discounts: processedDiscounts,
      total: countResult[0].count,
      pagination: {
        limit,
        offset,
        has_more: countResult[0].count > offset + limit
      }
    });

  } catch (error) {
    console.error('Error fetching volume discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume discounts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing/volume-discounts - Create new volume discount
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'sales'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateVolumeDiscountRequest = await request.json();

    // Validate required fields
    if (!body.discount_name || !body.discount_code || !body.volume_tiers || body.volume_tiers.length === 0) {
      return NextResponse.json(
        { error: 'Discount name, code, and volume tiers are required' },
        { status: 400 }
      );
    }

    // Validate volume tiers
    for (let i = 0; i < body.volume_tiers.length; i++) {
      const tier = body.volume_tiers[i];
      if (!tier.min_qty || tier.min_qty < 1) {
        return NextResponse.json(
          { error: `Volume tier ${i + 1}: minimum quantity must be at least 1` },
          { status: 400 }
        );
      }
      if (!tier.discount_percent && !tier.discount_amount) {
        return NextResponse.json(
          { error: `Volume tier ${i + 1}: either discount_percent or discount_amount is required` },
          { status: 400 }
        );
      }
    }

    const pool = await getPool();

    // Check if discount code already exists
    const [existingDiscount] = await pool.execute<RowDataPacket[]>(
      'SELECT discount_id FROM volume_discounts WHERE discount_code = ?',
      [body.discount_code]
    );

    if (existingDiscount.length > 0) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }

    // Insert new volume discount
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO volume_discounts (
        discount_name, discount_code, product_id, category_ids, brand_ids,
        product_tags, volume_tiers, customer_types, customer_groups,
        allowed_regions, excluded_regions, can_combine_with_promos,
        can_combine_with_coupons, max_total_discount_percent,
        valid_from, valid_until, max_usage_total, max_usage_per_customer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.discount_name,
        body.discount_code,
        body.product_id || null,
        body.category_ids ? JSON.stringify(body.category_ids) : null,
        body.brand_ids ? JSON.stringify(body.brand_ids) : null,
        body.product_tags ? JSON.stringify(body.product_tags) : null,
        JSON.stringify(body.volume_tiers),
        body.customer_types ? JSON.stringify(body.customer_types) : null,
        body.customer_groups ? JSON.stringify(body.customer_groups) : null,
        body.allowed_regions ? JSON.stringify(body.allowed_regions) : null,
        body.excluded_regions ? JSON.stringify(body.excluded_regions) : null,
        body.can_combine_with_promos ?? true,
        body.can_combine_with_coupons ?? true,
        body.max_total_discount_percent ?? 50.00,
        body.valid_from || null,
        body.valid_until || null,
        body.max_usage_total || null,
        body.max_usage_per_customer || null
      ]
    );

    return NextResponse.json({
      success: true,
      discount_id: result.insertId,
      message: 'Volume discount created successfully'
    });

  } catch (error) {
    console.error('Error creating volume discount:', error);
    return NextResponse.json(
      { error: 'Failed to create volume discount' },
      { status: 500 }
    );
  }
}