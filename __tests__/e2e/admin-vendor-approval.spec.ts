import { test, expect } from '@playwright/test';

test.describe('Admin Vendor Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@blindscommerce.com');
    await page.fill('input[name="password"]', 'AdminSecure123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin/dashboard');
  });

  test('Admin reviews and approves new vendor application', async ({ page }) => {
    // Navigate to vendor applications
    await page.goto('/admin/vendors/applications');
    
    // Check for pending applications
    await expect(page.locator('[data-testid="pending-applications-count"]')).toBeVisible();
    
    // Click on first pending application
    await page.click('[data-testid="vendor-application-0"]');
    
    // Review vendor details
    await expect(page.locator('[data-testid="vendor-business-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-tax-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-contact-info"]')).toBeVisible();
    
    // Check business documents
    await page.click('[data-testid="tab-documents"]');
    await expect(page.locator('[data-testid="business-license"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-certificate"]')).toBeVisible();
    
    // Verify product samples
    await page.click('[data-testid="tab-products"]');
    await expect(page.locator('[data-testid="sample-products-list"]')).toBeVisible();
    
    // Add approval notes
    await page.click('[data-testid="tab-review"]');
    await page.fill('textarea[name="approvalNotes"]', 'All documents verified. Business credentials confirmed. Approved for marketplace.');
    
    // Set vendor tier and commission
    await page.selectOption('select[name="vendorTier"]', 'standard');
    await page.fill('input[name="commissionRate"]', '15');
    
    // Approve vendor
    await page.click('[data-testid="approve-vendor"]');
    
    // Confirm approval
    await page.click('[data-testid="confirm-approval"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="approval-success"]')).toContainText('Vendor approved successfully');
    
    // Verify vendor appears in active vendors list
    await page.goto('/admin/vendors/active');
    await expect(page.locator('[data-testid="vendor-row-new"]')).toBeVisible();
  });

  test('Admin rejects vendor with insufficient documentation', async ({ page }) => {
    // Navigate to vendor applications
    await page.goto('/admin/vendors/applications');
    
    // Click on problematic application
    await page.click('[data-testid="vendor-application-incomplete"]');
    
    // Review missing documents
    await page.click('[data-testid="tab-documents"]');
    await expect(page.locator('[data-testid="missing-documents-warning"]')).toBeVisible();
    
    // Add rejection reason
    await page.click('[data-testid="tab-review"]');
    await page.fill('textarea[name="rejectionReason"]', 'Missing required business license and tax certificate. Please resubmit with complete documentation.');
    
    // Select rejection reasons
    await page.check('input[value="missing_documents"]');
    await page.check('input[value="incomplete_information"]');
    
    // Reject application
    await page.click('[data-testid="reject-vendor"]');
    
    // Confirm rejection
    await page.click('[data-testid="confirm-rejection"]');
    
    // Verify rejection recorded
    await expect(page.locator('[data-testid="rejection-success"]')).toContainText('Application rejected');
    
    // Verify vendor notified
    await expect(page.locator('[data-testid="email-sent-notification"]')).toContainText('Rejection email sent');
  });

  test('Admin manages vendor status and settings', async ({ page }) => {
    // Navigate to active vendors
    await page.goto('/admin/vendors/active');
    
    // Search for specific vendor
    await page.fill('input[name="vendorSearch"]', 'Premium Blinds Co');
    await page.click('[data-testid="search-vendors"]');
    
    // Click on vendor to edit
    await page.click('[data-testid="vendor-row-premium"]');
    
    // Update vendor settings
    await page.click('[data-testid="tab-settings"]');
    
    // Update commission rate
    await page.fill('input[name="commissionRate"]', '12');
    
    // Update vendor tier
    await page.selectOption('select[name="vendorTier"]', 'premium');
    
    // Enable additional features
    await page.check('input[name="enableCustomPricing"]');
    await page.check('input[name="enableBulkImport"]');
    await page.check('input[name="enableAPIAccess"]');
    
    // Set API rate limits
    await page.fill('input[name="apiRateLimit"]', '1000');
    
    // Save changes
    await page.click('[data-testid="save-vendor-settings"]');
    
    // Verify changes saved
    await expect(page.locator('[data-testid="settings-saved"]')).toContainText('Vendor settings updated');
    
    // Test vendor suspension
    await page.click('[data-testid="suspend-vendor"]');
    await page.fill('textarea[name="suspensionReason"]', 'Temporary suspension for policy violation review');
    await page.click('[data-testid="confirm-suspension"]');
    
    // Verify vendor suspended
    await expect(page.locator('[data-testid="vendor-status"]')).toContainText('Suspended');
    
    // Reactivate vendor
    await page.click('[data-testid="reactivate-vendor"]');
    await page.click('[data-testid="confirm-reactivation"]');
    
    // Verify vendor active again
    await expect(page.locator('[data-testid="vendor-status"]')).toContainText('Active');
  });

  test('Admin monitors vendor performance and compliance', async ({ page }) => {
    // Navigate to vendor analytics
    await page.goto('/admin/vendors/analytics');
    
    // Select vendor
    await page.selectOption('select[name="vendorSelect"]', 'vendor-123');
    
    // Check performance metrics
    await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-fulfillment-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-satisfaction"]')).toBeVisible();
    await expect(page.locator('[data-testid="return-rate"]')).toBeVisible();
    
    // Check for compliance issues
    await page.click('[data-testid="tab-compliance"]');
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    
    // Review customer complaints
    await page.click('[data-testid="tab-complaints"]');
    await expect(page.locator('[data-testid="complaints-list"]')).toBeVisible();
    
    // Generate performance report
    await page.click('[data-testid="generate-report"]');
    await page.selectOption('select[name="reportPeriod"]', 'last-quarter');
    await page.click('[data-testid="download-report"]');
    
    // Send warning for low performance
    await page.click('[data-testid="send-warning"]');
    await page.fill('textarea[name="warningMessage"]', 'Your fulfillment rate has dropped below acceptable levels. Please improve within 30 days.');
    await page.click('[data-testid="send-warning-email"]');
    
    // Verify warning sent
    await expect(page.locator('[data-testid="warning-sent"]')).toContainText('Performance warning sent');
  });
});