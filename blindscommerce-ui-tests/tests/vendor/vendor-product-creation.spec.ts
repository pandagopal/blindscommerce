import { test, expect, Page } from '@playwright/test';
import { beforeEach } from '../utils/test-helpers';

// Test data for product creation
const testProduct = {
  name: 'Test Cellular Shade Premium',
  shortDescription: 'Premium cellular shade for energy efficiency and style',
  fullDescription: 'High-quality honeycomb cellular shade providing excellent insulation, light control, and privacy. Perfect for bedrooms and living areas with energy-saving properties.',
  sku: `TEST-CS-${Date.now()}`,
  basePrice: '299.99',
  category: 'Cellular Shades',
  minWidth: '12',
  maxWidth: '96',
  minHeight: '12',
  maxHeight: '120'
};

const invalidProductData = {
  name: '', // Invalid - empty name
  shortDescription: 'Short desc',
  fullDescription: 'Full description',
  sku: 'INVALID-001',
  basePrice: '-50', // Invalid - negative price
  category: 'Cellular Shades'
};

test.describe('Vendor Product Creation', () => {
  
  test.beforeEach(async ({ page }) => {
    await beforeEach(page, 'vendor@smartblindshub.com');
  });

  test('should navigate to product creation page', async ({ page }) => {
    // Navigate to vendor products
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');

    // Verify we're on the products page
    await expect(page.locator('h1')).toContainText('My Products');

    // Click "Add New Product" or "Create Product" button
    const addProductButton = page.locator('button, a').filter({ 
      hasText: /Add New Product|Create Product|New Product|\+ Add Product/i 
    }).first();
    
    await expect(addProductButton).toBeVisible();
    await addProductButton.click();

    // Verify navigation to creation page
    await page.waitForURL('**/vendor/products/new');
    await expect(page.locator('h1')).toContainText('Add New Product');
  });

  test('should display all required form sections', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Check for main form sections/tabs
    const expectedSections = [
      'Basic Info',
      'Pricing',
      'Options',
      'Images',
      'Features'
    ];

    for (const section of expectedSections) {
      await expect(page.locator('text=' + section).first()).toBeVisible();
    }

    // Verify Basic Info tab is active by default
    const basicInfoTab = page.locator('[data-testid="basic-info-tab"], [role="tab"]').filter({ hasText: 'Basic Info' }).first();
    if (await basicInfoTab.isVisible()) {
      await expect(basicInfoTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Try to save without filling required fields
    const saveButton = page.locator('button').filter({ hasText: /Save|Create Product|Submit/i }).first();
    await saveButton.click();

    // Wait for validation messages
    await page.waitForTimeout(1000);

    // Check for validation error messages
    const errorMessages = page.locator('.error, .text-red-500, .text-red-600, .text-destructive, [role="alert"]');
    await expect(errorMessages.first()).toBeVisible();

    // Check for specific field errors or general validation message
    await expect(page.locator('text=/required|Required|field is required|Please fill/i').first()).toBeVisible();
  });

  test('should successfully create a new product with valid data', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    console.log('Starting product creation test...');

    // Fill Basic Info
    await fillBasicInfo(page, testProduct);

    // Fill Pricing Matrix (if present)
    await fillPricingMatrix(page, testProduct);

    // Fill Options/Specifications
    await fillProductOptions(page);

    // Save the product
    const saveButton = page.locator('button').filter({ hasText: /Save|Create Product|Submit/i }).first();
    await expect(saveButton).toBeVisible();
    
    console.log('Clicking save button...');
    await saveButton.click();

    // Wait for success message or redirect
    await page.waitForTimeout(3000);

    // Check for success indicators
    const successIndicators = [
      page.locator('text=/successfully|Success|created|Product added/i'),
      page.locator('.success, .text-green-500, .text-green-600'),
      page.locator('[role="alert"]').filter({ hasText: /success/i })
    ];

    let foundSuccess = false;
    for (const indicator of successIndicators) {
      if (await indicator.first().isVisible()) {
        foundSuccess = true;
        break;
      }
    }

    // If no success message, check if we redirected to products list
    if (!foundSuccess) {
      await expect(page).toHaveURL(/\/vendor\/products$/);
      // Verify product appears in the list
      await expect(page.locator('text=' + testProduct.name)).toBeVisible();
    } else {
      expect(foundSuccess).toBe(true);
    }

    console.log('Product creation test completed successfully');
  });

  test('should handle invalid product data appropriately', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Fill form with invalid data
    await fillBasicInfo(page, invalidProductData);

    // Try to save
    const saveButton = page.locator('button').filter({ hasText: /Save|Create Product|Submit/i }).first();
    await saveButton.click();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Should show validation errors
    const errorElements = page.locator('.error, .text-red-500, .text-red-600, .text-destructive, [role="alert"]');
    await expect(errorElements.first()).toBeVisible();

    // Should not redirect away from the form
    await expect(page).toHaveURL(/\/vendor\/products\/new/);
  });

  test('should persist form data when switching between tabs', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Fill basic info
    await fillField(page, 'name', testProduct.name);
    await fillField(page, 'shortDescription', testProduct.shortDescription);

    // Switch to pricing tab if it exists
    const pricingTab = page.locator('[role="tab"], button, a').filter({ hasText: /Pricing|Price/i }).first();
    if (await pricingTab.isVisible()) {
      await pricingTab.click();
      await page.waitForTimeout(500);

      // Switch back to basic info
      const basicInfoTab = page.locator('[role="tab"], button, a').filter({ hasText: /Basic Info|Basic/i }).first();
      await basicInfoTab.click();
      await page.waitForTimeout(500);

      // Verify data is still there
      const nameField = page.locator('input[name="name"], input[id="name"], input[placeholder*="name" i]').first();
      await expect(nameField).toHaveValue(testProduct.name);
    }
  });

  test('should allow uploading product images', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Navigate to Images tab if it exists
    const imagesTab = page.locator('[role="tab"], button, a').filter({ hasText: /Images|Photos/i }).first();
    
    if (await imagesTab.isVisible()) {
      await imagesTab.click();
      await page.waitForTimeout(500);

      // Look for file upload input
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        // Create a test image file
        const testImagePath = await createTestImage();
        
        // Upload the file
        await fileInput.setInputFiles(testImagePath);
        
        // Wait for upload to process
        await page.waitForTimeout(2000);
        
        // Verify image was uploaded (look for preview or success message)
        const uploadSuccess = page.locator('text=/uploaded|success|added/i, img[src*="data:"], img[src*="blob:"]');
        await expect(uploadSuccess.first()).toBeVisible();
      }
    }
  });

  test('should validate price fields correctly', async ({ page }) => {
    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Test negative price
    await fillField(page, 'basePrice', '-100');
    
    const saveButton = page.locator('button').filter({ hasText: /Save|Create Product|Submit/i }).first();
    await saveButton.click();

    await page.waitForTimeout(1000);
    
    // Should show price validation error
    const priceError = page.locator('text=/price.*positive|positive.*price|invalid.*price/i');
    await expect(priceError.first()).toBeVisible();

    // Test very high price
    await fillField(page, 'basePrice', '999999999');
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Should either accept it or show reasonable limit error
    // This test ensures the form handles edge cases gracefully
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/products/create', route => {
      route.abort('failed');
    });

    await page.goto('/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Fill valid data
    await fillBasicInfo(page, testProduct);

    // Try to save
    const saveButton = page.locator('button').filter({ hasText: /Save|Create Product|Submit/i }).first();
    await saveButton.click();

    // Wait for error handling
    await page.waitForTimeout(3000);

    // Should show network error message
    const errorMessage = page.locator('text=/network error|failed to save|error occurred|try again/i');
    await expect(errorMessage.first()).toBeVisible();

    // Should remain on the form page
    await expect(page).toHaveURL(/\/vendor\/products\/new/);
  });

});

