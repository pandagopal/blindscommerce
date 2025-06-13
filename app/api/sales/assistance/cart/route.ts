import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { pusher } from '@/lib/pusher';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// Helper function to verify assistance session permissions
async function verifySessionPermissions(connection: any, sessionId: number, salesStaffId: number, requiredPermission: string) {
  const [sessionRows] = await connection.execute(
    `SELECT permissions, status, customer_user_id, customer_cart_id 
     FROM sales_assistance_sessions 
     WHERE session_id = ? AND sales_staff_id = ? AND status = 'active'`,
    [sessionId, salesStaffId]
  );

  if (!Array.isArray(sessionRows) || sessionRows.length === 0) {
    throw new Error('Invalid or inactive assistance session');
  }

  const session = sessionRows[0] as any;
  const permissions = JSON.parse(session.permissions || '{}');

  if (!permissions[requiredPermission]) {
    throw new Error(`Permission denied: ${requiredPermission}`);
  }

  return session;
}

// GET - Get customer cart details (for sales staff)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Assistance session ID is required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verify user is sales staff
      const [salesStaffRows] = await connection.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [user.userId]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        return NextResponse.json({ 
          error: 'Only sales staff can access customer carts' 
        }, { status: 403 });
      }

      const salesStaffId = (salesStaffRows[0] as any).sales_staff_id;

      // Verify session and permissions
      const assistanceSession = await verifySessionPermissions(
        connection, 
        parseInt(sessionId), 
        salesStaffId, 
        'view_cart'
      );

      if (!assistanceSession.customer_cart_id) {
        return NextResponse.json({
          success: true,
          cart: null,
          message: 'Customer has no active cart'
        });
      }

      // Get cart details
      const [cartRows] = await connection.execute(
        `SELECT 
          c.*,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.email as customer_email
        FROM carts c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.cart_id = ?`,
        [assistanceSession.customer_cart_id]
      );

      // Get cart items with full details
      const [cartItems] = await connection.execute(
        `SELECT 
          ci.*,
          p.name as product_name,
          p.description as product_description,
          p.price as current_price,
          p.stock_quantity,
          p.slug as product_slug,
          vp.vendor_id,
          vi.company_name as vendor_name,
          -- Calculate line total
          (ci.quantity * ci.unit_price) as line_total,
          -- Check for applied discounts
          ci.discount_amount,
          ci.coupon_code
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
        LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at ASC`,
        [assistanceSession.customer_cart_id]
      );

      const cart = cartRows[0] as any;
      
      return NextResponse.json({
        success: true,
        cart: {
          cartId: cart.cart_id,
          status: cart.status,
          totalAmount: cart.total_amount,
          itemCount: cart.item_count,
          createdAt: cart.created_at,
          updatedAt: cart.updated_at,
          customer: {
            firstName: cart.customer_first_name,
            lastName: cart.customer_last_name,
            email: cart.customer_email
          },
          items: cartItems
        },
        sessionInfo: {
          sessionId: assistanceSession.session_id,
          customerId: assistanceSession.customer_user_id,
          permissions: JSON.parse(assistanceSession.permissions || '{}')
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get customer cart error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get customer cart' },
      { status: 500 }
    );
  }
}

