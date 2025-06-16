import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Cart and Checkout Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Complete end-to-end cart to order workflow', async ({ page }) => {
    // Start as customer
    await helpers.loginAs('customer');

    // Configure and add product to cart
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    
    // Verify configuration summary before adding to cart
    await expect(page.locator('[data-testid="configuration-summary"]')).toBeVisible();
    const configuredPrice = await page.locator('[data-testid="final-price"]').textContent();
    
    await helpers.addToCart();

    // Navigate to cart and verify item
    await page.goto('/cart');
    await helpers.waitForLoadingToFinish();
    
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-name"]')).toContainText('Premium Roller Shade');
    await expect(page.locator('[data-testid="cart-item-config"]')).toContainText('48 1/2" × 72"');
    
    // Verify cart total matches configured price
    const cartTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(cartTotal).toContain(configuredPrice!.replace('$', ''));

    // Proceed to checkout
    await helpers.proceedToCheckout();

    // Checkout Step 1: Customer Information (already logged in)
    await expect(page.locator('[data-testid="checkout-step-shipping"]')).toBeVisible();
    
    // Fill shipping address
    await helpers.fillShippingAddress();
    await page.click('[data-testid="continue-to-payment"]');

    // Checkout Step 2: Payment
    await expect(page.locator('[data-testid="checkout-step-payment"]')).toBeVisible();
    await helpers.fillPaymentInfo();
    
    // Review order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-item-config"]')).toContainText('Premium Roller Shade');
    
    // Place order
    await page.click('[data-testid="place-order"]');
    await page.waitForURL('/order-confirmation/*');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toMatch(/ORD-\d+/);
  });

  test('Cart item management and modifications', async ({ page }) => {
    await helpers.loginAs('customer');

    // Add multiple items to cart
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    // Add second item with different configuration
    await helpers.navigateToProductConfiguration('cellular-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    // Navigate to cart
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);

    // Update quantity
    await page.click('[data-testid="cart-item"]:first-child [data-testid="quantity-increase"]');
    await expect(page.locator('[data-testid="cart-item"]:first-child [data-testid="quantity"]')).toHaveValue('2');
    
    // Verify price update
    await expect(page.locator('[data-testid="cart-subtotal"]')).not.toBe('');

    // Remove item
    await page.click('[data-testid="cart-item"]:last-child [data-testid="remove-item"]');
    await page.click('[data-testid="confirm-remove"]');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Save for later
    await page.click('[data-testid="cart-item"]:first-child [data-testid="save-for-later"]');
    await expect(page.locator('[data-testid="saved-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);

    // Move back to cart
    await page.click('[data-testid="saved-item"]:first-child [data-testid="move-to-cart"]');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('Guest checkout workflow', async ({ page }) => {
    // Start as guest
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    await helpers.proceedToCheckout();

    // Should be prompted for guest checkout or login
    await expect(page.locator('[data-testid="guest-checkout-option"]')).toBeVisible();
    await page.click('[data-testid="continue-as-guest"]');

    // Fill guest information
    await page.fill('[data-testid="guest-email"]', 'guest@example.com');
    await helpers.fillShippingAddress();
    await page.click('[data-testid="continue-to-payment"]');

    // Complete payment
    await helpers.fillPaymentInfo();
    await page.click('[data-testid="place-order"]');

    // Verify order completion
    await page.waitForURL('/order-confirmation/*');
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    
    // Verify guest can access order with email
    await expect(page.locator('[data-testid="guest-order-tracking"]')).toBeVisible();
  });

  test('Cart persistence and recovery', async ({ page }) => {
    await helpers.loginAs('customer');

    // Add item to cart
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    // Logout and login again
    await helpers.logout();
    await helpers.loginAs('customer');

    // Navigate to cart and verify persistence
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cart-item-name"]')).toContainText('Premium Roller Shade');
  });

  test('Coupon and discount application', async ({ page }) => {
    await helpers.loginAs('customer');

    // Add item to cart
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    await page.goto('/cart');
    
    // Apply coupon
    const subtotalBefore = await page.locator('[data-testid="cart-subtotal"]').textContent();
    
    await page.fill('[data-testid="coupon-code"]', 'SAVE10');
    await page.click('[data-testid="apply-coupon"]');
    
    await helpers.expectToastMessage('Coupon applied successfully');
    await expect(page.locator('[data-testid="discount-applied"]')).toBeVisible();
    
    const subtotalAfter = await page.locator('[data-testid="cart-subtotal"]').textContent();
    expect(subtotalAfter).not.toBe(subtotalBefore);

    // Test invalid coupon
    await page.fill('[data-testid="coupon-code"]', 'INVALID');
    await page.click('[data-testid="apply-coupon"]');
    await helpers.expectToastMessage('Invalid coupon code');
  });

  test('Sample request workflow', async ({ page }) => {
    await helpers.loginAs('customer');

    await helpers.navigateToProductConfiguration('premium-roller-shade');
    
    // Request sample during configuration
    await page.click('[data-testid="request-sample"]');
    await page.fill('[data-testid="sample-address"]', '123 Sample St, Test City, TC 12345');
    await page.click('[data-testid="confirm-sample-request"]');
    
    await helpers.expectToastMessage('Sample request submitted');
    
    // Continue with normal configuration
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    await page.goto('/cart');
    
    // Verify sample request shows in cart
    await expect(page.locator('[data-testid="sample-request-indicator"]')).toBeVisible();
  });

  test('Installation service booking', async ({ page }) => {
    await helpers.loginAs('customer');

    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await helpers.completeBasicProductConfiguration();
    
    // Request installation
    await page.click('[data-testid="add-installation"]');
    await expect(page.locator('[data-testid="installation-options"]')).toBeVisible();
    
    await page.click('[data-testid="standard-installation"]');
    await page.click('[data-testid="confirm-installation"]');
    
    await helpers.addToCart();
    await page.goto('/cart');
    
    // Verify installation service in cart
    await expect(page.locator('[data-testid="installation-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="installation-fee"]')).toContainText('$');
    
    // Proceed to checkout and schedule installation
    await helpers.proceedToCheckout();
    await helpers.fillShippingAddress();
    
    // Installation scheduling step
    await expect(page.locator('[data-testid="installation-scheduling"]')).toBeVisible();
    await page.click('[data-testid="available-slot"]:first-child');
    await page.click('[data-testid="confirm-installation-time"]');
    
    await page.click('[data-testid="continue-to-payment"]');
    await helpers.fillPaymentInfo();
    await page.click('[data-testid="place-order"]');
    
    // Verify installation scheduled
    await page.waitForURL('/order-confirmation/*');
    await expect(page.locator('[data-testid="installation-scheduled"]')).toBeVisible();
  });

  test('Multi-vendor cart handling', async ({ page }) => {
    await helpers.loginAs('customer');

    // Add products from different vendors
    await helpers.navigateToProductConfiguration('vendor-a-roller-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    await helpers.navigateToProductConfiguration('vendor-b-cellular-shade');
    await helpers.completeBasicProductConfiguration();
    await helpers.addToCart();

    await page.goto('/cart');
    
    // Verify cart grouped by vendor
    await expect(page.locator('[data-testid="vendor-group"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="vendor-a-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-b-items"]')).toBeVisible();
    
    // Verify separate shipping calculations
    await expect(page.locator('[data-testid="vendor-a-shipping"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-b-shipping"]')).toBeVisible();
    
    await helpers.proceedToCheckout();
    
    // Verify checkout handles multiple vendors
    await expect(page.locator('[data-testid="multi-vendor-notice"]')).toBeVisible();
  });
});