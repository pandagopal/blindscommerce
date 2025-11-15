/**
 * Users Handler for V2 API
 * Handles user profiles, preferences, and account management
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { userService, orderService } from '@/lib/services/singletons';
import { z } from 'zod';
import { hashPassword, comparePassword } from '@/lib/db';
import { randomBytes } from 'crypto';

// Validation schemas
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const UpdatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  newsletterSubscribed: z.boolean().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
});

const AddAddressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  isDefault: z.boolean().default(false),
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default('US'),
  phone: z.string().optional(),
});

export class UsersHandler extends BaseHandler {
  private userService = userService;
  private orderService = orderService;

  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    // Check if action[0] is a numeric ID
    if (action[0] && !isNaN(Number(action[0]))) {
      return this.getUserById(action[0], user);
    }

    const routes = {
      'profile': () => this.getProfile(user),
      'profile/full': () => this.getFullProfile(user),
      'preferences': () => this.getPreferences(user),
      'addresses': () => this.getAddresses(user),
      'addresses/:id': () => this.getAddress(action[1], user),
      'orders': () => this.getUserOrders(req, user),
      'activity': () => this.getActivity(req, user),
      'wishlist': () => this.getWishlist(req, user),
      'loyalty': () => this.getLoyaltyInfo(user),
      'commercial-eligibility': () => this.getCommercialEligibility(user),
      'measurements': () => this.getMeasurements(req, user),
      'configurations': () => this.getConfigurations(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'addresses': () => this.addAddress(req, user),
      'wishlist/add': () => this.addToWishlist(req, user),
      'verify-email': () => this.verifyEmail(req, user),
      'request-verification': () => this.requestVerification(user),
      'measurements': () => this.createMeasurementRequest(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'profile': () => this.updateProfile(req, user),
      'preferences': () => this.updatePreferences(req, user),
      'password': () => this.changePassword(req, user),
      'addresses/:id': () => this.updateAddress(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle DELETE requests
   */
  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'addresses/:id': () => this.deleteAddress(action[1], user),
      'wishlist/:id': () => this.removeFromWishlist(action[1], user),
      'account': () => this.deleteAccount(req, user),
    };

    return this.routeAction(action, routes);
  }

  // Profile methods
  private async getProfile(user: any) {
    this.requireAuth(user);

    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    };
  }

  private async getFullProfile(user: any) {
    this.requireAuth(user);

    const profile = await this.userService.getUserWithDetails(user.user_id);
    if (!profile) {
      throw new ApiError('Profile not found', 404);
    }

    return profile;
  }

  private async updateProfile(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, UpdateProfileSchema);

    // Check if email is being changed
    if (data.email && data.email !== user.email) {
      const exists = await this.userService.emailExists(data.email);
      if (exists) {
        throw new ApiError('Email already in use', 400);
      }
    }

    const updated = await this.userService.updateProfile(user.user_id, {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email,
    });

    if (!updated) {
      throw new ApiError('Failed to update profile', 500);
    }

    return updated;
  }

  // Password management
  private async changePassword(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, ChangePasswordSchema);

    // Verify current password
    const currentUser = await this.userService.findById(user.user_id);
    const isValid = await comparePassword(
      data.currentPassword,
      currentUser.password_hash
    );

    if (!isValid) {
      throw new ApiError('Current password is incorrect', 400);
    }

    // Update password
    const newHash = await hashPassword(data.newPassword);
    await this.userService.update(user.user_id, {
      password_hash: newHash,
      updated_at: new Date(),
    });

    return { message: 'Password changed successfully' };
  }

  // Preferences
  private async getPreferences(user: any) {
    this.requireAuth(user);

    const prefs = await this.userService.raw(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [user.user_id]
    );

    return prefs[0] || {
      emailNotifications: true,
      smsNotifications: false,
      newsletterSubscribed: true,
      language: 'en',
      currency: 'USD',
    };
  }

  private async updatePreferences(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, UpdatePreferencesSchema);

    // Update preferences (simplified - should use proper service method)
    await this.userService.raw(
      `UPDATE user_preferences 
       SET email_notifications = COALESCE(?, email_notifications),
           sms_notifications = COALESCE(?, sms_notifications),
           newsletter_subscribed = COALESCE(?, newsletter_subscribed),
           language = COALESCE(?, language),
           currency = COALESCE(?, currency),
           updated_at = NOW()
       WHERE user_id = ?`,
      [
        data.emailNotifications,
        data.smsNotifications,
        data.newsletterSubscribed,
        data.language,
        data.currency,
        user.user_id,
      ]
    );

    return { message: 'Preferences updated successfully' };
  }

  // Address management
  private async getAddresses(user: any) {
    this.requireAuth(user);

    const addresses = await this.userService.raw(
      `SELECT * FROM user_shipping_addresses 
       WHERE user_id = ? AND is_active = 1 
       ORDER BY is_default DESC, created_at DESC`,
      [user.user_id]
    );

    return addresses;
  }

  private async getAddress(id: string, user: any) {
    this.requireAuth(user);

    const addressId = parseInt(id);
    if (isNaN(addressId)) {
      throw new ApiError('Invalid address ID', 400);
    }

    const [address] = await this.userService.raw(
      'SELECT * FROM user_shipping_addresses WHERE address_id = ? AND user_id = ?',
      [addressId, user.user_id]
    );

    if (!address) {
      throw new ApiError('Address not found', 404);
    }

    return address;
  }

  private async addAddress(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, AddAddressSchema);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.userService.raw(
        'UPDATE user_shipping_addresses SET is_default = 0 WHERE user_id = ? AND is_billing_address = ?',
        [user.user_id, data.type === 'billing' ? 1 : 0]
      );
    }

    const result = await this.userService.raw(
      `INSERT INTO user_shipping_addresses (
        user_id, address_name, is_default, is_billing_address, first_name, last_name, company,
        address_line_1, address_line_2, city, state_province, postal_code, country, phone,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.user_id,
        `${data.firstName} ${data.lastName} ${data.type}`,
        data.isDefault,
        data.type === 'billing' ? 1 : 0,
        data.firstName,
        data.lastName,
        data.company,
        data.street1,
        data.street2,
        data.city,
        data.state,
        data.zipCode,
        data.country,
        data.phone,
      ]
    );

    return { 
      addressId: (result as any).insertId,
      message: 'Address added successfully' 
    };
  }

  private async updateAddress(id: string, req: NextRequest, user: any) {
    this.requireAuth(user);

    const addressId = parseInt(id);
    if (isNaN(addressId)) {
      throw new ApiError('Invalid address ID', 400);
    }

    const data = await this.getValidatedBody(req, AddAddressSchema.partial());

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.userService.raw(
        'UPDATE user_shipping_addresses SET is_default = 0 WHERE user_id = ? AND is_billing_address = ? AND address_id != ?',
        [user.user_id, data.type === 'billing' ? 1 : 0, addressId]
      );
    }

    const result = await this.userService.raw(
      `UPDATE user_shipping_addresses 
       SET is_billing_address = COALESCE(?, is_billing_address),
           is_default = COALESCE(?, is_default),
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           company = COALESCE(?, company),
           address_line_1 = COALESCE(?, address_line_1),
           address_line_2 = COALESCE(?, address_line_2),
           city = COALESCE(?, city),
           state_province = COALESCE(?, state_province),
           postal_code = COALESCE(?, postal_code),
           country = COALESCE(?, country),
           phone = COALESCE(?, phone),
           updated_at = NOW()
       WHERE address_id = ? AND user_id = ?`,
      [
        data.type === 'billing' ? 1 : 0,
        data.isDefault,
        data.firstName,
        data.lastName,
        data.company,
        data.street1,
        data.street2,
        data.city,
        data.state,
        data.zipCode,
        data.country,
        data.phone,
        addressId,
        user.user_id,
      ]
    );

    if ((result as any).affectedRows === 0) {
      throw new ApiError('Address not found', 404);
    }

    return { message: 'Address updated successfully' };
  }

  private async deleteAddress(id: string, user: any) {
    this.requireAuth(user);

    const addressId = parseInt(id);
    if (isNaN(addressId)) {
      throw new ApiError('Invalid address ID', 400);
    }

    const result = await this.userService.raw(
      'UPDATE user_shipping_addresses SET is_active = 0 WHERE address_id = ? AND user_id = ?',
      [addressId, user.user_id]
    );

    if ((result as any).affectedRows === 0) {
      throw new ApiError('Address not found', 404);
    }

    return { message: 'Address deleted successfully' };
  }

  // User activity
  private async getUserOrders(req: NextRequest, user: any) {
    this.requireAuth(user);

    const { page, limit, offset } = this.getPagination(this.getSearchParams(req));

    const { orders, total } = await this.orderService.getOrders({
      userId: user.user_id,
      limit,
      offset,
    });

    return this.buildPaginatedResponse(orders, total, page, limit);
  }

  private async getActivity(req: NextRequest, user: any) {
    this.requireAuth(user);

    const searchParams = this.getSearchParams(req);
    const days = this.sanitizeNumber(searchParams.get('days'), 1, 365) || 30;

    return this.userService.getUserActivity(user.user_id, days);
  }

  // Wishlist
  private async getWishlist(req: NextRequest, user: any) {
    this.requireAuth(user);

    const { page, limit, offset } = this.getPagination(this.getSearchParams(req));

    const wishlist = await this.userService.raw(
      `SELECT
        wi.wishlist_item_id,
        wi.added_at as created_at,
        p.product_id,
        p.name,
        p.slug,
        p.primary_image_url,
        p.base_price,
        COALESCE(vp.vendor_price, p.base_price) as current_price
      FROM wishlist w
      JOIN wishlist_items wi ON w.wishlist_id = wi.wishlist_id
      JOIN products p ON wi.product_id = p.product_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      WHERE w.user_id = ?
      ORDER BY wi.added_at DESC
      LIMIT ? OFFSET ?`,
      [user.user_id, limit, offset]
    );

    const [countResult] = await this.userService.raw(
      `SELECT COUNT(*) as total 
       FROM wishlist w
       JOIN wishlist_items wi ON w.wishlist_id = wi.wishlist_id
       WHERE w.user_id = ?`,
      [user.user_id]
    );

    return this.buildPaginatedResponse(
      wishlist,
      countResult.total,
      page,
      limit
    );
  }

  private async addToWishlist(req: NextRequest, user: any) {
    this.requireAuth(user);

    const { productId } = await this.getValidatedBody(req, z.object({
      productId: z.number().positive(),
    }));

    // Get or create user's wishlist
    let [wishlist] = await this.userService.raw(
      'SELECT wishlist_id FROM wishlist WHERE user_id = ?',
      [user.user_id]
    );

    if (!wishlist) {
      // Create wishlist for user
      const result = await this.userService.raw(
        'INSERT INTO wishlist (user_id, created_at) VALUES (?, NOW())',
        [user.user_id]
      );
      wishlist = { wishlist_id: (result as any).insertId };
    }

    // Check if product already in wishlist
    const [exists] = await this.userService.raw(
      'SELECT 1 FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
      [wishlist.wishlist_id, productId]
    );

    if (exists) {
      throw new ApiError('Product already in wishlist', 400);
    }

    // Add product to wishlist
    await this.userService.raw(
      'INSERT INTO wishlist_items (wishlist_id, product_id, added_at) VALUES (?, ?, NOW())',
      [wishlist.wishlist_id, productId]
    );

    return { message: 'Product added to wishlist' };
  }

  private async removeFromWishlist(id: string, user: any) {
    this.requireAuth(user);

    const wishlistItemId = parseInt(id);
    if (isNaN(wishlistItemId)) {
      throw new ApiError('Invalid wishlist item ID', 400);
    }

    // Delete from wishlist_items, ensuring it belongs to the user
    const result = await this.userService.raw(
      `DELETE wi FROM wishlist_items wi
       JOIN wishlist w ON wi.wishlist_id = w.wishlist_id
       WHERE wi.wishlist_item_id = ? AND w.user_id = ?`,
      [wishlistItemId, user.user_id]
    );

    if ((result as any).affectedRows === 0) {
      throw new ApiError('Wishlist item not found', 404);
    }

    return { message: 'Product removed from wishlist' };
  }

  // Loyalty
  private async getLoyaltyInfo(user: any) {
    this.requireAuth(user);

    const [loyalty] = await this.userService.raw(
      `SELECT 
        lp.*,
        lt.name as tier_name,
        lt.benefits,
        lt.min_points as tier_min_points,
        lt.discount_percentage
      FROM loyalty_points lp
      LEFT JOIN loyalty_tiers lt ON lp.tier_id = lt.tier_id
      WHERE lp.user_id = ?`,
      [user.user_id]
    );

    if (!loyalty) {
      return {
        pointsBalance: 0,
        lifetimePoints: 0,
        tier: 'Bronze',
        benefits: [],
      };
    }

    return loyalty;
  }

  // Commercial eligibility
  private async getCommercialEligibility(user: any) {
    this.requireAuth(user);
    
    // Check customer order history
    const [orderStats] = await this.userService.raw(`
      SELECT COUNT(*) as order_count, SUM(total_amount) as total_spent
      FROM orders 
      WHERE user_id = ? AND status IN ('completed', 'delivered')
    `, [user.userId]);

    const orderHistory = orderStats as any;

    const requirements: string[] = [];
    let eligible = true;
    let reason = '';

    // Business email check
    if (!user.email.match(/\.(com|org|net|edu|gov)$/)) {
      requirements.push('Business email address');
    }

    // Order history check
    if (orderHistory.order_count < 2) {
      eligible = false;
      reason = 'Minimum 2 completed orders required for commercial templates';
      requirements.push('At least 2 completed orders');
    }

    // Spending threshold check
    if (orderHistory.total_spent < 500) {
      eligible = false;
      reason = 'Minimum $500 in completed orders required';
      requirements.push('At least $500 in completed orders');
    }

    return {
      eligible,
      reason: eligible ? undefined : reason,
      requirements: requirements.length > 0 ? requirements : undefined,
      orderHistory: {
        orderCount: orderHistory.order_count || 0,
        totalSpent: orderHistory.total_spent || 0
      }
    };
  }

  // Email verification
  private async verifyEmail(req: NextRequest, user: any) {
    const { token } = await this.getValidatedBody(req, z.object({
      token: z.string().min(1),
    }));

    // Verify token and update user
    const result = await this.userService.raw(
      `UPDATE users u
       JOIN email_verifications ev ON u.user_id = ev.user_id
       SET u.is_verified = 1, u.updated_at = NOW()
       WHERE ev.token = ? AND ev.expires_at > NOW()`,
      [token]
    );

    if ((result as any).affectedRows === 0) {
      throw new ApiError('Invalid or expired verification token', 400);
    }

    return { message: 'Email verified successfully' };
  }

  private async requestVerification(user: any) {
    this.requireAuth(user);

    if (user.is_verified) {
      throw new ApiError('Email already verified', 400);
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');

    // Save token
    await this.userService.raw(
      `INSERT INTO verification_tokens (identifier, token, expires)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
       ON DUPLICATE KEY UPDATE 
         token = VALUES(token),
         expires = VALUES(expires)`,
      [user.email, token]
    );

    // TODO: Send verification email

    return { message: 'Verification email sent' };
  }

  // Account deletion
  private async deleteAccount(req: NextRequest, user: any) {
    this.requireAuth(user);

    const { password } = await this.getValidatedBody(req, z.object({
      password: z.string().min(1),
    }));

    // Verify password
    const currentUser = await this.userService.findById(user.user_id);
    const isValid = await comparePassword(password, currentUser.password_hash);

    if (!isValid) {
      throw new ApiError('Invalid password', 400);
    }

    // Soft delete account
    await this.userService.update(user.user_id, {
      is_active: false,
      deleted_at: new Date(),
    });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Get user by ID - used by system for user lookup
   */
  private async getUserById(id: string, requestingUser: any) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }

    // Get user from service
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Return user data (excluding sensitive fields)
    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    };
  }

  private async getMeasurements(req: NextRequest, user: any) {
    this.requireAuth(user);

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const sort = searchParams.get('sort') || 'created_at';
    const order = (searchParams.get('order') || 'desc').toUpperCase();

    // Validate sort and order
    const allowedSorts = ['created_at', 'preferred_date', 'status'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Get measurement requests - using safe integer values for LIMIT/OFFSET
    const measurements = await this.userService.raw(
      `SELECT
        mr.*,
        CASE
          WHEN mr.status = 'scheduled' AND mr.preferred_date < CURDATE() THEN 'overdue'
          ELSE mr.status
        END as display_status
      FROM measurement_requests mr
      WHERE mr.user_id = ?
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?`,
      [user.user_id, limit, offset]
    );

    // Get total count
    const [countResult] = await this.userService.raw(
      `SELECT COUNT(*) as total FROM measurement_requests WHERE user_id = ?`,
      [user.user_id]
    );

    return {
      measurements,
      pagination: {
        total: countResult.total,
        page,
        limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  private async createMeasurementRequest(req: NextRequest, user: any) {
    this.requireAuth(user);

    const body = await req.json();
    const {
      order_id,
      property_address,
      preferred_date,
      preferred_time,
      contact_phone,
      special_instructions,
      room_details
    } = body;

    // Validate required fields
    if (!property_address) {
      throw new ApiError('Property address is required', 400);
    }

    // Insert measurement request
    const result = await this.userService.raw(
      `INSERT INTO measurement_requests 
        (user_id, order_id, property_address, preferred_date, preferred_time, 
         contact_phone, special_instructions, room_details, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        user.user_id,
        order_id || null,
        property_address,
        preferred_date || null,
        preferred_time || null,
        contact_phone || user.phone,
        special_instructions || null,
        room_details ? JSON.stringify(room_details) : null
      ]
    );

    const insertId = (result as any).insertId;

    // Return the created measurement request
    const [measurement] = await this.userService.raw(
      `SELECT * FROM measurement_requests WHERE request_id = ?`,
      [insertId]
    );

    return {
      success: true,
      measurement
    };
  }

  private async getConfigurations(req: NextRequest, user: any) {
    this.requireAuth(user);

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    // Get saved configurations
    const configurations = await this.userService.raw(
      `SELECT
        sc.*,
        p.name as product_name,
        p.slug as product_slug,
        p.primary_image_url,
        vi.business_name as vendor_name
      FROM saved_configurations sc
      LEFT JOIN products p ON sc.product_id = p.product_id
      LEFT JOIN vendor_info vi ON sc.vendor_id = vi.vendor_info_id
      WHERE sc.user_id = ?
      ORDER BY sc.created_at DESC
      LIMIT ? OFFSET ?`,
      [user.user_id, limit, offset]
    );

    // Get total count
    const [countResult] = await this.userService.raw(
      `SELECT COUNT(*) as total FROM saved_configurations WHERE user_id = ?`,
      [user.user_id]
    );

    // Parse configuration data
    const parsedConfigurations = configurations.map((config: any) => ({
      ...config,
      configuration_data: typeof config.configuration_data === 'string' 
        ? JSON.parse(config.configuration_data) 
        : config.configuration_data
    }));

    return {
      configurations: parsedConfigurations,
      pagination: {
        total: countResult.total,
        page,
        limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }
}