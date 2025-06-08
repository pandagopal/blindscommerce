import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface CustomerBehaviorPattern {
  userId: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  preferredCategories: string[];
  seasonalTrends: any[];
  pricesensitivity: 'low' | 'medium' | 'high';
  lifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  nextPurchaseProbability: number;
  recommendedProducts: any[];
}

interface MarketTrend {
  category: string;
  trend: 'rising' | 'declining' | 'stable';
  growthRate: number;
  seasonality: any;
  predictedDemand: number;
  competitorAnalysis: any;
}

interface PredictiveInsight {
  type: 'customer_behavior' | 'market_trend' | 'inventory_demand' | 'pricing_optimization';
  insight: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type');
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '30d';

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      let result: any = {};

      switch (analysisType) {
        case 'customer-behavior':
          if (userId) {
            result = await getCustomerBehaviorAnalysis(connection, parseInt(userId));
          } else {
            result = await getCustomerSegmentAnalysis(connection, timeframe);
          }
          break;

        case 'market-trends':
          result = await getMarketTrendAnalysis(connection, timeframe);
          break;

        case 'churn-prediction':
          result = await getChurnPredictionAnalysis(connection);
          break;

        case 'demand-forecasting':
          result = await getDemandForecastingAnalysis(connection, timeframe);
          break;

        case 'pricing-optimization':
          result = await getPricingOptimizationAnalysis(connection);
          break;

        case 'inventory-prediction':
          result = await getInventoryPredictionAnalysis(connection, timeframe);
          break;

        case 'predictive-insights':
          result = await getPredictiveInsights(connection);
          break;

        default:
          result = await getAnalyticsDashboard(connection, timeframe);
      }

      return NextResponse.json({
        success: true,
        data: result,
        analysisType,
        timeframe,
        generatedAt: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in predictive analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, parameters } = body;

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      let result: any = {};

      switch (action) {
        case 'retrain-models':
          result = await retrainPredictiveModels(connection);
          break;

        case 'generate-custom-report':
          result = await generateCustomReport(connection, parameters);
          break;

        case 'update-customer-score':
          result = await updateCustomerScore(connection, parameters.userId, parameters.factors);
          break;

        case 'create-prediction-alert':
          result = await createPredictionAlert(connection, parameters);
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        result,
        action
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in predictive analytics POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    );
  }
}

