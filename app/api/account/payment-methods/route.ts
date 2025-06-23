import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import Stripe from 'stripe';
import { getStripeCredentials } from '@/lib/settings';

interface SavedPaymentMethodRow extends RowDataPacket {
  id: number;
  stripe_payment_method_id: string;
  payment_type: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  bank_name: string;
  account_last_four: string;
  account_type: string;
  wallet_type: string;
  wallet_email: string;
  billing_name: string;
  billing_email: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  is_default: number; // MySQL TINYINT(1) returns 0/1
  is_active: number; // MySQL TINYINT(1) returns 0/1
  nickname: string;
  created_at: string;
  last_used_at: string;
}

// GET /api/account/payment-methods - Get user's saved payment methods
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();

    const [paymentMethods] = await pool.execute<SavedPaymentMethodRow[]>(
      `SELECT 
        id,
        stripe_payment_method_id,
        payment_type,
        card_brand,
        card_last_four,
        card_exp_month,
        card_exp_year,
        bank_name,
        account_last_four,
        account_type,
        wallet_type,
        wallet_email,
        billing_name,
        billing_email,
        billing_address_line1,
        billing_address_line2,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        is_default,
        is_active,
        nickname,
        created_at,
        last_used_at
      FROM saved_payment_methods 
      WHERE user_id = ? AND is_active = 1
      ORDER BY is_default DESC, created_at DESC`,
      [user.userId]
    );

    // Format response
    const formattedMethods = paymentMethods.map(method => ({
      id: method.id,
      stripePaymentMethodId: method.stripe_payment_method_id,
      type: method.payment_type,
      isDefault: Boolean(method.is_default), // Convert 0/1 to false/true
      isActive: Boolean(method.is_active), // Convert 0/1 to false/true
      nickname: method.nickname,
      createdAt: method.created_at,
      lastUsedAt: method.last_used_at,
      
      // Card details (if card type)
      ...(method.payment_type === 'card' && {
        card: {
          brand: method.card_brand,
          lastFour: method.card_last_four,
          expMonth: method.card_exp_month,
          expYear: method.card_exp_year
        }
      }),
      
      // Bank account details (if bank account type)
      ...(method.payment_type === 'bank_account' && {
        bankAccount: {
          bankName: method.bank_name,
          lastFour: method.account_last_four,
          accountType: method.account_type
        }
      }),
      
      // Digital wallet details (if wallet type)
      ...(method.payment_type === 'digital_wallet' && {
        wallet: {
          type: method.wallet_type,
          email: method.wallet_email
        }
      }),
      
      // Billing address
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
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods,
      total: paymentMethods.length
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/account/payment-methods - Save a new payment method
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      paymentMethodId, 
      nickname, 
      isDefault = false,
      billingAddress 
    } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    if (!billingAddress || !billingAddress.name) {
      return NextResponse.json(
        { error: 'Billing address with name is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get Stripe credentials from database
    const stripeCredentials = await getStripeCredentials();
    
    if (!stripeCredentials.enabled || !stripeCredentials.secretKey) {
      return NextResponse.json(
        { error: 'Stripe payment methods are not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe with database credentials
    const stripe = new Stripe(stripeCredentials.secretKey, {
      apiVersion: '2024-06-20'
    });

    // Retrieve payment method details from Stripe
    let stripePaymentMethod;
    try {
      stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Check if payment method is already saved
    const [existingMethods] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM saved_payment_methods WHERE user_id = ? AND stripe_payment_method_id = ?',
      [user.userId, paymentMethodId]
    );

    if (existingMethods.length > 0) {
      return NextResponse.json(
        { error: 'Payment method already saved' },
        { status: 400 }
      );
    }

    // Extract payment method details
    let paymentType = 'card';
    let cardBrand = null, cardLastFour = null, cardExpMonth = null, cardExpYear = null;
    let bankName = null, accountLastFour = null, accountType = null;
    let walletType = null, walletEmail = null;

    if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
      paymentType = 'card';
      cardBrand = stripePaymentMethod.card.brand;
      cardLastFour = stripePaymentMethod.card.last4;
      cardExpMonth = stripePaymentMethod.card.exp_month;
      cardExpYear = stripePaymentMethod.card.exp_year;
    } else if (stripePaymentMethod.type === 'us_bank_account' && stripePaymentMethod.us_bank_account) {
      paymentType = 'bank_account';
      bankName = stripePaymentMethod.us_bank_account.bank_name;
      accountLastFour = stripePaymentMethod.us_bank_account.last4;
      accountType = stripePaymentMethod.us_bank_account.account_type;
    } else if (['apple_pay', 'google_pay'].includes(stripePaymentMethod.type)) {
      paymentType = 'digital_wallet';
      walletType = stripePaymentMethod.type;
      walletEmail = user.email; // Use user's email as wallet email
    }

    // Insert new payment method
    const insertQuery = `
      INSERT INTO saved_payment_methods (
        user_id,
        stripe_payment_method_id,
        payment_type,
        card_brand,
        card_last_four,
        card_exp_month,
        card_exp_year,
        bank_name,
        account_last_four,
        account_type,
        wallet_type,
        wallet_email,
        billing_name,
        billing_email,
        billing_address_line1,
        billing_address_line2,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        is_default,
        nickname
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(insertQuery, [
      user.userId,
      paymentMethodId,
      paymentType,
      cardBrand,
      cardLastFour,
      cardExpMonth,
      cardExpYear,
      bankName,
      accountLastFour,
      accountType,
      walletType,
      walletEmail,
      billingAddress.name,
      billingAddress.email || user.email,
      billingAddress.line1,
      billingAddress.line2,
      billingAddress.city,
      billingAddress.state,
      billingAddress.postalCode,
      billingAddress.country || 'US',
      isDefault ? 1 : 0, // Convert boolean to 0/1
      nickname
    ]);

    return NextResponse.json({
      success: true,
      paymentMethodId: result.insertId,
      message: 'Payment method saved successfully'
    });

  } catch (error) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    );
  }
}