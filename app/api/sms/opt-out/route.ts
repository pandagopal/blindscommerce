import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Handle SMS opt-out requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate and clean phone number
    const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if already opted out
    const [existing] = await pool.execute(
      'SELECT id FROM sms_optouts WHERE phone_number = ?',
      [cleanPhone]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Phone number is already opted out of SMS notifications'
      });
    }

    // Add to opt-out list
    await pool.execute(
      `INSERT INTO sms_optouts (phone_number, email, opted_out_at, ip_address) 
       VALUES (?, ?, NOW(), ?)`,
      [
        cleanPhone,
        email || null,
        request.ip || null
      ]
    );

    // Also update user preferences if user exists
    try {
      await pool.execute(
        'UPDATE users SET sms_notifications = FALSE WHERE phone = ?',
        [cleanPhone]
      );
    } catch (error) {
      // User might not exist, continue
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully opted out of SMS notifications'
    });

  } catch (error) {
    console.error('Error processing SMS opt-out:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle SMS opt-in requests (re-subscribe)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate and clean phone number
    const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Remove from opt-out list
    await pool.execute(
      'DELETE FROM sms_optouts WHERE phone_number = ?',
      [cleanPhone]
    );

    // Update user preferences if user exists
    try {
      await pool.execute(
        'UPDATE users SET sms_notifications = TRUE WHERE phone = ?',
        [cleanPhone]
      );
    } catch (error) {
      // User might not exist, continue
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully opted back into SMS notifications'
    });

  } catch (error) {
    console.error('Error processing SMS opt-in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check opt-out status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate and clean phone number
    const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check opt-out status
    const [optOutRecord] = await pool.execute(
      'SELECT opted_out_at FROM sms_optouts WHERE phone_number = ?',
      [cleanPhone]
    );

    const isOptedOut = (optOutRecord as any[]).length > 0;

    return NextResponse.json({
      phone: cleanPhone,
      isOptedOut,
      optedOutAt: isOptedOut ? (optOutRecord as any[])[0].opted_out_at : null
    });

  } catch (error) {
    console.error('Error checking SMS opt-out status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}