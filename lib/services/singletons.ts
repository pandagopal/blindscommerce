/**
 * Singleton Service Instances for BlindsCommerce
 * 
 * These service instances are created once and reused across all requests
 * to prevent connection pool exhaustion from multiple instantiations.
 * 
 * This is a temporary fix until migration to a separate Node.js backend
 * when user count exceeds 2000.
 */

import { ProductService } from './ProductService';
import { CategoryService } from './CategoryService';
import { ContentService } from './ContentService';
import { CartService } from './CartService';
import { OrderService } from './OrderService';
import { UserService } from './UserService';
import { VendorService } from './VendorService';

// Import email and SMS services
import { emailService } from '@/lib/email/emailService';
import { smsService } from '@/lib/sms/smsService';

// Create singleton instances
export const productService = new ProductService();
export const categoryService = new CategoryService();
export const contentService = new ContentService();
export const cartService = new CartService();
export const orderService = new OrderService();
export const userService = new UserService();
export const vendorService = new VendorService();

// Re-export email and SMS services
export { emailService, smsService };

// Export all services as a single object for convenience
export const services = {
  product: productService,
  category: categoryService,
  content: contentService,
  cart: cartService,
  order: orderService,
  user: userService,
  vendor: vendorService,
  email: emailService,
  sms: smsService
};

// Connection pool monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  const { getPoolInfo } = require('@/lib/db');
  
  // Log pool stats every 30 seconds in development
  setInterval(async () => {
    try {
      const poolInfo = await getPoolInfo();
      if (poolInfo && poolInfo.used > 5) {
        console.warn(`[Pool Monitor] High connection usage: ${poolInfo.used}/${poolInfo.total} connections in use`);
      }
    } catch (error) {
      // Ignore monitoring errors
    }
  }, 30000);
}