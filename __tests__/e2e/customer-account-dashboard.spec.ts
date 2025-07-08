import { test, expect } from '@playwright/test';

test.describe('Customer Account Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Navigate to account dashboard
    await page.goto('/account');
  });

  test('Customer views and manages profile information', async ({ page }) => {
    // Verify dashboard sections are visible
    await expect(page.locator('[data-testid="account-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="saved-addresses"]')).toBeVisible();
    
    // Navigate to profile settings
    await page.click('[data-testid="edit-profile"]');
    
    // Update profile information
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe Updated');
    await page.fill('input[name="phone"]', '555-987-6543');
    
    // Update email preferences
    await page.check('input[name="emailNewsletter"]');
    await page.uncheck('input[name="emailPromotions"]');
    
    // Save profile changes
    await page.click('[data-testid="save-profile"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="profile-updated"]')).toContainText('Profile updated successfully');
    
    // Verify changes persisted
    await page.reload();
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe Updated');
  });

  test('Customer manages shipping addresses', async ({ page }) => {
    // Navigate to addresses section
    await page.click('[data-testid="manage-addresses"]');
    
    // Add new address
    await page.click('[data-testid="add-address"]');
    
    // Fill address form
    await page.fill('input[name="addressLabel"]', 'Work');
    await page.fill('input[name="address1"]', '456 Business Ave');
    await page.fill('input[name="address2"]', 'Suite 200');
    await page.fill('input[name="city"]', 'San Francisco');
    await page.selectOption('select[name="state"]', 'CA');
    await page.fill('input[name="zipCode"]', '94105');
    
    // Set as default shipping address
    await page.check('input[name="defaultShipping"]');
    
    // Save address
    await page.click('[data-testid="save-address"]');
    
    // Verify address added
    await expect(page.locator('[data-testid="address-card-work"]')).toBeVisible();
    await expect(page.locator('[data-testid="default-shipping-badge"]')).toBeVisible();
    
    // Edit existing address
    await page.click('[data-testid="edit-address-home"]');
    await page.fill('input[name="address1"]', '789 Updated St');
    await page.click('[data-testid="save-address"]');
    
    // Delete address
    await page.click('[data-testid="delete-address-old"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify address removed
    await expect(page.locator('[data-testid="address-card-old"]')).not.toBeVisible();
  });

  test('Customer views order history and details', async ({ page }) => {
    // Verify recent orders section
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-card"]').first()).toBeVisible();
    
    // Click view all orders
    await page.click('[data-testid="view-all-orders"]');
    
    // Verify orders list
    await expect(page).toHaveURL('/account/orders');
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
    
    // Filter orders by status
    await page.selectOption('select[name="orderStatus"]', 'delivered');
    await expect(page.locator('[data-testid="order-row"]')).toHaveCount(3); // Assuming 3 delivered orders
    
    // Search orders
    await page.fill('input[name="orderSearch"]', 'ORD-2024-001');
    await page.click('[data-testid="search-orders"]');
    
    // Click on specific order
    await page.click('[data-testid="order-row-0"]');
    
    // Verify order details
    await expect(page.locator('[data-testid="order-number"]')).toContainText('ORD-2024-001');
    await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Delivered');
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toContainText('$');
    
    // Download invoice
    await page.click('[data-testid="download-invoice"]');
    
    // Track shipment
    await page.click('[data-testid="track-shipment"]');
    await expect(page.locator('[data-testid="tracking-info"]')).toBeVisible();
  });

  test('Customer manages saved measurements', async ({ page }) => {
    // Navigate to measurements section
    await page.click('[data-testid="saved-measurements"]');
    
    // Add new measurement
    await page.click('[data-testid="add-measurement"]');
    
    // Fill measurement details
    await page.fill('input[name="measurementName"]', 'Living Room Windows');
    await page.fill('input[name="window1Width"]', '60');
    await page.fill('input[name="window1Height"]', '48');
    await page.fill('input[name="window2Width"]', '36');
    await page.fill('input[name="window2Height"]', '48');
    
    // Add room photo
    const fileInput = page.locator('input[data-testid="room-photo"]');
    await fileInput.setInputFiles('test-assets/living-room.jpg');
    
    // Add notes
    await page.fill('textarea[name="notes"]', 'Two windows facing east, need light filtering');
    
    // Save measurement
    await page.click('[data-testid="save-measurement"]');
    
    // Verify measurement saved
    await expect(page.locator('[data-testid="measurement-card-living-room"]')).toBeVisible();
    
    // Use saved measurement for new order
    await page.click('[data-testid="use-measurement-living-room"]');
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator('input[name="width"]')).toHaveValue('60');
    await expect(page.locator('input[name="height"]')).toHaveValue('48');
  });

  test('Customer manages wishlist and favorites', async ({ page }) => {
    // Navigate to wishlist
    await page.click('[data-testid="view-wishlist"]');
    
    // Verify wishlist items
    await expect(page.locator('[data-testid="wishlist-item"]')).toHaveCount(2); // Assuming 2 items
    
    // Move item to cart
    await page.click('[data-testid="move-to-cart-0"]');
    await expect(page.locator('[data-testid="item-moved-notification"]')).toContainText('Item added to cart');
    
    // Remove item from wishlist
    await page.click('[data-testid="remove-from-wishlist-1"]');
    await expect(page.locator('[data-testid="wishlist-item"]')).toHaveCount(1);
    
    // Share wishlist
    await page.click('[data-testid="share-wishlist"]');
    await page.click('[data-testid="copy-wishlist-link"]');
    await expect(page.locator('[data-testid="link-copied"]')).toContainText('Link copied');
    
    // Create new wishlist
    await page.click('[data-testid="create-wishlist"]');
    await page.fill('input[name="wishlistName"]', 'Bedroom Renovation');
    await page.click('[data-testid="save-wishlist"]');
    
    // Verify new wishlist created
    await expect(page.locator('[data-testid="wishlist-tab-bedroom-renovation"]')).toBeVisible();
  });
});