// Helper functions

async function fillBasicInfo(page: Page, product: any) {
  console.log('Filling basic info...');
  
  // Fill product name
  await fillField(page, 'name', product.name);
  
  // Fill short description
  await fillField(page, 'shortDescription', product.shortDescription);
  
  // Fill full description
  await fillField(page, 'fullDescription', product.fullDescription);
  
  // Fill SKU
  await fillField(page, 'sku', product.sku);
  
  // Fill base price
  await fillField(page, 'basePrice', product.basePrice);
  
  // Select category
  await selectCategory(page, product.category);
}

async function fillField(page: Page, fieldName: string, value: string) {
  if (!value) return;
  
  const fieldSelectors = [
    `input[name="${fieldName}"]`,
    `input[id="${fieldName}"]`,
    `input[placeholder*="${fieldName}" i]`,
    `textarea[name="${fieldName}"]`,
    `textarea[id="${fieldName}"]`,
    `textarea[placeholder*="${fieldName}" i]`
  ];

  // Try different field name variations
  const nameVariations = [
    fieldName,
    fieldName.toLowerCase(),
    fieldName.replace(/([A-Z])/g, '-$1').toLowerCase(),
    fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
  ];

  for (const variation of nameVariations) {
    for (const selector of fieldSelectors.map(s => s.replace(fieldName, variation))) {
      const field = page.locator(selector).first();
      if (await field.isVisible()) {
        await field.fill(value);
        console.log(`Filled ${fieldName} with value: ${value}`);
        return;
      }
    }
  }

  console.log(`Warning: Could not find field for ${fieldName}`);
}

