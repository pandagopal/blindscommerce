import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Sales Representative Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('sales');
  });

  test.afterEach(async ({ page }) => {
    await helpers.logout();
  });

  test('Sales dashboard overview and metrics', async ({ page }) => {
    await page.goto('/sales');
    await helpers.waitForLoadingToFinish();

    // Verify sales dashboard
    await expect(page.locator('[data-testid="sales-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-metrics"]')).toBeVisible();

    // Check performance metrics
    await expect(page.locator('[data-testid="monthly-sales"]')).toContainText('$');
    await expect(page.locator('[data-testid="conversion-rate"]')).toContainText('%');
    await expect(page.locator('[data-testid="active-leads"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="closed-deals"]')).toContainText(/\d+/);

    // Verify activity feed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toHaveCount.greaterThan(0);

    // Check commission tracking
    await expect(page.locator('[data-testid="commission-earned"]')).toContainText('$');
    await expect(page.locator('[data-testid="commission-pending"]')).toContainText('$');

    // Verify sales targets
    await expect(page.locator('[data-testid="monthly-target"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-progress"]')).toBeVisible();
  });

  test('Lead management and customer interaction', async ({ page }) => {
    await page.goto('/sales/leads');
    await helpers.waitForLoadingToFinish();

    // Verify leads list
    await expect(page.locator('[data-testid="leads-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-item"]')).toHaveCount.greaterThan(0);

    // Test lead filtering
    await page.selectOption('[data-testid="lead-status-filter"]', 'new');
    await helpers.waitForLoadingToFinish();
    await expect(page.locator('[data-testid="lead-status"]')).toContainText('New');

    // View lead details
    await page.click('[data-testid="lead-item"]:first-child [data-testid="view-lead"]');
    await expect(page.locator('[data-testid="lead-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-history"]')).toBeVisible();

    // Update lead status
    await page.selectOption('[data-testid="lead-status-select"]', 'contacted');
    await page.fill('[data-testid="status-notes"]', 'Initial contact made via phone');
    await page.click('[data-testid="update-lead-status"]');
    await helpers.expectToastMessage('Lead status updated');

    // Add lead notes
    await page.fill('[data-testid="lead-notes"]', 'Customer interested in roller shades for living room. Budget: $500-800');
    await page.click('[data-testid="add-note"]');
    await helpers.expectToastMessage('Note added successfully');

    // Schedule follow-up
    await page.click('[data-testid="schedule-followup"]');
    await page.fill('[data-testid="followup-date"]', '2024-07-01');
    await page.fill('[data-testid="followup-time"]', '14:00');
    await page.fill('[data-testid="followup-notes"]', 'Call to discuss product options and pricing');
    await page.click('[data-testid="save-followup"]');
    await helpers.expectToastMessage('Follow-up scheduled');

    // Convert lead to opportunity
    await page.click('[data-testid="convert-to-opportunity"]');
    await page.fill('[data-testid="opportunity-value"]', '650.00');
    await page.selectOption('[data-testid="probability"]', '75');
    await page.fill('[data-testid="expected-close"]', '2024-07-15');
    await page.click('[data-testid="create-opportunity"]');
    await helpers.expectToastMessage('Lead converted to opportunity');
  });

  test('Customer assistance and cart management', async ({ page }) => {
    await page.goto('/sales/assistance');
    await helpers.waitForLoadingToFinish();

    // Verify assistance dashboard
    await expect(page.locator('[data-testid="assistance-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible();

    // Start customer assistance session
    await page.click('[data-testid="start-assistance"]');
    await page.fill('[data-testid="customer-email"]', 'customer@test.com');
    await page.click('[data-testid="find-customer"]');
    await expect(page.locator('[data-testid="customer-profile"]')).toBeVisible();

    // View customer cart
    await page.click('[data-testid="view-cart"]');
    await expect(page.locator('[data-testid="customer-cart"]')).toBeVisible();

    // Assist with product configuration
    await page.click('[data-testid="assist-configuration"]');
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    
    // Help customer with dimensions
    await helpers.fillFractionInput('[data-testid="width-input"]', 60, '1/4');
    await helpers.fillFractionInput('[data-testid="height-input"]', 84, '3/8');
    await page.click('[data-testid="next-step"]');

    // Recommend premium options
    await page.click('[data-testid="recommend-premium-color"]');
    await page.fill('[data-testid="recommendation-note"]', 'This color will complement your existing decor beautifully');
    await page.click('[data-testid="add-recommendation"]');

    // Apply sales discount
    await page.click('[data-testid="apply-discount"]');
    await page.selectOption('[data-testid="discount-type"]', 'percentage');
    await page.fill('[data-testid="discount-value"]', '10');
    await page.fill('[data-testid="discount-reason"]', 'First-time customer discount');
    await page.click('[data-testid="confirm-discount"]');
    await helpers.expectToastMessage('Discount applied');

    // Complete assistance session
    await page.click('[data-testid="complete-assistance"]');
    await page.fill('[data-testid="session-summary"]', 'Helped customer configure roller shade, applied 10% discount');
    await page.click('[data-testid="save-session"]');
    await helpers.expectToastMessage('Assistance session completed');
  });

  test('Quote generation and proposal management', async ({ page }) => {
    await page.goto('/sales/quotes');
    await helpers.waitForLoadingToFinish();

    // Create new quote
    await page.click('[data-testid="create-quote"]');
    await page.fill('[data-testid="customer-email"]', 'prospect@example.com');
    await page.fill('[data-testid="customer-name"]', 'John Prospect');
    await page.fill('[data-testid="project-name"]', 'Home Office Window Treatments');

    // Add products to quote
    await page.click('[data-testid="add-product"]');
    await page.fill('[data-testid="product-search"]', 'roller shade');
    await page.click('[data-testid="search-products"]');
    await page.click('[data-testid="product-result"]:first-child [data-testid="add-to-quote"]');

    // Configure product in quote
    await helpers.fillFractionInput('[data-testid="quote-width"]', 48, '1/2');
    await helpers.fillFractionInput('[data-testid="quote-height"]', 72, '0');
    await page.fill('[data-testid="quantity"]', '3');
    await page.click('[data-testid="confirm-product"]');

    // Add installation service
    await page.check('[data-testid="include-installation"]');
    await page.fill('[data-testid="installation-notes"]', 'Standard installation, 3 windows');

    // Set quote pricing
    await page.fill('[data-testid="unit-price"]', '245.00');
    await page.fill('[data-testid="installation-fee"]', '150.00');
    await page.selectOption('[data-testid="discount-type"]', 'bulk');
    await page.fill('[data-testid="discount-amount"]', '50.00');

    // Add quote terms
    await page.fill('[data-testid="quote-validity"]', '30');
    await page.fill('[data-testid="delivery-timeframe"]', '2-3 weeks');
    await page.fill('[data-testid="payment-terms"]', '50% deposit, balance on completion');

    // Generate and send quote
    await page.click('[data-testid="generate-quote"]');
    await expect(page.locator('[data-testid="quote-preview"]')).toBeVisible();
    await page.click('[data-testid="send-quote"]');
    await helpers.expectToastMessage('Quote sent successfully');

    // Track quote status
    await page.goto('/sales/quotes');
    await expect(page.locator('[data-testid="quote-item"]')).toContainText('Home Office Window Treatments');
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Sent');

    // Follow up on quote
    await page.click('[data-testid="quote-item"]:first-child [data-testid="follow-up"]');
    await page.fill('[data-testid="followup-message"]', 'Hi John, following up on the quote we sent for your office windows. Any questions?');
    await page.click('[data-testid="send-followup"]');
    await helpers.expectToastMessage('Follow-up sent');
  });

  test('Appointment scheduling and management', async ({ page }) => {
    await page.goto('/sales/appointments');
    await helpers.waitForLoadingToFinish();

    // Verify appointments calendar
    await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-appointments"]')).toBeVisible();

    // Schedule new appointment
    await page.click('[data-testid="schedule-appointment"]');
    await page.fill('[data-testid="customer-name"]', 'Sarah Williams');
    await page.fill('[data-testid="customer-phone"]', '555-987-6543');
    await page.fill('[data-testid="customer-email"]', 'sarah@example.com');
    
    // Set appointment details
    await page.selectOption('[data-testid="appointment-type"]', 'in-home-consultation');
    await page.fill('[data-testid="appointment-date"]', '2024-07-05');
    await page.fill('[data-testid="appointment-time"]', '10:00');
    await page.fill('[data-testid="appointment-duration"]', '60');
    
    // Add location
    await page.fill('[data-testid="appointment-address"]', '456 Oak Street, Springfield, IL 62701');
    await page.fill('[data-testid="appointment-notes"]', 'Kitchen and living room windows, interested in motorized options');
    
    // Confirm appointment
    await page.click('[data-testid="confirm-appointment"]');
    await helpers.expectToastMessage('Appointment scheduled successfully');

    // View appointment details
    await page.click('[data-testid="appointment-item"]:first-child');
    await expect(page.locator('[data-testid="appointment-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-contact"]')).toBeVisible();
    await expect(page.locator('[data-testid="driving-directions"]')).toBeVisible();

    // Reschedule appointment
    await page.click('[data-testid="reschedule-appointment"]');
    await page.fill('[data-testid="new-date"]', '2024-07-06');
    await page.fill('[data-testid="new-time"]', '14:00');
    await page.fill('[data-testid="reschedule-reason"]', 'Customer requested different time');
    await page.click('[data-testid="confirm-reschedule"]');
    await helpers.expectToastMessage('Appointment rescheduled');

    // Complete appointment
    await page.click('[data-testid="complete-appointment"]');
    await page.fill('[data-testid="appointment-outcome"]', 'Measured 5 windows, customer interested in cellular shades');
    await page.fill('[data-testid="next-steps"]', 'Send quote by EOD tomorrow');
    await page.click('[data-testid="save-completion"]');
    await helpers.expectToastMessage('Appointment completed');
  });

  test('Order processing and customer support', async ({ page }) => {
    await page.goto('/sales/orders');
    await helpers.waitForLoadingToFinish();

    // Verify orders list
    await expect(page.locator('[data-testid="sales-orders"]')).toBeVisible();
    
    // Filter orders by sales rep
    await page.selectOption('[data-testid="assigned-filter"]', 'my-orders');
    await helpers.waitForLoadingToFinish();

    // Process new order
    await page.click('[data-testid="order-item"]:first-child [data-testid="process-order"]');
    await expect(page.locator('[data-testid="order-processing"]')).toBeVisible();

    // Verify customer information
    await expect(page.locator('[data-testid="customer-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="billing-address"]')).toBeVisible();

    // Review order items
    await expect(page.locator('[data-testid="order-items-list"]')).toBeVisible();
    await page.click('[data-testid="order-item-details"]:first-child');
    await expect(page.locator('[data-testid="product-configuration"]')).toBeVisible();

    // Add order notes
    await page.fill('[data-testid="processing-notes"]', 'Customer confirmed installation date for next week');
    await page.click('[data-testid="add-processing-note"]');

    // Update order status
    await page.selectOption('[data-testid="order-status"]', 'confirmed');
    await page.click('[data-testid="update-order-status"]');
    await helpers.expectToastMessage('Order status updated');

    // Schedule installation
    await page.click('[data-testid="schedule-installation"]');
    await page.fill('[data-testid="installation-date"]', '2024-07-10');
    await page.fill('[data-testid="installation-time"]', '09:00');
    await page.selectOption('[data-testid="installer"]', 'installer-1');
    await page.click('[data-testid="confirm-installation"]');
    await helpers.expectToastMessage('Installation scheduled');

    // Send order confirmation
    await page.click('[data-testid="send-confirmation"]');
    await page.fill('[data-testid="confirmation-message"]', 'Your order has been confirmed and installation is scheduled for July 10th at 9 AM.');
    await page.click('[data-testid="send-email"]');
    await helpers.expectToastMessage('Confirmation email sent');
  });

  test('Performance tracking and reporting', async ({ page }) => {
    await page.goto('/sales/reports');
    await helpers.waitForLoadingToFinish();

    // Verify reports dashboard
    await expect(page.locator('[data-testid="sales-reports"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();

    // View monthly performance
    await page.selectOption('[data-testid="report-period"]', 'monthly');
    await helpers.waitForLoadingToFinish();
    
    await expect(page.locator('[data-testid="sales-volume"]')).toContainText('$');
    await expect(page.locator('[data-testid="orders-closed"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="conversion-rate"]')).toContainText('%');
    await expect(page.locator('[data-testid="average-deal-size"]')).toContainText('$');

    // View sales pipeline
    await page.click('[data-testid="pipeline-tab"]');
    await expect(page.locator('[data-testid="pipeline-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-value"]')).toContainText('$');

    // Activity report
    await page.click('[data-testid="activity-tab"]');
    await expect(page.locator('[data-testid="calls-made"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="emails-sent"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="appointments-scheduled"]')).toContainText(/\d+/);

    // Commission tracking
    await page.click('[data-testid="commission-tab"]');
    await expect(page.locator('[data-testid="total-commission"]')).toContainText('$');
    await expect(page.locator('[data-testid="pending-commission"]')).toContainText('$');
    await expect(page.locator('[data-testid="paid-commission"]')).toContainText('$');

    // Export report
    await page.click('[data-testid="export-performance"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="generate-export"]');
    await helpers.expectToastMessage('Report exported successfully');

    // Set performance goals
    await page.click('[data-testid="set-goals"]');
    await page.fill('[data-testid="monthly-sales-goal"]', '15000');
    await page.fill('[data-testid="quarterly-goal"]', '45000');
    await page.fill('[data-testid="calls-per-day"]', '20');
    await page.click('[data-testid="save-goals"]');
    await helpers.expectToastMessage('Performance goals updated');
  });
});