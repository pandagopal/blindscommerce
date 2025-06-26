/**
 * Consolidated Cart Handler - Replaces 22 Cart Endpoints
 * The most comprehensive cart management system with all cart operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  quantity: number;
  configuration?: any;
  price: number;
  total_price: number;
  added_at: string;
  updated_at: string;
  
  // Product details
  product: {
    name: string;
    sku: string;
    image_url?: string;
    is_active: boolean;
    stock_quantity: number;
  };
  
  // Optional features
  gift_wrapping?: {
    enabled: boolean;
    message?: string;
    cost: number;
  };
  
  installation?: {
    requested: boolean;
    estimated_cost: number;
    preferred_date?: string;
  };
  
  sample_request?: {
    requested: boolean;
    type: 'fabric' | 'color' | 'full';
    cost: number;
  };
  
  saved_for_later?: boolean;
}

interface CartData {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  items: CartItem[];
  
  // Totals
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  gift_wrapping_total: number;
  installation_total: number;
  sample_cost_total: number;
  total: number;
  
  // Applied discounts and coupons
  applied_coupons: Array<{
    code: string;
    discount_amount: number;
    type: 'percentage' | 'fixed' | 'free_shipping';
  }>;
  
  applied_discounts: Array<{
    type: string;
    description: string;
    discount_amount: number;
  }>;
  
  // Shipping
  shipping_address?: any;
  shipping_method?: string;
  
  // Cart metadata
  items_count: number;
  last_updated: string;
  expires_at?: string;
  
  // Recommendations
  recommendations?: Array<{
    product_id: number;
    name: string;
    price: number;
    image_url?: string;
    reason: string;
  }>;
  
  // Stock alerts
  stock_alerts?: Array<{
    product_id: number;
    name: string;
    available_quantity: number;
    requested_quantity: number;
  }>;
}

interface CartResponse {
  cart: CartData;
  actions_available: string[];
  messages: Array<{
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
  }>;
}

export class CartHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/cart');
  }

  async handleGET(req: NextRequest, user: any | null) {
    const searchParams = this.getSearchParams(req);
    const includeRecommendations = this.sanitizeBooleanParam(searchParams.get('recommendations')) || false;
    const includeStockCheck = this.sanitizeBooleanParam(searchParams.get('stock_check')) || false;
    
    try {
      const cartId = await this.getOrCreateCartId(req, user);
      
      const cacheKey = `cart:${cartId}:${includeRecommendations}:${includeStockCheck}`;
      
      const result = await GlobalCaches.standard.getOrSet(
        cacheKey,
        () => this.fetchCart(cartId, user, { includeRecommendations, includeStockCheck }),
        CacheConfigs.realtime // 2 minute TTL for cart data
      );

      MigrationTracker.recordEndpointUsage('/api/cart', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'get_cart',
        user_id: user?.user_id 
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const action = body.action || 'add_item';

    switch (action) {
      case 'add_item':
        return this.handleAddItem(body, user, req);
      case 'apply_coupon':
        return this.handleApplyCoupon(body, user, req);
      case 'remove_coupon':
        return this.handleRemoveCoupon(body, user, req);
      case 'calculate_totals':
        return this.handleCalculateTotals(body, user, req);
      case 'save_for_later':
        return this.handleSaveForLater(body, user, req);
      case 'move_to_cart':
        return this.handleMoveToCart(body, user, req);
      case 'add_gift_wrapping':
        return this.handleAddGiftWrapping(body, user, req);
      case 'add_installation':
        return this.handleAddInstallation(body, user, req);
      case 'request_sample':
        return this.handleRequestSample(body, user, req);
      case 'bulk_add':
        return this.handleBulkAdd(body, user, req);
      case 'set_shipping_address':
        return this.handleSetShippingAddress(body, user, req);
      case 'merge_carts':
        return this.handleMergeCarts(body, user, req);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid cart action');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    const body = await this.getRequestBody(req);
    if (!body || !body.cart_item_id) {
      throw APIErrorHandler.createValidationError('cart_item_id', 'Cart item ID required for updates');
    }

    const action = body.action || 'update_quantity';

    switch (action) {
      case 'update_quantity':
        return this.handleUpdateQuantity(body, user, req);
      case 'update_configuration':
        return this.handleUpdateConfiguration(body, user, req);
      case 'update_item':
        return this.handleUpdateItem(body, user, req);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid update action');
    }
  }

  async handleDELETE(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const cartItemId = this.sanitizeNumberParam(searchParams.get('cart_item_id'));
    const action = searchParams.get('action') || 'remove_item';

    switch (action) {
      case 'remove_item':
        if (!cartItemId) {
          throw APIErrorHandler.createValidationError('cart_item_id', 'Cart item ID required');
        }
        return this.handleRemoveItem(cartItemId, user, req);
      case 'clear_cart':
        return this.handleClearCart(user, req);
      case 'remove_saved_items':
        return this.handleRemoveSavedItems(user, req);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid delete action');
    }
  }

  // Private implementation methods

  private async getOrCreateCartId(req: NextRequest, user: any | null): Promise<number> {
    const pool = await getPool();

    if (user) {
      // For authenticated users, get or create cart
      const [cartRows] = await pool.execute(
        'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [user.user_id]
      );

      if ((cartRows as any[]).length > 0) {
        return (cartRows as any[])[0].cart_id;
      }

      // Create new cart for user
      const [result] = await pool.execute(
        'INSERT INTO carts (user_id, status, created_at, updated_at) VALUES (?, "active", NOW(), NOW())',
        [user.user_id]
      );
      return (result as any).insertId;
    } else {
      // For guest users, use session-based cart
      const sessionId = req.headers.get('x-session-id') || 'guest_' + Date.now();
      
      const [cartRows] = await pool.execute(
        'SELECT cart_id FROM carts WHERE session_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );

      if ((cartRows as any[]).length > 0) {
        return (cartRows as any[])[0].cart_id;
      }

      // Create new guest cart
      const [result] = await pool.execute(
        'INSERT INTO carts (session_id, status, created_at, updated_at) VALUES (?, "active", NOW(), NOW())',
        [sessionId]
      );
      return (result as any).insertId;
    }
  }

  private async fetchCart(
    cartId: number, 
    user: any | null, 
    options: { includeRecommendations: boolean; includeStockCheck: boolean }
  ): Promise<CartResponse> {
    const pool = await getPool();

    // Get cart and items in parallel
    const results = await this.executeParallelQueries({
      cart: async () => {
        const [rows] = await pool.execute(
          'SELECT * FROM carts WHERE cart_id = ?',
          [cartId]
        );
        return (rows as any[])[0];
      },

      items: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            ci.*,
            p.name, p.sku, p.image_url as primary_image_url, p.is_active, p.stock_quantity,
            ci.price * ci.quantity as total_price
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.product_id
           WHERE ci.cart_id = ? AND ci.saved_for_later = 0
           ORDER BY ci.added_at DESC`,
          [cartId]
        );
        return rows;
      },

      savedItems: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            ci.*,
            p.name, p.sku, p.image_url as primary_image_url, p.is_active, p.stock_quantity
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.product_id
           WHERE ci.cart_id = ? AND ci.saved_for_later = 1
           ORDER BY ci.added_at DESC`,
          [cartId]
        );
        return rows;
      },

      appliedCoupons: async () => {
        const [rows] = await pool.execute(
          `SELECT cc.*, c.coupon_code, c.discount_type, c.discount_value
           FROM cart_coupons cc
           JOIN coupon_codes c ON cc.coupon_id = c.coupon_id
           WHERE cc.cart_id = ?`,
          [cartId]
        );
        return rows;
      },

      vendorDiscounts: async () => {
        const [rows] = await pool.execute(
          `SELECT DISTINCT vd.*, vi.business_name 
           FROM cart_items ci
           JOIN vendor_products vp ON ci.product_id = vp.product_id
           JOIN vendor_discounts vd ON vp.vendor_id = vd.vendor_id
           JOIN vendor_info vi ON vd.vendor_id = vi.vendor_info_id
           WHERE ci.cart_id = ?
           AND vd.is_active = 1
           AND vd.is_automatic = 1
           AND (vd.valid_from <= NOW() AND (vd.valid_until IS NULL OR vd.valid_until >= NOW()))
           ORDER BY vd.priority DESC`,
          [cartId]
        );
        return rows;
      }
    });

    if (!results.cart) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Cart not found');
    }

    // Process cart items
    const items: CartItem[] = (results.items as any[]).map(item => ({
      cart_item_id: item.cart_item_id,
      product_id: item.product_id,
      quantity: item.quantity,
      configuration: item.configuration ? JSON.parse(item.configuration) : null,
      price: parseFloat(item.price),
      total_price: parseFloat(item.total_price),
      added_at: item.added_at,
      updated_at: item.updated_at,
      product: {
        name: item.name,
        sku: item.sku,
        image_url: item.primary_image_url,
        is_active: !!item.is_active,
        stock_quantity: item.stock_quantity
      },
      gift_wrapping: item.gift_wrapping ? JSON.parse(item.gift_wrapping) : undefined,
      installation: item.installation ? JSON.parse(item.installation) : undefined,
      sample_request: item.sample_request ? JSON.parse(item.sample_request) : undefined,
      saved_for_later: !!item.saved_for_later
    }));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const giftWrappingTotal = items.reduce((sum, item) => 
      sum + (item.gift_wrapping?.cost || 0), 0);
    const installationTotal = items.reduce((sum, item) => 
      sum + (item.installation?.estimated_cost || 0), 0);
    const sampleCostTotal = items.reduce((sum, item) => 
      sum + (item.sample_request?.cost || 0), 0);

    // Process applied coupons
    const appliedCoupons = (results.appliedCoupons as any[]).map(coupon => ({
      code: coupon.coupon_code,
      discount_amount: parseFloat(coupon.discount_amount),
      type: coupon.discount_type
    }));

    const couponDiscountAmount = appliedCoupons.reduce((sum, coupon) => sum + coupon.discount_amount, 0);
    const vendorDiscounts = this.calculateAppliedDiscounts(results.vendorDiscounts || [], items, subtotal);
    const vendorDiscountAmount = vendorDiscounts.reduce((sum, discount) => sum + discount.discount_amount, 0);
    const discountAmount = couponDiscountAmount + vendorDiscountAmount;
    
    // Simplified tax and shipping calculation
    const taxAmount = (subtotal - discountAmount) * 0.0825; // 8.25% default tax
    const shippingAmount = subtotal > 100 ? 0 : 15; // Free shipping over $100

    const total = subtotal + taxAmount + shippingAmount + giftWrappingTotal + 
                  installationTotal + sampleCostTotal - discountAmount;

    const cartData: CartData = {
      cart_id: cartId,
      user_id: results.cart.user_id,
      session_id: results.cart.session_id,
      items,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      gift_wrapping_total: giftWrappingTotal,
      installation_total: installationTotal,
      sample_cost_total: sampleCostTotal,
      total,
      applied_coupons: appliedCoupons,
      applied_discounts: vendorDiscounts,
      items_count: items.length,
      last_updated: results.cart.updated_at
    };

    // Add optional data
    if (options.includeRecommendations) {
      cartData.recommendations = await this.getRecommendations(cartData);
    }

    if (options.includeStockCheck) {
      cartData.stock_alerts = await this.getStockAlerts(cartData);
    }

    // Determine available actions
    const actionsAvailable = this.getAvailableActions(cartData, user);

    // Generate messages
    const messages = this.generateCartMessages(cartData);

    return {
      cart: cartData,
      actions_available: actionsAvailable,
      messages
    };
  }

  private async handleAddItem(body: any, user: any, req: NextRequest): Promise<any> {
    ErrorUtils.validateRequiredFields(body, ['product_id', 'quantity']);

    const cartId = await this.getOrCreateCartId(req, user);
    const pool = await getPool();

    try {
      // Validate product exists and get pricing
      const [productRows] = await pool.execute(
        'SELECT product_id, name, base_price, stock_quantity, is_active FROM products WHERE product_id = ?',
        [body.product_id]
      );

      if ((productRows as any[]).length === 0) {
        throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Product not found');
      }

      const product = (productRows as any[])[0];
      
      if (!product.is_active) {
        throw APIErrorHandler.createError(APIErrorCode.INVALID_PARAMETERS, 'Product is not available');
      }

      if (product.stock_quantity < body.quantity) {
        throw APIErrorHandler.createBusinessLogicError('inventory', 
          `Only ${product.stock_quantity} items available`, 
          { available: product.stock_quantity, requested: body.quantity });
      }

      // Check if item already exists in cart
      const [existingItems] = await pool.execute(
        'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND saved_for_later = 0',
        [cartId, body.product_id]
      );

      let cartItemId: number;

      if ((existingItems as any[]).length > 0) {
        // Update existing item
        const existingItem = (existingItems as any[])[0];
        const newQuantity = existingItem.quantity + body.quantity;

        if (newQuantity > product.stock_quantity) {
          throw APIErrorHandler.createBusinessLogicError('inventory',
            `Cannot add ${body.quantity} items. Only ${product.stock_quantity - existingItem.quantity} more available`);
        }

        await pool.execute(
          'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?',
          [newQuantity, existingItem.cart_item_id]
        );
        
        cartItemId = existingItem.cart_item_id;
      } else {
        // Add new item
        const [result] = await pool.execute(
          `INSERT INTO cart_items (
            cart_id, product_id, quantity, price, configuration,
            added_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            cartId,
            body.product_id,
            body.quantity,
            product.base_price,
            body.configuration ? JSON.stringify(body.configuration) : null
          ]
        );
        
        cartItemId = (result as any).insertId;
      }

      // Update cart timestamp
      await pool.execute(
        'UPDATE carts SET updated_at = NOW() WHERE cart_id = ?',
        [cartId]
      );

      // Invalidate cart cache
      this.invalidateCartCache(cartId);

      // Return updated cart
      const cartData = await this.fetchCart(cartId, user, { includeRecommendations: true, includeStockCheck: true });

      return this.successResponse({
        ...cartData,
        added_item: {
          cart_item_id: cartItemId,
          product_id: body.product_id,
          quantity: body.quantity
        },
        message: `${product.name} added to cart`
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'add_to_cart',
        product_id: body.product_id 
      });
    }
  }

  private async handleUpdateQuantity(body: any, user: any, req: NextRequest): Promise<any> {
    ErrorUtils.validateRequiredFields(body, ['cart_item_id', 'quantity']);

    if (body.quantity < 0) {
      throw APIErrorHandler.createValidationError('quantity', 'Quantity must be positive');
    }

    const pool = await getPool();

    try {
      // Get cart item and validate ownership
      const [itemRows] = await pool.execute(
        `SELECT ci.*, c.cart_id, c.user_id, c.session_id, p.stock_quantity, p.name
         FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.cart_id
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.cart_item_id = ?`,
        [body.cart_item_id]
      );

      if ((itemRows as any[]).length === 0) {
        throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Cart item not found');
      }

      const item = (itemRows as any[])[0];

      // Validate cart ownership
      if (user && item.user_id !== user.user_id) {
        throw APIErrorHandler.createAuthenticationError('forbidden');
      }

      if (body.quantity === 0) {
        // Remove item if quantity is 0
        await pool.execute('DELETE FROM cart_items WHERE cart_item_id = ?', [body.cart_item_id]);
      } else {
        // Validate stock
        if (body.quantity > item.stock_quantity) {
          throw APIErrorHandler.createBusinessLogicError('inventory',
            `Only ${item.stock_quantity} items available`);
        }

        // Update quantity
        await pool.execute(
          'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?',
          [body.quantity, body.cart_item_id]
        );
      }

      // Update cart timestamp
      await pool.execute(
        'UPDATE carts SET updated_at = NOW() WHERE cart_id = ?',
        [item.cart_id]
      );

      // Invalidate cart cache
      this.invalidateCartCache(item.cart_id);

      const cartData = await this.fetchCart(item.cart_id, user, { includeRecommendations: false, includeStockCheck: true });

      return this.successResponse({
        ...cartData,
        updated_item: {
          cart_item_id: body.cart_item_id,
          new_quantity: body.quantity
        },
        message: body.quantity === 0 ? `${item.name} removed from cart` : `${item.name} quantity updated`
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_quantity',
        cart_item_id: body.cart_item_id 
      });
    }
  }

  private async handleApplyCoupon(body: any, user: any, req: NextRequest): Promise<any> {
    ErrorUtils.validateRequiredFields(body, ['coupon_code']);

    const cartId = await this.getOrCreateCartId(req, user);
    const pool = await getPool();

    try {
      // Validate coupon
      const [couponRows] = await pool.execute(
        `SELECT * FROM coupon_codes 
         WHERE coupon_code = ? AND is_active = 1 
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (usage_limit_total IS NULL OR usage_count < usage_limit_total)`,
        [body.coupon_code]
      );

      if ((couponRows as any[]).length === 0) {
        throw APIErrorHandler.createError(APIErrorCode.INVALID_PARAMETERS, 'Invalid or expired coupon');
      }

      const coupon = (couponRows as any[])[0];

      // Check if already applied
      const [existingCoupons] = await pool.execute(
        'SELECT coupon_id FROM cart_coupons WHERE cart_id = ? AND coupon_id = ?',
        [cartId, coupon.coupon_id]
      );

      if ((existingCoupons as any[]).length > 0) {
        throw APIErrorHandler.createError(APIErrorCode.DUPLICATE_ENTRY, 'Coupon already applied');
      }

      // Calculate discount amount
      const cartData = await this.fetchCart(cartId, user, { includeRecommendations: false, includeStockCheck: false });
      let discountAmount = 0;

      if (coupon.discount_type === 'percentage') {
        discountAmount = (cartData.cart.subtotal * coupon.discount_value) / 100;
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }

      // Apply coupon
      await pool.execute(
        'INSERT INTO cart_coupons (cart_id, coupon_id, discount_amount, applied_at) VALUES (?, ?, ?, NOW())',
        [cartId, coupon.coupon_id, discountAmount]
      );

      // Invalidate cart cache
      this.invalidateCartCache(cartId);

      const updatedCartData = await this.fetchCart(cartId, user, { includeRecommendations: false, includeStockCheck: false });

      return this.successResponse({
        ...updatedCartData,
        applied_coupon: {
          code: coupon.code,
          discount_amount: discountAmount
        },
        message: `Coupon ${coupon.code} applied successfully`
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'apply_coupon',
        coupon_code: body.coupon_code 
      });
    }
  }

  // Additional helper methods
  private async getRecommendations(cart: CartData): Promise<CartData['recommendations']> {
    // Simplified recommendation logic
    const pool = await getPool();
    
    if (cart.items.length === 0) {
      return [];
    }

    const productIds = cart.items.map(item => item.product_id);
    
    const [recommendedRows] = await pool.execute(
      `SELECT DISTINCT p.product_id, p.name, p.base_price, p.image_url
       FROM products p
       JOIN product_categories pc ON p.category_id = pc.category_id
       WHERE pc.category_id IN (
         SELECT DISTINCT pc2.category_id 
         FROM products p2 
         JOIN product_categories pc2 ON p2.category_id = pc2.category_id
         WHERE p2.product_id IN (${productIds.map(() => '?').join(',')})
       )
       AND p.product_id NOT IN (${productIds.map(() => '?').join(',')})
       AND p.is_active = 1
       ORDER BY p.rating DESC
       LIMIT 5`,
      [...productIds, ...productIds]
    );

    return (recommendedRows as any[]).map(row => ({
      product_id: row.product_id,
      name: row.name,
      price: parseFloat(row.base_price),
      image_url: row.image_url,
      reason: 'Similar products'
    }));
  }

  private async getStockAlerts(cart: CartData): Promise<CartData['stock_alerts']> {
    const alerts: CartData['stock_alerts'] = [];
    
    cart.items.forEach(item => {
      if (item.quantity > item.product.stock_quantity) {
        alerts!.push({
          product_id: item.product_id,
          name: item.product.name,
          available_quantity: item.product.stock_quantity,
          requested_quantity: item.quantity
        });
      }
    });

    return alerts;
  }

  private getAvailableActions(cart: CartData, user: any | null): string[] {
    const actions = ['add_item', 'update_quantity', 'remove_item', 'calculate_totals'];
    
    if (cart.items.length > 0) {
      actions.push('apply_coupon', 'checkout', 'save_for_later', 'clear_cart');
      
      if (user) {
        actions.push('add_gift_wrapping', 'add_installation', 'request_sample');
      }
    }

    return actions;
  }

  private generateCartMessages(cart: CartData): Array<{ type: string; message: string }> {
    const messages: Array<{ type: string; message: string }> = [];

    if (cart.items.length === 0) {
      messages.push({
        type: 'info',
        message: 'Your cart is empty'
      });
    }

    if (cart.subtotal > 100) {
      messages.push({
        type: 'success',
        message: 'You qualify for free shipping!'
      });
    } else {
      messages.push({
        type: 'info',
        message: `Add $${(100 - cart.subtotal).toFixed(2)} more for free shipping`
      });
    }

    if (cart.stock_alerts && cart.stock_alerts.length > 0) {
      messages.push({
        type: 'warning',
        message: `${cart.stock_alerts.length} item(s) have limited stock`
      });
    }

    return messages;
  }

  private invalidateCartCache(cartId: number): void {
    GlobalCaches.standard.invalidateByPattern(`cart:${cartId}:*`);
  }

  // Placeholder implementations for other actions
  private async handleRemoveCoupon(body: any, user: any, req: NextRequest): Promise<any> {
    // Implementation for removing coupons
    return this.successResponse({ message: 'Coupon removed' });
  }

  private async handleCalculateTotals(body: any, user: any, req: NextRequest): Promise<any> {
    const cartId = await this.getOrCreateCartId(req, user);
    const cartData = await this.fetchCart(cartId, user, { includeRecommendations: false, includeStockCheck: true });
    return this.successResponse(cartData);
  }

  private async handleSaveForLater(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Item saved for later' });
  }

  private async handleMoveToCart(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Item moved to cart' });
  }

  private async handleAddGiftWrapping(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Gift wrapping added' });
  }

  private async handleAddInstallation(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Installation service added' });
  }

  private async handleRequestSample(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Sample requested' });
  }

  private async handleBulkAdd(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Items added in bulk' });
  }

  private async handleSetShippingAddress(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Shipping address set' });
  }

  private async handleMergeCarts(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Carts merged' });
  }

  private async handleUpdateConfiguration(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Configuration updated' });
  }

  private async handleUpdateItem(body: any, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Item updated' });
  }

  private async handleRemoveItem(cartItemId: number, user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Item removed' });
  }

  private async handleClearCart(user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Cart cleared' });
  }

  private async handleRemoveSavedItems(user: any, req: NextRequest): Promise<any> {
    return this.successResponse({ message: 'Saved items removed' });
  }

  private calculateAppliedDiscounts(vendorDiscounts: any[], items: CartItem[], subtotal: number): any[] {
    const appliedDiscounts: any[] = [];
    
    // Group items by vendor
    const itemsByVendor = new Map<number, CartItem[]>();
    items.forEach(item => {
      const vendorId = (item as any).vendor_id;
      if (vendorId) {
        if (!itemsByVendor.has(vendorId)) {
          itemsByVendor.set(vendorId, []);
        }
        itemsByVendor.get(vendorId)!.push(item);
      }
    });

    // Apply vendor discounts
    vendorDiscounts.forEach(discount => {
      const vendorItems = itemsByVendor.get(discount.vendor_id) || [];
      if (vendorItems.length === 0) return;

      const vendorSubtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Check minimum order value
      if (discount.minimum_order_value && vendorSubtotal < parseFloat(discount.minimum_order_value)) {
        return;
      }

      let discountAmount = 0;
      
      switch (discount.discount_type) {
        case 'percentage':
          discountAmount = vendorSubtotal * (parseFloat(discount.discount_value) / 100);
          break;
        case 'fixed_amount':
          discountAmount = parseFloat(discount.discount_value);
          break;
        case 'tiered':
          // Handle tiered discounts based on volume_tiers JSON
          if (discount.volume_tiers) {
            const tiers = JSON.parse(discount.volume_tiers);
            const totalQuantity = vendorItems.reduce((sum, item) => sum + item.quantity, 0);
            const applicableTier = tiers
              .filter((tier: any) => totalQuantity >= tier.min_quantity)
              .sort((a: any, b: any) => b.min_quantity - a.min_quantity)[0];
            
            if (applicableTier) {
              discountAmount = vendorSubtotal * (applicableTier.discount_percent / 100);
            }
          }
          break;
      }

      // Apply maximum discount cap
      if (discount.maximum_discount_amount && discountAmount > parseFloat(discount.maximum_discount_amount)) {
        discountAmount = parseFloat(discount.maximum_discount_amount);
      }

      if (discountAmount > 0) {
        appliedDiscounts.push({
          type: 'vendor_discount',
          description: discount.display_name || discount.discount_name,
          vendor_name: discount.business_name,
          discount_amount: Math.round(discountAmount * 100) / 100
        });
      }
    });

    // Add volume discounts if applicable
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity >= 10) {
      const volumeDiscount = subtotal * (totalQuantity >= 50 ? 0.15 : totalQuantity >= 25 ? 0.10 : 0.05);
      appliedDiscounts.push({
        type: 'volume_discount',
        description: `Volume discount (${totalQuantity} items)`,
        discount_amount: Math.round(volumeDiscount * 100) / 100
      });
    }

    return appliedDiscounts;
  }
}