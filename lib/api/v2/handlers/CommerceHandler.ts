/**
 * Commerce Handler for V2 API
 * Handles products, cart, checkout, and orders
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { 
  productService, 
  cartService, 
  orderService,
  categoryService,
  settingsService,
  paymentService 
} from '@/lib/services/singletons';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { parseDecimal } from '@/lib/utils/priceUtils';

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
      'payment-methods': () => this.getPaymentMethods(req),
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
      'payment/process': () => this.processPayment(req, user),
      'payment/capture-paypal': () => this.capturePayPalPayment(req),
      'bulk-uploads': () => this.storeBulkUpload(req, user),
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

    const categories = await this.categoryService.getCategories({
      isFeatured: featured || undefined,
      limit: limit || undefined,
    });

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

    const { products, total } = await this.productService.getProducts(options);
    
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
        pricingMatrix: {
          query: `
            SELECT id, width_min, width_max, height_min, height_max, 
                   base_price, price_per_sqft
            FROM product_pricing_matrix
            WHERE product_id = ? AND is_active = 1
            ORDER BY width_min, height_min
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
      return {
        ...product,
        dimensions: configData.dimensions?.[0] || null,
        fabricOptions: configData.fabricOptions || [],
        controlTypes,
        rooms: configData.rooms?.map(r => r.room_type) || [],
        features: configData.features || [],
        images: configData.images || [],
        pricingMatrix: configData.pricingMatrix || [],
        fabricPricing: configData.fabricPricing || []
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
    const quantity = this.sanitizeNumber(searchParams.get('quantity'), 1) || 1;
    const couponCode = searchParams.get('coupon');

    const pricing = await this.productService.getProductPricing(
      productId,
      user?.userId || user?.user_id,
      quantity,
      couponCode || undefined
    );

    return pricing;
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
    
    console.log('getOrders - user object:', user);
    console.log('getOrders - user.user_id:', user.user_id);
    console.log('getOrders - user.userId:', user.userId);

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
    
    console.log('getOrders - found orders:', orders.length);
    console.log('getOrders - total:', total);
    
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
        JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
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
        min_amount: 0,
        max_amount: 999999,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
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
        min_amount: 10,
        max_amount: 10000,
        currencies: ['USD'],
        countries: ['US'],
        estimated_fee: 0,
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
}