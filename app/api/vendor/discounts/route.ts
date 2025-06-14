import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateVendorAccess } from '@/lib/security/validation';
import { RowDataPacket } from 'mysql2';
import { 
  parseVendorDiscount, 
  validateDiscountData, 
  stringifyJsonSafely 
} from '@/lib/utils/vendorDiscountHelpers';

interface VendorDiscount extends RowDataPacket {
  discount_id: number;
  vendor_id: number;
  discount_name: string;
  discount_code: string | null;
  display_name: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'tiered' | 'bulk_pricing';
  is_automatic: boolean;
  discount_value: number;
  volume_tiers: any;
  minimum_order_value: number;
  maximum_discount_amount: number | null;
  minimum_quantity: number;
  applies_to: 'all_vendor_products' | 'specific_products' | 'specific_categories';
  target_ids: any;
  customer_types: any;
  customer_groups: any;
  allowed_regions: any;
  excluded_regions: any;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage_count: number;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  stackable_with_coupons: boolean;
  priority: number;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
}

// GET - List vendor discounts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', 'scheduled', 'expired'
    const type = searchParams.get('type'); // 'percentage', 'fixed_amount', 'tiered'
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    // Validate vendor access
    const vendorValidation = await validateVendorAccess(user.userId);
    if (!vendorValidation.isValid || !vendorValidation.vendorId) {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 403 });
    }

    const connection = await getConnection();
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['vendor_id = ?'];
    let queryParams: any[] = [vendorValidation.vendorId];

    if (search) {
      whereConditions.push('(discount_name LIKE ? OR display_name LIKE ? OR discount_code LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      const now = new Date();
      switch (status) {
        case 'active':
          whereConditions.push('is_active = 1 AND (valid_until IS NULL OR valid_until > ?)');
          queryParams.push(now);
          break;
        case 'inactive':
          whereConditions.push('is_active = 0');
          break;
        case 'scheduled':
          whereConditions.push('is_active = 1 AND valid_from > ?');
          queryParams.push(now);
          break;
        case 'expired':
          whereConditions.push('valid_until IS NOT NULL AND valid_until < ?');
          queryParams.push(now);
          break;
      }
    }

    if (type) {
      whereConditions.push('discount_type = ?');
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM vendor_discounts WHERE ${whereClause}`;
    const [countResult] = await connection.execute<RowDataPacket[]>(countQuery, queryParams);
    const total = countResult[0].total;

    // Get discounts with pagination
    const query = `
      SELECT * FROM vendor_discounts 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const [discounts] = await connection.execute<VendorDiscount[]>(query, queryParams);

    // Parse JSON fields safely
    const formattedDiscounts = discounts.map(discount => parseVendorDiscount(discount));

    return NextResponse.json({
      discounts: formattedDiscounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching vendor discounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new vendor discount
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate vendor access
    const vendorValidation = await validateVendorAccess(user.userId);
    if (!vendorValidation.isValid || !vendorValidation.vendorId) {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      discount_name,
      discount_code,
      display_name,
      description,
      discount_type,
      is_automatic = true,
      discount_value,
      volume_tiers,
      minimum_order_value = 0,
      maximum_discount_amount,
      minimum_quantity = 1,
      applies_to = 'all_vendor_products',
      target_ids,
      customer_types,
      customer_groups,
      allowed_regions,
      excluded_regions,
      valid_from,
      valid_until,
      is_active = true,
      usage_limit_total,
      usage_limit_per_customer,
      stackable_with_coupons = true,
      priority = 0,
      terms_conditions
    } = body;

    // Validate discount data
    const validation = validateDiscountData(body);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    const connection = await getConnection();

    // Check for duplicate discount code within vendor
    if (discount_code) {
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT discount_id FROM vendor_discounts WHERE vendor_id = ? AND discount_code = ?',
        [vendorValidation.vendorId, discount_code]
      );
      if (existing.length > 0) {
        return NextResponse.json({ 
          error: 'Discount code already exists for this vendor' 
        }, { status: 409 });
      }
    }

    // Insert new discount
    const insertQuery = `
      INSERT INTO vendor_discounts (
        vendor_id, discount_name, discount_code, display_name, description,
        discount_type, is_automatic, discount_value, volume_tiers,
        minimum_order_value, maximum_discount_amount, minimum_quantity,
        applies_to, target_ids, customer_types, customer_groups,
        allowed_regions, excluded_regions, valid_from, valid_until,
        is_active, usage_limit_total, usage_limit_per_customer,
        stackable_with_coupons, priority, terms_conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      vendorValidation.vendorId,
      discount_name,
      discount_code,
      display_name,
      description,
      discount_type,
      is_automatic,
      discount_value,
      stringifyJsonSafely(volume_tiers),
      minimum_order_value,
      maximum_discount_amount,
      minimum_quantity,
      applies_to,
      stringifyJsonSafely(target_ids),
      stringifyJsonSafely(customer_types),
      stringifyJsonSafely(customer_groups),
      stringifyJsonSafely(allowed_regions),
      stringifyJsonSafely(excluded_regions),
      valid_from,
      valid_until,
      is_active,
      usage_limit_total,
      usage_limit_per_customer,
      stackable_with_coupons,
      priority,
      terms_conditions
    ];

    const [result] = await connection.execute<any>(insertQuery, insertParams);

    return NextResponse.json({
      message: 'Discount created successfully',
      discount_id: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}