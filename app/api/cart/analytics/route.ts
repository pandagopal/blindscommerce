import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get cart analytics and insights
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const cart_id = searchParams.get('cart_id');

    const pool = await getPool();

    let analytics = {
      cart_summary: {},
      user_behavior: {},
      product_insights: {},
      conversion_metrics: {},
      time_analysis: {}
    };

    // Get current cart summary
    const [cartSummary] = await pool.execute(`
      SELECT 
        c.cart_id,
        COUNT(ci.cart_item_id) as total_items,
        SUM(ci.quantity) as total_quantity,
        SUM(ci.quantity * ci.unit_price) as cart_value,
        COUNT(CASE WHEN ci.saved_for_later = true THEN 1 END) as saved_items,
        c.created_at as cart_created,
        c.updated_at as last_updated
      FROM carts c
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
      WHERE c.user_id = ? AND c.status = 'active'
      ${cart_id ? 'AND c.cart_id = ?' : ''}
      GROUP BY c.cart_id, c.created_at, c.updated_at
    `, cart_id ? [user.userId, cart_id] : [user.userId]);

    analytics.cart_summary = (cartSummary as any[])[0] || {};

    // Get user behavior analytics
    const [userBehavior] = await pool.execute(`
      SELECT 
        action_type,
        COUNT(*) as action_count,
        AVG(CASE 
          WHEN action_type = 'item_added' THEN 
            CAST(JSON_UNQUOTE(JSON_EXTRACT(new_value, '$.quantity')) AS UNSIGNED)
          ELSE 1 
        END) as avg_quantity,
        MAX(timestamp) as last_action
      FROM cart_analytics 
      WHERE user_id = ? 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ${cart_id ? 'AND cart_id = ?' : ''}
      GROUP BY action_type
      ORDER BY action_count DESC
    `, cart_id ? [user.userId, timeframe, cart_id] : [user.userId, timeframe]);

    analytics.user_behavior = (userBehavior as any[]).reduce((acc, row) => {
      acc[row.action_type] = {
        count: row.action_count,
        avg_quantity: parseFloat(row.avg_quantity || 0),
        last_action: row.last_action
      };
      return acc;
    }, {});

    // Get product insights
    const [productInsights] = await pool.execute(`
      SELECT 
        p.product_id,
        p.name as product_name,
        p.slug as product_slug,
        COUNT(ca.analytics_id) as interaction_count,
        SUM(CASE WHEN ca.action_type = 'item_added' THEN 1 ELSE 0 END) as times_added,
        SUM(CASE WHEN ca.action_type = 'item_removed' THEN 1 ELSE 0 END) as times_removed,
        SUM(CASE WHEN ca.action_type = 'quantity_updated' THEN 1 ELSE 0 END) as quantity_changes,
        AVG(CASE 
          WHEN ca.action_type = 'item_added' THEN 
            CAST(JSON_UNQUOTE(JSON_EXTRACT(ca.new_value, '$.quantity')) AS UNSIGNED)
          ELSE NULL 
        END) as avg_quantity_added
      FROM cart_analytics ca
      JOIN products p ON ca.product_id = p.product_id
      WHERE ca.user_id = ? 
        AND ca.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ${cart_id ? 'AND ca.cart_id = ?' : ''}
      GROUP BY p.product_id, p.name, p.slug
      ORDER BY interaction_count DESC
      LIMIT 10
    `, cart_id ? [user.userId, timeframe, cart_id] : [user.userId, timeframe]);

    analytics.product_insights = productInsights;

    // Get conversion metrics
    const [conversionMetrics] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT ca.cart_id) as active_carts,
        COUNT(DISTINCT CASE 
          WHEN ca.action_type = 'item_added' THEN ca.cart_id 
        END) as carts_with_additions,
        COUNT(DISTINCT CASE 
          WHEN ca.action_type = 'saved_for_later' THEN ca.cart_id 
        END) as carts_with_saved_items,
        COUNT(DISTINCT CASE 
          WHEN ca.action_type = 'checkout_started' THEN ca.cart_id 
        END) as checkout_attempts,
        AVG(TIMESTAMPDIFF(MINUTE, c.created_at, ca.timestamp)) as avg_session_duration,
        COUNT(CASE 
          WHEN ca.action_type = 'abandoned' THEN 1 
        END) as abandonment_count
      FROM cart_analytics ca
      JOIN carts c ON ca.cart_id = c.cart_id
      WHERE ca.user_id = ? 
        AND ca.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ${cart_id ? 'AND ca.cart_id = ?' : ''}
    `, cart_id ? [user.userId, timeframe, cart_id] : [user.userId, timeframe]);

    analytics.conversion_metrics = (conversionMetrics as any[])[0] || {};

    // Get time-based analysis
    const [timeAnalysis] = await pool.execute(`
      SELECT 
        DATE(timestamp) as date,
        HOUR(timestamp) as hour,
        action_type,
        COUNT(*) as action_count
      FROM cart_analytics 
      WHERE user_id = ? 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ${cart_id ? 'AND cart_id = ?' : ''}
      GROUP BY DATE(timestamp), HOUR(timestamp), action_type
      ORDER BY date DESC, hour DESC
    `, cart_id ? [user.userId, timeframe, cart_id] : [user.userId, timeframe]);

    // Process time analysis into useful format
    const timeData = (timeAnalysis as any[]).reduce((acc, row) => {
      const dateKey = row.date;
      if (!acc[dateKey]) {
        acc[dateKey] = { total_actions: 0, hourly_breakdown: {}, action_types: {} };
      }
      
      acc[dateKey].total_actions += row.action_count;
      acc[dateKey].hourly_breakdown[row.hour] = (acc[dateKey].hourly_breakdown[row.hour] || 0) + row.action_count;
      acc[dateKey].action_types[row.action_type] = (acc[dateKey].action_types[row.action_type] || 0) + row.action_count;
      
      return acc;
    }, {});

    analytics.time_analysis = timeData;

    // Get abandonment patterns
    const [abandonmentData] = await pool.execute(`
      SELECT 
        c.cart_id,
        c.created_at,
        c.updated_at,
        COUNT(ci.cart_item_id) as items_at_abandonment,
        SUM(ci.quantity * ci.unit_price) as value_at_abandonment,
        TIMESTAMPDIFF(MINUTE, c.created_at, c.updated_at) as session_duration,
        MAX(ca.timestamp) as last_activity
      FROM carts c
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
      LEFT JOIN cart_analytics ca ON c.cart_id = ca.cart_id
      WHERE c.user_id = ? 
        AND c.status = 'abandoned'
        AND c.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY c.cart_id, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC
      LIMIT 5
    `, [user.userId, timeframe]);

    const abandonment_patterns = (abandonmentData as any[]).map(cart => ({
      cart_id: cart.cart_id,
      created_at: cart.created_at,
      abandoned_at: cart.updated_at,
      items_count: cart.items_at_abandonment || 0,
      abandoned_value: parseFloat(cart.value_at_abandonment || 0),
      session_duration_minutes: cart.session_duration || 0,
      last_activity: cart.last_activity
    }));

    // Calculate insights and recommendations
    const insights = {
      most_active_hour: null,
      most_added_product: null,
      abandonment_rate: 0,
      avg_cart_value: 0,
      recommendations: []
    };

    // Find most active hour
    let maxActions = 0;
    let mostActiveHour = null;
    Object.values(timeData).forEach((dayData: any) => {
      Object.entries(dayData.hourly_breakdown).forEach(([hour, count]: [string, any]) => {
        if (count > maxActions) {
          maxActions = count;
          mostActiveHour = hour;
        }
      });
    });
    insights.most_active_hour = mostActiveHour;

    // Find most added product
    if ((productInsights as any[]).length > 0) {
      insights.most_added_product = (productInsights as any[])[0];
    }

    // Calculate abandonment rate
    const totalCarts = analytics.conversion_metrics.active_carts || 0;
    const abandonedCarts = analytics.conversion_metrics.abandonment_count || 0;
    insights.abandonment_rate = totalCarts > 0 ? (abandonedCarts / totalCarts * 100) : 0;

    // Calculate average cart value
    insights.avg_cart_value = parseFloat(analytics.cart_summary.cart_value || 0);

    // Generate recommendations
    const recommendations = [];
    
    if (insights.abandonment_rate > 70) {
      recommendations.push({
        type: 'high_abandonment',
        message: 'Your cart abandonment rate is high. Consider simplifying the checkout process.',
        priority: 'high'
      });
    }

    if (analytics.user_behavior.saved_for_later?.count > analytics.user_behavior.item_added?.count) {
      recommendations.push({
        type: 'save_behavior',
        message: 'You save items frequently. Enable price alerts to track your saved items.',
        priority: 'medium'
      });
    }

    if (insights.avg_cart_value > 0 && insights.avg_cart_value < 100) {
      recommendations.push({
        type: 'low_cart_value',
        message: 'Consider bundling products or checking accessories to increase cart value.',
        priority: 'low'
      });
    }

    insights.recommendations = recommendations;

    return NextResponse.json({
      success: true,
      timeframe_days: parseInt(timeframe),
      analytics,
      abandonment_patterns,
      insights
    });

  } catch (error) {
    console.error('Cart analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart analytics' },
      { status: 500 }
    );
  }
}

// POST - Track custom cart event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      cart_id, 
      product_id, 
      action_type, 
      new_value, 
      old_value,
      metadata 
    } = await request.json();

    if (!action_type) {
      return NextResponse.json(
        { error: 'Action type is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Insert analytics event
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type,
        old_value, new_value, metadata, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      cart_id || null,
      user.userId,
      product_id || null,
      action_type,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });

  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}