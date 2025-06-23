import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/orders/[id]/modifications/[modId] - Get specific modification
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; modId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = parseInt(params.id);
    const modificationId = parseInt(params.modId);
    
    if (isNaN(orderId) || isNaN(modificationId)) {
      return NextResponse.json(
        { error: 'Invalid ID parameters' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get modification with authorization check
    const [modifications] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        om.*,
        o.user_id as order_user_id,
        u1.first_name as created_by_name,
        u1.last_name as created_by_lastname,
        u2.first_name as approved_by_name,
        u2.last_name as approved_by_lastname
      FROM order_modifications om
      JOIN orders o ON om.order_id = o.order_id
      LEFT JOIN users u1 ON om.created_by = u1.user_id
      LEFT JOIN users u2 ON om.approved_by = u2.user_id
      WHERE om.id = ? AND om.order_id = ?`,
      [modificationId, orderId]
    );

    if (modifications.length === 0) {
      return NextResponse.json(
        { error: 'Modification not found' },
        { status: 404 }
      );
    }

    const modification = modifications[0];

    // Check authorization
    if (modification.order_user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get modification items
    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        omi.*,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price
      FROM order_modification_items omi
      JOIN products p ON omi.product_id = p.product_id
      WHERE omi.modification_id = ?`,
      [modificationId]
    );

    return NextResponse.json({
      success: true,
      modification: {
        id: modification.id,
        orderId: modification.order_id,
        type: modification.modification_type,
        status: modification.status,
        reason: modification.reason_for_modification,
        adminNotes: modification.admin_notes,
        
        // Financial details
        priceDifference: modification.price_difference,
        taxDifference: modification.tax_difference,
        shippingDifference: modification.shipping_difference,
        totalDifference: modification.total_difference,
        requiresAdditionalPayment: Boolean(modification.requires_additional_payment),
        refundAmount: modification.refund_amount,
        
        // State changes
        previousState: modification.previous_state ? JSON.parse(modification.previous_state) : null,
        newState: modification.new_state ? JSON.parse(modification.new_state) : null,
        
        // Timestamps
        requestedAt: modification.requested_at,
        approvedAt: modification.approved_at,
        appliedAt: modification.applied_at,
        expiresAt: modification.expires_at,
        
        // People
        createdBy: modification.created_by_name ? 
          `${modification.created_by_name} ${modification.created_by_lastname}` : 'System',
        approvedBy: modification.approved_by_name ? 
          `${modification.approved_by_name} ${modification.approved_by_lastname}` : null,
        
        // Items
        items: items.map(item => ({
          id: item.id,
          orderItemId: item.order_item_id,
          productId: item.product_id,
          productName: item.product_name,
          productSlug: item.product_slug,
          basePrice: item.base_price,
          action: item.action,
          previousQuantity: item.previous_quantity,
          newQuantity: item.new_quantity,
          previousPrice: item.previous_price,
          newPrice: item.new_price,
          configurationData: item.configuration_data ? JSON.parse(item.configuration_data) : null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching modification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modification' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id]/modifications/[modId] - Update modification status (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; modId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const orderId = parseInt(params.id);
    const modificationId = parseInt(params.modId);
    
    if (isNaN(orderId) || isNaN(modificationId)) {
      return NextResponse.json(
        { error: 'Invalid ID parameters' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, adminNotes } = body;

    if (!['approved', 'rejected', 'applied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current modification
      const [modifications] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM order_modifications WHERE id = ? AND order_id = ?',
        [modificationId, orderId]
      );

      if (modifications.length === 0) {
        throw new Error('Modification not found');
      }

      const modification = modifications[0];

      if (modification.status !== 'pending') {
        throw new Error('Modification has already been processed');
      }

      // Update modification status
      const updateFields = ['status = ?', 'admin_notes = ?', 'approved_by = ?'];
      const updateValues = [status, adminNotes, user.userId];

      if (status === 'approved') {
        updateFields.push('approved_at = NOW()');
      }

      if (status === 'applied') {
        updateFields.push('applied_at = NOW()');
        
        // Apply the actual changes to the order
        await applyModificationToOrder(connection, modification);
      }

      await connection.execute(
        `UPDATE order_modifications SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues, modificationId]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: `Modification ${status} successfully`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating modification status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update modification' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id]/modifications/[modId] - Cancel modification request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; modId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = parseInt(params.id);
    const modificationId = parseInt(params.modId);
    
    if (isNaN(orderId) || isNaN(modificationId)) {
      return NextResponse.json(
        { error: 'Invalid ID parameters' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if user can cancel this modification
    const [modifications] = await pool.execute<RowDataPacket[]>(
      `SELECT om.*, o.user_id as order_user_id
       FROM order_modifications om
       JOIN orders o ON om.order_id = o.order_id
       WHERE om.id = ? AND om.order_id = ?`,
      [modificationId, orderId]
    );

    if (modifications.length === 0) {
      return NextResponse.json(
        { error: 'Modification not found' },
        { status: 404 }
      );
    }

    const modification = modifications[0];

    // Only the order owner or admin can cancel
    if (modification.order_user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Can only cancel pending modifications
    if (modification.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending modifications' },
        { status: 400 }
      );
    }

    // Update status to rejected
    await pool.execute(
      'UPDATE order_modifications SET status = ?, admin_notes = ? WHERE id = ?',
      ['rejected', 'Cancelled by customer', modificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Modification request cancelled'
    });

  } catch (error) {
    console.error('Error cancelling modification:', error);
    return NextResponse.json(
      { error: 'Failed to cancel modification' },
      { status: 500 }
    );
  }
}

// Helper function to apply modifications to the actual order
async function applyModificationToOrder(connection: any, modification: any) {
  const orderId = modification.order_id;
  const modificationType = modification.modification_type;
  const newState = JSON.parse(modification.new_state || '{}');

  switch (modificationType) {
    case 'shipping_address':
      await connection.execute(
        'UPDATE orders SET shipping_address = ? WHERE order_id = ?',
        [JSON.stringify(newState.shippingAddress), orderId]
      );
      break;

    case 'shipping_method':
      await connection.execute(
        'UPDATE orders SET shipping_method = ?, shipping_cost = ? WHERE order_id = ?',
        [newState.shippingMethod.method, newState.shippingMethod.cost, orderId]
      );
      break;

    case 'special_instructions':
      await connection.execute(
        'UPDATE orders SET special_instructions = ? WHERE order_id = ?',
        [newState.specialInstructions, orderId]
      );
      break;

    case 'item_quantity':
    case 'add_item':
    case 'remove_item':
      // Get modification items and apply changes
      const [modItems] = await connection.execute(
        'SELECT * FROM order_modification_items WHERE modification_id = ?',
        [modification.id]
      );

      for (const item of modItems) {
        if (item.action === 'add') {
          // Add new item to order
          await connection.execute(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product_id,
              item.new_quantity,
              item.new_price,
              item.new_quantity * item.new_price
            ]
          );
        } else if (item.action === 'remove') {
          // Remove item from order
          await connection.execute(
            'DELETE FROM order_items WHERE order_item_id = ?',
            [item.order_item_id]
          );
        } else if (item.action === 'quantity_change') {
          // Update existing item
          await connection.execute(
            `UPDATE order_items 
             SET quantity = ?, total_price = quantity * unit_price 
             WHERE order_item_id = ?`,
            [item.new_quantity, item.order_item_id]
          );
        }
      }

      // Recalculate order totals
      const [totals] = await connection.execute(
        'SELECT SUM(total_price) as items_total FROM order_items WHERE order_id = ?',
        [orderId]
      );
      
      const itemsTotal = totals[0].items_total || 0;
      const tax = itemsTotal * 0.08; // Simplified tax calculation
      const newTotal = itemsTotal + tax + (modification.shipping_difference || 0);

      await connection.execute(
        'UPDATE orders SET subtotal = ?, tax_amount = ?, total_amount = ? WHERE order_id = ?',
        [itemsTotal, tax, newTotal, orderId]
      );
      break;

    case 'cancel_order':
      await connection.execute(
        'UPDATE orders SET order_status = ? WHERE order_id = ?',
        ['cancelled', orderId]
      );
      break;
  }
}