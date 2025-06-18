import { NextRequest, NextResponse } from 'next/server';
import { getPool, hashPassword } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface GuestOrderRequest {
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    name: string;
    width?: number;
    height?: number;
    colorName?: string;
    colorId?: number;
  }>;
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apt?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billing: {
    sameAsShipping: boolean;
    firstName?: string;
    lastName?: string;
    address?: string;
    apt?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  payment: {
    id: string;
  };
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  special_instructions?: string;
  createAccount?: boolean;
  guestPassword?: string;
  guestConfirmPassword?: string;
}

interface UserRow extends RowDataPacket {
  user_id: number;
  email: string;
}

// POST /api/orders/guest - Create order for guest or new account
export async function POST(req: NextRequest) {
  let connection;
  
  try {
    const pool = await getPool();
    connection = await pool.getConnection();
    
    const body: GuestOrderRequest = await req.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!body.shipping?.email || !body.shipping?.firstName || !body.shipping?.lastName) {
      return NextResponse.json(
        { error: 'Shipping information is required' },
        { status: 400 }
      );
    }

    if (!body.payment?.id) {
      return NextResponse.json(
        { error: 'Payment information is required' },
        { status: 400 }
      );
    }

    // Validate account creation fields if requested
    if (body.createAccount) {
      if (!body.guestPassword || !body.guestConfirmPassword) {
        return NextResponse.json(
          { error: 'Password is required for account creation' },
          { status: 400 }
        );
      }

      if (body.guestPassword !== body.guestConfirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        );
      }

      if (body.guestPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    // Transaction handling with pool - consider using connection from pool

    let userId: number | null = null;

    try {
      // Check if email already exists
      const [existingUsers] = await connection.execute<UserRow[]>(
        'SELECT user_id, email FROM users WHERE email = ?',
        [body.shipping.email]
      );

      if (existingUsers.length > 0) {
        if (body.createAccount) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please log in instead.' },
            { status: 400 }
          );
        }
        // Use existing user for guest checkout
        userId = existingUsers[0].user_id;
      } else if (body.createAccount) {
        // Create new user account
        const hashedPassword = await hashPassword(body.guestPassword!);
        
        const [userResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO users (
            email, password, first_name, last_name, 
            phone, role, is_active, email_verified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.shipping.email,
            hashedPassword,
            body.shipping.firstName,
            body.shipping.lastName,
            body.shipping.phone || null,
            'customer',
            true,
            false
          ]
        );

        userId = userResult.insertId;

        // Create loyalty account for new user
        try {
          await pool.execute(
            `INSERT INTO user_loyalty_accounts (user_id) VALUES (?)`,
            [userId]
          );
        } catch (loyaltyError) {
          // Loyalty account creation is optional - don't fail the order
          console.warn('Could not create loyalty account:', loyaltyError);
        }
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Calculate totals with proper null handling
      const subtotal = body.subtotal || 0;
      const shippingCost = body.shipping_cost || 0;
      const tax = body.tax || 0;
      const total = body.total || (subtotal + shippingCost + tax);

      // Create order
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, customer_id, status, 
          subtotal, shipping_cost, tax_amount, total_amount,
          shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
          shipping_address, shipping_apt, shipping_city, shipping_state, 
          shipping_zip_code, shipping_country,
          billing_first_name, billing_last_name, billing_address, billing_apt,
          billing_city, billing_state, billing_zip_code, billing_country,
          payment_method, payment_status, payment_reference,
          special_instructions, is_guest_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          userId,
          'pending',
          subtotal,
          shippingCost,
          tax,
          total,
          body.shipping.firstName,
          body.shipping.lastName,
          body.shipping.email,
          body.shipping.phone || null,
          body.shipping.address,
          body.shipping.apt || null,
          body.shipping.city,
          body.shipping.state,
          body.shipping.zipCode,
          body.shipping.country,
          body.billing.sameAsShipping ? body.shipping.firstName : (body.billing.firstName || null),
          body.billing.sameAsShipping ? body.shipping.lastName : (body.billing.lastName || null),
          body.billing.sameAsShipping ? body.shipping.address : (body.billing.address || null),
          body.billing.sameAsShipping ? body.shipping.apt : (body.billing.apt || null),
          body.billing.sameAsShipping ? body.shipping.city : (body.billing.city || null),
          body.billing.sameAsShipping ? body.shipping.state : (body.billing.state || null),
          body.billing.sameAsShipping ? body.shipping.zipCode : (body.billing.zipCode || null),
          body.billing.sameAsShipping ? body.shipping.country : (body.billing.country || null),
          'stripe',
          'completed',
          body.payment.id,
          body.special_instructions || null,
          userId ? false : true
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of body.items) {
        await pool.execute(
          `INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, total_price,
            product_name, width, height, color_name, color_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.quantity,
            item.price,
            item.quantity * item.price,
            item.name,
            item.width || null,
            item.height || null,
            item.colorName || null,
            item.colorId || null
          ]
        );
      }

      // Award loyalty points if user has account
      if (userId && total > 0) {
        try {
          const pointsEarned = Math.floor(total);
          
          // Get current balance
          const [balanceRows] = await connection.execute<RowDataPacket[]>(
            'SELECT current_points_balance FROM user_loyalty_accounts WHERE user_id = ?',
            [userId]
          );

          const currentBalance = (balanceRows[0]?.current_points_balance || 0) as number;
          const newBalance = currentBalance + pointsEarned;

          // Update loyalty account
          await pool.execute(
            `UPDATE user_loyalty_accounts 
             SET current_points_balance = ?, 
                 total_points_earned = total_points_earned + ?,
                 lifetime_spending = lifetime_spending + ?,
                 annual_spending = annual_spending + ?,
                 last_points_earned = NOW()
             WHERE user_id = ?`,
            [newBalance, pointsEarned, total, total, userId]
          );

          // Record points transaction
          await pool.execute(
            `INSERT INTO loyalty_points_transactions (
              user_id, transaction_type, points_amount, 
              points_balance_before, points_balance_after,
              source_type, source_id, reference_amount, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              'earned',
              pointsEarned,
              currentBalance,
              newBalance,
              'purchase',
              orderNumber,
              total,
              `Points earned from order ${orderNumber}`
            ]
          );
        } catch (loyaltyError) {
          // Loyalty points are optional - don't fail the order
          console.warn('Could not award loyalty points:', loyaltyError);
        }
      }

      // Commit transaction
      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        orderNumber,
        orderId,
        userId: userId || undefined,
        accountCreated: body.createAccount && userId !== null,
        message: body.createAccount 
          ? 'Order created successfully and account has been created!'
          : 'Order created successfully!'
      });

    } catch (transactionError) {
      // Rollback transaction on error
      // Rollback handling needs review with pool
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creating guest order:', error);
    
    // Return appropriate error message
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      if (error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}