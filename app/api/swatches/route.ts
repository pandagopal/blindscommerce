import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SwatchRow extends RowDataPacket {
  swatch_id: string;
  name: string;
  color_code: string;
  material_name: string;
  image_url: string;
  is_premium: number;
  is_available: number;
  category_id: number;
  category_name: string;
  sample_fee: number;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  name: string;
  description: string;
}

interface LimitsRow extends RowDataPacket {
  total_requests: number;
  current_period_requests: number;
  period_start: string;
  period_end: string;
  lifetime_limit: number;
  period_limit: number;
  is_suspended: number;
  suspension_reason: string | null;
}

// GET /api/swatches - Get available swatches and user limits
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category');
    const email = searchParams.get('email');
    const user = await getCurrentUser();

    const userEmail = user?.email || email;
    const pool = await getPool();

    // Get available swatches with category filter
    let swatchQuery = `
      SELECT 
        s.swatch_id,
        s.name,
        s.color_code,
        s.material_name,
        s.image_url,
        s.is_premium,
        s.is_available,
        s.category_id,
        c.name as category_name,
        s.sample_fee
      FROM material_swatches s
      LEFT JOIN categories c ON s.category_id = c.category_id
      WHERE s.is_active = 1
    `;
    
    const queryParams: any[] = [];
    
    if (categoryId) {
      swatchQuery += ' AND s.category_id = ?';
      queryParams.push(categoryId);
    }
    
    swatchQuery += ' ORDER BY c.name, s.name';

    const [swatchRows] = await pool.execute<SwatchRow[]>(swatchQuery, queryParams);

    // Get all categories
    const [categoryRows] = await pool.execute<CategoryRow[]>(
      'SELECT category_id, name, description FROM categories WHERE category_id IN (SELECT DISTINCT category_id FROM material_swatches WHERE is_active = 1) ORDER BY name'
    );

    // Get user limits if email provided
    let userLimits = null;
    if (userEmail) {
      const [limitsRows] = await pool.execute<LimitsRow[]>(
        `SELECT 
          total_requests,
          current_period_requests,
          period_start,
          period_end,
          lifetime_limit,
          period_limit,
          is_suspended,
          suspension_reason
        FROM sample_request_limits 
        WHERE email = ? AND (user_id = ? OR user_id IS NULL)
        ORDER BY user_id DESC
        LIMIT 1`,
        [userEmail, user?.userId || null]
      );

      if (limitsRows.length > 0) {
        const row = limitsRows[0];
        userLimits = {
          totalRequests: row.total_requests,
          currentPeriodRequests: row.current_period_requests,
          periodStart: row.period_start,
          periodEnd: row.period_end,
          lifetimeLimit: row.lifetime_limit,
          periodLimit: row.period_limit,
          isSuspended: Boolean(row.is_suspended),
          suspensionReason: row.suspension_reason,
          remainingLifetime: Math.max(0, row.lifetime_limit - row.total_requests),
          remainingPeriod: Math.max(0, row.period_limit - row.current_period_requests)
        };

        // Check if period has expired and reset if needed
        const now = new Date();
        const periodEnd = new Date(row.period_end);
        
        if (now > periodEnd) {
          const newPeriodStart = now.toISOString().split('T')[0];
          const newPeriodEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          await pool.execute(
            `UPDATE sample_request_limits 
             SET current_period_requests = 0, 
                 period_start = ?, 
                 period_end = ? 
             WHERE email = ?`,
            [newPeriodStart, newPeriodEnd, userEmail]
          );

          userLimits.currentPeriodRequests = 0;
          userLimits.periodStart = newPeriodStart;
          userLimits.periodEnd = newPeriodEnd;
          userLimits.remainingPeriod = row.period_limit;
        }
      } else {
        // Create default limits for new user
        const periodStart = new Date().toISOString().split('T')[0];
        const periodEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await pool.execute(
          `INSERT INTO sample_request_limits 
           (user_id, email, total_requests, current_period_requests, period_start, period_end, lifetime_limit, period_limit) 
           VALUES (?, ?, 0, 0, ?, ?, 15, 10)`,
          [user?.userId || null, userEmail, periodStart, periodEnd]
        );

        userLimits = {
          totalRequests: 0,
          currentPeriodRequests: 0,
          periodStart,
          periodEnd,
          lifetimeLimit: 15,
          periodLimit: 10,
          isSuspended: false,
          suspensionReason: null,
          remainingLifetime: 15,
          remainingPeriod: 10
        };
      }
    }

    // Format swatches data
    const swatches = swatchRows.map(row => ({
      id: row.swatch_id,
      name: row.name,
      color: row.color_code,
      material: row.material_name,
      image: row.image_url,
      isPremium: Boolean(row.is_premium),
      inStock: Boolean(row.is_available),
      categoryName: row.category_name,
      sampleFee: row.sample_fee
    }));

    const categories = categoryRows.map(row => ({
      id: row.category_id,
      name: row.name,
      description: row.description
    }));

    return NextResponse.json({
      success: true,
      swatches,
      categories,
      userLimits
    });

  } catch (error) {
    console.error('Error fetching swatches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swatches' },
      { status: 500 }
    );
  }
}

