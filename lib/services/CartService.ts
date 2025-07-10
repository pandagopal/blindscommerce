/**
 * Cart Service for BlindsCommerce
 * Handles all cart-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseArrayPrices, parseDecimal, parsePriceFields } from '@/lib/utils/priceUtils';

interface CartItem extends RowDataPacket {
  cart_item_id: number;
  user_id: number;
  session_id?: string;
  product_id: number;
  vendor_id: number;
  quantity: number;
  configuration?: any;
  price: number;
  discount_amount?: number;
  created_at: Date;
  updated_at: Date;
}

interface CartItemWithDetails extends CartItem {
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image: string;
  vendor_name: string;
  base_price: number;
  vendor_price: number;
  final_price: number;
  in_stock: boolean;
  stock_quantity: number;
}

interface CartSummary {
  items: CartItemWithDetails[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  vendorBreakdown: Array<{
    vendor_id: number;
    vendor_name: string;
    subtotal: number;
    discount: number;
    itemCount: number;
  }>;
}

export class CartService extends BaseService {
  constructor() {
    super('cart_items', 'cart_item_id');
  }

  /**
   * Get complete cart with all details in optimized queries
   */
  async getCart(
    userId?: number,
    sessionId?: string
  ): Promise<CartSummary> {
    if (!userId && !sessionId) {
      return this.getEmptyCart();
    }

    // First get the cart
    let cartId: number | null = null;
    
    if (userId) {
      const [cart] = await this.executeQuery<{cart_id: number}>(
        'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
        [userId]
      );
      cartId = cart?.cart_id || null;
    } else if (sessionId) {
      const [cart] = await this.executeQuery<{cart_id: number}>(
        'SELECT cart_id FROM carts WHERE session_id = ? AND status = "active" LIMIT 1',
        [sessionId]
      );
      cartId = cart?.cart_id || null;
    }

    if (!cartId) {
      return this.getEmptyCart();
    }

    // Get cart items with all product and pricing details
    const itemsQuery = `
      SELECT 
        ci.*,
        p.name as product_name,
        p.slug as product_slug,
        p.sku as product_sku,
        p.primary_image_url as product_image,
        p.base_price,
        JSON_UNQUOTE(JSON_EXTRACT(ci.configuration, '$.vendorId')) as vendor_id,
        vi.business_name as vendor_name,
        vp.vendor_price,
        vp.quantity_available as stock_quantity,
        
        -- Calculate final price
        GREATEST(0,
          COALESCE(vp.vendor_price, p.base_price) * ci.quantity
        ) as final_price,
        
        -- Stock status
        CASE 
          WHEN vp.quantity_available >= ci.quantity THEN 1 
          ELSE 0 
        END as in_stock
        
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN vendor_products vp ON ci.product_id = vp.product_id 
        AND vp.vendor_id = JSON_UNQUOTE(JSON_EXTRACT(ci.configuration, '$.vendorId'))
      JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `;

    const rawItems = await this.executeQuery<CartItemWithDetails>(itemsQuery, [cartId]);
    const items = parseArrayPrices(rawItems, [
      'price_at_add', 'vendor_price', 'base_price', 'seasonal_discount_amount', 'final_price'
    ]);

    if (items.length === 0) {
      return this.getEmptyCart();
    }

    // Calculate totals and vendor breakdown
    let subtotal = 0;
    let totalDiscount = 0;
    const vendorMap = new Map<number, any>();

    items.forEach(item => {
      const itemSubtotal = parseDecimal(item.vendor_price || item.base_price) * item.quantity;
      subtotal += itemSubtotal;
      totalDiscount += parseDecimal(item.seasonal_discount_amount || 0);

      // Vendor breakdown
      if (!vendorMap.has(item.vendor_id)) {
        vendorMap.set(item.vendor_id, {
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          subtotal: 0,
          discount: 0,
          itemCount: 0
        });
      }

      const vendor = vendorMap.get(item.vendor_id);
      vendor.subtotal += itemSubtotal;
      vendor.discount += item.seasonal_discount_amount || 0;
      vendor.itemCount++;
    });

    // Calculate tax (simplified - should use actual tax calculation service)
    const totalTax = (subtotal - totalDiscount) * 0.0825; // 8.25% tax rate

    // Calculate shipping (simplified - should use actual shipping calculation)
    const shippingCost = subtotal >= 100 ? 0 : 9.99; // Free shipping over $100

    // Transform items to ensure proper field mapping
    const transformedItems = items.map(item => {
      // Parse configuration if it's a string
      let config = item.configuration;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          config = {};
        }
      }
      
      return {
        ...item,
        // Extract display fields from configuration or use product fields
        name: config?.name || item.product_name,
        slug: config?.slug || item.product_slug,
        image: config?.image || item.product_image,
        unit_price: config?.unit_price || item.price_at_add || item.vendor_price || item.base_price,
        // Ensure configuration is an object
        configuration: config || {},
        // Ensure vendor_id is available
        vendor_id: item.vendor_id || config?.vendorId || config?.vendor_id
      };
    });

    return {
      items: transformedItems,
      subtotal,
      totalDiscount,
      totalTax,
      shippingCost,
      total: subtotal - totalDiscount + totalTax + shippingCost,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      vendorBreakdown: Array.from(vendorMap.values())
    };
  }

  /**
   * Add item to cart with duplicate checking
   */
  async addToCart(
    data: {
      userId?: number;
      sessionId?: string;
      productId: number;
      vendorId: number;
      quantity: number;
      configuration?: any;
    }
  ): Promise<CartItemWithDetails | null> {
    console.log('CartService.addToCart called with:', JSON.stringify(data, null, 2));
    
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // First, get or create cart
      let cartId: number;
      
      if (data.userId) {
        // For authenticated users
        const [existingCart] = await connection.execute<RowDataPacket[]>(
          'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
          [data.userId]
        );
        
        if (existingCart[0]) {
          cartId = existingCart[0].cart_id;
        } else {
          const [newCart] = await connection.execute<ResultSetHeader>(
            'INSERT INTO carts (user_id, status) VALUES (?, "active")',
            [data.userId]
          );
          cartId = newCart.insertId;
        }
      } else if (data.sessionId) {
        // For guest users
        const [existingCart] = await connection.execute<RowDataPacket[]>(
          'SELECT cart_id FROM carts WHERE session_id = ? AND status = "active" LIMIT 1',
          [data.sessionId]
        );
        
        if (existingCart[0]) {
          cartId = existingCart[0].cart_id;
        } else {
          const [newCart] = await connection.execute<ResultSetHeader>(
            'INSERT INTO carts (session_id, status) VALUES (?, "active")',
            [data.sessionId]
          );
          cartId = newCart.insertId;
        }
      } else {
        throw new Error('User ID or Session ID required');
      }

      // Check if item already exists in cart
      // For now, just check product_id and vendor_id to avoid complex configuration matching
      const existingQuery = `
        SELECT cart_item_id, quantity 
        FROM cart_items 
        WHERE cart_id = ?
          AND product_id = ? 
          AND JSON_UNQUOTE(JSON_EXTRACT(configuration, '$.vendorId')) = ?
        LIMIT 1
      `;

      const existingParams = [
        cartId,
        data.productId,
        data.vendorId.toString()
      ];

      const [existing] = await connection.execute<RowDataPacket[]>(
        existingQuery,
        existingParams
      );

      let cartItemId: number;

      if (existing[0]) {
        // Update quantity
        const newQuantity = existing[0].quantity + data.quantity;
        await connection.execute(
          'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?',
          [newQuantity, existing[0].cart_item_id]
        );
        cartItemId = existing[0].cart_item_id;
      } else {
        // Get product price
        const [priceResult] = await connection.execute<RowDataPacket[]>(
          `SELECT 
            COALESCE(vp.vendor_price, p.base_price) as price
          FROM products p
          LEFT JOIN vendor_products vp ON p.product_id = vp.product_id 
            AND vp.vendor_id = ?
          WHERE p.product_id = ?`,
          [data.vendorId, data.productId]
        );

        const price = priceResult[0]?.price || 0;

        // Insert new item - include vendor_id in configuration
        const configWithVendor = {
          ...(data.configuration || {}),
          vendorId: data.vendorId
        };
        
        const insertQuery = `
          INSERT INTO cart_items (
            cart_id, product_id, quantity, configuration, 
            price_at_add, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await connection.execute<ResultSetHeader>(
          insertQuery,
          [
            cartId,
            data.productId,
            data.quantity,
            JSON.stringify(configWithVendor),
            price
          ]
        );

        cartItemId = result.insertId;
      }

      await connection.commit();

      // Get the cart item with details
      const [item] = await this.executeQuery<CartItemWithDetails>(
        `SELECT 
          ci.*,
          p.name as product_name,
          p.slug as product_slug,
          p.sku as product_sku,
          p.primary_image_url as product_image,
          p.base_price,
          JSON_UNQUOTE(JSON_EXTRACT(ci.configuration, '$.vendorId')) as vendor_id,
          vi.business_name as vendor_name,
          vp.vendor_price,
          vp.quantity_available as stock_quantity,
          COALESCE(vp.vendor_price, p.base_price) * ci.quantity as final_price,
          CASE WHEN vp.quantity_available >= ci.quantity THEN 1 ELSE 0 END as in_stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        JOIN vendor_products vp ON ci.product_id = vp.product_id 
          AND vp.vendor_id = JSON_UNQUOTE(JSON_EXTRACT(ci.configuration, '$.vendorId'))
        JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
        WHERE ci.cart_item_id = ?`,
        [cartItemId]
      );

      return item || null;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(
    cartItemId: number,
    quantity: number,
    userId?: number
  ): Promise<boolean> {
    if (quantity <= 0) {
      return this.removeFromCart(cartItemId, userId);
    }

    // If userId provided, verify the cart item belongs to user's cart
    if (userId) {
      const [item] = await this.executeQuery<{cart_id: number}>(
        `SELECT ci.cart_id FROM cart_items ci 
         JOIN carts c ON ci.cart_id = c.cart_id 
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );
      
      if (!item) {
        return false; // Item doesn't belong to user
      }
    }

    const result = await this.executeMutation(
      `UPDATE cart_items 
       SET quantity = ?, updated_at = NOW() 
       WHERE cart_item_id = ?`,
      [quantity, cartItemId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Update cart item configuration (for editing items)
   */
  async updateCartItemConfiguration(
    cartItemId: number,
    quantity: number,
    configuration: any,
    userId?: number
  ): Promise<boolean> {
    // If userId provided, verify the cart item belongs to user's cart
    if (userId) {
      const [item] = await this.executeQuery<{cart_id: number}>(
        `SELECT ci.cart_id FROM cart_items ci 
         JOIN carts c ON ci.cart_id = c.cart_id 
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );
      
      if (!item) {
        return false; // Item doesn't belong to user
      }
    }

    // Update both quantity and configuration
    const result = await this.executeMutation(
      `UPDATE cart_items 
       SET quantity = ?, configuration = ?, updated_at = NOW() 
       WHERE cart_item_id = ?`,
      [quantity, JSON.stringify(configuration), cartItemId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    cartItemId: number,
    userId?: number
  ): Promise<boolean> {
    // If userId provided, verify the cart item belongs to user's cart
    if (userId) {
      const [item] = await this.executeQuery<{cart_id: number}>(
        `SELECT ci.cart_id FROM cart_items ci 
         JOIN carts c ON ci.cart_id = c.cart_id 
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );
      
      if (!item) {
        return false; // Item doesn't belong to user
      }
    }

    const result = await this.executeMutation(
      `DELETE FROM cart_items WHERE cart_item_id = ?`,
      [cartItemId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId?: number, sessionId?: string): Promise<boolean> {
    if (!userId && !sessionId) return false;

    // Get the cart first
    let cartId: number | null = null;
    
    if (userId) {
      const [cart] = await this.executeQuery<{cart_id: number}>(
        'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
        [userId]
      );
      cartId = cart?.cart_id || null;
    } else if (sessionId) {
      const [cart] = await this.executeQuery<{cart_id: number}>(
        'SELECT cart_id FROM carts WHERE session_id = ? AND status = "active" LIMIT 1',
        [sessionId]
      );
      cartId = cart?.cart_id || null;
    }

    if (!cartId) return false;

    const result = await this.executeMutation(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(
    couponCode: string,
    userId?: number,
    sessionId?: string
  ): Promise<{
    success: boolean;
    message: string;
    discount?: number;
  }> {
    // Get cart items
    const cart = await this.getCart(userId, sessionId);
    if (cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }

    // Validate coupon
    const [coupon] = await this.executeQuery<any>(
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
      [couponCode]
    );

    if (!coupon) {
      return { success: false, message: 'Invalid or expired coupon code' };
    }

    // Check if coupon applies to any items in cart
    const applicableItems = cart.items.filter(item => item.vendor_id === coupon.vendor_id);
    
    if (applicableItems.length === 0) {
      return { 
        success: false, 
        message: `This coupon is only valid for ${coupon.vendor_name} products` 
      };
    }

    // Calculate discount
    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + (item.vendor_price || item.base_price) * item.quantity,
      0
    );

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = applicableSubtotal * (coupon.discount_value / 100);
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = Math.min(coupon.discount_value, applicableSubtotal);
    }

    // Apply discount to items
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update cart items with discount
      for (const item of applicableItems) {
        const itemDiscount = (discountAmount / applicableSubtotal) * 
          ((item.vendor_price || item.base_price) * item.quantity);
        
        await connection.execute(
          'UPDATE cart_items SET discount_amount = ?, coupon_code = ? WHERE cart_item_id = ?',
          [itemDiscount, couponCode, item.cart_item_id]
        );
      }

      await connection.commit();

      return {
        success: true,
        message: `Coupon applied successfully! You saved $${discountAmount.toFixed(2)}`,
        discount: discountAmount
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Merge guest cart with user cart after login
   */
  async mergeCart(sessionId: string, userId: number): Promise<void> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get guest cart items
      const [guestItems] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cart_items WHERE session_id = ?',
        [sessionId]
      );

      for (const guestItem of guestItems) {
        // Check if user already has this item
        const [existing] = await connection.execute<RowDataPacket[]>(
          `SELECT cart_item_id, quantity 
           FROM cart_items 
           WHERE user_id = ? 
             AND product_id = ? 
             AND vendor_id = ?
             AND configuration = ?`,
          [userId, guestItem.product_id, guestItem.vendor_id, guestItem.configuration]
        );

        if (existing[0]) {
          // Update quantity
          await connection.execute(
            'UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?',
            [guestItem.quantity, existing[0].cart_item_id]
          );
          
          // Delete guest item
          await connection.execute(
            'DELETE FROM cart_items WHERE cart_item_id = ?',
            [guestItem.cart_item_id]
          );
        } else {
          // Transfer to user
          await connection.execute(
            'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE cart_item_id = ?',
            [userId, guestItem.cart_item_id]
          );
        }
      }

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get empty cart structure
   */
  private getEmptyCart(): CartSummary {
    return {
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      shippingCost: 0,
      total: 0,
      itemCount: 0,
      vendorBreakdown: []
    };
  }
}