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

    // Build WHERE clause
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (userId) {
      whereConditions.push('ci.user_id = ?');
      whereParams.push(userId);
    } else if (sessionId) {
      whereConditions.push('ci.session_id = ?');
      whereParams.push(sessionId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get cart items with all product and pricing details
    const itemsQuery = `
      SELECT 
        ci.*,
        p.name as product_name,
        p.slug as product_slug,
        p.sku as product_sku,
        p.primary_image_url as product_image,
        p.base_price,
        vi.business_name as vendor_name,
        vp.vendor_price,
        vp.quantity_available as stock_quantity,
        
        -- Calculate final price with discounts
        GREATEST(0,
          COALESCE(vp.vendor_price, p.base_price) * ci.quantity
          - COALESCE(ci.discount_amount, 0)
        ) as final_price,
        
        -- Stock status
        CASE 
          WHEN vp.quantity_available >= ci.quantity THEN 1 
          ELSE 0 
        END as in_stock
        
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN vendor_products vp ON ci.product_id = vp.product_id AND ci.vendor_id = vp.vendor_id
      JOIN vendor_info vi ON ci.vendor_id = vi.vendor_id
      WHERE ${whereClause}
      ORDER BY ci.created_at DESC
    `;

    const rawItems = await this.executeQuery<CartItemWithDetails>(itemsQuery, whereParams);
    const items = parseArrayPrices(rawItems, [
      'unit_price', 'vendor_price', 'base_price', 'discount_amount', 'tax_amount', 'final_price'
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
      totalDiscount += parseDecimal(item.discount_amount);

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
      vendor.discount += item.discount_amount || 0;
      vendor.itemCount++;
    });

    // Calculate tax (simplified - should use actual tax calculation service)
    const totalTax = (subtotal - totalDiscount) * 0.0825; // 8.25% tax rate

    // Calculate shipping (simplified - should use actual shipping calculation)
    const shippingCost = subtotal >= 100 ? 0 : 9.99; // Free shipping over $100

    return {
      items,
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
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if item already exists in cart
      const existingQuery = `
        SELECT cart_item_id, quantity 
        FROM cart_items 
        WHERE ${data.userId ? 'user_id = ?' : 'session_id = ?'}
          AND product_id = ? 
          AND vendor_id = ?
          AND configuration = ?
        LIMIT 1
      `;

      const existingParams = [
        data.userId || data.sessionId,
        data.productId,
        data.vendorId,
        JSON.stringify(data.configuration || {})
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

        // Insert new item
        const insertQuery = `
          INSERT INTO cart_items (
            user_id, session_id, product_id, vendor_id, 
            quantity, configuration, price, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await connection.execute<ResultSetHeader>(
          insertQuery,
          [
            data.userId || null,
            data.sessionId || null,
            data.productId,
            data.vendorId,
            data.quantity,
            JSON.stringify(data.configuration || {}),
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
          vi.business_name as vendor_name,
          vp.vendor_price,
          vp.quantity_available as stock_quantity,
          COALESCE(vp.vendor_price, p.base_price) * ci.quantity as final_price,
          CASE WHEN vp.quantity_available >= ci.quantity THEN 1 ELSE 0 END as in_stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        JOIN vendor_products vp ON ci.product_id = vp.product_id AND ci.vendor_id = vp.vendor_id
        JOIN vendor_info vi ON ci.vendor_id = vi.vendor_id
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

    const whereConditions = ['cart_item_id = ?'];
    const params = [quantity, cartItemId];

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    }

    const result = await this.executeMutation(
      `UPDATE cart_items 
       SET quantity = ?, updated_at = NOW() 
       WHERE ${whereConditions.join(' AND ')}`,
      params
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
    const whereConditions = ['cart_item_id = ?'];
    const params = [cartItemId];

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    }

    const result = await this.executeMutation(
      `DELETE FROM cart_items WHERE ${whereConditions.join(' AND ')}`,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId?: number, sessionId?: string): Promise<boolean> {
    if (!userId && !sessionId) return false;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    } else if (sessionId) {
      whereConditions.push('session_id = ?');
      params.push(sessionId);
    }

    const result = await this.executeMutation(
      `DELETE FROM cart_items WHERE ${whereConditions.join(' AND ')}`,
      params
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
      JOIN vendor_info vi ON vc.vendor_id = vi.vendor_id
      WHERE vc.code = ?
        AND vc.is_active = 1
        AND (vc.start_date IS NULL OR vc.start_date <= NOW())
        AND (vc.end_date IS NULL OR vc.end_date >= NOW())
        AND (vc.usage_limit IS NULL OR vc.usage_count < vc.usage_limit)
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