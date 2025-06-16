import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Customer Product Configuration Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Complete product configuration flow for roller shade', async ({ page }) => {
    // Start as guest customer
    await page.goto('/products');
    await helpers.waitForLoadingToFinish();

    // Select a product from catalog
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="configure-button"]');

    // Verify we're on configuration page
    await expect(page).toHaveURL(/\/products\/configure\//);
    await expect(page.locator('[data-testid="configuration-steps"]')).toBeVisible();

    // Step 1: Dimensions
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Dimensions');
    
    // Test fraction input with eighths
    await helpers.fillFractionInput('[data-testid="width-input"]', 48, '3/8');
    await helpers.fillFractionInput('[data-testid="height-input"]', 72, '1/4');
    
    // Verify dimension validation
    await expect(page.locator('[data-testid="dimension-valid"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-preview"]')).toContainText('$');
    
    await page.click('[data-testid="next-step"]');

    // Step 2: Colors
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Colors');
    await expect(page.locator('[data-testid="color-options"]')).toBeVisible();
    
    // Select color and verify price update
    const initialPrice = await page.locator('[data-testid="current-price"]').textContent();
    await page.click('[data-testid="color-option-white"]');
    await expect(page.locator('[data-testid="selected-color"]')).toBeVisible();
    
    await page.click('[data-testid="next-step"]');

    // Step 3: Materials
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Materials');
    await page.click('[data-testid="material-light-filtering"]');
    await expect(page.locator('[data-testid="material-description"]')).toBeVisible();
    
    await page.click('[data-testid="next-step"]');

    // Step 4: Controls
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Controls');
    await page.click('[data-testid="control-cordless"]');
    await expect(page.locator('[data-testid="control-benefits"]')).toContainText('Child-safe');
    
    await page.click('[data-testid="next-step"]');

    // Step 5: Rail Options
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Rail Options');
    await page.click('[data-testid="headrail-standard"]');
    await page.click('[data-testid="bottomrail-standard"]');
    
    await page.click('[data-testid="next-step"]');

    // Step 6: Room View
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Room View');
    await expect(page.locator('[data-testid="room-visualizer"]')).toBeVisible();
    
    // Test room type selection
    await page.click('[data-testid="room-living-room"]');
    await expect(page.locator('[data-testid="room-preview"]')).toBeVisible();
    
    await page.click('[data-testid="next-step"]');

    // Step 7: Review
    await expect(page.locator('[data-testid="step-title"]')).toContainText('Review');
    await expect(page.locator('[data-testid="configuration-summary"]')).toBeVisible();
    
    // Verify all selected options are displayed
    await expect(page.locator('[data-testid="summary-dimensions"]')).toContainText('48 3/8" × 72 1/4"');
    await expect(page.locator('[data-testid="summary-color"]')).toContainText('White');
    await expect(page.locator('[data-testid="summary-material"]')).toContainText('Light Filtering');
    await expect(page.locator('[data-testid="summary-control"]')).toContainText('Cordless');
    
    // Verify final price
    await expect(page.locator('[data-testid="final-price"]')).toContainText('$');
    
    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await helpers.expectToastMessage('Added to cart successfully');
  });

  test('Product configuration validation and error handling', async ({ page }) => {
    await helpers.navigateToProductConfiguration('premium-roller-shade');

    // Test invalid dimensions
    await helpers.fillFractionInput('[data-testid="width-input"]', 5, '0'); // Below minimum
    await expect(page.locator('[data-testid="width-error"]')).toContainText('Minimum width');
    
    await helpers.fillFractionInput('[data-testid="width-input"]', 150, '0'); // Above maximum
    await expect(page.locator('[data-testid="width-error"]')).toContainText('Maximum width');

    // Test valid dimensions
    await helpers.fillFractionInput('[data-testid="width-input"]', 48, '0');
    await helpers.fillFractionInput('[data-testid="height-input"]', 72, '0');
    await expect(page.locator('[data-testid="dimension-valid"]')).toBeVisible();

    // Try to proceed without selecting color
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="next-step"]'); // Skip to color step
    await expect(page.locator('[data-testid="color-required"]')).toBeVisible();
  });

  test('Configuration persistence and navigation', async ({ page }) => {
    await helpers.navigateToProductConfiguration('premium-roller-shade');

    // Configure first few steps
    await helpers.fillFractionInput('[data-testid="width-input"]', 36, '1/2');
    await helpers.fillFractionInput('[data-testid="height-input"]', 60, '3/4');
    await page.click('[data-testid="next-step"]');
    
    await page.click('[data-testid="color-option-beige"]');
    await page.click('[data-testid="next-step"]');

    // Navigate back and verify persistence
    await page.click('[data-testid="previous-step"]');
    await expect(page.locator('[data-testid="color-option-beige"]')).toHaveClass(/selected/);
    
    await page.click('[data-testid="previous-step"]');
    await expect(page.locator('[data-testid="width-input"] [data-testid="whole-number"]')).toHaveValue('36');
    await expect(page.locator('[data-testid="width-input"] [data-testid="fraction-select"]')).toHaveValue('1/2');
  });

  test('Price calculation accuracy', async ({ page }) => {
    await helpers.navigateToProductConfiguration('premium-roller-shade');

    // Base configuration
    await helpers.fillFractionInput('[data-testid="width-input"]', 48, '0');
    await helpers.fillFractionInput('[data-testid="height-input"]', 72, '0');
    
    const basePrice = await page.locator('[data-testid="current-price"]').textContent();
    await page.click('[data-testid="next-step"]');

    // Select premium color option
    await page.click('[data-testid="color-option-premium"]');
    const colorPrice = await page.locator('[data-testid="current-price"]').textContent();
    
    // Verify price increased
    expect(parseFloat(colorPrice!.replace('$', ''))).toBeGreaterThan(parseFloat(basePrice!.replace('$', '')));

    // Continue and select motorized control (premium option)
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="material-blackout"]');
    await page.click('[data-testid="next-step"]');
    
    await page.click('[data-testid="control-motorized"]');
    const motorizedPrice = await page.locator('[data-testid="current-price"]').textContent();
    
    // Verify price increased again
    expect(parseFloat(motorizedPrice!.replace('$', ''))).toBeGreaterThan(parseFloat(colorPrice!.replace('$', '')));
  });

  test('Mobile responsive configuration', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Mobile test only on Chromium');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await helpers.navigateToProductConfiguration('premium-roller-shade');

    // Verify mobile-optimized UI
    await expect(page.locator('[data-testid="mobile-step-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-price-sticky"]')).toBeVisible();

    // Test swipe navigation
    await page.locator('[data-testid="configuration-content"]').swipe({ direction: 'left' });
    // Note: Actual swipe implementation would depend on the framework
  });

  test('Configuration sharing and saving', async ({ page }) => {
    await helpers.loginAs('customer');
    await helpers.navigateToProductConfiguration('premium-roller-shade');

    // Complete configuration
    await helpers.completeBasicProductConfiguration();

    // Save configuration
    await page.click('[data-testid="save-configuration"]');
    await page.fill('[data-testid="configuration-name"]', 'Living Room Shade');
    await page.click('[data-testid="confirm-save"]');
    await helpers.expectToastMessage('Configuration saved');

    // Share configuration
    await page.click('[data-testid="share-configuration"]');
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
    
    const shareLink = await page.locator('[data-testid="share-link"]').inputValue();
    expect(shareLink).toContain('http');
  });
});