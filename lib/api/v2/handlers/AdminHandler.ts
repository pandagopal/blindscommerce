/**
 * Admin Handler for V2 API
 * Handles administrative functions
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { userService, vendorService, orderService, productService, settingsService } from '@/lib/services/singletons';
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
      'tax-rates/upload': () => this.uploadTaxRates(req),
      'rooms': () => this.createRoom(req),
      'products': () => this.createProduct(req),
      'vendors': () => this.createVendor(req),
      'users': () => this.createUser(req),
      'settings/test-taxjar': () => this.testTaxJar(req),
      'orders/:id/disable': () => this.disableOrder(action[1]),
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
        LEFT JOIN vendor_products vp ON vi.vendor_info_id = vp.vendor_id
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
      
      // Get paginated results
      const [rates] = await pool.execute(
        `SELECT * FROM tax_rates${whereClause} ORDER BY state_code ASC, city ASC LIMIT ${limit} OFFSET ${offset}`,
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
    
    console.log('AdminHandler.updateSettings - Request body:', JSON.stringify(body, null, 2));
    
    try {
      // If body contains a specific category, update just that category
      if (body.category && body.settings) {
        console.log(`Updating specific category: ${body.category}`);
        console.log('Settings to update:', JSON.stringify(body.settings, null, 2));
        await settingsService.updateSettings(body.category, body.settings);
      } else if (body.settings) {
        // Handle the case where all settings are in body.settings
        console.log('Updating all settings from body.settings');
        for (const [category, categorySettings] of Object.entries(body.settings)) {
          if (typeof categorySettings === 'object' && categorySettings !== null) {
            console.log(`Updating category ${category}:`, JSON.stringify(categorySettings, null, 2));
            await settingsService.updateSettings(category, categorySettings);
          }
        }
      } else {
        // Otherwise update all settings provided
        console.log('Updating all settings from body directly');
        for (const [category, categorySettings] of Object.entries(body)) {
          if (typeof categorySettings === 'object' && categorySettings !== null) {
            console.log(`Updating category ${category}:`, JSON.stringify(categorySettings, null, 2));
            await settingsService.updateSettings(category, categorySettings);
          }
        }
      }
      
      // Reload settings after update to ensure consistency
      const updatedSettings = await settingsService.getAllSettings();
      console.log('Updated settings loaded - payments:', JSON.stringify(updatedSettings.payments, null, 2));
      
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
      // Handle vendor_id - convert "marketplace" to null
      if (body.vendor_id === 'marketplace' || body.vendor_id === '') {
        body.vendor_id = null;
      } else if (body.vendor_id) {
        body.vendor_id = parseInt(body.vendor_id);
      }
      
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
      // Handle vendor_id - convert "marketplace" to null
      if (body.vendor_id === 'marketplace' || body.vendor_id === '') {
        body.vendor_id = null;
      } else if (body.vendor_id) {
        body.vendor_id = parseInt(body.vendor_id);
      }
      
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
}