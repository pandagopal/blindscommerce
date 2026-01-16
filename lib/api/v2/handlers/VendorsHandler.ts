/**
 * Vendors Handler for V2 API
 * Handles vendor dashboard, products, orders, and analytics
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { vendorService, productService, orderService, productManager } from '@/lib/services/singletons';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { FileUploadService } from '@/lib/utils/fileUpload';
import { deleteCachePattern } from '@/lib/cache/cacheManager';

// Validation schemas
const UpdateVendorSchema = z.object({
  businessName: z.string().min(1).optional(),
  businessDescription: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  // Keep old fields for backward compatibility
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.number().positive(),
  basePrice: z.number().positive(),
  vendorPrice: z.number().positive(),
  quantity: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

const CreateDiscountSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchase: z.number().min(0).optional(),
  appliesTo: z.enum(['all', 'specific_products', 'specific_categories']),
  productIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

const CreateCouponSchema = z.object({
  // Support both old API field names and new frontend field names
  code: z.string().min(3).max(50).optional(),
  coupon_code: z.string().min(3).max(50).optional(),
  coupon_name: z.string().optional(),
  display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  discountType: z.enum(['percentage', 'fixed', 'fixed_amount', 'free_shipping']).optional(),
  discount_type: z.enum(['percentage', 'fixed', 'fixed_amount', 'free_shipping']).optional(),
  discountValue: z.number().min(0).optional(),
  discount_value: z.number().min(0).optional(),
  minPurchase: z.number().min(0).optional(),
  minimum_order_value: z.number().min(0).optional(),
  maximum_discount_amount: z.number().nullable().optional(),
  minimum_quantity: z.number().min(1).optional(),
  usageLimit: z.number().min(0).optional(),
  usage_limit_total: z.number().nullable().optional(),
  perCustomerLimit: z.number().min(0).optional(),
  usage_limit_per_customer: z.number().min(0).optional(),
  startDate: z.string().optional(),
  valid_from: z.string().optional(),
  endDate: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  applies_to: z.enum(['all_vendor_products', 'specific_products', 'specific_categories']).optional(),
  stackable_with_discounts: z.boolean().optional(),
  show_on_homepage_popup: z.boolean().optional(),
  priority: z.number().optional(),
});

export class VendorsHandler extends BaseHandler {
  private vendorService = vendorService;
  private productService = productService;
  private orderService = orderService;

  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'dashboard': () => this.getDashboard(user),
      'profile': () => this.getProfile(user),
      'info': () => this.getVendorInfo(req, user),
      'products': () => this.getProducts(req, user),
      'products/:id': () => this.getProduct(action[1], user),
      'products/bulk/jobs': () => this.getBulkJobs(user),
      'products/bulk/stats': () => this.getBulkStats(user),
      'products/bulk/template': () => this.getBulkTemplate(),
      'products/bulk/export': () => this.exportProducts(req, user),
      'product-approvals': () => this.getProductApprovals(req, user),
      'product-approvals/:id': () => this.getProductApproval(action[1], user),
      'orders': () => this.getOrders(req, user),
      'orders/:id': () => this.getOrder(action[1], user),
      'discounts': () => this.getDiscounts(user),
      'coupons': () => this.getCoupons(user),
      'analytics': () => this.getAnalytics(req, user),
      'analytics/products': () => this.getProductAnalytics(req, user),
      'analytics/revenue': () => this.getRevenueAnalytics(req, user),
      'financial-summary': () => this.getFinancialSummary(req, user),
      'sales-team': () => this.getSalesTeam(req, user),
      'reviews': () => this.getReviews(req, user),
      'storefront': () => this.getStorefront(user),
      'shipments': () => this.getShipments(req, user),
      'shipments/:id': () => this.getShipment(action[1], user),
      'shipments/:id/legs': () => this.getShipmentLegs(action[1], user),
      'shipments/:id/events': () => this.getShipmentEvents(action[1], user),
      'shipments/carriers': () => this.getShippingCarriers(req),
      'orders/:id/shippable': () => this.getShippableOrder(action[1], user),
      'validate/:userId': () => this.validateVendorAccess(action[1]),
      'files': () => this.getFiles(req, user),
      'files/stats': () => this.getFileStats(user),
      'files/:fileId': () => this.getFile(action[2], user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products': () => this.createProduct(req, user),
      'products/bulk': () => this.bulkImportProducts(req, user),
      'product-approvals/:id/approve': () => this.approveProductRequest(action[1], user),
      'product-approvals/:id/reject': () => this.rejectProductRequest(action[1], req, user),
      'discounts': () => this.createDiscount(req, user),
      'coupons': () => this.createCoupon(req, user),
      'sales-team': () => this.addSalesRep(req, user),
      'payouts/request': () => this.requestPayout(req, user),
      'upload': () => this.uploadFile(req, user),
      'files/metadata': () => this.storeFileMetadata(req, user),
      'files/duplicate-check': () => this.checkFileDuplicate(req, user),
      'shipments': () => this.createShipment(req, user),
      'shipments/:id/legs': () => this.addShipmentLeg(action[1], req, user),
      'shipments/:id/events': () => this.addShipmentEvent(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'profile': () => this.updateProfile(req, user),
      'products/:id': () => this.updateProduct(action[1], req, user),
      'discounts/:id': () => this.updateDiscount(action[1], req, user),
      'coupons/:id': () => this.updateCoupon(action[1], req, user),
      'orders/:id/status': () => this.updateOrderStatus(action[1], req, user),
      'sales-team/:id': () => this.updateSalesRep(action[2], req, user),
      'shipments/:id': () => this.updateShipment(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PATCH requests
   */
  async handlePATCH(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products/:id': () => this.patchProduct(action[1], req, user),
      'orders/:id': () => this.patchOrderStatus(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle DELETE requests
   */
  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products/:id': () => this.deleteProduct(action[1], user),
      'discounts/:id': () => this.deleteDiscount(action[1], user),
      'coupons/:id': () => this.deleteCoupon(action[1], user),
      'sales-team/:id': () => this.removeSalesRep(action[2], user),
      'files/:fileId': () => this.deleteFile(action[2], user),
    };

    return this.routeAction(action, routes);
  }

  // Helper to get vendor ID
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');

    const [vendor] = await this.vendorService.raw(
      'SELECT user_id FROM vendor_info WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [user.userId]
    );

    if (!vendor) {
      throw new ApiError('Vendor profile not found', 404);
    }

    return vendor.user_id;
  }

  // Dashboard and profile
  private async getDashboard(user: any) {
    const vendorId = await this.getVendorId(user);
    return this.vendorService.getVendorDashboard(vendorId);
  }

  private async getProfile(user: any) {
    const vendorId = await this.getVendorId(user);
    return this.vendorService.getVendorWithStats(vendorId);
  }

  private async getVendorInfo(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      throw new ApiError('user_id parameter is required', 400);
    }

    // Admin can check any vendor info
    if (user.role === 'admin') {
      const [vendorInfo] = await this.vendorService.raw(
        'SELECT user_id, business_name FROM vendor_info WHERE user_id = ?',
        [parseInt(userId)]
      );
      
      if (!vendorInfo) {
        throw new ApiError('Vendor not found', 404);
      }
      
      return vendorInfo;
    } else {
      throw new ApiError('Insufficient permissions', 403);
    }
  }

  private async updateProfile(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await req.json(); // Get raw data to handle complex structure

    // Extract address fields from nested object
    const addressData = data.address || {};

    await this.vendorService.update(vendorId, {
      business_name: data.businessName,
      brand_name: data.brandName,
      business_description: data.businessDescription,
      business_phone: data.businessPhone || data.phone,
      business_email: data.businessEmail || data.contactEmail,
      website_url: data.website,
      business_address_line1: addressData.addressLine1 || data.address,
      business_city: addressData.city || data.city,
      business_state: addressData.state || data.state,
      business_postal_code: addressData.postalCode || data.zipCode,
      updated_at: new Date(),
    });

    return { message: 'Profile updated successfully' };
  }

  // Product management
  private async getProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const { products, total } = await this.vendorService.getVendorProducts(
      vendorId,
      {
        isActive: searchParams.get('active') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
        categoryId: this.sanitizeNumber(searchParams.get('categoryId')) || undefined,
        sortBy: searchParams.get('sortBy') as any || 'name',
        sortOrder: searchParams.get('sortOrder') as any || 'ASC',
        limit,
        offset,
      }
    );

    const paginatedResponse = this.buildPaginatedResponse(products, total, page, limit);
    
    // Return the paginated response directly - route.ts will wrap it
    return {
      products: paginatedResponse.data,
      pagination: paginatedResponse.pagination
    };
  }

  private async getProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Verify vendor owns the product
    const [ownership] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownership) {
      throw new ApiError('Product not found', 404);
    }

    // Use shared method with full details - includes inactive for vendor editing
    const product = await this.productService.getProductWithFullDetails(productId, vendorId, true);

    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    return { product };
  }

  private async createProduct(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await req.json();

    try {
      const result = await productManager.createProduct(
        data,
        'VENDOR',
        user.userId || user.user_id || 'vendor',
        vendorId.toString()
      );

      // Invalidate products cache
      deleteCachePattern('products:*');

      return {
        success: true,
        product_id: result.product_id,
        message: result.message
      };
    } catch (error) {
      console.error('Failed to create product:', error);
      throw new ApiError('Failed to create product: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
  }

  private async updateProduct(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    const data = await req.json();

    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    try {
      const result = await productManager.updateProduct(
        productId,
        data,
        'VENDOR',
        user.userId || user.user_id || 'vendor',
        vendorId.toString()
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

  private async deleteProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);

    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    try {
      const result = await productManager.deleteProduct(
        productId,
        'VENDOR',
        user.userId || user.user_id || 'vendor',
        vendorId.toString()
      );

      // Invalidate products cache
      deleteCachePattern('products:*');

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw new ApiError('Failed to delete product: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
  }

  // Order management
  private async getOrders(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const statusFilter = searchParams.get('status') || undefined;
    // If no specific status filter, exclude shipped/delivered orders (they appear in Shipments page)
    const excludeStatus = statusFilter ? undefined : ['shipped', 'delivered'];

    const { orders, total } = await this.orderService.getOrders({
      vendorId,
      status: statusFilter,
      excludeStatus,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
      limit,
      offset,
    });

    return this.buildPaginatedResponse(orders, total, page, limit);
  }

  private async getOrder(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    // Verify vendor has items in this order
    // Check if vendor has items in the order
    const [hasItems] = await this.vendorService.raw(
      `SELECT 1 FROM orders o 
       WHERE o.order_id = ? 
       AND EXISTS (
         SELECT 1 FROM order_items oi 
         WHERE oi.order_id = o.order_id AND oi.vendor_id = ?
       )`,
      [orderId, vendorId]
    );

    if (!hasItems) {
      throw new ApiError('Order not found', 404);
    }

    // Use vendor-specific order details method that filters items
    return this.orderService.getVendorOrderWithDetails(orderId, vendorId);
  }

  private async updateOrderStatus(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const { status, notes } = await this.getValidatedBody(req, z.object({
      status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
      notes: z.string().optional(),
    }));

    // TODO: Implement vendor-specific order status tracking
    // In a multi-vendor system, each vendor should be able to update the status of their items
    // This would require a vendor_order_status table or similar

    return { message: 'Order status updated successfully' };
  }

  /**
   * PATCH order status - handles PATCH /api/v2/vendors/orders/:id
   */
  private async patchOrderStatus(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const body = await req.json();
    const { status: rawStatus, notes, tracking_number, carrier } = body;

    // Normalize status to lowercase for consistency (frontend sends 'Pending', 'Shipped', etc.)
    const status = rawStatus ? rawStatus.toLowerCase() : null;

    // Verify vendor has items in this order
    const [hasItems] = await this.vendorService.raw(
      `SELECT 1 FROM orders o
       WHERE o.order_id = ?
       AND EXISTS (
         SELECT 1 FROM order_items oi
         WHERE oi.order_id = o.order_id AND oi.vendor_id = ?
       )`,
      [orderId, vendorId]
    );

    if (!hasItems) {
      throw new ApiError('Order not found', 404);
    }

    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Update order status if provided
      if (status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
          throw new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        // Set shipped_at timestamp when status changes to shipped
        // This is required for installers to see the order (they check shipped_at IS NOT NULL)
        if (status === 'shipped') {
          await conn.execute(
            'UPDATE orders SET status = ?, shipped_at = NOW(), updated_at = NOW() WHERE order_id = ?',
            [status, orderId]
          );
        } else {
          await conn.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
            [status, orderId]
          );
        }

        // Add to order status history if table exists
        try {
          await conn.execute(
            `INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [orderId, status, notes || null, user.userId]
          );
        } catch (historyError) {
          // Table might not exist, continue without error
          console.log('Order status history table not available');
        }
      }

      // Update fulfillment info if tracking_number or carrier provided
      if (tracking_number || carrier) {
        // Check if fulfillment record exists
        const [fulfillment] = await conn.execute(
          'SELECT fulfillment_id FROM order_fulfillment WHERE order_id = ?',
          [orderId]
        ) as any[];

        if (fulfillment && fulfillment.length > 0) {
          // Update existing record
          const updates = [];
          const values = [];

          if (tracking_number) {
            updates.push('tracking_number = ?');
            values.push(tracking_number);
          }
          if (carrier) {
            updates.push('carrier = ?');
            values.push(carrier);
          }

          if (updates.length > 0) {
            updates.push('updated_at = NOW()');
            values.push(orderId);

            await conn.execute(
              `UPDATE order_fulfillment SET ${updates.join(', ')} WHERE order_id = ?`,
              values
            );
          }
        } else {
          // Create new fulfillment record
          await conn.execute(
            `INSERT INTO order_fulfillment (order_id, tracking_number, carrier, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())`,
            [orderId, tracking_number || null, carrier || 'ups']
          );
        }
      }

      await conn.commit();

      return {
        success: true,
        message: 'Order updated successfully',
        order_id: orderId,
        status: status || undefined
      };
    } catch (error) {
      await conn.rollback();
      if (error instanceof ApiError) throw error;
      console.error('Error updating order:', error);
      throw new ApiError('Failed to update order', 500);
    } finally {
      conn.release();
    }
  }

  // Discounts and coupons
  private async getDiscounts(user: any) {
    const vendorId = await this.getVendorId(user);
    const { discounts } = await this.vendorService.getVendorDiscounts(vendorId);
    
    return {
      discounts: discounts || [],
      total: discounts?.length || 0
    };
  }

  private async getCoupons(user: any) {
    const vendorId = await this.getVendorId(user);
    const { coupons } = await this.vendorService.getVendorDiscounts(vendorId);
    return {
      coupons: coupons || [],
      total: coupons?.length || 0
    };
  }

  private async createDiscount(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateDiscountSchema);

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_discounts (
        vendor_id, discount_name, discount_type, discount_value,
        minimum_order_value, applies_to, target_ids,
        valid_from, valid_until, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.name,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.appliesTo,
        JSON.stringify({
          products: data.productIds || [],
          categories: data.categoryIds || []
        }),
        data.startDate || new Date(),
        data.endDate || null,
        data.isActive,
      ]
    );

    return {
      discountId: (result as any).insertId,
      message: 'Discount created successfully',
    };
  }

  private async createCoupon(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateCouponSchema);

    // Support both old and new field names
    const couponCode = data.coupon_code || data.code;
    const couponName = data.coupon_name || couponCode;
    const discountType = data.discount_type || data.discountType || 'percentage';
    const discountValue = data.discount_value ?? data.discountValue ?? 0;
    const minimumOrderValue = data.minimum_order_value ?? data.minPurchase ?? 0;
    const usageLimitTotal = data.usage_limit_total ?? data.usageLimit ?? null;
    const usageLimitPerCustomer = data.usage_limit_per_customer ?? data.perCustomerLimit ?? 1;
    const validFrom = data.valid_from || data.startDate || new Date().toISOString().split('T')[0];
    const validUntil = data.valid_until || data.endDate || null;
    const isActive = data.is_active ?? data.isActive ?? true;
    const showOnHomepagePopup = data.show_on_homepage_popup ?? false;

    if (!couponCode) {
      throw new ApiError('Coupon code is required', 400);
    }

    // Check if code already exists
    const [exists] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_coupons WHERE coupon_code = ?',
      [couponCode]
    );

    if (exists) {
      throw new ApiError('Coupon code already exists', 400);
    }

    // If enabling homepage popup, disable it for other coupons first
    if (showOnHomepagePopup) {
      await this.vendorService.raw(
        'UPDATE vendor_coupons SET show_on_homepage_popup = 0 WHERE vendor_id = ? AND show_on_homepage_popup = 1',
        [vendorId]
      );
    }

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_coupons (
        vendor_id, coupon_code, coupon_name, display_name, description, discount_type, discount_value,
        minimum_order_value, maximum_discount_amount, minimum_quantity, usage_limit_total, usage_limit_per_customer,
        valid_from, valid_until, is_active, show_on_homepage_popup, applies_to, priority, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        couponCode,
        couponName,
        data.display_name || null,
        data.description || null,
        discountType === 'fixed' ? 'fixed_amount' : discountType,
        discountValue,
        minimumOrderValue,
        data.maximum_discount_amount || null,
        data.minimum_quantity || 1,
        usageLimitTotal,
        usageLimitPerCustomer,
        validFrom,
        validUntil,
        isActive ? 1 : 0,
        showOnHomepagePopup ? 1 : 0,
        data.applies_to || 'all_vendor_products',
        data.priority || 0,
        user.userId,
      ]
    );

    return {
      couponId: (result as any).insertId,
      message: 'Coupon created successfully',
    };
  }

  // Analytics
  private async getAnalytics(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    
    // Parse range parameter (e.g., '30d', '7d', '90d')
    const range = searchParams.get('range') || '30d';
    let dateFrom: Date;
    let dateTo = new Date();
    
    // Convert range to date
    const rangeMatch = range.match(/(\d+)([dwmy])/);
    if (rangeMatch) {
      const [, value, unit] = rangeMatch;
      const daysMultiplier = {
        'd': 1,
        'w': 7,
        'm': 30,
        'y': 365
      }[unit] || 1;
      
      dateFrom = new Date(Date.now() - parseInt(value) * daysMultiplier * 24 * 60 * 60 * 1000);
    } else {
      // Default to 30 days if range format is invalid
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Also support explicit dateFrom/dateTo parameters
    if (searchParams.get('dateFrom')) {
      dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    if (searchParams.get('dateTo')) {
      dateTo = new Date(searchParams.get('dateTo')!);
    }

    try {
      const stats = await this.orderService.getOrderStatistics({
        vendorId,
        dateFrom,
        dateTo,
      });

      // Transform data to match expected frontend format
      return {
        overview: {
          total_revenue: stats.totalRevenue || 0,
          revenue_change: 0, // TODO: Calculate change percentage
          total_orders: stats.totalOrders || 0,
          orders_change: 0, // TODO: Calculate change percentage
          product_views: 0, // TODO: Implement product views tracking
          views_change: 0,
          conversion_rate: 0, // TODO: Calculate conversion rate
          conversion_change: 0,
          avg_rating: 0, // TODO: Get average rating from reviews
          commission_earned: 0 // TODO: Calculate commissions
        },
        sales_data: stats.revenueByMonth || [],
        product_performance: [], // TODO: Implement product performance
        customer_insights: [] // TODO: Implement customer insights
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new ApiError('Failed to fetch analytics data', 500);
    }
  }

  private async getFinancialSummary(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    return this.vendorService.getVendorFinancialSummary(vendorId, dateFrom, dateTo);
  }

  // Placeholder methods for remaining endpoints
  private async updateDiscount(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const discountId = parseInt(id);
    
    if (isNaN(discountId)) {
      throw new ApiError('Invalid discount ID', 400);
    }

    // Verify the discount belongs to this vendor
    const [existingDiscount] = await this.vendorService.raw(
      'SELECT discount_id FROM vendor_discounts WHERE discount_id = ? AND vendor_id = ?',
      [discountId, vendorId]
    );

    if (!existingDiscount) {
      throw new ApiError('Discount not found', 404);
    }

    const body = await req.json();
    
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.discount_name !== undefined) {
      updates.push('discount_name = ?');
      values.push(body.discount_name);
    }
    
    if (body.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(body.display_name);
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    
    if (body.discount_type !== undefined) {
      updates.push('discount_type = ?');
      values.push(body.discount_type);
    }
    
    if (body.discount_value !== undefined) {
      updates.push('discount_value = ?');
      values.push(body.discount_value);
    }
    
    if (body.minimum_order_value !== undefined) {
      updates.push('minimum_order_value = ?');
      values.push(body.minimum_order_value);
    }
    
    if (body.minimum_quantity !== undefined) {
      updates.push('minimum_quantity = ?');
      values.push(body.minimum_quantity);
    }
    
    if (body.maximum_discount_amount !== undefined) {
      updates.push('maximum_discount_amount = ?');
      values.push(body.maximum_discount_amount);
    }
    
    if (body.is_automatic !== undefined) {
      updates.push('is_automatic = ?');
      values.push(body.is_automatic ? 1 : 0);
    }
    
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }
    
    if (body.valid_from !== undefined) {
      updates.push('valid_from = ?');
      values.push(body.valid_from || null);
    }
    
    if (body.valid_until !== undefined) {
      updates.push('valid_until = ?');
      values.push(body.valid_until || null);
    }
    
    if (body.applies_to !== undefined) {
      updates.push('applies_to = ?');
      values.push(body.applies_to);
    }
    
    if (body.target_ids !== undefined) {
      updates.push('target_ids = ?');
      values.push(JSON.stringify(body.target_ids || []));
    }
    
    if (body.volume_tiers !== undefined) {
      updates.push('volume_tiers = ?');
      values.push(JSON.stringify(body.volume_tiers || []));
    }
    
    if (body.customer_types !== undefined) {
      updates.push('customer_types = ?');
      values.push(JSON.stringify(body.customer_types || []));
    }
    
    if (body.stackable_with_coupons !== undefined) {
      updates.push('stackable_with_coupons = ?');
      values.push(body.stackable_with_coupons ? 1 : 0);
    }
    
    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');
    
    // Add discount ID and vendor ID for WHERE clause
    values.push(discountId, vendorId);
    
    const updateQuery = `
      UPDATE vendor_discounts 
      SET ${updates.join(', ')}
      WHERE discount_id = ? AND vendor_id = ?
    `;
    
    await this.vendorService.raw(updateQuery, values);
    
    // Return the updated discount
    const [updatedDiscount] = await this.vendorService.raw(
      'SELECT * FROM vendor_discounts WHERE discount_id = ? AND vendor_id = ?',
      [discountId, vendorId]
    );
    
    return {
      success: true,
      discount: updatedDiscount
    };
  }

  private async updateCoupon(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const couponId = parseInt(id);
    
    if (isNaN(couponId)) {
      throw new ApiError('Invalid coupon ID', 400);
    }

    // Verify the coupon belongs to this vendor
    const [existingCoupon] = await this.vendorService.raw(
      'SELECT coupon_id FROM vendor_coupons WHERE coupon_id = ? AND vendor_id = ?',
      [couponId, vendorId]
    );

    if (!existingCoupon) {
      throw new ApiError('Coupon not found', 404);
    }

    const body = await req.json();
    
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.coupon_code !== undefined) {
      updates.push('coupon_code = ?');
      values.push(body.coupon_code);
    }
    
    if (body.coupon_name !== undefined) {
      updates.push('coupon_name = ?');
      values.push(body.coupon_name);
    }
    
    if (body.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(body.display_name);
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    
    if (body.discount_type !== undefined) {
      updates.push('discount_type = ?');
      values.push(body.discount_type);
    }
    
    if (body.discount_value !== undefined) {
      updates.push('discount_value = ?');
      values.push(body.discount_value);
    }
    
    if (body.minimum_order_value !== undefined) {
      updates.push('minimum_order_value = ?');
      values.push(body.minimum_order_value);
    }
    
    if (body.minimum_quantity !== undefined) {
      updates.push('minimum_quantity = ?');
      values.push(body.minimum_quantity);
    }
    
    if (body.maximum_discount_amount !== undefined) {
      updates.push('maximum_discount_amount = ?');
      values.push(body.maximum_discount_amount);
    }
    
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }
    
    if (body.valid_from !== undefined) {
      updates.push('valid_from = ?');
      values.push(body.valid_from || null);
    }
    
    if (body.valid_until !== undefined) {
      updates.push('valid_until = ?');
      values.push(body.valid_until || null);
    }
    
    if (body.usage_limit_total !== undefined) {
      updates.push('usage_limit_total = ?');
      values.push(body.usage_limit_total);
    }
    
    if (body.usage_limit_per_customer !== undefined) {
      updates.push('usage_limit_per_customer = ?');
      values.push(body.usage_limit_per_customer);
    }
    
    if (body.applies_to !== undefined) {
      updates.push('applies_to = ?');
      values.push(body.applies_to);
    }
    
    if (body.target_ids !== undefined) {
      updates.push('target_ids = ?');
      values.push(JSON.stringify(body.target_ids || []));
    }
    
    if (body.customer_types !== undefined) {
      updates.push('customer_types = ?');
      values.push(JSON.stringify(body.customer_types || []));
    }
    
    if (body.stackable_with_discounts !== undefined) {
      updates.push('stackable_with_discounts = ?');
      values.push(body.stackable_with_discounts ? 1 : 0);
    }
    
    if (body.stackable_with_other_coupons !== undefined) {
      updates.push('stackable_with_other_coupons = ?');
      values.push(body.stackable_with_other_coupons ? 1 : 0);
    }

    if (body.show_on_homepage_popup !== undefined) {
      // If enabling homepage popup, disable it for other coupons first
      if (body.show_on_homepage_popup) {
        await this.vendorService.raw(
          'UPDATE vendor_coupons SET show_on_homepage_popup = 0 WHERE vendor_id = ? AND show_on_homepage_popup = 1 AND coupon_id != ?',
          [vendorId, couponId]
        );
      }
      updates.push('show_on_homepage_popup = ?');
      values.push(body.show_on_homepage_popup ? 1 : 0);
    }

    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');
    
    // Add coupon ID and vendor ID for WHERE clause
    values.push(couponId, vendorId);
    
    const updateQuery = `
      UPDATE vendor_coupons 
      SET ${updates.join(', ')}
      WHERE coupon_id = ? AND vendor_id = ?
    `;
    
    await this.vendorService.raw(updateQuery, values);
    
    // Return the updated coupon
    const [updatedCoupon] = await this.vendorService.raw(
      'SELECT * FROM vendor_coupons WHERE coupon_id = ? AND vendor_id = ?',
      [couponId, vendorId]
    );
    
    return {
      success: true,
      coupon: updatedCoupon
    };
  }

  private async deleteDiscount(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async deleteCoupon(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  // Bulk product operations
  private async getBulkJobs(user: any) {
    const vendorId = await this.getVendorId(user);
    // Return mock data for now - in production this would query bulk_import_jobs table
    return {
      jobs: [],
      total: 0
    };
  }

  private async getBulkStats(user: any) {
    const vendorId = await this.getVendorId(user);
    const stats = await this.vendorService.getVendorWithStats(vendorId);
    
    return {
      totalProducts: stats?.total_products || 0,
      activeProducts: stats?.active_products || 0,
      inactiveProducts: (stats?.total_products || 0) - (stats?.active_products || 0),
      totalCategories: 0, // TODO: Implement category count
      recentJobs: 0
    };
  }

  private async getBulkTemplate() {
    // Return CSV template headers
    const headers = [
      'name',
      'sku',
      'category_id',
      'base_price',
      'short_description',
      'full_description',
      'is_active',
      'is_featured',
      'stock_quantity',
      'min_width',
      'max_width',
      'min_height', 
      'max_height'
    ];
    
    return {
      template: headers.join(','),
      headers,
      mimeType: 'text/csv',
      filename: 'product_import_template.csv'
    };
  }

  private async exportProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const format = searchParams.get('format') || 'csv';
    
    // Get all vendor products
    const { products } = await this.vendorService.getVendorProducts(vendorId, {
      limit: 10000 // Get all products for export
    });
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(products[0] || {});
      const csv = [
        headers.join(','),
        ...products.map(p => headers.map(h => JSON.stringify(p[h] || '')).join(','))
      ].join('\n');
      
      return {
        data: csv,
        mimeType: 'text/csv',
        filename: `products_export_${new Date().toISOString().split('T')[0]}.csv`
      };
    } else {
      return {
        data: products,
        mimeType: 'application/json',
        filename: `products_export_${new Date().toISOString().split('T')[0]}.json`
      };
    }
  }

  private async bulkImportProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    // TODO: Implement actual file processing
    // For now, return a mock job response
    return {
      job_id: `job_${Date.now()}`,
      status: 'processing',
      message: 'Bulk import job started successfully'
    };
  }

  private async getProductAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getRevenueAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getSalesTeam(req: NextRequest, user: any) {
    const pool = await getPool();
    
    try {
      // Get all sales team members
      const [salesTeam] = await pool.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        ORDER BY ss.created_at DESC
      `);
      
      return {
        salesTeam: salesTeam || [],
        total: (salesTeam as any[])?.length || 0
      };
    } catch (error) {
      console.error('Error fetching sales team:', error);
      throw new ApiError('Failed to fetch sales team', 500);
    }
  }

  private async addSalesRep(req: NextRequest, user: any) {
    const body = await req.json();
    
    const {
      email,
      firstName,
      lastName,
      phone,
      territory,
      commissionRate,
      targetSales,
      isActive
    } = body;
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Check if user with email already exists
      const [existingUser] = await conn.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );
      
      let userId;
      
      if ((existingUser as any[]).length > 0) {
        // User exists, check if already a sales rep for this vendor
        userId = (existingUser as any[])[0].user_id;
        
        const [existingSalesRep] = await conn.execute(
          'SELECT sales_staff_id FROM sales_staff WHERE user_id = ?',
          [userId]
        );
        
        if ((existingSalesRep as any[]).length > 0) {
          throw new ApiError('This user is already a sales representative for your company', 400);
        }
      } else {
        // Create new user with sales_representative role
        const tempPassword = randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const [result] = await conn.execute(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, phone, 
            role, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'sales', 1, NOW(), NOW())`,
          [email, hashedPassword, firstName, lastName, phone]
        );
        
        userId = (result as any).insertId;
        
        // TODO: Send welcome email with temporary password
      }
      
      // Create sales staff record
      const [salesResult] = await conn.execute(
        `INSERT INTO sales_staff (
          user_id, commission_rate, target_sales, territory,
          is_active, total_sales, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [userId, commissionRate, targetSales, territory, isActive ? 1 : 0]
      );
      
      await conn.commit();
      
      // Fetch and return the created sales rep
      const [newSalesRep] = await conn.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        WHERE ss.sales_staff_id = ?
      `, [(salesResult as any).insertId]);
      
      return {
        success: true,
        salesRep: (newSalesRep as any[])[0]
      };
      
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async updateSalesRep(id: string, req: NextRequest, user: any) {
    const body = await req.json();
    
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid sales staff ID', 400);
    }
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      // Check if the sales rep exists
      const [salesRep] = await conn.execute(
        'SELECT ss.sales_staff_id, ss.user_id FROM sales_staff ss WHERE ss.sales_staff_id = ?',
        [id]
      );
      
      if ((salesRep as any[]).length === 0) {
        throw new ApiError('Sales representative not found', 404);
      }
      
      const userId = (salesRep as any[])[0].user_id;
      
      await conn.beginTransaction();
      
      // Update user information if provided
      if (body.firstName || body.lastName || body.phone) {
        const updates = [];
        const values = [];
        
        if (body.firstName) {
          updates.push('first_name = ?');
          values.push(body.firstName);
        }
        if (body.lastName) {
          updates.push('last_name = ?');
          values.push(body.lastName);
        }
        if (body.phone !== undefined) {
          updates.push('phone = ?');
          values.push(body.phone);
        }
        
        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          values.push(userId);
          
          await conn.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
          );
        }
      }
      
      // Update sales staff information
      const staffUpdates = [];
      const staffValues = [];
      
      if (body.territory !== undefined) {
        staffUpdates.push('territory = ?');
        staffValues.push(body.territory);
      }
      if (body.commissionRate !== undefined) {
        staffUpdates.push('commission_rate = ?');
        staffValues.push(body.commissionRate);
      }
      if (body.targetSales !== undefined) {
        staffUpdates.push('target_sales = ?');
        staffValues.push(body.targetSales);
      }
      if (body.isActive !== undefined) {
        staffUpdates.push('is_active = ?');
        staffValues.push(body.isActive ? 1 : 0);
      }
      
      if (staffUpdates.length > 0) {
        staffUpdates.push('updated_at = NOW()');
        staffValues.push(id);
        
        await conn.execute(
          `UPDATE sales_staff SET ${staffUpdates.join(', ')} WHERE sales_staff_id = ?`,
          staffValues
        );
      }
      
      await conn.commit();
      
      // Fetch and return the updated sales rep
      const [updatedSalesRep] = await conn.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        WHERE ss.sales_staff_id = ?
      `, [id]);
      
      return {
        success: true,
        salesRep: (updatedSalesRep as any[])[0]
      };
      
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async removeSalesRep(id: string, user: any) {
    
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid sales staff ID', 400);
    }
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      // Check if the sales rep exists
      const [salesRep] = await conn.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE sales_staff_id = ?',
        [id]
      );
      
      if ((salesRep as any[]).length === 0) {
        throw new ApiError('Sales representative not found', 404);
      }
      
      // Soft delete by setting is_active to 0
      await conn.execute(
        'UPDATE sales_staff SET is_active = 0, updated_at = NOW() WHERE sales_staff_id = ?',
        [id]
      );
      
      return {
        success: true,
        message: 'Sales representative removed successfully'
      };
      
    } finally {
      conn.release();
    }
  }

  private async getReviews(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async requestPayout(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  // Shipments management
  private async getShipments(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();

    try {
      const searchParams = new URL(req.url).searchParams;
      const status = searchParams.get('status') || 'all';
      const search = searchParams.get('search') || '';

      // Check if vendor_shipments table exists
      let vendorShipmentsExists = false;
      try {
        await pool.execute('SELECT 1 FROM vendor_shipments LIMIT 1');
        vendorShipmentsExists = true;
      } catch {
        // Table doesn't exist yet
      }

      let newShipments: any[] = [];

      if (vendorShipmentsExists) {
        // Query from new vendor_shipments table
        let newShipmentsQuery = `
          SELECT
            vs.shipment_id,
            vs.shipment_number,
            vs.order_id,
            o.order_number,
            vs.status,
            vs.origin_country,
            vs.origin_city,
            vs.origin_warehouse,
            vs.destination_country,
            vs.destination_address,
            vs.total_weight,
            vs.total_packages,
            vs.dimensions,
            vs.ship_date,
            vs.estimated_delivery,
            vs.actual_delivery,
            vs.shipping_cost,
            vs.vendor_notes,
            vs.created_at,
            CONCAT(u.first_name, ' ', u.last_name) as customer_name,
            'new' as source
          FROM vendor_shipments vs
          JOIN orders o ON vs.order_id = o.order_id
          JOIN users u ON o.user_id = u.user_id
          WHERE vs.vendor_id = ?
        `;

        const newParams: any[] = [vendorId];

        if (status !== 'all') {
          newShipmentsQuery += ' AND vs.status = ?';
          newParams.push(status);
        }

        if (search) {
          newShipmentsQuery += ' AND (vs.shipment_number LIKE ? OR o.order_number LIKE ?)';
          newParams.push(`%${search}%`, `%${search}%`);
        }

        const [result] = await pool.execute(newShipmentsQuery, newParams);
        newShipments = result as any[];
      }

      // Query shipped/delivered orders that don't have entries in vendor_shipments yet
      // Left join order_fulfillment to get tracking info if available
      let legacyQuery = `
        SELECT
          COALESCE(ofl.fulfillment_id, o.order_id) as shipment_id,
          CONCAT('SHIP-', o.order_id) as shipment_number,
          o.order_id,
          o.order_number,
          CASE
            WHEN o.status = 'delivered' THEN 'delivered'
            WHEN o.status = 'shipped' THEN 'in_transit'
            ELSE 'preparing'
          END as status,
          'China' as origin_country,
          NULL as origin_city,
          NULL as origin_warehouse,
          'United States' as destination_country,
          CONCAT(usa.address_line_1, ', ', usa.city, ', ', usa.state_province, ' ', usa.postal_code) as destination_address,
          NULL as total_weight,
          1 as total_packages,
          NULL as dimensions,
          COALESCE(ofl.created_at, o.updated_at) as ship_date,
          ofl.estimated_delivery,
          CASE WHEN o.status = 'delivered' THEN COALESCE(ofl.updated_at, o.updated_at) ELSE NULL END as actual_delivery,
          0 as shipping_cost,
          ofl.fulfillment_notes as vendor_notes,
          COALESCE(ofl.created_at, o.updated_at) as created_at,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          'legacy' as source
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_fulfillment ofl ON o.order_id = ofl.order_id
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        WHERE oi.vendor_id = ?
          AND o.status IN ('shipped', 'delivered')
      `;

      const legacyParams: any[] = [vendorId];

      // Exclude orders already in vendor_shipments (if table exists)
      if (vendorShipmentsExists) {
        legacyQuery += `
          AND NOT EXISTS (
            SELECT 1 FROM vendor_shipments vs2
            WHERE vs2.order_id = o.order_id AND vs2.vendor_id = ?
          )
        `;
        legacyParams.push(vendorId);
      }

      if (status !== 'all') {
        const statusMap: Record<string, string[]> = {
          'in_transit': ['shipped'],
          'delivered': ['delivered'],
          'preparing': [],
          'customs': [],
          'delayed': [],
          'failed': []
        };
        if (statusMap[status] && statusMap[status].length > 0) {
          legacyQuery += ` AND o.status IN (${statusMap[status].map(() => '?').join(',')})`;
          legacyParams.push(...statusMap[status]);
        } else if (status !== 'in_transit' && status !== 'delivered') {
          // For other statuses, no legacy orders would match
          legacyQuery += ' AND 1=0';
        }
      }

      if (search) {
        legacyQuery += ' AND o.order_number LIKE ?';
        legacyParams.push(`%${search}%`);
      }

      legacyQuery += ' GROUP BY o.order_id';

      const [legacyShipments] = await pool.execute(legacyQuery, legacyParams);

      // Combine and sort by created_at DESC
      const allShipments = [...newShipments, ...(legacyShipments as any[])];
      allShipments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        shipments: allShipments,
        total: allShipments.length
      };
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw new ApiError('Failed to fetch shipments', 500);
    }
  }

  private async getShipment(id: string, user: any) {
    const shipmentId = parseInt(id);
    if (isNaN(shipmentId)) {
      throw new ApiError('Invalid shipment ID', 400);
    }

    const vendorId = await this.getVendorId(user);
    const pool = await getPool();

    try {
      const [shipments] = await pool.execute(`
        SELECT
          vs.shipment_id,
          vs.shipment_number,
          vs.order_id,
          o.order_number,
          vs.status,
          vs.origin_country,
          vs.origin_city,
          vs.origin_warehouse,
          vs.destination_country,
          vs.destination_address,
          vs.total_weight,
          vs.total_packages,
          vs.dimensions,
          vs.ship_date,
          vs.estimated_delivery,
          vs.actual_delivery,
          vs.shipping_cost,
          vs.vendor_notes,
          vs.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM vendor_shipments vs
        JOIN orders o ON vs.order_id = o.order_id
        JOIN users u ON o.user_id = u.user_id
        WHERE vs.shipment_id = ? AND vs.vendor_id = ?
      `, [shipmentId, vendorId]);

      if ((shipments as any[]).length === 0) {
        throw new ApiError('Shipment not found', 404);
      }

      return (shipments as any[])[0];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching shipment:', error);
      throw new ApiError('Failed to fetch shipment', 500);
    }
  }

  private async updateShipment(id: string, req: NextRequest, user: any) {
    const shipmentId = parseInt(id);
    if (isNaN(shipmentId)) {
      throw new ApiError('Invalid shipment ID', 400);
    }

    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Verify shipment belongs to vendor
      const [shipments] = await conn.execute(`
        SELECT vs.shipment_id, vs.order_id, vs.status
        FROM vendor_shipments vs
        WHERE vs.shipment_id = ? AND vs.vendor_id = ?
      `, [shipmentId, vendorId]);

      if ((shipments as any[]).length === 0) {
        throw new ApiError('Shipment not found', 404);
      }

      const shipment = (shipments as any[])[0];

      // Build update query for vendor_shipments
      const updates: string[] = [];
      const values: any[] = [];

      if (body.status) {
        updates.push('status = ?');
        values.push(body.status);

        // Also update order status based on shipment status
        const orderStatusMap: Record<string, string> = {
          'preparing': 'processing',
          'in_transit': 'shipped',
          'customs': 'shipped',
          'delivered': 'delivered',
          'delayed': 'shipped',
          'failed': 'cancelled'
        };

        if (orderStatusMap[body.status]) {
          await conn.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
            [orderStatusMap[body.status], shipment.order_id]
          );
        }
      }

      if (body.origin_city) {
        updates.push('origin_city = ?');
        values.push(body.origin_city);
      }

      if (body.origin_warehouse) {
        updates.push('origin_warehouse = ?');
        values.push(body.origin_warehouse);
      }

      if (body.total_weight) {
        updates.push('total_weight = ?');
        values.push(body.total_weight);
      }

      if (body.total_packages) {
        updates.push('total_packages = ?');
        values.push(body.total_packages);
      }

      if (body.estimated_delivery) {
        updates.push('estimated_delivery = ?');
        values.push(body.estimated_delivery);
      }

      if (body.actual_delivery) {
        updates.push('actual_delivery = ?');
        values.push(body.actual_delivery);
      }

      if (body.shipping_cost !== undefined) {
        updates.push('shipping_cost = ?');
        values.push(body.shipping_cost);
      }

      if (body.vendor_notes !== undefined) {
        updates.push('vendor_notes = ?');
        values.push(body.vendor_notes);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(shipmentId);

        await conn.execute(
          `UPDATE vendor_shipments SET ${updates.join(', ')} WHERE shipment_id = ?`,
          values
        );
      }

      await conn.commit();

      return {
        success: true,
        message: 'Shipment updated successfully'
      };
    } catch (error) {
      await conn.rollback();
      if (error instanceof ApiError) throw error;
      console.error('Error updating shipment:', error);
      throw new ApiError('Failed to update shipment', 500);
    } finally {
      conn.release();
    }
  }

  /**
   * Create a new shipment for an order (China → US multi-carrier support)
   */
  private async createShipment(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const {
        orderId,
        originCity,
        originWarehouse,
        destinationAddress,
        totalWeight,
        totalPackages,
        dimensions,
        shipDate,
        estimatedDelivery,
        shippingCost,
        vendorNotes,
        // Initial leg info (optional - can add legs later)
        initialLeg
      } = body;

      if (!orderId) {
        throw new ApiError('Order ID is required', 400);
      }

      // Verify vendor has items in this order
      const [orderCheck] = await conn.execute(`
        SELECT DISTINCT o.order_id, o.order_number, o.status,
          CONCAT(usa.address_line_1, ', ', usa.city, ', ', usa.state_province, ' ', usa.postal_code) as shipping_address
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        WHERE o.order_id = ? AND oi.vendor_id = ?
      `, [orderId, vendorId]) as any[];

      if (orderCheck.length === 0) {
        throw new ApiError('Order not found or you do not have access', 404);
      }

      const order = orderCheck[0];

      // Check if shipment already exists for this order
      const [existingShipment] = await conn.execute(
        'SELECT shipment_id FROM vendor_shipments WHERE order_id = ?',
        [orderId]
      ) as any[];

      if (existingShipment.length > 0) {
        throw new ApiError('A shipment already exists for this order', 400);
      }

      // Generate shipment number
      const shipmentNumber = `SHIP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create the shipment
      const [shipmentResult] = await conn.execute(`
        INSERT INTO vendor_shipments (
          order_id, vendor_id, shipment_number, status,
          origin_country, origin_city, origin_warehouse,
          destination_country, destination_address,
          total_weight, total_packages, dimensions,
          ship_date, estimated_delivery, shipping_cost,
          vendor_notes, created_at, updated_at
        ) VALUES (?, ?, ?, 'preparing', 'China', ?, ?, 'United States', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        orderId,
        vendorId,
        shipmentNumber,
        originCity || null,
        originWarehouse || null,
        destinationAddress || order.shipping_address,
        totalWeight || null,
        totalPackages || 1,
        dimensions || null,
        shipDate || null,
        estimatedDelivery || null,
        shippingCost || 0,
        vendorNotes || null
      ]) as any;

      const shipmentId = shipmentResult.insertId;

      // Add initial tracking event
      await conn.execute(`
        INSERT INTO shipment_events (shipment_id, event_type, event_description, location, created_by)
        VALUES (?, 'created', 'Shipment created', ?, ?)
      `, [shipmentId, originCity || 'China', user.userId]);

      // Add initial leg if provided
      if (initialLeg) {
        await conn.execute(`
          INSERT INTO shipment_legs (
            shipment_id, leg_order, carrier_name, carrier_type,
            tracking_number, origin_location, destination_location, status
          ) VALUES (?, 1, ?, ?, ?, ?, ?, 'pending')
        `, [
          shipmentId,
          initialLeg.carrierName,
          initialLeg.carrierType || 'domestic_origin',
          initialLeg.trackingNumber || null,
          initialLeg.originLocation || originCity || 'China',
          initialLeg.destinationLocation || null
        ]);
      }

      // Update order status to processing
      await conn.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        ['processing', orderId]
      );

      await conn.commit();

      return {
        success: true,
        shipmentId,
        shipmentNumber,
        message: 'Shipment created successfully'
      };
    } catch (error) {
      await conn.rollback();
      if (error instanceof ApiError) throw error;
      console.error('Error creating shipment:', error);
      throw new ApiError('Failed to create shipment', 500);
    } finally {
      conn.release();
    }
  }

  /**
   * Add a leg to an existing shipment (for multi-carrier shipping)
   */
  private async addShipmentLeg(shipmentId: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    const pool = await getPool();

    // Verify shipment belongs to vendor
    const [shipments] = await pool.execute(`
      SELECT shipment_id FROM vendor_shipments WHERE shipment_id = ? AND vendor_id = ?
    `, [shipmentId, vendorId]) as any[];

    if (shipments.length === 0) {
      throw new ApiError('Shipment not found', 404);
    }

    // Get the next leg order
    const [maxLeg] = await pool.execute(`
      SELECT MAX(leg_order) as max_order FROM shipment_legs WHERE shipment_id = ?
    `, [shipmentId]) as any[];

    const nextOrder = (maxLeg[0]?.max_order || 0) + 1;

    const {
      carrierName,
      carrierType,
      trackingNumber,
      trackingUrl,
      originLocation,
      destinationLocation,
      pickupDate,
      estimatedArrival,
      legCost,
      notes
    } = body;

    if (!carrierName || !carrierType) {
      throw new ApiError('Carrier name and type are required', 400);
    }

    const [result] = await pool.execute(`
      INSERT INTO shipment_legs (
        shipment_id, leg_order, carrier_name, carrier_type,
        tracking_number, tracking_url, origin_location, destination_location,
        pickup_date, estimated_arrival, leg_cost, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      shipmentId,
      nextOrder,
      carrierName,
      carrierType,
      trackingNumber || null,
      trackingUrl || null,
      originLocation || null,
      destinationLocation || null,
      pickupDate || null,
      estimatedArrival || null,
      legCost || 0,
      notes || null
    ]) as any;

    return {
      success: true,
      legId: result.insertId,
      legOrder: nextOrder,
      message: 'Shipment leg added successfully'
    };
  }

  /**
   * Add a tracking event to a shipment
   */
  private async addShipmentEvent(shipmentId: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    const pool = await getPool();

    // Verify shipment belongs to vendor
    const [shipments] = await pool.execute(`
      SELECT shipment_id, status FROM vendor_shipments WHERE shipment_id = ? AND vendor_id = ?
    `, [shipmentId, vendorId]) as any[];

    if (shipments.length === 0) {
      throw new ApiError('Shipment not found', 404);
    }

    const {
      eventType,
      eventDescription,
      location,
      legId,
      eventTime
    } = body;

    if (!eventType || !eventDescription) {
      throw new ApiError('Event type and description are required', 400);
    }

    const validEventTypes = [
      'created', 'picked_up', 'departed', 'arrived', 'in_customs',
      'customs_cleared', 'out_for_delivery', 'delivered', 'delayed', 'exception', 'returned'
    ];

    if (!validEventTypes.includes(eventType)) {
      throw new ApiError(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`, 400);
    }

    const [result] = await pool.execute(`
      INSERT INTO shipment_events (
        shipment_id, leg_id, event_type, event_description, location, event_time, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      shipmentId,
      legId || null,
      eventType,
      eventDescription,
      location || null,
      eventTime || new Date(),
      user.userId
    ]) as any;

    // Update shipment status based on event
    const statusMap: Record<string, string> = {
      'picked_up': 'in_transit',
      'departed': 'in_transit',
      'in_customs': 'customs',
      'customs_cleared': 'in_transit',
      'delivered': 'delivered',
      'delayed': 'delayed',
      'exception': 'delayed'
    };

    if (statusMap[eventType]) {
      await pool.execute(
        'UPDATE vendor_shipments SET status = ?, updated_at = NOW() WHERE shipment_id = ?',
        [statusMap[eventType], shipmentId]
      );

      // Also update order status if delivered
      if (eventType === 'delivered') {
        await pool.execute(`
          UPDATE orders SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
          WHERE order_id = (SELECT order_id FROM vendor_shipments WHERE shipment_id = ?)
        `, [shipmentId]);
      }
    }

    // Update leg status if legId provided
    if (legId) {
      const legStatusMap: Record<string, string> = {
        'picked_up': 'picked_up',
        'departed': 'in_transit',
        'arrived': 'arrived',
        'delivered': 'delivered'
      };

      if (legStatusMap[eventType]) {
        await pool.execute(
          'UPDATE shipment_legs SET status = ?, updated_at = NOW() WHERE leg_id = ?',
          [legStatusMap[eventType], legId]
        );
      }
    }

    return {
      success: true,
      eventId: result.insertId,
      message: 'Event added successfully'
    };
  }

  /**
   * Get all legs for a shipment
   */
  private async getShipmentLegs(shipmentId: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();

    // Verify shipment belongs to vendor
    const [shipments] = await pool.execute(`
      SELECT shipment_id FROM vendor_shipments WHERE shipment_id = ? AND vendor_id = ?
    `, [shipmentId, vendorId]) as any[];

    if (shipments.length === 0) {
      throw new ApiError('Shipment not found', 404);
    }

    const [legs] = await pool.execute(`
      SELECT
        leg_id, leg_order, carrier_name, carrier_type,
        tracking_number, tracking_url, status,
        origin_location, destination_location,
        pickup_date, estimated_arrival, actual_arrival,
        leg_cost, notes, created_at
      FROM shipment_legs
      WHERE shipment_id = ?
      ORDER BY leg_order ASC
    `, [shipmentId]);

    return {
      legs,
      total: (legs as any[]).length
    };
  }

  /**
   * Get tracking events for a shipment
   */
  private async getShipmentEvents(shipmentId: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();

    // Verify shipment belongs to vendor
    const [shipments] = await pool.execute(`
      SELECT shipment_id FROM vendor_shipments WHERE shipment_id = ? AND vendor_id = ?
    `, [shipmentId, vendorId]) as any[];

    if (shipments.length === 0) {
      throw new ApiError('Shipment not found', 404);
    }

    const [events] = await pool.execute(`
      SELECT
        se.event_id, se.event_type, se.event_description,
        se.location, se.event_time,
        sl.carrier_name, sl.leg_order
      FROM shipment_events se
      LEFT JOIN shipment_legs sl ON se.leg_id = sl.leg_id
      WHERE se.shipment_id = ?
      ORDER BY se.event_time DESC
    `, [shipmentId]);

    return {
      events,
      total: (events as any[]).length
    };
  }

  /**
   * Get available shipping carriers
   */
  private async getShippingCarriers(req: NextRequest) {
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const carrierType = searchParams.get('type');

    let query = 'SELECT * FROM shipping_carriers WHERE is_active = 1';
    const params: any[] = [];

    if (carrierType) {
      query += ' AND carrier_type = ?';
      params.push(carrierType);
    }

    query += ' ORDER BY carrier_type, carrier_name';

    const [carriers] = await pool.execute(query, params);

    // Group by type for easier frontend usage
    const grouped: Record<string, any[]> = {
      domestic_china: [],
      international: [],
      domestic_us: [],
      multi: []
    };

    for (const carrier of carriers as any[]) {
      if (grouped[carrier.carrier_type]) {
        grouped[carrier.carrier_type].push(carrier);
      }
    }

    return {
      carriers,
      grouped,
      total: (carriers as any[]).length
    };
  }

  /**
   * Get order details for creating a shipment
   */
  private async getShippableOrder(orderId: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();

    const [orders] = await pool.execute(`
      SELECT DISTINCT
        o.order_id, o.order_number, o.status, o.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email, u.phone as customer_phone,
        usa.address_line_1, usa.address_line_2, usa.city,
        usa.state_province, usa.postal_code, usa.country
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE o.order_id = ? AND oi.vendor_id = ?
    `, [orderId, vendorId]) as any[];

    if (orders.length === 0) {
      throw new ApiError('Order not found', 404);
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.execute(`
      SELECT
        oi.order_item_id, oi.quantity, oi.unit_price,
        p.name as product_name, p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ? AND oi.vendor_id = ?
    `, [orderId, vendorId]);

    // Check if shipment already exists
    const [existingShipment] = await pool.execute(`
      SELECT shipment_id, shipment_number, status FROM vendor_shipments WHERE order_id = ?
    `, [orderId]) as any[];

    return {
      order: {
        ...order,
        fullAddress: [
          order.address_line_1,
          order.address_line_2,
          `${order.city}, ${order.state_province} ${order.postal_code}`,
          order.country
        ].filter(Boolean).join(', ')
      },
      items,
      existingShipment: existingShipment.length > 0 ? existingShipment[0] : null,
      canCreateShipment: existingShipment.length === 0 && ['pending', 'processing'].includes(order.status)
    };
  }

  private async getStorefront(user: any) {
    const vendorId = await this.getVendorId(user);
    const vendor = await this.vendorService.getVendorWithStats(vendorId);
    
    if (!vendor) {
      throw new ApiError('Vendor not found', 404);
    }

    // Get featured products
    const { products } = await this.vendorService.getVendorProducts(vendorId, {
      isActive: true,
      limit: 12,
      sortBy: 'sales',
      sortOrder: 'DESC'
    });

    return {
      vendor: {
        vendor_id: vendor.user_id,
        business_name: vendor.business_name,
        description: vendor.business_description,
        logo_url: vendor.logo_url,
        website_url: vendor.website_url,
        rating: vendor.average_rating || 0,
        total_reviews: vendor.total_reviews || 0,
        total_products: vendor.total_products || 0,
        is_verified: vendor.is_verified
      },
      featured_products: products,
      categories: [], // TODO: Implement vendor categories
      stats: {
        total_sales: vendor.total_sales || 0,
        active_products: vendor.active_products || 0,
        satisfaction_rate: vendor.average_rating ? (vendor.average_rating / 5 * 100) : 0
      }
    };
  }

  /**
   * Get vendor ID for the current user
   */
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');
    
    // Get vendor ID from vendor_info table
    const [vendor] = await this.vendorService.raw(
      'SELECT user_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendor) {
      throw new ApiError('Vendor account not found', 404);
    }

    return vendor.user_id;
  }

  /**
   * Handle file uploads for vendor products
   */
  private async uploadFile(req: NextRequest, user: any) {
    try {
      const formData = await req.formData();
      const file = await FileUploadService.extractFileFromFormData(formData);
      const type = (formData.get('type') as string) || 'products';

      // Validate upload type
      const validTypes = ['products', 'fabric'];
      const uploadType = validTypes.includes(type) ? type as 'products' | 'fabric' : 'products';

      const result = await FileUploadService.uploadFile(file, {
        type: uploadType,
        userId: user.userId.toString()
      });

      // Return the response in the format expected by the frontend
      return {
        success: true,
        uploaded: [{
          secureUrl: result.url,
          url: result.url,
          filename: result.filename,
          size: result.size,
          type: result.type
        }]
      };
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Failed to upload file', 500);
    }
  }

  /**
   * Validate vendor access for a user ID
   * This is used internally by other services to check vendor permissions
   */
  private async validateVendorAccess(userId: string) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    const [rows] = await this.vendorService.raw(
      `SELECT user_id, approval_status, is_approved, is_verified
       FROM vendor_info
       WHERE user_id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return {
        isValid: false,
        error: 'No vendor account found for this user'
      };
    }

    const vendor = rows[0] as any;

    if (!vendor.is_approved) {
      return {
        isValid: false,
        error: 'Vendor account is not approved'
      };
    }

    if (vendor.approval_status !== 'approved') {
      return {
        isValid: false,
        error: 'Vendor account approval status is not approved'
      };
    }

    return {
      isValid: true,
      vendorId: vendor.user_id
    };
  }

  /**
   * Store file metadata in the database
   * This endpoint is used by the vendorFileManager to store file information
   */
  private async storeFileMetadata(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getRequestBody(req);

    // Validate required fields
    const requiredFields = ['fileId', 'originalName', 'category', 'uploadType', 'fileSize', 'fileFormat', 'fileHash', 'filePath'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ApiError(`Missing required field: ${field}`, 400);
      }
    }

    // Store file metadata
    await this.vendorService.raw(
      `INSERT INTO vendor_files (
        vendor_id, file_id, original_name, category, upload_type,
        file_size, file_format, file_hash, file_path,
        width, height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.fileId,
        data.originalName,
        data.category,
        data.uploadType,
        data.fileSize,
        data.fileFormat,
        data.fileHash,
        data.filePath,
        data.dimensions?.width || null,
        data.dimensions?.height || null
      ]
    );

    return {
      success: true,
      message: 'File metadata stored successfully',
      fileId: data.fileId
    };
  }

  /**
   * Get all files for the vendor
   */
  private async getFiles(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const category = searchParams.get('category');
    
    let query = `
      SELECT vf.file_id, vf.original_name, vf.category, vf.file_hash,
             vf.file_size, vf.width, vf.height, vf.created_at,
             vf.upload_type, vf.file_format
      FROM vendor_files vf
      WHERE vf.vendor_id = ? AND vf.deleted_at IS NULL
    `;
    const params = [vendorId];

    if (category) {
      query += ' AND vf.category = ?';
      params.push(category);
    }

    query += ' ORDER BY vf.category, vf.created_at DESC';

    const [rows] = await this.vendorService.raw(query, params);
    const files = rows as any[];

    const filesByCategory = new Map<string, any[]>();

    for (const file of files) {
      const existingFile = {
        fileId: file.file_id,
        originalName: file.original_name,
        category: file.category,
        fileHash: file.file_hash,
        uploadDate: file.created_at,
        fileSize: file.file_size,
        dimensions: file.width && file.height ? { width: file.width, height: file.height } : undefined,
        url: this.generateFileUrl(vendorId, file.file_id, file.category, file.original_name)
      };

      if (!filesByCategory.has(file.category)) {
        filesByCategory.set(file.category, []);
      }
      filesByCategory.get(file.category)!.push(existingFile);
    }

    return {
      success: true,
      files: Object.fromEntries(filesByCategory),
      total: files.length
    };
  }

  /**
   * Get file upload statistics
   */
  private async getFileStats(user: any) {
    const vendorId = await this.getVendorId(user);
    
    const [rows] = await this.vendorService.raw(`
      SELECT category, upload_type, COUNT(*) as file_count, SUM(file_size) as total_size
      FROM vendor_files
      WHERE vendor_id = ? AND deleted_at IS NULL
      GROUP BY category, upload_type
    `, [vendorId]);

    const stats = rows as any[];
    const filesByCategory = new Map<string, number>();
    const storageByCategory = new Map<string, number>();
    let totalFiles = 0;
    let totalStorage = 0;

    for (const stat of stats) {
      filesByCategory.set(stat.category, stat.file_count);
      storageByCategory.set(stat.category, stat.total_size);
      totalFiles += stat.file_count;
      totalStorage += stat.total_size;
    }

    // Define limits per category
    const maxFilesPerCategory = new Map([
      ['productImages', 10],
      ['productVideos', 3],
      ['csvFiles', 5]
    ]);

    const remainingQuota = new Map<string, number>();
    for (const [category, limit] of maxFilesPerCategory) {
      const used = filesByCategory.get(category) || 0;
      remainingQuota.set(category, Math.max(0, limit - used));
    }

    return {
      success: true,
      totalFiles,
      filesByCategory: Object.fromEntries(filesByCategory),
      totalStorage,
      storageByCategory: Object.fromEntries(storageByCategory),
      limits: {
        maxFilesPerCategory: Object.fromEntries(maxFilesPerCategory),
        remainingQuota: Object.fromEntries(remainingQuota)
      }
    };
  }

  /**
   * Get a specific file
   */
  private async getFile(fileId: string, user: any) {
    const vendorId = await this.getVendorId(user);
    
    const [rows] = await this.vendorService.raw(`
      SELECT file_id, original_name, category, file_hash,
             file_size, width, height, created_at,
             upload_type, file_format
      FROM vendor_files
      WHERE vendor_id = ? AND file_id = ? AND deleted_at IS NULL
    `, [vendorId, fileId]);

    if (rows.length === 0) {
      throw new ApiError('File not found', 404);
    }

    const file = rows[0];
    
    return {
      success: true,
      file: {
        fileId: file.file_id,
        originalName: file.original_name,
        category: file.category,
        fileHash: file.file_hash,
        uploadDate: file.created_at,
        fileSize: file.file_size,
        dimensions: file.width && file.height ? { width: file.width, height: file.height } : undefined,
        url: this.generateFileUrl(vendorId, file.file_id, file.category, file.original_name)
      }
    };
  }

  /**
   * Check if file is duplicate
   */
  private async checkFileDuplicate(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getRequestBody(req);
    
    if (!data.fileHash || !data.category) {
      throw new ApiError('Missing required fields: fileHash, category', 400);
    }

    const [rows] = await this.vendorService.raw(`
      SELECT file_id, original_name 
      FROM vendor_files 
      WHERE vendor_id = ? AND category = ? AND file_hash = ? AND deleted_at IS NULL
      LIMIT 1
    `, [vendorId, data.category, data.fileHash]);

    const duplicateFiles = rows as any[];

    if (duplicateFiles.length > 0) {
      return {
        success: true,
        isDuplicate: true,
        existingFileId: duplicateFiles[0].file_id,
        existingFileName: duplicateFiles[0].original_name
      };
    }

    return {
      success: true,
      isDuplicate: false
    };
  }

  /**
   * Delete a file
   */
  private async deleteFile(fileId: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();
    
    // Get file info
    const [rows] = await pool.execute(`
      SELECT file_path, category FROM vendor_files 
      WHERE vendor_id = ? AND file_id = ? AND deleted_at IS NULL
    `, [vendorId, fileId]);

    const files = rows as any[];
    if (files.length === 0) {
      throw new ApiError('File not found', 404);
    }

    // Mark as deleted in database (soft delete)
    await pool.execute(`
      UPDATE vendor_files 
      SET deleted_at = NOW(), deleted_by = ?
      WHERE file_id = ?
    `, [vendorId, fileId]);

    return {
      success: true,
      message: 'File deleted successfully',
      fileId: fileId
    };
  }

  /**
   * Generate file URL helper
   */
  private generateFileUrl(vendorId: number, fileId: string, category: string, originalName: string): string {
    const vendorName = `vendor_${vendorId}`; // Simplified for now
    const path = require('path');
    return `/uploads/${vendorName}/${category}/${fileId}${path.extname(originalName)}`;
  }

  // Product Approvals
  private async getProductApprovals(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const status = searchParams.get('status') || 'PENDING';

    try {
      const pool = await getPool();
      const query = `
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
        WHERE par.status = ? AND par.vendor_id = ?
        ORDER BY par.created_at DESC
      `;

      const [requests] = await pool.execute(query, [status, vendorId]) as any[];

      return {
        success: true,
        data: requests
      };
    } catch (error) {
      console.error('Error fetching product approvals:', error);
      throw new ApiError('Failed to fetch product approvals', 500);
    }
  }

  private async getProductApproval(id: string, user: any) {
    const vendorId = await this.getVendorId(user);

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
        WHERE par.id = ? AND par.vendor_id = ?`,
        [parseInt(id), vendorId]
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
        user.userId || user.user_id || 'vendor'
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
        user.userId || user.user_id || 'vendor',
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
}