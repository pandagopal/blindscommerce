/**
 * User Service for BlindsCommerce
 * Handles all user-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hashPassword } from '@/lib/db';
import { getPool } from '@/lib/db';

interface User extends RowDataPacket {
  user_id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserWithDetails extends User {
  vendor_info?: {
    user_id: number; // vendor_info now uses user_id as primary key
    business_name: string;
    commission_rate: number;
    is_approved: boolean;
  };
  sales_info?: {
    sales_staff_id: number;
    commission_rate: number;
    total_sales: number;
  };
  customer_info?: {
    total_orders: number;
    total_spent: number;
    loyalty_points: number;
  };
}

interface UserCreationData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  vendor_data?: {
    business_name: string;
    tax_id?: string;
    commission_rate?: number;
  };
}

export class UserService extends BaseService {
  constructor() {
    super('users', 'user_id');
  }

  /**
   * Get user with role-specific details in a single query
   */
  async getUserWithDetails(userId: number): Promise<UserWithDetails | null> {
    const query = `
      SELECT
        u.*,
        -- Vendor info
        vi.user_id as vendor_user_id,
        vi.business_name,
        vi.commission_rate as vendor_commission_rate,
        vi.is_approved as vendor_is_approved,
        
        -- Sales rep info
        sr.sales_staff_id,
        sr.commission_rate as sales_commission_rate,
        COALESCE(sr_stats.total_sales, 0) as sales_total_sales,
        
        -- Customer info
        COALESCE(c_stats.total_orders, 0) as customer_total_orders,
        COALESCE(c_stats.total_spent, 0) as customer_total_spent,
        COALESCE(lp.points_balance, 0) as customer_loyalty_points
        
      FROM users u
      LEFT JOIN vendor_info vi ON u.user_id = vi.user_id AND u.role = 'vendor'
      LEFT JOIN sales_staff sr ON u.user_id = sr.user_id AND u.role = 'sales_representative'
      LEFT JOIN (
        SELECT 
          assigned_to as sales_rep_id,
          COUNT(*) as total_sales
        FROM leads
        WHERE status = 'closed_won'
        GROUP BY assigned_to
      ) sr_stats ON u.user_id = sr_stats.sales_rep_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded')
        GROUP BY user_id
      ) c_stats ON u.user_id = c_stats.user_id AND u.role = 'customer'
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(CASE 
            WHEN transaction_type IN ('earned', 'bonus', 'referral', 'adjusted') THEN points_amount 
            WHEN transaction_type IN ('redeemed', 'expired') THEN -points_amount 
            ELSE 0 
          END) as points_balance
        FROM loyalty_points_transactions
        GROUP BY user_id
      ) lp ON u.user_id = lp.user_id
      WHERE u.user_id = ?
      LIMIT 1
    `;

    const [user] = await this.executeQuery<UserWithDetails>(query, [userId]);
    
    if (!user) return null;

    // Organize role-specific data
    const userWithDetails: UserWithDetails = { ...user };

    if (user.role === 'vendor' && user.vendor_user_id) {
      userWithDetails.vendor_info = {
        user_id: user.vendor_user_id,
        business_name: user.business_name,
        commission_rate: user.vendor_commission_rate,
        is_approved: user.vendor_is_approved
      };
    }

    if (user.role === 'sales_representative' && user.sales_staff_id) {
      userWithDetails.sales_info = {
        sales_staff_id: user.sales_staff_id,
        commission_rate: user.sales_commission_rate,
        total_sales: user.sales_total_sales
      };
    }

    if (user.role === 'customer') {
      userWithDetails.customer_info = {
        total_orders: user.customer_total_orders,
        total_spent: user.customer_total_spent,
        loyalty_points: user.customer_loyalty_points
      };
    }

    // Clean up extra fields
    delete userWithDetails.vendor_user_id;
    delete userWithDetails.business_name;
    delete userWithDetails.vendor_commission_rate;
    delete userWithDetails.vendor_is_approved;
    delete userWithDetails.sales_staff_id;
    delete userWithDetails.sales_commission_rate;
    delete userWithDetails.sales_total_sales;
    delete userWithDetails.customer_total_orders;
    delete userWithDetails.customer_total_spent;
    delete userWithDetails.customer_loyalty_points;

    return userWithDetails;
  }

  /**
   * Create a new user with role-specific data
   */
  async createUser(data: UserCreationData): Promise<UserWithDetails | null> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const [userResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, phone,
          role, is_active, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.email,
          passwordHash,
          data.first_name || null,
          data.last_name || null,
          data.phone || null,
          data.role,
          1,
          0
        ]
      );

      const userId = userResult.insertId;

      // Create role-specific data
      if (data.role === 'vendor' && data.vendor_data) {
        await connection.execute(
          `INSERT INTO vendor_info (
            user_id, business_name, tax_id, commission_rate,
            is_approved, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            data.vendor_data.business_name,
            data.vendor_data.tax_id || null,
            data.vendor_data.commission_rate || 10,
            0
          ]
        );
      }

      // Create default preferences using key-value pattern
      await connection.execute(
        `INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
         VALUES (?, 'email_notifications', '1', NOW(), NOW()),
                (?, 'sms_notifications', '0', NOW(), NOW()),
                (?, 'newsletter_subscribed', '1', NOW(), NOW())`,
        [userId, userId, userId]
      );

      await connection.commit();

      return this.getUserWithDetails(userId);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get users with filtering and pagination
   */
  async getUsers(options: {
    role?: string | string[];
    isActive?: boolean;
    isVerified?: boolean;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'created_at' | 'email' | 'name';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<{ users: UserWithDetails[]; total: number }> {
    const {
      role,
      isActive,
      isVerified,
      search,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0
    } = options;

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (role) {
      if (Array.isArray(role)) {
        const rolePlaceholders = role.map(() => '?').join(',');
        whereConditions.push(`u.role IN (${rolePlaceholders})`);
        whereParams.push(...role);
      } else {
        whereConditions.push('u.role = ?');
        whereParams.push(role);
      }
    }

    if (isActive !== undefined) {
      whereConditions.push('u.is_active = ?');
      whereParams.push(isActive ? 1 : 0);
    }

    if (isVerified !== undefined) {
      whereConditions.push('u.is_verified = ?');
      whereParams.push(isVerified ? 1 : 0);
    }

    if (search) {
      whereConditions.push(
        '(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR vi.business_name LIKE ?)'
      );
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Note: vendorId filter removed as sales_staff is now independent of vendors

    if (dateFrom) {
      whereConditions.push('u.created_at >= ?');
      whereParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('u.created_at <= ?');
      whereParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Determine sort column
    const sortColumn = sortBy === 'name' 
      ? "CONCAT(u.first_name, ' ', u.last_name)"
      : `u.${sortBy}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.user_id) as total
      FROM users u
      LEFT JOIN vendor_info vi ON u.user_id = vi.user_id
      LEFT JOIN sales_staff sr ON u.user_id = sr.user_id
      ${whereClause}
    `;

    const [countResult] = await this.executeQuery<RowDataPacket>(countQuery, whereParams);
    const total = countResult.total || 0;

    // Get users with basic role info
    const usersQuery = `
      SELECT DISTINCT
        u.*,
        vi.business_name,
        vi.user_id as vendor_user_id,
        sr.sales_staff_id,
        
        CASE u.role
          WHEN 'vendor' THEN vi.business_name
          WHEN 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
          WHEN 'sales_representative' THEN CONCAT(u.first_name, ' ', u.last_name)
          ELSE u.email
        END as display_name
        
      FROM users u
      LEFT JOIN vendor_info vi ON u.user_id = vi.user_id
      LEFT JOIN sales_staff sr ON u.user_id = sr.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    const usersQueryParams = [...whereParams];
    const users = await this.executeQuery<UserWithDetails>(usersQuery, usersQueryParams);

    // Get additional statistics for users in batches
    if (users.length > 0) {
      const userIds = users.map(u => u.user_id);
      const placeholders = userIds.map(() => '?').join(',');

      // Get customer statistics
      const customerStats = await this.executeQuery<any>(
        `SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent
        FROM orders
        WHERE user_id IN (${placeholders})
          AND status NOT IN ('cancelled', 'refunded')
        GROUP BY user_id`,
        userIds
      );

      const statsByUserId = customerStats.reduce((acc, stat) => {
        acc[stat.user_id] = stat;
        return acc;
      }, {} as Record<number, any>);

      // Enhance user data
      users.forEach(user => {
        if (user.role === 'customer' && statsByUserId[user.user_id]) {
          user.customer_info = {
            total_orders: statsByUserId[user.user_id].total_orders,
            total_spent: parseFloat(statsByUserId[user.user_id].total_spent || 0),
            loyalty_points: 0 // Would need separate query
          };
        }
      });
    }

    return { users, total };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    data: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    }>
  ): Promise<UserWithDetails | null> {
    await this.update(userId, {
      ...data,
      updated_at: new Date()
    });

    return this.getUserWithDetails(userId);
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    userId: number,
    days: number = 30
  ): Promise<{
    recentOrders: any[];
    recentReviews: any[];
    recentWishlist: any[];
    loginHistory: any[];
  }> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const results = await this.executeParallel<{
      recentOrders: any[];
      recentReviews: any[];
      recentWishlist: any[];
      loginHistory: any[];
    }>({
      recentOrders: {
        query: `
          SELECT 
            order_id,
            order_number,
            status,
            total_amount,
            created_at
          FROM orders
          WHERE user_id = ? AND created_at >= ?
          ORDER BY created_at DESC
          LIMIT 10
        `,
        params: [userId, dateLimit]
      },
      recentReviews: {
        query: `
          SELECT 
            pr.review_id,
            pr.rating,
            pr.comment,
            pr.created_at,
            p.name as product_name,
            p.slug as product_slug
          FROM product_reviews pr
          JOIN products p ON pr.product_id = p.product_id
          WHERE pr.user_id = ? AND pr.created_at >= ?
          ORDER BY pr.created_at DESC
          LIMIT 10
        `,
        params: [userId, dateLimit]
      },
      recentWishlist: {
        query: `
          SELECT 
            w.wishlist_id,
            w.created_at,
            p.name as product_name,
            p.slug as product_slug,
            p.base_price
          FROM wishlist w
          JOIN products p ON w.product_id = p.product_id
          WHERE w.user_id = ?
          ORDER BY w.created_at DESC
          LIMIT 10
        `,
        params: [userId]
      },
      loginHistory: {
        query: `
          SELECT 
            login_time,
            ip_address,
            user_agent,
            location
          FROM user_login_history
          WHERE user_id = ?
          ORDER BY login_time DESC
          LIMIT 20
        `,
        params: [userId]
      }
    });

    return results;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.count({ email });
    return count > 0;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.executeQuery<User>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return user || null;
  }
}