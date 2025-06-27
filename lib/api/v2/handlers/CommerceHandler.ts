/**
 * Commerce Handler for V2 API
 * Handles products, cart, checkout, and orders
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { 
  ProductService, 
  CartService, 
  OrderService,
  CategoryService 
} from '@/lib/services';
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
  private productService = new ProductService();
  private cartService = new CartService();
  private orderService = new OrderService();
  private categoryService = new CategoryService();

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
      'orders/create': () => this.createOrder(req, user),
      'orders/:id/cancel': () => this.cancelOrder(action[1], user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'cart/items/:id': () => this.updateCartItem(action[2], req, user),
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
      isActive: true,
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

    return product;
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
      user?.user_id,
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

    return this.cartService.getCart(user?.user_id, sessionId || undefined);
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
    
    const data = await this.getValidatedBody(req, AddToCartSchema);

    const result = await this.cartService.addToCart({
      userId: user?.user_id,
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
      user?.user_id,
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
}