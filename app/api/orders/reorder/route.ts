import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  configuration?: any;
  product_name: string;
  is_active: boolean;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  customer_id: number;
  status: string;
}

interface OrderItemRow extends RowDataPacket {
  product_id: number;
  quantity: number;
  unit_price: number;
  configuration: string;
  product_name: string;
  is_active: boolean;
  current_price: number;
}

export async function POST(request: NextRequest) {
  try {
    const pool = await getPool();
    const body = await request.json();
    
    const { order_id, customer_id } = body;

    // Validate required fields
    if (!order_id || !customer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, customer_id' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to customer
    const [orders] = await pool.execute<OrderRow[]>(
      `SELECT order_id, customer_id, status FROM orders WHERE order_id = ? AND customer_id = ?`,
      [order_id, customer_id]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to customer' },
        { status: 404 }
      );
    }

    // Get order items with current product status and pricing
    const [orderItems] = await pool.execute<OrderItemRow[]>(
      `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.configuration,
              p.name as product_name, p.is_active, p.base_price as current_price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No items found in the original order' },
        { status: 404 }
      );
    }

    const results = {
      available_items: [] as any[],
      unavailable_items: [] as any[],
      price_changes: [] as any[],
      total_items: orderItems.length,
      cart_items_added: 0
    };

    // Process each item
    for (const item of orderItems) {
      const itemInfo = {
        product_id: item.product_id,
        product_name: item.product_name,
        original_quantity: item.quantity,
        original_price: item.unit_price,
        current_price: item.current_price,
        configuration: item.configuration ? JSON.parse(item.configuration) : null
      };

      if (!item.is_active) {
        // Product is discontinued or inactive
        results.unavailable_items.push({
          ...itemInfo,
          reason: 'Product is no longer available'
        });
      } else {
        // Product is available
        results.available_items.push(itemInfo);

        // Check for price changes
        if (Math.abs(item.unit_price - item.current_price) > 0.01) {
          results.price_changes.push({
            ...itemInfo,
            price_difference: item.current_price - item.unit_price,
            price_change_percent: ((item.current_price - item.unit_price) / item.unit_price) * 100
          });
        }

        // Add to cart
        try {
          const configuration_json = item.configuration || '{}';
          
          await pool.execute(
            `INSERT INTO cart_items 
             (cart_id, product_id, quantity, unit_price, configuration, added_date)
             SELECT c.cart_id, ?, ?, ?, ?, NOW()
             FROM carts c 
             WHERE c.customer_id = ? AND c.status = 'active'
             LIMIT 1`,
            [item.product_id, item.quantity, item.current_price, configuration_json, customer_id]
          );

          results.cart_items_added++;
        } catch (cartError) {
          console.error('Error adding item to cart:', cartError);
          // If cart addition fails, still track as available but note the issue
          results.available_items[results.available_items.length - 1].cart_error = 'Failed to add to cart';
        }
      }
    }

    // Update cart totals if items were added
    if (results.cart_items_added > 0) {
      await pool.execute(
        `UPDATE carts 
         SET updated_date = NOW(),
             subtotal = (
               SELECT COALESCE(SUM(ci.quantity * ci.unit_price), 0)
               FROM cart_items ci 
               WHERE ci.cart_id = carts.cart_id
             )
         WHERE customer_id = ? AND status = 'active'`,
        [customer_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reorder processed: ${results.cart_items_added} items added to cart`,
      results
    });

  } catch (error) {
    console.error('Error processing reorder:', error);
    return NextResponse.json(
      { error: 'Failed to process reorder' },
      { status: 500 }
    );
  }
}

// Get reorder preview without adding to cart
export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const customer_id = searchParams.get('customer_id');

    if (!order_id || !customer_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: order_id, customer_id' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to customer
    const [orders] = await pool.execute<OrderRow[]>(
      `SELECT order_id, customer_id, order_date, total_amount FROM orders 
       WHERE order_id = ? AND customer_id = ?`,
      [order_id, customer_id]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to customer' },
        { status: 404 }
      );
    }

    // Get order items with current product status and pricing
    const [orderItems] = await pool.execute<OrderItemRow[]>(
      `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.configuration,
              p.name as product_name, p.is_active, p.base_price as current_price,
              p.slug as product_slug
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    const preview = {
      order_info: orders[0],
      available_items: [] as any[],
      unavailable_items: [] as any[],
      price_changes: [] as any[],
      summary: {
        total_items: orderItems.length,
        available_count: 0,
        unavailable_count: 0,
        original_total: 0,
        current_total: 0
      }
    };

    // Process each item for preview
    for (const item of orderItems) {
      const itemInfo = {
        product_id: item.product_id,
        product_name: item.product_name,
        product_slug: item.product_slug,
        quantity: item.quantity,
        original_price: item.unit_price,
        current_price: item.current_price,
        line_total_original: item.quantity * item.unit_price,
        line_total_current: item.quantity * item.current_price,
        configuration: item.configuration ? JSON.parse(item.configuration) : null
      };

      preview.summary.original_total += itemInfo.line_total_original;

      if (!item.is_active) {
        preview.unavailable_items.push({
          ...itemInfo,
          reason: 'Product is no longer available'
        });
        preview.summary.unavailable_count++;
      } else {
        preview.available_items.push(itemInfo);
        preview.summary.available_count++;
        preview.summary.current_total += itemInfo.line_total_current;

        // Check for price changes
        if (Math.abs(item.unit_price - item.current_price) > 0.01) {
          preview.price_changes.push({
            product_id: item.product_id,
            product_name: item.product_name,
            original_price: item.unit_price,
            current_price: item.current_price,
            price_difference: item.current_price - item.unit_price,
            price_change_percent: ((item.current_price - item.unit_price) / item.unit_price) * 100
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      preview
    });

  } catch (error) {
    console.error('Error generating reorder preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate reorder preview' },
      { status: 500 }
    );
  }
}