/**
 * Admin Handler for V2 API
 * Handles administrative functions
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { userService, vendorService, orderService, productService, settingsService } from '@/lib/services/singletons';
import { clearSettingsCache } from '@/lib/settings';
import bcrypt from 'bcryptjs';

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
      'vendors': () => this.getVendors(req),
      'orders': () => this.getOrders(req),
      'analytics': () => this.getAnalytics(req),
      'categories': () => this.getCategories(req),
      'categories/:id': () => this.getCategory(action[1]),
      'hero-banners': () => this.getHeroBanners(req),
      'hero-banners/:id': () => this.getHeroBanner(action[1]),
      'tax-rates': () => this.getTaxRates(req),
      'tax-rates/:id': () => this.getTaxRate(action[1]),
      'settings': () => this.getSettings(req),
      'rooms': () => this.getRooms(req),
      'rooms/:id': () => this.getRoom(action[1]),
      'products': () => this.getProducts(req),
      'products/:id': () => this.getProduct(action[1]),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories': () => this.createCategory(req),
      'upload/categories': () => this.uploadCategoryImage(req),
      'hero-banners': () => this.createHeroBanner(req),
      'tax-rates': () => this.createTaxRate(req),
      'rooms': () => this.createRoom(req),
      'products': () => this.createProduct(req),
      'vendors': () => this.createVendor(req),
      'users': () => this.createUser(req),
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const offset = (page - 1) * limit;
    
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
      
      // Get total count
      const [countResult] = await pool.execute(countQuery, params);
      const total = (countResult as any[])[0].total;
      
      // Get paginated results
      query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
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
          vi.vendor_info_id,
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
        SELECT COUNT(*) as total
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
      
      query += ' GROUP BY u.user_id, vi.vendor_info_id';
      query += ' ORDER BY vi.created_at DESC';
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      
      // Get total count
      const [countResult] = await pool.execute(countQuery, params);
      const total = (countResult as any[])[0].total;
      
      // Get paginated results
      const [vendors] = await pool.execute(query, params);
      
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

  private async uploadCategoryImage(req: NextRequest) {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new ApiError('No file provided', 400);
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new ApiError('Invalid file type. Only JPEG, PNG, and WebP images are allowed', 400);
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new ApiError('File size too large. Maximum size is 5MB', 400);
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `category_${timestamp}_${randomString}.${extension}`;
      
      // For now, return a mock URL
      // In production, this would upload to S3 or similar service
      const url = `/uploads/categories/${filename}`;
      
      return {
        success: true,
        url: url,
        filename: filename
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error uploading category image:', error);
      throw new ApiError('Failed to upload image', 500);
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
      
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update banner', 500);
    }
  }

  private async deleteHeroBanner(id: string) {
    try {
      const pool = await getPool();
      await pool.execute('DELETE FROM hero_banners WHERE banner_id = ?', [id]);
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
    const offset = (page - 1) * limit;
    
    try {
      const pool = await getPool();
      
      // Get total count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM tax_rates'
      );
      const total = (countResult as any[])[0].total;
      
      // Get paginated results
      const [rates] = await pool.execute(
        `SELECT * FROM tax_rates ORDER BY state_code ASC, city ASC LIMIT ${limit} OFFSET ${offset}`
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
      } else {
        // Otherwise update all settings provided
        for (const [category, categorySettings] of Object.entries(body)) {
          if (typeof categorySettings === 'object' && categorySettings !== null) {
            await settingsService.updateSettings(category, categorySettings);
          }
        }
      }
      
      // Clear the settings cache
      clearSettingsCache();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new ApiError('Failed to update settings', 500);
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
    
    try {
      const offset = (page - 1) * limit;
      const products = await productService.getProducts({
        search,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
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
      const product = await productService.getProductWithDetails(parseInt(id));
      if (!product) {
        throw new ApiError('Product not found', 404);
      }
      return product;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch product', 500);
    }
  }

  private async createProduct(req: NextRequest) {
    const body = await req.json();
    
    try {
      const product = await productService.create(body);
      return {
        success: true,
        product
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new ApiError('Failed to create product', 500);
    }
  }

  private async updateProduct(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      await productService.update(parseInt(id), body);
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to update product', 500);
    }
  }

  private async deleteProduct(id: string) {
    try {
      await productService.delete(parseInt(id));
      return { success: true };
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
        
        // Create vendor info
        await conn.execute(
          `INSERT INTO vendor_info 
          (user_id, business_name, business_email, business_phone, description, 
          tax_id, address, city, state, zip_code, country, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            body.businessName,
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
      const pool = await getPool();
      // Soft delete by deactivating
      await pool.execute(
        'UPDATE users SET is_active = 0 WHERE user_id = ? AND role = "vendor"',
        [id]
      );
      return { success: true };
    } catch (error) {
      throw new ApiError('Failed to delete vendor', 500);
    }
  }

  // Users
  private async createUser(req: NextRequest) {
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

  private async updateUser(id: string, req: NextRequest) {
    const body = await req.json();
    
    try {
      // If password is being updated, hash it
      if (body.password) {
        body.password = await bcrypt.hash(body.password, 10);
      }
      
      await userService.update(parseInt(id), body);
      return { success: true };
    } catch (error) {
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
}