/**
 * Vendor Service for BlindsCommerce
 * Handles all vendor-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';

interface VendorInfo extends RowDataPacket {
  vendor_info_id: number;
  user_id: number;
  business_name: string;
  tax_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  commission_rate: number;
  is_approved: boolean;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface VendorWithStats extends VendorInfo {
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  average_rating: number;
  total_reviews: number;
  sales_team_count: number;
}

interface VendorDashboard {
  vendor: VendorWithStats;
  recentOrders: any[];
  topProducts: any[];
  salesMetrics: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  performanceMetrics: {
    orderFulfillmentRate: number;
    averageProcessingTime: number;
    customerSatisfaction: number;
  };
}

export class VendorService extends BaseService {
  constructor() {
    super('vendor_info', 'vendor_info_id');
  }

  /**
   * Get vendor with comprehensive statistics in a single query
   */
  async getVendorWithStats(vendorId: number): Promise<VendorWithStats | null> {
    const query = `
      SELECT 
        vi.*,
        
        -- Product statistics
        COALESCE(p_stats.total_products, 0) as total_products,
        COALESCE(p_stats.active_products, 0) as active_products,
        
        -- Order statistics
        COALESCE(o_stats.total_orders, 0) as total_orders,
        COALESCE(o_stats.total_revenue, 0) as total_revenue,
        COALESCE(o_stats.pending_orders, 0) as pending_orders,
        
        -- Review statistics
        COALESCE(r_stats.average_rating, 0) as average_rating,
        COALESCE(r_stats.total_reviews, 0) as total_reviews,
        
        -- Sales team
        COALESCE(s_stats.sales_team_count, 0) as sales_team_count
        
      FROM vendor_info vi
      
      -- Product stats
      LEFT JOIN (
        SELECT 
          vendor_id,
          COUNT(*) as total_products,
          SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products
        FROM vendor_products vp
        JOIN products p ON vp.product_id = p.product_id
        GROUP BY vendor_id
      ) p_stats ON vi.vendor_info_id = p_stats.vendor_id
      
      -- Order stats
      LEFT JOIN (
        SELECT 
          vendor_id,
          COUNT(DISTINCT order_id) as total_orders,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
        FROM vendor_orders
        GROUP BY vendor_id
      ) o_stats ON vi.vendor_info_id = o_stats.vendor_id
      
      -- Review stats
      LEFT JOIN (
        SELECT 
          vp.vendor_id,
          AVG(pr.rating) as average_rating,
          COUNT(DISTINCT pr.review_id) as total_reviews
        FROM product_reviews pr
        JOIN vendor_products vp ON pr.product_id = vp.product_id
        GROUP BY vp.vendor_id
      ) r_stats ON vi.vendor_info_id = r_stats.vendor_id
      
      -- Sales team stats
      LEFT JOIN (
        SELECT 
          vendor_id,
          COUNT(*) as sales_team_count
        FROM sales_representatives
        WHERE is_active = 1
        GROUP BY vendor_id
      ) s_stats ON vi.vendor_info_id = s_stats.vendor_id
      
      WHERE vi.vendor_info_id = ?
      LIMIT 1
    `;

    const [vendor] = await this.executeQuery<VendorWithStats>(query, [vendorId]);
    return vendor || null;
  }

  /**
   * Get vendor dashboard data
   */
  async getVendorDashboard(vendorId: number): Promise<VendorDashboard | null> {
    const vendor = await this.getVendorWithStats(vendorId);
    if (!vendor) return null;

    // Get all dashboard data in parallel
    const [recentOrders, topProducts, salesMetrics, performanceMetrics] = await this.executeParallel<{
      recentOrders: any[];
      topProducts: any[];
      salesMetrics: any[];
      performanceMetrics: any[];
    }>({
      recentOrders: {
        query: `
          SELECT 
            vo.order_id,
            vo.status,
            vo.total_amount,
            vo.created_at,
            o.order_number,
            u.email as customer_email,
            CONCAT(u.first_name, ' ', u.last_name) as customer_name
          FROM vendor_orders vo
          JOIN orders o ON vo.order_id = o.order_id
          JOIN users u ON o.user_id = u.user_id
          WHERE vo.vendor_id = ?
          ORDER BY vo.created_at DESC
          LIMIT 10
        `,
        params: [vendorId]
      },
      topProducts: {
        query: `
          SELECT 
            p.product_id,
            p.name,
            p.sku,
            p.primary_image_url,
            vp.vendor_price,
            COALESCE(sales.quantity_sold, 0) as quantity_sold,
            COALESCE(sales.revenue, 0) as revenue
          FROM vendor_products vp
          JOIN products p ON vp.product_id = p.product_id
          LEFT JOIN (
            SELECT 
              oi.product_id,
              SUM(oi.quantity) as quantity_sold,
              SUM(oi.total) as revenue
            FROM order_items oi
            JOIN vendor_orders vo ON oi.order_id = vo.order_id
            WHERE vo.vendor_id = ? AND vo.status NOT IN ('cancelled', 'refunded')
            GROUP BY oi.product_id
          ) sales ON p.product_id = sales.product_id
          WHERE vp.vendor_id = ?
          ORDER BY sales.revenue DESC
          LIMIT 10
        `,
        params: [vendorId, vendorId]
      },
      salesMetrics: {
        query: `
          SELECT 
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as today,
            SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as week,
            SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN total_amount ELSE 0 END) as month,
            SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as year
          FROM vendor_orders
          WHERE vendor_id = ? AND status NOT IN ('cancelled', 'refunded')
        `,
        params: [vendorId]
      },
      performanceMetrics: {
        query: `
          SELECT 
            -- Order fulfillment rate
            COALESCE(
              SUM(CASE WHEN status IN ('completed', 'shipped') THEN 1 ELSE 0 END) * 100.0 / 
              NULLIF(COUNT(*), 0), 
              0
            ) as order_fulfillment_rate,
            
            -- Average processing time (in hours)
            COALESCE(
              AVG(
                CASE 
                  WHEN status IN ('completed', 'shipped') AND updated_at IS NOT NULL 
                  THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) 
                  ELSE NULL 
                END
              ), 
              0
            ) as avg_processing_time,
            
            -- Customer satisfaction (average rating)
            COALESCE(
              (
                SELECT AVG(pr.rating)
                FROM product_reviews pr
                JOIN vendor_products vp ON pr.product_id = vp.product_id
                WHERE vp.vendor_id = ?
              ), 
              0
            ) as customer_satisfaction
            
          FROM vendor_orders
          WHERE vendor_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `,
        params: [vendorId, vendorId]
      }
    });

    return {
      vendor,
      recentOrders: recentOrders || [],
      topProducts: topProducts || [],
      salesMetrics: {
        today: parseFloat(salesMetrics[0]?.today || 0),
        week: parseFloat(salesMetrics[0]?.week || 0),
        month: parseFloat(salesMetrics[0]?.month || 0),
        year: parseFloat(salesMetrics[0]?.year || 0)
      },
      performanceMetrics: {
        orderFulfillmentRate: parseFloat(performanceMetrics[0]?.order_fulfillment_rate || 0),
        averageProcessingTime: parseFloat(performanceMetrics[0]?.avg_processing_time || 0),
        customerSatisfaction: parseFloat(performanceMetrics[0]?.customer_satisfaction || 0)
      }
    };
  }

  /**
   * Get vendor products with optimization
   */
  async getVendorProducts(
    vendorId: number,
    options: {
      isActive?: boolean;
      search?: string;
      categoryId?: number;
      sortBy?: 'name' | 'price' | 'stock' | 'sales';
      sortOrder?: 'ASC' | 'DESC';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ products: any[]; total: number }> {
    const {
      isActive,
      search,
      categoryId,
      sortBy = 'name',
      sortOrder = 'ASC',
      limit = 20,
      offset = 0
    } = options;

    // Build WHERE conditions
    const whereConditions: string[] = ['vp.vendor_id = ?'];
    const whereParams: any[] = [vendorId];

    if (isActive !== undefined) {
      whereConditions.push('p.is_active = ?');
      whereParams.push(isActive ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern);
    }

    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      whereParams.push(categoryId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      WHERE ${whereClause}
    `;

    const [countResult] = await this.executeQuery<RowDataPacket>(countQuery, whereParams);
    const total = countResult.total || 0;

    // Determine sort column
    let sortColumn = 'p.name';
    if (sortBy === 'price') sortColumn = 'vp.vendor_price';
    else if (sortBy === 'stock') sortColumn = 'vp.quantity_available';
    else if (sortBy === 'sales') sortColumn = 'sales_count';

    // Get products with sales data
    const query = `
      SELECT 
        p.*,
        vp.vendor_price,
        vp.quantity_available,
        vp.is_featured as vendor_featured,
        c.name as category_name,
        COALESCE(sales.quantity_sold, 0) as sales_count,
        COALESCE(sales.revenue, 0) as revenue
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as quantity_sold,
          SUM(total) as revenue
        FROM order_items
        WHERE vendor_id = ?
        GROUP BY product_id
      ) sales ON p.product_id = sales.product_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    const products = await this.executeQuery<any>(query, [vendorId, ...whereParams]);

    return { products, total };
  }

  /**
   * Get vendor discounts and coupons
   */
  async getVendorDiscounts(vendorId: number): Promise<{
    discounts: any[];
    coupons: any[];
  }> {
    const [discounts, coupons] = await this.executeParallel<{
      discounts: any[];
      coupons: any[];
    }>({
      discounts: {
        query: `
          SELECT 
            *,
            CASE 
              WHEN is_active = 1 
                AND (start_date IS NULL OR start_date <= NOW())
                AND (end_date IS NULL OR end_date >= NOW())
              THEN 'active'
              WHEN end_date < NOW() THEN 'expired'
              WHEN start_date > NOW() THEN 'scheduled'
              ELSE 'inactive'
            END as status
          FROM vendor_discounts
          WHERE vendor_id = ?
          ORDER BY created_at DESC
        `,
        params: [vendorId]
      },
      coupons: {
        query: `
          SELECT 
            *,
            CASE 
              WHEN is_active = 1 
                AND (start_date IS NULL OR start_date <= NOW())
                AND (end_date IS NULL OR end_date >= NOW())
                AND (usage_limit IS NULL OR usage_count < usage_limit)
              THEN 'active'
              WHEN end_date < NOW() THEN 'expired'
              WHEN usage_limit IS NOT NULL AND usage_count >= usage_limit THEN 'exhausted'
              WHEN start_date > NOW() THEN 'scheduled'
              ELSE 'inactive'
            END as status
          FROM vendor_coupons
          WHERE vendor_id = ?
          ORDER BY created_at DESC
        `,
        params: [vendorId]
      }
    });

    return {
      discounts: discounts || [],
      coupons: coupons || []
    };
  }

  /**
   * Get vendor financial summary
   */
  async getVendorFinancialSummary(
    vendorId: number,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalRevenue: number;
    totalCommission: number;
    netRevenue: number;
    pendingPayouts: number;
    completedPayouts: number;
    monthlyBreakdown: any[];
  }> {
    const dateConditions: string[] = [];
    const dateParams: any[] = [];

    if (dateFrom) {
      dateConditions.push('vo.created_at >= ?');
      dateParams.push(dateFrom);
    }

    if (dateTo) {
      dateConditions.push('vo.created_at <= ?');
      dateParams.push(dateTo);
    }

    const dateClause = dateConditions.length > 0 
      ? `AND ${dateConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        SUM(vo.total_amount) as total_revenue,
        SUM(vo.commission_amount) as total_commission,
        SUM(vo.total_amount - vo.commission_amount) as net_revenue,
        
        SUM(CASE 
          WHEN vp.status = 'pending' THEN vp.amount 
          ELSE 0 
        END) as pending_payouts,
        
        SUM(CASE 
          WHEN vp.status = 'completed' THEN vp.amount 
          ELSE 0 
        END) as completed_payouts
        
      FROM vendor_orders vo
      LEFT JOIN vendor_payouts vp ON vo.vendor_id = vp.vendor_id
      WHERE vo.vendor_id = ? 
        AND vo.status NOT IN ('cancelled', 'refunded')
        ${dateClause}
    `;

    const params = [vendorId, ...dateParams];
    const [summary] = await this.executeQuery<any>(query, params);

    // Get monthly breakdown
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_amount) as revenue,
        SUM(commission_amount) as commission,
        SUM(total_amount - commission_amount) as net_revenue,
        COUNT(DISTINCT order_id) as order_count
      FROM vendor_orders
      WHERE vendor_id = ? 
        AND status NOT IN ('cancelled', 'refunded')
        ${dateClause}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    const monthlyBreakdown = await this.executeQuery<any>(monthlyQuery, params);

    return {
      totalRevenue: parseFloat(summary?.total_revenue || 0),
      totalCommission: parseFloat(summary?.total_commission || 0),
      netRevenue: parseFloat(summary?.net_revenue || 0),
      pendingPayouts: parseFloat(summary?.pending_payouts || 0),
      completedPayouts: parseFloat(summary?.completed_payouts || 0),
      monthlyBreakdown: monthlyBreakdown.reverse()
    };
  }
}