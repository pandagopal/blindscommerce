/**
 * Admin Handler for V2 API
 * Handles administrative functions
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { userService, vendorService, orderService, productService, settingsService, shippingService, productManager } from '@/lib/services/singletons';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { FileUploadService } from '@/lib/utils/fileUpload';
import { deleteCachePattern } from '@/lib/cache/cacheManager';

// Validation schemas
const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().optional(),
  featured: z.boolean().optional(),
  display_order: z.number().optional()
});

export class AdminHandler extends BaseHandler {
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'dashboard': () => this.getDashboard(),
      'users': () => this.getUsers(req),
      'users/:id': () => this.getUser(action[1]),
      'vendors': () => this.getVendors(req),
      'orders': () => this.getOrders(req),
      'orders/:id': () => this.getOrder(action[1]),
      'analytics': () => this.getAnalytics(req),
      'categories': () => this.getCategories(req),
      'categories/:id': () => this.getCategory(action[1]),
      'hero-banners': () => this.getHeroBanners(req),
      'hero-banners/:id': () => this.getHeroBanner(action[1]),
      'tax-rates': () => this.getTaxRates(req),
      'tax-rates/:id': () => this.getTaxRate(action[1]),
      'tax-rates/upload/template': () => this.getTaxRatesTemplate(),
      'settings': () => this.getSettings(req),
      'rooms': () => this.getRooms(req),
      'rooms/:id': () => this.getRoom(action[1]),
      'products': () => this.getProducts(req),
      'products/:id': () => this.getProduct(action[1]),
      'product-approvals': () => this.getProductApprovals(req),
      'product-approvals/:id': () => this.getProductApproval(action[1]),
      'logs': () => this.getLogs(req),
      'installer-companies': () => this.getInstallerCompanies(req),
      'installer-companies/:id': () => this.getInstallerCompany(action[1]),
      'installer-companies/:id/zip-codes': () => this.getInstallerCompanyZipCodes(action[1]),
      'vendors/:id/security-status': () => this.getVendorSecurityStatus(action[1]),
      'vendors/:id/audit-history': () => this.getVendorAuditHistory(action[1], req),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');

    const routes = {
      'categories': () => this.createCategory(req),
      'upload/categories': () => this.uploadImage(req, 'categories'),
      'upload/hero-banners': () => this.uploadImage(req, 'hero-banners', 10),
      'upload/rooms': () => this.uploadImage(req, 'rooms'),
      'hero-banners': () => this.createHeroBanner(req),
      'tax-rates': () => this.createTaxRate(req),
      'tax-rates/upload': () => this.uploadTaxRates(req),
      'rooms': () => this.createRoom(req),
      'products': () => this.createProduct(req),
      'vendors': () => this.createVendor(req),
      'users': () => this.createUser(req),
      'settings/test-taxjar': () => this.testTaxJar(req),
      'settings/test-shipping': () => this.testShipping(req),
      'orders/:id/disable': () => this.disableOrder(action[1]),
      'product-approvals/:id/approve': () => this.approveProductRequest(action[1], user),
      'product-approvals/:id/reject': () => this.rejectProductRequest(action[1], req, user),
      'installer-companies': () => this.createInstallerCompany(req),
      'installer-companies/:id/zip-codes': () => this.addInstallerCompanyZipCodes(action[1], req),
      'installer-companies/import': () => this.importInstallerCompanies(req),
      'vendors/:id/disable': () => this.disableVendor(action[1], req),
      'vendors/:id/enable': () => this.enableVendor(action[1], req),
      'vendors/:id/delete-permanently': () => this.deleteVendorPermanently(action[1], req),
      'users/:id/verify': () => this.verifyUser(action[1], req),
    };

    return this.routeAction(action, routes);
  }

  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories/:id': () => this.updateCategory(action[1], req),
      'hero-banners/:id': () => this.updateHeroBanner(action[1], req),
      'tax-rates/:id': () => this.updateTaxRate(action[1], req),
      'settings': () => this.updateSettings(req),
      'rooms/:id': () => this.updateRoom(action[1], req),
      'products/:id': () => this.updateProduct(action[1], req),
      'vendors/:id': () => this.updateVendor(action[1], req),
      'users/:id': () => this.updateUser(action[1], req),
    };

    return this.routeAction(action, routes);
  }

  async handlePATCH(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');

    const routes = {
      'orders/:id': () => this.updateOrderStatus(action[1], req),
      'users/:id': () => this.patchUser(action[1], req),
    };

    return this.routeAction(action, routes);
  }

  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories/:id': () => this.deleteCategory(action[1]),
      'hero-banners/:id': () => this.deleteHeroBanner(action[1]),
      'tax-rates/:id': () => this.deleteTaxRate(action[1]),
      'rooms/:id': () => this.deleteRoom(action[1]),
      'products/:id': () => this.deleteProduct(action[1]),
      'vendors/:id': () => this.deleteVendor(action[1]),
      'users/:id': () => this.deleteUser(action[1]),
    };

    return this.routeAction(action, routes);
  }

  private async getDashboard() {
    // TODO: Implement admin dashboard
    return { message: 'Admin dashboard endpoint' };
  }

  private async getUsers(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const isVerified = searchParams.get('is_verified') || '';
    // Support both 'page' and 'offset' parameters for flexibility
    const offsetParam = searchParams.get('offset');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = offsetParam !== null ? parseInt(offsetParam) : (page - 1) * limit;

    try {
      const pool = await getPool();

      // Build query
      let query = 'SELECT * FROM users WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const params: any[] = [];

      if (search) {
        const searchCondition = ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
        query += searchCondition;
        countQuery += searchCondition;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (role) {
        query += ' AND role = ?';
        countQuery += ' AND role = ?';
        params.push(role);
      }

      // Filter by status (active/inactive)
      if (status === 'active') {
        query += ' AND is_active = 1';
        countQuery += ' AND is_active = 1';
      } else if (status === 'inactive') {
        query += ' AND is_active = 0';
        countQuery += ' AND is_active = 0';
      }

      // Filter by verification status
      if (isVerified === 'false') {
        query += ' AND is_verified = 0';
        countQuery += ' AND is_verified = 0';
      } else if (isVerified === 'true') {
        query += ' AND is_verified = 1';
        countQuery += ' AND is_verified = 1';
      }
      
      // Get total count
      const [countResult] = await pool.execute(countQuery, params);
      const total = (countResult as any[])[0].total;

      // Get paginated results - use safe integer interpolation for LIMIT/OFFSET
      query += ` ORDER BY created_at DESC LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`;
      const [users] = await pool.execute(query, params);
      
      return {
        users: users || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new ApiError('Failed to fetch users', 500);
    }
  }

  private async getUser(userId: string) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    try {
      const pool = await getPool();
      const [rows] = await pool.execute(
        'SELECT user_id, email, first_name, last_name, phone, role, is_active, is_verified, created_at, updated_at, last_login FROM users WHERE user_id = ?',
        [id]
      );

      const users = rows as any[];
      if (!users || users.length === 0) {
        throw new ApiError('User not found', 404);
      }

      return users[0];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching user:', error);
      throw new ApiError('Failed to fetch user', 500);
    }
  }

  private async patchUser(userId: string, req: NextRequest) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    try {
      const body = await req.json();
      const pool = await getPool();

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];

      if (body.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(body.is_active ? 1 : 0);
      }

      if (body.role !== undefined) {
        updates.push('role = ?');
        values.push(body.role);
      }

      if (body.first_name !== undefined) {
        updates.push('first_name = ?');
        values.push(body.first_name);
      }

      if (body.last_name !== undefined) {
        updates.push('last_name = ?');
        values.push(body.last_name);
      }

      if (body.phone !== undefined) {
        updates.push('phone = ?');
        values.push(body.phone);
      }

      if (updates.length === 0) {
        throw new ApiError('No fields to update', 400);
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating user:', error);
      throw new ApiError('Failed to update user', 500);
    }
  }

  private async verifyUser(userId: string, req: NextRequest) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    try {
      const pool = await getPool();

      // Get user details first
      const [rows] = await pool.execute(
        'SELECT user_id, email, first_name, last_name, role, is_verified FROM users WHERE user_id = ?',
        [id]
      );

      const users = rows as any[];
      if (!users || users.length === 0) {
        throw new ApiError('User not found', 404);
      }

      const user = users[0];

      if (user.is_verified) {
        throw new ApiError('User is already verified', 400);
      }

      // Update user verification status
      await pool.execute(
        'UPDATE users SET is_verified = 1, updated_at = NOW() WHERE user_id = ?',
        [id]
      );

      // Send verification email
      const { emailService } = await import('@/lib/email/emailService');
      const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email.split('@')[0];

      try {
        await emailService.sendVerificationEmail(
          user.email,
          userName,
          user.role
        );
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the verification if email fails
      }

      return {
        success: true,
        message: 'User verified successfully',
        data: {
          user_id: id,
          email: user.email,
          is_verified: true
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error verifying user:', error);
      throw new ApiError('Failed to verify user', 500);
    }
  }

  private async getVendors(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;
    
    try {
      const pool = await getPool();
      
      // Build query
      let query = `
        SELECT
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.is_active,
          u.created_at,
          vi.user_id as vendor_info_id,
          vi.business_name,
          vi.business_email,
          vi.business_phone,
          vi.approval_status,
          vi.is_verified,
          vi.commission_rate,
          vi.business_city as city,
          vi.business_state as state,
          COALESCE(COUNT(DISTINCT vp.product_id), 0) as product_count,
          COALESCE(SUM(CASE WHEN vp.is_active = 1 THEN 1 ELSE 0 END), 0) as active_products
        FROM users u
        INNER JOIN vendor_info vi ON u.user_id = vi.user_id
        LEFT JOIN vendor_products vp ON vi.user_id = vp.vendor_id
        WHERE u.role = 'vendor'
      `;
      
      let countQuery = `
        SELECT COUNT(DISTINCT vi.user_id) as total
        FROM users u
        INNER JOIN vendor_info vi ON u.user_id = vi.user_id
        WHERE u.role = 'vendor'
      `;
      
      const params: any[] = [];
      
      if (search) {
        const searchCondition = ` AND (vi.business_name LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        query += searchCondition;
        countQuery += searchCondition;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status === 'active') {
        query += ' AND u.is_active = 1';
        countQuery += ' AND u.is_active = 1';
      } else if (status === 'inactive') {
        query += ' AND u.is_active = 0';
        countQuery += ' AND u.is_active = 0';
      } else if (status === 'verified') {
        query += ' AND vi.is_verified = 1';
        countQuery += ' AND vi.is_verified = 1';
      }
      
      query += ' GROUP BY u.user_id, vi.user_id';
      query += ' ORDER BY vi.created_at DESC';
      query += ` LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`;

      // Get total count
      const [countResult] = await pool.query(countQuery, params);
      const total = (countResult as any[])[0].total;

      // Get paginated results
      const [vendors] = await pool.query(query, params);
      
      return {
        vendors: vendors || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw new ApiError('Failed to fetch vendors', 500);
    }
  }

  private async getOrders(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    try {
      const orders = await orderService.getOrders({
        status,
        search,
        limit,
        offset,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      return {
        orders: orders.orders || [],
        pagination: {
          page,
          limit,
          total: orders.total || 0,
          pages: Math.ceil((orders.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new ApiError('Failed to fetch orders', 500);
    }
  }

  private async getAnalytics(req: NextRequest) {
    // TODO: Implement analytics
    return { message: 'Analytics endpoint' };
  }

  // Categories management
  private async getCategories(req: NextRequest) {
    try {
      const pool = await getPool();
      const searchParams = new URL(req.url).searchParams;
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || 'all';
      
      let query = 'SELECT * FROM categories WHERE 1=1';
      const params: any[] = [];
      
      if (search) {
        query += ' AND (name LIKE ? OR slug LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (status === 'featured') {
        query += ' AND featured = 1';
      } else if (status === 'not-featured') {
        query += ' AND featured = 0';
      }
      
      query += ' ORDER BY display_order ASC, name ASC';
      
      const [categories] = await pool.execute(query, params);
      
      return {
        categories: categories || [],
        total: (categories as any[]).length
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new ApiError('Failed to fetch categories', 500);
    }
  }

  private async getCategory(id: string) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid category ID', 400);
    }
    
    try {
      const pool = await getPool();
      const [result] = await pool.execute(
        'SELECT * FROM categories WHERE category_id = ?',
        [id]
      );
      
      if ((result as any[]).length === 0) {
        throw new ApiError('Category not found', 404);
      }
      
      return {
        category: (result as any[])[0]
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching category:', error);
      throw new ApiError('Failed to fetch category', 500);
    }
  }

  private async createCategory(req: NextRequest) {
    const body = await req.json();
    
    // Validate input
    const validation = CategorySchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError('Invalid input', 400, validation.error.errors);
    }
    
    const { name, slug, description, image_url, featured, display_order } = validation.data;
    
    try {
      const pool = await getPool();
      // Check if slug already exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM categories WHERE slug = ?',
        [slug]
      );
      
      if ((existing as any[]).length > 0) {
        throw new ApiError('Category with this slug already exists', 400);
      }
      
      // Create category
      const [result] = await pool.execute(
        `INSERT INTO categories 
        (name, slug, description, image_url, featured, display_order, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, slug, description || null, image_url || null, featured ? 1 : 0, display_order || 0]
      );
      
      const categoryId = (result as any).insertId;
      
      // Fetch and return created category
      const [newCategory] = await pool.execute(
        'SELECT * FROM categories WHERE category_id = ?',
        [categoryId]
      );

      // Invalidate categories cache
      deleteCachePattern('categories:*');

      return {
        success: true,
        category: (newCategory as any[])[0]
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error creating category:', error);
      throw new ApiError('Failed to create category', 500);
    }
  }

  private async updateCategory(id: string, req: NextRequest) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid category ID', 400);
    }
    
    const body = await req.json();
    
    // Validate input
    const validation = CategorySchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError('Invalid input', 400, validation.error.errors);
    }
    
    const { name, slug, description, image_url, featured, display_order } = validation.data;
    
    try {
      const pool = await getPool();
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [id]
      );
      
      if ((existing as any[]).length === 0) {
        throw new ApiError('Category not found', 404);
      }
      
      // Check if new slug conflicts with another category
      const [slugConflict] = await pool.execute(
        'SELECT category_id FROM categories WHERE slug = ? AND category_id != ?',
        [slug, id]
      );
      
      if ((slugConflict as any[]).length > 0) {
        throw new ApiError('Another category with this slug already exists', 400);
      }
      
      // Update category
      await pool.execute(
        `UPDATE categories 
        SET name = ?, slug = ?, description = ?, image_url = ?, 
            featured = ?, display_order = ?, updated_at = NOW()
        WHERE category_id = ?`,
        [name, slug, description || null, image_url || null, 
         featured ? 1 : 0, display_order || 0, id]
      );
      
      // Fetch and return updated category
      const [updatedCategory] = await pool.execute(
        'SELECT * FROM categories WHERE category_id = ?',
        [id]
      );

      // Invalidate categories cache
      deleteCachePattern('categories:*');

      return {
        success: true,
        category: (updatedCategory as any[])[0]
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating category:', error);
      throw new ApiError('Failed to update category', 500);
    }
  }

  private async deleteCategory(id: string) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid category ID', 400);
    }
    
    try {
      const pool = await getPool();
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [id]
      );
      
      if ((existing as any[]).length === 0) {
        throw new ApiError('Category not found', 404);
      }
      
      // Check if category has products
      const [products] = await pool.execute(
        'SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?',
        [id]
      );
      
      if ((products as any[])[0].count > 0) {
        throw new ApiError('Cannot delete category with assigned products', 400);
      }
      
      // Delete category
      await pool.execute(
        'DELETE FROM categories WHERE category_id = ?',
        [id]
      );

      // Invalidate categories cache
      deleteCachePattern('categories:*');

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting category:', error);
      throw new ApiError('Failed to delete category', 500);
    }
  }

  /**
   * Unified image upload method using FileUploadService
   */
  private async uploadImage(
    req: NextRequest,
    type: 'categories' | 'hero-banners' | 'rooms',
    maxSizeInMB: number = 5
  ) {
    try {
      const formData = await req.formData();
      const file = await FileUploadService.extractFileFromFormData(formData);

      const result = await FileUploadService.uploadFile(file, {
        type,
        maxSizeInMB
      });

      return {
        success: true,
        url: result.url,
        filename: result.filename
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error(`Error uploading ${type} image:`, error);
      throw new ApiError(error instanceof Error ? error.message : 'Failed to upload image', 500);
    }
  }

  // Hero Banners
  private async getHeroBanners(req: NextRequest) {
    try {
      const pool = await getPool();
      const [banners] = await pool.execute(
        'SELECT * FROM hero_banners ORDER BY display_order ASC, created_at DESC'
      );
      
      return {
        banners: banners || [],
        total: (banners as any[]).length
      };
    } catch (error) {
      console.error('Error fetching hero banners:', error);
      throw new ApiError('Failed to fetch hero banners', 500);
    }
  }

  private async getHeroBanner(id: string) {
    try {
      const pool = await getPool();
      const [banners] = await pool.execute(
        'SELECT * FROM hero_banners WHERE banner_id = ?',
        [id]
      );
      
      if ((banners as any[]).length === 0) {
        throw new ApiError('Banner not found', 404);
      }
      
      return (banners as any[])[0];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch banner', 500);
    }
  }

  private async createHeroBanner(req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      const [result] = await pool.execute(
        `INSERT INTO hero_banners 
        (title, subtitle, description, background_image, right_side_image, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, is_active, display_order, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.title || '',
          body.subtitle || '',
          body.description || '',
          body.background_image || '',
          body.right_side_image || '',
          body.primary_cta_text || '',
          body.primary_cta_link || '',
          body.secondary_cta_text || '',
          body.secondary_cta_link || '',
          body.is_active ? 1 : 0,
          body.display_order || 0
        ]
      );

      // Invalidate hero banners cache
      deleteCachePattern('hero-banners:*');

      return {
        success: true,
        bannerId: (result as any).insertId
      };
    } catch (error) {
      console.error('Error creating banner:', error);
      throw new ApiError('Failed to create banner', 500);
    }
  }

  private async updateHeroBanner(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      await pool.execute(
        `UPDATE hero_banners SET 
        title = ?, subtitle = ?, description = ?, background_image = ?, right_side_image = ?,
        primary_cta_text = ?, primary_cta_link = ?, secondary_cta_text = ?, secondary_cta_link = ?,
        is_active = ?, display_order = ?, updated_at = NOW()
        WHERE banner_id = ?`,
        [
          body.title,
          body.subtitle,
          body.description,
          body.background_image,
          body.right_side_image,
          body.primary_cta_text,
          body.primary_cta_link,
          body.secondary_cta_text,
          body.secondary_cta_link,
          body.is_active ? 1 : 0,
          body.display_order,
          id
        ]
      );

      // Invalidate hero banners cache
      deleteCachePattern('hero-banners:*');

      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update banner', 500);
    }
  }

  private async deleteHeroBanner(id: string) {
    try {
      const pool = await getPool();
      await pool.execute('DELETE FROM hero_banners WHERE banner_id = ?', [id]);

      // Invalidate hero banners cache
      deleteCachePattern('hero-banners:*');

      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to delete banner', 500);
    }
  }

  // Tax Rates
  private async getTaxRates(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    try {
      const pool = await getPool();
      
      let whereClause = '';
      const queryParams: any[] = [];
      
      if (search) {
        whereClause = ' WHERE zip_code LIKE ? OR city LIKE ? OR state_code LIKE ?';
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM tax_rates${whereClause}`,
        queryParams
      );
      const total = (countResult as any[])[0].total;

      // Get paginated results - use safe integer interpolation for LIMIT/OFFSET
      const [rates] = await pool.execute(
        `SELECT * FROM tax_rates${whereClause} ORDER BY state_code ASC, city ASC LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`,
        queryParams
      );
      
      return {
        rates: rates || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      throw new ApiError('Failed to fetch tax rates', 500);
    }
  }

  private async getTaxRate(id: string) {
    try {
      const pool = await getPool();
      const [rates] = await pool.execute(
        'SELECT * FROM tax_rates WHERE tax_rate_id = ?',
        [id]
      );
      
      if ((rates as any[]).length === 0) {
        throw new ApiError('Tax rate not found', 404);
      }
      
      return (rates as any[])[0];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch tax rate', 500);
    }
  }

  private async createTaxRate(req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      const [result] = await pool.execute(
        `INSERT INTO tax_rates 
        (zip_code, city, state, tax_rate, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [body.zip_code, body.city, body.state, body.tax_rate]
      );
      
      return {
        success: true,
        taxRateId: (result as any).insertId
      };
    } catch (error) {
      console.error('Error creating tax rate:', error);
      throw new ApiError('Failed to create tax rate', 500);
    }
  }

  private async updateTaxRate(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      await pool.execute(
        `UPDATE tax_rates SET 
        zip_code = ?, city = ?, state = ?, tax_rate = ?, updated_at = NOW()
        WHERE tax_rate_id = ?`,
        [body.zip_code, body.city, body.state, body.tax_rate, id]
      );
      
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update tax rate', 500);
    }
  }

  private async deleteTaxRate(id: string) {
    try {
      const pool = await getPool();
      await pool.execute('DELETE FROM tax_rates WHERE tax_rate_id = ?', [id]);
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to delete tax rate', 500);
    }
  }

  private async getTaxRatesTemplate() {
    // Return CSV template for tax rates upload
    const csvContent = `zip_code,city,state,tax_rate
10001,New York,NY,8.875
90210,Beverly Hills,CA,9.5
60601,Chicago,IL,10.25
33101,Miami,FL,7.0
98101,Seattle,WA,10.25
30301,Atlanta,GA,8.9
85001,Phoenix,AZ,8.6
80201,Denver,CO,8.81
02101,Boston,MA,6.25
78701,Austin,TX,8.25`;

    // Return a NextResponse directly for file download
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tax_rates_template.csv"'
      }
    });
  }

  private async uploadTaxRates(req: NextRequest) {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const preview = formData.get('preview') === 'true';

      if (!file) {
        throw new ApiError('No file uploaded', 400);
      }

      // Read the CSV file
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        throw new ApiError('CSV file is empty or invalid', 400);
      }

      // Parse CSV header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredColumns = ['zip_code', 'city', 'state', 'tax_rate'];
      
      for (const col of requiredColumns) {
        if (!header.includes(col)) {
          throw new ApiError(`Missing required column: ${col}`, 400);
        }
      }

      const zipIndex = header.indexOf('zip_code');
      const cityIndex = header.indexOf('city');
      const stateIndex = header.indexOf('state');
      const rateIndex = header.indexOf('tax_rate');

      const records = [];
      const errors = [];

      // Parse data lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        
        try {
          const zipCode = values[zipIndex];
          const city = values[cityIndex];
          const state = values[stateIndex];
          const taxRate = parseFloat(values[rateIndex]);

          // Validate data
          if (!zipCode || !city || !state || isNaN(taxRate)) {
            errors.push(`Line ${i + 1}: Invalid data`);
            continue;
          }

          if (!/^\d{5}$/.test(zipCode)) {
            errors.push(`Line ${i + 1}: Invalid ZIP code format`);
            continue;
          }

          if (!/^[A-Z]{2}$/i.test(state)) {
            errors.push(`Line ${i + 1}: State must be a 2-letter code (e.g., NY, CA)`);
            continue;
          }

          if (taxRate < 0 || taxRate > 100) {
            errors.push(`Line ${i + 1}: Tax rate must be between 0 and 100`);
            continue;
          }

          records.push({ zip_code: zipCode, city, state: state.toUpperCase(), tax_rate: taxRate });
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error}`);
        }
      }

      if (preview) {
        // Return preview data without saving
        return {
          success: true,
          preview: true,
          processed: lines.length - 1,
          valid: records.length,
          errors: errors,
          records: records.slice(0, 10) // Show first 10 records
        };
      }

      // Import to database
      const pool = await getPool();
      let imported = 0;
      let updated = 0;

      for (const record of records) {
        try {
          // Check if exists
          const [existing] = await pool.execute(
            'SELECT tax_rate_id FROM tax_rates WHERE zip_code = ?',
            [record.zip_code]
          );

          if ((existing as any[]).length > 0) {
            // Update existing
            await pool.execute(
              'UPDATE tax_rates SET city = ?, state_code = ?, total_tax_rate = ?, updated_at = NOW() WHERE zip_code = ?',
              [record.city, record.state, record.tax_rate, record.zip_code]
            );
            updated++;
          } else {
            // Insert new - set required fields with defaults for others
            await pool.execute(
              `INSERT INTO tax_rates (
                zip_code, city, state_code, total_tax_rate,
                state_tax_rate, county_tax_rate, city_tax_rate, special_district_tax_rate,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                record.zip_code, 
                record.city, 
                record.state, 
                record.tax_rate,
                0, // state_tax_rate default
                0, // county_tax_rate default
                0, // city_tax_rate default
                0  // special_district_tax_rate default
              ]
            );
            imported++;
          }
        } catch (error) {
          errors.push(`ZIP ${record.zip_code}: ${error}`);
        }
      }

      return {
        success: true,
        processed: lines.length - 1,
        imported,
        updated,
        errors
      };

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to process CSV file', 500);
    }
  }

  // Settings
  private async getSettings(req: NextRequest) {
    try {
      const settings = await settingsService.getAllSettings();
      return { settings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw new ApiError('Failed to fetch settings', 500);
    }
  }

  private async updateSettings(req: NextRequest) {
    const body = await req.json();

    try {
      // If body contains a specific category, update just that category
      if (body.category && body.settings) {
        await settingsService.updateSettings(body.category, body.settings);
      } else if (body.settings) {
        // Handle the case where all settings are in body.settings
        for (const [category, categorySettings] of Object.entries(body.settings)) {
          if (typeof categorySettings === 'object' && categorySettings !== null) {
            await settingsService.updateSettings(category, categorySettings);
          }
        }
      } else {
        // Otherwise update all settings provided
        for (const [category, categorySettings] of Object.entries(body)) {
          if (typeof categorySettings === 'object' && categorySettings !== null) {
            await settingsService.updateSettings(category, categorySettings);
          }
        }
      }

      // Reload settings after update to ensure consistency
      const updatedSettings = await settingsService.getAllSettings();

      return {
        success: true,
        settings: updatedSettings
      };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new ApiError('Failed to update settings', 500);
    }
  }

  private async testTaxJar(req: NextRequest) {
    try {
      const body = await req.json();
      const { taxjar_api_key, taxjar_environment } = body;

      if (!taxjar_api_key) {
        throw new ApiError('TaxJar API key is required', 400);
      }

      // TaxJar API endpoint based on environment
      const baseUrl = taxjar_environment === 'sandbox' 
        ? 'https://api.sandbox.taxjar.com/v2' 
        : 'https://api.taxjar.com/v2';

      // Test the API key by making a request to categories endpoint (lightweight endpoint)
      const response = await fetch(`${baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${taxjar_api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'TaxJar API key is valid'
        };
      } else if (response.status === 401) {
        throw new ApiError('Invalid TaxJar API key', 401);
      } else {
        const error = await response.text();
        throw new ApiError(`TaxJar API error: ${error}`, response.status);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error testing TaxJar:', error);
      throw new ApiError('Failed to test TaxJar connection', 500);
    }
  }

  private async testShipping(req: NextRequest) {
    try {
      const body = await req.json();
      const { provider, api_key, account_number, environment } = body;

      if (!provider || !api_key || !account_number) {
        throw new ApiError('Provider, API key, and account number are required', 400);
      }

      // Save temporary settings for testing
      await settingsService.updateSettings({
        [`shipping_${provider}_enabled`]: 'true',
        [`shipping_${provider}_api_key`]: api_key,
        [`shipping_${provider}_account_number`]: account_number,
        [`shipping_${provider}_environment`]: environment || 'production'
      });

      // Initialize shipping service with new settings
      await shippingService.initialize();

      // Test the connection
      const result = await shippingService.testProviderConnection(provider);
      
      if (result.success) {
        return {
          success: true,
          message: result.message
        };
      } else {
        throw new ApiError(result.message, 400);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error testing shipping provider:', error);
      throw new ApiError('Failed to test shipping connection', 500);
    }
  }

  // Rooms
  private async getRooms(req: NextRequest) {
    try {
      const pool = await getPool();
      const [rooms] = await pool.execute(
        'SELECT * FROM room_types ORDER BY name ASC'
      );
      
      return {
        rooms: rooms || [],
        total: (rooms as any[]).length
      };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw new ApiError('Failed to fetch rooms', 500);
    }
  }

  private async getRoom(id: string) {
    try {
      const pool = await getPool();
      const [rooms] = await pool.execute(
        'SELECT * FROM room_types WHERE room_type_id = ?',
        [id]
      );
      
      if ((rooms as any[]).length === 0) {
        throw new ApiError('Room not found', 404);
      }
      
      return (rooms as any[])[0];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch room', 500);
    }
  }

  private async createRoom(req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      
      const [result] = await pool.execute(
        `INSERT INTO room_types 
        (name, description, image_url, typical_humidity, light_exposure, privacy_requirements, recommended_products, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.name,
          body.description || '',
          body.image_url || '',
          body.typical_humidity || '',
          body.light_exposure || '',
          body.privacy_requirements || '',
          body.recommended_products || '',
          body.is_active !== false ? 1 : 0
        ]
      );
      
      return {
        success: true,
        roomId: (result as any).insertId
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw new ApiError('Failed to create room', 500);
    }
  }

  private async updateRoom(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      await pool.execute(
        `UPDATE room_types SET 
        name = ?, description = ?, image_url = ?, typical_humidity = ?, 
        light_exposure = ?, privacy_requirements = ?, recommended_products = ?, 
        is_active = ?, updated_at = NOW()
        WHERE room_type_id = ?`,
        [
          body.name,
          body.description,
          body.image_url,
          body.typical_humidity,
          body.light_exposure,
          body.privacy_requirements,
          body.recommended_products,
          body.is_active ? 1 : 0,
          id
        ]
      );
      
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update room', 500);
    }
  }

  private async deleteRoom(id: string) {
    try {
      const pool = await getPool();
      await pool.execute('DELETE FROM room_types WHERE room_type_id = ?', [id]);
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to delete room', 500);
    }
  }

  // Products
  private async getProducts(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    try {
      const offset = (page - 1) * limit;
      const products = await productService.getProducts({
        search,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        vendorId: vendorId ? parseInt(vendorId) : undefined,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder.toUpperCase() as any,
        limit,
        offset
      });
      
      return {
        products: products.products || [],
        pagination: {
          page,
          limit,
          total: products.total || 0,
          pages: Math.ceil((products.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new ApiError('Failed to fetch products', 500);
    }
  }

  private async getProduct(id: string) {
    try {
      // Use shared method with full details - includes inactive products for admin editing
      const product = await productService.getProductWithFullDetails(parseInt(id), undefined, true);
      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      return {
        success: true,
        data: {
          product: product
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch product', 500);
    }
  }

  private async createProduct(req: NextRequest) {
    const data = await req.json();

    try {
      // Handle vendor_id - convert "marketplace" to null
      let vendorId = data.vendor_id;
      if (vendorId === 'marketplace' || vendorId === '') {
        vendorId = undefined;
      } else if (vendorId) {
        vendorId = vendorId.toString();
      }

      const result = await productManager.createProduct(
        data,
        'ADMIN',
        'admin', // Admin user ID (could be extracted from session)
        vendorId
      );

      // Invalidate products cache
      deleteCachePattern('products:*');

      return {
        success: true,
        product_id: result.product_id,
        message: result.message
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new ApiError('Failed to create product', 500);
    }
  }

  private async updateProduct(id: string, req: NextRequest) {
    const productId = parseInt(id);
    const data = await req.json();

    try {
      // Handle vendor_id - convert "marketplace" to null or string for ProductManager
      let vendorId = data.vendor_id;
      if (vendorId === 'marketplace' || vendorId === '') {
        vendorId = undefined;
      } else if (vendorId) {
        vendorId = vendorId.toString();
      }

      const result = await productManager.updateProduct(
        productId,
        data,
        'ADMIN',
        'admin',
        vendorId
      );

      // Invalidate products cache
      deleteCachePattern('products:*');

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Failed to update product:', error);
      throw new ApiError('Failed to update product: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
  }

  private async deleteProduct(id: string) {
    const productId = parseInt(id);

    try {
      const result = await productManager.deleteProduct(
        productId,
        'ADMIN',
        'admin'
      );

      // Invalidate products cache
      deleteCachePattern('products:*');

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      throw new ApiError('Failed to delete product', 500);
    }
  }

  // Vendors
  private async createVendor(req: NextRequest) {
    const body = await req.json();
    
    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      
      try {
        await conn.beginTransaction();
        
        // Create user account
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const [userResult] = await conn.execute(
          `INSERT INTO users 
          (email, password_hash, first_name, last_name, phone, role, is_active, is_verified, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, 'vendor', 1, 1, NOW(), NOW())`,
          [
            body.email,
            hashedPassword,
            body.firstName || '',
            body.lastName || '',
            body.phone || ''
          ]
        );
        
        const userId = (userResult as any).insertId;
        
        // Create vendor info with defaults if specific fields not provided
        const defaultBusinessName = body.businessName ||
          `${body.firstName || ''} ${body.lastName || ''}`.trim() ||
          body.email.split('@')[0];

        await conn.execute(
          `INSERT INTO vendor_info
          (user_id, business_name, business_email, business_phone, description,
          tax_id, address, city, state, zip_code, country, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            defaultBusinessName,
            body.businessEmail || body.email,
            body.businessPhone || body.phone,
            body.description || '',
            body.taxId || '',
            body.address || '',
            body.city || '',
            body.state || '',
            body.zipCode || '',
            body.country || 'United States'
          ]
        );
        
        await conn.commit();
        
        return {
          success: true,
          userId
        };
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw new ApiError('Failed to create vendor', 500);
    }
  }

  private async updateVendor(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      await vendorService.update(parseInt(id), body);
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update vendor', 500);
    }
  }

  private async deleteVendor(id: string) {
    try {
      // Default: soft delete (disable)
      const result = await vendorService.disableVendor(parseInt(id), {
        reason: 'Vendor removed by admin',
        disabledBy: 1, // TODO: Get from authenticated user
        cascadeToSales: false, // Unlink sales, don't disable
        cascadeToProducts: false, // Unlink products, don't disable
        notifySales: true
      });

      return {
        success: true,
        message: 'Vendor disabled successfully',
        affectedSales: result.affectedSales,
        affectedProducts: result.affectedProducts
      };
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw new ApiError('Failed to delete vendor', 500);
    }
  }

  private async disableVendor(id: string, req: NextRequest) {
    const body = await req.json();

    try {
      const result = await vendorService.disableVendor(parseInt(id), {
        reason: body.reason || 'No reason provided',
        disabledBy: body.disabledBy || 1, // TODO: Get from authenticated user
        cascadeToSales: body.cascadeToSales || false,
        cascadeToProducts: body.cascadeToProducts || false,
        notifySales: body.notifySales !== false
      });

      return {
        success: true,
        message: 'Vendor disabled successfully',
        affectedSales: result.affectedSales,
        affectedProducts: result.affectedProducts
      };
    } catch (error) {
      console.error('Error disabling vendor:', error);
      throw new ApiError('Failed to disable vendor', 500);
    }
  }

  private async enableVendor(id: string, req: NextRequest) {
    const body = await req.json();

    try {
      const result = await vendorService.enableVendor(
        parseInt(id),
        body.enabledBy || 1 // TODO: Get from authenticated user
      );

      return {
        success: true,
        message: 'Vendor enabled successfully',
        pendingSalesReview: result.pendingSalesReview
      };
    } catch (error) {
      console.error('Error enabling vendor:', error);
      throw new ApiError('Failed to enable vendor', 500);
    }
  }

  private async deleteVendorPermanently(id: string, req: NextRequest) {
    const body = await req.json();

    try {
      const result = await vendorService.deleteVendorPermanently(
        parseInt(id),
        body.deletedBy || 1, // TODO: Get from authenticated user
        body.reason || 'No reason provided'
      );

      return {
        success: true,
        message: 'Vendor permanently deleted',
        archivedData: result.archivedData,
        affectedSales: result.affectedSales,
        affectedProducts: result.affectedProducts
      };
    } catch (error) {
      console.error('Error permanently deleting vendor:', error);
      throw new ApiError('Failed to permanently delete vendor', 500);
    }
  }

  private async getVendorSecurityStatus(id: string) {
    try {
      const status = await vendorService.getVendorSecurityStatus(parseInt(id));
      return {
        success: true,
        data: status
      };
    } catch (error) {
      console.error('Error getting vendor security status:', error);
      throw new ApiError('Failed to get vendor security status', 500);
    }
  }

  private async getVendorAuditHistory(id: string, req: NextRequest) {
    try {
      const searchParams = new URL(req.url).searchParams;
      const limit = parseInt(searchParams.get('limit') || '50');

      const history = await vendorService.getVendorAuditHistory(parseInt(id), limit);
      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error('Error getting vendor audit history:', error);
      throw new ApiError('Failed to get vendor audit history', 500);
    }
  }

  // Users
  private async createUser(req: NextRequest) {
    const body = await req.json();

    // Route to specialized creation methods based on role
    switch (body.role) {
      case 'vendor':
        return this.createVendor(req);

      case 'sales':
      case 'sales_representative':
        return this.createSalesUser(req);

      case 'installer':
        return this.createInstallerUser(req);

      case 'shipping_agent':
      case 'admin':
      case 'customer':
      default:
        // These roles don't need additional tables
        return this.createBasicUser(req);
    }
  }

  private async createBasicUser(req: NextRequest) {
    const body = await req.json();

    try {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const user = await userService.create({
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        role: body.role || 'customer'
      });

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new ApiError('Failed to create user', 500);
    }
  }

  private async createSalesUser(req: NextRequest) {
    const body = await req.json();

    try {
      const pool = await getPool();
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        // Create user account
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const [userResult] = await conn.execute(
          `INSERT INTO users
          (email, password_hash, first_name, last_name, phone, role, is_active, is_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'sales_representative', 1, 1, NOW(), NOW())`,
          [
            body.email,
            hashedPassword,
            body.firstName || '',
            body.lastName || '',
            body.phone || ''
          ]
        );

        const userId = (userResult as any).insertId;

        // Create sales_staff entry
        await conn.execute(
          `INSERT INTO sales_staff (user_id, is_active, start_date)
          VALUES (?, 1, CURDATE())`,
          [userId]
        );

        await conn.commit();

        return {
          success: true,
          userId
        };
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error creating sales user:', error);
      throw new ApiError('Failed to create sales user', 500);
    }
  }

  private async createInstallerUser(req: NextRequest) {
    const body = await req.json();

    try {
      // Installers are just users with role='installer'
      // No additional table needed
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const user = await userService.create({
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        role: 'installer'
      });

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Error creating installer:', error);
      throw new ApiError('Failed to create installer', 500);
    }
  }

  private async updateUser(id: string, req: NextRequest) {
    const body = await req.json();

    try {
      // Map camelCase to snake_case for database
      const updateData: any = {};

      if (body.email !== undefined) updateData.email = body.email;
      if (body.firstName !== undefined) updateData.first_name = body.firstName;
      if (body.lastName !== undefined) updateData.last_name = body.lastName;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isActive !== undefined) updateData.is_active = body.isActive ? 1 : 0;

      // If password is being updated, hash it
      if (body.password) {
        updateData.password_hash = await bcrypt.hash(body.password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiError('No fields to update', 400);
      }

      await userService.update(parseInt(id), updateData);
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating user:', error);
      throw new ApiError('Failed to update user', 500);
    }
  }

  private async deleteUser(id: string) {
    try {
      await userService.delete(parseInt(id));
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to delete user', 500);
    }
  }

  private async getOrder(orderId: string) {
    try {
      const id = parseInt(orderId);
      if (isNaN(id)) {
        throw new ApiError('Invalid order ID', 400);
      }

      const order = await orderService.getOrderWithDetails(id);
      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch order', 500);
    }
  }

  private async disableOrder(orderId: string) {
    try {
      const id = parseInt(orderId);
      if (isNaN(id)) {
        throw new ApiError('Invalid order ID', 400);
      }

      const pool = await getPool();
      const [result] = await pool.execute(
        'UPDATE orders SET is_disabled = TRUE WHERE order_id = ?',
        [id]
      );

      if ((result as any).affectedRows === 0) {
        throw new ApiError('Order not found', 404);
      }

      return { success: true, message: 'Order disabled successfully' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to disable order', 500);
    }
  }

  private async updateOrderStatus(orderId: string, req: NextRequest) {
    try {
      const id = parseInt(orderId);
      if (isNaN(id)) {
        throw new ApiError('Invalid order ID', 400);
      }

      const body = await req.json();
      const { status } = body;

      if (!status) {
        throw new ApiError('Status is required', 400);
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        throw new ApiError('Invalid status', 400);
      }

      const pool = await getPool();
      const [result] = await pool.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [status, id]
      );

      if ((result as any).affectedRows === 0) {
        throw new ApiError('Order not found', 404);
      }

      // Return the updated order
      return await this.getOrder(orderId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update order status', 500);
    }
  }

  private async getLogs(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level') || '';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const offset = (page - 1) * limit;
    
    try {
      const pool = await getPool();
      
      // First check if the table exists
      try {
        const [tables] = await pool.execute(
          "SHOW TABLES LIKE 'system_logs'"
        );
        
        if ((tables as any[]).length === 0) {
          // Table doesn't exist, return empty response
          return {
            logs: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0
            },
            stats: {
              total_entries: 0,
              errors_today: 0,
              warnings_today: 0,
              most_common_error: 'System logs table not found',
              last_error_time: null
            }
          };
        }
      } catch (tableCheckError) {
        console.error('Error checking for system_logs table:', tableCheckError);
      }
      
      // Build query
      let query = 'SELECT * FROM system_logs WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM system_logs WHERE 1=1';
      const params: any[] = [];
      
      if (level) {
        query += ' AND level = ?';
        countQuery += ' AND level = ?';
        params.push(level);
      }
      
      if (search) {
        const searchCondition = ' AND (message LIKE ? OR context LIKE ? OR user_id LIKE ?)';
        query += searchCondition;
        countQuery += searchCondition;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (startDate) {
        query += ' AND created_at >= ?';
        countQuery += ' AND created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND created_at <= ?';
        countQuery += ' AND created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }
      
      // Get total count
      const [countResult] = await pool.execute(countQuery, params);
      const total = (countResult as any[])[0].total;

      // Get paginated results - use safe integer interpolation for LIMIT/OFFSET
      query += ` ORDER BY created_at DESC LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`;
      const [logs] = await pool.execute(query, params);
      
      return {
        logs: logs || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      
      // Check if the error is because the table doesn't exist
      if (error.code === 'ER_NO_SUCH_TABLE') {
        // Return empty response instead of throwing error
        return {
          logs: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          stats: {
            total_entries: 0,
            errors_today: 0,
            warnings_today: 0,
            most_common_error: 'System logs table not found',
            last_error_time: null
          }
        };
      }
      
      // For other errors, still throw but with more context
      throw new ApiError(
        error.message || 'Failed to fetch logs',
        500
      );
    }
  }

  // Product Approvals
  private async getProductApprovals(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status') || 'PENDING';

    try {
      const pool = await getPool();
      let query = `
        SELECT
          par.*,
          u.email as requester_email,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name,
          v.business_name as vendor_name,
          p.name as product_name,
          p.sku as product_sku
        FROM product_approval_requests par
        LEFT JOIN users u ON par.requested_by = u.user_id
        LEFT JOIN vendor_info v ON par.vendor_id = v.user_id
        LEFT JOIN products p ON par.product_id = p.product_id
        WHERE par.status = ?
      `;
      const params: any[] = [status];

      if (vendorId) {
        query += ' AND par.vendor_id = ?';
        params.push(parseInt(vendorId));
      }

      query += ' ORDER BY par.created_at DESC';

      const [requests] = await pool.execute(query, params) as any[];

      return {
        success: true,
        data: requests
      };
    } catch (error) {
      console.error('Error fetching product approvals:', error);
      throw new ApiError('Failed to fetch product approvals', 500);
    }
  }

  private async getProductApproval(id: string) {
    try {
      const pool = await getPool();
      const [requests] = await pool.execute(
        `SELECT
          par.*,
          u.email as requester_email,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name,
          v.business_name as vendor_name,
          p.name as product_name,
          p.sku as product_sku
        FROM product_approval_requests par
        LEFT JOIN users u ON par.requested_by = u.user_id
        LEFT JOIN vendor_info v ON par.vendor_id = v.user_id
        LEFT JOIN products p ON par.product_id = p.product_id
        WHERE par.id = ?`,
        [parseInt(id)]
      ) as any[];

      if (!requests || requests.length === 0) {
        throw new ApiError('Approval request not found', 404);
      }

      return {
        success: true,
        data: requests[0]
      };
    } catch (error) {
      console.error('Error fetching product approval:', error);
      throw new ApiError('Failed to fetch product approval', 500);
    }
  }

  private async approveProductRequest(id: string, user: any) {
    try {
      const result = await productManager.approveRequest(
        parseInt(id),
        user.userId || user.user_id || 'admin'
      );

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Error approving product request:', error);
      throw new ApiError('Failed to approve product request: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
  }

  private async rejectProductRequest(id: string, req: NextRequest, user: any) {
    try {
      const body = await req.json();
      const reason = body.reason;

      const result = await productManager.rejectRequest(
        parseInt(id),
        user.userId || user.user_id || 'admin',
        reason
      );

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Error rejecting product request:', error);
      throw new ApiError('Failed to reject product request: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
  }

  // =====================================================
  // Installer Companies Management
  // =====================================================

  private async getInstallerCompanies(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    try {
      const pool = await getPool();

      let query = `
        SELECT
          ic.*,
          COUNT(DISTINCT icz.zip_code) as zip_code_count,
          COUNT(DISTINCT icu.user_id) as user_count
        FROM installer_companies ic
        LEFT JOIN installer_company_zip_codes icz ON ic.company_id = icz.company_id AND icz.is_active = 1
        LEFT JOIN installer_company_users icu ON ic.company_id = icu.company_id AND icu.is_active = 1
        WHERE 1=1
      `;
      let countQuery = `SELECT COUNT(*) as total FROM installer_companies WHERE 1=1`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (search) {
        const searchCondition = ` AND (ic.company_name LIKE ? OR ic.email LIKE ? OR ic.city LIKE ?)`;
        query += searchCondition;
        countQuery += ` AND (company_name LIKE ? OR email LIKE ? OR city LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status === 'active') {
        query += ` AND ic.is_active = 1`;
        countQuery += ` AND is_active = 1`;
      } else if (status === 'inactive') {
        query += ` AND ic.is_active = 0`;
        countQuery += ` AND is_active = 0`;
      }

      query += ` GROUP BY ic.company_id ORDER BY ic.company_name ASC LIMIT ${limit} OFFSET ${offset}`;

      const [companies] = await pool.execute(query, params);
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = (countResult as any[])[0]?.total || 0;

      return {
        companies,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching installer companies:', error);
      throw new ApiError('Failed to fetch installer companies', 500);
    }
  }

  private async getInstallerCompany(companyId: string) {
    const id = parseInt(companyId);
    if (isNaN(id)) {
      throw new ApiError('Invalid company ID', 400);
    }

    try {
      const pool = await getPool();

      const [companies] = await pool.execute(
        `SELECT * FROM installer_companies WHERE company_id = ?`,
        [id]
      );

      if (!(companies as any[]).length) {
        throw new ApiError('Installer company not found', 404);
      }

      // Get zip codes
      const [zipCodes] = await pool.execute(
        `SELECT * FROM installer_company_zip_codes WHERE company_id = ? ORDER BY is_primary_area DESC, zip_code ASC`,
        [id]
      );

      // Get linked users
      const [users] = await pool.execute(
        `SELECT icu.*, u.email, u.first_name, u.last_name, u.phone
         FROM installer_company_users icu
         JOIN users u ON icu.user_id = u.user_id
         WHERE icu.company_id = ?`,
        [id]
      );

      return {
        ...(companies as any[])[0],
        zip_codes: zipCodes,
        users
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching installer company:', error);
      throw new ApiError('Failed to fetch installer company', 500);
    }
  }

  private async getInstallerCompanyZipCodes(companyId: string) {
    const id = parseInt(companyId);
    if (isNaN(id)) {
      throw new ApiError('Invalid company ID', 400);
    }

    try {
      const pool = await getPool();
      const [zipCodes] = await pool.execute(
        `SELECT * FROM installer_company_zip_codes WHERE company_id = ? ORDER BY is_primary_area DESC, zip_code ASC`,
        [id]
      );
      return zipCodes;
    } catch (error) {
      console.error('Error fetching zip codes:', error);
      throw new ApiError('Failed to fetch zip codes', 500);
    }
  }

  private async createInstallerCompany(req: NextRequest) {
    const body = await req.json();

    const requiredFields = ['company_name', 'email', 'phone', 'address_line1', 'city', 'state_province', 'postal_code'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new ApiError(`${field} is required`, 400);
      }
    }

    try {
      const pool = await getPool();

      const [result] = await pool.execute(
        `INSERT INTO installer_companies (
          company_name, contact_name, email, phone, website,
          address_line1, address_line2, city, state_province, postal_code, country,
          license_number, insurance_info, years_in_business, description,
          base_service_fee, hourly_rate, travel_fee_per_mile,
          services_offered, product_specialties,
          lead_time_days, max_advance_days, service_days, service_start_time, service_end_time,
          is_active, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.company_name,
          body.contact_name || null,
          body.email,
          body.phone,
          body.website || null,
          body.address_line1,
          body.address_line2 || null,
          body.city,
          body.state_province,
          body.postal_code,
          body.country || 'USA',
          body.license_number || null,
          body.insurance_info || null,
          body.years_in_business || null,
          body.description || null,
          body.base_service_fee || 0,
          body.hourly_rate || 75,
          body.travel_fee_per_mile || 0,
          JSON.stringify(body.services_offered || ['installation', 'measurement']),
          JSON.stringify(body.product_specialties || ['blinds', 'shades']),
          body.lead_time_days || 7,
          body.max_advance_days || 60,
          JSON.stringify(body.service_days || [1, 2, 3, 4, 5]),
          body.service_start_time || '08:00:00',
          body.service_end_time || '18:00:00',
          body.is_active !== false ? 1 : 0,
          body.is_verified ? 1 : 0
        ]
      );

      const companyId = (result as any).insertId;

      // Add zip codes if provided
      if (body.zip_codes && Array.isArray(body.zip_codes)) {
        for (const zip of body.zip_codes) {
          const zipCode = typeof zip === 'string' ? zip : zip.zip_code;
          const isPrimary = typeof zip === 'object' ? (zip.is_primary_area ? 1 : 0) : 1;
          await pool.execute(
            `INSERT INTO installer_company_zip_codes (company_id, zip_code, is_primary_area) VALUES (?, ?, ?)`,
            [companyId, zipCode, isPrimary]
          );
        }
      }

      return {
        success: true,
        company_id: companyId,
        message: 'Installer company created successfully'
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ApiError('An installer company with this email already exists', 400);
      }
      console.error('Error creating installer company:', error);
      throw new ApiError('Failed to create installer company', 500);
    }
  }

  private async addInstallerCompanyZipCodes(companyId: string, req: NextRequest) {
    const id = parseInt(companyId);
    if (isNaN(id)) {
      throw new ApiError('Invalid company ID', 400);
    }

    const body = await req.json();
    const zipCodes = body.zip_codes;

    if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
      throw new ApiError('zip_codes array is required', 400);
    }

    try {
      const pool = await getPool();

      // Verify company exists
      const [companies] = await pool.execute(
        `SELECT company_id FROM installer_companies WHERE company_id = ?`,
        [id]
      );
      if (!(companies as any[]).length) {
        throw new ApiError('Installer company not found', 404);
      }

      let added = 0;
      let skipped = 0;

      for (const zip of zipCodes) {
        const zipCode = typeof zip === 'string' ? zip.trim() : zip.zip_code?.trim();
        if (!zipCode) continue;

        const isPrimary = typeof zip === 'object' ? (zip.is_primary_area ? 1 : 0) : 0;
        const additionalFee = typeof zip === 'object' ? (zip.additional_travel_fee || 0) : 0;

        try {
          await pool.execute(
            `INSERT INTO installer_company_zip_codes (company_id, zip_code, is_primary_area, additional_travel_fee)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_primary_area = VALUES(is_primary_area), additional_travel_fee = VALUES(additional_travel_fee)`,
            [id, zipCode, isPrimary, additionalFee]
          );
          added++;
        } catch (e) {
          skipped++;
        }
      }

      return {
        success: true,
        added,
        skipped,
        message: `Added ${added} zip codes${skipped > 0 ? `, skipped ${skipped}` : ''}`
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error adding zip codes:', error);
      throw new ApiError('Failed to add zip codes', 500);
    }
  }

  private async importInstallerCompanies(req: NextRequest) {
    const body = await req.json();
    const companies = body.companies;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      throw new ApiError('companies array is required', 400);
    }

    try {
      const pool = await getPool();
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const company of companies) {
        try {
          // Check required fields
          if (!company.company_name || !company.email || !company.phone) {
            errors.push(`Skipped: ${company.company_name || 'Unknown'} - missing required fields`);
            failed++;
            continue;
          }

          const [result] = await pool.execute(
            `INSERT INTO installer_companies (
              company_name, contact_name, email, phone,
              address_line1, address_line2, city, state_province, postal_code, country,
              is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
              company_name = VALUES(company_name),
              contact_name = VALUES(contact_name),
              phone = VALUES(phone),
              address_line1 = VALUES(address_line1),
              city = VALUES(city),
              state_province = VALUES(state_province),
              postal_code = VALUES(postal_code)`,
            [
              company.company_name,
              company.contact_name || null,
              company.email,
              company.phone,
              company.address_line1 || company.address || '',
              company.address_line2 || null,
              company.city || '',
              company.state_province || company.state || '',
              company.postal_code || company.zip || '',
              company.country || 'USA'
            ]
          );

          const companyId = (result as any).insertId || (result as any).affectedRows;

          // If company was inserted (not updated), add zip codes
          if ((result as any).insertId && company.zip_codes) {
            const zipList = Array.isArray(company.zip_codes)
              ? company.zip_codes
              : company.zip_codes.split(',').map((z: string) => z.trim());

            for (const zip of zipList) {
              if (zip) {
                await pool.execute(
                  `INSERT IGNORE INTO installer_company_zip_codes (company_id, zip_code, is_primary_area) VALUES (?, ?, 1)`,
                  [(result as any).insertId, zip]
                );
              }
            }
          }

          imported++;
        } catch (e: any) {
          errors.push(`Failed: ${company.company_name || 'Unknown'} - ${e.message}`);
          failed++;
        }
      }

      return {
        success: true,
        imported,
        failed,
        errors: errors.slice(0, 10), // Return first 10 errors
        message: `Imported ${imported} companies${failed > 0 ? `, ${failed} failed` : ''}`
      };
    } catch (error) {
      console.error('Error importing installer companies:', error);
      throw new ApiError('Failed to import installer companies', 500);
    }
  }
}