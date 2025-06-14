import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateVendorAccess } from '@/lib/security/validation';
import { RowDataPacket } from 'mysql2';

// POST - Bulk operations on vendor discounts
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
    const { action, discount_ids, data } = body;

    if (!action || !Array.isArray(discount_ids) || discount_ids.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, discount_ids' 
      }, { status: 400 });
    }

    const connection = await getConnection();

    // Verify all discounts belong to the vendor
    const placeholders = discount_ids.map(() => '?').join(',');
    const [discounts] = await connection.execute<RowDataPacket[]>(
      `SELECT discount_id FROM vendor_discounts WHERE discount_id IN (${placeholders}) AND vendor_id = ?`,
      [...discount_ids, vendorValidation.vendorId]
    );

    if (discounts.length !== discount_ids.length) {
      return NextResponse.json({ 
        error: 'Some discounts not found or do not belong to your vendor account' 
      }, { status: 404 });
    }

    let updateQuery = '';
    let updateParams: any[] = [];
    let message = '';

    switch (action) {
      case 'activate':
        updateQuery = `UPDATE vendor_discounts SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE discount_id IN (${placeholders}) AND vendor_id = ?`;
        updateParams = [...discount_ids, vendorValidation.vendorId];
        message = `${discount_ids.length} discounts activated successfully`;
        break;

      case 'deactivate':
        updateQuery = `UPDATE vendor_discounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE discount_id IN (${placeholders}) AND vendor_id = ?`;
        updateParams = [...discount_ids, vendorValidation.vendorId];
        message = `${discount_ids.length} discounts deactivated successfully`;
        break;

      case 'delete':
        // Check if any discounts have recent usage
        const [recentUsage] = await connection.execute<RowDataPacket[]>(
          `SELECT DISTINCT discount_id FROM vendor_discount_usage 
           WHERE discount_id IN (${placeholders}) AND applied_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
          discount_ids
        );

        if (recentUsage.length > 0) {
          const usedDiscountIds = recentUsage.map(row => row.discount_id);
          return NextResponse.json({ 
            error: `Cannot delete discounts with recent usage: ${usedDiscountIds.join(', ')}. Consider deactivating instead.` 
          }, { status: 409 });
        }

        updateQuery = `DELETE FROM vendor_discounts WHERE discount_id IN (${placeholders}) AND vendor_id = ?`;
        updateParams = [...discount_ids, vendorValidation.vendorId];
        message = `${discount_ids.length} discounts deleted successfully`;
        break;

      case 'duplicate':
        // Duplicate selected discounts
        const [originalDiscounts] = await connection.execute<RowDataPacket[]>(
          `SELECT * FROM vendor_discounts WHERE discount_id IN (${placeholders}) AND vendor_id = ?`,
          [...discount_ids, vendorValidation.vendorId]
        );

        const insertPromises = originalDiscounts.map(async (discount: any) => {
          // Generate new discount code/name
          const newCode = discount.discount_code ? `${discount.discount_code}_COPY_${Date.now()}` : null;
          const newName = `${discount.discount_name}_copy_${Date.now()}`;

          const insertQuery = `
            INSERT INTO vendor_discounts (
              vendor_id, discount_name, discount_code, display_name, description,
              discount_type, is_automatic, discount_value, volume_tiers,
              minimum_order_value, maximum_discount_amount, minimum_quantity,
              applies_to, target_ids, customer_types, customer_groups,
              allowed_regions, excluded_regions, valid_from, valid_until,
              is_active, usage_limit_total, usage_limit_per_customer,
              stackable_with_coupons, priority, terms_conditions
            ) SELECT 
              vendor_id, ?, ?, display_name, description,
              discount_type, is_automatic, discount_value, volume_tiers,
              minimum_order_value, maximum_discount_amount, minimum_quantity,
              applies_to, target_ids, customer_types, customer_groups,
              allowed_regions, excluded_regions, valid_from, valid_until,
              0, usage_limit_total, usage_limit_per_customer,
              stackable_with_coupons, priority, terms_conditions
            FROM vendor_discounts WHERE discount_id = ?
          `;

          return connection.execute(insertQuery, [newName, newCode, discount.discount_id]);
        });

        await Promise.all(insertPromises);
        message = `${discount_ids.length} discounts duplicated successfully`;
        break;

      case 'update_dates':
        if (!data || !data.valid_from) {
          return NextResponse.json({ 
            error: 'valid_from date is required for date updates' 
          }, { status: 400 });
        }

        const dateUpdateFields = ['valid_from = ?'];
        const dateParams = [data.valid_from];

        if (data.valid_until !== undefined) {
          dateUpdateFields.push('valid_until = ?');
          dateParams.push(data.valid_until);
        }

        updateQuery = `UPDATE vendor_discounts SET ${dateUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE discount_id IN (${placeholders}) AND vendor_id = ?`;
        updateParams = [...dateParams, ...discount_ids, vendorValidation.vendorId];
        message = `${discount_ids.length} discounts updated with new dates`;
        break;

      case 'update_priority':
        if (!data || data.priority === undefined) {
          return NextResponse.json({ 
            error: 'priority value is required for priority updates' 
          }, { status: 400 });
        }

        updateQuery = `UPDATE vendor_discounts SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE discount_id IN (${placeholders}) AND vendor_id = ?`;
        updateParams = [data.priority, ...discount_ids, vendorValidation.vendorId];
        message = `${discount_ids.length} discounts updated with new priority`;
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: activate, deactivate, delete, duplicate, update_dates, update_priority' 
        }, { status: 400 });
    }

    if (updateQuery) {
      await connection.execute(updateQuery, updateParams);
    }

    return NextResponse.json({ 
      message,
      processed_count: discount_ids.length 
    });

  } catch (error) {
    console.error('Error performing bulk discount operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}