// POST /api/swatches - Submit sample request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    
    const {
      selectedSwatches,
      shippingInfo,
      priority = 'STANDARD'
    } = body;

    if (!selectedSwatches || selectedSwatches.length === 0) {
      return NextResponse.json(
        { error: 'No swatches selected' },
        { status: 400 }
      );
    }

    if (!shippingInfo?.email || !shippingInfo?.name || !shippingInfo?.address) {
      return NextResponse.json(
        { error: 'Missing required shipping information' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check user limits
    const [limitsRows] = await pool.execute<LimitsRow[]>(
      `SELECT * FROM sample_request_limits WHERE email = ? AND (user_id = ? OR user_id IS NULL) ORDER BY user_id DESC LIMIT 1`,
      [shippingInfo.email, user?.userId || null]
    );

    if (limitsRows.length > 0) {
      const limits = limitsRows[0];
      
      if (limits.is_suspended) {
        return NextResponse.json(
          { error: 'Sample request privileges are suspended' },
          { status: 403 }
        );
      }

      if (selectedSwatches.length > limits.period_limit - limits.current_period_requests) {
        return NextResponse.json(
          { error: `Cannot request more than ${limits.period_limit - limits.current_period_requests} samples this period` },
          { status: 400 }
        );
      }

      if (selectedSwatches.length > limits.lifetime_limit - limits.total_requests) {
        return NextResponse.json(
          { error: `Cannot request more than ${limits.lifetime_limit - limits.total_requests} total samples` },
          { status: 400 }
        );
      }
    }

    // Calculate shipping fee
    let shippingFee = 0;
    if (priority === 'EXPRESS') {
      shippingFee = 5.99;
    }

    // Get swatch details for pricing
    const swatchIds = selectedSwatches.map(() => '?').join(',');
    const [swatchDetails] = await pool.execute<SwatchRow[]>(
      `SELECT swatch_id, sample_fee FROM material_swatches WHERE swatch_id IN (${swatchIds})`,
      selectedSwatches
    );

    const totalSampleFees = swatchDetails.reduce((sum, swatch) => sum + (swatch.sample_fee || 0), 0);
    const totalAmount = totalSampleFees + shippingFee;

    // Generate order ID
    const orderId = 'SAMPLE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Create sample order
    const [orderResult] = await pool.execute(
      `INSERT INTO sample_orders 
       (order_id, user_id, email, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, 
        priority, sample_count, sample_fees, shipping_fee, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        orderId,
        user?.userId || null,
        shippingInfo.email,
        shippingInfo.name,
        shippingInfo.address,
        shippingInfo.city,
        shippingInfo.state,
        shippingInfo.zipCode,
        priority,
        selectedSwatches.length,
        totalSampleFees,
        shippingFee,
        totalAmount
      ]
    );

    const sampleOrderId = (orderResult as any).insertId;

    // Add sample items
    for (const swatchId of selectedSwatches) {
      await pool.execute(
        'INSERT INTO sample_order_items (sample_order_id, swatch_id) VALUES (?, ?)',
        [sampleOrderId, swatchId]
      );
    }

    // Update user limits
    if (limitsRows.length > 0) {
      await pool.execute(
        `UPDATE sample_request_limits 
         SET total_requests = total_requests + ?, 
             current_period_requests = current_period_requests + ? 
         WHERE email = ?`,
        [selectedSwatches.length, selectedSwatches.length, shippingInfo.email]
      );
    }

    // Record in history
    await pool.execute(
      `INSERT INTO sample_request_history 
       (user_id, email, order_id, sample_count, request_type, is_express) 
       VALUES (?, ?, ?, ?, 'standard', ?)`,
      [user?.userId || null, shippingInfo.email, orderId, selectedSwatches.length, priority === 'EXPRESS']
    );

    // TODO: Send confirmation email
    // TODO: Notify fulfillment team

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Sample request submitted successfully',
      orderDetails: {
        orderId,
        sampleCount: selectedSwatches.length,
        totalAmount,
        shippingFee,
        priority,
        estimatedDelivery: priority === 'EXPRESS' ? '1-2 business days' : '3-5 business days'
      }
    });

  } catch (error) {
    console.error('Error submitting sample request:', error);
    return NextResponse.json(
      { error: 'Failed to submit sample request' },
      { status: 500 }
    );
  }
}