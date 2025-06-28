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
      'info': () => this.getVendorInfo(req, user),
      'products': () => this.getProducts(req, user),
      'products/:id': () => this.getProduct(action[1], user),
      'products/bulk/jobs': () => this.getBulkJobs(user),
      'products/bulk/stats': () => this.getBulkStats(user),
      'products/bulk/template': () => this.getBulkTemplate(),
      'products/bulk/export': () => this.exportProducts(req, user),
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
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ? AND is_active = 1 ORDER BY vendor_info_id ASC LIMIT 1',
      [user.userId]
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

  private async getVendorInfo(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      throw new ApiError('user_id parameter is required', 400);
    }

    // Admin can check any vendor info
    if (user.role === 'admin') {
      const [vendorInfo] = await this.vendorService.raw(
        'SELECT vendor_info_id, user_id, business_name FROM vendor_info WHERE user_id = ?',
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
    console.log('[VendorsHandler.getProducts] Called with user:', user.userId);
    
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    console.log('[VendorsHandler.getProducts] Query params:', {
      vendorId,
      page,
      limit,
      offset,
      active: searchParams.get('active'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    });

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

    console.log('[VendorsHandler.getProducts] Results:', {
      productsCount: products.length,
      total,
      firstProduct: products[0]?.name || 'No products'
    });

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
      `INSERT INTO vendor_products (vendor_id, product_id, vendor_price, quantity_available)
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
      'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
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
         WHERE vendor_id = ? AND product_id = ?`,
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
    // Check if order is assigned to this vendor OR if vendor has products in the order
    const [hasItems] = await this.vendorService.raw(
      `SELECT 1 FROM orders o 
       WHERE o.order_id = ? 
       AND (o.vendor_id = ? OR EXISTS (
         SELECT 1 FROM order_items oi 
         JOIN vendor_products vp ON oi.product_id = vp.product_id 
         WHERE oi.order_id = o.order_id AND vp.vendor_id = ?
       ))`,
      [orderId, vendorId, vendorId]
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

    // TODO: Implement vendor-specific order status tracking
    // In a multi-vendor system, each vendor should be able to update the status of their items
    // This would require a vendor_order_status table or similar

    return { message: 'Order status updated successfully' };
  }

  // Discounts and coupons
  private async getDiscounts(user: any) {
    console.log('[VendorsHandler.getDiscounts] Called with user:', user.userId);
    
    const vendorId = await this.getVendorId(user);
    const { discounts } = await this.vendorService.getVendorDiscounts(vendorId);
    
    console.log('[VendorsHandler.getDiscounts] Results:', {
      vendorId,
      discountsCount: discounts?.length || 0,
      firstDiscount: discounts?.[0]?.discount_name || 'No discounts'
    });
    
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
        vendor_id, coupon_code, coupon_name, description, discount_type, discount_value,
        minimum_order_value, usage_limit_total, usage_limit_per_customer,
        valid_from, valid_until, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.code,
        data.code, // Use code as name if no name provided
        data.description,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.usageLimit,
        data.perCustomerLimit || 1,
        data.startDate || new Date(),
        data.endDate || null,
        data.isActive,
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
        vendor_id: vendor.vendor_info_id,
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
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );
    
    if (!vendor) {
      throw new ApiError('Vendor account not found', 404);
    }
    
    return vendor.vendor_info_id;
  }
}