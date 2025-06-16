import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Vendor Product Creation Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('vendor');
  });

  test.afterEach(async ({ page }) => {
    await helpers.logout();
  });

  test('Complete vendor product creation flow', async ({ page }) => {
    // Navigate to product creation
    await page.goto('/vendor/products/new');
    await helpers.waitForLoadingToFinish();

    // Tab 1: Basic Info
    await page.fill('[data-testid="product-name"]', 'Test Premium Roller Shade');
    await page.fill('[data-testid="short-description"]', 'High-quality roller shade');
    await page.fill('[data-testid="full-description"]', 'Premium roller shade with advanced light filtering technology');
    await page.fill('[data-testid="sku"]', 'PRS-TEST-001');
    await page.fill('[data-testid="base-price"]', '199.99');
    await page.selectOption('[data-testid="category"]', 'roller-shades');
    await page.click('[data-testid="next-tab"]');

    // Tab 2: Dimensions
    await helpers.fillFractionInput('[data-testid="min-width"]', 12, '0');
    await helpers.fillFractionInput('[data-testid="max-width"]', 120, '0');
    await helpers.fillFractionInput('[data-testid="min-height"]', 12, '0');
    await helpers.fillFractionInput('[data-testid="max-height"]', 120, '0');
    await page.click('[data-testid="next-tab"]');

    // Tab 3: Options
    await page.check('[data-testid="mount-inside"]');
    await page.check('[data-testid="mount-outside"]');
    await page.check('[data-testid="control-cordless"]');
    await page.check('[data-testid="control-motorized"]');
    await page.click('[data-testid="next-tab"]');

    // Tab 4: Fabric/Materials
    await page.check('[data-testid="fabric-light-filtering"]');
    await page.check('[data-testid="fabric-blackout"]');
    await page.click('[data-testid="add-color"]');
    await page.fill('[data-testid="color-name-0"]', 'Classic White');
    await page.fill('[data-testid="color-code-0"]', '#FFFFFF');
    await page.click('[data-testid="next-tab"]');

    // Tab 5: Images
    // Note: File upload would need actual image files in CI environment
    await page.click('[data-testid="next-tab"]');

    // Tab 6: Features
    await page.check('[data-testid="feature-uv-protection"]');
    await page.check('[data-testid="feature-energy-efficient"]');
    await page.click('[data-testid="next-tab"]');

    // Tab 7: Room Recommendations
    await page.check('[data-testid="room-living-room"]');
    await page.check('[data-testid="room-bedroom"]');

    // Submit product
    await page.click('[data-testid="save-product"]');
    await helpers.expectToastMessage('Product created successfully');

    // Verify redirect to product list
    await expect(page).toHaveURL(/\/vendor\/products$/);
    
    // Verify product appears in list
    await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Premium Roller Shade');
  });

  test('Vendor product creation validation', async ({ page }) => {
    await page.goto('/vendor/products/new');

    // Try to submit without required fields
    await page.click('[data-testid="save-product"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="error-product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-sku"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-base-price"]')).toBeVisible();
  });

  test('Bulk product upload workflow', async ({ page }) => {
    await page.goto('/vendor/bulk-products');
    await helpers.waitForLoadingToFinish();

    // Upload CSV file
    // Note: Would need actual CSV file for full test
    await page.click('[data-testid="upload-csv"]');
    
    // Verify upload interface
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="csv-template-download"]')).toBeVisible();
  });

  test('Product editing workflow', async ({ page }) => {
    // Assume product exists, navigate to edit
    await page.goto('/vendor/products');
    await page.click('[data-testid="product-item"]:first-child [data-testid="edit-button"]');

    // Modify product name
    await page.fill('[data-testid="product-name"]', 'Updated Premium Roller Shade');
    
    // Save changes
    await page.click('[data-testid="save-product"]');
    await helpers.expectToastMessage('Product updated successfully');
  });

  test('Product status management', async ({ page }) => {
    await page.goto('/vendor/products');
    
    // Toggle product status
    await page.click('[data-testid="product-item"]:first-child [data-testid="status-toggle"]');
    await helpers.expectToastMessage('Product status updated');

    // Verify status change reflected in UI
    await expect(page.locator('[data-testid="product-item"]:first-child [data-testid="status-badge"]')).toContainText('Inactive');
  });
});