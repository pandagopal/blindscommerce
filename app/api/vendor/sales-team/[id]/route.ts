import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

// PUT - Update sales person
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const salesStaffId = params.id;
    const updateData = await request.json();

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Verify sales person belongs to this vendor
      const [salesRows] = await pool.execute(
        'SELECT user_id, vendor_id FROM sales_staff WHERE sales_staff_id = ?',
        [salesStaffId]
      );

      if (!Array.isArray(salesRows) || salesRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Sales person not found' }, { status: 404 });
      }

      const salesPerson = salesRows[0] as any;
      if (salesPerson.vendor_id !== vendorId) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Unauthorized to update this sales person' }, { status: 403 });
      }

      // Update sales_staff record
      const updateFields = [];
      const updateValues = [];

      if (updateData.territory !== undefined) {
        updateFields.push('territory = ?');
        updateValues.push(updateData.territory);
      }
      if (updateData.commissionRate !== undefined) {
        updateFields.push('commission_rate = ?');
        updateValues.push(updateData.commissionRate);
      }
      if (updateData.targetSales !== undefined) {
        updateFields.push('target_sales = ?');
        updateValues.push(updateData.targetSales);
      }
      if (updateData.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(updateData.isActive ? 1 : 0);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(salesStaffId);

        await pool.execute(
          `UPDATE sales_staff SET ${updateFields.join(', ')} WHERE sales_staff_id = ?`,
          updateValues
        );
      }

      // Update user record if needed
      const userUpdateFields = [];
      const userUpdateValues = [];

      if (updateData.firstName !== undefined) {
        userUpdateFields.push('first_name = ?');
        userUpdateValues.push(updateData.firstName);
      }
      if (updateData.lastName !== undefined) {
        userUpdateFields.push('last_name = ?');
        userUpdateValues.push(updateData.lastName);
      }
      if (updateData.phone !== undefined) {
        userUpdateFields.push('phone = ?');
        userUpdateValues.push(updateData.phone);
      }

      if (userUpdateFields.length > 0) {
        userUpdateFields.push('updated_at = NOW()');
        userUpdateValues.push(salesPerson.user_id);

        await pool.execute(
          `UPDATE users SET ${userUpdateFields.join(', ')} WHERE user_id = ?`,
          userUpdateValues
        );
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Sales person updated successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Update sales person error:', error);
    return NextResponse.json(
      { error: 'Failed to update sales person' },
      { status: 500 }
    );
  }
}

// DELETE - Remove sales person from vendor's team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const salesStaffId = params.id;
    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Verify sales person belongs to this vendor
      const [salesRows] = await pool.execute(
        'SELECT user_id, vendor_id FROM sales_staff WHERE sales_staff_id = ?',
        [salesStaffId]
      );

      if (!Array.isArray(salesRows) || salesRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Sales person not found' }, { status: 404 });
      }

      const salesPerson = salesRows[0] as any;
      if (salesPerson.vendor_id !== vendorId) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Unauthorized to remove this sales person' }, { status: 403 });
      }

      // Check if sales person has any orders - if so, just deactivate instead of delete
      const [orderRows] = await pool.execute(
        'SELECT COUNT(*) as order_count FROM orders WHERE sales_staff_id = ?',
        [salesStaffId]
      );

      const orderCount = (orderRows[0] as any).order_count;

      if (orderCount > 0) {
        // Deactivate instead of delete to preserve order history
        await pool.execute(
          'UPDATE sales_staff SET is_active = 0, vendor_id = NULL, updated_at = NOW() WHERE sales_staff_id = ?',
          [salesStaffId]
        );
      } else {
        // Safe to delete as no orders exist
        await pool.execute(
          'DELETE FROM sales_staff WHERE sales_staff_id = ?',
          [salesStaffId]
        );
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: orderCount > 0 
          ? 'Sales person deactivated and removed from team (order history preserved)' 
          : 'Sales person removed from team successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Remove sales person error:', error);
    return NextResponse.json(
      { error: 'Failed to remove sales person' },
      { status: 500 }
    );
  }
}