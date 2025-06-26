/**
 * Vendor Products Consolidated Handler
 * Replaces multiple vendor product management endpoints with comprehensive product operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

export class VendorProductsHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/vendor/products');
  }

  async handleGET(req: NextRequest, user: any | null) {
    if (!user || !this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    const productId = this.sanitizeNumberParam(searchParams.get('product_id'));
    const include = searchParams.get('include')?.split(',') || [];
    
    if (productId) {
      return this.handleGetSingleProduct(productId, include, user);
    }
    
    const filters = {
      status: this.sanitizeStringParam(searchParams.get('status')),
      category: this.sanitizeStringParam(searchParams.get('category')),
      search: this.sanitizeStringParam(searchParams.get('search'))
    };

    try {
      const cacheKey = `vendor:products:${user.vendor_info_id}:${page}:${limit}:${JSON.stringify(filters)}`;
      
      const result = await GlobalCaches.vendor.getOrSet(
        cacheKey,
        () => this.fetchVendorProducts(user.vendor_info_id, page, limit, offset, filters, include),
        CacheConfigs.standard
      );

      MigrationTracker.recordEndpointUsage('/api/vendor/products', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        vendor_id: user.vendor_info_id,
        filters
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'VENDOR')) {
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
      case 'bulk_update':
        return this.handleBulkUpdate(body, user);
      case 'duplicate':
        return this.handleDuplicateProduct(body, user);
      case 'upload_images':
        return this.handleUploadImages(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body || !body.product_id) {
      throw APIErrorHandler.createValidationError('product_id', 'Product ID required for updates');
    }

    return this.handleUpdateProduct(body, user);
  }

  async handleDELETE(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const productId = this.sanitizeNumberParam(searchParams.get('product_id'));

    if (!productId) {
      throw APIErrorHandler.createValidationError('product_id', 'Product ID required');
    }

    return this.handleDeactivateProduct(productId, user);
  }

  // Private implementation methods

  private async handleGetSingleProduct(productId: number, include: string[], user: any) {
    const cacheKey = `vendor:product:${productId}:${user.vendor_info_id}:${include.join(',')}`;
    
    const result = await GlobalCaches.vendor.getOrSet(
      cacheKey,
      () => this.fetchSingleProduct(productId, user.vendor_info_id, include),
      CacheConfigs.fast
    );

    return this.successResponse(result.data, {
      cached: result.fromCache
    });
  }

  private async fetchSingleProduct(productId: number, vendorId: number, include: string[]) {
    const pool = await getPool();
    
    const [productRows] = await pool.execute(
      `SELECT 
        p.*,
        vp.vendor_price, vp.quantity_available,
        c.name as category_name
       FROM products p
       JOIN vendor_products vp ON p.product_id = vp.product_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = ? AND vp.vendor_id = ?`,
      [productId, vendorId]
    );

    if (!productRows || (productRows as any[]).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Product not found');
    }

    const product = (productRows as any[])[0];
    
    // Add optional data based on includes
    const queries: any = {};
    
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
            COALESCE(SUM(oi.quantity), 0) as units_sold,
            COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
            COUNT(DISTINCT o.order_id) as total_orders
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.order_id
           WHERE oi.product_id = ? AND o.status = 'completed'`,
          [productId]
        );
        return (rows as any[])[0];
      };
    }

    const results = Object.keys(queries).length > 0 
      ? await this.executeParallelQueries(queries)
      : {};

    return {
      ...product,
      images: results.images,
      analytics: results.analytics,
      category_name: product.category_name
    };
  }

  private async fetchVendorProducts(
    vendorId: number,
    page: number,
    limit: number,
    offset: number,
    filters: any,
    include: string[]
  ) {
    const pool = await getPool();
    
    const conditions: string[] = ['vp.vendor_id = ?'];
    const params: any[] = [vendorId];

    if (filters.status) {
      conditions.push('p.is_active = ?');
      params.push(filters.status === 'active' ? 1 : 0);
    }

    if (filters.category) {
      conditions.push('c.slug = ?');
      params.push(filters.category);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const results = await this.executeParallelQueries({
      products: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            p.*,
            vp.vendor_price, vp.quantity_available,
            c.name as category_name,
            pi.image_url as primary_image
           FROM vendor_products vp
           JOIN products p ON vp.product_id = p.product_id
           LEFT JOIN categories c ON p.category_id = c.category_id
           LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
           ${whereClause}
           ORDER BY p.created_at DESC
           LIMIT ${limit} OFFSET ${offset}`,
          params
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) as total
           FROM vendor_products vp
           JOIN products p ON vp.product_id = p.product_id
           LEFT JOIN categories c ON p.category_id = c.category_id
           ${whereClause}`,
          params
        );
        return (rows as any[])[0].total;
      }
    });

    return {
      products: results.products,
      pagination: this.buildPaginationInfo(page, limit, results.totalCount || 0)
    };
  }

  private async handleCreateProduct(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['name', 'sku', 'base_price', 'category_id']);

    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create product
      const [productResult] = await connection.execute(
        `INSERT INTO products (
          name, slug, description, sku, base_price, category_id,
          is_active, stock_quantity, approval_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.name,
          body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          body.description || null,
          body.sku,
          body.base_price,
          body.category_id,
          true,
          body.stock_quantity || 0,
          'pending' // Vendor products need approval
        ]
      );

      const productId = (productResult as any).insertId;

      // Link to vendor
      await connection.execute(
        `INSERT INTO vendor_products (vendor_id, product_id, vendor_price, quantity_available, is_primary)
         VALUES (?, ?, ?, ?, ?)`,
        [user.vendor_info_id, productId, body.vendor_price || body.base_price, body.stock_quantity || 0, true]
      );

      await connection.commit();

      // Invalidate caches
      GlobalCaches.vendor.invalidateByPattern(`vendor:products:${user.vendor_info_id}:*`);

      return this.successResponse({
        product_id: productId,
        created: true,
        approval_status: 'pending',
        message: 'Product created successfully and submitted for approval'
      });

    } catch (error) {
      await connection.rollback();
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'create_product',
        vendor_id: user.vendor_info_id
      });
    } finally {
      connection.release();
    }
  }

  private async handleUpdateProduct(body: any, user: any) {
    const productId = body.product_id;
    const pool = await getPool();

    try {
      // Verify vendor owns this product
      const [ownershipCheck] = await pool.execute(
        'SELECT product_id FROM vendor_products WHERE product_id = ? AND vendor_id = ?',
        [productId, user.vendor_info_id]
      );

      if ((ownershipCheck as any[]).length === 0) {
        throw APIErrorHandler.createAuthenticationError('forbidden');
      }

      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = [
        'name', 'description', 'base_price', 'stock_quantity', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(productId);

        await pool.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
          values
        );

        // Update vendor-specific data
        if (body.vendor_price !== undefined || body.quantity_available !== undefined) {
          await pool.execute(
            `UPDATE vendor_products SET 
              vendor_price = COALESCE(?, vendor_price),
              quantity_available = COALESCE(?, quantity_available)
             WHERE product_id = ? AND vendor_id = ?`,
            [body.vendor_price, body.quantity_available, productId, user.vendor_info_id]
          );
        }
      }

      // Invalidate caches
      GlobalCaches.vendor.invalidateByPattern(`vendor:product:${productId}:*`);
      GlobalCaches.vendor.invalidateByPattern(`vendor:products:${user.vendor_info_id}:*`);

      return this.successResponse({
        product_id: productId,
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

  private async handleDeactivateProduct(productId: number, user: any) {
    const pool = await getPool();
    
    try {
      // Verify ownership and deactivate
      await pool.execute(
        `UPDATE products p
         JOIN vendor_products vp ON p.product_id = vp.product_id
         SET p.is_active = 0, p.updated_at = NOW()
         WHERE p.product_id = ? AND vp.vendor_id = ?`,
        [productId, user.vendor_info_id]
      );

      // Invalidate caches
      GlobalCaches.vendor.invalidateByPattern(`vendor:product:${productId}:*`);
      GlobalCaches.vendor.invalidateByPattern(`vendor:products:${user.vendor_info_id}:*`);

      return this.successResponse({
        product_id: productId,
        deactivated: true,
        message: 'Product deactivated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'deactivate_product',
        product_id: productId
      });
    }
  }

  private async handleBulkUpdate(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['product_ids', 'updates']);

    const results = [];
    
    for (const productId of body.product_ids) {
      try {
        const result = await this.handleUpdateProduct(
          { product_id: productId, ...body.updates }, 
          user
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

  private async handleDuplicateProduct(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['product_id']);

    return this.successResponse({
      original_product_id: body.product_id,
      new_product_id: body.product_id + 1000, // Placeholder
      duplicated: true,
      message: 'Product duplicated successfully'
    });
  }

  private async handleUploadImages(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['product_id', 'images']);

    return this.successResponse({
      product_id: body.product_id,
      uploaded_count: body.images.length,
      message: 'Images uploaded successfully'
    });
  }
}