/**
 * Vendor Service for BlindsCommerce
 * Handles all vendor-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseDecimal } from '@/lib/utils/priceUtils';

interface VendorInfo extends RowDataPacket {
  vendor_info_id: number;
  user_id: number;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  business_description?: string;
  logo_url?: string;
  website_url?: string;
  year_established?: number;
  is_verified?: boolean;
  verification_date?: Date;
  approval_status?: string;
  is_approved: boolean;
  tax_id?: string;
  business_address_line1?: string;
  business_address_line2?: string;
  business_city?: string;
  business_state?: string;
  business_postal_code?: string;
  business_country?: string;
  total_sales?: number;
  rating?: number;
  is_active?: boolean;
  commission_rate: number;
  payment_terms?: string;
  minimum_payout?: number;
  payment_method?: string;
  bank_account_info?: string;
  paypal_email?: string;
  tax_form_submitted?: boolean;
  auto_payout_enabled?: boolean;
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
          vp.vendor_id,
          COUNT(*) as total_products,
          SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products
        FROM vendor_products vp
        JOIN products p ON vp.product_id = p.product_id
        GROUP BY vp.vendor_id
      ) p_stats ON vi.vendor_info_id = p_stats.vendor_id
      
      -- Order stats
      LEFT JOIN (
        SELECT 
          o.vendor_id,
          COUNT(DISTINCT o.order_id) as total_orders,
          SUM(o.total_amount) as total_revenue,
          SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders
        FROM orders o
        WHERE o.vendor_id IS NOT NULL
        GROUP BY o.vendor_id
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
          ss.vendor_id,
          COUNT(*) as sales_team_count
        FROM sales_staff ss
        WHERE ss.is_active = 1
        GROUP BY ss.vendor_id
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
    const { recentOrders, topProducts, salesMetrics, performanceMetrics } = await this.executeParallel<{
      recentOrders: any[];
      topProducts: any[];
      salesMetrics: any[];
      performanceMetrics: any[];
    }>({
      recentOrders: {
        query: `
          SELECT 
            o.order_id,
            o.status,
            o.total_amount as vendor_total,
            o.created_at,
            o.order_number,
            u.email as customer_email,
            CONCAT(u.first_name, ' ', u.last_name) as customer_name,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
          FROM orders o
          JOIN users u ON o.user_id = u.user_id
          WHERE o.vendor_id = ?
          ORDER BY o.created_at DESC
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
            COALESCE(sales.revenue, 0) as revenue,
            vp.vendor_id as vendor_product_vendor_id
          FROM vendor_products vp
          JOIN products p ON vp.product_id = p.product_id
          LEFT JOIN (
            SELECT 
              oi.product_id,
              SUM(oi.quantity) as quantity_sold,
              SUM(oi.total_price) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.vendor_id = ? AND o.status NOT IN ('cancelled', 'refunded')
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
          FROM orders
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
            
          FROM orders
          WHERE vendor_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `,
        params: [vendorId, vendorId]
      }
    });

    // Map to the format expected by the vendor dashboard page
    return {
      stats: {
        totalProducts: vendor?.total_products || 0,
        totalOrders: vendor?.total_orders || 0,
        totalSales: vendor?.total_revenue || 0,
        pendingOrders: vendor?.pending_orders || 0,
        activeProducts: vendor?.active_products || 0,
        averageRating: vendor?.average_rating || 0,
        totalReviews: vendor?.total_reviews || 0,
        salesTeamCount: vendor?.sales_team_count || 0
      },
      vendor,
      recentOrders: (recentOrders || []).map(order => ({
        id: order.order_id,
        date: order.created_at,
        customer: order.customer_name,
        total: order.vendor_total,
        status: order.status,
        items: order.item_count || 0
      })),
      topProducts: topProducts || [],
      salesMetrics: {
        today: parseDecimal(salesMetrics[0]?.today),
        week: parseDecimal(salesMetrics[0]?.week),
        month: parseDecimal(salesMetrics[0]?.month),
        year: parseDecimal(salesMetrics[0]?.year)
      },
      performanceMetrics: {
        orderFulfillmentRate: parseDecimal(performanceMetrics[0]?.order_fulfillment_rate),
        averageProcessingTime: parseDecimal(performanceMetrics[0]?.avg_processing_time),
        customerSatisfaction: parseDecimal(performanceMetrics[0]?.customer_satisfaction)
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
      sortBy?: 'name' | 'price' | 'stock' | 'sales' | 'created_at' | 'updated_at' | string;
      sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
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

    // Normalize sortOrder
    const normalizedSortOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';

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

    // console.log('[VendorService.getVendorProducts] Count query:', countQuery);

    const [countResult] = await this.executeQuery<RowDataPacket>(countQuery, whereParams);
    const total = countResult.total || 0;
    
    // console.log('[VendorService.getVendorProducts] Total count:', total);

    // Determine sort column
    let sortColumn = 'p.name';
    if (sortBy === 'price') sortColumn = 'vp.vendor_price';
    else if (sortBy === 'stock') sortColumn = 'vp.quantity_available';
    else if (sortBy === 'sales') sortColumn = 'sales_count';
    else if (sortBy === 'created_at') sortColumn = 'p.created_at';
    else if (sortBy === 'updated_at') sortColumn = 'p.updated_at';

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
          oi.product_id,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.vendor_id = ?
        GROUP BY oi.product_id
      ) sales ON p.product_id = sales.product_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${normalizedSortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    // console.log('[VendorService.getVendorProducts] Main query:', query);

    // console.log('[VendorService.getVendorProducts] Main query params:', [vendorId, ...whereParams]);
    // console.log('[VendorService.getVendorProducts] Executing main query...');
    
    const products = await this.executeQuery<any>(query, [vendorId, ...whereParams]);
    
    // console.log('[VendorService.getVendorProducts] Products found:', products.length);
    // if (products.length > 0) {
    //   console.log('[VendorService.getVendorProducts] First product:', {
    //     id: products[0].product_id,
    //     name: products[0].name,
    //     vendor_price: products[0].vendor_price
    //   });
    // }

    return { products, total };
  }

  /**
   * Get vendor discounts and coupons
   */
  async getVendorDiscounts(vendorId: number): Promise<{
    discounts: any[];
    coupons: any[];
  }> {
    
    const { discounts, coupons } = await this.executeParallel<{
      discounts: any[];
      coupons: any[];
    }>({
      discounts: {
        query: `
          SELECT 
            *,
            CASE 
              WHEN is_active = 1 
                AND (valid_from IS NULL OR valid_from <= NOW())
                AND (valid_until IS NULL OR valid_until >= NOW())
              THEN 'active'
              WHEN valid_until < NOW() THEN 'expired'
              WHEN valid_from > NOW() THEN 'scheduled'
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
                AND (valid_from IS NULL OR valid_from <= NOW())
                AND (valid_until IS NULL OR valid_until >= NOW())
                AND (usage_limit_total IS NULL OR usage_count < usage_limit_total)
              THEN 'active'
              WHEN valid_until < NOW() THEN 'expired'
              WHEN usage_limit_total IS NOT NULL AND usage_count >= usage_limit_total THEN 'exhausted'
              WHEN valid_from > NOW() THEN 'scheduled'
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
      dateConditions.push('o.created_at >= ?');
      dateParams.push(dateFrom);
    }

    if (dateTo) {
      dateConditions.push('o.created_at <= ?');
      dateParams.push(dateTo);
    }

    const dateClause = dateConditions.length > 0 
      ? `AND ${dateConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        SUM(o.total_amount) as total_revenue,
        COALESCE(SUM(vc.commission_amount), 0) as total_commission,
        SUM(o.total_amount) - COALESCE(SUM(vc.commission_amount), 0) as net_revenue,
        
        (SELECT COALESCE(SUM(payout_amount), 0) 
         FROM vendor_payouts 
         WHERE vendor_id = ? 
           AND payout_status = 'pending') as pending_payouts,
        
        (SELECT COALESCE(SUM(payout_amount), 0) 
         FROM vendor_payouts 
         WHERE vendor_id = ? 
           AND payout_status = 'completed') as completed_payouts
        
      FROM orders o
      LEFT JOIN vendor_commissions vc ON o.order_id = vc.order_id AND vc.vendor_id = o.vendor_id
      WHERE o.vendor_id = ? 
        AND o.status NOT IN ('cancelled', 'refunded')
        ${dateClause}
    `;

    const params = [vendorId, vendorId, vendorId, ...dateParams];
    const [summary] = await this.executeQuery<any>(query, params);

    // Get monthly breakdown
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        SUM(o.total_amount) as revenue,
        COALESCE(SUM(vc.commission_amount), 0) as commission,
        SUM(o.total_amount) - COALESCE(SUM(vc.commission_amount), 0) as net_revenue,
        COUNT(DISTINCT o.order_id) as order_count
      FROM orders o
      LEFT JOIN vendor_commissions vc ON o.order_id = vc.order_id AND vc.vendor_id = o.vendor_id
      WHERE o.vendor_id = ? 
        AND o.status NOT IN ('cancelled', 'refunded')
        ${dateClause}
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    const monthlyBreakdown = await this.executeQuery<any>(monthlyQuery, params);

    return {
      totalRevenue: parseDecimal(summary?.total_revenue),
      totalCommission: parseDecimal(summary?.total_commission),
      netRevenue: parseDecimal(summary?.net_revenue),
      pendingPayouts: parseDecimal(summary?.pending_payouts),
      completedPayouts: parseDecimal(summary?.completed_payouts),
      monthlyBreakdown: monthlyBreakdown.reverse()
    };
  }
}