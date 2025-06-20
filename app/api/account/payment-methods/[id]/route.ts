import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

// GET /api/account/payment-methods/[id] - Get specific payment method
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

    const paymentMethodId = parseInt(params.id);
    
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [paymentMethods] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM saved_payment_methods 
       WHERE id = ? AND user_id = ? AND is_active = 1`,
      [paymentMethodId, user.userId]
    );

    if (paymentMethods.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    const method = paymentMethods[0];

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: method.id,
        type: method.payment_type,
        isDefault: Boolean(method.is_default), // Convert 0/1 to false/true
        nickname: method.nickname,
        createdAt: method.created_at,
        lastUsedAt: method.last_used_at,
        
        // Include relevant details based on type
        ...(method.payment_type === 'card' && {
          card: {
            brand: method.card_brand,
            lastFour: method.card_last_four,
            expMonth: method.card_exp_month,
            expYear: method.card_exp_year
          }
        }),
        
        billingAddress: {
          name: method.billing_name,
          email: method.billing_email,
          line1: method.billing_address_line1,
          line2: method.billing_address_line2,
          city: method.billing_city,
          state: method.billing_state,
          postalCode: method.billing_postal_code,
          country: method.billing_country
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/account/payment-methods/[id] - Update payment method
export async function PUT(
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

    const paymentMethodId = parseInt(params.id);
    
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nickname, isDefault, billingAddress } = body;

    const pool = await getPool();

    // Verify payment method belongs to user
    const [existingMethods] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM saved_payment_methods WHERE id = ? AND user_id = ? AND is_active = 1',
      [paymentMethodId, user.userId]
    );

    if (existingMethods.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }

    if (isDefault !== undefined) {
      updateFields.push('is_default = ?');
      updateValues.push(isDefault ? 1 : 0); // Convert boolean to 0/1
    }

    if (billingAddress) {
      if (billingAddress.name) {
        updateFields.push('billing_name = ?');
        updateValues.push(billingAddress.name);
      }
      if (billingAddress.email) {
        updateFields.push('billing_email = ?');
        updateValues.push(billingAddress.email);
      }
      if (billingAddress.line1) {
        updateFields.push('billing_address_line1 = ?');
        updateValues.push(billingAddress.line1);
      }
      if (billingAddress.line2 !== undefined) {
        updateFields.push('billing_address_line2 = ?');
        updateValues.push(billingAddress.line2);
      }
      if (billingAddress.city) {
        updateFields.push('billing_city = ?');
        updateValues.push(billingAddress.city);
      }
      if (billingAddress.state) {
        updateFields.push('billing_state = ?');
        updateValues.push(billingAddress.state);
      }
      if (billingAddress.postalCode) {
        updateFields.push('billing_postal_code = ?');
        updateValues.push(billingAddress.postalCode);
      }
      if (billingAddress.country) {
        updateFields.push('billing_country = ?');
        updateValues.push(billingAddress.country);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(paymentMethodId);

    const updateQuery = `
      UPDATE saved_payment_methods 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await pool.execute<ResultSetHeader>(updateQuery, updateValues);

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/account/payment-methods/[id] - Delete payment method
export async function DELETE(
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

    const paymentMethodId = parseInt(params.id);
    
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get payment method details for Stripe cleanup
    const [paymentMethods] = await pool.execute<RowDataPacket[]>(
      `SELECT stripe_payment_method_id, is_default 
       FROM saved_payment_methods 
       WHERE id = ? AND user_id = ? AND is_active = 1`,
      [paymentMethodId, user.userId]
    );

    if (paymentMethods.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    const paymentMethod = paymentMethods[0];

    // Mark as inactive instead of hard delete (for audit trail)
    await pool.execute(
      'UPDATE saved_payment_methods SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [paymentMethodId]
    );

    // If this was the default payment method, set another one as default
    if (paymentMethod.is_default) {
      await pool.execute(
        `UPDATE saved_payment_methods 
         SET is_default = 1 
         WHERE user_id = ? AND is_active = 1 AND id != ?
         ORDER BY created_at DESC 
         LIMIT 1`,
        [user.userId, paymentMethodId]
      );
    }

    // Detach payment method from Stripe customer (optional - depends on your business logic)
    try {
      await stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);
    } catch (stripeError) {
      // Log error but don't fail the request - payment method might already be detached
      console.warn('Failed to detach payment method from Stripe:', stripeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}