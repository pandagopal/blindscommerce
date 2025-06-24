import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateVendorAccess } from '@/lib/security/validation';
import { RowDataPacket } from 'mysql2';
import { 
  parseVendorCoupon, 
  validateCouponData, 
  stringifyJsonSafely 
} from '@/lib/utils/vendorDiscountHelpers';
// NO CACHING FOR DASHBOARDS - Dashboard data must always be fresh
// import { discountsCache, CacheKeys, CacheInvalidation } from '@/lib/cache';

interface VendorCoupon extends RowDataPacket {
  coupon_id: number;
  vendor_id: number;
  coupon_code: string;
  coupon_name: string;
  display_name: string | null;
  description: string | null;
  terms_conditions: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'upgrade';
  discount_value: number;
  maximum_discount_amount: number | null;
  minimum_order_value: number;
  minimum_quantity: number;
  applies_to: 'all_vendor_products' | 'specific_products' | 'specific_categories';
  target_ids: any;
  excluded_ids: any;
  customer_types: any;
  customer_groups: any;
  first_time_customers_only: boolean;
  existing_customers_only: boolean;
  allowed_regions: any;
  excluded_regions: any;
  usage_limit_total: number | null;
  usage_limit_per_customer: number;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  auto_activate: boolean;
  auto_deactivate: boolean;
  stackable_with_discounts: boolean;
  stackable_with_other_coupons: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: number;
}

// GET - List vendor coupons with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', 'scheduled', 'expired'
    const type = searchParams.get('type'); // 'percentage', 'fixed_amount', 'free_shipping', 'upgrade'
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    // Validate vendor access
    const vendorValidation = await validateVendorAccess(user.userId);
    if (!vendorValidation.isValid || !vendorValidation.vendorId) {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 403 });
    }

    // NO CACHING FOR DASHBOARDS - Always fetch fresh data for vendor dashboard

    const pool = await getPool();
    const offset = Math.max(0, (page - 1) * limit);

    // Build WHERE clause
    let whereConditions = ['vendor_id = ?'];
    let queryParams: any[] = [vendorValidation.vendorId];

    if (search) {
      whereConditions.push('(coupon_name LIKE ? OR display_name LIKE ? OR coupon_code LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      const now = new Date();
      switch (status) {
        case 'active':
          whereConditions.push('is_active = 1 AND valid_from <= ? AND (valid_until IS NULL OR valid_until > ?)');
          queryParams.push(now, now);
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
    const countQuery = `SELECT COUNT(*) as total FROM vendor_coupons WHERE ${whereClause}`;
    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, queryParams);
    const total = countResult[0].total;

    // Get coupons with pagination
    // Note: LIMIT and OFFSET must be included directly in the query string for MySQL2
    const query = `
      SELECT * FROM vendor_coupons 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;
    // Don't push limit and offset to queryParams

    const [coupons] = await pool.execute<VendorCoupon[]>(query, queryParams);

    // Parse JSON fields safely
    const formattedCoupons = coupons.map(coupon => parseVendorCoupon(coupon));

    const responseData = {
      coupons: formattedCoupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // NO CACHING FOR DASHBOARDS - Return fresh data directly
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching vendor coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new vendor coupon
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
      coupon_code,
      coupon_name,
      display_name,
      description,
      terms_conditions,
      discount_type,
      discount_value,
      maximum_discount_amount,
      minimum_order_value = 0,
      minimum_quantity = 1,
      applies_to = 'all_vendor_products',
      target_ids,
      excluded_ids,
      customer_types,
      customer_groups,
      first_time_customers_only = false,
      existing_customers_only = false,
      allowed_regions,
      excluded_regions,
      usage_limit_total,
      usage_limit_per_customer = 1,
      valid_from,
      valid_until,
      is_active = true,
      auto_activate = false,
      auto_deactivate = false,
      stackable_with_discounts = true,
      stackable_with_other_coupons = false,
      priority = 0
    } = body;

    // Validate coupon data
    const validation = validateCouponData(body);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    const pool = await getPool();

    // Check for duplicate coupon code globally
    const [existingGlobal] = await pool.execute<RowDataPacket[]>(
      'SELECT coupon_id FROM vendor_coupons WHERE coupon_code = ?',
      [coupon_code]
    );
    if (existingGlobal.length > 0) {
      return NextResponse.json({ 
        error: 'Coupon code already exists. Please choose a different code.' 
      }, { status: 409 });
    }

    // Check vendor's coupon limits (optional business rule)
    const [vendorCoupons] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM vendor_coupons WHERE vendor_id = ? AND is_active = 1',
      [vendorValidation.vendorId]
    );
    
    // Example: limit vendors to 50 active coupons
    if (vendorCoupons[0].count >= 50) {
      return NextResponse.json({ 
        error: 'Maximum number of active coupons reached (50). Please deactivate some coupons first.' 
      }, { status: 429 });
    }

    // Insert new coupon
    const insertQuery = `
      INSERT INTO vendor_coupons (
        vendor_id, coupon_code, coupon_name, display_name, description, terms_conditions,
        discount_type, discount_value, maximum_discount_amount, minimum_order_value, minimum_quantity,
        applies_to, target_ids, excluded_ids, customer_types, customer_groups,
        first_time_customers_only, existing_customers_only, allowed_regions, excluded_regions,
        usage_limit_total, usage_limit_per_customer, valid_from, valid_until,
        is_active, auto_activate, auto_deactivate, stackable_with_discounts,
        stackable_with_other_coupons, priority, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      vendorValidation.vendorId,
      coupon_code,
      coupon_name,
      display_name,
      description,
      terms_conditions,
      discount_type,
      discount_value,
      maximum_discount_amount,
      minimum_order_value,
      minimum_quantity,
      applies_to,
      stringifyJsonSafely(target_ids),
      stringifyJsonSafely(excluded_ids),
      stringifyJsonSafely(customer_types),
      stringifyJsonSafely(customer_groups),
      first_time_customers_only,
      existing_customers_only,
      stringifyJsonSafely(allowed_regions),
      stringifyJsonSafely(excluded_regions),
      usage_limit_total,
      usage_limit_per_customer,
      valid_from,
      valid_until,
      is_active,
      auto_activate,
      auto_deactivate,
      stackable_with_discounts,
      stackable_with_other_coupons,
      priority,
      user.userId
    ];

    const [result] = await pool.execute<any>(insertQuery, insertParams);

    // Invalidate vendor coupon cache
    // NO CACHING FOR DASHBOARDS - Cache invalidation not needed

    return NextResponse.json({
      message: 'Coupon created successfully',
      coupon_id: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}