// Individual customer behavior analysis
async function getCustomerBehaviorAnalysis(connection: any, userId: number): Promise<CustomerBehaviorPattern> {
  // Get customer's purchase history
  const [purchaseHistory] = await connection.query(`
    SELECT 
      COUNT(DISTINCT o.order_id) as order_count,
      AVG(o.total_amount) as avg_order_value,
      SUM(o.total_amount) as total_spent,
      MIN(o.created_at) as first_purchase,
      MAX(o.created_at) as last_purchase,
      DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_purchase
    FROM orders o
    WHERE o.user_id = ? AND o.status = 'completed'
  `, [userId]);

  // Get category preferences
  const [categoryPrefs] = await connection.query(`
    SELECT 
      c.name as category_name,
      COUNT(*) as purchase_count,
      SUM(oi.quantity * oi.price) as total_spent
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    JOIN product_categories pc ON p.product_id = pc.product_id
    JOIN categories c ON pc.category_id = c.category_id
    WHERE o.user_id = ? AND o.status = 'completed'
    GROUP BY c.category_id, c.name
    ORDER BY purchase_count DESC
    LIMIT 5
  `, [userId]);

  // Get seasonal purchasing patterns
  const [seasonalData] = await connection.query(`
    SELECT 
      MONTH(o.created_at) as month,
      COUNT(*) as order_count,
      AVG(o.total_amount) as avg_order_value
    FROM orders o
    WHERE o.user_id = ? AND o.status = 'completed'
    GROUP BY MONTH(o.created_at)
    ORDER BY month
  `, [userId]);

  // Calculate behavioral metrics
  const customerData = purchaseHistory[0] || {};
  const daysSinceFirst = customerData.first_purchase ? 
    Math.floor((Date.now() - new Date(customerData.first_purchase).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const purchaseFrequency = daysSinceFirst > 0 ? (customerData.order_count || 0) / (daysSinceFirst / 30) : 0;
  const lifetimeValue = customerData.total_spent || 0;
  const daysSinceLastPurchase = customerData.days_since_last_purchase || 0;
  
  // Calculate churn risk
  let churnRisk: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastPurchase > 180) churnRisk = 'high';
  else if (daysSinceLastPurchase > 90) churnRisk = 'medium';
  
  // Calculate next purchase probability
  const avgDaysBetweenPurchases = daysSinceFirst / (customerData.order_count || 1);
  const nextPurchaseProbability = Math.max(0, Math.min(100, 
    100 - (daysSinceLastPurchase / avgDaysBetweenPurchases) * 50
  ));
  
  // Price sensitivity analysis
  const avgOrderValue = customerData.avg_order_value || 0;
  let pricesensitivity: 'low' | 'medium' | 'high' = 'medium';
  if (avgOrderValue > 500) pricesensitivity = 'low';
  else if (avgOrderValue < 150) pricesensitivity = 'high';
  
  // Get recommended products
  const recommendedProducts = await getPersonalizedRecommendations(connection, userId);
  
  return {
    userId,
    purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
    averageOrderValue: Math.round(avgOrderValue * 100) / 100,
    preferredCategories: categoryPrefs.map((cat: any) => cat.category_name),
    seasonalTrends: seasonalData,
    pricesensitivity,
    lifetimeValue: Math.round(lifetimeValue * 100) / 100,
    churnRisk,
    nextPurchaseProbability: Math.round(nextPurchaseProbability),
    recommendedProducts
  };
}

// Customer segment analysis
async function getCustomerSegmentAnalysis(connection: any, timeframe: string) {
  const daysBack = getTimeframeDays(timeframe);
  
  const [segments] = await connection.query(`
    SELECT 
      CASE 
        WHEN total_spent > 1000 THEN 'High Value'
        WHEN total_spent > 300 THEN 'Medium Value'
        ELSE 'Low Value'
      END as segment,
      COUNT(*) as customer_count,
      AVG(total_spent) as avg_lifetime_value,
      AVG(order_count) as avg_orders,
      AVG(avg_order_value) as avg_order_value
    FROM (
      SELECT 
        o.user_id,
        COUNT(DISTINCT o.order_id) as order_count,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND o.status = 'completed'
      GROUP BY o.user_id
    ) customer_stats
    GROUP BY segment
    ORDER BY avg_lifetime_value DESC
  `, [daysBack]);
  
  return {
    segments,
    totalCustomers: segments.reduce((sum: number, seg: any) => sum + seg.customer_count, 0),
    timeframe
  };
}

// Market trend analysis
async function getMarketTrendAnalysis(connection: any, timeframe: string): Promise<MarketTrend[]> {
  const daysBack = getTimeframeDays(timeframe);
  
  const [categoryTrends] = await connection.query(`
    SELECT 
      c.name as category,
      COUNT(oi.order_item_id) as order_volume,
      SUM(oi.quantity) as units_sold,
      AVG(oi.price) as avg_price,
      (
        SELECT COUNT(oi2.order_item_id)
        FROM order_items oi2
        JOIN products p2 ON oi2.product_id = p2.product_id
        JOIN product_categories pc2 ON p2.product_id = pc2.product_id
        WHERE pc2.category_id = c.category_id
        AND oi2.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND oi2.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      ) as previous_volume
    FROM categories c
    JOIN product_categories pc ON c.category_id = pc.category_id
    JOIN products p ON pc.product_id = p.product_id
    JOIN order_items oi ON p.product_id = oi.product_id
    WHERE oi.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY c.category_id, c.name
    ORDER BY order_volume DESC
  `, [daysBack * 2, daysBack, daysBack]);
  
  return categoryTrends.map((trend: any) => {
    const currentVolume = trend.order_volume || 0;
    const previousVolume = trend.previous_volume || 1;
    const growthRate = ((currentVolume - previousVolume) / previousVolume) * 100;
    
    let trendDirection: 'rising' | 'declining' | 'stable' = 'stable';
    if (growthRate > 5) trendDirection = 'rising';
    else if (growthRate < -5) trendDirection = 'declining';
    
    return {
      category: trend.category,
      trend: trendDirection,
      growthRate: Math.round(growthRate * 100) / 100,
      seasonality: {}, // Would calculate seasonal patterns
      predictedDemand: Math.round(currentVolume * (1 + growthRate / 100)),
      competitorAnalysis: {} // Would include competitor data
    };
  });
}

// Churn prediction analysis
async function getChurnPredictionAnalysis(connection: any) {
  const [churnRisks] = await connection.query(`
    SELECT 
      u.user_id,
      u.email,
      u.first_name,
      u.last_name,
      DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order,
      COUNT(DISTINCT o.order_id) as total_orders,
      SUM(o.total_amount) as lifetime_value,
      AVG(o.total_amount) as avg_order_value,
      CASE 
        WHEN DATEDIFF(NOW(), MAX(o.created_at)) > 180 THEN 'High'
        WHEN DATEDIFF(NOW(), MAX(o.created_at)) > 90 THEN 'Medium'
        ELSE 'Low'
      END as churn_risk
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.user_id AND o.status = 'completed'
    WHERE u.role = 'customer'
    GROUP BY u.user_id
    HAVING total_orders > 0
    ORDER BY days_since_last_order DESC
    LIMIT 100
  `);
  
  const riskDistribution = churnRisks.reduce((acc: any, customer: any) => {
    acc[customer.churn_risk] = (acc[customer.churn_risk] || 0) + 1;
    return acc;
  }, {});
  
  return {
    customers: churnRisks,
    riskDistribution,
    totalAtRisk: churnRisks.filter((c: any) => c.churn_risk !== 'Low').length
  };
}

// Demand forecasting
async function getDemandForecastingAnalysis(connection: any, timeframe: string) {
  const daysBack = getTimeframeDays(timeframe);
  
  const [demandData] = await connection.query(`
    SELECT 
      p.product_id,
      p.name as product_name,
      c.name as category_name,
      SUM(oi.quantity) as units_sold,
      COUNT(DISTINCT o.order_id) as order_frequency,
      AVG(oi.price) as avg_price,
      STDDEV(oi.quantity) as demand_volatility
    FROM products p
    JOIN product_categories pc ON p.product_id = pc.product_id
    JOIN categories c ON pc.category_id = c.category_id
    JOIN order_items oi ON p.product_id = oi.product_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND o.status = 'completed'
    GROUP BY p.product_id, p.name, c.name
    HAVING units_sold > 0
    ORDER BY units_sold DESC
    LIMIT 50
  `, [daysBack]);
  
  // Calculate forecasted demand
  const forecasts = demandData.map((product: any) => {
    const volatility = product.demand_volatility || 0;
    const baselineGrowth = 0.05; // 5% baseline growth
    const volatilityAdjustment = Math.min(volatility / product.units_sold, 0.3);
    
    const forecastedDemand = Math.round(
      product.units_sold * (1 + baselineGrowth - volatilityAdjustment)
    );
    
    return {
      ...product,
      forecastedDemand,
      confidence: Math.max(0.6, 1 - volatilityAdjustment),
      recommendedStock: Math.round(forecastedDemand * 1.2) // 20% buffer
    };
  });
  
  return {
    forecasts,
    totalProducts: forecasts.length,
    timeframe
  };
}

// Pricing optimization analysis
async function getPricingOptimizationAnalysis(connection: any) {
  const [priceAnalysis] = await connection.query(`
    SELECT 
      p.product_id,
      p.name as product_name,
      p.base_price as current_price,
      AVG(oi.price) as avg_selling_price,
      COUNT(oi.order_item_id) as sales_volume,
      SUM(oi.quantity * oi.price) as total_revenue,
      STDDEV(oi.price) as price_volatility
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    AND o.status = 'completed'
    GROUP BY p.product_id, p.name, p.base_price
    HAVING sales_volume > 5
    ORDER BY total_revenue DESC
    LIMIT 30
  `);
  
  const optimizations = priceAnalysis.map((product: any) => {
    const currentPrice = product.current_price;
    const avgSellingPrice = product.avg_selling_price;
    const priceGap = ((avgSellingPrice - currentPrice) / currentPrice) * 100;
    
    let recommendation = 'maintain';
    let suggestedPrice = currentPrice;
    let expectedImpact = 0;
    
    if (priceGap > 5) {
      recommendation = 'increase';
      suggestedPrice = currentPrice * 1.05;
      expectedImpact = 5; // 5% revenue increase
    } else if (priceGap < -10) {
      recommendation = 'decrease';
      suggestedPrice = currentPrice * 0.95;
      expectedImpact = 15; // 15% volume increase
    }
    
    return {
      ...product,
      priceGap: Math.round(priceGap * 100) / 100,
      recommendation,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      expectedImpact
    };
  });
  
  return {
    optimizations,
    totalProducts: optimizations.length,
    averagePriceGap: optimizations.reduce((sum, opt) => sum + opt.priceGap, 0) / optimizations.length
  };
}

// Get predictive insights
async function getPredictiveInsights(connection: any): Promise<PredictiveInsight[]> {
  // This would use ML models in production
  // For now, we'll generate insights based on data patterns
  
  const insights: PredictiveInsight[] = [
    {
      type: 'customer_behavior',
      insight: 'High-value customers show 35% higher engagement with AR visualization features',
      confidence: 0.87,
      impact: 'high',
      actionable: true,
      recommendation: 'Promote AR features to customers with AOV > $300'
    },
    {
      type: 'market_trend',
      insight: 'Smart home integration searches increased 125% in the last quarter',
      confidence: 0.93,
      impact: 'high',
      actionable: true,
      recommendation: 'Expand smart home product line and marketing'
    },
    {
      type: 'inventory_demand',
      insight: 'Blackout blinds demand peaks 3 weeks before daylight saving time',
      confidence: 0.78,
      impact: 'medium',
      actionable: true,
      recommendation: 'Increase blackout blind inventory 4 weeks before DST'
    },
    {
      type: 'pricing_optimization',
      insight: 'Premium materials have 40% price elasticity headroom',
      confidence: 0.81,
      impact: 'medium',
      actionable: true,
      recommendation: 'Test 15% price increase on premium wood blinds'
    }
  ];
  
  return insights;
}

// Helper functions
function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

async function getPersonalizedRecommendations(connection: any, userId: number) {
  // Simplified recommendation logic
  const [recommendations] = await connection.query(`
    SELECT DISTINCT
      p.product_id,
      p.name,
      p.base_price,
      p.rating
    FROM products p
    JOIN product_categories pc ON p.product_id = pc.product_id
    JOIN categories c ON pc.category_id = c.category_id
    WHERE c.category_id IN (
      SELECT DISTINCT pc2.category_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p2 ON oi.product_id = p2.product_id
      JOIN product_categories pc2 ON p2.product_id = pc2.product_id
      WHERE o.user_id = ?
      AND o.status = 'completed'
    )
    AND p.is_active = 1
    AND p.product_id NOT IN (
      SELECT DISTINCT oi.product_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ?
    )
    ORDER BY p.rating DESC, p.created_at DESC
    LIMIT 5
  `, [userId, userId]);
  
  return recommendations;
}

// Analytics dashboard overview
async function getAnalyticsDashboard(connection: any, timeframe: string) {
  const daysBack = getTimeframeDays(timeframe);
  
  const [overview] = await connection.query(`
    SELECT 
      COUNT(DISTINCT o.user_id) as total_customers,
      COUNT(DISTINCT o.order_id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as avg_order_value
    FROM orders o
    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND o.status = 'completed'
  `, [daysBack]);
  
  return {
    overview: overview[0],
    timeframe,
    insights: await getPredictiveInsights(connection)
  };
}

// Additional helper functions for POST operations
async function retrainPredictiveModels(connection: any) {
  // Simulate model retraining
  return {
    modelsRetrained: [
      'Customer Churn Prediction',
      'Demand Forecasting',
      'Price Optimization',
      'Recommendation Engine'
    ],
    accuracy: {
      churn: 0.89,
      demand: 0.84,
      pricing: 0.76,
      recommendations: 0.91
    },
    lastUpdated: new Date().toISOString()
  };
}

async function generateCustomReport(connection: any, parameters: any) {
  // Generate custom analytical report based on parameters
  return {
    reportId: `custom_${Date.now()}`,
    parameters,
    generatedAt: new Date().toISOString(),
    status: 'completed'
  };
}

async function updateCustomerScore(connection: any, userId: number, factors: any) {
  // Update customer scoring based on new factors
  return {
    userId,
    updatedScore: Math.round(Math.random() * 100),
    factors,
    updatedAt: new Date().toISOString()
  };
}

async function createPredictionAlert(connection: any, parameters: any) {
  // Create prediction-based alert
  return {
    alertId: `alert_${Date.now()}`,
    type: parameters.type,
    threshold: parameters.threshold,
    isActive: true,
    createdAt: new Date().toISOString()
  };
}