/**
 * Vendors Handler for V2 API
 * Handles vendor dashboard, products, orders, and analytics
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { vendorService, productService, orderService } from '@/lib/services/singletons';
import { z } from 'zod';

// Validation schemas
const UpdateVendorSchema = z.object({
  businessName: z.string().min(1).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
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
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchase: z.number().min(0).optional(),
  usageLimit: z.number().positive().optional(),
  perCustomerLimit: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
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
      'products': () => this.getProducts(req, user),
      'products/:id': () => this.getProduct(action[1], user),
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
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products': () => this.createProduct(req, user),
      'products/bulk': () => this.bulkUpdateProducts(req, user),
      'discounts': () => this.createDiscount(req, user),
      'coupons': () => this.createCoupon(req, user),
      'sales-team': () => this.addSalesRep(req, user),
      'payouts/request': () => this.requestPayout(req, user),
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
    };

    return this.routeAction(action, routes);
  }

  // Helper to get vendor ID
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');
    
    const [vendor] = await this.vendorService.raw(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.user_id]
    );

    if (!vendor) {
      throw new ApiError('Vendor profile not found', 404);
    }

    return vendor.vendor_info_id;
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

  private async updateProfile(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, UpdateVendorSchema);

    await this.vendorService.update(vendorId, {
      business_name: data.businessName,
      description: data.description,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
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

    return this.buildPaginatedResponse(products, total, page, limit);
  }

  private async getProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Verify vendor owns the product
    const [ownership] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_products WHERE vendor_info_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownership) {
      throw new ApiError('Product not found', 404);
    }

    return this.productService.getProductWithDetails(productId, undefined, vendorId);
  }

  private async createProduct(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateProductSchema);

    // Create product
    const product = await this.productService.create({
      name: data.name,
      sku: data.sku,
      description: data.description,
      category_id: data.categoryId,
      base_price: data.basePrice,
      is_active: data.isActive,
    });

    if (!product) {
      throw new ApiError('Failed to create product', 500);
    }

    // Add vendor relationship
    await this.vendorService.raw(
      `INSERT INTO vendor_products (vendor_info_id, product_id, vendor_price, quantity_available)
       VALUES (?, ?, ?, ?)`,
      [vendorId, product.product_id, data.vendorPrice, data.quantity]
    );

    return product;
  }

  private async updateProduct(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Verify ownership
    const [ownership] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_products WHERE vendor_info_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownership) {
      throw new ApiError('Product not found', 404);
    }

    const data = await this.getValidatedBody(req, CreateProductSchema.partial());

    // Update product
    if (data.name || data.description || data.categoryId || data.basePrice !== undefined) {
      await this.productService.update(productId, {
        name: data.name,
        description: data.description,
        category_id: data.categoryId,
        base_price: data.basePrice,
        is_active: data.isActive,
        updated_at: new Date(),
      });
    }

    // Update vendor specific data
    if (data.vendorPrice !== undefined || data.quantity !== undefined) {
      await this.vendorService.raw(
        `UPDATE vendor_products 
         SET vendor_price = COALESCE(?, vendor_price),
             quantity_available = COALESCE(?, quantity_available)
         WHERE vendor_info_id = ? AND product_id = ?`,
        [data.vendorPrice, data.quantity, vendorId, productId]
      );
    }

    return { message: 'Product updated successfully' };
  }

  private async deleteProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Soft delete
    await this.productService.update(productId, {
      is_active: false,
      updated_at: new Date(),
    });

    return { message: 'Product deleted successfully' };
  }

  // Order management
  private async getOrders(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const { orders, total } = await this.orderService.getOrders({
      vendorId,
      status: searchParams.get('status') || undefined,
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
    const [hasItems] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_orders WHERE vendor_info_id = ? AND order_id = ?',
      [vendorId, orderId]
    );

    if (!hasItems) {
      throw new ApiError('Order not found', 404);
    }

    return this.orderService.getOrderWithDetails(orderId);
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

    // Update vendor order status
    await this.vendorService.raw(
      `UPDATE vendor_orders 
       SET status = ?, updated_at = NOW()
       WHERE vendor_info_id = ? AND order_id = ?`,
      [status, vendorId, orderId]
    );

    return { message: 'Order status updated successfully' };
  }

  // Discounts and coupons
  private async getDiscounts(user: any) {
    const vendorId = await this.getVendorId(user);
    const { discounts } = await this.vendorService.getVendorDiscounts(vendorId);
    return discounts;
  }

  private async getCoupons(user: any) {
    const vendorId = await this.getVendorId(user);
    const { coupons } = await this.vendorService.getVendorDiscounts(vendorId);
    return coupons;
  }

  private async createDiscount(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateDiscountSchema);

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_discounts (
        vendor_info_id, name, discount_type, discount_value,
        min_purchase, applies_to, product_ids, category_ids,
        start_date, end_date, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.name,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.appliesTo,
        JSON.stringify(data.productIds || []),
        JSON.stringify(data.categoryIds || []),
        data.startDate,
        data.endDate,
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

    // Check if code already exists
    const [exists] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_coupons WHERE code = ?',
      [data.code]
    );

    if (exists) {
      throw new ApiError('Coupon code already exists', 400);
    }

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_coupons (
        vendor_info_id, code, description, discount_type, discount_value,
        min_purchase, usage_limit, per_customer_limit,
        start_date, end_date, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.code,
        data.description,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.usageLimit,
        data.perCustomerLimit,
        data.startDate,
        data.endDate,
        data.isActive,
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
    
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : new Date();

    const stats = await this.orderService.getOrderStatistics({
      vendorId,
      dateFrom,
      dateTo,
    });

    return stats;
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
    throw new ApiError('Not implemented', 501);
  }

  private async updateCoupon(id: string, req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async deleteDiscount(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async deleteCoupon(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async bulkUpdateProducts(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getProductAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getRevenueAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getSalesTeam(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async addSalesRep(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async removeSalesRep(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getReviews(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async requestPayout(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  /**
   * Get vendor ID for the current user
   */
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');
    
    // Get vendor ID from vendor_info table
    const [vendor] = await this.vendorService.raw(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );
    
    if (!vendor) {
      throw new ApiError('Vendor account not found', 404);
    }
    
    return vendor.vendor_info_id;
  }
}