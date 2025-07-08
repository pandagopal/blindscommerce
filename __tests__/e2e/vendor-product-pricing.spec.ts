import { test, expect } from '@playwright/test';

test.describe('Vendor Product Pricing Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as vendor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'vendor@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to vendor dashboard
    await page.waitForURL('/vendor/dashboard');
  });

  test('Vendor updates product pricing matrix', async ({ page }) => {
    // Navigate to products
    await page.goto('/vendor/products');
    
    // Click on first product to edit
    await page.click('[data-testid="product-row-0"]');
    
    // Navigate to pricing tab
    await page.click('[data-testid="tab-pricing"]');
    
    // Verify pricing tab is visible and properly sized
    await expect(page.locator('[data-testid="pricing-tab-content"]')).toBeVisible();
    
    // Update base price
    await page.fill('input[data-testid="base-price"]', '99.99');
    
    // Update size-based pricing matrix
    await page.fill('input[data-testid="price-24x36"]', '89.99');
    await page.fill('input[data-testid="price-36x48"]', '119.99');
    await page.fill('input[data-testid="price-48x60"]', '149.99');
    await page.fill('input[data-testid="price-60x72"]', '189.99');
    
    // Verify input fields are compact and properly sized (recent UI fix)
    const priceInput = page.locator('input[data-testid="price-24x36"]');
    await expect(priceInput).toHaveCSS('height', '24px'); // h-6 = 24px
    
    // Add volume discount tiers
    await page.click('[data-testid="add-volume-tier"]');
    await page.fill('input[data-testid="volume-qty-0"]', '5');
    await page.fill('input[data-testid="volume-discount-0"]', '10');
    
    await page.click('[data-testid="add-volume-tier"]');
    await page.fill('input[data-testid="volume-qty-1"]', '10');
    await page.fill('input[data-testid="volume-discount-1"]', '15');
    
    // Save pricing changes
    await page.click('[data-testid="save-pricing"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Pricing updated successfully');
    
    // Navigate back to products list
    await page.click('[data-testid="back-to-products"]');
    
    // Verify pricing is reflected in product list
    await expect(page.locator('[data-testid="product-price-0"]')).toContainText('$99.99');
  });

  test('Vendor manages fabric pricing and options', async ({ page }) => {
    // Navigate to product edit
    await page.goto('/vendor/products/1/edit');
    
    // Navigate to fabric tab
    await page.click('[data-testid="tab-fabric"]');
    
    // Verify fabric tab has proper scrollable container (recent UI fix)
    const fabricContainer = page.locator('[data-testid="fabric-tab-content"]');
    await expect(fabricContainer).toHaveCSS('overflow-y', 'auto');
    await expect(fabricContainer).toHaveCSS('max-height', '600px');
    
    // Add new fabric option
    await page.click('[data-testid="add-fabric"]');
    
    // Fill fabric details
    await page.fill('input[data-testid="fabric-name-new"]', 'Premium Blackout');
    await page.fill('input[data-testid="fabric-code-new"]', 'PB-001');
    await page.fill('input[data-testid="fabric-surcharge-new"]', '25.00');
    
    // Upload fabric swatch image
    const fileInput = page.locator('input[data-testid="fabric-image-new"]');
    await fileInput.setInputFiles('test-assets/fabric-swatch.jpg');
    
    // Set fabric properties
    await page.check('input[data-testid="fabric-blackout-new"]');
    await page.selectOption('select[data-testid="fabric-opacity-new"]', '100');
    
    // Save fabric
    await page.click('[data-testid="save-fabric-new"]');
    
    // Verify fabric appears in list
    await expect(page.locator('[data-testid="fabric-row-PB-001"]')).toBeVisible();
    await expect(page.locator('[data-testid="fabric-surcharge-PB-001"]')).toContainText('$25.00');
    
    // Test fabric reordering
    await page.dragAndDrop('[data-testid="fabric-drag-PB-001"]', '[data-testid="fabric-drag-0"]');
    
    // Save all changes
    await page.click('[data-testid="save-all-fabrics"]');
    
    // Verify changes persisted
    await page.reload();
    await page.click('[data-testid="tab-fabric"]');
    await expect(page.locator('[data-testid="fabric-row-0"]')).toContainText('Premium Blackout');
  });

  test('Vendor creates and manages discount codes', async ({ page }) => {
    // Navigate to discounts
    await page.goto('/vendor/discounts');
    
    // Create new discount
    await page.click('[data-testid="create-discount"]');
    
    // Fill discount details
    await page.fill('input[name="code"]', 'SUMMER2024');
    await page.fill('input[name="description"]', 'Summer Sale 2024');
    await page.selectOption('select[name="type"]', 'percentage');
    await page.fill('input[name="value"]', '20');
    
    // Set validity period
    await page.fill('input[name="startDate"]', '2024-06-01');
    await page.fill('input[name="endDate"]', '2024-08-31');
    
    // Set usage limits
    await page.fill('input[name="maxUses"]', '100');
    await page.fill('input[name="maxUsesPerCustomer"]', '1');
    
    // Set minimum order value
    await page.fill('input[name="minimumOrderValue"]', '150');
    
    // Apply to specific products
    await page.click('[data-testid="apply-to-products"]');
    await page.check('input[data-testid="product-select-1"]');
    await page.check('input[data-testid="product-select-3"]');
    await page.check('input[data-testid="product-select-5"]');
    
    // Save discount
    await page.click('[data-testid="save-discount"]');
    
    // Verify discount created
    await expect(page.locator('[data-testid="discount-row-SUMMER2024"]')).toBeVisible();
    await expect(page.locator('[data-testid="discount-status-SUMMER2024"]')).toContainText('Active');
    
    // Test discount code in customer view
    await page.goto('/products/1');
    await page.fill('input[name="width"]', '48');
    await page.fill('input[name="height"]', '60');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('/checkout');
    
    // Apply discount code
    await page.fill('input[name="discountCode"]', 'SUMMER2024');
    await page.click('[data-testid="apply-discount"]');
    
    // Verify discount applied
    await expect(page.locator('[data-testid="discount-applied"]')).toContainText('20% off');
  });
});