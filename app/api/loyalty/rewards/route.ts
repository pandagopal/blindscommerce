import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LoyaltyRewardRow extends RowDataPacket {
  id: number;
  reward_name: string;
  reward_type: string;
  points_cost: number;
  discount_value: number;
  discount_percentage: number;
  free_product_id: number;
  min_tier_level: number;
  max_uses_per_user: number;
  total_available: number;
  total_redeemed: number;
  valid_from: string;
  valid_until: string;
  minimum_order_value: number;
  applicable_categories: string;
  excluded_products: string;
  stackable_with_other_offers: number;
  reward_description: string;
  reward_image: string;
  terms_conditions: string;
  is_active: number;
  is_featured: number;
  display_order: number;
  user_redemptions: number;
  user_tier_level: number;
}

// GET /api/loyalty/rewards - Get available loyalty rewards
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rewardType = searchParams.get('type') || 'all';
    const featured = searchParams.get('featured') === 'true';

    const pool = await getPool();

    // Get user's tier level and available points
    const [userTier] = await pool.execute<RowDataPacket[]>(
      `SELECT ula.available_points, lt.tier_level
       FROM user_loyalty_accounts ula
       JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
       WHERE ula.user_id = ?`,
      [user.userId]
    );

    if (userTier.length === 0) {
      return NextResponse.json(
        { error: 'Loyalty account not found' },
        { status: 404 }
      );
    }

    const availablePoints = userTier[0].available_points;
    const tierLevel = userTier[0].tier_level;

    // Build WHERE clause
    let whereClause = 'lr.is_active = 1 AND lr.min_tier_level <= ?';
    const queryParams: any[] = [tierLevel];

    if (rewardType !== 'all') {
      whereClause += ' AND lr.reward_type = ?';
      queryParams.push(rewardType);
    }

    if (featured) {
      whereClause += ' AND lr.is_featured = 1';
    }

    // Add validity check
    whereClause += ' AND (lr.valid_from IS NULL OR lr.valid_from <= NOW())';
    whereClause += ' AND (lr.valid_until IS NULL OR lr.valid_until >= NOW())';
    
    // Add availability check
    whereClause += ' AND (lr.total_available IS NULL OR lr.total_available > lr.total_redeemed)';

    // Get rewards with user redemption count
    const [rewards] = await pool.execute<LoyaltyRewardRow[]>(
      `SELECT 
        lr.*,
        COALESCE(user_redemptions.redemption_count, 0) as user_redemptions,
        ? as user_tier_level
      FROM loyalty_rewards lr
      LEFT JOIN (
        SELECT reward_id, COUNT(*) as redemption_count
        FROM loyalty_reward_redemptions
        WHERE user_id = ? AND redemption_status NOT IN ('cancelled', 'expired')
        GROUP BY reward_id
      ) user_redemptions ON lr.id = user_redemptions.reward_id
      WHERE ${whereClause}
      ORDER BY lr.is_featured DESC, lr.display_order ASC, lr.points_cost ASC`,
      [tierLevel, user.userId, ...queryParams]
    );

    // Format rewards
    const formattedRewards = rewards.map(reward => {
      const canAfford = availablePoints >= reward.points_cost;
      const hasUsesLeft = !reward.max_uses_per_user || reward.user_redemptions < reward.max_uses_per_user;
      const isAvailable = hasUsesLeft && (!reward.total_available || reward.total_redeemed < reward.total_available);
      
      return {
        id: reward.id,
        name: reward.reward_name,
        type: reward.reward_type,
        pointsCost: reward.points_cost,
        discountValue: reward.discount_value,
        discountPercentage: reward.discount_percentage,
        freeProductId: reward.free_product_id,
        minTierLevel: reward.min_tier_level,
        description: reward.reward_description,
        image: reward.reward_image,
        termsConditions: reward.terms_conditions,
        
        // Availability info
        canAfford,
        isAvailable,
        hasUsesLeft,
        userRedemptions: reward.user_redemptions,
        maxUsesPerUser: reward.max_uses_per_user,
        totalAvailable: reward.total_available,
        totalRedeemed: reward.total_redeemed,
        
        // Validity
        validFrom: reward.valid_from,
        validUntil: reward.valid_until,
        minimumOrderValue: reward.minimum_order_value,
        
        // Restrictions
        applicableCategories: reward.applicable_categories ? JSON.parse(reward.applicable_categories) : null,
        excludedProducts: reward.excluded_products ? JSON.parse(reward.excluded_products) : null,
        stackableWithOtherOffers: Boolean(reward.stackable_with_other_offers),
        
        // Display
        isFeatured: Boolean(reward.is_featured),
        displayOrder: reward.display_order,
        
        // Status for UI
        canRedeem: canAfford && isAvailable && hasUsesLeft
      };
    });

    return NextResponse.json({
      success: true,
      rewards: formattedRewards,
      userPoints: availablePoints,
      userTierLevel: tierLevel,
      total: rewards.length
    });

  } catch (error) {
    console.error('Error fetching loyalty rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty rewards' },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/rewards - Redeem a loyalty reward
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
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get reward details with availability check
    const [rewards] = await pool.execute<RowDataPacket[]>(
      `SELECT lr.*, 
              ula.available_points,
              lt.tier_level,
              COALESCE(user_redemptions.redemption_count, 0) as user_redemptions
       FROM loyalty_rewards lr
       JOIN user_loyalty_accounts ula ON ula.user_id = ?
       JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
       LEFT JOIN (
         SELECT reward_id, COUNT(*) as redemption_count
         FROM loyalty_reward_redemptions
         WHERE user_id = ? AND redemption_status NOT IN ('cancelled', 'expired')
         GROUP BY reward_id
       ) user_redemptions ON lr.id = user_redemptions.reward_id
       WHERE lr.id = ? AND lr.is_active = 1`,
      [user.userId, user.userId, rewardId]
    );

    if (rewards.length === 0) {
      throw new Error('Reward not found or inactive');
    }

    const reward = rewards[0];

    // Validation checks
    if (reward.available_points < reward.points_cost) {
      throw new Error('Insufficient points');
    }

    if (reward.tier_level < reward.min_tier_level) {
      throw new Error('Tier level too low for this reward');
    }

    if (reward.max_uses_per_user && reward.user_redemptions >= reward.max_uses_per_user) {
      throw new Error('Maximum uses per user exceeded');
    }

    if (reward.total_available && reward.total_redeemed >= reward.total_available) {
      throw new Error('Reward no longer available');
    }

    // Check validity dates
    const now = new Date();
    if (reward.valid_from && new Date(reward.valid_from) > now) {
      throw new Error('Reward not yet available');
    }
    if (reward.valid_until && new Date(reward.valid_until) < now) {
      throw new Error('Reward has expired');
    }

    // Generate coupon code for applicable reward types
    let couponCode = null;
    if (['discount_percentage', 'discount_fixed', 'free_shipping'].includes(reward.reward_type)) {
      couponCode = `LOYALTY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }

    // Calculate expiry date (30 days from redemption)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Create redemption record
    const [redemptionResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO loyalty_reward_redemptions (
        user_id,
        reward_id,
        points_used,
        reward_value,
        coupon_code,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        rewardId,
        reward.points_cost,
        reward.discount_value || reward.discount_percentage || 0,
        couponCode,
        expiryDate
      ]
    );

    // Deduct points from user account
    await pool.execute(
      `UPDATE user_loyalty_accounts 
       SET available_points = available_points - ?,
           points_redeemed = points_redeemed + ?,
           last_activity_date = NOW()
       WHERE user_id = ?`,
      [reward.points_cost, reward.points_cost, user.userId]
    );

    // Record points transaction
    await pool.execute(
      `INSERT INTO loyalty_points_transactions (
        user_id,
        transaction_type,
        points_amount,
        description,
        reference_type,
        reference_id
      ) VALUES (?, 'redeemed', ?, ?, 'reward_redemption', ?)`,
      [
        user.userId,
        -reward.points_cost,
        `Redeemed: ${reward.reward_name}`,
        redemptionResult.insertId.toString()
      ]
    );

    // Update reward redemption count
    await pool.execute(
      'UPDATE loyalty_rewards SET total_redeemed = total_redeemed + 1 WHERE id = ?',
      [rewardId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reward redeemed successfully',
      redemption: {
        id: redemptionResult.insertId,
        couponCode,
        expiresAt: expiryDate,
        pointsUsed: reward.points_cost,
        rewardValue: reward.discount_value || reward.discount_percentage || 0
      }
    });

  } catch (error) {
    console.error('Error redeeming loyalty reward:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}