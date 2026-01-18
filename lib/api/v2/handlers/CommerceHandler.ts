/**
 * Commerce Handler for V2 API
 * Handles products, cart, checkout, and orders
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import {
  productService,
  cartService,
  orderService,
  categoryService,
  settingsService,
  paymentService,
  pricingService
} from '@/lib/services/singletons';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { parseDecimal } from '@/lib/utils/priceUtils';
import { getCache, setCache } from '@/lib/cache/cacheManager';

// Validation schemas
const AddToCartSchema = z.object({
  productId: z.number().positive(),
  vendorId: z.number().positive(),
  quantity: z.number().positive().default(1),
  configuration: z.record(z.any()).optional(),
});

const UpdateCartSchema = z.object({
  quantity: z.number().min(0),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().positive().default(1),
  configuration: z.record(z.any()).optional(),
});

const ApplyCouponSchema = z.object({
  code: z.string().min(1),
});

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    vendorId: z.number(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    discountAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    configuration: z.any().optional(),
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US'),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US'),
  }),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  couponCodes: z.array(z.string()).optional(),
});

export class CommerceHandler extends BaseHandler {
  private productService = productService;
  private cartService = cartService;
  private orderService = orderService;
  private categoryService = categoryService;

  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'categories': () => this.getCategories(req),
      'products': () => this.getProducts(req),
      'products/:id': () => this.getProduct(action[1]),
      'products/:id/pricing': () => this.getProductPricing(action[1], req, user),
      'products/:id/related': () => this.getRelatedProducts(action[1]),
      'products/search': () => this.searchProducts(req),
      'cart': () => this.getCart(req, user),
      'cart/summary': () => this.getCartSummary(req, user),
      'orders': () => this.getOrders(req, user),
      'orders/:id': () => this.getOrder(action[1], user),
      'order-stats': () => this.getOrderStats(user),
      'quotes': () => this.getQuotes(req, user),
      'quotes/:id': () => this.getQuote(action[1], user),
      'quote-stats': () => this.getQuoteStats(user),
      'payment-methods': () => this.getPaymentMethods(req),
      'payment/paypal/create-order': () => this.getPayPalClientToken(req, user),
      'homepage-popup-coupon': () => this.getHomepagePopupCoupon(),
      'installation/eligible-orders': () => this.getEligibleOrdersForInstallation(user),
      'installation/my-appointments': () => this.getMyInstallationAppointments(user),
      'installation/installers': () => this.getInstallersByZipCode(req),
      'installation/time-slots': () => this.getInstallationTimeSlots(req),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'cart/add': () => this.addToCart(req, user),
      'cart/apply-coupon': () => this.applyCoupon(req, user),
      'cart/clear': () => this.clearCart(user),
      'cart/calculate-pricing': () => this.calculateCartPricing(req, user),
      'orders/create': () => this.createOrder(req, user),
      'orders/create-guest': () => this.createGuestOrder(req),
      'orders/:id/cancel': () => this.cancelOrder(action[1], user),
      'quotes': () => this.createQuote(req, user),
      'quotes/:id/send': () => this.sendQuote(action[1], user),
      'quotes/:id/duplicate': () => this.duplicateQuote(action[1], user),
      'payment/process': () => this.processPayment(req, user),
      'payment/paypal/create-order': () => this.createPayPalOrder(req, user),
      'payment/paypal/capture-order': () => this.capturePayPalPayment(req),
      'payment/capture-paypal': () => this.capturePayPalPayment(req),
      'bulk-uploads': () => this.storeBulkUpload(req, user),
      'installation/book': () => this.bookInstallationAppointment(req, user),
      'installation/appointments/:id/cancel': () => this.cancelInstallationAppointment(action[2], req, user),
      'recommendations': () => this.getRecommendations(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'cart/items/:id': () => this.updateCartItem(action[2], req, user),
      'cart/items/:id/full': () => this.updateCartItemFull(action[2], req, user),
      'installation/appointments/:id/reschedule': () => this.rescheduleInstallationAppointment(action[2], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle DELETE requests
   */
  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'cart/items/:id': () => this.removeCartItem(action[2], user),
    };

    return this.routeAction(action, routes);
  }

  // Category methods
  private async getCategories(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const featured = searchParams.get('featured') === 'true';
    const limit = this.sanitizeNumber(searchParams.get('limit'), 1, 100);

    // Create cache key based on parameters
    const cacheKey = `categories:featured=${featured}:limit=${limit}`;

    // Try to get from cache first
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return { categories: cached };
    }

    // Fetch from database
    const categories = await this.categoryService.getCategories({
      isFeatured: featured || undefined,
      limit: limit || undefined,
    });

    // Cache the result for 5 minutes
    await setCache(cacheKey, categories, 300);

    return { categories };
  }

  // Product methods
  private async getProducts(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const options = {
      categoryId: this.sanitizeNumber(searchParams.get('categoryId')),
      vendorId: this.sanitizeNumber(searchParams.get('vendorId')),
      search: this.sanitizeString(searchParams.get('search')),
      minPrice: this.sanitizeNumber(searchParams.get('minPrice'), 0),
      maxPrice: this.sanitizeNumber(searchParams.get('maxPrice')),
      isActive: true,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      sortBy: searchParams.get('sortBy') as any || 'name',
      sortOrder: searchParams.get('sortOrder') as any || 'ASC',
      limit,
      offset,
      vendorOnly: true,  // Always show only vendor products in public API
    };

    // Create cache key based on query parameters
    const cacheKey = `products:cat=${options.categoryId}:vendor=${options.vendorId}:search=${options.search}:minPrice=${options.minPrice}:maxPrice=${options.maxPrice}:featured=${options.isFeatured}:sortBy=${options.sortBy}:sortOrder=${options.sortOrder}:limit=${limit}:offset=${offset}`;

    // Try to get from cache first
    const cached = await getCache<{ products: any[]; total: number }>(cacheKey);
    if (cached) {
      return this.buildPaginatedResponse(cached.products, cached.total, page, limit);
    }

    // Fetch from database
    const { products, total } = await this.productService.getProducts(options);

    // Cache the result for 5 minutes
    await setCache(cacheKey, { products, total }, 300);

    return this.buildPaginatedResponse(products, total, page, limit);
  }

  private async getProduct(id: string) {
    const productId = parseInt(id);
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    const product = await this.productService.getProductWithDetails(productId);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    // Get additional configuration options for product configurator
    try {
      const configData = await this.productService.executeParallel<{
        dimensions: any[];
        fabricOptions: any[];
        specifications: any[];
        rooms: any[];
        features: any[];
        images: any[];
        pricingMatrix: any[];
        systemTypes: any[];
        pricingFormulas: any[];
        perSquarePricing: any[];
      }>({
        dimensions: {
          query: `SELECT * FROM product_dimensions WHERE product_id = ?`,
          params: [productId]
        },
        fabricOptions: {
          query: `
            SELECT fo.fabric_option_id, fo.product_id, fo.fabric_type, fo.fabric_name, 
                   fo.is_enabled, fo.description, 1 as display_order,
                   fo.texture_url, fo.texture_scale, fo.material_finish, fo.opacity, fo.render_priority,
                   fi.image_url as fabric_image_url
            FROM product_fabric_options fo
            LEFT JOIN product_fabric_images fi ON fo.fabric_option_id = fi.fabric_option_id 
              AND fi.is_primary = 1
            WHERE fo.product_id = ? AND fo.is_enabled = 1
            ORDER BY fo.fabric_type, fo.fabric_name
          `,
          params: [productId]
        },
        specifications: {
          query: `
            SELECT spec_category, spec_value, display_order
            FROM product_specifications 
            WHERE product_id = ? 
            ORDER BY spec_category, display_order
          `,
          params: [productId]
        },
        rooms: {
          query: `
            SELECT room_type 
            FROM product_rooms 
            WHERE product_id = ?
          `,
          params: [productId]
        },
        features: {
          query: `
            SELECT f.*, pf.id as product_feature_id
            FROM product_features pf
            JOIN features f ON pf.feature_id = f.feature_id
            WHERE pf.product_id = ?
            ORDER BY f.display_order
          `,
          params: [productId]
        },
        images: {
          query: `
            SELECT image_id, image_url, alt_text, is_primary, display_order
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, display_order ASC
          `,
          params: [productId]
        },
        pricingFormula: {
          query: `
            SELECT formula_id, pricing_type, fixed_base,
                   width_rate, height_rate, area_rate,
                   min_charge, system_type, fabric_code
            FROM product_pricing_formulas
            WHERE product_id = ? AND is_active = 1
            LIMIT 1
          `,
          params: [productId]
        },
        fabricPricing: {
          query: `
            SELECT fabric_option_id, price_per_sqft
            FROM product_fabric_pricing
            WHERE product_id = ? AND is_active = 1
          `,
          params: [productId]
        },
        pricingMatrix: {
          query: `
            SELECT pm.*, pst.system_name
            FROM product_pricing_matrix pm
            LEFT JOIN product_system_types pst ON pm.product_id = pst.product_id 
              AND pm.system_type = pst.system_type
            WHERE pm.product_id = ? AND pm.is_active = 1
            ORDER BY pm.system_type, pm.fabric_code, pm.width_min, pm.height_min
          `,
          params: [productId]
        },
        systemTypes: {
          query: `
            SELECT system_type, system_name, sort_order, is_default
            FROM product_system_types
            WHERE product_id = ? AND is_active = 1
            ORDER BY sort_order, system_name
          `,
          params: [productId]
        },
        pricingFormulas: {
          query: `
            SELECT *
            FROM product_pricing_formulas
            WHERE product_id = ? AND is_active = 1
          `,
          params: [productId]
        },
        perSquarePricing: {
          query: `
            SELECT *
            FROM product_pricing_per_square
            WHERE product_id = ? AND is_active = 1
            LIMIT 1
          `,
          params: [productId]
        }
      });

      // Process specifications into control types structure
      const controlTypes = {
        liftSystems: [],
        wandSystem: [],
        stringSystem: [],
        remoteControl: [],
        valanceOptions: [],
        bottomRailOptions: []
      };

      if (configData.specifications) {
        configData.specifications.forEach(spec => {
          let item;
          
          // Try to parse spec_value as JSON first
          try {
            const parsed = JSON.parse(spec.spec_value);
            item = {
              name: parsed.name || spec.spec_value,
              enabled: parsed.enabled !== false,
              price_adjustment: parsed.price_adjustment || 0
            };
          } catch (e) {
            // If not JSON, use as plain string
            item = {
              name: spec.spec_value,
              enabled: true,
              price_adjustment: 0
            };
          }

          switch(spec.spec_category) {
            case 'lift_system':
              controlTypes.liftSystems.push(item);
              break;
            case 'wand_system':
              controlTypes.wandSystem.push(item);
              break;
            case 'string_system':
              controlTypes.stringSystem.push(item);
              break;
            case 'remote_control':
              controlTypes.remoteControl.push(item);
              break;
            case 'valance_option':
              controlTypes.valanceOptions.push(item);
              break;
            case 'bottom_rail_option':
              controlTypes.bottomRailOptions.push(item);
              break;
          }
        });
      }

      // Add configuration data to product
      const perSquare = configData.perSquarePricing?.[0];
      
      return {
        ...product,
        dimensions: configData.dimensions?.[0] || null,
        fabricOptions: configData.fabricOptions || [],
        controlTypes,
        rooms: configData.rooms?.map(r => r.room_type) || [],
        features: configData.features || [],
        images: configData.images || [],
        pricingMatrix: configData.pricingMatrix || [],
        fabricPricing: configData.fabricPricing || [],
        systemTypes: configData.systemTypes || [],
        pricingFormulas: configData.pricingFormulas || [],
        // Per-square pricing fields
        pricing_model: perSquare ? 'per_square' : 'grid',
        price_per_square: perSquare?.price_per_square,
        square_unit: perSquare?.square_unit,
        min_squares: perSquare?.min_squares,
        add_on_motor: perSquare?.add_on_motor,
        add_on_no_drill: perSquare?.add_on_no_drill
      };
    } catch (error) {
      console.error('Error loading product configuration:', error);
      // Return product without config data if there's an error
      return product;
    }
  }

  private async getProductPricing(id: string, req: NextRequest, user: any) {
    const productId = parseInt(id);
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    const searchParams = this.getSearchParams(req);
    
    // Get dimensions for custom blinds pricing
    const width = this.sanitizeNumber(searchParams.get('width'), 12, 120);
    const height = this.sanitizeNumber(searchParams.get('height'), 12, 120);
    
    if (!width || !height) {
      throw new ApiError('Width and height are required for pricing calculation', 400);
    }

    // Get optional configuration options
    const colorId = this.sanitizeNumber(searchParams.get('colorId'));
    const materialId = this.sanitizeNumber(searchParams.get('materialId'));
    const mountType = this.sanitizeString(searchParams.get('mountType'));
    const controlType = this.sanitizeString(searchParams.get('controlType'));
    const headrailId = this.sanitizeNumber(searchParams.get('headrailId'));
    const bottomRailId = this.sanitizeNumber(searchParams.get('bottomRailId'));

    // Use new pricing service for formula-based pricing
    const priceBreakdown = await pricingService.calculateProductPrice(productId, {
      width,
      height,
      colorId,
      materialId,
      mountType,
      controlType,
      headrailId,
      bottomRailId
    });

    // For backward compatibility, also check if old pricing matrix exists
    const [product] = await productService.raw(
      'SELECT pricing_method FROM products WHERE product_id = ?',
      [productId]
    );

    if (!product || product.pricing_method !== 'formula') {
      // Fall back to old pricing matrix method
      const matrixPrice = await this.getMatrixPrice(productId, width, height);
      if (matrixPrice) {
        return {
          price: matrixPrice,
          breakdown: null,
          method: 'matrix'
        };
      }
    }

    return {
      price: priceBreakdown.finalPrice,
      breakdown: priceBreakdown,
      method: 'formula'
    };
  }

  private async getMatrixPrice(productId: number, width: number, height: number): Promise<number | null> {
    try {
      // Use new pricing formula instead of matrix
      const [formula] = await productService.raw(
        `SELECT fixed_base, width_rate, height_rate, area_rate 
         FROM product_pricing_formulas 
         WHERE product_id = ?
         AND is_active = 1
         LIMIT 1`,
        [productId]
      );
      
      if (!formula) return null;
      
      // Calculate price using formula: base + (width_rate * width) + (height_rate * height) + (area_rate * width * height)
      const price = formula.fixed_base + 
                   (formula.width_rate * width) + 
                   (formula.height_rate * height) + 
                   (formula.area_rate * width * height);
      
      return price;
    } catch (error) {
      return null;
    }
  }

  private async getRelatedProducts(id: string) {
    const productId = parseInt(id);
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    return this.productService.getRelatedProducts(productId);
  }

  private async searchProducts(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const query = searchParams.get('q');
    
    if (!query) {
      throw new ApiError('Search query required', 400);
    }

    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    
    return this.productService.searchProducts(query, limit);
  }

  // Cart methods
  private async getCart(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');

    return this.cartService.getCart(user?.userId || user?.user_id, sessionId || undefined);
  }

  private async getCartSummary(req: NextRequest, user: any) {
    const cart = await this.getCart(req, user);
    
    return {
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.total,
      hasItems: cart.items.length > 0,
    };
  }

  private async addToCart(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');
    
    try {
      const body = await req.json();
      
      // Manually validate to see what's happening
      let data;
      try {
        data = AddToCartSchema.parse(body);
      } catch (validationError) {
        console.error('Validation error details:', validationError);
        throw new ApiError(`Validation error: ${validationError.message}`, 400);
      }
      
      const result = await this.cartService.addToCart({
        userId: user?.userId || user?.user_id,
        sessionId: !user ? sessionId || undefined : undefined,
        productId: data.productId,
        vendorId: data.vendorId,
        quantity: data.quantity,
        configuration: data.configuration,
      });

      if (!result) {
        throw new ApiError('Failed to add item to cart', 500);
      }

      return result;
    } catch (error) {
      console.error('AddToCart error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        isApiError: error instanceof ApiError,
        error
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Cart error: ${error.message}`, 500);
    }
  }

  private async updateCartItem(id: string, req: NextRequest, user: any) {
    const cartItemId = parseInt(id);
    if (isNaN(cartItemId)) {
      throw new ApiError('Invalid cart item ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateCartSchema);

    const success = await this.cartService.updateQuantity(
      cartItemId,
      data.quantity,
      user?.user_id
    );

    if (!success) {
      throw new ApiError('Failed to update cart item', 404);
    }

    // Return the updated cart instead of just a message
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');
    const updatedCart = await this.cartService.getCart(user?.userId || user?.user_id, sessionId || undefined);
    return updatedCart;
  }

  private async updateCartItemFull(id: string, req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');
    const cartItemId = parseInt(id);
    
    if (isNaN(cartItemId)) {
      throw new ApiError('Invalid cart item ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateCartItemSchema);

    // Get the current cart to ensure the item exists and belongs to the user
    const cart = await this.cartService.getCart(user?.userId || user?.user_id, sessionId || undefined);
    const cartItem = cart.items.find(item => item.cart_item_id === cartItemId);
    
    if (!cartItem) {
      throw new ApiError('Cart item not found', 404);
    }

    // Update the cart item with new configuration
    const success = await this.cartService.updateCartItemConfiguration(
      cartItemId,
      data.quantity,
      data.configuration,
      user?.user_id
    );

    if (!success) {
      throw new ApiError('Failed to update cart item', 500);
    }

    // Return the updated cart
    const updatedCart = await this.cartService.getCart(user?.userId || user?.user_id, sessionId || undefined);
    return updatedCart;
  }

  private async removeCartItem(id: string, user: any) {
    const cartItemId = parseInt(id);
    if (isNaN(cartItemId)) {
      throw new ApiError('Invalid cart item ID', 400);
    }

    const success = await this.cartService.removeFromCart(
      cartItemId,
      user?.userId || user?.user_id
    );

    if (!success) {
      throw new ApiError('Failed to remove cart item', 404);
    }

    return { message: 'Cart item removed successfully' };
  }

  private async clearCart(user: any) {
    this.requireAuth(user);

    const success = await this.cartService.clearCart(user.user_id);

    if (!success) {
      throw new ApiError('Failed to clear cart', 500);
    }

    return { message: 'Cart cleared successfully' };
  }

  private async applyCoupon(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');
    
    const data = await this.getValidatedBody(req, ApplyCouponSchema);

    const result = await this.cartService.applyCoupon(
      data.code,
      user?.userId || user?.user_id,
      sessionId || undefined
    );

    if (!result.success) {
      throw new ApiError(result.message, 400);
    }

    return result;
  }

  // Order methods
  private async getOrders(req: NextRequest, user: any) {
    this.requireAuth(user);

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const options = {
      userId: user.user_id || user.userId,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
      sortBy: 'created_at' as const,
      sortOrder: 'DESC' as const,
      limit,
      offset,
    };

    const { orders, total } = await this.orderService.getOrders(options);

    return this.buildPaginatedResponse(orders, total, page, limit);
  }

  private async getOrder(id: string, user: any) {
    this.requireAuth(user);

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const order = await this.orderService.getOrderWithDetails(orderId);
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Check ownership
    if (order.user_id !== user.user_id && !this.checkRole(user, 'ADMIN')) {
      throw new ApiError('Access denied', 403);
    }

    return order;
  }

  private async getOrderStats(user: any) {
    this.requireAuth(user);
    
    // Only allow customers to see their own stats
    if (user.role !== 'customer') {
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }
    
    const pool = await getPool();
    
    try {
      // Get the user ID - handle both userId and user_id formats
      const userId = user.user_id || user.userId;
      
      if (!userId) {
        return {
          totalOrders: 0,
          totalSpent: 0,
          pendingOrders: 0,
          completedOrders: 0
        };
      }
      
      // Get order statistics
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT o.order_id) as totalOrders,
          COALESCE(SUM(o.total_amount), 0) as totalSpent,
          COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'processing') THEN o.order_id END) as pendingOrders,
          COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as completedOrders
        FROM orders o
        WHERE o.user_id = ?`,
        [userId]
      );
      
      return {
        totalOrders: stats[0].totalOrders || 0,
        totalSpent: parseFloat(stats[0].totalSpent) || 0,
        pendingOrders: stats[0].pendingOrders || 0,
        completedOrders: stats[0].completedOrders || 0
      };
    } catch (error) {
      // Return default values on error
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }
  }

  private async createOrder(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, CreateOrderSchema);

    const order = await this.orderService.createOrder({
      user_id: user.user_id,
      items: data.items.map(item => ({
        product_id: item.productId,
        vendor_id: item.vendorId,
        quantity: item.quantity,
        price: item.price,
        discount_amount: item.discountAmount || 0,
        tax_amount: item.taxAmount || 0,
        configuration: item.configuration
      })),
      shipping_address: data.shippingAddress,
      billing_address: data.billingAddress,
      payment_method: data.paymentMethod,
      notes: data.notes,
      coupon_codes: data.couponCodes,
    });

    if (!order) {
      throw new ApiError('Failed to create order', 500);
    }

    // Clear cart after successful order
    await this.cartService.clearCart(user.user_id);

    // Send order confirmation email
    try {
      const { emailService } = require('@/lib/email/emailService');
      const { formatPrice } = require('@/lib/utils/priceUtils');

      // Format shipping address
      const shippingAddr = data.shippingAddress;
      const shippingAddress = `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}
${shippingAddr.street || shippingAddr.address || ''}${shippingAddr.apt || shippingAddr.apartment ? ', ' + (shippingAddr.apt || shippingAddr.apartment) : ''}
${shippingAddr.city}, ${shippingAddr.state} ${shippingAddr.zipCode || shippingAddr.postal_code}
${shippingAddr.country || 'US'}`;

      await emailService.sendOrderConfirmation({
        orderNumber: order.order_number,
        customerName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer',
        customerEmail: user.email,
        orderDate: new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalAmount: formatPrice(order.total_amount),
        items: order.items.map(item => ({
          name: item.product_name || 'Product',
          quantity: item.quantity,
          price: formatPrice(item.total_price || (item.unit_price * item.quantity))
        })),
        shippingAddress: shippingAddress.trim()
      });

      console.log(`Order confirmation email sent successfully for order #${order.order_number}`);
    } catch (emailError) {
      // Log error but don't fail the order creation
      console.error('Failed to send order confirmation email:', emailError);
    }

    return order;
  }

  private async cancelOrder(id: string, user: any) {
    this.requireAuth(user);

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const success = await this.orderService.updateOrderStatus(
      orderId,
      'cancelled',
      user.user_id,
      'Cancelled by customer'
    );

    if (!success) {
      throw new ApiError('Failed to cancel order', 500);
    }

    return { message: 'Order cancelled successfully' };
  }

  // Quote methods
  private async getQuotes(req: NextRequest, user: any) {
    this.requireAuth(user);

    // Check if user has sales or admin role
    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const status = searchParams.get('status');

    let whereClause = '1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }

    // Only show quotes created by this user unless admin
    if (user.role !== 'admin') {
      whereClause += ' AND q.created_by = ?';
      params.push(user.user_id);
    }

    const [quotes] = await pool.execute(
      `SELECT
        q.quote_id as id,
        q.quote_number,
        q.customer_name,
        q.customer_email,
        q.customer_phone,
        q.project_name,
        q.status,
        q.total_amount,
        q.valid_until,
        q.sent_date,
        q.notes,
        q.follow_up_date,
        q.created_at as created_date
      FROM quotes q
      WHERE ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`,
      params
    );

    // Get items for each quote
    for (const quote of quotes as any[]) {
      const [items] = await pool.execute(
        `SELECT
          qi.quote_item_id as id,
          qi.product_name,
          qi.description,
          qi.quantity,
          qi.unit_price,
          qi.total_price,
          qi.room
        FROM quote_items qi
        WHERE qi.quote_id = ?`,
        [quote.id]
      );
      quote.items = items || [];
    }

    return quotes;
  }

  private async getQuote(id: string, user: any) {
    this.requireAuth(user);

    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) {
      throw new ApiError('Invalid quote ID', 400);
    }

    const pool = await getPool();

    const [quotes] = await pool.execute(
      `SELECT
        q.quote_id as id,
        q.quote_number,
        q.customer_name,
        q.customer_email,
        q.customer_phone,
        q.project_name,
        q.status,
        q.total_amount,
        q.valid_until,
        q.sent_date,
        q.notes,
        q.follow_up_date,
        q.created_at as created_date
      FROM quotes q
      WHERE q.quote_id = ?`,
      [quoteId]
    );

    if ((quotes as any[]).length === 0) {
      throw new ApiError('Quote not found', 404);
    }

    const quote = (quotes as any[])[0];

    // Get items
    const [items] = await pool.execute(
      `SELECT
        qi.quote_item_id as id,
        qi.product_name,
        qi.description,
        qi.quantity,
        qi.unit_price,
        qi.total_price,
        qi.room
      FROM quote_items qi
      WHERE qi.quote_id = ?`,
      [quoteId]
    );

    quote.items = items;

    return quote;
  }

  private async getQuoteStats(user: any) {
    this.requireAuth(user);

    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const pool = await getPool();

    let whereClause = '1=1';
    const params: any[] = [];

    if (user.role !== 'admin') {
      whereClause = 'q.created_by = ?';
      params.push(user.user_id);
    }

    const [stats] = await pool.execute(
      `SELECT
        COUNT(*) as total_quotes,
        SUM(CASE WHEN q.status IN ('draft', 'sent', 'viewed') THEN 1 ELSE 0 END) as pending_quotes,
        SUM(CASE WHEN q.status = 'accepted' THEN 1 ELSE 0 END) as accepted_quotes,
        SUM(q.total_amount) as total_value,
        ROUND(SUM(CASE WHEN q.status = 'accepted' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as conversion_rate
      FROM quotes q
      WHERE ${whereClause}`,
      params
    );

    const row = (stats as any[])[0];

    return {
      total_quotes: row.total_quotes || 0,
      pending_quotes: row.pending_quotes || 0,
      accepted_quotes: row.accepted_quotes || 0,
      total_value: parseFloat(row.total_value) || 0,
      conversion_rate: parseFloat(row.conversion_rate) || 0
    };
  }

  private async createQuote(req: NextRequest, user: any) {
    this.requireAuth(user);

    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const body = await req.json();
    const { customer_name, customer_email, customer_phone, project_name, items, notes, valid_days = 30 } = body;

    if (!customer_name || !customer_email) {
      throw new ApiError('Customer name and email are required', 400);
    }

    const pool = await getPool();

    // Generate quote number
    const quoteNumber = `QT-${Date.now()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + valid_days);

    // Calculate total
    let totalAmount = 0;
    if (items && items.length > 0) {
      totalAmount = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
    }

    const [result] = await pool.execute(
      `INSERT INTO quotes (quote_number, customer_name, customer_email, customer_phone, project_name,
       status, total_amount, valid_until, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW())`,
      [quoteNumber, customer_name, customer_email, customer_phone || null, project_name || null,
       totalAmount, validUntil.toISOString().split('T')[0], notes || null, user.user_id]
    );

    const quoteId = (result as any).insertId;

    // Insert items
    if (items && items.length > 0) {
      for (const item of items) {
        await pool.execute(
          `INSERT INTO quote_items (quote_id, product_name, description, quantity, unit_price, total_price, room)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [quoteId, item.product_name, item.description || null, item.quantity || 1,
           item.unit_price, item.unit_price * (item.quantity || 1), item.room || null]
        );
      }
    }

    return {
      message: 'Quote created successfully',
      quote_id: quoteId,
      quote_number: quoteNumber
    };
  }

  private async sendQuote(id: string, user: any) {
    this.requireAuth(user);

    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) {
      throw new ApiError('Invalid quote ID', 400);
    }

    const pool = await getPool();

    // Update quote status to sent
    await pool.execute(
      `UPDATE quotes SET status = 'sent', sent_date = NOW() WHERE quote_id = ?`,
      [quoteId]
    );

    // In a real implementation, you would send an email here

    return { message: 'Quote sent successfully' };
  }

  private async duplicateQuote(id: string, user: any) {
    this.requireAuth(user);

    if (user.role !== 'sales' && user.role !== 'admin') {
      throw new ApiError('Access denied. Sales role required.', 403);
    }

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) {
      throw new ApiError('Invalid quote ID', 400);
    }

    const pool = await getPool();

    // Get original quote
    const [quotes] = await pool.execute(
      `SELECT * FROM quotes WHERE quote_id = ?`,
      [quoteId]
    );

    if ((quotes as any[]).length === 0) {
      throw new ApiError('Quote not found', 404);
    }

    const original = (quotes as any[])[0];

    // Generate new quote number
    const newQuoteNumber = `QT-${Date.now()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create new quote
    const [result] = await pool.execute(
      `INSERT INTO quotes (quote_number, customer_name, customer_email, customer_phone, project_name,
       status, total_amount, valid_until, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW())`,
      [newQuoteNumber, original.customer_name, original.customer_email, original.customer_phone,
       original.project_name, original.total_amount, validUntil.toISOString().split('T')[0],
       original.notes, user.user_id]
    );

    const newQuoteId = (result as any).insertId;

    // Copy items
    const [items] = await pool.execute(
      `SELECT * FROM quote_items WHERE quote_id = ?`,
      [quoteId]
    );

    for (const item of items as any[]) {
      await pool.execute(
        `INSERT INTO quote_items (quote_id, product_name, description, quantity, unit_price, total_price, room)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newQuoteId, item.product_name, item.description, item.quantity,
         item.unit_price, item.total_price, item.room]
      );
    }

    return {
      message: 'Quote duplicated successfully',
      quote_id: newQuoteId,
      quote_number: newQuoteNumber
    };
  }

  // New methods for cart pricing, payment, and guest orders
  private async calculateCartPricing(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');
    const body = await req.json();
    
    // Get the actual cart to have vendor information
    const cart = await this.cartService.getCart(user?.userId || user?.user_id, sessionId || undefined);
    
    let subtotal = cart.subtotal;
    let totalDiscount = 0;
    const vendorDiscounts: any[] = [];
    const vendorCoupons: any[] = [];
    
    // Apply volume discounts from vendor_discounts table
    const pool = await getPool();
    
    // Group items by vendor to check volume discounts per vendor
    const itemsByVendor = cart.items.reduce((acc, item) => {
      const vendorId = item.vendor_id || item.configuration?.vendorId || item.product_vendor_id;
      if (!vendorId) return acc;
      
      if (!acc[vendorId]) {
        acc[vendorId] = {
          items: [],
          totalQuantity: 0,
          subtotal: 0
        };
      }
      
      acc[vendorId].items.push(item);
      acc[vendorId].totalQuantity += item.quantity;
      acc[vendorId].subtotal += (item.unit_price * item.quantity);
      
      return acc;
    }, {});
    
    
    // Check volume discounts for each vendor
    for (const [vendorId, vendorData] of Object.entries(itemsByVendor)) {
      const [vendorVolumeDiscounts] = await pool.execute(
        `SELECT * FROM vendor_discounts 
         WHERE vendor_id = ?
         AND volume_tiers IS NOT NULL
         AND is_active = 1 
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         ORDER BY priority DESC, discount_id`,
        [vendorId]
      );
      
      
      if (vendorVolumeDiscounts.length > 0) {
        for (const discount of vendorVolumeDiscounts) {
        // Check total usage limit
        if (discount.usage_limit_total && discount.usage_count >= discount.usage_limit_total) {
          continue; // Skip this discount as it has reached its total usage limit
        }
        
        // Check per-customer usage limit if user is authenticated
        if (user?.user_id && discount.usage_limit_per_customer) {
          const [customerUsage] = await pool.execute(
            `SELECT COUNT(*) as usage_count 
             FROM vendor_discount_usage 
             WHERE discount_id = ? 
             AND user_id = ? 
             AND usage_type = 'discount'
             AND order_completed_at IS NOT NULL`,
            [discount.discount_id, user.user_id]
          );
          
          if (customerUsage[0].usage_count >= discount.usage_limit_per_customer) {
            continue; // Skip this discount as customer has reached their usage limit
          }
        }
        
        const tiers = typeof discount.volume_tiers === 'string' 
          ? JSON.parse(discount.volume_tiers || '[]')
          : discount.volume_tiers || [];
        
        // Find applicable tier based on vendor-specific quantity
        const vendorQuantity = vendorData.totalQuantity;
        const vendorSubtotal = vendorData.subtotal;
        
        const applicableTier = tiers
          .filter(tier => vendorQuantity >= tier.min_qty && (!tier.max_qty || vendorQuantity <= tier.max_qty))
          .sort((a, b) => b.discount_percent - a.discount_percent)[0];
        
        if (applicableTier) {
          let discountAmount = vendorSubtotal * (applicableTier.discount_percent / 100);
          
          // Apply maximum discount percent limit if set
          if (discount.max_total_discount_percent) {
            const maxAllowedDiscount = subtotal * (discount.max_total_discount_percent / 100);
            discountAmount = Math.min(discountAmount, maxAllowedDiscount);
          }
          
          totalDiscount += discountAmount;
          
          vendorDiscounts.push({
            type: 'volume_discount',
            vendor_id: vendorId,
            discount_id: discount.discount_id,
            name: `${discount.discount_name} (${vendorQuantity} items - ${applicableTier.discount_percent}% off)`,
            discount_type: 'percentage',
            amount: discountAmount,
            quantity: vendorQuantity,
            tier: applicableTier,
            // Include usage info for tracking
            usage_remaining: discount.usage_limit_total ? 
              Math.max(0, discount.usage_limit_total - discount.usage_count) : null,
            customer_usage_remaining: user?.user_id && discount.usage_limit_per_customer ? 
              Math.max(0, discount.usage_limit_per_customer - (customerUsage?.[0]?.usage_count || 0)) : null
          });
          
          // Usually only one volume discount applies per vendor
          break;
        }
      }
    }
    }
    
    // Apply vendor-specific automatic discounts
    const vendorIds = [...new Set(cart.items.map(item => 
      item.vendor_id || item.configuration?.vendorId || item.product_vendor_id
    ))];
    
    for (const vendorId of vendorIds) {
      if (!vendorId) continue;
      
      const [vendorAutoDiscounts] = await pool.execute(
        `SELECT * FROM vendor_discounts 
         WHERE vendor_id = ? 
         AND is_active = 1 
         AND is_automatic = 1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         ORDER BY priority DESC, discount_value DESC
         LIMIT 1`,
        [vendorId]
      );
      
      if (vendorAutoDiscounts.length > 0) {
        const discount = vendorAutoDiscounts[0];
        
        // Check usage limits for vendor discounts
        let canApplyDiscount = true;
        
        // Check total usage limit
        if (discount.usage_limit_total) {
          const [totalUsage] = await pool.execute(
            `SELECT COUNT(*) as usage_count 
             FROM vendor_discount_usage 
             WHERE discount_id = ? 
             AND usage_type = 'discount'
             AND order_completed_at IS NOT NULL`,
            [discount.discount_id]
          );
          
          if (totalUsage[0].usage_count >= discount.usage_limit_total) {
            canApplyDiscount = false;
          }
        }
        
        // Check per-customer usage limit if user is authenticated
        if (canApplyDiscount && user?.user_id && discount.usage_limit_per_customer) {
          const [customerUsage] = await pool.execute(
            `SELECT COUNT(*) as usage_count 
             FROM vendor_discount_usage 
             WHERE discount_id = ? 
             AND user_id = ? 
             AND usage_type = 'discount'
             AND order_completed_at IS NOT NULL`,
            [discount.discount_id, user.user_id]
          );
          
          if (customerUsage[0].usage_count >= discount.usage_limit_per_customer) {
            canApplyDiscount = false;
          }
        }
        
        if (canApplyDiscount) {
          // Calculate discount for this vendor's items
          const vendorItems = cart.items.filter(item => {
            const itemVendorId = item.vendor_id || item.configuration?.vendorId || item.product_vendor_id;
            return itemVendorId == vendorId;
          });
          
          const vendorSubtotal = vendorItems.reduce((sum, item) => 
            sum + (item.unit_price * item.quantity), 0
          );
          
          // Check minimum order value
          if (discount.minimum_order_value && vendorSubtotal < discount.minimum_order_value) {
            continue; // Skip if doesn't meet minimum order value
          }
          
          if (vendorSubtotal > 0) {
            let discountAmount = 0;
            if (discount.discount_type === 'percentage') {
              discountAmount = vendorSubtotal * (discount.discount_value / 100);
            } else if (discount.discount_type === 'fixed') {
              discountAmount = Math.min(discount.discount_value, vendorSubtotal);
            }
            
            // Apply maximum discount amount if set
            if (discount.maximum_discount_amount && discountAmount > discount.maximum_discount_amount) {
              discountAmount = discount.maximum_discount_amount;
            }
            
            if (discountAmount > 0) {
              totalDiscount += discountAmount;
              vendorDiscounts.push({
                type: 'vendor_discount',
                vendor_id: vendorId,
                vendor_name: cart.vendorBreakdown.find(v => v.vendor_id == vendorId)?.vendor_name || 'Vendor',
                discount_id: discount.discount_id,
                name: discount.display_name || discount.discount_name,
                discount_type: discount.discount_type,
                amount: discountAmount,
                vendor_subtotal: vendorSubtotal,
                vendor_subtotal_after: vendorSubtotal - discountAmount
              });
            }
          }
        }
      }
    }
    
    // Apply customer-specific pricing if authenticated
    if ((user?.userId || user?.user_id) && body.customer_id) {
      // Customer-specific pricing logic here
    }
    
    // Apply coupon if provided
    if (body.coupon_code) {
      // Validate coupon directly here since we already have the cart
      const [coupon] = await pool.execute(
        `SELECT
          vc.*,
          vi.business_name as vendor_name
        FROM vendor_coupons vc
        JOIN vendor_info vi ON vc.vendor_id = vi.user_id
        WHERE vc.coupon_code = ?
          AND vc.is_active = 1
          AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
          AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())
          AND (vc.usage_limit_total IS NULL OR vc.usage_count < vc.usage_limit_total)
        LIMIT 1`,
        [body.coupon_code]
      );

      if (!coupon || coupon.length === 0) {
        throw new ApiError('Invalid or expired coupon code', 400);
      }

      const couponData = coupon[0];
      
      // Check if coupon applies to any items in cart
      const applicableItems = cart.items.filter(item => {
        const itemVendorId = item.vendor_id || 
                            item.configuration?.vendorId || 
                            item.configuration?.vendor_id ||
                            item.product_vendor_id;
        const matches = itemVendorId == couponData.vendor_id;
        return matches;
      });
      
      // If cart is empty, don't throw error - just skip coupon application
      if (cart.items.length === 0) {
        return { 
          subtotal, 
          vendorDiscounts: [], 
          vendorCoupons: [], 
          discounts: [], 
          totalDiscount: 0 
        };
      }
      
      if (applicableItems.length === 0) {
        throw new ApiError(`This coupon is only valid for ${couponData.vendor_name} products`, 400);
      }

      // Check per-customer usage limit if user is authenticated
      if (user?.user_id && couponData.usage_limit_per_customer) {
        const [customerUsage] = await pool.execute(
          `SELECT COUNT(*) as usage_count 
           FROM vendor_discount_usage 
           WHERE coupon_id = ? 
           AND user_id = ? 
           AND usage_type = 'coupon'
           AND order_completed_at IS NOT NULL`,
          [couponData.coupon_id, user.user_id]
        );
        
        if (customerUsage[0].usage_count >= couponData.usage_limit_per_customer) {
          throw new ApiError('You have reached the usage limit for this coupon', 400);
        }
      }

      // Calculate discount
      const applicableSubtotal = applicableItems.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity), 0
      );

      // Check minimum order value
      if (couponData.minimum_order_value && applicableSubtotal < couponData.minimum_order_value) {
        throw new ApiError(`Minimum order value of $${couponData.minimum_order_value} required for this coupon`, 400);
      }

      let discountAmount = 0;
      if (couponData.discount_type === 'percentage') {
        discountAmount = applicableSubtotal * (couponData.discount_value / 100);
      } else if (couponData.discount_type === 'fixed') {
        discountAmount = Math.min(couponData.discount_value, applicableSubtotal);
      }

      // Apply maximum discount amount if set
      if (couponData.maximum_discount_amount && discountAmount > couponData.maximum_discount_amount) {
        discountAmount = couponData.maximum_discount_amount;
      }

      if (discountAmount > 0) {
        totalDiscount += discountAmount;
        const couponEntry = {
          type: 'vendor_coupon',
          vendor_id: couponData.vendor_id,
          vendor_name: couponData.vendor_name,
          coupon_id: couponData.coupon_id,
          coupon_code: body.coupon_code,
          name: couponData.display_name || `Promo Code: ${body.coupon_code}`,
          discount_type: couponData.discount_type,
          amount: discountAmount,
          vendor_subtotal: applicableSubtotal,
          vendor_subtotal_after: applicableSubtotal - discountAmount
        };
        vendorCoupons.push(couponEntry);
      }
    }
    
    // Calculate tax if ZIP code provided
    let tax = 0;
    let taxRate = 0;
    let taxBreakdown = null;
    let taxJurisdiction = null;
    
    if (body.zip_code) {
      // Simple tax calculation - in real app, use tax API
      taxRate = 0.0825; // Default 8.25% tax rate
      tax = (subtotal - totalDiscount) * taxRate;
      taxBreakdown = {
        state_tax: (subtotal - totalDiscount) * 0.0625,
        county_tax: (subtotal - totalDiscount) * 0.01,
        city_tax: (subtotal - totalDiscount) * 0.01,
        special_district_tax: 0
      };
      taxJurisdiction = "Texas";
    }
    
    const shipping = subtotal >= 100 ? 0 : 15; // Free shipping over $100
    const total = subtotal - totalDiscount + shipping + tax;
    
    // Return data directly - the route handler will wrap it in success response
    return {
      subtotal,
      vendor_discounts: vendorDiscounts,
      vendor_coupons: vendorCoupons,
      total_discount_amount: totalDiscount,
      applied_discounts_list: [...vendorDiscounts, ...vendorCoupons],
      shipping,
      tax,
      tax_rate: taxRate,
      tax_breakdown: taxBreakdown,
      tax_jurisdiction: taxJurisdiction,
      zip_code: body.zip_code,
      total,
      vendors_in_cart: cart.vendorBreakdown.length,
      applied_promotions: body.coupon_code ? { coupon_code: body.coupon_code } : {}
    };
  }

  private async getPaymentMethods(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'USD';
    const country = searchParams.get('country') || 'US';
    
    // Get payment settings from database
    const settings = await settingsService.getAllSettings();
    const paymentSettings = settings.payments;
    
    
    // Return available payment methods based on settings and amount
    const paymentMethods = [];
    
    // Check if Stripe is enabled and has credentials
    if (paymentSettings.stripe_enabled && 
        paymentSettings.stripe_secret_key && 
        paymentSettings.stripe_publishable_key) {
      paymentMethods.push({
        id: 'stripe_card',
        provider: 'stripe',
        type: 'card',
        name: 'Credit or Debit Card',
        description: 'Pay with Visa, Mastercard, American Express, or Discover',
        icon: 'credit-card',
        min_amount: 0,
        max_amount: 999999,
        currencies: ['USD'],
        countries: ['US'],
        processing_time: 'instant',
        estimated_fee: amount * 0.029 + 0.30,
        estimated_total: amount + (amount * 0.029 + 0.30),
        available: true,
        recommended: true,
        popular: true,
        publishable_key: paymentSettings.stripe_publishable_key
      });
    }
    
    // Check if PayPal is enabled
    if (paymentSettings.paypal_enabled && 
        paymentSettings.paypal_client_id && 
        paymentSettings.paypal_client_secret &&
        amount >= 10) {
      paymentMethods.push({
        id: 'paypal',
        provider: 'paypal',
        type: 'wallet',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        min_amount: 10,
        max_amount: 10000,
        currencies: ['USD'],
        countries: ['US'],
        processing_time: 'instant',
        estimated_fee: 0,
        estimated_total: amount,
        available: true,
        recommended: false,
        popular: true,
        client_id: paymentSettings.paypal_client_id
      });
    }
    
    // Check if Klarna is enabled
    if (paymentSettings.klarna_enabled && 
        paymentSettings.klarna_api_key && 
        paymentSettings.klarna_username &&
        paymentSettings.klarna_password &&
        amount >= 50) {
      paymentMethods.push({
        id: 'klarna',
        provider: 'klarna',
        type: 'bnpl',
        name: 'Klarna',
        description: 'Pay in 4 interest-free installments',
        min_amount: 50,
        max_amount: 1000,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
        installments: 4,
        recommended: false,
        popular: false
      });
    }
    
    // Check if Afterpay is enabled
    if (paymentSettings.afterpay_enabled && 
        paymentSettings.afterpay_merchant_id && 
        paymentSettings.afterpay_secret_key &&
        amount >= 100) {
      paymentMethods.push({
        id: 'afterpay',
        provider: 'afterpay',
        type: 'bnpl',
        name: 'Afterpay',
        description: 'Pay in 4 interest-free installments',
        min_amount: 100,
        max_amount: 2000,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
        installments: 4,
        recommended: false,
        popular: false
      });
    }
    
    // Check if Affirm is enabled
    if (paymentSettings.affirm_enabled && 
        paymentSettings.affirm_public_api_key && 
        paymentSettings.affirm_private_api_key &&
        amount >= 50) {
      paymentMethods.push({
        id: 'affirm',
        provider: 'affirm',
        type: 'bnpl',
        name: 'Affirm',
        description: 'Flexible payment plans from 3-36 months',
        min_amount: 50,
        max_amount: 30000,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
        installments: 'flexible',
        recommended: false,
        popular: false,
        public_key: paymentSettings.affirm_public_api_key
      });
    }
    
    // Check if Braintree is enabled
    if (paymentSettings.braintree_enabled && 
        paymentSettings.braintree_merchant_id && 
        paymentSettings.braintree_public_key &&
        paymentSettings.braintree_private_key) {
      paymentMethods.push({
        id: 'braintree',
        provider: 'braintree',
        type: 'all',
        name: 'Braintree',
        description: 'Multiple payment options including cards and PayPal',
        min_amount: 0,
        max_amount: 999999,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
        recommended: false,
        popular: false
      });
    }
    
    // Check if Google Pay is enabled (uses Stripe)
    if (paymentSettings.stripe_enabled && 
        paymentSettings.stripe_secret_key && 
        paymentSettings.stripe_publishable_key &&
        (paymentSettings.google_pay_enabled !== false)) { // Default enabled if Stripe is enabled
      paymentMethods.push({
        id: 'google_pay',
        provider: 'stripe',
        type: 'digital_wallet',
        name: 'Google Pay',
        description: 'Pay quickly with your Google account',
        icon: 'google',
        min_amount: 0.5,
        max_amount: 999999,
        currencies: ['USD'],
        countries: ['US'],
        processing_time: 'instant',
        estimated_fee: amount * 0.029 + 0.30,
        estimated_total: amount + (amount * 0.029 + 0.30),
        available: true,
        recommended: false,
        popular: true,
        publishable_key: paymentSettings.stripe_publishable_key
      });
    }
    
    // Check if Apple Pay is enabled (uses Stripe)
    if (paymentSettings.stripe_enabled && 
        paymentSettings.stripe_secret_key && 
        paymentSettings.stripe_publishable_key &&
        (paymentSettings.apple_pay_enabled !== false)) { // Default enabled if Stripe is enabled
      paymentMethods.push({
        id: 'apple_pay',
        provider: 'stripe',
        type: 'digital_wallet',
        name: 'Apple Pay',
        description: 'Pay securely with Touch ID or Face ID',
        icon: 'apple',
        min_amount: 0.5,
        max_amount: 999999,
        currencies: ['USD'],
        countries: ['US'],
        processing_time: 'instant',
        estimated_fee: amount * 0.029 + 0.30,
        estimated_total: amount + (amount * 0.029 + 0.30),
        available: true,
        recommended: false,
        popular: true,
        publishable_key: paymentSettings.stripe_publishable_key
      });
    }
    
    return {
      payment_methods: paymentMethods.filter(m => 
        m.min_amount <= amount && 
        m.max_amount >= amount &&
        m.currencies.includes(currency) &&
        m.countries.includes(country)
      )
    };
  }

  private async processPayment(req: NextRequest, user: any) {
    const body = await req.json();
    
    // Validate required fields
    if (!body.payment_method_id || !body.amount || !body.currency) {
      throw new ApiError('Missing required payment fields', 400);
    }

    if (!body.billing_address || !body.billing_address.email) {
      throw new ApiError('Billing address with email is required', 400);
    }

    try {
      // Process payment through the appropriate provider
      const result = await paymentService.processPayment({
        payment_method_id: body.payment_method_id,
        amount: body.amount,
        currency: body.currency,
        payment_data: body.payment_data || {},
        billing_address: body.billing_address,
        shipping_address: body.shipping_address,
        order_items: body.order_items,
        metadata: {
          user_id: user?.user_id?.toString() || 'guest',
          session_id: body.session_id || '',
        }
      });

      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Return a user-friendly error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  private async capturePayPalPayment(req: NextRequest) {
    const body = await req.json();
    
    if (!body.order_id) {
      throw new ApiError('PayPal order ID is required', 400);
    }

    try {
      const result = await paymentService.capturePayPalPayment(body.order_id);
      return result;
    } catch (error) {
      console.error('PayPal capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal capture failed',
      };
    }
  }

  private async createGuestOrder(req: NextRequest) {
    const body = await req.json();
    const pool = await getPool();
    
    try {
      // Extract order data
      const { 
        items, 
        shipping, 
        billing, 
        payment,
        subtotal,
        shipping_cost,
        tax,
        total,
        discount_amount,
        special_instructions,
        createAccount,
        guestPassword,
        guestConfirmPassword
      } = body;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        let userId = null;
        
        // If createAccount is true, create a new customer account first
        if (createAccount && guestPassword && guestPassword === guestConfirmPassword) {
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(guestPassword, 10);
          
          // Check if email already exists
          const [existingUser] = await connection.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [shipping.email]
          );
          
          if (existingUser.length === 0) {
            // Create new user account
            const [userResult] = await connection.execute(
              `INSERT INTO users (role, email, password, created_at, updated_at)
               VALUES ('customer', ?, ?, NOW(), NOW())`,
              [shipping.email, hashedPassword]
            );
            
            userId = userResult.insertId;
            
            // Create user profile
            await connection.execute(
              `INSERT INTO user_profiles (user_id, first_name, last_name, phone, created_at, updated_at)
               VALUES (?, ?, ?, ?, NOW(), NOW())`,
              [userId, shipping.firstName, shipping.lastName, shipping.phone]
            );
            
            // Create shipping address
            await connection.execute(
              `INSERT INTO user_addresses (user_id, address_type, address_line1, address_line2, city, state_province, 
               postal_code, country, is_default, created_at, updated_at)
               VALUES (?, 'shipping', ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
              [userId, shipping.address, shipping.apt || null, shipping.city, 
               shipping.state, shipping.zipCode, shipping.country]
            );
          }
        }
        
        // Create shipping address in user_shipping_addresses table
        const [shippingAddressResult] = await connection.execute(
          `INSERT INTO user_shipping_addresses (
            user_id, address_name, first_name, last_name, address_line_1, address_line_2, 
            city, state_province, postal_code, country, phone, email, is_default, 
            is_billing_address, created_at, updated_at
          ) VALUES (?, 'Order Address', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
          [
            userId, 
            shipping.firstName,
            shipping.lastName,
            shipping.address,
            shipping.apt || '',
            shipping.city,
            shipping.state,
            shipping.zipCode,
            shipping.country || 'US',
            shipping.phone,
            shipping.email
          ]
        );
        
        // Create billing address if different
        let billingAddressId = shippingAddressResult.insertId;
        const billingData = billing.sameAsShipping ? shipping : billing;
        if (!billing.sameAsShipping) {
          const [billingAddressResult] = await connection.execute(
            `INSERT INTO user_shipping_addresses (
              user_id, address_name, first_name, last_name, address_line_1, address_line_2, 
              city, state_province, postal_code, country, phone, email, is_default, 
              is_billing_address, created_at, updated_at
            ) VALUES (?, 'Billing Address', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())`,
            [
              userId,
              billingData.firstName || shipping.firstName,
              billingData.lastName || shipping.lastName,
              billingData.address,
              billingData.apt || '',
              billingData.city,
              billingData.state,
              billingData.zipCode,
              billingData.country || 'US',
              shipping.phone,
              shipping.email
            ]
          );
          billingAddressId = billingAddressResult.insertId;
        }

        // Create the order with address IDs
        const [orderResult] = await connection.execute(
          `INSERT INTO orders (
            user_id, order_number, status, subtotal, shipping_amount, tax_amount, 
            discount_amount, total_amount, currency, payment_method, payment_status,
            shipping_address_id, billing_address_id, notes, created_at, updated_at
          ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, 'USD', ?, 'paid', ?, ?, ?, NOW(), NOW())`,
          [
            userId, 
            orderNumber, 
            subtotal,
            shipping_cost || 0,
            tax || 0,
            discount_amount || 0,
            total,
            payment.method,
            shippingAddressResult.insertId,
            billingAddressId,
            special_instructions || null
          ]
        );
        
        const orderId = orderResult.insertId;
        
        // Create order items
        for (const item of items) {
          await connection.execute(
            `INSERT INTO order_items (
              order_id, product_id, vendor_id, quantity, unit_price, 
              discount_amount, tax_amount, total_price, product_config,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              orderId,
              item.id,
              item.vendor_id || 1, // Default vendor if not provided
              item.quantity,
              item.price,
              item.discountAmount || 0,
              item.taxAmount || 0,
              item.price * item.quantity,
              JSON.stringify({
                width: item.width,
                height: item.height,
                colorName: item.colorName,
                colorId: item.colorId,
                ...item.configuration
              })
            ]
          );
        }
        
        // Note: Addresses are already created and linked via shipping_address_id and billing_address_id
        
        // Record payment
        if (payment.transaction_id) {
          await connection.execute(
            `INSERT INTO payment_transactions (
              order_id, payment_method, transaction_id, amount, currency,
              status, gateway_response, created_at
            ) VALUES (?, ?, ?, ?, 'USD', 'completed', ?, NOW())`,
            [
              orderId,
              payment.method,
              payment.transaction_id,
              total,
              JSON.stringify({ status: payment.status })
            ]
          );
        }
        
        // Commit transaction
        await connection.commit();
        
        return {
          success: true,
          order_id: orderId,
          order_number: orderNumber,
          message: createAccount && userId ? 'Order created and account registered successfully' : 'Order created successfully',
          user_created: createAccount && userId ? true : false
        };
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('Error creating guest order:', error);
      throw new ApiError(error.message || 'Failed to create order', 500);
    }
  }

  /**
   * Store bulk upload record
   */
  private async storeBulkUpload(req: NextRequest, user: any) {
    this.requireAuth(user);
    
    const body = await this.getRequestBody(req);
    const {
      uploadId,
      templateId,
      fileName,
      fileHash,
      rowCount,
      validRows,
      invalidRows,
      status,
      validationErrors,
      validationWarnings
    } = body;

    // Validate required fields
    if (!uploadId || !templateId || !fileName || !fileHash) {
      throw new ApiError('Missing required fields', 400);
    }

    const pool = await getPool();
    
    await pool.execute(`
      INSERT INTO customer_bulk_uploads (
        upload_id, customer_id, template_id, file_name, file_hash,
        row_count, valid_rows, invalid_rows, status,
        validation_errors, validation_warnings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      uploadId,
      user.userId,
      templateId,
      fileName,
      fileHash,
      rowCount || 0,
      validRows || 0,
      invalidRows || 0,
      status || 'uploaded',
      JSON.stringify(validationErrors || []),
      JSON.stringify(validationWarnings || [])
    ]);

    return {
      success: true,
      uploadId,
      message: 'Bulk upload record stored successfully'
    };
  }

  private async createPayPalOrder(req: NextRequest, user: any) {
    try {
      const body = await req.json();
      
      // Validate required fields for PayPal order
      if (!body.amount || !body.currency) {
        throw new ApiError('Amount and currency are required', 400);
      }

      // Process payment through PaymentService which will create PayPal order
      const result = await paymentService.processPayment({
        payment_method_id: 'paypal',
        amount: body.amount,
        currency: body.currency || 'USD',
        payment_data: body.payment_data || {},
        billing_address: body.billing_address || {},
        shipping_address: body.shipping_address,
        order_items: body.items || [],
        metadata: {
          user_id: user?.user_id?.toString() || 'guest',
          session_id: body.session_id || '',
          order_context: 'checkout'
        }
      });

      return result;
    } catch (error) {
      console.error('PayPal order creation error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'PayPal order creation failed',
        500
      );
    }
  }

  private async getPayPalClientToken(req: NextRequest, user: any) {
    try {
      // Get PayPal client token for initialization
      const result = await paymentService.getPayPalClientToken();
      return result;
    } catch (error) {
      console.error('PayPal client token error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to get PayPal client token',
        500
      );
    }
  }

  /**
   * Get the active homepage popup coupon
   * Returns the top 1 active coupon with show_on_homepage_popup = true
   * This is a public endpoint (no authentication required)
   */
  private async getHomepagePopupCoupon() {
    const pool = await getPool();

    try {
      const [rows] = await pool.execute(
        `SELECT
          vc.coupon_code,
          vc.coupon_name,
          vc.display_name,
          vc.description,
          vc.discount_type,
          vc.discount_value,
          vc.minimum_order_value,
          vc.maximum_discount_amount,
          vc.valid_from,
          vc.valid_until
        FROM vendor_coupons vc
        WHERE vc.show_on_homepage_popup = 1
          AND vc.is_active = 1
          AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
          AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())
          AND (vc.usage_limit_total IS NULL OR vc.usage_count < vc.usage_limit_total)
        ORDER BY vc.priority DESC, vc.created_at DESC
        LIMIT 1`
      );

      const coupons = rows as any[];

      if (coupons.length === 0) {
        return { coupon: null };
      }

      const coupon = coupons[0];
      return {
        coupon: {
          code: coupon.coupon_code,
          name: coupon.display_name || coupon.coupon_name,
          description: coupon.description,
          discountType: coupon.discount_type,
          discountValue: parseFloat(coupon.discount_value),
          discountPercent: coupon.discount_type === 'percentage' ? parseFloat(coupon.discount_value) : null,
          minimumOrderValue: parseFloat(coupon.minimum_order_value || 0),
          maximumDiscount: coupon.maximum_discount_amount ? parseFloat(coupon.maximum_discount_amount) : null,
          validUntil: coupon.valid_until,
        }
      };
    } catch (error) {
      console.error('Error fetching homepage popup coupon:', error);
      // Return null coupon instead of throwing - don't break the page if this fails
      return { coupon: null };
    }
  }

  // =====================================================
  // Installation Appointment Booking
  // =====================================================

  /**
   * Get orders eligible for installation appointment booking
   * Requirements:
   * - Order must be in "shipped" status
   * - Must be at least 7 days from shipment date for appointment
   */
  private async getEligibleOrdersForInstallation(user: any) {
    this.requireAuth(user);

    try {
      const pool = await getPool();

      // Get shipped orders for this user that don't have an installation appointment yet
      const [orders] = await pool.execute(
        `SELECT
          o.order_id,
          o.order_number,
          o.status,
          o.shipped_at,
          o.total_amount,
          DATE_ADD(o.shipped_at, INTERVAL 7 DAY) as earliest_appointment_date,
          usa.address_line_1,
          usa.address_line_2,
          usa.city,
          usa.state_province,
          usa.postal_code,
          usa.country,
          (SELECT COUNT(*) FROM installation_appointments ia WHERE ia.order_id = o.order_id) as has_appointment
        FROM orders o
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        WHERE o.user_id = ?
          AND o.status = 'shipped'
          AND o.shipped_at IS NOT NULL
          AND o.shipped_at <= DATE_SUB(NOW(), INTERVAL 0 DAY)
        ORDER BY o.shipped_at DESC`,
        [user.user_id]
      );

      // Filter out orders that already have appointments
      const eligibleOrders = (orders as any[]).filter(o => o.has_appointment === 0);

      return {
        orders: eligibleOrders.map(o => ({
          order_id: o.order_id,
          order_number: o.order_number,
          status: o.status,
          shipped_at: o.shipped_at,
          total_amount: parseFloat(o.total_amount),
          earliest_appointment_date: o.earliest_appointment_date,
          shipping_address: {
            address_line1: o.address_line_1,
            address_line2: o.address_line_2,
            city: o.city,
            state: o.state_province,
            postal_code: o.postal_code,
            country: o.country
          }
        })),
        minimum_days_after_shipment: 7
      };
    } catch (error) {
      console.error('Error fetching eligible orders:', error);
      throw new ApiError('Failed to fetch eligible orders', 500);
    }
  }

  /**
   * Get customer's installation appointments (including those scheduled by installers)
   */
  private async getMyInstallationAppointments(user: any) {
    this.requireAuth(user);

    try {
      const pool = await getPool();

      const [appointments] = await pool.execute(
        `SELECT
          ia.appointment_id,
          ia.order_id,
          ia.appointment_date,
          ia.time_slot_id,
          ia.installation_type,
          ia.status,
          ia.special_requirements,
          ia.installation_address,
          ia.contact_phone,
          ia.base_cost,
          ia.total_cost,
          ia.created_at,
          o.order_number,
          its.slot_name as time_slot_name,
          its.start_time,
          its.end_time,
          CONCAT(its.start_time, ' - ', its.end_time) as time_range,
          CONCAT(tech_user.first_name, ' ', tech_user.last_name) as technician_name,
          tech_user.phone as technician_phone,
          tech_user.email as technician_email
        FROM installation_appointments ia
        INNER JOIN orders o ON ia.order_id = o.order_id
        LEFT JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
        LEFT JOIN installation_technicians it ON ia.assigned_technician_id = it.technician_id
        LEFT JOIN users tech_user ON it.user_id = tech_user.user_id
        WHERE ia.customer_id = ?
        ORDER BY ia.appointment_date DESC, its.start_time ASC`,
        [user.user_id]
      );

      return {
        appointments: (appointments as any[]).map(apt => {
          let address = null;
          try {
            address = apt.installation_address ? JSON.parse(apt.installation_address) : null;
          } catch (e) {
            address = { raw: apt.installation_address };
          }

          return {
            appointment_id: apt.appointment_id,
            order_id: apt.order_id,
            order_number: apt.order_number,
            appointment_date: apt.appointment_date,
            time_slot: apt.time_slot_name,
            time_range: apt.time_range,
            installation_type: apt.installation_type,
            status: apt.status,
            special_requirements: apt.special_requirements,
            installation_address: address,
            contact_phone: apt.contact_phone,
            base_cost: parseFloat(apt.base_cost) || 0,
            total_cost: parseFloat(apt.total_cost) || 0,
            technician: {
              name: apt.technician_name,
              phone: apt.technician_phone,
              email: apt.technician_email
            },
            created_at: apt.created_at
          };
        })
      };
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      throw new ApiError('Failed to fetch appointments', 500);
    }
  }

  /**
   * Reschedule an installation appointment
   * Customer can change the date and time slot
   */
  private async rescheduleInstallationAppointment(appointmentId: string, req: NextRequest, user: any) {
    this.requireAuth(user);

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const body = await req.json();
    const { appointment_date, time_slot_id, reason } = body;

    if (!appointment_date) {
      throw new ApiError('New appointment date is required', 400);
    }
    if (!time_slot_id) {
      throw new ApiError('New time slot is required', 400);
    }

    try {
      const pool = await getPool();

      // Verify appointment belongs to this customer and is reschedulable
      const [appointments] = await pool.execute<RowDataPacket[]>(
        `SELECT ia.*, o.shipped_at, o.order_number
         FROM installation_appointments ia
         INNER JOIN orders o ON ia.order_id = o.order_id
         WHERE ia.appointment_id = ? AND ia.customer_id = ?`,
        [id, user.user_id]
      );

      if (!(appointments as any[]).length) {
        throw new ApiError('Appointment not found or does not belong to you', 404);
      }

      const appointment = (appointments as any[])[0];

      // Can only reschedule scheduled appointments (not completed or cancelled)
      if (appointment.status !== 'scheduled') {
        throw new ApiError(`Cannot reschedule an appointment with status "${appointment.status}"`, 400);
      }

      // Validate new date is at least 7 days after shipment
      const shippedAt = new Date(appointment.shipped_at);
      const newDate = new Date(appointment_date);
      const minDate = new Date(shippedAt);
      minDate.setDate(minDate.getDate() + 7);

      if (newDate < minDate) {
        throw new ApiError('New appointment date must be at least 7 days after shipment', 400);
      }

      // Validate new date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        throw new ApiError('Cannot schedule appointment in the past', 400);
      }

      // Store previous values for history
      const previousDate = appointment.appointment_date;
      const previousSlotId = appointment.time_slot_id;

      // Update the appointment
      await pool.execute(
        `UPDATE installation_appointments
         SET appointment_date = ?,
             time_slot_id = ?,
             reschedule_reason = ?,
             rescheduled_at = NOW(),
             updated_at = NOW()
         WHERE appointment_id = ?`,
        [appointment_date, time_slot_id, reason || null, id]
      );

      // Get the new time slot info for response
      const [slots] = await pool.execute<RowDataPacket[]>(
        `SELECT slot_name, start_time, end_time FROM installation_time_slots WHERE slot_id = ?`,
        [time_slot_id]
      );
      const newSlot = (slots as any[])[0];

      return {
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: {
          appointment_id: id,
          order_number: appointment.order_number,
          new_date: appointment_date,
          new_time_slot: newSlot?.slot_name,
          new_time_range: newSlot ? `${newSlot.start_time} - ${newSlot.end_time}` : null,
          previous_date: previousDate,
          previous_slot_id: previousSlotId
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error rescheduling appointment:', error);
      throw new ApiError('Failed to reschedule appointment', 500);
    }
  }

  /**
   * Cancel an installation appointment
   * Customer can cancel with a reason
   */
  private async cancelInstallationAppointment(appointmentId: string, req: NextRequest, user: any) {
    this.requireAuth(user);

    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      throw new ApiError('Invalid appointment ID', 400);
    }

    const body = await req.json();
    const { reason } = body;

    try {
      const pool = await getPool();

      // Verify appointment belongs to this customer
      const [appointments] = await pool.execute<RowDataPacket[]>(
        `SELECT ia.*, o.order_number
         FROM installation_appointments ia
         INNER JOIN orders o ON ia.order_id = o.order_id
         WHERE ia.appointment_id = ? AND ia.customer_id = ?`,
        [id, user.user_id]
      );

      if (!(appointments as any[]).length) {
        throw new ApiError('Appointment not found or does not belong to you', 404);
      }

      const appointment = (appointments as any[])[0];

      // Can only cancel scheduled appointments
      if (appointment.status !== 'scheduled') {
        throw new ApiError(`Cannot cancel an appointment with status "${appointment.status}"`, 400);
      }

      // Update the appointment status to cancelled
      await pool.execute(
        `UPDATE installation_appointments
         SET status = 'cancelled',
             cancellation_reason = ?,
             cancelled_at = NOW(),
             cancelled_by = 'customer',
             updated_at = NOW()
         WHERE appointment_id = ?`,
        [reason || 'Cancelled by customer', id]
      );

      return {
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: {
          appointment_id: id,
          order_number: appointment.order_number,
          status: 'cancelled'
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error cancelling appointment:', error);
      throw new ApiError('Failed to cancel appointment', 500);
    }
  }

  /**
   * Get installer companies that serve a specific zip code
   */
  private async getInstallersByZipCode(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const zipCode = searchParams.get('zip_code');

    if (!zipCode) {
      throw new ApiError('zip_code is required', 400);
    }

    try {
      const pool = await getPool();

      const [installers] = await pool.execute(
        `SELECT
          ic.company_id,
          ic.company_name,
          ic.phone,
          ic.email,
          ic.city,
          ic.state_province,
          ic.rating,
          ic.total_reviews,
          ic.total_installations,
          ic.base_service_fee,
          ic.hourly_rate,
          ic.services_offered,
          ic.product_specialties,
          ic.lead_time_days,
          ic.max_advance_days,
          ic.service_days,
          ic.service_start_time,
          ic.service_end_time,
          icz.is_primary_area,
          icz.additional_travel_fee
        FROM installer_companies ic
        INNER JOIN installer_company_zip_codes icz ON ic.company_id = icz.company_id
        WHERE icz.zip_code = ?
          AND icz.is_active = 1
          AND ic.is_active = 1
        ORDER BY icz.is_primary_area DESC, ic.rating DESC`,
        [zipCode]
      );

      return {
        installers: (installers as any[]).map(i => ({
          company_id: i.company_id,
          company_name: i.company_name,
          phone: i.phone,
          email: i.email,
          location: `${i.city}, ${i.state_province}`,
          rating: parseFloat(i.rating) || 0,
          total_reviews: i.total_reviews || 0,
          total_installations: i.total_installations || 0,
          base_service_fee: parseFloat(i.base_service_fee) || 0,
          hourly_rate: parseFloat(i.hourly_rate) || 0,
          additional_travel_fee: parseFloat(i.additional_travel_fee) || 0,
          services_offered: typeof i.services_offered === 'string' ? JSON.parse(i.services_offered) : i.services_offered,
          product_specialties: typeof i.product_specialties === 'string' ? JSON.parse(i.product_specialties) : i.product_specialties,
          lead_time_days: i.lead_time_days,
          max_advance_days: i.max_advance_days,
          service_days: typeof i.service_days === 'string' ? JSON.parse(i.service_days) : i.service_days,
          service_hours: `${i.service_start_time} - ${i.service_end_time}`,
          is_primary_area: i.is_primary_area === 1
        })),
        zip_code: zipCode
      };
    } catch (error) {
      console.error('Error fetching installers by zip code:', error);
      throw new ApiError('Failed to fetch installers', 500);
    }
  }

  /**
   * Get available time slots for installation
   */
  private async getInstallationTimeSlots(req: NextRequest) {
    try {
      const pool = await getPool();

      const [slots] = await pool.execute(
        `SELECT
          slot_id,
          slot_name,
          slot_code,
          start_time,
          end_time,
          premium_fee
        FROM installation_time_slots
        WHERE is_active = 1
        ORDER BY display_order ASC, start_time ASC`
      );

      return {
        time_slots: (slots as any[]).map(s => ({
          slot_id: s.slot_id,
          name: s.slot_name,
          code: s.slot_code,
          start_time: s.start_time,
          end_time: s.end_time,
          premium_fee: parseFloat(s.premium_fee) || 0,
          display: `${s.start_time} - ${s.end_time}`
        }))
      };
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw new ApiError('Failed to fetch time slots', 500);
    }
  }

  /**
   * Book an installation appointment
   * Validates:
   * - User is authenticated
   * - Order exists and belongs to user
   * - Order is in "shipped" status
   * - Appointment date is at least 7 days after shipment
   * - Installer company serves the order's zip code
   */
  private async bookInstallationAppointment(req: NextRequest, user: any) {
    this.requireAuth(user);

    const body = await req.json();
    const {
      order_id,
      installer_company_id,
      appointment_date,
      time_slot_id,
      installation_type = 'installation',
      special_requirements
    } = body;

    // Validate required fields
    if (!order_id) throw new ApiError('order_id is required', 400);
    if (!installer_company_id) throw new ApiError('installer_company_id is required', 400);
    if (!appointment_date) throw new ApiError('appointment_date is required', 400);
    if (!time_slot_id) throw new ApiError('time_slot_id is required', 400);

    try {
      const pool = await getPool();

      // 1. Verify order exists, belongs to user, and is shipped
      const [orders] = await pool.execute(
        `SELECT
          o.order_id,
          o.order_number,
          o.user_id,
          o.status,
          o.shipped_at,
          o.total_amount,
          usa.postal_code as shipping_zip
        FROM orders o
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        WHERE o.order_id = ?`,
        [order_id]
      );

      if (!(orders as any[]).length) {
        throw new ApiError('Order not found', 404);
      }

      const order = (orders as any[])[0];

      if (order.user_id !== user.user_id) {
        throw new ApiError('Order does not belong to this user', 403);
      }

      if (order.status !== 'shipped') {
        throw new ApiError('Order must be in shipped status to book installation', 400);
      }

      if (!order.shipped_at) {
        throw new ApiError('Order shipment date not recorded', 400);
      }

      // 2. Validate appointment date is at least 7 days after shipment
      const shippedDate = new Date(order.shipped_at);
      const appointmentDateObj = new Date(appointment_date);
      const minAppointmentDate = new Date(shippedDate);
      minAppointmentDate.setDate(minAppointmentDate.getDate() + 7);

      if (appointmentDateObj < minAppointmentDate) {
        throw new ApiError(
          `Appointment must be at least 7 days after shipment. Earliest available date: ${minAppointmentDate.toISOString().split('T')[0]}`,
          400
        );
      }

      // 3. Verify installer company exists and serves this zip code
      const [installerCheck] = await pool.execute(
        `SELECT ic.company_id, ic.company_name, ic.lead_time_days, ic.max_advance_days
         FROM installer_companies ic
         INNER JOIN installer_company_zip_codes icz ON ic.company_id = icz.company_id
         WHERE ic.company_id = ?
           AND icz.zip_code = ?
           AND icz.is_active = 1
           AND ic.is_active = 1`,
        [installer_company_id, order.shipping_zip]
      );

      if (!(installerCheck as any[]).length) {
        throw new ApiError('Selected installer does not serve this location', 400);
      }

      const installer = (installerCheck as any[])[0];

      // 4. Validate appointment date is within installer's booking window
      const today = new Date();
      const leadTimeDate = new Date(today);
      leadTimeDate.setDate(leadTimeDate.getDate() + installer.lead_time_days);
      const maxAdvanceDate = new Date(today);
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + installer.max_advance_days);

      if (appointmentDateObj < leadTimeDate) {
        throw new ApiError(
          `Installer requires at least ${installer.lead_time_days} days advance notice`,
          400
        );
      }

      if (appointmentDateObj > maxAdvanceDate) {
        throw new ApiError(
          `Cannot book more than ${installer.max_advance_days} days in advance`,
          400
        );
      }

      // 5. Verify time slot exists
      const [timeSlots] = await pool.execute(
        `SELECT slot_id, slot_name FROM installation_time_slots WHERE slot_id = ? AND is_active = 1`,
        [time_slot_id]
      );

      if (!(timeSlots as any[]).length) {
        throw new ApiError('Invalid time slot', 400);
      }

      // 6. Check if appointment already exists for this order
      const [existingAppointment] = await pool.execute(
        `SELECT appointment_id FROM installation_appointments WHERE order_id = ?`,
        [order_id]
      );

      if ((existingAppointment as any[]).length) {
        throw new ApiError('An installation appointment already exists for this order', 400);
      }

      // 7. Create the installation appointment
      const [result] = await pool.execute(
        `INSERT INTO installation_appointments (
          customer_id,
          order_id,
          installer_company_id,
          appointment_date,
          time_slot_id,
          installation_type,
          special_requirements,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
        [
          user.user_id,
          order_id,
          installer_company_id,
          appointment_date,
          time_slot_id,
          installation_type,
          special_requirements || null
        ]
      );

      const appointmentId = (result as any).insertId;

      // 8. Get the created appointment details
      const [appointment] = await pool.execute(
        `SELECT
          ia.appointment_id,
          ia.appointment_date,
          its.slot_name as time_slot,
          CONCAT(its.start_time, ' - ', its.end_time) as time_range,
          ia.installation_type,
          ia.status,
          ic.company_name as installer_name,
          ic.phone as installer_phone,
          ic.email as installer_email,
          o.order_number
        FROM installation_appointments ia
        JOIN installation_time_slots its ON ia.time_slot_id = its.slot_id
        JOIN installer_companies ic ON ia.installer_company_id = ic.company_id
        JOIN orders o ON ia.order_id = o.order_id
        WHERE ia.appointment_id = ?`,
        [appointmentId]
      );

      return {
        success: true,
        message: 'Installation appointment booked successfully',
        appointment: (appointment as any[])[0]
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error booking installation appointment:', error);
      throw new ApiError('Failed to book installation appointment', 500);
    }
  }

  /**
   * POST /api/v2/commerce/recommendations
   * Get AI-powered product recommendations
   */
  private async getRecommendations(req: NextRequest, user: any) {
    const body = await this.getBody(req);
    const { recommendationType, roomType, budget, style, currentProductId } = body;

    const pool = await getPool();

    // Build query based on recommendation type
    let query = `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.slug,
        p.base_price,
        p.rating,
        p.review_count,
        p.short_description,
        p.primary_image_url as image_url
      FROM products p
      WHERE p.is_active = 1 AND p.status = 'active'
    `;

    const params: any[] = [];

    // Add filters based on recommendation type
    if (recommendationType === 'trending') {
      query += ` ORDER BY p.review_count DESC, p.rating DESC LIMIT 8`;
    } else if (recommendationType === 'room-based' && roomType) {
      query += `
        INNER JOIN product_rooms pr ON p.product_id = pr.product_id
        WHERE pr.room_type = ?
        ORDER BY pr.suitability_score DESC, p.rating DESC
        LIMIT 8
      `;
      params.push(roomType);
    } else if (recommendationType === 'similar' && currentProductId) {
      query += `
        AND p.product_id != ?
        AND p.category_id = (SELECT category_id FROM products WHERE product_id = ?)
        ORDER BY p.rating DESC
        LIMIT 8
      `;
      params.push(currentProductId, currentProductId);
    } else {
      // Default: popular products
      query += ` ORDER BY p.rating DESC, p.review_count DESC LIMIT 8`;
    }

    const [rows] = await pool.execute<any[]>(query, params);

    // Add AI scoring
    const recommendations = rows.map((product: any, index: number) => ({
      ...product,
      score: 95 - (index * 5), // Simple scoring based on order
      reason: this.getRecommendationReason(recommendationType, roomType)
    }));

    return { recommendations };
  }

  private getRecommendationReason(type: string, roomType?: string): string {
    switch (type) {
      case 'trending':
        return 'Popular this week';
      case 'room-based':
        return `Perfect for ${roomType} rooms`;
      case 'similar':
        return 'Similar style and features';
      case 'personalized':
        return 'Based on your preferences';
      default:
        return 'Highly rated';
    }
  }
}