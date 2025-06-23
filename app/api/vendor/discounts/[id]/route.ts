import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateVendorAccess } from '@/lib/security/validation';
import { RowDataPacket } from 'mysql2';
import { CacheInvalidation } from '@/lib/cache';

// GET - Get specific vendor discount
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

    const discountId = parseInt(params.id);
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const pool = await getPool();

    const [discounts] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM vendor_discounts WHERE discount_id = ? AND vendor_id = ?',
      [discountId, vendorValidation.vendorId]
    );

    if (discounts.length === 0) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    const discount = discounts[0];

    // Parse JSON fields
    const formattedDiscount = {
      ...discount,
      volume_tiers: discount.volume_tiers ? JSON.parse(discount.volume_tiers) : null,
      target_ids: discount.target_ids ? JSON.parse(discount.target_ids) : null,
      customer_types: discount.customer_types ? JSON.parse(discount.customer_types) : null,
      customer_groups: discount.customer_groups ? JSON.parse(discount.customer_groups) : null,
      allowed_regions: discount.allowed_regions ? JSON.parse(discount.allowed_regions) : null,
      excluded_regions: discount.excluded_regions ? JSON.parse(discount.excluded_regions) : null,
    };

    return NextResponse.json({ discount: formattedDiscount });

  } catch (error) {
    console.error('Error fetching vendor discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vendor discount
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

    const discountId = parseInt(params.id);
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      discount_name,
      discount_code,
      display_name,
      description,
      discount_type,
      is_automatic,
      discount_value,
      volume_tiers,
      minimum_order_value,
      maximum_discount_amount,
      minimum_quantity,
      applies_to,
      target_ids,
      customer_types,
      customer_groups,
      allowed_regions,
      excluded_regions,
      valid_from,
      valid_until,
      is_active,
      usage_limit_total,
      usage_limit_per_customer,
      stackable_with_coupons,
      priority,
      terms_conditions
    } = body;

    const pool = await getPool();

    // Verify discount exists and belongs to vendor
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT discount_id FROM vendor_discounts WHERE discount_id = ? AND vendor_id = ?',
      [discountId, vendorValidation.vendorId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    // Check for duplicate discount code within vendor (excluding current discount)
    if (discount_code) {
      const [duplicates] = await pool.execute<RowDataPacket[]>(
        'SELECT discount_id FROM vendor_discounts WHERE vendor_id = ? AND discount_code = ? AND discount_id != ?',
        [vendorValidation.vendorId, discount_code, discountId]
      );
      if (duplicates.length > 0) {
        return NextResponse.json({ 
          error: 'Discount code already exists for this vendor' 
        }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (discount_name !== undefined) {
      updateFields.push('discount_name = ?');
      updateParams.push(discount_name);
    }
    if (discount_code !== undefined) {
      updateFields.push('discount_code = ?');
      updateParams.push(discount_code);
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
    if (is_automatic !== undefined) {
      updateFields.push('is_automatic = ?');
      updateParams.push(is_automatic);
    }
    if (discount_value !== undefined) {
      updateFields.push('discount_value = ?');
      updateParams.push(discount_value);
    }
    if (volume_tiers !== undefined) {
      updateFields.push('volume_tiers = ?');
      updateParams.push(volume_tiers ? JSON.stringify(volume_tiers) : null);
    }
    if (minimum_order_value !== undefined) {
      updateFields.push('minimum_order_value = ?');
      updateParams.push(minimum_order_value);
    }
    if (maximum_discount_amount !== undefined) {
      updateFields.push('maximum_discount_amount = ?');
      updateParams.push(maximum_discount_amount);
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
    if (stackable_with_coupons !== undefined) {
      updateFields.push('stackable_with_coupons = ?');
      updateParams.push(stackable_with_coupons);
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
      UPDATE vendor_discounts 
      SET ${updateFields.join(', ')}
      WHERE discount_id = ? AND vendor_id = ?
    `;
    updateParams.push(discountId, vendorValidation.vendorId);

    await pool.execute(updateQuery, updateParams);

    // Invalidate vendor discount cache
    CacheInvalidation.vendor(vendorValidation.vendorId);

    return NextResponse.json({ message: 'Discount updated successfully' });

  } catch (error) {
    console.error('Error updating vendor discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete vendor discount
export async function DELETE(
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

    const discountId = parseInt(params.id);
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const pool = await getPool();

    // Check if discount is being used in active carts or recent orders
    const [activeUsage] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM vendor_discount_usage 
       WHERE discount_id = ? AND applied_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [discountId]
    );

    if (activeUsage[0].count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete discount with recent usage. Consider deactivating instead.' 
      }, { status: 409 });
    }

    // Delete the discount
    const [result] = await pool.execute<any>(
      'DELETE FROM vendor_discounts WHERE discount_id = ? AND vendor_id = ?',
      [discountId, vendorValidation.vendorId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    // Invalidate vendor discount cache
    CacheInvalidation.vendor(vendorValidation.vendorId);

    return NextResponse.json({ message: 'Discount deleted successfully' });

  } catch (error) {
    console.error('Error deleting vendor discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}