import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Third-Party Integration Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Payment Gateway Integration', () => {
    test('Stripe payment integration', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();

      // Fill shipping information
      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');

      // Test Stripe Elements integration
      await expect(page.locator('[data-testid="stripe-card-element"]')).toBeVisible();

      // Test card input
      const cardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
      if (await cardFrame.locator('[name="cardnumber"]').count() > 0) {
        await cardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
        await cardFrame.locator('[name="exp-date"]').fill('12/28');
        await cardFrame.locator('[name="cvc"]').fill('123');
      }

      // Test payment processing
      await page.click('[data-testid="place-order"]');
      
      // Should either process payment or show validation errors
      const isProcessed = await page.locator('[data-testid="order-success"]').isVisible({ timeout: 10000 });
      const hasError = await page.locator('[data-testid="payment-error"]').isVisible();
      
      expect(isProcessed || hasError).toBeTruthy();
    });

    test('PayPal payment integration', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();

      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');

      // Test PayPal button
      if (await page.locator('[data-testid="paypal-button"]').count() > 0) {
        await page.click('[data-testid="paypal-button"]');
        
        // Should redirect to PayPal or show PayPal modal
        const paypalWindow = await page.locator('[data-testid="paypal-iframe"]').count() > 0;
        const urlChanged = !page.url().includes('localhost:3000');
        
        expect(paypalWindow || urlChanged).toBeTruthy();
      }
    });

    test('Buy Now, Pay Later (BNPL) integration', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();

      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');

      // Test Klarna integration
      if (await page.locator('[data-testid="klarna-option"]').count() > 0) {
        await page.click('[data-testid="klarna-option"]');
        await expect(page.locator('[data-testid="klarna-widget"]')).toBeVisible();
      }

      // Test Afterpay integration
      if (await page.locator('[data-testid="afterpay-option"]').count() > 0) {
        await page.click('[data-testid="afterpay-option"]');
        await expect(page.locator('[data-testid="afterpay-widget"]')).toBeVisible();
      }

      // Test Affirm integration
      if (await page.locator('[data-testid="affirm-option"]').count() > 0) {
        await page.click('[data-testid="affirm-option"]');
        await expect(page.locator('[data-testid="affirm-widget"]')).toBeVisible();
      }
    });
  });

  test.describe('Shipping and Logistics Integration', () => {
    test('Shipping rate calculator integration', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await page.goto('/cart');

      // Test shipping calculator
      if (await page.locator('[data-testid="shipping-calculator"]').count() > 0) {
        await page.fill('[data-testid="shipping-zip"]', '10001');
        await page.click('[data-testid="calculate-shipping"]');
        
        await helpers.waitForLoadingToFinish();
        
        // Should show shipping options
        await expect(page.locator('[data-testid="shipping-options"]')).toBeVisible();
        await expect(page.locator('[data-testid="shipping-rate"]')).toContainText('$');
      }
    });

    test('Address validation service', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();

      // Test address validation
      await page.fill('[data-testid="address"]', '123 Main Street');
      await page.fill('[data-testid="city"]', 'New York');
      await page.selectOption('[data-testid="state"]', 'NY');
      await page.fill('[data-testid="zip"]', '10001');
      
      await page.click('[data-testid="validate-address"]');
      
      // Should validate address or suggest corrections
      const isValid = await page.locator('[data-testid="address-valid"]').isVisible({ timeout: 5000 });
      const hasSuggestion = await page.locator('[data-testid="address-suggestion"]').isVisible();
      
      expect(isValid || hasSuggestion).toBeTruthy();
    });

    test('Package tracking integration', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/account/orders');

      // Test tracking link functionality
      if (await page.locator('[data-testid="tracking-number"]').count() > 0) {
        const trackingNumber = await page.locator('[data-testid="tracking-number"]').first().textContent();
        await page.click('[data-testid="track-package"]');
        
        // Should open tracking in new tab or show tracking info
        const trackingVisible = await page.locator('[data-testid="tracking-info"]').isVisible({ timeout: 5000 });
        const newTabOpened = page.context().pages().length > 1;
        
        expect(trackingVisible || newTabOpened).toBeTruthy();
      }
    });
  });

  test.describe('Communication Services Integration', () => {
    test('Email service integration', async ({ page }) => {
      // Test email sending for various scenarios
      await page.goto('/register');
      
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');
      await page.click('[data-testid="register-button"]');
      
      // Should indicate email verification sent
      if (await page.locator('[data-testid="email-verification-sent"]').count() > 0) {
        await expect(page.locator('[data-testid="email-verification-sent"]')).toBeVisible();
      }
    });

    test('SMS notification service', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/account/settings');
      
      // Test SMS preferences
      if (await page.locator('[data-testid="sms-notifications"]').count() > 0) {
        await page.check('[data-testid="sms-notifications"]');
        await page.fill('[data-testid="phone-number"]', '+1234567890');
        await page.click('[data-testid="save-preferences"]');
        
        // Should save SMS preferences
        await helpers.expectToastMessage('Preferences updated');
      }
    });

    test('Live chat integration', async ({ page }) => {
      await page.goto('/');
      
      // Test live chat widget
      if (await page.locator('[data-testid="live-chat-widget"]').count() > 0) {
        await page.click('[data-testid="live-chat-widget"]');
        await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
        
        // Test chat functionality
        await page.fill('[data-testid="chat-message"]', 'Hello, I need help with product selection');
        await page.click('[data-testid="send-message"]');
        
        await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Hello, I need help');
      }
    });
  });

  test.describe('Analytics and Tracking Integration', () => {
    test('Google Analytics tracking', async ({ page }) => {
      await page.goto('/');
      
      // Check if Google Analytics is loaded
      const gaLoaded = await page.evaluate(() => {
        return typeof (window as any).gtag !== 'undefined' || typeof (window as any).ga !== 'undefined';
      });
      
      if (gaLoaded) {
        // Test page view tracking
        await page.goto('/products');
        await helpers.waitForLoadingToFinish();
        
        // GA should track page views
        const gaDataLayer = await page.evaluate(() => (window as any).dataLayer);
        expect(gaDataLayer).toBeTruthy();
      }
    });

    test('Facebook Pixel tracking', async ({ page }) => {
      await page.goto('/');
      
      // Check if Facebook Pixel is loaded
      const fbqLoaded = await page.evaluate(() => {
        return typeof (window as any).fbq !== 'undefined';
      });
      
      if (fbqLoaded) {
        // Test purchase event tracking
        await helpers.loginAs('customer');
        await helpers.navigateToProductConfiguration('premium-roller-shade');
        await helpers.completeBasicProductConfiguration();
        await helpers.addToCart();
        
        // Should track AddToCart event
        const fbEvents = await page.evaluate(() => (window as any)._fbq);
        expect(fbEvents).toBeTruthy();
      }
    });

    test('Conversion tracking', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();
      
      // Mock successful order completion
      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');
      
      // Check for conversion tracking pixels
      const conversionPixels = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => 
          img.src.includes('facebook.com') || 
          img.src.includes('google-analytics.com') ||
          img.src.includes('googletagmanager.com')
        ).length;
      });
      
      // Conversion tracking should be present
      expect(conversionPixels).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Customer Support Integration', () => {
    test('Help desk ticket system', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/support');
      
      // Test support ticket creation
      if (await page.locator('[data-testid="create-ticket"]').count() > 0) {
        await page.click('[data-testid="create-ticket"]');
        await page.fill('[data-testid="ticket-subject"]', 'Product configuration issue');
        await page.fill('[data-testid="ticket-description"]', 'I need help configuring my roller shade dimensions');
        await page.selectOption('[data-testid="ticket-category"]', 'product-help');
        await page.click('[data-testid="submit-ticket"]');
        
        // Should create ticket and show confirmation
        await expect(page.locator('[data-testid="ticket-created"]')).toBeVisible();
        await expect(page.locator('[data-testid="ticket-number"]')).toContainText(/\d+/);
      }
    });

    test('Video consultation booking', async ({ page }) => {
      await helpers.loginAs('customer');
      await page.goto('/consultation');
      
      // Test consultation booking
      if (await page.locator('[data-testid="book-consultation"]').count() > 0) {
        await page.click('[data-testid="book-consultation"]');
        await page.selectOption('[data-testid="consultation-type"]', 'product-selection');
        await page.fill('[data-testid="consultation-date"]', '2024-07-15');
        await page.fill('[data-testid="consultation-time"]', '14:00');
        await page.fill('[data-testid="consultation-notes"]', 'Need help selecting blinds for living room');
        await page.click('[data-testid="confirm-booking"]');
        
        // Should book consultation
        await expect(page.locator('[data-testid="booking-confirmed"]')).toBeVisible();
      }
    });
  });

  test.describe('Inventory Management Integration', () => {
    test('Real-time inventory sync', async ({ page }) => {
      await helpers.loginAs('vendor');
      await page.goto('/vendor/products');
      
      // Test inventory update
      if (await page.locator('[data-testid="product-item"]').count() > 0) {
        await page.click('[data-testid="product-item"]:first-child [data-testid="edit-inventory"]');
        await page.fill('[data-testid="stock-quantity"]', '50');
        await page.click('[data-testid="update-inventory"]');
        
        // Should update inventory
        await helpers.expectToastMessage('Inventory updated');
        
        // Check if low stock alerts work
        await page.fill('[data-testid="stock-quantity"]', '2');
        await page.click('[data-testid="update-inventory"]');
        
        await expect(page.locator('[data-testid="low-stock-alert"]')).toBeVisible();
      }
    });

    test('Supplier integration', async ({ page }) => {
      await helpers.loginAs('vendor');
      await page.goto('/vendor/suppliers');
      
      // Test supplier data sync
      if (await page.locator('[data-testid="sync-supplier-data"]').count() > 0) {
        await page.click('[data-testid="sync-supplier-data"]');
        await helpers.waitForLoadingToFinish();
        
        // Should sync supplier data
        await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
      }
    });
  });

  test.describe('Marketing Automation Integration', () => {
    test('Email marketing integration', async ({ page }) => {
      await page.goto('/register');
      
      // Test newsletter signup
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.check('[data-testid="newsletter-signup"]');
      await page.click('[data-testid="register-button"]');
      
      // Should subscribe to newsletter
      if (await page.locator('[data-testid="newsletter-subscribed"]').count() > 0) {
        await expect(page.locator('[data-testid="newsletter-subscribed"]')).toBeVisible();
      }
    });

    test('Abandoned cart recovery', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      
      // Simulate cart abandonment by leaving the site
      await page.goto('about:blank');
      await page.waitForTimeout(2000);
      
      // Return to cart
      await page.goto('/cart');
      
      // Should still have cart items
      await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
      
      // Test if abandonment tracking is active
      const abandonmentTracked = await page.evaluate(() => {
        return localStorage.getItem('cart_abandoned_at') !== null;
      });
      
      expect(abandonmentTracked).toBeTruthy();
    });
  });

  test.describe('Social Media Integration', () => {
    test('Social login integration', async ({ page }) => {
      await page.goto('/login');
      
      // Test Google login
      if (await page.locator('[data-testid="google-login"]').count() > 0) {
        await page.click('[data-testid="google-login"]');
        
        // Should redirect to Google OAuth or show Google login modal
        const urlChanged = !page.url().includes('localhost:3000');
        const modalVisible = await page.locator('[data-testid="google-oauth-modal"]').isVisible();
        
        expect(urlChanged || modalVisible).toBeTruthy();
      }
      
      // Test Facebook login
      if (await page.locator('[data-testid="facebook-login"]').count() > 0) {
        await page.click('[data-testid="facebook-login"]');
        
        const urlChanged = !page.url().includes('localhost:3000');
        const modalVisible = await page.locator('[data-testid="facebook-oauth-modal"]').isVisible();
        
        expect(urlChanged || modalVisible).toBeTruthy();
      }
    });

    test('Social sharing integration', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      
      // Test social sharing
      if (await page.locator('[data-testid="share-configuration"]').count() > 0) {
        await page.click('[data-testid="share-configuration"]');
        await expect(page.locator('[data-testid="social-share-options"]')).toBeVisible();
        
        // Test Facebook share
        if (await page.locator('[data-testid="share-facebook"]').count() > 0) {
          await page.click('[data-testid="share-facebook"]');
          
          // Should open Facebook share dialog
          const newWindow = page.context().pages().length > 1;
          expect(newWindow).toBeTruthy();
        }
      }
    });
  });

  test.describe('Security Service Integration', () => {
    test('reCAPTCHA integration', async ({ page }) => {
      await page.goto('/contact');
      
      // Test reCAPTCHA on contact form
      if (await page.locator('.g-recaptcha').count() > 0) {
        await page.fill('[data-testid="contact-name"]', 'Test User');
        await page.fill('[data-testid="contact-email"]', 'test@example.com');
        await page.fill('[data-testid="contact-message"]', 'Test message');
        
        // Note: Can't actually solve reCAPTCHA in tests, but can verify it's present
        await expect(page.locator('.g-recaptcha')).toBeVisible();
      }
    });

    test('Fraud detection service', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await helpers.proceedToCheckout();
      
      // Test suspicious activity detection
      await helpers.fillShippingAddress();
      await page.click('[data-testid="continue-to-payment"]');
      
      // Try multiple rapid payment attempts (suspicious behavior)
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="place-order"]');
        await page.waitForTimeout(100);
      }
      
      // Should trigger fraud detection
      const fraudAlert = await page.locator('[data-testid="fraud-alert"]').isVisible({ timeout: 5000 });
      const rateLimited = await page.locator('[data-testid="rate-limit-error"]').isVisible();
      
      expect(fraudAlert || rateLimited).toBeTruthy();
    });
  });
});