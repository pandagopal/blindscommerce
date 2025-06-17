import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Admin Dashboard and Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('admin');
  });

  test.afterEach(async ({ page }) => {
    await helpers.logout();
  });

  test('Admin dashboard overview and statistics', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000); // Wait for page to load

    // Verify dashboard components
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=Welcome back, Test')).toBeVisible();
    
    // Check key metrics cards
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();

    // Verify recent activity sections
    await expect(page.locator('text=Recent Orders')).toBeVisible();
    await expect(page.locator('text=Recent Users')).toBeVisible();
    
    // Check navigation menu
    await expect(page.locator('text=Admin Portal')).toBeVisible();
    
    // Check specific navigation items using more precise selectors
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Products")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Orders")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Users")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Vendors")')).toBeVisible();
  });

  test('User management functionality', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(2000); // Wait for page to load

    // Verify user list and page elements
    await expect(page.locator('h1:has-text("Users")')).toBeVisible();
    await expect(page.locator('text=Manage user accounts and permissions')).toBeVisible();
    
    // Verify the table structure
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("USER")')).toBeVisible();
    await expect(page.locator('th:has-text("ROLE")')).toBeVisible();
    await expect(page.locator('th:has-text("STATUS")')).toBeVisible();
    
    // Verify users are displayed in the table
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Test user search functionality
    await page.fill('input[placeholder="Search users..."]', 'admin@smartblindshub.com');
    await page.waitForTimeout(1000);
    await expect(page.locator('tbody tr:has-text("admin@smartblindshub.com")').first()).toBeVisible();

    // Clear search
    await page.fill('input[placeholder="Search users..."]', '');
    await page.waitForTimeout(1000);

    // Test role filter dropdown
    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption('vendor');
    await page.waitForTimeout(1000);
    await expect(page.locator('span:has-text("Vendor")').first()).toBeVisible();

    // Reset filter (don't worry about exact reset for now)
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify action buttons are present
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("+")')).toBeVisible(); // Add user button
  });

  test('Vendor management and approval workflow', async ({ page }) => {
    await page.goto('/admin/vendors');
    await helpers.waitForLoadingToFinish();

    // Verify vendor list
    await expect(page.locator('[data-testid="vendor-list"]')).toBeVisible();
    
    // Test pending vendor applications
    await page.click('[data-testid="pending-applications-tab"]');
    await expect(page.locator('[data-testid="pending-vendor"]')).toHaveCount.greaterThan(0);

    // Review vendor application
    await page.click('[data-testid="pending-vendor"]:first-child [data-testid="review-application"]');
    await expect(page.locator('[data-testid="vendor-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="business-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-documents"]')).toBeVisible();

    // Approve vendor
    await page.click('[data-testid="approve-vendor"]');
    await page.fill('[data-testid="approval-notes"]', 'Application approved - all documents verified');
    await page.click('[data-testid="confirm-approval"]');
    await helpers.expectToastMessage('Vendor approved successfully');

    // Create new vendor manually
    await page.click('[data-testid="create-vendor-button"]');
    await page.fill('[data-testid="vendor-company"]', 'Test Blinds Co');
    await page.fill('[data-testid="vendor-email"]', 'vendor@testblinds.com');
    await page.fill('[data-testid="vendor-phone"]', '555-123-4567');
    await page.fill('[data-testid="vendor-address"]', '123 Industrial Ave');
    await page.click('[data-testid="save-vendor"]');
    await helpers.expectToastMessage('Vendor created successfully');

    // Test vendor performance metrics
    await page.click('[data-testid="vendor-item"]:first-child [data-testid="view-metrics"]');
    await expect(page.locator('[data-testid="vendor-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-volume"]')).toContainText('$');
    await expect(page.locator('[data-testid="order-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="customer-rating"]')).toContainText(/\d\.\d/);
  });

  test('Product management and catalog oversight', async ({ page }) => {
    await page.goto('/admin/products');
    await helpers.waitForLoadingToFinish();

    // Verify product list
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
    
    // Test product search and filtering
    await page.fill('[data-testid="product-search"]', 'roller shade');
    await page.click('[data-testid="search-products"]');
    await expect(page.locator('[data-testid="product-item"]')).toContainText('Roller Shade');

    // Filter by category
    await page.selectOption('[data-testid="category-filter"]', 'roller-shades');
    await helpers.waitForLoadingToFinish();

    // Filter by vendor
    await page.selectOption('[data-testid="vendor-filter"]', 'test-vendor');
    await helpers.waitForLoadingToFinish();

    // Review product for approval
    await page.click('[data-testid="product-item"]:first-child [data-testid="review-product"]');
    await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-images"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-info"]')).toBeVisible();

    // Approve product
    await page.click('[data-testid="approve-product"]');
    await page.fill('[data-testid="approval-notes"]', 'Product meets quality standards');
    await page.click('[data-testid="confirm-product-approval"]');
    await helpers.expectToastMessage('Product approved');

    // Feature product
    await page.click('[data-testid="feature-product"]');
    await page.selectOption('[data-testid="feature-location"]', 'homepage');
    await page.click('[data-testid="confirm-feature"]');
    await helpers.expectToastMessage('Product featured successfully');

    // Bulk product operations
    await page.check('[data-testid="product-checkbox"]:nth-child(1)');
    await page.check('[data-testid="product-checkbox"]:nth-child(2)');
    await page.click('[data-testid="bulk-actions"]');
    await page.click('[data-testid="bulk-approve"]');
    await page.click('[data-testid="confirm-bulk-action"]');
    await helpers.expectToastMessage('Bulk operation completed');
  });

  test('Order management and tracking', async ({ page }) => {
    await page.goto('/admin/orders');
    await helpers.waitForLoadingToFinish();

    // Verify order list
    await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
    
    // Test order filtering
    await page.selectOption('[data-testid="order-status-filter"]', 'pending');
    await helpers.waitForLoadingToFinish();
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Pending');

    // Filter by date range
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    await page.click('[data-testid="apply-date-filter"]');

    // View order details
    await page.click('[data-testid="order-item"]:first-child [data-testid="view-order"]');
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-info"]')).toBeVisible();

    // Update order status
    await page.selectOption('[data-testid="order-status-select"]', 'processing');
    await page.fill('[data-testid="status-notes"]', 'Order moved to processing - vendor notified');
    await page.click('[data-testid="update-status"]');
    await helpers.expectToastMessage('Order status updated');

    // Add order notes
    await page.fill('[data-testid="order-notes"]', 'Customer requested expedited shipping');
    await page.click('[data-testid="add-note"]');
    await helpers.expectToastMessage('Note added to order');

    // Process refund
    await page.click('[data-testid="process-refund"]');
    await page.fill('[data-testid="refund-amount"]', '150.00');
    await page.fill('[data-testid="refund-reason"]', 'Damaged product');
    await page.click('[data-testid="confirm-refund"]');
    await helpers.expectToastMessage('Refund processed successfully');
  });

  test('System settings and configuration', async ({ page }) => {
    await page.goto('/admin/settings');
    await helpers.waitForLoadingToFinish();

    // Verify settings sections
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-settings"]')).toBeVisible();

    // Update site settings
    await page.fill('[data-testid="site-name"]', 'Smart Blinds Hub - Updated');
    await page.fill('[data-testid="contact-email"]', 'admin@smartblindshub.com');
    await page.fill('[data-testid="support-phone"]', '1-800-BLINDS-1');

    // Configure payment methods
    await page.check('[data-testid="stripe-enabled"]');
    await page.check('[data-testid="paypal-enabled"]');
    await page.uncheck('[data-testid="afterpay-enabled"]');

    // Set up shipping zones
    await page.click('[data-testid="add-shipping-zone"]');
    await page.fill('[data-testid="zone-name"]', 'West Coast');
    await page.fill('[data-testid="zone-states"]', 'CA,OR,WA');
    await page.fill('[data-testid="shipping-rate"]', '15.00');
    await page.click('[data-testid="save-shipping-zone"]');

    // Save all settings
    await page.click('[data-testid="save-settings"]');
    await helpers.expectToastMessage('Settings updated successfully');

    // Test email template customization
    await page.click('[data-testid="email-templates-tab"]');
    await page.click('[data-testid="order-confirmation-template"]');
    await page.fill('[data-testid="email-subject"]', 'Your Smart Blinds Order Confirmation');
    await page.fill('[data-testid="email-body"]', 'Thank you for your order! Your custom blinds are being processed...');
    await page.click('[data-testid="save-template"]');
    await helpers.expectToastMessage('Email template updated');
  });

  test('Analytics and reporting dashboard', async ({ page }) => {
    await page.goto('/admin/analytics');
    await helpers.waitForLoadingToFinish();

    // Verify analytics dashboard
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversion-metrics"]')).toBeVisible();

    // Test date range selection
    await page.selectOption('[data-testid="date-range"]', '30days');
    await helpers.waitForLoadingToFinish();
    await expect(page.locator('[data-testid="revenue-30days"]')).toContainText('$');

    // View detailed reports
    await page.click('[data-testid="sales-report"]');
    await expect(page.locator('[data-testid="sales-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-performance"]')).toBeVisible();

    // Export report
    await page.click('[data-testid="export-report"]');
    await page.selectOption('[data-testid="export-format"]', 'csv');
    await page.click('[data-testid="download-report"]');
    // Note: File download would need special handling in actual test

    // Customer analytics
    await page.click('[data-testid="customer-analytics-tab"]');
    await expect(page.locator('[data-testid="customer-segments"]')).toBeVisible();
    await expect(page.locator('[data-testid="lifetime-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="churn-rate"]')).toBeVisible();

    // Product performance
    await page.click('[data-testid="product-analytics-tab"]');
    await expect(page.locator('[data-testid="bestsellers"]')).toBeVisible();
    await expect(page.locator('[data-testid="low-performers"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-alerts"]')).toBeVisible();
  });

  test('Bulk operations and data management', async ({ page }) => {
    await page.goto('/admin/bulk-operations');
    await helpers.waitForLoadingToFinish();

    // Bulk user import
    await page.click('[data-testid="bulk-user-import"]');
    await helpers.uploadFile('[data-testid="user-csv-upload"]', 'test-files/users.csv');
    await page.click('[data-testid="validate-users"]');
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
    await page.click('[data-testid="import-users"]');
    await helpers.expectToastMessage('Users imported successfully');

    // Bulk product operations
    await page.click('[data-testid="bulk-product-tab"]');
    await page.selectOption('[data-testid="bulk-action-select"]', 'approve');
    await page.fill('[data-testid="product-filter"]', 'pending');
    await page.click('[data-testid="apply-bulk-action"]');
    await page.click('[data-testid="confirm-bulk-operation"]');
    await helpers.expectToastMessage('Bulk operation completed');

    // Database maintenance
    await page.click('[data-testid="database-maintenance-tab"]');
    await page.click('[data-testid="cleanup-logs"]');
    await page.selectOption('[data-testid="log-retention"]', '30days');
    await page.click('[data-testid="start-cleanup"]');
    await helpers.expectToastMessage('Database cleanup initiated');

    // Data export
    await page.click('[data-testid="data-export-tab"]');
    await page.check('[data-testid="export-users"]');
    await page.check('[data-testid="export-orders"]');
    await page.selectOption('[data-testid="export-format"]', 'json');
    await page.click('[data-testid="generate-export"]');
    await helpers.expectToastMessage('Export generated successfully');
  });
});