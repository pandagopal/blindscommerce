/**
 * Analytics Handler for V2 API
 * Handles analytics and reporting
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { orderService } from '@/lib/services/singletons';
import { getPool } from '@/lib/db';

export class AnalyticsHandler extends BaseHandler {
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireAuth(user);
    
    const routes = {
      'overview': () => this.getOverview(req, user),
      'sales': () => this.getSalesAnalytics(req, user),
      'products': () => this.getProductAnalytics(req, user),
      'customers': () => this.getCustomerAnalytics(req, user),
      'trends': () => this.getTrendAnalytics(req, user),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireAuth(user);
    throw new ApiError('Not implemented', 501);
  }

  private async getSalesAnalytics(req: NextRequest, user: any) {
    // TODO: Implement sales analytics
    return { message: 'Sales analytics endpoint' };
  }

  private async getProductAnalytics(req: NextRequest, user: any) {
    // TODO: Implement product analytics
    return { message: 'Product analytics endpoint' };
  }

  private async getCustomerAnalytics(req: NextRequest, user: any) {
    // TODO: Implement customer analytics
    return { message: 'Customer analytics endpoint' };
  }

  private async getTrendAnalytics(req: NextRequest, user: any) {
    // TODO: Implement trend analytics
    return { message: 'Trend analytics endpoint' };
  }

  private async getOverview(req: NextRequest, user: any) {
    // Only admin can view overall analytics
    if (user.role !== 'admin') {
      throw new ApiError('Insufficient permissions', 403);
    }

    const searchParams = new URL(req.url).searchParams;
    const range = searchParams.get('range') || '30d';
    
    // Parse range
    let dateFrom: Date;
    const dateTo = new Date();
    
    const rangeMatch = range.match(/(\d+)([dwmy])/);
    if (rangeMatch) {
      const [, value, unit] = rangeMatch;
      const daysMultiplier = {
        'd': 1,
        'w': 7,
        'm': 30,
        'y': 365
      }[unit] || 1;
      
      dateFrom = new Date(Date.now() - parseInt(value) * daysMultiplier * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    try {
      const pool = await getPool();
      
      // Get key metrics
      const [metrics] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COUNT(DISTINCT o.user_id) as unique_customers,
          COUNT(DISTINCT p.product_id) as total_products
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.created_at >= ? AND o.created_at <= ?
      `, [dateFrom, dateTo]);

      // Get revenue by day for chart
      const [revenueByDay] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [dateFrom, dateTo]);

      // Get top products
      const [topProducts] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          SUM(oi.quantity) as units_sold,
          SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.created_at >= ? AND o.created_at <= ?
        GROUP BY p.product_id
        ORDER BY revenue DESC
        LIMIT 10
      `, [dateFrom, dateTo]);

      // Get order status breakdown
      const [orderStatus] = await pool.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY status
      `, [dateFrom, dateTo]);

      const overview = (metrics as any[])[0] || {};

      return {
        overview: {
          totalOrders: parseInt(overview.total_orders) || 0,
          totalRevenue: parseFloat(overview.total_revenue) || 0,
          uniqueCustomers: parseInt(overview.unique_customers) || 0,
          totalProducts: parseInt(overview.total_products) || 0,
          averageOrderValue: overview.total_orders > 0 
            ? parseFloat(overview.total_revenue) / parseInt(overview.total_orders)
            : 0
        },
        revenueByDay: revenueByDay || [],
        topProducts: topProducts || [],
        orderStatus: orderStatus || [],
        dateRange: {
          from: dateFrom,
          to: dateTo
        }
      };
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw new ApiError('Failed to fetch analytics data', 500);
    }
  }
}