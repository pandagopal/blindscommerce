/**
 * Vendor Service for BlindsCommerce
 * Handles all vendor-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseDecimal } from '@/lib/utils/priceUtils';

interface VendorInfo extends RowDataPacket {
  user_id: number; // vendor_info now uses user_id as primary key
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
    super('vendor_info', 'user_id'); // vendor_info now uses user_id as primary key
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
        
        -- Sales team (removed - sales_staff is now independent of vendors)
        0 as sales_team_count
        
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
      ) p_stats ON vi.user_id = p_stats.vendor_id

      -- Order stats
      LEFT JOIN (
        SELECT
          oi.vendor_id,
          COUNT(DISTINCT o.order_id) as total_orders,
          SUM(oi.total_price) as total_revenue,
          COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id ELSE NULL END) as pending_orders
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE oi.vendor_id IS NOT NULL
        GROUP BY oi.vendor_id
      ) o_stats ON vi.user_id = o_stats.vendor_id

      -- Review stats
      LEFT JOIN (
        SELECT
          vp.vendor_id,
          AVG(pr.rating) as average_rating,
          COUNT(DISTINCT pr.review_id) as total_reviews
        FROM product_reviews pr
        JOIN vendor_products vp ON pr.product_id = vp.product_id
        GROUP BY vp.vendor_id
      ) r_stats ON vi.user_id = r_stats.vendor_id

      WHERE vi.user_id = ?
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
            SUM(oi.total_price) as vendor_total,
            o.created_at,
            o.order_number,
            u.email as customer_email,
            CONCAT(u.first_name, ' ', u.last_name) as customer_name,
            COUNT(DISTINCT oi.order_item_id) as item_count
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          JOIN users u ON o.user_id = u.user_id
          WHERE oi.vendor_id = ?
          GROUP BY o.order_id, o.status, o.created_at, o.order_number, u.email, u.first_name, u.last_name
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
            WHERE oi.vendor_id = ? AND o.status NOT IN ('cancelled', 'refunded')
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
            SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN oi.total_price ELSE 0 END) as today,
            SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN oi.total_price ELSE 0 END) as week,
            SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN oi.total_price ELSE 0 END) as month,
            SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) THEN oi.total_price ELSE 0 END) as year
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          WHERE oi.vendor_id = ? AND o.status NOT IN ('cancelled', 'refunded')
        `,
        params: [vendorId]
      },
      performanceMetrics: {
        query: `
          SELECT 
            -- Order fulfillment rate
            COALESCE(
              SUM(CASE WHEN o.status IN ('completed', 'shipped') THEN 1 ELSE 0 END) * 100.0 / 
              NULLIF(COUNT(*), 0), 
              0
            ) as order_fulfillment_rate,
            
            -- Average processing time (in hours)
            COALESCE(
              AVG(
                CASE 
                  WHEN o.status IN ('completed', 'shipped') AND o.updated_at IS NOT NULL 
                  THEN TIMESTAMPDIFF(HOUR, o.created_at, o.updated_at) 
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
            
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          WHERE oi.vendor_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `,
        params: [vendorId, vendorId]
      }
    });

    // Map to the format expected by the vendor dashboard page
    return {
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
      whereConditions.push('vp.is_active = ?');
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
        vp.is_active,
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
        WHERE oi.vendor_id = ?
        GROUP BY oi.product_id
      ) sales ON p.product_id = sales.product_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${normalizedSortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

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
        SUM(oi.total_price) as total_revenue,
        COALESCE(SUM(vc.commission_amount), 0) as total_commission,
        SUM(oi.total_price) - COALESCE(SUM(vc.commission_amount), 0) as net_revenue,
        
        (SELECT COALESCE(SUM(payout_amount), 0) 
         FROM vendor_payouts 
         WHERE vendor_id = ? 
           AND payout_status = 'pending') as pending_payouts,
        
        (SELECT COALESCE(SUM(payout_amount), 0) 
         FROM vendor_payouts 
         WHERE vendor_id = ? 
           AND payout_status = 'completed') as completed_payouts
        
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN vendor_commissions vc ON o.order_id = vc.order_id AND vc.vendor_id = oi.vendor_id
      WHERE oi.vendor_id = ? 
        AND o.status NOT IN ('cancelled', 'refunded')
        ${dateClause}
    `;

    const params = [vendorId, vendorId, vendorId, ...dateParams];
    const [summary] = await this.executeQuery<any>(query, params);

    // Get monthly breakdown
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        SUM(oi.total_price) as revenue,
        COALESCE(SUM(vc.commission_amount), 0) as commission,
        SUM(oi.total_price) - COALESCE(SUM(vc.commission_amount), 0) as net_revenue,
        COUNT(DISTINCT o.order_id) as order_count
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN vendor_commissions vc ON o.order_id = vc.order_id AND vc.vendor_id = oi.vendor_id
      WHERE oi.vendor_id = ? 
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

  /**
   * ============================================
   * SECURITY METHODS - Vendor Lifecycle Management
   * ============================================
   */

  /**
   * Disable vendor with cascade options
   * @param vendorId - The vendor's user_id
   * @param options - Configuration for cascade behavior
   */
  async disableVendor(
    vendorId: number,
    options: {
      reason: string;
      disabledBy: number;
      cascadeToSales?: boolean;
      cascadeToProducts?: boolean;
      notifySales?: boolean;
    }
  ): Promise<{
    success: boolean;
    affectedSales: number;
    affectedProducts: number;
  }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Disable vendor user account
      await conn.execute(
        `UPDATE users
         SET is_active = 0,
             disabled_at = NOW(),
             disabled_by = ?,
             disabled_reason = ?
         WHERE user_id = ? AND role = 'vendor'`,
        [options.disabledBy, options.reason, vendorId]
      );

      // 2. Update vendor_info status
      await conn.execute(
        `UPDATE vendor_info
         SET approval_status = 'suspended',
             suspended_at = NOW(),
             suspended_by = ?,
             suspended_reason = ?
         WHERE user_id = ?`,
        [options.disabledBy, options.reason, vendorId]
      );

      let affectedSales = 0;
      let affectedProducts = 0;

      // 3. Handle sales staff
      if (options.cascadeToSales) {
        // Disable all sales staff linked to this vendor
        const [salesResult] = await conn.execute(
          `UPDATE sales_staff
           SET is_active = 0,
               disabled_at = NOW(),
               disabled_by = ?,
               disabled_reason = ?
           WHERE vendor_id = ? AND is_active = 1`,
          [options.disabledBy, `Vendor disabled: ${options.reason}`, vendorId]
        ) as any;
        affectedSales = salesResult.affectedRows;
      } else {
        // Unlink sales from vendor (make them independent)
        const [salesResult] = await conn.execute(
          `UPDATE sales_staff
           SET vendor_id = NULL,
               vendor_unlinked_at = NOW()
           WHERE vendor_id = ?`,
          [vendorId]
        ) as any;
        affectedSales = salesResult.affectedRows;
      }

      // 4. Handle products
      if (options.cascadeToProducts) {
        // Disable all products
        const [productResult] = await conn.execute(
          `UPDATE products
           SET is_active = 0,
               archived_at = NOW(),
               archived_reason = ?
           WHERE vendor_id = ? AND is_active = 1`,
          [`Vendor disabled: ${options.reason}`, vendorId]
        ) as any;
        affectedProducts = productResult.affectedRows;
      } else {
        // Unlink products (make them marketplace products)
        const [productResult] = await conn.execute(
          `UPDATE products
           SET vendor_id = NULL
           WHERE vendor_id = ?`,
          [vendorId]
        ) as any;
        affectedProducts = productResult.affectedRows;
      }

      // 5. Get sales staff emails for notification
      if (options.notifySales !== false) {
        const [salesStaff] = await conn.execute(
          `SELECT u.email, u.first_name, u.last_name
           FROM sales_staff ss
           JOIN users u ON ss.user_id = u.user_id
           WHERE ss.vendor_id = ? OR ss.vendor_id IS NULL`,
          [vendorId]
        ) as any;

        // TODO: Send email notifications to sales staff
        // await this.sendVendorDisabledNotifications(salesStaff, options.reason);
      }

      // 6. Create audit log entry
      await conn.execute(
        `INSERT INTO audit_log (entity_type, entity_id, action, performed_by, details)
         VALUES ('vendor', ?, 'disabled', ?, ?)`,
        [
          vendorId,
          options.disabledBy,
          JSON.stringify({
            reason: options.reason,
            cascade_sales: options.cascadeToSales || false,
            cascade_products: options.cascadeToProducts || false,
            affected_sales: affectedSales,
            affected_products: affectedProducts
          })
        ]
      );

      await conn.commit();

      return {
        success: true,
        affectedSales,
        affectedProducts
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Re-enable vendor (requires manual review of sales staff)
   * @param vendorId - The vendor's user_id
   * @param enabledBy - User ID performing the action
   */
  async enableVendor(
    vendorId: number,
    enabledBy: number
  ): Promise<{
    success: boolean;
    pendingSalesReview: number;
  }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Enable vendor user account
      await conn.execute(
        `UPDATE users
         SET is_active = 1,
             disabled_at = NULL,
             disabled_by = NULL,
             disabled_reason = NULL
         WHERE user_id = ? AND role = 'vendor'`,
        [vendorId]
      );

      // 2. Update vendor_info status
      await conn.execute(
        `UPDATE vendor_info
         SET approval_status = 'approved',
             suspended_at = NULL,
             suspended_by = NULL,
             suspended_reason = NULL
         WHERE user_id = ?`,
        [vendorId]
      );

      // 3. Count sales staff that need manual review
      const [salesCount] = await conn.execute(
        `SELECT COUNT(*) as count
         FROM sales_staff
         WHERE vendor_id = ? AND is_active = 0`,
        [vendorId]
      ) as any[];

      const pendingCount = salesCount[0]?.count || 0;

      // 4. Create admin task for manual review if needed
      if (pendingCount > 0) {
        await conn.execute(
          `INSERT INTO admin_tasks (task_type, related_entity, priority, details, created_at)
           VALUES ('review_sales_staff', ?, 'high', ?, NOW())`,
          [
            vendorId,
            JSON.stringify({
              count: pendingCount,
              reason: 'Vendor re-enabled, review sales staff activation',
              vendor_id: vendorId
            })
          ]
        );
      }

      // 5. Create audit log
      await conn.execute(
        `INSERT INTO audit_log (entity_type, entity_id, action, performed_by, details)
         VALUES ('vendor', ?, 'enabled', ?, ?)`,
        [
          vendorId,
          enabledBy,
          JSON.stringify({
            pending_sales_review: pendingCount
          })
        ]
      );

      await conn.commit();

      return {
        success: true,
        pendingSalesReview: pendingCount
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Permanently delete vendor (GDPR, legal compliance)
   * @param vendorId - The vendor's user_id
   * @param deletedBy - User ID performing the deletion
   * @param reason - Reason for permanent deletion
   */
  async deleteVendorPermanently(
    vendorId: number,
    deletedBy: number,
    reason: string
  ): Promise<{
    success: boolean;
    archivedData: boolean;
    affectedSales: number;
    affectedProducts: number;
  }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Archive vendor data for compliance (GDPR requires keeping certain records)
      const [vendorData] = await conn.execute(
        `SELECT * FROM vendor_info WHERE user_id = ?`,
        [vendorId]
      ) as any;

      if (vendorData.length > 0) {
        await conn.execute(
          `INSERT INTO archived_vendor_data (original_user_id, vendor_data, archived_at, archived_by, deletion_reason)
           VALUES (?, ?, NOW(), ?, ?)`,
          [
            vendorId,
            JSON.stringify(vendorData[0]),
            deletedBy,
            reason
          ]
        );
      }

      // 2. Unlink sales staff (make them independent)
      const [salesResult] = await conn.execute(
        `UPDATE sales_staff
         SET vendor_id = NULL,
             vendor_unlinked_at = NOW()
         WHERE vendor_id = ?`,
        [vendorId]
      ) as any;
      const affectedSales = salesResult.affectedRows;

      // 3. Unlink products (convert to marketplace products)
      const [productResult] = await conn.execute(
        `UPDATE products
         SET vendor_id = NULL
         WHERE vendor_id = ?`,
        [vendorId]
      ) as any;
      const affectedProducts = productResult.affectedRows;

      // 4. Create audit log before deletion
      await conn.execute(
        `INSERT INTO audit_log (entity_type, entity_id, action, performed_by, details)
         VALUES ('vendor', ?, 'permanently_deleted', ?, ?)`,
        [
          vendorId,
          deletedBy,
          JSON.stringify({
            reason,
            affected_sales: affectedSales,
            affected_products: affectedProducts,
            archived: true
          })
        ]
      );

      // 5. Delete vendor_info (will cascade to users table if FK set up that way)
      await conn.execute(
        `DELETE FROM vendor_info WHERE user_id = ?`,
        [vendorId]
      );

      // 6. Delete user account
      await conn.execute(
        `DELETE FROM users WHERE user_id = ? AND role = 'vendor'`,
        [vendorId]
      );

      await conn.commit();

      return {
        success: true,
        archivedData: vendorData.length > 0,
        affectedSales,
        affectedProducts
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Get vendor status and security info
   * @param vendorId - The vendor's user_id
   */
  async getVendorSecurityStatus(vendorId: number): Promise<{
    isActive: boolean;
    approvalStatus: string;
    isSuspended: boolean;
    suspendedAt: Date | null;
    suspendedReason: string | null;
    linkedSalesCount: number;
    disabledSalesCount: number;
    activeProductsCount: number;
    disabledProductsCount: number;
  }> {
    const pool = await getPool();

    const [result] = await pool.execute(
      `SELECT
        u.is_active,
        vi.approval_status,
        vi.suspended_at,
        vi.suspended_reason,
        COALESCE(sales_total.total, 0) as linked_sales_count,
        COALESCE(sales_disabled.total, 0) as disabled_sales_count,
        COALESCE(products_active.total, 0) as active_products_count,
        COALESCE(products_disabled.total, 0) as disabled_products_count
      FROM users u
      JOIN vendor_info vi ON u.user_id = vi.user_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as total
        FROM sales_staff
        WHERE vendor_id = ?
        GROUP BY vendor_id
      ) sales_total ON vi.user_id = sales_total.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as total
        FROM sales_staff
        WHERE vendor_id = ? AND is_active = 0
        GROUP BY vendor_id
      ) sales_disabled ON vi.user_id = sales_disabled.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as total
        FROM products
        WHERE vendor_id = ? AND is_active = 1
        GROUP BY vendor_id
      ) products_active ON vi.user_id = products_active.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as total
        FROM products
        WHERE vendor_id = ? AND is_active = 0
        GROUP BY vendor_id
      ) products_disabled ON vi.user_id = products_disabled.vendor_id
      WHERE u.user_id = ?`,
      [vendorId, vendorId, vendorId, vendorId, vendorId]
    ) as any;

    const data = result[0];

    return {
      isActive: Boolean(data?.is_active),
      approvalStatus: data?.approval_status || 'unknown',
      isSuspended: data?.approval_status === 'suspended',
      suspendedAt: data?.suspended_at || null,
      suspendedReason: data?.suspended_reason || null,
      linkedSalesCount: parseInt(data?.linked_sales_count || '0'),
      disabledSalesCount: parseInt(data?.disabled_sales_count || '0'),
      activeProductsCount: parseInt(data?.active_products_count || '0'),
      disabledProductsCount: parseInt(data?.disabled_products_count || '0')
    };
  }

  /**
   * Get audit history for vendor
   * @param vendorId - The vendor's user_id
   * @param limit - Maximum number of records to return
   */
  async getVendorAuditHistory(
    vendorId: number,
    limit: number = 50
  ): Promise<any[]> {
    const pool = await getPool();

    const [results] = await pool.execute(
      `SELECT
        al.audit_id,
        al.action,
        al.details,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.performed_by = u.user_id
      WHERE al.entity_type = 'vendor' AND al.entity_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?`,
      [vendorId, limit]
    );

    return results as any[];
  }
}