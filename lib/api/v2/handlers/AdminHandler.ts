/**
 * Admin Handler for V2 API
 * Handles administrative functions
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';

const pool = getPool();

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
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories': () => this.createCategory(req),
      'upload/categories': () => this.uploadCategoryImage(req),
    };

    return this.routeAction(action, routes);
  }

  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories/:id': () => this.updateCategory(action[1], req),
    };

    return this.routeAction(action, routes);
  }

  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    this.requireRole(user, 'ADMIN');
    
    const routes = {
      'categories/:id': () => this.deleteCategory(action[1]),
    };

    return this.routeAction(action, routes);
  }

  private async getDashboard() {
    // TODO: Implement admin dashboard
    return { message: 'Admin dashboard endpoint' };
  }

  private async getUsers(req: NextRequest) {
    // TODO: Implement user management
    return { message: 'User management endpoint' };
  }

  private async getVendors(req: NextRequest) {
    // TODO: Implement vendor management
    return { message: 'Vendor management endpoint' };
  }

  private async getOrders(req: NextRequest) {
    // TODO: Implement order management
    return { message: 'Order management endpoint' };
  }

  private async getAnalytics(req: NextRequest) {
    // TODO: Implement analytics
    return { message: 'Analytics endpoint' };
  }

  // Categories management
  private async getCategories(req: NextRequest) {
    try {
      const searchParams = new URL(req.url).searchParams;
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || 'all';
      
      let query = 'SELECT * FROM product_categories WHERE 1=1';
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
      const [result] = await pool.execute(
        'SELECT * FROM product_categories WHERE category_id = ?',
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
      // Check if slug already exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM product_categories WHERE slug = ?',
        [slug]
      );
      
      if ((existing as any[]).length > 0) {
        throw new ApiError('Category with this slug already exists', 400);
      }
      
      // Create category
      const [result] = await pool.execute(
        `INSERT INTO product_categories 
        (name, slug, description, image_url, featured, display_order, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, slug, description || null, image_url || null, featured ? 1 : 0, display_order || 0]
      );
      
      const categoryId = (result as any).insertId;
      
      // Fetch and return created category
      const [newCategory] = await pool.execute(
        'SELECT * FROM product_categories WHERE category_id = ?',
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
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM product_categories WHERE category_id = ?',
        [id]
      );
      
      if ((existing as any[]).length === 0) {
        throw new ApiError('Category not found', 404);
      }
      
      // Check if new slug conflicts with another category
      const [slugConflict] = await pool.execute(
        'SELECT category_id FROM product_categories WHERE slug = ? AND category_id != ?',
        [slug, id]
      );
      
      if ((slugConflict as any[]).length > 0) {
        throw new ApiError('Another category with this slug already exists', 400);
      }
      
      // Update category
      await pool.execute(
        `UPDATE product_categories 
        SET name = ?, slug = ?, description = ?, image_url = ?, 
            featured = ?, display_order = ?, updated_at = NOW()
        WHERE category_id = ?`,
        [name, slug, description || null, image_url || null, 
         featured ? 1 : 0, display_order || 0, id]
      );
      
      // Fetch and return updated category
      const [updatedCategory] = await pool.execute(
        'SELECT * FROM product_categories WHERE category_id = ?',
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
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT category_id FROM product_categories WHERE category_id = ?',
        [id]
      );
      
      if ((existing as any[]).length === 0) {
        throw new ApiError('Category not found', 404);
      }
      
      // Check if category has products
      const [products] = await pool.execute(
        'SELECT COUNT(*) as count FROM product_category_assignments WHERE category_id = ?',
        [id]
      );
      
      if ((products as any[])[0].count > 0) {
        throw new ApiError('Cannot delete category with assigned products', 400);
      }
      
      // Delete category
      await pool.execute(
        'DELETE FROM product_categories WHERE category_id = ?',
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
}