import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getCurrentUser } from '@/lib/auth';

interface SwatchRow extends RowDataPacket {
  swatch_id: string;
  name: string;
  color_code: string;
  material_name: string;
  image_url: string;
  is_premium: number;
  is_available: number;
  category_name: string;
  sample_fee: number;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
  slug: string;
}

interface LimitsRow extends RowDataPacket {
  user_type: string;
  max_monthly_requests: number;
  max_total_requests: number;
  max_active_requests: number;
  cool_down_days: number;
  max_samples_per_request: number;
  requires_approval: number;
  is_free: number;
  cost_per_sample: number;
  free_shipping_threshold: number;
  can_request_custom_sizes: number;
  can_request_large_samples: number;
}

interface RequestHistoryRow extends RowDataPacket {
  total_requests: number;
  current_month_requests: number;
  active_requests: number;
  last_request_date: Date;
}

export async function GET(request: NextRequest) {
  let connection;
  try {
    const pool = await getPool();
    connection = await pool.getConnection();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const material = searchParams.get('material');
    const isPremium = searchParams.get('isPremium');
    const userEmail = searchParams.get('email');

    // Get current user
    const user = await getCurrentUser();

    // Base query for swatches - using actual schema columns
    let swatchQuery = `
      SELECT 
        ms.swatch_id,
        ms.name,
        ms.color_code,
        ms.material_name,
        ms.image_url,
        ms.is_premium,
        ms.is_available,
        c.name as category_name,
        ms.sample_fee
      FROM material_swatches ms
      LEFT JOIN categories c ON ms.category_id = c.category_id
      WHERE ms.is_active = 1
    `;

    const queryParams: any[] = [];

    if (search) {
      swatchQuery += ' AND (ms.name LIKE ? OR ms.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      swatchQuery += ' AND c.slug = ?';
      queryParams.push(category);
    }

    if (material) {
      swatchQuery += ' AND ms.material_type = ?';
      queryParams.push(material);
    }

    if (isPremium !== null) {
      swatchQuery += ' AND ms.is_premium = ?';
      queryParams.push(isPremium === 'true' ? 1 : 0);
    }

    swatchQuery += ' ORDER BY ms.name ASC';

    const [swatchRows] = await connection.execute<SwatchRow[]>(swatchQuery, queryParams);

    // Get categories - using actual schema (no is_active column)
    const [categoryRows] = await connection.execute<CategoryRow[]>(
      'SELECT category_id, name as category_name, slug FROM categories ORDER BY name'
    );

    // Get user limits and history
    let userLimits = null;
    
    if (user || userEmail) {
      // Determine user type based on role
      const userType = user?.role === 'designer' ? 'designer' : 
                      user?.role === 'trade' ? 'trade' : 
                      user ? 'registered' : 'guest';

      // Check if we have limits defined for this user type
      const [limitsRows] = await connection.execute<LimitsRow[]>(
        `SELECT * FROM sample_request_limits WHERE user_type = ? LIMIT 1`,
        [userType]
      );

      // If no limits found, insert default limits for this user type
      if (limitsRows.length === 0) {
        const defaultLimits = {
          guest: { monthly: 3, total: 5, active: 2, cooldown: 30, perRequest: 3 },
          registered: { monthly: 5, total: 15, active: 3, cooldown: 30, perRequest: 5 },
          designer: { monthly: 10, total: 50, active: 5, cooldown: 15, perRequest: 10 },
          trade: { monthly: 20, total: 100, active: 10, cooldown: 7, perRequest: 20 }
        };

        const limits = defaultLimits[userType] || defaultLimits.guest;

        try {
          // Insert with only the columns that exist in the schema
          await pool.execute(
            `INSERT INTO sample_request_limits 
             (user_type, max_monthly_requests, max_total_requests, max_active_requests, 
              cool_down_days, max_samples_per_request, requires_approval, is_free, 
              cost_per_sample, free_shipping_threshold, can_request_custom_sizes, can_request_large_samples) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userType, 
              limits.monthly, 
              limits.total, 
              limits.active, 
              limits.cooldown, 
              limits.perRequest,
              0, // requires_approval
              1, // is_free
              0.00, // cost_per_sample
              null, // free_shipping_threshold
              0, // can_request_custom_sizes
              0  // can_request_large_samples
            ]
          );

          // Re-fetch the inserted limits
          const [newLimitsRows] = await connection.execute<LimitsRow[]>(
            `SELECT * FROM sample_request_limits WHERE user_type = ? LIMIT 1`,
            [userType]
          );
          if (newLimitsRows.length > 0) {
            limitsRows.push(newLimitsRows[0]);
          }
        } catch (insertError) {
          console.warn('Failed to insert default limits:', insertError);
        }
      }

      if (limitsRows.length > 0) {
        const limits = limitsRows[0];
        
        // Get user's request history using actual schema columns
        const emailToCheck = userEmail || user?.email;
        
        let historyQuery: string;
        const historyParams: any[] = [];
        
        if (user?.userId) {
          historyQuery = `
            SELECT 
              COUNT(*) as total_requests,
              COUNT(CASE WHEN request_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as current_month_requests,
              COUNT(CASE WHEN status IN ('pending', 'approved', 'shipped') THEN 1 END) as active_requests,
              MAX(request_date) as last_request_date
            FROM sample_request_history 
            WHERE status != 'cancelled' AND user_id = ?
          `;
          historyParams.push(user.userId);
        } else if (emailToCheck) {
          historyQuery = `
            SELECT 
              COUNT(*) as total_requests,
              COUNT(CASE WHEN request_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as current_month_requests,
              COUNT(CASE WHEN status IN ('pending', 'approved', 'shipped') THEN 1 END) as active_requests,
              MAX(request_date) as last_request_date
            FROM sample_request_history 
            WHERE status != 'cancelled' AND guest_email = ?
          `;
          historyParams.push(emailToCheck);
        } else {
          // Default query with no user filtering
          historyQuery = `
            SELECT 
              0 as total_requests,
              0 as current_month_requests,
              0 as active_requests,
              NULL as last_request_date
          `;
        }

        const [historyRows] = await connection.execute<RequestHistoryRow[]>(historyQuery, historyParams);
        const history = historyRows[0];
        
        // Check cooldown period
        let isInCooldown = false;
        if (history?.last_request_date) {
          const lastRequestDate = new Date(history.last_request_date);
          const cooldownEndDate = new Date(lastRequestDate);
          cooldownEndDate.setDate(cooldownEndDate.getDate() + limits.cool_down_days);
          isInCooldown = new Date() < cooldownEndDate;
        }
        
        userLimits = {
          userType,
          maxMonthlyRequests: limits.max_monthly_requests,
          maxTotalRequests: limits.max_total_requests,
          maxActiveRequests: limits.max_active_requests,
          coolDownDays: limits.cool_down_days,
          maxSamplesPerRequest: limits.max_samples_per_request,
          requiresApproval: Boolean(limits.requires_approval),
          isFree: Boolean(limits.is_free),
          costPerSample: parseFloat(limits.cost_per_sample?.toString() || '0'),
          freeShippingThreshold: parseFloat(limits.free_shipping_threshold?.toString() || '0'),
          canRequestCustomSizes: Boolean(limits.can_request_custom_sizes),
          canRequestLargeSamples: Boolean(limits.can_request_large_samples),
          // User specific data
          totalRequests: history?.total_requests || 0,
          currentMonthRequests: history?.current_month_requests || 0,
          activeRequests: history?.active_requests || 0,
          remainingMonthly: Math.max(0, limits.max_monthly_requests - (history?.current_month_requests || 0)),
          remainingTotal: Math.max(0, limits.max_total_requests - (history?.total_requests || 0)),
          canRequestMore: !isInCooldown && 
                         (history?.current_month_requests || 0) < limits.max_monthly_requests && 
                         (history?.total_requests || 0) < limits.max_total_requests &&
                         (history?.active_requests || 0) < limits.max_active_requests,
          isInCooldown,
          cooldownEndDate: history?.last_request_date ? 
            new Date(new Date(history.last_request_date).getTime() + limits.cool_down_days * 24 * 60 * 60 * 1000) : null,
          lastRequestDate: history?.last_request_date
        };
      }
    } else {
      // For non-authenticated users, provide guest limits
      userLimits = {
        userType: 'guest',
        maxMonthlyRequests: 3,
        maxTotalRequests: 5,
        maxActiveRequests: 2,
        coolDownDays: 30,
        maxSamplesPerRequest: 3,
        requiresApproval: false,
        isFree: true,
        costPerSample: 0,
        freeShippingThreshold: 0,
        canRequestCustomSizes: false,
        canRequestLargeSamples: false,
        totalRequests: 0,
        currentMonthRequests: 0,
        activeRequests: 0,
        remainingMonthly: 3,
        remainingTotal: 5,
        canRequestMore: true,
        isInCooldown: false,
        cooldownEndDate: null,
        lastRequestDate: null
      };
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
      categoryName: row.category_name || 'Uncategorized',
      sampleFee: parseFloat(row.sample_fee?.toString() || '0')
    }));

    const categories = categoryRows.map(row => ({
      id: row.category_id,
      name: row.category_name,
      slug: row.slug
    }));

    return NextResponse.json({
      swatches,
      categories,
      userLimits,
      totalCount: swatches.length
    });

  } catch (error) {
    console.error('Error fetching swatches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swatches' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}