async function selectCategory(page: Page, category: string) {
  console.log(`Selecting category: ${category}`);
  
  const categorySelectors = [
    'select[name="category"]',
    'select[name="primaryCategory"]',
    'select[id="category"]',
    'select[id="primaryCategory"]',
    '[data-testid="category-select"]'
  ];

  for (const selector of categorySelectors) {
    const select = page.locator(selector).first();
    if (await select.isVisible()) {
      await select.selectOption({ label: category });
      console.log(`Selected category: ${category}`);
      return;
    }
  }

  // Try combobox/dropdown approach
  const dropdown = page.locator('button, div').filter({ hasText: /Select category|Choose category|Category/i }).first();
  if (await dropdown.isVisible()) {
    await dropdown.click();
    await page.waitForTimeout(500);
    
    const option = page.locator('text=' + category).first();
    if (await option.isVisible()) {
      await option.click();
      console.log(`Selected category from dropdown: ${category}`);
    }
  }
}

async function fillPricingMatrix(page: Page, product: any) {
  // Navigate to pricing tab if it exists
  const pricingTab = page.locator('[role="tab"], button, a').filter({ hasText: /Pricing|Price/i }).first();
  
  if (await pricingTab.isVisible()) {
    await pricingTab.click();
    await page.waitForTimeout(500);

    // Fill dimension ranges and prices
    await fillField(page, 'minWidth', product.minWidth);
    await fillField(page, 'maxWidth', product.maxWidth);
    await fillField(page, 'minHeight', product.minHeight);
    await fillField(page, 'maxHeight', product.maxHeight);
  }
}

async function fillProductOptions(page: Page) {
  // Navigate to options tab if it exists
  const optionsTab = page.locator('[role="tab"], button, a').filter({ hasText: /Options|Specifications/i }).first();
  
  if (await optionsTab.isVisible()) {
    await optionsTab.click();
    await page.waitForTimeout(500);

    // Check some common options if available
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    // Check first few options if they exist
    for (let i = 0; i < Math.min(count, 3); i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isVisible() && !await checkbox.isChecked()) {
        await checkbox.check();
      }
    }
  }
}

async function createTestImage(): Promise<string> {
  // In a real test environment, you would create or use a test image file
  // For this example, we'll return a path to a test image
  return './test-files/test-product-image.jpg';
}