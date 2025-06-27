/**
 * Category Service
 * Handles all category-related business logic
 */

import { BaseService } from './BaseService';
import { RowDataPacket } from 'mysql2';

interface Category {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

interface GetCategoriesOptions {
  parentId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'display_order' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class CategoryService extends BaseService {
  /**
   * Get categories with optional filtering
   */
  async getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
    const {
      parentId,
      isActive = true,
      isFeatured,
      limit,
      offset = 0,
      sortBy = 'display_order',
      sortOrder = 'ASC',
    } = options;

    let query = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        parent_id,
        image_url,
        display_order,
        is_active,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE 1=1
    `;

    const params: any[] = [];

    if (parentId !== undefined) {
      query += ' AND parent_id = ?';
      params.push(parentId);
    }

    if (isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive);
    }

    if (isFeatured !== undefined) {
      query += ' AND featured = ?';
      params.push(isFeatured);
    }

    // Add sorting
    const allowedSortColumns = ['name', 'display_order', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'display_order';
    const sortDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Add pagination
    if (limit) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as Category[];
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(categoryId: number): Promise<Category | null> {
    const query = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        parent_id,
        image_url,
        display_order,
        is_active,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE category_id = ?
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [categoryId]);
    return rows.length > 0 ? (rows[0] as Category) : null;
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const query = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        parent_id,
        image_url,
        display_order,
        is_active,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE slug = ? AND is_active = true
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [slug]);
    return rows.length > 0 ? (rows[0] as Category) : null;
  }

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(parentId: number): Promise<Category[]> {
    return this.getCategories({
      parentId,
      isActive: true,
      sortBy: 'display_order',
      sortOrder: 'ASC',
    });
  }

  /**
   * Get category hierarchy (breadcrumb)
   */
  async getCategoryHierarchy(categoryId: number): Promise<Category[]> {
    const query = `
      WITH RECURSIVE category_hierarchy AS (
        SELECT * FROM categories WHERE category_id = ?
        UNION ALL
        SELECT c.* FROM categories c
        INNER JOIN category_hierarchy ch ON c.category_id = ch.parent_id
      )
      SELECT * FROM category_hierarchy
      ORDER BY parent_id ASC
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [categoryId]);
    return rows as Category[];
  }

  /**
   * Get product count for a category
   */
  async getProductCount(categoryId: number): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT p.product_id) as count
      FROM products p
      JOIN product_categories pc ON p.product_id = pc.product_id
      WHERE pc.category_id = ? AND p.is_active = true
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [categoryId]);
    return rows[0].count || 0;
  }

  /**
   * Get featured categories
   */
  async getFeaturedCategories(limit: number = 8): Promise<Category[]> {
    return this.getCategories({
      isActive: true,
      isFeatured: true,
      limit,
      sortBy: 'display_order',
      sortOrder: 'ASC',
    });
  }
}