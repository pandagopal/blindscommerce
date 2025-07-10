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
  settingsService 
} from '@/lib/services/singletons';
import { z } from 'zod';

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
      console.log('Raw request body:', JSON.stringify(body, null, 2));
      
      // Manually validate to see what's happening
      let data;
      try {
        data = AddToCartSchema.parse(body);
      } catch (validationError) {
        console.error('Validation error details:', validationError);
        throw new ApiError(`Validation error: ${validationError.message}`, 400);
      }
      
      console.log('AddToCart validated data:', {
        userId: user?.userId || user?.user_id,
        sessionId: !user ? sessionId : 'authenticated user',
        data: JSON.stringify(data, null, 2)
      });

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

    return { message: 'Cart item updated successfully' };
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
      user?.user_id
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
      userId: user.user_id,
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

  private async createOrder(req: NextRequest, user: any) {
    this.requireAuth(user);

    const data = await this.getValidatedBody(req, CreateOrderSchema);

    const order = await this.orderService.createOrder({
      user_id: user.user_id,
      items: data.items,
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
    const body = await req.json();
    
    // Calculate pricing for cart items
    let subtotal = 0;
    let totalDiscount = 0;
    const vendorDiscounts: any[] = [];
    const vendorCoupons: any[] = [];
    
    // Calculate subtotal
    for (const item of body.items) {
      subtotal += item.base_price * item.quantity;
    }
    
    // Apply customer-specific pricing if authenticated
    if ((user?.userId || user?.user_id) && body.customer_id) {
      // Customer-specific pricing logic here
    }
    
    // Apply coupon if provided
    if (body.coupon_code) {
      // Coupon validation and discount calculation
    }
    
    // Calculate tax if ZIP code provided
    let tax = 0;
    let taxRate = 0;
    let taxBreakdown = null;
    let taxJurisdiction = null;
    
    if (body.zip_code) {
      // Simple tax calculation - in real app, use tax API
      taxRate = 0.0825; // Default 8.25% tax rate
      tax = subtotal * taxRate;
      taxBreakdown = {
        state_tax: subtotal * 0.0625,
        county_tax: subtotal * 0.01,
        city_tax: subtotal * 0.01,
        special_district_tax: 0
      };
      taxJurisdiction = "Texas";
    }
    
    const shipping = subtotal >= 100 ? 0 : 15; // Free shipping over $100
    const total = subtotal - totalDiscount + shipping + tax;
    
    return {
      success: true,
      data: {
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
        vendors_in_cart: 1,
        applied_promotions: body.coupon_code ? { coupon_code: body.coupon_code } : {}
      }
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
    
    // In a real app, this would integrate with payment providers
    // For now, simulate successful payment
    return {
      success: true,
      provider_response: {
        id: `pay_${Date.now()}`,
        status: 'succeeded',
        amount: body.amount,
        currency: body.currency
      }
    };
  }

  private async createGuestOrder(req: NextRequest) {
    const body = await req.json();
    
    // Create order for guest user
    const orderNumber = `ORD-${Date.now()}`;
    
    // In a real app, save order to database
    // If createAccount is true, also create user account
    
    return {
      success: true,
      orderNumber,
      message: 'Order created successfully'
    };
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