import { test, expect } from '@playwright/test';

test.describe('Customer Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add a product to cart first
    await page.goto('/products/1');
    await page.fill('input[name="width"]', '36');
    await page.fill('input[name="height"]', '48');
    await page.click('[data-testid="add-to-cart"]');
  });

  test('Customer completes checkout with credit card', async ({ page }) => {
    // Navigate to cart
    await page.goto('/cart');
    
    // Verify cart items
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // Click checkout
    await page.click('[data-testid="proceed-to-checkout"]');
    
    // Fill shipping information
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '555-123-4567');
    
    // Fill address
    await page.fill('input[name="address1"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.selectOption('select[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');
    
    // Verify tax calculation after ZIP code entry
    const taxElement = page.locator('[data-testid="tax-amount"]');
    await expect(taxElement).toBeVisible();
    await expect(taxElement).toContainText('$');
    
    // Select shipping method
    await page.click('[data-testid="shipping-standard"]');
    
    // Verify order summary
    const subtotal = page.locator('[data-testid="order-subtotal"]');
    const shipping = page.locator('[data-testid="order-shipping"]');
    const tax = page.locator('[data-testid="order-tax"]');
    const total = page.locator('[data-testid="order-total"]');
    
    await expect(subtotal).toContainText('$');
    await expect(shipping).toContainText('$');
    await expect(tax).toContainText('$');
    await expect(total).toContainText('$');
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment"]');
    
    // Fill payment information (Stripe test card)
    const stripeFrame = page.frameLocator('iframe[title="Secure card payment input frame"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    await stripeFrame.locator('[placeholder="ZIP"]').fill('10001');
    
    // Place order
    await page.click('[data-testid="place-order"]');
    
    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-success-message"]')).toContainText('Thank you for your order');
  });

  test('Customer applies discount code during checkout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    
    // Apply discount code
    await page.click('[data-testid="discount-code-toggle"]');
    await page.fill('input[name="discountCode"]', 'SAVE10');
    await page.click('[data-testid="apply-discount"]');
    
    // Verify discount applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText('-$');
    
    // Verify updated total
    const totalBefore = await page.locator('[data-testid="order-total"]').textContent();
    await expect(page.locator('[data-testid="order-total"]')).not.toContainText(totalBefore!);
  });

  test('Customer selects installation service during checkout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    
    // Select installation option
    await page.click('[data-testid="add-installation"]');
    
    // Select installation date
    await page.click('[data-testid="installation-date-picker"]');
    // Select next available date (assuming calendar widget)
    await page.click('.available-date:first-child');
    
    // Select time slot
    await page.click('[data-testid="time-slot-morning"]');
    
    // Verify installation fee added
    await expect(page.locator('[data-testid="installation-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="installation-fee"]')).toContainText('$');
    
    // Verify installation details in order summary
    await expect(page.locator('[data-testid="installation-summary"]')).toBeVisible();
  });
});