import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { smsService } from '@/lib/sms/smsService';
import { getPool } from '@/lib/db';

// Database connection configuration
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, phone, data } = body;

    // Validate required fields
    if (!type || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: type and phone' },
        { status: 400 }
      );
    }

    // Check authentication for admin functions
    let isAuthenticated = false;
    let userRole = '';
    
    try {
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        const decoded = await verifyJWT(token);
        isAuthenticated = true;
        userRole = decoded.role;
      }
    } catch (error) {
      // Continue as guest for certain message types
    }

    // Validate phone number
    const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if user has opted out of SMS
    const db = getPool();
    const [optOutCheck] = await pool.execute(
      'SELECT id FROM sms_optouts WHERE phone_number = ?',
      [cleanPhone]
    );

    if ((optOutCheck as any[]).length > 0 && type !== 'transactional') {
      return NextResponse.json(
        { error: 'User has opted out of SMS notifications' },
        { status: 400 }
      );
    }

    let success = false;

    // Handle different SMS types
    switch (type) {
      case 'cart_abandonment':
        if (!data.customerName || !data.cartTotal) {
          return NextResponse.json(
            { error: 'Missing required data for cart abandonment SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendCartAbandonmentSMS(
          data.customerName,
          cleanPhone,
          data.cartTotal
        );
        break;

      case 'order_confirmation':
        if (!data.orderNumber || !data.total) {
          return NextResponse.json(
            { error: 'Missing required data for order confirmation SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendOrderConfirmationSMS(
          cleanPhone,
          data.orderNumber,
          data.total
        );
        break;

      case 'order_shipped':
        if (!data.orderNumber) {
          return NextResponse.json(
            { error: 'Missing required data for order shipped SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendOrderShippedSMS(
          cleanPhone,
          data.orderNumber,
          data.trackingNumber
        );
        break;

      case 'installation_reminder':
        if (!data.customerName || !data.appointmentDate) {
          return NextResponse.json(
            { error: 'Missing required data for installation reminder SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendInstallationReminderSMS(
          data.customerName,
          cleanPhone,
          data.appointmentDate
        );
        break;

      case 'price_drop_alert':
        if (!data.productName || !data.oldPrice || !data.newPrice) {
          return NextResponse.json(
            { error: 'Missing required data for price drop alert SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendPriceDropAlertSMS(
          cleanPhone,
          data.productName,
          data.oldPrice,
          data.newPrice
        );
        break;

      case 'promotion_alert':
        // Require admin authentication for promotion alerts
        if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'super_admin')) {
          return NextResponse.json(
            { error: 'Admin authentication required for promotion alerts' },
            { status: 403 }
          );
        }
        if (!data.discountPercentage || !data.expiryHours) {
          return NextResponse.json(
            { error: 'Missing required data for promotion alert SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendPromotionAlertSMS(
          cleanPhone,
          data.discountPercentage,
          data.expiryHours
        );
        break;

      case 'custom':
        // Require admin authentication for custom messages
        if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'super_admin')) {
          return NextResponse.json(
            { error: 'Admin authentication required for custom SMS' },
            { status: 403 }
          );
        }
        if (!data.message) {
          return NextResponse.json(
            { error: 'Missing message content for custom SMS' },
            { status: 400 }
          );
        }
        success = await smsService.sendSMS({
          to: cleanPhone,
          message: data.message,
          type: data.messageType || 'notification'
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid SMS type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in SMS API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk SMS endpoint for marketing campaigns
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipients, message, messageType = 'marketing' } = body;

    if (!recipients || !Array.isArray(recipients) || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: recipients (array) and message' },
        { status: 400 }
      );
    }

    // Limit bulk SMS to prevent abuse
    if (recipients.length > 1000) {
      return NextResponse.json(
        { error: 'Bulk SMS limited to 1000 recipients per request' },
        { status: 400 }
      );
    }

    // Filter out opted-out numbers
    const db = getPool();
    const [optedOutNumbers] = await pool.execute(
      'SELECT phone_number FROM sms_optouts WHERE phone_number IN (?)',
      [recipients]
    );

    const optedOutSet = new Set((optedOutNumbers as any[]).map(row => row.phone_number));
    const validRecipients = recipients.filter(phone => {
      const cleanPhone = phone.replace(/\D/g, '');
      return !optedOutSet.has(cleanPhone);
    });

    const successCount = await smsService.sendBulkSMS(validRecipients, message, messageType);

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.length,
      validRecipients: validRecipients.length,
      sentCount: successCount,
      skippedOptOuts: recipients.length - validRecipients.length
    });

  } catch (error) {
    console.error('Error in bulk SMS API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}