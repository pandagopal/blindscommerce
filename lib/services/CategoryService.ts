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
  image_url?: string;
  display_order: number;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

interface GetCategoriesOptions {
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
        image_url,
        display_order,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE 1=1
    `;

    const params: any[] = [];

    // Note: parent_id and is_active columns don't exist in the current schema
    // Commenting out for now
    // if (parentId !== undefined) {
    //   query += ' AND parent_id = ?';
    //   params.push(parentId);
    // }

    if (isFeatured !== undefined) {
      query += ' AND featured = ?';
      params.push(isFeatured ? 1 : 0);
    }

    // Add sorting
    const allowedSortColumns = ['name', 'display_order', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'display_order';
    const sortDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Add pagination - use safe integer interpolation for LIMIT/OFFSET
    if (limit) {
      query += ` LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`;
    }

    const rows = await this.executeQuery<Category>(query, params);
    return rows;
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
        image_url,
        display_order,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE category_id = ?
    `;

    const rows = await this.executeQuery<Category>(query, [categoryId]);
    return rows.length > 0 ? rows[0] : null;
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
        image_url,
        display_order,
        featured,
        created_at,
        updated_at
      FROM categories
      WHERE slug = ?
    `;

    const rows = await this.executeQuery<Category>(query, [slug]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get subcategories of a parent category
   * Note: parent_id column doesn't exist in current schema
   */
  async getSubcategories(parentId: number): Promise<Category[]> {
    // Return empty array since parent_id doesn't exist
    return [];
  }

  /**
   * Get category hierarchy (breadcrumb)
   * Note: parent_id column doesn't exist in current schema
   */
  async getCategoryHierarchy(categoryId: number): Promise<Category[]> {
    // Return just the single category since there's no hierarchy
    const category = await this.getCategoryById(categoryId);
    return category ? [category] : [];
  }

  /**
   * Get product count for a category
   */
  async getProductCount(categoryId: number): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT p.product_id) as count
      FROM products p
      WHERE p.category_id = ? AND p.is_active = 1
    `;

    const rows = await this.executeQuery<RowDataPacket>(query, [categoryId]);
    return rows[0]?.count || 0;
  }

  /**
   * Get featured categories
   */
  async getFeaturedCategories(limit: number = 8): Promise<Category[]> {
    return this.getCategories({
      isFeatured: true,
      limit,
      sortBy: 'display_order',
      sortOrder: 'ASC',
    });
  }
}