import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SampleLimitsRow extends RowDataPacket {
  total_requests: number;
  current_period_requests: number;
  period_start: string;
  period_end: string;
  lifetime_limit: number;
  period_limit: number;
  is_suspended: number; // MySQL TINYINT(1) returns 0/1
  suspension_reason: string | null;
}

// GET /api/samples/limits - Check sample request limits for user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const user = await getCurrentUser();

    if (!user && !email) {
      return NextResponse.json(
        { error: 'Email required for guest users' },
        { status: 400 }
      );
    }

    const userEmail = user?.email || email;
    const pool = await getPool();

    // Get current limits for user/email
    const [limitsRows] = await pool.execute<SampleLimitsRow[]>(
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

    let limits = {
      totalRequests: 0,
      currentPeriodRequests: 0,
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lifetimeLimit: 15,
      periodLimit: 10,
      isSuspended: false,
      suspensionReason: null
    };

    if (limitsRows.length > 0) {
      const row = limitsRows[0];
      limits = {
        totalRequests: row.total_requests,
        currentPeriodRequests: row.current_period_requests,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        lifetimeLimit: row.lifetime_limit,
        periodLimit: row.period_limit,
        isSuspended: Boolean(row.is_suspended), // Convert 0/1 to false/true
        suspensionReason: row.suspension_reason
      };

      // Check if period has expired
      const now = new Date();
      const periodEnd = new Date(row.period_end);
      
      if (now > periodEnd) {
        // Reset period
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

        limits.currentPeriodRequests = 0;
        limits.periodStart = newPeriodStart;
        limits.periodEnd = newPeriodEnd;
      }
    }

    // Get recent request history
    const [historyRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        order_id,
        sample_count,
        request_type,
        is_express,
        created_at
      FROM sample_request_history 
      WHERE email = ? 
      ORDER BY created_at DESC 
      LIMIT 10`,
      [userEmail]
    );

    // Calculate remaining limits
    const remainingLifetime = Math.max(0, limits.lifetimeLimit - limits.totalRequests);
    const remainingPeriod = Math.max(0, limits.periodLimit - limits.currentPeriodRequests);
    const canRequest = !limits.isSuspended && remainingLifetime > 0 && remainingPeriod > 0;

    return NextResponse.json({
      success: true,
      limits: {
        ...limits,
        remainingLifetime,
        remainingPeriod,
        canRequest
      },
      recentHistory: historyRows.map(row => ({
        orderId: row.order_id,
        sampleCount: row.sample_count,
        requestType: row.request_type,
        isExpress: row.is_express,
        createdAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching sample limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample limits' },
      { status: 500 }
    );
  }
}

// POST /api/samples/limits/reset - Reset limits for a user (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, resetType = 'period' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    if (resetType === 'lifetime') {
      // Reset both period and lifetime limits
      await pool.execute(
        `UPDATE sample_request_limits 
         SET total_requests = 0, 
             current_period_requests = 0,
             period_start = CURDATE(),
             period_end = DATE_ADD(CURDATE(), INTERVAL 3 MONTH),
             is_suspended = FALSE,
             suspension_reason = NULL
         WHERE email = ?`,
        [email]
      );
    } else {
      // Reset only period limits
      await pool.execute(
        `UPDATE sample_request_limits 
         SET current_period_requests = 0,
             period_start = CURDATE(),
             period_end = DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
         WHERE email = ?`,
        [email]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${resetType === 'lifetime' ? 'Lifetime and period' : 'Period'} limits reset successfully`
    });

  } catch (error) {
    console.error('Error resetting sample limits:', error);
    return NextResponse.json(
      { error: 'Failed to reset limits' },
      { status: 500 }
    );
  }
}