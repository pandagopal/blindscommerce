import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface LoyaltyAccountRow extends RowDataPacket {
  id: number;
  user_id: number;
  current_tier_id: number;
  total_points_earned: number;
  available_points: number;
  points_redeemed: number;
  points_expired: number;
  lifetime_spending: number;
  current_year_spending: number;
  last_purchase_date: string;
  tier_anniversary_date: string;
  next_tier_id: number;
  points_to_next_tier: number;
  spending_to_next_tier: number;
  account_status: string;
  enrollment_date: string;
  tier_name: string;
  tier_level: number;
  tier_color: string;
  tier_icon: string;
  tier_description: string;
  points_multiplier: number;
  discount_percentage: number;
  free_shipping_threshold: number;
  early_access_hours: number;
  exclusive_products: number;
  priority_support: number;
  next_tier_name: string;
  next_tier_minimum: number;
}

// GET /api/loyalty/account - Get user's loyalty account details
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

    // Get loyalty account with tier details
    const [accounts] = await pool.execute<LoyaltyAccountRow[]>(
      `SELECT 
        ula.*,
        lt.tier_name,
        lt.tier_level,
        lt.tier_color,
        lt.tier_icon,
        lt.tier_description,
        lt.points_multiplier,
        lt.discount_percentage,
        lt.free_shipping_threshold,
        lt.early_access_hours,
        lt.exclusive_products,
        lt.priority_support,
        next_tier.tier_name as next_tier_name,
        next_tier.minimum_spending as next_tier_minimum
      FROM user_loyalty_accounts ula
      JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
      LEFT JOIN loyalty_tiers next_tier ON ula.next_tier_id = next_tier.id
      WHERE ula.user_id = ?`,
      [user.userId]
    );

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Loyalty account not found' },
        { status: 404 }
      );
    }

    const account = accounts[0];

    // Calculate points to next tier and spending to next tier
    let pointsToNextTier = 0;
    let spendingToNextTier = 0;

    if (account.next_tier_id) {
      // Points needed based on spending difference
      const spendingNeeded = account.next_tier_minimum - account.lifetime_spending;
      spendingToNextTier = Math.max(0, spendingNeeded);
      pointsToNextTier = Math.ceil(spendingNeeded * account.points_multiplier);
    }

    // Get recent points transactions
    const [recentTransactions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        transaction_type,
        points_amount,
        description,
        earned_date,
        expiry_date
      FROM loyalty_points_transactions
      WHERE user_id = ?
      ORDER BY earned_date DESC
      LIMIT 10`,
      [user.userId]
    );

    // Get points expiring soon (within 30 days)
    const [expiringPoints] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(points_amount) as expiring_points
      FROM loyalty_points_transactions
      WHERE user_id = ? 
        AND transaction_type = 'earned'
        AND expiry_date IS NOT NULL
        AND expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
        AND expiry_date > NOW()`,
      [user.userId]
    );

    const loyaltyAccount = {
      id: account.id,
      userId: account.user_id,
      
      // Points information
      totalPointsEarned: account.total_points_earned,
      availablePoints: account.available_points,
      pointsRedeemed: account.points_redeemed,
      pointsExpired: account.points_expired,
      pointsExpiringSoon: expiringPoints[0]?.expiring_points || 0,
      
      // Spending information
      lifetimeSpending: account.lifetime_spending,
      currentYearSpending: account.current_year_spending,
      lastPurchaseDate: account.last_purchase_date,
      
      // Current tier information
      currentTier: {
        id: account.current_tier_id,
        name: account.tier_name,
        level: account.tier_level,
        color: account.tier_color,
        icon: account.tier_icon,
        description: account.tier_description,
        pointsMultiplier: account.points_multiplier,
        discountPercentage: account.discount_percentage,
        freeShippingThreshold: account.free_shipping_threshold,
        earlyAccessHours: account.early_access_hours,
        exclusiveProducts: Boolean(account.exclusive_products),
        prioritySupport: Boolean(account.priority_support)
      },
      
      // Next tier information
      nextTier: account.next_tier_id ? {
        id: account.next_tier_id,
        name: account.next_tier_name,
        minimumSpending: account.next_tier_minimum,
        pointsToNextTier,
        spendingToNextTier
      } : null,
      
      // Account status
      accountStatus: account.account_status,
      enrollmentDate: account.enrollment_date,
      tierAnniversaryDate: account.tier_anniversary_date,
      
      // Recent activity
      recentTransactions: recentTransactions.map(t => ({
        type: t.transaction_type,
        points: t.points_amount,
        description: t.description,
        date: t.earned_date,
        expiryDate: t.expiry_date
      }))
    };

    return NextResponse.json({
      success: true,
      account: loyaltyAccount
    });

  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty account' },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/account - Manual enrollment (if needed)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // Check if user already has a loyalty account
    const [existingAccounts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_loyalty_accounts WHERE user_id = ?',
      [user.userId]
    );

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        { error: 'User already enrolled in loyalty program' },
        { status: 400 }
      );
    }

    // Get Bronze tier ID
    const [bronzeTier] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM loyalty_tiers WHERE tier_level = 1 LIMIT 1'
    );

    if (bronzeTier.length === 0) {
      return NextResponse.json(
        { error: 'Default loyalty tier not found' },
        { status: 500 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create loyalty account
      await connection.execute(
        `INSERT INTO user_loyalty_accounts (
          user_id,
          current_tier_id,
          tier_anniversary_date
        ) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR))`,
        [user.userId, bronzeTier[0].id]
      );

      // Give signup bonus points
      await connection.execute(
        `INSERT INTO loyalty_points_transactions (
          user_id,
          transaction_type,
          points_amount,
          description,
          reference_type,
          expiry_date
        ) VALUES (?, 'bonus', 100, 'Welcome bonus for joining our loyalty program', 'signup', DATE_ADD(NOW(), INTERVAL 2 YEAR))`,
        [user.userId]
      );

      // Update available points
      await connection.execute(
        `UPDATE user_loyalty_accounts 
         SET total_points_earned = 100,
             available_points = 100,
             last_activity_date = NOW()
         WHERE user_id = ?`,
        [user.userId]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Successfully enrolled in loyalty program',
        bonusPoints: 100
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error enrolling in loyalty program:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in loyalty program' },
      { status: 500 }
    );
  }
}