import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OrderModificationRow extends RowDataPacket {
  id: number;
  order_id: number;
  modification_type: string;
  previous_state: string;
  new_state: string;
  item_id: number;
  previous_quantity: number;
  new_quantity: number;
  previous_price: number;
  new_price: number;
  price_difference: number;
  tax_difference: number;
  shipping_difference: number;
  total_difference: number;
  status: string;
  reason_for_modification: string;
  admin_notes: string;
  requires_additional_payment: number;
  refund_amount: number;
  requested_at: string;
  approved_at: string;
  applied_at: string;
  expires_at: string;
}

// GET /api/orders/[id]/modifications - Get modifications for an order
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify order belongs to user (or user is admin)
    const [orderCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (orderCheck[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get modifications for this order
    const [modifications] = await pool.execute<OrderModificationRow[]>(
      `SELECT 
        om.*,
        u1.first_name as created_by_name,
        u1.last_name as created_by_lastname,
        u2.first_name as approved_by_name,
        u2.last_name as approved_by_lastname
      FROM order_modifications om
      LEFT JOIN users u1 ON om.created_by = u1.user_id
      LEFT JOIN users u2 ON om.approved_by = u2.user_id
      WHERE om.order_id = ?
      ORDER BY om.requested_at DESC`,
      [orderId]
    );

    // Get modification items for each modification
    const modificationIds = modifications.map(m => m.id);
    let modificationItems: any[] = [];

    if (modificationIds.length > 0) {
      const [items] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          omi.*,
          p.name as product_name,
          p.slug as product_slug
        FROM order_modification_items omi
        JOIN products p ON omi.product_id = p.product_id
        WHERE omi.modification_id IN (${modificationIds.map(() => '?').join(',')})`,
        modificationIds
      );
      modificationItems = items;
    }

    // Format response
    const formattedModifications = modifications.map(mod => ({
      id: mod.id,
      orderId: mod.order_id,
      type: mod.modification_type,
      status: mod.status,
      reason: mod.reason_for_modification,
      adminNotes: mod.admin_notes,
      
      // Financial impact
      priceDifference: mod.price_difference,
      taxDifference: mod.tax_difference,
      shippingDifference: mod.shipping_difference,
      totalDifference: mod.total_difference,
      requiresAdditionalPayment: Boolean(mod.requires_additional_payment),
      refundAmount: mod.refund_amount,
      
      // Previous and new states
      previousState: mod.previous_state ? JSON.parse(mod.previous_state) : null,
      newState: mod.new_state ? JSON.parse(mod.new_state) : null,
      
      // Timestamps
      requestedAt: mod.requested_at,
      approvedAt: mod.approved_at,
      appliedAt: mod.applied_at,
      expiresAt: mod.expires_at,
      
      // Items affected (if applicable)
      items: modificationItems
        .filter(item => item.modification_id === mod.id)
        .map(item => ({
          id: item.id,
          orderItemId: item.order_item_id,
          productId: item.product_id,
          productName: item.product_name,
          productSlug: item.product_slug,
          action: item.action,
          previousQuantity: item.previous_quantity,
          newQuantity: item.new_quantity,
          previousPrice: item.previous_price,
          newPrice: item.new_price,
          configurationData: item.configuration_data ? JSON.parse(item.configuration_data) : null
        }))
    }));

    return NextResponse.json({
      success: true,
      modifications: formattedModifications,
      total: modifications.length
    });

  } catch (error) {
    console.error('Error fetching order modifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order modifications' },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/modifications - Request a new modification
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      modificationType,
      reason,
      items = [],
      shippingAddress,
      shippingMethod,
      specialInstructions
    } = body;

    if (!modificationType || !reason) {
      return NextResponse.json(
        { error: 'Modification type and reason are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify order can be modified
      const [orderCheck] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          user_id, 
          order_status, 
          can_be_modified, 
          modification_deadline,
          total_amount
        FROM orders 
        WHERE order_id = ?`,
        [orderId]
      );

      if (orderCheck.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderCheck[0];

      if (order.user_id !== user.userId && user.role !== 'admin') {
        throw new Error('Access denied');
      }

      if (!order.can_be_modified) {
        throw new Error('This order can no longer be modified');
      }

      if (order.modification_deadline && new Date() > new Date(order.modification_deadline)) {
        throw new Error('Modification deadline has passed');
      }

      if (!['pending', 'confirmed', 'processing'].includes(order.order_status)) {
        throw new Error('Order status does not allow modifications');
      }

      // Calculate price differences based on modification type
      let priceDifference = 0;
      let taxDifference = 0;
      let shippingDifference = 0;
      let totalDifference = 0;
      let previousState: any = {};
      let newState: any = {};

      if (modificationType === 'item_quantity' || modificationType === 'add_item' || modificationType === 'remove_item') {
        // Calculate item-level changes
        for (const item of items) {
          const { orderItemId, productId, previousQuantity = 0, newQuantity = 0, unitPrice } = item;
          
          const quantityDiff = newQuantity - previousQuantity;
          const itemPriceDiff = quantityDiff * unitPrice;
          priceDifference += itemPriceDiff;
          
          // Rough tax calculation (should be more sophisticated in production)
          const itemTaxDiff = itemPriceDiff * 0.08; // Assume 8% tax rate
          taxDifference += itemTaxDiff;
        }
        
        totalDifference = priceDifference + taxDifference + shippingDifference;
        
        previousState = { items: items.map(i => ({ ...i, quantity: i.previousQuantity })) };
        newState = { items: items.map(i => ({ ...i, quantity: i.newQuantity })) };
        
      } else if (modificationType === 'shipping_address') {
        previousState = { shippingAddress: await getCurrentShippingAddress(connection, orderId) };
        newState = { shippingAddress };
        
      } else if (modificationType === 'shipping_method') {
        previousState = { shippingMethod: await getCurrentShippingMethod(connection, orderId) };
        newState = { shippingMethod };
        // Calculate shipping cost difference here
        
      } else if (modificationType === 'special_instructions') {
        previousState = { specialInstructions: await getCurrentSpecialInstructions(connection, orderId) };
        newState = { specialInstructions };
      }

      // Insert modification request
      const [modResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO order_modifications (
          order_id,
          user_id,
          modification_type,
          previous_state,
          new_state,
          price_difference,
          tax_difference,
          shipping_difference,
          total_difference,
          reason_for_modification,
          requires_additional_payment,
          refund_amount,
          created_by,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
        [
          orderId,
          user.userId,
          modificationType,
          JSON.stringify(previousState),
          JSON.stringify(newState),
          priceDifference,
          taxDifference,
          shippingDifference,
          totalDifference,
          reason,
          totalDifference > 0 ? 1 : 0,
          totalDifference < 0 ? Math.abs(totalDifference) : 0,
          user.userId
        ]
      );

      const modificationId = modResult.insertId;

      // Insert modification items if applicable
      if (items.length > 0) {
        for (const item of items) {
          await connection.execute(
            `INSERT INTO order_modification_items (
              modification_id,
              order_item_id,
              product_id,
              action,
              previous_quantity,
              new_quantity,
              previous_price,
              new_price,
              configuration_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              modificationId,
              item.orderItemId || null,
              item.productId,
              item.action || 'quantity_change',
              item.previousQuantity || 0,
              item.newQuantity || 0,
              item.previousPrice || 0,
              item.newPrice || item.unitPrice || 0,
              item.configurationData ? JSON.stringify(item.configurationData) : null
            ]
          );
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        modificationId,
        message: 'Modification request submitted successfully',
        requiresApproval: true,
        totalDifference,
        requiresAdditionalPayment: totalDifference > 0
      });

    } catch (error) {
      await connection.rollback();
      if (connection && connection.connection && !connection.connection.destroyed) {
        connection.release();
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating order modification:', error);
    if (connection && connection.connection && !connection.connection.destroyed) {
      connection.release();
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create modification request' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getCurrentShippingAddress(connection: any, orderId: number) {
  const [result] = await connection.execute(
    'SELECT shipping_address FROM orders WHERE order_id = ?',
    [orderId]
  );
  return result[0]?.shipping_address ? JSON.parse(result[0].shipping_address) : null;
}

async function getCurrentShippingMethod(connection: any, orderId: number) {
  const [result] = await connection.execute(
    'SELECT shipping_method, shipping_cost FROM orders WHERE order_id = ?',
    [orderId]
  );
  return {
    method: result[0]?.shipping_method,
    cost: result[0]?.shipping_cost
  };
}

async function getCurrentSpecialInstructions(connection: any, orderId: number) {
  const [result] = await connection.execute(
    'SELECT special_instructions FROM orders WHERE order_id = ?',
    [orderId]
  );
  return result[0]?.special_instructions || '';
}