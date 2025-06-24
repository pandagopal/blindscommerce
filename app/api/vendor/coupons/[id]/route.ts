import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateVendorAccess } from '@/lib/security/validation';
import { RowDataPacket } from 'mysql2';
// NO CACHING FOR DASHBOARDS - Dashboard data must always be fresh
// import { CacheInvalidation } from '@/lib/cache';

// GET - Get specific vendor coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const couponId = parseInt(params.id);
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 });
    }

    const pool = await getPool();

    const [coupons] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM vendor_coupons WHERE coupon_id = ? AND vendor_id = ?',
      [couponId, vendorValidation.vendorId]
    );

    if (coupons.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const coupon = coupons[0];

    // Parse JSON fields
    const formattedCoupon = {
      ...coupon,
      target_ids: coupon.target_ids ? JSON.parse(coupon.target_ids) : null,
      excluded_ids: coupon.excluded_ids ? JSON.parse(coupon.excluded_ids) : null,
      customer_types: coupon.customer_types ? JSON.parse(coupon.customer_types) : null,
      customer_groups: coupon.customer_groups ? JSON.parse(coupon.customer_groups) : null,
      allowed_regions: coupon.allowed_regions ? JSON.parse(coupon.allowed_regions) : null,
      excluded_regions: coupon.excluded_regions ? JSON.parse(coupon.excluded_regions) : null,
    };

    return NextResponse.json({ coupon: formattedCoupon });

  } catch (error) {
    console.error('Error fetching vendor coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vendor coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const couponId = parseInt(params.id);
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      coupon_code,
      coupon_name,
      display_name,
      description,
      discount_type,
      discount_value,
      maximum_discount_amount,
      minimum_order_value,
      minimum_quantity,
      applies_to,
      target_ids,
      excluded_ids,
      customer_types,
      customer_groups,
      allowed_regions,
      excluded_regions,
      valid_from,
      valid_until,
      is_active,
      usage_limit_total,
      usage_limit_per_customer,
      stackable_with_discounts,
      stackable_with_other_coupons,
      priority,
      terms_conditions
    } = body;

    const pool = await getPool();

    // Verify coupon exists and belongs to vendor
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT coupon_id FROM vendor_coupons WHERE coupon_id = ? AND vendor_id = ?',
      [couponId, vendorValidation.vendorId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Check for duplicate coupon code within vendor (excluding current coupon)
    if (coupon_code) {
      const [duplicates] = await pool.execute<RowDataPacket[]>(
        'SELECT coupon_id FROM vendor_coupons WHERE vendor_id = ? AND coupon_code = ? AND coupon_id != ?',
        [vendorValidation.vendorId, coupon_code, couponId]
      );
      if (duplicates.length > 0) {
        return NextResponse.json({ 
          error: 'Coupon code already exists for this vendor' 
        }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (coupon_code !== undefined) {
      updateFields.push('coupon_code = ?');
      updateParams.push(coupon_code);
    }
    if (coupon_name !== undefined) {
      updateFields.push('coupon_name = ?');
      updateParams.push(coupon_name);
    }
    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateParams.push(display_name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    if (discount_type !== undefined) {
      updateFields.push('discount_type = ?');
      updateParams.push(discount_type);
    }
    if (discount_value !== undefined) {
      updateFields.push('discount_value = ?');
      updateParams.push(discount_value);
    }
    if (maximum_discount_amount !== undefined) {
      updateFields.push('maximum_discount_amount = ?');
      updateParams.push(maximum_discount_amount);
    }
    if (minimum_order_value !== undefined) {
      updateFields.push('minimum_order_value = ?');
      updateParams.push(minimum_order_value);
    }
    if (minimum_quantity !== undefined) {
      updateFields.push('minimum_quantity = ?');
      updateParams.push(minimum_quantity);
    }
    if (applies_to !== undefined) {
      updateFields.push('applies_to = ?');
      updateParams.push(applies_to);
    }
    if (target_ids !== undefined) {
      updateFields.push('target_ids = ?');
      updateParams.push(target_ids ? JSON.stringify(target_ids) : null);
    }
    if (excluded_ids !== undefined) {
      updateFields.push('excluded_ids = ?');
      updateParams.push(excluded_ids ? JSON.stringify(excluded_ids) : null);
    }
    if (customer_types !== undefined) {
      updateFields.push('customer_types = ?');
      updateParams.push(customer_types ? JSON.stringify(customer_types) : null);
    }
    if (customer_groups !== undefined) {
      updateFields.push('customer_groups = ?');
      updateParams.push(customer_groups ? JSON.stringify(customer_groups) : null);
    }
    if (allowed_regions !== undefined) {
      updateFields.push('allowed_regions = ?');
      updateParams.push(allowed_regions ? JSON.stringify(allowed_regions) : null);
    }
    if (excluded_regions !== undefined) {
      updateFields.push('excluded_regions = ?');
      updateParams.push(excluded_regions ? JSON.stringify(excluded_regions) : null);
    }
    if (valid_from !== undefined) {
      updateFields.push('valid_from = ?');
      updateParams.push(valid_from);
    }
    if (valid_until !== undefined) {
      updateFields.push('valid_until = ?');
      updateParams.push(valid_until);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active);
    }
    if (usage_limit_total !== undefined) {
      updateFields.push('usage_limit_total = ?');
      updateParams.push(usage_limit_total);
    }
    if (usage_limit_per_customer !== undefined) {
      updateFields.push('usage_limit_per_customer = ?');
      updateParams.push(usage_limit_per_customer);
    }
    if (stackable_with_discounts !== undefined) {
      updateFields.push('stackable_with_discounts = ?');
      updateParams.push(stackable_with_discounts);
    }
    if (stackable_with_other_coupons !== undefined) {
      updateFields.push('stackable_with_other_coupons = ?');
      updateParams.push(stackable_with_other_coupons);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateParams.push(priority);
    }
    if (terms_conditions !== undefined) {
      updateFields.push('terms_conditions = ?');
      updateParams.push(terms_conditions);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const updateQuery = `
      UPDATE vendor_coupons 
      SET ${updateFields.join(', ')}
      WHERE coupon_id = ? AND vendor_id = ?
    `;
    updateParams.push(couponId, vendorValidation.vendorId);

    await pool.execute(updateQuery, updateParams);

    // Invalidate vendor coupon cache
    // NO CACHING FOR DASHBOARDS - Cache invalidation not needed

    return NextResponse.json({ message: 'Coupon updated successfully' });

  } catch (error) {
    console.error('Error updating vendor coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}