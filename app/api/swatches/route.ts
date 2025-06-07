import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Validation schema for shipping information
const ShippingInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code is required')
});

// Validation schema for swatch order
const SwatchOrderSchema = z.object({
  selectedSwatches: z.array(z.string()).min(1, 'Select at least one swatch'),
  shippingInfo: ShippingInfoSchema
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();
    
    // Validate request body
    const validatedData = SwatchOrderSchema.parse(body);
    const userEmail = user?.email || validatedData.shippingInfo.email;

    // Check sample request limits
    const pool = await getPool();
    
    // Get current limits
    const [limitsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        total_requests,
        current_period_requests,
        period_end,
        lifetime_limit,
        period_limit,
        is_suspended
      FROM sample_request_limits 
      WHERE email = ?
      ORDER BY user_id DESC
      LIMIT 1`,
      [userEmail]
    );

    const selectedSwatchCount = validatedData.selectedSwatches.length;
    let canRequest = true;
    let limitMessage = '';

    if (limitsRows.length > 0) {
      const limits = limitsRows[0];
      
      // Check if suspended (MySQL TINYINT(1) returns 0/1)
      if (limits.is_suspended) {
        return NextResponse.json({
          success: false,
          error: 'Your sample request privileges have been suspended. Please contact customer service.',
          code: 'SUSPENDED'
        }, { status: 403 });
      }

      // Check period expiry
      const now = new Date();
      const periodEnd = new Date(limits.period_end);
      const isPeriodExpired = now > periodEnd;

      const currentPeriodRequests = isPeriodExpired ? 0 : limits.current_period_requests;
      const remainingLifetime = limits.lifetime_limit - limits.total_requests;
      const remainingPeriod = limits.period_limit - currentPeriodRequests;

      if (remainingLifetime < selectedSwatchCount) {
        canRequest = false;
        limitMessage = `You have reached your lifetime limit of ${limits.lifetime_limit} samples. Remaining: ${remainingLifetime}`;
      } else if (remainingPeriod < selectedSwatchCount) {
        canRequest = false;
        limitMessage = `You have reached your period limit of ${limits.period_limit} samples. Remaining this period: ${remainingPeriod}`;
      }
    }

    if (!canRequest) {
      return NextResponse.json({
        success: false,
        error: limitMessage,
        code: 'LIMIT_EXCEEDED'
      }, { status: 400 });
    }

    // Generate unique order ID
    const orderId = `SW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create swatch order in database
    const insertQuery = `
      INSERT INTO swatch_orders (
        id,
        user_id,
        status,
        name,
        email,
        address,
        city,
        state,
        zipCode,
        request_count,
        priority,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await pool.execute(insertQuery, [
      orderId,
      user?.userId || null,
      'PENDING',
      validatedData.shippingInfo.name,
      validatedData.shippingInfo.email,
      validatedData.shippingInfo.address,
      validatedData.shippingInfo.city,
      validatedData.shippingInfo.state,
      validatedData.shippingInfo.zipCode,
      selectedSwatchCount,
      body.priority || 'STANDARD'
    ]);

    // Link swatches to order (simplified - in real implementation you'd have a junction table)
    for (const swatchId of validatedData.selectedSwatches) {
      // This would normally insert into a swatch_order_items table
      // For now, we'll store in a JSON field or handle differently
    }

    // The trigger will automatically update the limits
    
    return NextResponse.json({
      success: true,
      message: 'Swatch order placed successfully',
      orderId,
      samplesRequested: selectedSwatchCount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing swatch order:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const user = await getCurrentUser();
    const email = searchParams.get('email');
    
    const pool = await getPool();

    // Build query for swatches
    let swatchQuery = `
      SELECT 
        s.id,
        s.name,
        s.color,
        s.material,
        s.image,
        s.is_premium,
        s.stock_count,
        sc.name as category_name
      FROM swatches s
      LEFT JOIN swatch_categories sc ON s.category_id = sc.id
      WHERE s.isActive = TRUE
    `;
    
    const queryParams: any[] = [];
    
    if (categoryId) {
      swatchQuery += ' AND s.category_id = ?';
      queryParams.push(parseInt(categoryId));
    }
    
    swatchQuery += ' ORDER BY sc.display_order, s.name';

    const [swatches] = await pool.execute<RowDataPacket[]>(swatchQuery, queryParams);

    // Get categories
    const [categories] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, description FROM swatch_categories WHERE is_active = TRUE ORDER BY display_order'
    );

    // Get user's sample limits if email provided
    let userLimits = null;
    if (user?.email || email) {
      const userEmail = user?.email || email;
      const [limitsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          total_requests,
          current_period_requests,
          period_end,
          lifetime_limit,
          period_limit,
          is_suspended
        FROM sample_request_limits 
        WHERE email = ?
        ORDER BY user_id DESC
        LIMIT 1`,
        [userEmail]
      );

      if (limitsRows.length > 0) {
        const limits = limitsRows[0];
        const now = new Date();
        const periodEnd = new Date(limits.period_end);
        const isPeriodExpired = now > periodEnd;
        
        const currentPeriodRequests = isPeriodExpired ? 0 : limits.current_period_requests;
        
        userLimits = {
          remainingLifetime: Math.max(0, limits.lifetime_limit - limits.total_requests),
          remainingPeriod: Math.max(0, limits.period_limit - currentPeriodRequests),
          isSuspended: Boolean(limits.is_suspended), // Convert 0/1 to false/true
          periodEnd: limits.period_end
        };
      } else {
        userLimits = {
          remainingLifetime: 15, // Default lifetime limit
          remainingPeriod: 10,   // Default period limit
          isSuspended: false,
          periodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      }
    }

    return NextResponse.json({
      success: true,
      swatches: swatches.map(swatch => ({
        id: swatch.id,
        name: swatch.name,
        color: swatch.color,
        material: swatch.material,
        image: swatch.image,
        isPremium: Boolean(swatch.is_premium), // Convert 0/1 to false/true
        inStock: swatch.stock_count > 0,
        categoryName: swatch.category_name
      })),
      categories,
      userLimits
    });
  } catch (error) {
    console.error('Error fetching swatches:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 