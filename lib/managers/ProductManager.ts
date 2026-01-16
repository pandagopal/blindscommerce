/**
 * ProductManager - Shared product CRUD operations
 * Used by AdminHandler, VendorsHandler, and SalesPersonHandler
 * Handles approval workflow for salesperson actions
 */

import { getPool } from '@/lib/db';
import { PoolConnection } from 'mysql2/promise';

export type UserRole = 'ADMIN' | 'VENDOR' | 'SALESPERSON';

export interface ProductData {
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  full_description?: string;
  base_price: number;
  vendor_id?: string;
  is_active: boolean;
  is_featured: boolean;
  categories?: string[];
  primary_category?: string;
  primaryCategory?: string;
  options?: any;
  pricing_matrix?: any[];
  images?: any[];
  fabric?: any;
  features?: any[];
  roomRecommendations?: any[];
  rendering3D?: any;
  pricing_formula?: any;
}

export class ProductManager {
  /**
   * Create a new product
   * For SALESPERSON role, creates a pending approval request
   */
  async createProduct(
    data: ProductData,
    userRole: UserRole,
    userId: string,
    vendorId?: string
  ): Promise<{ product_id?: number; approval_id?: number; message: string }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (userRole === 'SALESPERSON') {
        // Create pending approval request
        const approvalId = await this.createApprovalRequest(
          conn,
          'CREATE',
          null,
          data,
          userId,
          vendorId
        );

        await conn.commit();
        return {
          approval_id: approvalId,
          message: 'Product creation request submitted for approval'
        };
      }

      // Admin or Vendor can create directly
      const productId = await this.executeCreateProduct(conn, data, vendorId);