// POST - Modify customer cart (add/update items)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      sessionId, 
      action, 
      productId, 
      quantity, 
      customOptions,
      discountAmount,
      couponCode,
      itemId 
    } = await request.json();

    if (!sessionId || !action) {
      return NextResponse.json({ 
        error: 'Session ID and action are required' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      await connection.beginTransaction();

      // Verify user is sales staff
      const [salesStaffRows] = await connection.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND is_active = 1',
        [user.userId]
      );

      if (!Array.isArray(salesStaffRows) || salesStaffRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ 
          error: 'Only sales staff can modify customer carts' 
        }, { status: 403 });
      }

      const salesStaffId = (salesStaffRows[0] as any).sales_staff_id;

      // Verify session and permissions based on action
      const requiredPermission = action.includes('discount') || action.includes('coupon') 
        ? 'apply_discounts' 
        : 'modify_cart';

      const assistanceSession = await verifySessionPermissions(
        connection, 
        sessionId, 
        salesStaffId, 
        requiredPermission
      );

      if (!assistanceSession.customer_cart_id) {
        await connection.rollback();
        return NextResponse.json({ 
          error: 'Customer has no active cart' 
        }, { status: 400 });
      }

      let result;
      const actionDetails: any = { action, timestamp: new Date().toISOString() };

      switch (action) {
        case 'add_item':
          if (!productId || !quantity) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Product ID and quantity are required for adding items' 
            }, { status: 400 });
          }

          // Get product details
          const [productRows] = await connection.execute(
            'SELECT price, stock_quantity FROM products WHERE product_id = ? AND status = "active"',
            [productId]
          );

          if (!Array.isArray(productRows) || productRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Product not found or inactive' 
            }, { status: 404 });
          }

          const product = productRows[0] as any;

          [result] = await connection.execute(
            `INSERT INTO cart_items (
              cart_id, 
              product_id, 
              quantity, 
              unit_price, 
              custom_options,
              added_by_sales_staff,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              assistanceSession.customer_cart_id,
              productId,
              quantity,
              product.price,
              customOptions ? JSON.stringify(customOptions) : null,
              salesStaffId
            ]
          );

          actionDetails.productId = productId;
          actionDetails.quantity = quantity;
          actionDetails.unitPrice = product.price;
          break;

        case 'update_quantity':
          if (!itemId || !quantity) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Item ID and quantity are required for updating quantity' 
            }, { status: 400 });
          }

          await connection.execute(
            `UPDATE cart_items 
            SET quantity = ?, updated_at = NOW() 
            WHERE cart_item_id = ? AND cart_id = ?`,
            [quantity, itemId, assistanceSession.customer_cart_id]
          );

          actionDetails.itemId = itemId;
          actionDetails.newQuantity = quantity;
          break;

        case 'remove_item':
          if (!itemId) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Item ID is required for removing items' 
            }, { status: 400 });
          }

          await connection.execute(
            'DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
            [itemId, assistanceSession.customer_cart_id]
          );

          actionDetails.itemId = itemId;
          break;

        case 'apply_discount':
          if (!itemId || discountAmount === undefined) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Item ID and discount amount are required' 
            }, { status: 400 });
          }

          await connection.execute(
            `UPDATE cart_items 
            SET discount_amount = ?, discount_applied_by = ?, updated_at = NOW() 
            WHERE cart_item_id = ? AND cart_id = ?`,
            [discountAmount, salesStaffId, itemId, assistanceSession.customer_cart_id]
          );

          actionDetails.itemId = itemId;
          actionDetails.discountAmount = discountAmount;
          break;

        case 'apply_coupon':
          if (!couponCode) {
            await connection.rollback();
            return NextResponse.json({ 
              error: 'Coupon code is required' 
            }, { status: 400 });
          }

          // Validate coupon (this would need to be implemented based on your coupon system)
          // For now, just apply it
          if (itemId) {
            // Apply to specific item
            await connection.execute(
              `UPDATE cart_items 
              SET coupon_code = ?, coupon_applied_by = ?, updated_at = NOW() 
              WHERE cart_item_id = ? AND cart_id = ?`,
              [couponCode, salesStaffId, itemId, assistanceSession.customer_cart_id]
            );
          } else {
            // Apply to entire cart
            await connection.execute(
              `UPDATE carts 
              SET coupon_code = ?, coupon_applied_by = ?, updated_at = NOW() 
              WHERE cart_id = ?`,
              [couponCode, salesStaffId, assistanceSession.customer_cart_id]
            );
          }

          actionDetails.couponCode = couponCode;
          actionDetails.itemId = itemId;
          break;

        default:
          await connection.rollback();
          return NextResponse.json({ 
            error: 'Invalid action' 
          }, { status: 400 });
      }

      // Log the action
      await connection.execute(
        `INSERT INTO sales_cart_access_log (
          assistance_session_id,
          sales_staff_id,
          customer_user_id,
          cart_id,
          action_type,
          action_details
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          salesStaffId,
          assistanceSession.customer_user_id,
          assistanceSession.customer_cart_id,
          action,
          JSON.stringify(actionDetails)
        ]
      );

      // Update cart totals (simplified - you might want to implement more complex logic)
      await connection.execute(
        `UPDATE carts c
        SET 
          item_count = (
            SELECT COUNT(*) FROM cart_items WHERE cart_id = c.cart_id
          ),
          total_amount = (
            SELECT COALESCE(SUM((quantity * unit_price) - COALESCE(discount_amount, 0)), 0) 
            FROM cart_items WHERE cart_id = c.cart_id
          ),
          updated_at = NOW()
        WHERE cart_id = ?`,
        [assistanceSession.customer_cart_id]
      );

      await connection.commit();

      // Notify customer of cart changes
      await pusher.trigger(`customer-cart-${assistanceSession.customer_user_id}`, 'cart-updated', {
        action,
        sessionId,
        salesStaffName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: `Cart ${action} completed successfully`,
        actionDetails
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Modify customer cart error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to modify customer cart' },
      { status: 500 }
    );
  }
}