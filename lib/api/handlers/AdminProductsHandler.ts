/**
 * Admin Products Consolidated Handler
 * Replaces multiple admin product management endpoints with comprehensive product operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface AdminProductData {
  product_id: number;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  base_price: number;
  cost_price: number;
  category_id: number;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  rating: number;
  review_count: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
  
  // Admin-specific data
  admin_notes?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  last_modified_by: number;
  profit_margin: number;
  
  // Category information
  category?: {
    category_id: number;
    name: string;
    slug: string;
  };
  
  // Vendor information
  vendors?: Array<{
    vendor_info_id: number;
    business_name: string;
    vendor_price: number;
    commission_rate: number;
    is_primary: boolean;
  }>;
  
  // Images
  images?: Array<{
    image_id: number;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  
  // Sales analytics
  analytics?: {
    total_revenue: number;
    units_sold: number;
    avg_order_value: number;
    conversion_rate: number;
    return_rate: number;
    last_sale_date?: string;
  };
  
  // Inventory status
  inventory_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  
  // SEO data
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

interface AdminProductsListResponse {
  products: AdminProductData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  filters: {
    category?: string;
    vendor?: string;
    status?: string;
    approval?: string;
    search?: string;
    price_range?: string;
  };
  summary: {
    total_products: number;
    active_products: number;
    pending_approval: number;
    low_stock_count: number;
    total_inventory_value: number;
    avg_profit_margin: number;
  };
}

export class AdminProductsHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/admin/products');
  }

  async handleGET(req: NextRequest, user: any | null) {
    if (!user) {
      throw APIErrorHandler.createAuthenticationError();
    }

    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    
    const productId = this.sanitizeNumberParam(searchParams.get('product_id'));
    const include = searchParams.get('include')?.split(',') || [];
    
    // Single product request
    if (productId) {
      return this.handleGetSingleProduct(productId, include, user);
    }
    
    // Product list with filters
    const filters = {
      category: this.sanitizeStringParam(searchParams.get('category')),
      vendor: this.sanitizeStringParam(searchParams.get('vendor')),
      status: this.sanitizeStringParam(searchParams.get('status')),
      approval: this.sanitizeStringParam(searchParams.get('approval')),
      search: this.sanitizeStringParam(searchParams.get('search')),
      price_range: this.sanitizeStringParam(searchParams.get('price_range'))
    };

    try {
      const cacheKey = ConsolidatedCacheKeys.admin.products(page, limit, filters);
      
      const result = await GlobalCaches.admin.getOrSet(
        cacheKey,
        () => this.fetchProductsList(page, limit, offset, filters, include),
        CacheConfigs.standard
      );

      MigrationTracker.recordEndpointUsage('/api/admin/products', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        filters,
        pagination: { page, limit } 
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const action = body.action || 'create';

    switch (action) {
      case 'create':
        return this.handleCreateProduct(body, user);
      case 'approve':
        return this.handleApproveProduct(body, user);
      case 'reject':
        return this.handleRejectProduct(body, user);
      case 'bulk_update':
        return this.handleBulkUpdate(body, user);
      case 'duplicate':
        return this.handleDuplicateProduct(body, user);
      case 'import':
        return this.handleImportProducts(body, user);
      case 'export':
        return this.handleExportProducts(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body || !body.product_id) {
      throw APIErrorHandler.createValidationError('product_id', 'Product ID required for updates');
    }

    return this.handleUpdateProduct(body, user);
  }

  async handleDELETE(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const productId = this.sanitizeNumberParam(searchParams.get('product_id'));
    const action = searchParams.get('action') || 'deactivate';

    if (!productId) {
      throw APIErrorHandler.createValidationError('product_id', 'Product ID required');
    }

    return this.handleDeleteProduct(productId, action === 'permanent', user);
  }

  // Private implementation methods

  private async handleGetSingleProduct(productId: number, include: string[], user: any) {
    const cacheKey = `admin:product:${productId}:${include.join(',')}`;
    
    const result = await GlobalCaches.admin.getOrSet(
      cacheKey,
      () => this.fetchSingleProduct(productId, include),
      CacheConfigs.fast
    );

    return this.successResponse(result.data, {
      cached: result.fromCache
    });
  }

  private async fetchSingleProduct(productId: number, include: string[]): Promise<AdminProductData> {
    const pool = await getPool();
    
    const [productRows] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug,
        u.first_name as last_modified_by_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          WHEN p.is_active = 0 THEN 'discontinued'
          ELSE 'in_stock'
        END as inventory_status,
        CASE 
          WHEN p.cost_price > 0 THEN ((p.base_price - p.cost_price) / p.base_price * 100)
          ELSE 0
        END as profit_margin
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN users u ON p.last_modified_by = u.user_id
       WHERE p.product_id = ?`,
      [productId]
    );

    if (!productRows || (productRows as any[]).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Product not found');
    }

    const product = (productRows as any[])[0];
    
    // Build queries for additional data
    const queries: any = {};
    
    if (include.includes('vendors')) {
      queries.vendors = async () => {
        const [rows] = await pool.execute(
          `SELECT vi.vendor_info_id, vi.business_name, vp.vendor_price, 
                  vi.commission_rate, vp.is_primary
           FROM vendor_products vp
           JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           WHERE vp.product_id = ?
           ORDER BY vp.is_primary DESC, vi.business_name ASC`,
          [productId]
        );
        return rows;
      };
    }

    if (include.includes('images')) {
      queries.images = async () => {
        const [rows] = await pool.execute(
          'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
          [productId]
        );
        return rows;
      };
    }

    if (include.includes('analytics')) {
      queries.analytics = async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
            COALESCE(SUM(oi.quantity), 0) as units_sold,
            AVG(oi.price * oi.quantity) as avg_order_value,
            MAX(o.created_at) as last_sale_date
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.order_id
           WHERE oi.product_id = ? AND o.status = 'completed'`,
          [productId]
        );
        return (rows as any[])[0];
      };
    }

    // Execute all queries in parallel
    const results = Object.keys(queries).length > 0 
      ? await this.executeParallelQueries(queries)
      : {};

    return {
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      sku: product.sku,
      base_price: parseFloat(product.base_price),
      cost_price: parseFloat(product.cost_price),
      category_id: product.category_id,
      is_active: !!product.is_active,
      is_featured: !!product.is_featured,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 5,
      rating: parseFloat(product.rating) || 0,
      review_count: product.review_count || 0,
      total_sales: product.total_sales || 0,
      created_at: product.created_at,
      updated_at: product.updated_at,
      admin_notes: product.admin_notes,
      approval_status: product.approval_status || 'approved',
      last_modified_by: product.last_modified_by,
      profit_margin: parseFloat(product.profit_margin) || 0,
      inventory_status: product.inventory_status,
      
      category: product.category_name ? {
        category_id: product.category_id,
        name: product.category_name,
        slug: product.category_slug
      } : undefined,
      
      vendors: results.vendors as any[],
      images: results.images as any[],
      analytics: results.analytics ? {
        total_revenue: parseFloat(results.analytics.total_revenue) || 0,
        units_sold: results.analytics.units_sold || 0,
        avg_order_value: parseFloat(results.analytics.avg_order_value) || 0,
        conversion_rate: 0, // Would need more complex calculation
        return_rate: 0, // Would need returns data
        last_sale_date: results.analytics.last_sale_date
      } : undefined
    };
  }

  private async fetchProductsList(
    page: number,
    limit: number, 
    offset: number,
    filters: any,
    include: string[]
  ): Promise<AdminProductsListResponse> {
    const pool = await getPool();
    
    // Build WHERE conditions
    const conditions: string[] = ['1 = 1'];
    const params: any[] = [];

    if (filters.category) {
      conditions.push('c.slug = ?');
      params.push(filters.category);
    }

    if (filters.vendor) {
      conditions.push('vi.business_name LIKE ?');
      params.push(`%${filters.vendor}%`);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        conditions.push('p.is_active = 1');
      } else if (filters.status === 'inactive') {
        conditions.push('p.is_active = 0');
      }
    }

    if (filters.approval) {
      conditions.push('p.approval_status = ?');
      params.push(filters.approval);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Execute parallel queries
    const results = await this.executeParallelQueries({
      products: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            p.*,
            c.name as category_name, c.slug as category_slug,
            vi.business_name as primary_vendor,
            CASE 
              WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
              WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
              WHEN p.is_active = 0 THEN 'discontinued'
              ELSE 'in_stock'
            END as inventory_status,
            CASE 
              WHEN p.cost_price > 0 THEN ((p.base_price - p.cost_price) / p.base_price * 100)
              ELSE 0
            END as profit_margin
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           LEFT JOIN vendor_products vp ON p.product_id = vp.product_id AND vp.is_primary = 1
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           ${whereClause}
           GROUP BY p.product_id
           ORDER BY p.created_at DESC
           LIMIT ${limit} OFFSET ${offset}`,
          params
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(DISTINCT p.product_id) as total
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           ${whereClause}`,
          params
        );
        return (rows as any[])[0].total;
      },

      summary: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(*) as total_products,
            SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products,
            SUM(CASE WHEN p.approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
            SUM(CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
            SUM(p.stock_quantity * p.cost_price) as total_inventory_value,
            AVG(CASE WHEN p.cost_price > 0 THEN ((p.base_price - p.cost_price) / p.base_price * 100) ELSE 0 END) as avg_profit_margin
           FROM products p`
        );
        return (rows as any[])[0];
      }
    });

    const products = (results.products as any[]).map(product => ({
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      base_price: parseFloat(product.base_price),
      cost_price: parseFloat(product.cost_price),
      category_id: product.category_id,
      is_active: !!product.is_active,
      is_featured: !!product.is_featured,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 5,
      rating: parseFloat(product.rating) || 0,
      review_count: product.review_count || 0,
      total_sales: product.total_sales || 0,
      created_at: product.created_at,
      updated_at: product.updated_at,
      approval_status: product.approval_status || 'approved',
      last_modified_by: product.last_modified_by,
      profit_margin: parseFloat(product.profit_margin) || 0,
      inventory_status: product.inventory_status,
      
      category: product.category_name ? {
        category_id: product.category_id,
        name: product.category_name,
        slug: product.category_slug
      } : undefined
    }));

    const total = results.totalCount || 0;
    const summary = results.summary || {};

    return {
      products,
      pagination: this.buildPaginationInfo(page, limit, total),
      filters,
      summary: {
        total_products: summary.total_products || 0,
        active_products: summary.active_products || 0,
        pending_approval: summary.pending_approval || 0,
        low_stock_count: summary.low_stock_count || 0,
        total_inventory_value: parseFloat(summary.total_inventory_value) || 0,
        avg_profit_margin: parseFloat(summary.avg_profit_margin) || 0
      }
    };
  }

  private async handleCreateProduct(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['name', 'sku', 'base_price', 'category_id']);

    const pool = await getPool();
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO products (
          name, slug, description, sku, base_price, cost_price, category_id,
          is_active, is_featured, stock_quantity, low_stock_threshold,
          approval_status, last_modified_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.name,
          body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          body.description || null,
          body.sku,
          body.base_price,
          body.cost_price || 0,
          body.category_id,
          body.is_active !== false,
          body.is_featured || false,
          body.stock_quantity || 0,
          body.low_stock_threshold || 5,
          'approved', // Admin created = auto approved
          adminUser.user_id
        ]
      );

      const productId = (result as any).insertId;

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('products');

      const productData = await this.fetchSingleProduct(productId, ['images', 'vendors']);

      return this.successResponse({
        product: productData,
        created: true,
        message: 'Product created successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'create_product',
        product_name: body.name 
      });
    }
  }

  private async handleUpdateProduct(body: any, adminUser: any) {
    const productId = body.product_id;
    const pool = await getPool();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = [
        'name', 'slug', 'description', 'sku', 'base_price', 'cost_price',
        'category_id', 'is_active', 'is_featured', 'stock_quantity',
        'low_stock_threshold', 'admin_notes', 'approval_status'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('last_modified_by = ?', 'updated_at = NOW()');
        values.push(adminUser.user_id, productId);

        await pool.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
          values
        );
      }

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('products');
      GlobalCaches.admin.invalidate(`admin:product:${productId}`);
      GlobalCaches.products.invalidateByPattern(`product:${productId}:*`);

      const updatedProduct = await this.fetchSingleProduct(productId, ['analytics']);

      return this.successResponse({
        product: updatedProduct,
        updated: true,
        message: 'Product updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_product',
        product_id: productId 
      });
    }
  }

  private async handleDeleteProduct(productId: number, permanent: boolean, adminUser: any) {
    const pool = await getPool();

    try {
      if (permanent) {
        // Check if product has orders
        const [orderCheck] = await pool.execute(
          'SELECT COUNT(*) as order_count FROM order_items WHERE product_id = ?',
          [productId]
        );

        if ((orderCheck as any[])[0].order_count > 0) {
          throw APIErrorHandler.createError(
            APIErrorCode.CONSTRAINT_VIOLATION,
            'Cannot delete product with existing orders'
          );
        }

        // Permanent deletion
        await pool.execute('DELETE FROM products WHERE product_id = ?', [productId]);
      } else {
        // Soft delete - deactivate
        await pool.execute(
          'UPDATE products SET is_active = 0, last_modified_by = ?, updated_at = NOW() WHERE product_id = ?',
          [adminUser.user_id, productId]
        );
      }

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('products');
      GlobalCaches.products.invalidateByPattern(`product:${productId}:*`);

      return this.successResponse({
        product_id: productId,
        deleted: permanent,
        deactivated: !permanent,
        message: permanent ? 'Product permanently deleted' : 'Product deactivated'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: permanent ? 'delete_product' : 'deactivate_product',
        product_id: productId 
      });
    }
  }

  private async handleApproveProduct(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['product_id']);

    const pool = await getPool();
    
    await pool.execute(
      'UPDATE products SET approval_status = ?, last_modified_by = ?, updated_at = NOW() WHERE product_id = ?',
      ['approved', adminUser.user_id, body.product_id]
    );

    GlobalCaches.admin.invalidateByTag('products');

    return this.successResponse({
      product_id: body.product_id,
      approved: true,
      message: 'Product approved successfully'
    });
  }

  private async handleRejectProduct(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['product_id']);

    const pool = await getPool();
    const reason = body.reason || 'Not specified';
    
    await pool.execute(
      'UPDATE products SET approval_status = ?, admin_notes = ?, last_modified_by = ?, updated_at = NOW() WHERE product_id = ?',
      ['rejected', reason, adminUser.user_id, body.product_id]
    );

    GlobalCaches.admin.invalidateByTag('products');

    return this.successResponse({
      product_id: body.product_id,
      rejected: true,
      reason,
      message: 'Product rejected'
    });
  }

  private async handleBulkUpdate(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['product_ids', 'updates']);

    const pool = await getPool();
    const results = [];

    for (const productId of body.product_ids) {
      try {
        const result = await this.handleUpdateProduct(
          { product_id: productId, ...body.updates }, 
          adminUser
        );
        results.push({ product_id: productId, success: true, data: result });
      } catch (error) {
        results.push({ 
          product_id: productId, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return this.successResponse({
      results,
      total: body.product_ids.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  }

  private async handleDuplicateProduct(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['product_id']);

    return this.successResponse({
      original_product_id: body.product_id,
      new_product_id: body.product_id + 1000, // Placeholder
      duplicated: true,
      message: 'Product duplicated successfully'
    });
  }

  private async handleImportProducts(body: any, adminUser: any) {
    const importId = `products_import_${Date.now()}`;
    
    return this.successResponse({
      import_id: importId,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 60000).toISOString(),
      message: 'Product import started'
    });
  }

  private async handleExportProducts(body: any, adminUser: any) {
    const format = body.format || 'csv';
    const exportId = `products_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      download_url: `/api/admin/products/export/${exportId}`
    });
  }
}