      await conn.commit();
      return {
        product_id: productId,
        message: 'Product created successfully'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Update an existing product
   * For SALESPERSON role, creates a pending approval request
   */
  async updateProduct(
    productId: number,
    data: ProductData,
    userRole: UserRole,
    userId: string,
    vendorId?: string
  ): Promise<{ product_id?: number; approval_id?: number; message: string }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (userRole === 'SALESPERSON') {
        // Create pending approval request
        const approvalId = await this.createApprovalRequest(
          conn,
          'UPDATE',
          productId,
          data,
          userId,
          vendorId
        );

        await conn.commit();
        return {
          approval_id: approvalId,
          message: 'Product update request submitted for approval'
        };
      }

      // Admin or Vendor can update directly
      await this.executeUpdateProduct(conn, productId, data, vendorId);

      await conn.commit();
      return {
        product_id: productId,
        message: 'Product updated successfully'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Delete a product
   * For SALESPERSON role, creates a pending approval request
   */
  async deleteProduct(
    productId: number,
    userRole: UserRole,
    userId: string,
    vendorId?: string
  ): Promise<{ approval_id?: number; message: string }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (userRole === 'SALESPERSON') {
        // Create pending approval request
        const approvalId = await this.createApprovalRequest(
          conn,
          'DELETE',
          productId,
          null,
          userId,
          vendorId
        );

        await conn.commit();
        return {
          approval_id: approvalId,
          message: 'Product deletion request submitted for approval'
        };
      }

      // Admin or Vendor can delete directly
      await this.executeDeleteProduct(conn, productId);

      await conn.commit();
      return {
        message: 'Product deleted successfully'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Execute product creation (used by approved actions)
   */
  private async executeCreateProduct(
    conn: PoolConnection,
    data: ProductData,
    vendorId?: string
  ): Promise<number> {
    // Get category_id from category name
    let categoryId = null;
    if (data.primary_category || data.primaryCategory) {
      const primaryCat = data.primary_category || data.primaryCategory;
      const [category] = await conn.execute(
        'SELECT category_id FROM categories WHERE name = ?',
        [primaryCat]
      ) as any[];
      if (category && category[0]) {
        categoryId = category[0].category_id;
      }
    }

    // Insert basic product info
    const finalVendorId = vendorId || data.vendor_id;

    // Validate vendor exists if vendor_id is provided
    if (finalVendorId) {
      const [vendorCheck] = await conn.execute(
        'SELECT user_id FROM vendor_info WHERE user_id = ?',
        [finalVendorId]
      ) as any[];

      if (!vendorCheck || vendorCheck.length === 0) {
        throw new Error(`Vendor with user_id=${finalVendorId} does not exist. Please ensure the vendor exists in the system.`);
      }
    }

    const [result] = await conn.execute(
      `INSERT INTO products (
        name, slug, sku, short_description, full_description, base_price,
        vendor_id, is_active, is_featured, category_id,
        custom_width_min, custom_width_max, custom_height_min, custom_height_max,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.name,
        data.slug,
        data.sku,
        data.short_description,
        data.full_description || data.short_description,
        data.base_price,
        finalVendorId,
        data.is_active ? 1 : 0,
        data.is_featured ? 1 : 0,
        categoryId,
        data.options?.dimensions?.minWidth || 12,
        data.options?.dimensions?.maxWidth || 96,
        data.options?.dimensions?.minHeight || 12,
        data.options?.dimensions?.maxHeight || 120
      ]
    ) as any;

    const productId = result.insertId;

    // Create vendor-product link if vendorId provided
    if (vendorId) {
      await conn.execute(
        'INSERT INTO vendor_products (vendor_id, product_id, is_active) VALUES (?, ?, 1)',
        [vendorId, productId]
      );
    }

    // Insert all related data
    await this.insertProductRelations(conn, productId, data);

    return productId;
  }

  /**
   * Execute product update (used by approved actions)
   */
  private async executeUpdateProduct(
    conn: PoolConnection,
    productId: number,
    data: ProductData,
    vendorId?: string
  ): Promise<void> {
    // Get category_id from category name
    let categoryId = null;
    if (data.primary_category || data.primaryCategory) {
      const primaryCat = data.primary_category || data.primaryCategory;
      const [category] = await conn.execute(
        'SELECT category_id FROM categories WHERE name = ?',
        [primaryCat]
      ) as any[];
      if (category && category[0]) {
        categoryId = category[0].category_id;
      }
    }

    // Update basic product info
    await conn.execute(
      `UPDATE products SET
        name = ?, slug = ?, sku = ?, short_description = ?, full_description = ?,
        base_price = ?, is_active = ?, is_featured = ?, category_id = ?,
        custom_width_min = ?, custom_width_max = ?, custom_height_min = ?, custom_height_max = ?,
        updated_at = NOW()
      WHERE product_id = ?`,
      [
        data.name,
        data.slug,
        data.sku,
        data.short_description,
        data.full_description || data.short_description,
        data.base_price,
        data.is_active ? 1 : 0,
        data.is_featured ? 1 : 0,
        categoryId,
        data.options?.dimensions?.minWidth || 12,
        data.options?.dimensions?.maxWidth || 96,
        data.options?.dimensions?.minHeight || 12,
        data.options?.dimensions?.maxHeight || 120,
        productId
      ]
    );

    // Delete and re-insert all related data
    await this.deleteProductRelations(conn, productId);
    await this.insertProductRelations(conn, productId, data);
  }

  /**
   * Execute product deletion (used by approved actions)
   */
  private async executeDeleteProduct(
    conn: PoolConnection,
    productId: number
  ): Promise<void> {
    // Delete all related data first
    await this.deleteProductRelations(conn, productId);

    // Delete the product
    await conn.execute('DELETE FROM products WHERE product_id = ?', [productId]);
  }

  /**
   * Insert all product relations (categories, pricing, images, etc.)
   */
  private async insertProductRelations(
    conn: PoolConnection,
    productId: number,
    data: ProductData
  ): Promise<void> {
    // Insert categories
    if (data.categories && Array.isArray(data.categories)) {
      for (const categoryName of data.categories) {
        const [category] = await conn.execute(
          'SELECT category_id FROM categories WHERE name = ?',
          [categoryName]
        ) as any[];
        if (category && category[0]) {
          const primaryCat = data.primary_category || data.primaryCategory;
          const isPrimary = primaryCat && categoryName === primaryCat ? 1 : 0;
          await conn.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, ?)',
            [productId, category[0].category_id, isPrimary]
          );
        }
      }
    }

    // Insert pricing matrix
    if (data.pricing_matrix && Array.isArray(data.pricing_matrix)) {
      for (const price of data.pricing_matrix) {
        await conn.execute(
          `INSERT INTO product_pricing_matrix (
            product_id, width_min, width_max, height_min, height_max,
            base_price, price_per_sqft, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            price.width_min,
            price.width_max,
            price.height_min,
            price.height_max,
            price.base_price || 0,
            price.price_per_sqft || 0,
            price.is_active !== undefined ? price.is_active : 1
          ]
        );
      }
    }

    // Insert options (dimensions, mount types, etc.)
    if (data.options) {
      await this.insertProductOptions(conn, productId, data.options);
    }

    // Insert images
    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        const image = data.images[i];
        await conn.execute(
          `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, image.url, image.alt || '', image.isPrimary ? 1 : 0, i]
        );
      }
    }

    // Insert fabric
    if (data.fabric?.fabrics && Array.isArray(data.fabric.fabrics)) {
      await this.insertProductFabric(conn, productId, data.fabric);
    }

    // Insert features
    if (data.features && Array.isArray(data.features)) {
      await this.insertProductFeatures(conn, productId, data.features);
    }

    // Insert room recommendations
    if (data.roomRecommendations && Array.isArray(data.roomRecommendations)) {
      await this.insertRoomRecommendations(conn, productId, data.roomRecommendations);
    }
  }

  /**
   * Delete all product relations
   */
  private async deleteProductRelations(
    conn: PoolConnection,
    productId: number
  ): Promise<void> {
    await conn.execute('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_pricing_matrix WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_dimensions WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_specifications WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_features WHERE product_id = ?', [productId]);
    await conn.execute('DELETE FROM product_rooms WHERE product_id = ?', [productId]);
  }

  /**
   * Insert product options (dimensions, mount types, control types, etc.)
   */
  private async insertProductOptions(
    conn: PoolConnection,
    productId: number,
    options: any
  ): Promise<void> {
    // Insert dimensions
    if (options.dimensions) {
      await conn.execute(
        `INSERT INTO product_dimensions (product_id, dimension_type_id, min_value, max_value, increment_value, unit)
         VALUES (?, 1, ?, ?, ?, 'inches')`,
        [productId, options.dimensions.minWidth || 12, options.dimensions.maxWidth || 96, options.dimensions.widthIncrement || 0.125]
      );
      await conn.execute(
        `INSERT INTO product_dimensions (product_id, dimension_type_id, min_value, max_value, increment_value, unit)
         VALUES (?, 2, ?, ?, ?, 'inches')`,
        [productId, options.dimensions.minHeight || 12, options.dimensions.maxHeight || 120, options.dimensions.heightIncrement || 0.125]
      );
    }

    // Insert mount types
    if (options.mountTypes && Array.isArray(options.mountTypes)) {
      for (let i = 0; i < options.mountTypes.length; i++) {
        const value = typeof options.mountTypes[i] === 'object'
          ? JSON.stringify(options.mountTypes[i])
          : options.mountTypes[i];
        await conn.execute(
          'INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) VALUES (?, ?, ?, ?, ?)',
          [productId, 'mount_type', value, 'mount_type', i]
        );
      }
    }

    // Insert control types
    const controlTypes = ['liftSystems', 'wandSystem', 'stringSystem', 'remoteControl'];
    const specNames = ['lift_system', 'wand_system', 'string_system', 'remote_control'];

    for (let j = 0; j < controlTypes.length; j++) {
      const controlType = controlTypes[j];
      const specName = specNames[j];
      if (options.controlTypes?.[controlType] && Array.isArray(options.controlTypes[controlType])) {
        for (let i = 0; i < options.controlTypes[controlType].length; i++) {
          const value = typeof options.controlTypes[controlType][i] === 'object'
            ? JSON.stringify(options.controlTypes[controlType][i])
            : options.controlTypes[controlType][i];
          await conn.execute(
            'INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) VALUES (?, ?, ?, ?, ?)',
            [productId, specName, value, specName, i]
          );
        }
      }
    }

    // Insert valance options
    if (options.valanceOptions && Array.isArray(options.valanceOptions)) {
      for (let i = 0; i < options.valanceOptions.length; i++) {
        const value = typeof options.valanceOptions[i] === 'object'
          ? JSON.stringify(options.valanceOptions[i])
          : options.valanceOptions[i];
        await conn.execute(
          'INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) VALUES (?, ?, ?, ?, ?)',
          [productId, 'valance_option', value, 'valance_option', i]
        );
      }
    }

    // Insert bottom rail options
    if (options.bottomRailOptions && Array.isArray(options.bottomRailOptions)) {
      for (let i = 0; i < options.bottomRailOptions.length; i++) {
        const value = typeof options.bottomRailOptions[i] === 'object'
          ? JSON.stringify(options.bottomRailOptions[i])
          : options.bottomRailOptions[i];
        await conn.execute(
          'INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) VALUES (?, ?, ?, ?, ?)',
          [productId, 'bottom_rail_option', value, 'bottom_rail_option', i]
        );
      }
    }
  }

  /**
   * Insert product fabric
   */
  private async insertProductFabric(
    conn: PoolConnection,
    productId: number,
    fabric: any
  ): Promise<void> {
    for (const f of fabric.fabrics) {
      const [result] = await conn.execute(
        `INSERT INTO product_fabric_options (product_id, fabric_name, fabric_code, material_type,
         price_adjustment, is_available) VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, f.name, f.id, f.material || 'fabric', f.price || 0, 1]
      ) as any;

      const fabricOptionId = result.insertId;

      // Insert fabric image if exists
      if (f.image?.url) {
        await conn.execute(
          `INSERT INTO product_fabric_images (fabric_option_id, image_url, image_type, display_order)
           VALUES (?, ?, ?, ?)`,
          [fabricOptionId, f.image.url, f.image.type || 'image/jpeg', 1]
        );
      }
    }
  }

  /**
   * Insert product features
   */
  private async insertProductFeatures(
    conn: PoolConnection,
    productId: number,
    features: any[]
  ): Promise<void> {
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      let [existingFeature] = await conn.execute(
        'SELECT feature_id FROM features WHERE name = ?',
        [feature.name || feature.title]
      ) as any[];

      let featureId;
      if (!existingFeature || !existingFeature[0]) {
        const [result] = await conn.execute(
          'INSERT INTO features (name, description, display_order) VALUES (?, ?, ?)',
          [feature.name || feature.title, feature.description || '', i]
        ) as any;
        featureId = result.insertId;
      } else {
        featureId = existingFeature[0].feature_id;
      }

      await conn.execute(
        'INSERT INTO product_features (product_id, feature_id) VALUES (?, ?)',
        [productId, featureId]
      );
    }
  }

  /**
   * Insert room recommendations
   */
  private async insertRoomRecommendations(
    conn: PoolConnection,
    productId: number,
    rooms: any[]
  ): Promise<void> {
    for (const room of rooms) {
      if (room.roomType || room.room_type || room.name) {
        await conn.execute(
          `INSERT INTO product_rooms (product_id, room_type, suitability_score, special_considerations)
           VALUES (?, ?, ?, ?)`,
          [
            productId,
            room.roomType || room.room_type || room.name,
            room.priority || room.suitability_score || 5,
            room.recommendation || room.special_considerations || null
          ]
        );
      }
    }
  }

  /**
   * Create an approval request for salesperson actions
   */
  private async createApprovalRequest(
    conn: PoolConnection,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    productId: number | null,
    data: ProductData | null,
    userId: string,
    vendorId?: string
  ): Promise<number> {
    const [result] = await conn.execute(
      `INSERT INTO product_approval_requests
       (action_type, product_id, requested_by, vendor_id, request_data, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [
        action,
        productId,
        userId,
        vendorId,
        data ? JSON.stringify(data) : null
      ]
    ) as any;

    return result.insertId;
  }

  /**
   * Approve a pending request
   */
  async approveRequest(
    approvalId: number,
    approvedBy: string
  ): Promise<{ product_id?: number; message: string }> {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get the approval request
      const [requests] = await conn.execute(
        'SELECT * FROM product_approval_requests WHERE id = ? AND status = ?',
        [approvalId, 'PENDING']
      ) as any[];

      if (!requests || requests.length === 0) {
        throw new Error('Approval request not found or already processed');
      }

      const request = requests[0];
      const action = request.action_type;
      const productId = request.product_id;
      const data = request.request_data ? JSON.parse(request.request_data) : null;
      const vendorId = request.vendor_id;

      let resultProductId: number | undefined;

      // Execute the action
      if (action === 'CREATE') {
        resultProductId = await this.executeCreateProduct(conn, data, vendorId);
      } else if (action === 'UPDATE') {
        await this.executeUpdateProduct(conn, productId, data, vendorId);
        resultProductId = productId;
      } else if (action === 'DELETE') {
        await this.executeDeleteProduct(conn, productId);
      }

      // Update approval status
      await conn.execute(
        'UPDATE product_approval_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
        ['APPROVED', approvedBy, approvalId]
      );

      await conn.commit();

      return {
        product_id: resultProductId,
        message: `Product ${action.toLowerCase()} approved and executed successfully`
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Reject a pending request
   */
  async rejectRequest(
    approvalId: number,
    rejectedBy: string,
    reason?: string
  ): Promise<{ message: string }> {
    const pool = await getPool();

    await pool.execute(
      'UPDATE product_approval_requests SET status = ?, rejected_by = ?, rejection_reason = ?, rejected_at = NOW() WHERE id = ? AND status = ?',
      ['REJECTED', rejectedBy, reason, approvalId, 'PENDING']
    );

    return {
      message: 'Product request rejected successfully'
    };
  }
}
