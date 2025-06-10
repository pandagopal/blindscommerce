import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface AnalyticsSummaryRow extends RowDataPacket {
  summary_date: string;
  total_sessions: number;
  unique_visitors: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  conversion_rate: number;
  cart_abandonment_rate: number;
  products_viewed: number;
  products_added_to_cart: number;
  new_users: number;
  returning_users: number;
  desktop_sessions: number;
  mobile_sessions: number;
  tablet_sessions: number;
  organic_sessions: number;
  paid_sessions: number;
  social_sessions: number;
  direct_sessions: number;
  referral_sessions: number;
}

// GET /api/analytics/dashboard - Get analytics dashboard data
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

    const pool = await getPool();

    // Get overview metrics
    const [overviewResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(page_views) as total_page_views,
        SUM(total_sessions) as total_sessions,
        SUM(unique_visitors) as total_unique_visitors,
        SUM(total_orders) as total_orders,
        SUM(total_revenue) as total_revenue,
        AVG(conversion_rate) as avg_conversion_rate,
        AVG(bounce_rate) as avg_bounce_rate,
        AVG(avg_session_duration) as avg_session_duration,
        SUM(new_users) as total_new_users,
        SUM(returning_users) as total_returning_users,
        SUM(desktop_sessions) as total_desktop_sessions,
        SUM(mobile_sessions) as total_mobile_sessions,
        SUM(tablet_sessions) as total_tablet_sessions
      FROM analytics_daily_summary
      WHERE summary_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const overview = overviewResult[0] || {};

    // Get daily trends
    const [trendsResult] = await pool.execute<AnalyticsSummaryRow[]>(
      `SELECT 
        summary_date,
        total_sessions,
        page_views,
        total_orders,
        total_revenue,
        conversion_rate,
        unique_visitors
      FROM analytics_daily_summary
      WHERE summary_date BETWEEN ? AND ?
      ORDER BY summary_date ASC`,
      [startDate, endDate]
    );

    // Get top products
    const [topProductsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        COUNT(ae.event_id) as views,
        COUNT(DISTINCT ae.session_id) as unique_views,
        COUNT(DISTINCT CASE WHEN ae.event_action = 'add_to_cart' THEN ae.session_id END) as cart_adds
      FROM analytics_events ae
      JOIN products p ON ae.product_id = p.product_id
      WHERE DATE(ae.created_at) BETWEEN ? AND ?
        AND ae.event_action = 'product_view'
      GROUP BY p.product_id, p.name, p.slug, p.base_price
      ORDER BY views DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Get traffic sources
    const [trafficSourcesResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(NULLIF(utm_source, ''), 'Direct') as source,
        COALESCE(NULLIF(utm_medium, ''), 'None') as medium,
        COUNT(*) as sessions,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT user_id) as unique_users
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_type = 'page_view'
      GROUP BY utm_source, utm_medium
      ORDER BY sessions DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Get top pages
    const [topPagesResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        page_path,
        page_title,
        COUNT(*) as page_views,
        COUNT(DISTINCT session_id) as unique_page_views,
        AVG(CASE WHEN event_type = 'engagement' AND event_action = 'time_on_page' THEN event_value END) as avg_time_on_page
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_type = 'page_view'
      GROUP BY page_path, page_title
      ORDER BY page_views DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Get device breakdown
    const [deviceBreakdownResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        device_type,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) as page_views,
        COUNT(DISTINCT user_id) as unique_users
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_type = 'page_view'
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY sessions DESC`,
      [startDate, endDate]
    );

    // Get conversion funnel data
    const [funnelResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        'Product Views' as step_name,
        COUNT(DISTINCT session_id) as users,
        1 as step_order
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_action = 'product_view'
      
      UNION ALL
      
      SELECT 
        'Add to Cart' as step_name,
        COUNT(DISTINCT session_id) as users,
        2 as step_order
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_action = 'add_to_cart'
      
      UNION ALL
      
      SELECT 
        'Checkout Started' as step_name,
        COUNT(DISTINCT session_id) as users,
        3 as step_order
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_action = 'begin_checkout'
      
      UNION ALL
      
      SELECT 
        'Purchase Completed' as step_name,
        COUNT(DISTINCT session_id) as users,
        4 as step_order
      FROM analytics_events
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND event_action = 'purchase'
      
      ORDER BY step_order`,
      [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]
    );

    // Calculate conversion rates for funnel
    const funnelData = funnelResult.map((step, index) => {
      const conversionRate = index === 0 ? 100 : 
        funnelResult[0].users > 0 ? (step.users / funnelResult[0].users * 100) : 0;
      
      return {
        stepName: step.step_name,
        users: step.users,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: index > 0 ? Math.round((1 - step.users / funnelResult[index - 1].users) * 10000) / 100 : 0
      };
    });

    // Get recent orders for revenue analysis
    const [recentOrdersResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as orders_count,
        SUM(total_amount) as daily_revenue,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND status IN ('shipped', 'delivered')
      GROUP BY DATE(created_at)
      ORDER BY order_date ASC`,
      [startDate, endDate]
    );

    // Calculate period-over-period comparison
    const periodLength = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate).getTime() - periodLength * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [prevPeriodResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(page_views) as total_page_views,
        SUM(total_sessions) as total_sessions,
        SUM(total_orders) as total_orders,
        SUM(total_revenue) as total_revenue,
        AVG(conversion_rate) as avg_conversion_rate
      FROM analytics_daily_summary
      WHERE summary_date BETWEEN ? AND ?`,
      [prevStartDate, prevEndDate]
    );

    const prevPeriod = prevPeriodResult[0] || {};

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    const periodComparison = {
      pageViewsChange: calculateChange(overview.total_page_views || 0, prevPeriod.total_page_views || 0),
      sessionsChange: calculateChange(overview.total_sessions || 0, prevPeriod.total_sessions || 0),
      ordersChange: calculateChange(overview.total_orders || 0, prevPeriod.total_orders || 0),
      revenueChange: calculateChange(overview.total_revenue || 0, prevPeriod.total_revenue || 0),
      conversionRateChange: calculateChange(overview.avg_conversion_rate || 0, prevPeriod.avg_conversion_rate || 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPageViews: overview.total_page_views || 0,
          totalSessions: overview.total_sessions || 0,
          uniqueVisitors: overview.total_unique_visitors || 0,
          totalOrders: overview.total_orders || 0,
          totalRevenue: overview.total_revenue || 0,
          avgConversionRate: Math.round((overview.avg_conversion_rate || 0) * 100) / 100,
          avgBounceRate: Math.round((overview.avg_bounce_rate || 0) * 100) / 100,
          avgSessionDuration: Math.round(overview.avg_session_duration || 0),
          newUsers: overview.total_new_users || 0,
          returningUsers: overview.total_returning_users || 0,
          deviceBreakdown: {
            desktop: overview.total_desktop_sessions || 0,
            mobile: overview.total_mobile_sessions || 0,
            tablet: overview.total_tablet_sessions || 0
          }
        },
        trends: trendsResult.map(row => ({
          date: row.summary_date,
          sessions: row.total_sessions,
          pageViews: row.page_views,
          orders: row.total_orders,
          revenue: row.total_revenue,
          conversionRate: row.conversion_rate,
          uniqueVisitors: row.unique_visitors
        })),
        topProducts: topProductsResult.map(row => ({
          id: row.product_id,
          name: row.product_name,
          slug: row.product_slug,
          price: row.base_price,
          views: row.views,
          uniqueViews: row.unique_views,
          cartAdds: row.cart_adds,
          conversionRate: row.unique_views > 0 ? Math.round((row.cart_adds / row.unique_views) * 10000) / 100 : 0
        })),
        trafficSources: trafficSourcesResult.map(row => ({
          source: row.source,
          medium: row.medium,
          sessions: row.sessions,
          uniqueSessions: row.unique_sessions,
          uniqueUsers: row.unique_users
        })),
        topPages: topPagesResult.map(row => ({
          path: row.page_path,
          title: row.page_title,
          pageViews: row.page_views,
          uniquePageViews: row.unique_page_views,
          avgTimeOnPage: Math.round(row.avg_time_on_page || 0)
        })),
        deviceBreakdown: deviceBreakdownResult.map(row => ({
          device: row.device_type,
          sessions: row.sessions,
          pageViews: row.page_views,
          uniqueUsers: row.unique_users
        })),
        conversionFunnel: funnelData,
        revenueAnalysis: recentOrdersResult.map(row => ({
          date: row.order_date,
          ordersCount: row.orders_count,
          revenue: row.daily_revenue,
          avgOrderValue: row.avg_order_value
        })),
        periodComparison,
        dateRange: {
          startDate,
          endDate,
          period
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}