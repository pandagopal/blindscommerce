import { test, expect } from '@playwright/test';

test.describe('Customer Product Configuration Flow', () => {
  test('Customer configures custom blinds and adds to cart', async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    
    // Click on first product
    await page.locator('.product-card').first().click();
    
    // Wait for product configurator to load
    await expect(page.locator('[data-testid="product-configurator"]')).toBeVisible();
    
    // Configure product dimensions
    await page.fill('input[name="width"]', '48');
    await page.fill('input[name="height"]', '60');
    
    // Select mount type
    await page.click('[data-testid="mount-type-inside"]');
    
    // Select fabric/material
    await page.click('[data-testid="fabric-selector"]');
    await page.click('[data-testid="fabric-option-0"]');
    
    // Select color
    await page.click('[data-testid="color-selector"]');
    await page.click('[data-testid="color-white"]');
    
    // Verify real-time pricing updates
    const priceElement = page.locator('[data-testid="product-price"]');
    await expect(priceElement).toContainText('$');
    const initialPrice = await priceElement.textContent();
    
    // Change quantity
    await page.fill('input[name="quantity"]', '2');
    
    // Verify price updates with quantity
    await expect(priceElement).not.toContainText(initialPrice!);
    
    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    
    // Verify cart notification
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
    
    // Navigate to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toContainText('2');
  });

  test('Customer uses room visualization for product selection', async ({ page }) => {
    // Navigate to product with AR/visualization
    await page.goto('/products/1'); // Assuming product ID 1 has visualization
    
    // Click on room visualization
    await page.click('[data-testid="room-visualization-btn"]');
    
    // Wait for visualization to load
    await expect(page.locator('[data-testid="room-visualizer"]')).toBeVisible();
    
    // Select room type
    await page.click('[data-testid="room-type-bedroom"]');
    
    // Configure product in visualizer
    await page.fill('input[name="width"]', '72');
    await page.fill('input[name="height"]', '48');
    
    // Take screenshot of visualization
    await page.screenshot({ path: 'room-visualization.png' });
    
    // Save configuration and add to cart
    await page.click('[data-testid="save-visualization"]');
    await page.click('[data-testid="add-to-cart"]');
    
    // Verify product added with correct specifications
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item-dimensions"]')).toContainText('72" x 48"');
  });
});