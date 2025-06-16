import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('API Integration and Backend Testing', () => {
  let helpers: TestHelpers;
  let apiUrl: string;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    apiUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
  });

  test.describe('Authentication API', () => {
    test('User login and JWT token validation', async ({ request }) => {
      // Test successful login
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'admin@smartblindshub.com',
          password: 'Admin@1234'
        }
      });

      expect(loginResponse.ok()).toBeTruthy();
      const loginData = await loginResponse.json();
      expect(loginData.token).toBeDefined();
      expect(loginData.user.role).toBe('admin');

      // Test invalid credentials
      const invalidLogin = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      });

      expect(invalidLogin.status()).toBe(401);
      const errorData = await invalidLogin.json();
      expect(errorData.error).toContain('Invalid credentials');
    });

    test('User registration and role assignment', async ({ request }) => {
      // Test customer registration (public)
      const registerResponse = await request.post(`${apiUrl}/auth/register`, {
        data: {
          email: 'newcustomer@test.com',
          password: 'Customer@123',
          name: 'New Customer',
          phone: '555-123-4567'
        }
      });

      expect(registerResponse.ok()).toBeTruthy();
      const registerData = await registerResponse.json();
      expect(registerData.user.role).toBe('customer');
      expect(registerData.token).toBeDefined();

      // Test duplicate email registration
      const duplicateResponse = await request.post(`${apiUrl}/auth/register`, {
        data: {
          email: 'newcustomer@test.com',
          password: 'Another@123',
          name: 'Duplicate User'
        }
      });

      expect(duplicateResponse.status()).toBe(400);
      const duplicateError = await duplicateResponse.json();
      expect(duplicateError.error).toContain('already exists');
    });

    test('Token refresh and expiration handling', async ({ request }) => {
      // Login to get initial token
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'customer@smartblindshub.com',
          password: 'Admin@1234'
        }
      });

      const { token } = await loginResponse.json();

      // Test protected endpoint with valid token
      const protectedResponse = await request.get(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(protectedResponse.ok()).toBeTruthy();
      const userData = await protectedResponse.json();
      expect(userData.user.email).toBe('customer@smartblindshub.com');

      // Test with invalid token
      const invalidTokenResponse = await request.get(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(invalidTokenResponse.status()).toBe(401);
    });
  });

  test.describe('Products API', () => {
    test('Product catalog retrieval and filtering', async ({ request }) => {
      // Get all products
      const productsResponse = await request.get(`${apiUrl}/products`);
      expect(productsResponse.ok()).toBeTruthy();
      
      const productsData = await productsResponse.json();
      expect(Array.isArray(productsData.products)).toBeTruthy();
      expect(productsData.products.length).toBeGreaterThan(0);

      // Test pagination
      const paginatedResponse = await request.get(`${apiUrl}/products?page=1&limit=5`);
      const paginatedData = await paginatedResponse.json();
      expect(paginatedData.products.length).toBeLessThanOrEqual(5);
      expect(paginatedData.pagination).toBeDefined();

      // Test category filtering
      const categoryResponse = await request.get(`${apiUrl}/products?category=roller-shades`);
      const categoryData = await categoryResponse.json();
      categoryData.products.forEach((product: any) => {
        expect(product.category).toContain('roller');
      });

      // Test price range filtering
      const priceResponse = await request.get(`${apiUrl}/products?min_price=100&max_price=500`);
      const priceData = await priceResponse.json();
      priceData.products.forEach((product: any) => {
        expect(product.base_price).toBeGreaterThanOrEqual(100);
        expect(product.base_price).toBeLessThanOrEqual(500);
      });
    });

    test('Product search functionality', async ({ request }) => {
      // Text search
      const searchResponse = await request.get(`${apiUrl}/products/search?q=roller shade`);
      expect(searchResponse.ok()).toBeTruthy();
      
      const searchData = await searchResponse.json();
      searchData.results.forEach((product: any) => {
        const productText = `${product.name} ${product.description}`.toLowerCase();
        expect(productText).toMatch(/roller|shade/);
      });

      // Search suggestions
      const suggestionsResponse = await request.get(`${apiUrl}/products/search/suggestions?q=roll`);
      const suggestionsData = await suggestionsResponse.json();
      expect(Array.isArray(suggestionsData.suggestions)).toBeTruthy();
    });

    test('Product configuration and pricing', async ({ request }) => {
      // Get product configuration options
      const configResponse = await request.get(`${apiUrl}/products/premium-roller-shade/configuration`);
      expect(configResponse.ok()).toBeTruthy();
      
      const configData = await configResponse.json();
      expect(configData.dimensions).toBeDefined();
      expect(configData.colors).toBeDefined();
      expect(configData.materials).toBeDefined();
      expect(configData.controls).toBeDefined();

      // Calculate pricing for configuration
      const pricingResponse = await request.post(`${apiUrl}/products/premium-roller-shade/pricing`, {
        data: {
          width: 48.5,
          height: 72.0,
          color_id: 1,
          material_id: 2,
          control_type: 'cordless',
          quantity: 1
        }
      });

      expect(pricingResponse.ok()).toBeTruthy();
      const pricingData = await pricingResponse.json();
      expect(pricingData.base_price).toBeGreaterThan(0);
      expect(pricingData.total_price).toBeGreaterThan(0);
      expect(pricingData.pricing_breakdown).toBeDefined();
    });
  });

  test.describe('Cart API', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'customer@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const loginData = await loginResponse.json();
      authToken = loginData.token;
    });

    test('Cart management operations', async ({ request }) => {
      // Add item to cart
      const addToCartResponse = await request.post(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          product_id: 1,
          quantity: 2,
          configuration: {
            width: 48.0,
            height: 72.0,
            color_id: 1,
            material_id: 2,
            control_type: 'cordless'
          }
        }
      });

      expect(addToCartResponse.ok()).toBeTruthy();
      const cartData = await addToCartResponse.json();
      expect(cartData.cart_item_id).toBeDefined();

      // Get cart contents
      const getCartResponse = await request.get(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(getCartResponse.ok()).toBeTruthy();
      const cartContents = await getCartResponse.json();
      expect(Array.isArray(cartContents.items)).toBeTruthy();
      expect(cartContents.items.length).toBeGreaterThan(0);
      expect(cartContents.subtotal).toBeDefined();

      // Update cart item quantity
      const cartItemId = cartContents.items[0].cart_item_id;
      const updateResponse = await request.put(`${apiUrl}/cart/enhanced/items/${cartItemId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: { quantity: 3 }
      });

      expect(updateResponse.ok()).toBeTruthy();

      // Remove item from cart
      const removeResponse = await request.delete(`${apiUrl}/cart/enhanced/items/${cartItemId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(removeResponse.ok()).toBeTruthy();
    });

    test('Cart pricing and discounts', async ({ request }) => {
      // Add multiple items
      await request.post(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          product_id: 1,
          quantity: 2,
          configuration: { width: 48.0, height: 72.0 }
        }
      });

      await request.post(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          product_id: 2,
          quantity: 1,
          configuration: { width: 36.0, height: 60.0 }
        }
      });

      // Apply coupon
      const couponResponse = await request.post(`${apiUrl}/cart/apply-coupon`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: { coupon_code: 'SAVE10' }
      });

      expect(couponResponse.ok()).toBeTruthy();
      const couponData = await couponResponse.json();
      expect(couponData.discount_applied).toBeTruthy();
      expect(couponData.discount_amount).toBeGreaterThan(0);

      // Get updated cart with discount
      const cartResponse = await request.get(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const cartData = await cartResponse.json();
      expect(cartData.discount_amount).toBeGreaterThan(0);
      expect(cartData.total).toBeLessThan(cartData.subtotal);
    });
  });

  test.describe('Orders API', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'customer@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const loginData = await loginResponse.json();
      authToken = loginData.token;
    });

    test('Order creation and processing', async ({ request }) => {
      // Create order
      const orderResponse = await request.post(`${apiUrl}/orders/create`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            address: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            phone: '555-123-4567'
          },
          billing_address: {
            first_name: 'John',
            last_name: 'Doe',
            address: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701'
          },
          payment_method: 'stripe',
          payment_intent_id: 'pi_test_123'
        }
      });

      expect(orderResponse.ok()).toBeTruthy();
      const orderData = await orderResponse.json();
      expect(orderData.order_id).toBeDefined();
      expect(orderData.order_number).toMatch(/ORD-\d+/);
      expect(orderData.status).toBe('pending');

      // Get order details
      const getOrderResponse = await request.get(`${apiUrl}/orders/${orderData.order_id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(getOrderResponse.ok()).toBeTruthy();
      const orderDetails = await getOrderResponse.json();
      expect(orderDetails.order_id).toBe(orderData.order_id);
      expect(orderDetails.items).toBeDefined();
      expect(orderDetails.shipping_address).toBeDefined();
    });

    test('Order status updates and tracking', async ({ request }) => {
      // This would typically be done by admin/vendor
      const adminLoginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'admin@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const adminData = await adminLoginResponse.json();
      const adminToken = adminData.token;

      // Get pending orders
      const ordersResponse = await request.get(`${apiUrl}/admin/orders?status=pending`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(ordersResponse.ok()).toBeTruthy();
      const ordersData = await ordersResponse.json();
      
      if (ordersData.orders.length > 0) {
        const orderId = ordersData.orders[0].order_id;

        // Update order status
        const updateResponse = await request.put(`${apiUrl}/admin/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          data: {
            status: 'processing',
            notes: 'Order moved to processing queue'
          }
        });

        expect(updateResponse.ok()).toBeTruthy();
      }
    });
  });

  test.describe('Vendor API', () => {
    let vendorToken: string;

    test.beforeEach(async ({ request }) => {
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'vendor@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const loginData = await loginResponse.json();
      vendorToken = loginData.token;
    });

    test('Vendor product management', async ({ request }) => {
      // Create new product
      const createProductResponse = await request.post(`${apiUrl}/products/create`, {
        headers: { 'Authorization': `Bearer ${vendorToken}` },
        data: {
          name: 'API Test Roller Shade',
          short_description: 'High-quality roller shade for testing',
          full_description: 'Premium roller shade with advanced features',
          sku: 'API-TEST-001',
          base_price: 299.99,
          category_id: 1,
          min_width: 12,
          max_width: 120,
          min_height: 12,
          max_height: 144
        }
      });

      expect(createProductResponse.ok()).toBeTruthy();
      const productData = await createProductResponse.json();
      expect(productData.product_id).toBeDefined();

      // Get vendor products
      const vendorProductsResponse = await request.get(`${apiUrl}/vendor/products`, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });

      expect(vendorProductsResponse.ok()).toBeTruthy();
      const vendorProducts = await vendorProductsResponse.json();
      expect(Array.isArray(vendorProducts.products)).toBeTruthy();

      // Update product
      const updateResponse = await request.put(`${apiUrl}/products/${productData.product_id}`, {
        headers: { 'Authorization': `Bearer ${vendorToken}` },
        data: {
          base_price: 279.99,
          description: 'Updated description for API test product'
        }
      });

      expect(updateResponse.ok()).toBeTruthy();
    });

    test('Vendor analytics and metrics', async ({ request }) => {
      // Get vendor dashboard stats
      const dashboardResponse = await request.get(`${apiUrl}/vendor/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });

      expect(dashboardResponse.ok()).toBeTruthy();
      const dashboardData = await dashboardResponse.json();
      expect(dashboardData.total_products).toBeDefined();
      expect(dashboardData.total_sales).toBeDefined();
      expect(dashboardData.pending_orders).toBeDefined();

      // Get sales analytics
      const analyticsResponse = await request.get(`${apiUrl}/vendor/analytics?period=30days`, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });

      expect(analyticsResponse.ok()).toBeTruthy();
      const analyticsData = await analyticsResponse.json();
      expect(analyticsData.sales_data).toBeDefined();
      expect(analyticsData.top_products).toBeDefined();
    });
  });

  test.describe('Error Handling and Validation', () => {
    test('API input validation', async ({ request }) => {
      // Test missing required fields
      const invalidProductResponse = await request.post(`${apiUrl}/products/create`, {
        headers: { 'Authorization': 'Bearer invalid-token' },
        data: {
          // Missing required fields
          description: 'Product without name'
        }
      });

      expect(invalidProductResponse.status()).toBe(401); // Unauthorized first

      // Test with valid auth but invalid data
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'vendor@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const { token } = await loginResponse.json();

      const validationResponse = await request.post(`${apiUrl}/products/create`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          name: '', // Empty name
          base_price: -100 // Invalid price
        }
      });

      expect(validationResponse.status()).toBe(400);
      const validationError = await validationResponse.json();
      expect(validationError.errors).toBeDefined();
    });

    test('Rate limiting and security', async ({ request }) => {
      // Test rate limiting on login endpoint
      const promises = Array.from({ length: 10 }, () =>
        request.post(`${apiUrl}/auth/login`, {
          data: {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('Cross-origin and CORS handling', async ({ request }) => {
      // Test CORS headers
      const corsResponse = await request.fetch(`${apiUrl}/products`, {
        method: 'OPTIONS'
      });

      expect(corsResponse.headers()['access-control-allow-origin']).toBeDefined();
      expect(corsResponse.headers()['access-control-allow-methods']).toBeDefined();
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('API response times', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${apiUrl}/products`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('Concurrent request handling', async ({ request }) => {
      // Send multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request.get(`${apiUrl}/products`)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
    });

    test('Large payload handling', async ({ request }) => {
      const loginResponse = await request.post(`${apiUrl}/auth/login`, {
        data: {
          email: 'customer@smartblindshub.com',
          password: 'Admin@1234'
        }
      });
      const { token } = await loginResponse.json();

      // Create large configuration object
      const largeConfiguration = {
        width: 48.5,
        height: 72.0,
        color_id: 1,
        material_id: 2,
        control_type: 'motorized',
        custom_notes: 'A'.repeat(5000), // Large text field
        room_measurements: Array.from({ length: 100 }, (_, i) => ({
          window_id: i,
          width: 24 + i,
          height: 36 + i
        }))
      };

      const largePayloadResponse = await request.post(`${apiUrl}/cart/enhanced`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          product_id: 1,
          quantity: 1,
          configuration: largeConfiguration
        }
      });

      expect(largePayloadResponse.ok()).toBeTruthy();
    });
  });
});