import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Installer Workflow and Job Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('installer');
  });

  test.afterEach(async ({ page }) => {
    await helpers.logout();
  });

  test('Installer dashboard and job overview', async ({ page }) => {
    await page.goto('/installer');
    await helpers.waitForLoadingToFinish();

    // Verify installer dashboard
    await expect(page.locator('[data-testid="installer-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-summary"]')).toBeVisible();

    // Check key metrics
    await expect(page.locator('[data-testid="pending-jobs"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="completed-jobs"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="earnings-month"]')).toContainText('$');
    await expect(page.locator('[data-testid="customer-rating"]')).toContainText(/\d\.\d/);

    // Verify today's schedule
    await expect(page.locator('[data-testid="todays-schedule"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-appointments"]')).toBeVisible();

    // Check route optimization
    await expect(page.locator('[data-testid="optimized-route"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-drive-time"]')).toContainText(/\d+/);

    // Weather conditions for installations
    await expect(page.locator('[data-testid="weather-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="installation-conditions"]')).toBeVisible();
  });

  test('Job assignment and acceptance workflow', async ({ page }) => {
    await page.goto('/installer/jobs');
    await helpers.waitForLoadingToFinish();

    // Verify available jobs
    await expect(page.locator('[data-testid="available-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-item"]')).toHaveCount.greaterThan(0);

    // View job details
    await page.click('[data-testid="job-item"]:first-child [data-testid="view-details"]');
    await expect(page.locator('[data-testid="job-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="installation-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-details"]')).toBeVisible();

    // Check job requirements
    await expect(page.locator('[data-testid="required-tools"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-duration"]')).toContainText('hours');
    await expect(page.locator('[data-testid="difficulty-level"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText('$');

    // Accept job
    await page.click('[data-testid="accept-job"]');
    await page.fill('[data-testid="availability-date"]', '2024-07-08');
    await page.fill('[data-testid="preferred-time"]', '10:00');
    await page.fill('[data-testid="acceptance-notes"]', 'Available for morning installation');
    await page.click('[data-testid="confirm-acceptance"]');
    await helpers.expectToastMessage('Job accepted successfully');

    // Decline job with reason
    await page.click('[data-testid="job-item"]:nth-child(2) [data-testid="decline-job"]');
    await page.selectOption('[data-testid="decline-reason"]', 'scheduling-conflict');
    await page.fill('[data-testid="decline-notes"]', 'Already booked for that time slot');
    await page.click('[data-testid="confirm-decline"]');
    await helpers.expectToastMessage('Job declined');

    // Request more information
    await page.click('[data-testid="job-item"]:nth-child(3) [data-testid="request-info"]');
    await page.fill('[data-testid="info-request"]', 'Need clarification on window accessibility - second floor installation?');
    await page.click('[data-testid="send-request"]');
    await helpers.expectToastMessage('Information request sent');
  });

  test('Installation appointment scheduling', async ({ page }) => {
    await page.goto('/installer/appointments');
    await helpers.waitForLoadingToFinish();

    // Verify appointments calendar
    await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

    // View appointment details
    await page.click('[data-testid="appointment-item"]:first-child');
    await expect(page.locator('[data-testid="appointment-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-contact"]')).toBeVisible();
    await expect(page.locator('[data-testid="installation-location"]')).toBeVisible();

    // Get driving directions
    await page.click('[data-testid="get-directions"]');
    await expect(page.locator('[data-testid="directions-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-travel"]')).toContainText('minutes');

    // Contact customer
    await page.click('[data-testid="contact-customer"]');
    await page.selectOption('[data-testid="contact-method"]', 'phone');
    await page.fill('[data-testid="call-notes"]', 'Confirming appointment and discussing parking arrangements');
    await page.click('[data-testid="make-contact"]');
    await helpers.expectToastMessage('Customer contact logged');

    // Reschedule appointment
    await page.click('[data-testid="reschedule-appointment"]');
    await page.fill('[data-testid="new-date"]', '2024-07-09');
    await page.fill('[data-testid="new-time"]', '13:00');
    await page.selectOption('[data-testid="reschedule-reason"]', 'customer-request');
    await page.fill('[data-testid="reschedule-notes"]', 'Customer needs to change to afternoon due to work schedule');
    await page.click('[data-testid="confirm-reschedule"]');
    await helpers.expectToastMessage('Appointment rescheduled');

    // Pre-installation checklist
    await page.click('[data-testid="pre-install-checklist"]');
    await page.check('[data-testid="tools-verified"]');
    await page.check('[data-testid="materials-confirmed"]');
    await page.check('[data-testid="access-confirmed"]');
    await page.check('[data-testid="customer-contacted"]');
    await page.click('[data-testid="save-checklist"]');
    await helpers.expectToastMessage('Pre-installation checklist completed');
  });

  test('Installation process and documentation', async ({ page }) => {
    await page.goto('/installer/jobs');
    
    // Start installation
    await page.click('[data-testid="active-job"] [data-testid="start-installation"]');
    await expect(page.locator('[data-testid="installation-workflow"]')).toBeVisible();

    // Step 1: Arrival and setup
    await page.click('[data-testid="confirm-arrival"]');
    await page.fill('[data-testid="arrival-time"]', '10:00');
    await page.fill('[data-testid="arrival-notes"]', 'On time, customer available, good access to windows');
    
    // Take before photos
    await page.click('[data-testid="take-before-photos"]');
    await helpers.uploadFile('[data-testid="before-photo-1"]', 'test-files/before1.jpg');
    await helpers.uploadFile('[data-testid="before-photo-2"]', 'test-files/before2.jpg');
    await page.click('[data-testid="save-photos"]');

    // Step 2: Installation process
    await page.click('[data-testid="begin-installation"]');
    await page.fill('[data-testid="start-time"]', '10:15');
    
    // Window measurements verification
    await page.click('[data-testid="verify-measurements"]');
    await helpers.fillFractionInput('[data-testid="actual-width"]', 48, '1/4');
    await helpers.fillFractionInput('[data-testid="actual-height"]', 72, '0');
    await page.check('[data-testid="measurements-match"]');
    await page.click('[data-testid="confirm-measurements"]');

    // Installation progress tracking
    await page.selectOption('[data-testid="installation-progress"]', '25');
    await page.fill('[data-testid="progress-notes"]', 'Brackets installed, checking alignment');
    await page.click('[data-testid="update-progress"]');

    await page.selectOption('[data-testid="installation-progress"]', '50');
    await page.fill('[data-testid="progress-notes"]', 'Headrail mounted, testing operation');
    await page.click('[data-testid="update-progress"]');

    await page.selectOption('[data-testid="installation-progress"]', '75');
    await page.fill('[data-testid="progress-notes"]', 'Shade attached, adjusting tension');
    await page.click('[data-testid="update-progress"]');

    // Handle installation issues
    await page.click('[data-testid="report-issue"]');
    await page.selectOption('[data-testid="issue-type"]', 'measurement-discrepancy');
    await page.fill('[data-testid="issue-description"]', 'Window frame slightly warped, required minor adjustment to bracket positioning');
    await page.fill('[data-testid="issue-resolution"]', 'Used shims to level brackets, tested operation - working properly');
    await page.click('[data-testid="save-issue"]');

    // Step 3: Completion and testing
    await page.selectOption('[data-testid="installation-progress"]', '100');
    await page.click('[data-testid="test-operation"]');
    await page.check('[data-testid="smooth-operation"]');
    await page.check('[data-testid="proper-alignment"]');
    await page.check('[data-testid="secure-mounting"]');
    await page.click('[data-testid="confirm-testing"]');

    // Take after photos
    await page.click('[data-testid="take-after-photos"]');
    await helpers.uploadFile('[data-testid="after-photo-1"]', 'test-files/after1.jpg');
    await helpers.uploadFile('[data-testid="after-photo-2"]', 'test-files/after2.jpg');
    await page.click('[data-testid="save-after-photos"]');

    // Customer demonstration
    await page.click('[data-testid="demonstrate-operation"]');
    await page.check('[data-testid="showed-controls"]');
    await page.check('[data-testid="explained-care"]');
    await page.check('[data-testid="provided-warranty"]');
    await page.fill('[data-testid="demo-notes"]', 'Demonstrated cordless operation, explained cleaning instructions');
    await page.click('[data-testid="complete-demo"]');
  });

  test('Customer interaction and sign-off', async ({ page }) => {
    await page.goto('/installer/jobs');
    await page.click('[data-testid="active-job"] [data-testid="customer-signoff"]');

    // Customer satisfaction survey
    await expect(page.locator('[data-testid="satisfaction-survey"]')).toBeVisible();
    await page.click('[data-testid="satisfaction-excellent"]');
    await page.fill('[data-testid="customer-feedback"]', 'Very professional installation, great attention to detail');

    // Quality inspection with customer
    await page.click('[data-testid="quality-inspection"]');
    await page.check('[data-testid="customer-approves-appearance"]');
    await page.check('[data-testid="customer-approves-operation"]');
    await page.check('[data-testid="customer-understands-controls"]');
    await page.click('[data-testid="complete-inspection"]');

    // Digital signature
    await page.click('[data-testid="get-signature"]');
    await expect(page.locator('[data-testid="signature-pad"]')).toBeVisible();
    // Note: Actual signature would require canvas interaction
    await page.click('[data-testid="signature-complete"]');

    // Final documentation
    await page.fill('[data-testid="completion-time"]', '12:30');
    await page.fill('[data-testid="total-duration"]', '2.25');
    await page.fill('[data-testid="final-notes"]', 'Installation completed successfully, customer very satisfied');

    // Submit completion
    await page.click('[data-testid="submit-completion"]');
    await helpers.expectToastMessage('Installation completed and submitted');

    // Generate completion certificate
    await page.click('[data-testid="generate-certificate"]');
    await expect(page.locator('[data-testid="completion-certificate"]')).toBeVisible();
    await page.click('[data-testid="email-certificate"]');
    await helpers.expectToastMessage('Completion certificate sent to customer');
  });

  test('Material and inventory management', async ({ page }) => {
    await page.goto('/installer/materials');
    await helpers.waitForLoadingToFinish();

    // Verify inventory dashboard
    await expect(page.locator('[data-testid="materials-inventory"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-levels"]')).toBeVisible();

    // Check material availability for upcoming jobs
    await expect(page.locator('[data-testid="materials-needed"]')).toBeVisible();
    await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();

    // Log material usage
    await page.click('[data-testid="log-usage"]');
    await page.selectOption('[data-testid="material-type"]', 'mounting-brackets');
    await page.fill('[data-testid="quantity-used"]', '6');
    await page.selectOption('[data-testid="job-reference"]', 'job-12345');
    await page.fill('[data-testid="usage-notes"]', 'Standard installation, 3 windows');
    await page.click('[data-testid="save-usage"]');

    // Request material replenishment
    await page.click('[data-testid="request-materials"]');
    await page.selectOption('[data-testid="material-item"]', 'screws-2inch');
    await page.fill('[data-testid="quantity-needed"]', '100');
    await page.selectOption('[data-testid="urgency"]', 'normal');
    await page.fill('[data-testid="request-reason"]', 'Running low after recent installations');
    await page.click('[data-testid="submit-request"]');
    await helpers.expectToastMessage('Material request submitted');

    // Damage/defect reporting
    await page.click('[data-testid="report-damage"]');
    await page.selectOption('[data-testid="damaged-item"]', 'roller-shade-white-48x72');
    await page.selectOption('[data-testid="damage-type"]', 'manufacturing-defect');
    await page.fill('[data-testid="damage-description"]', 'Fabric has visible tear near bottom edge');
    await helpers.uploadFile('[data-testid="damage-photo"]', 'test-files/damage.jpg');
    await page.click('[data-testid="submit-damage-report"]');
    await helpers.expectToastMessage('Damage report submitted');

    // Van inventory check
    await page.click('[data-testid="van-inventory"]');
    await expect(page.locator('[data-testid="van-stock"]')).toBeVisible();
    await page.click('[data-testid="update-van-stock"]');
    await page.fill('[data-testid="bracket-count"]', '24');
    await page.fill('[data-testid="screw-count"]', '150');
    await page.click('[data-testid="save-van-inventory"]');
    await helpers.expectToastMessage('Van inventory updated');
  });

  test('Route optimization and scheduling', async ({ page }) => {
    await page.goto('/installer/routes');
    await helpers.waitForLoadingToFinish();

    // Verify route planning
    await expect(page.locator('[data-testid="route-planner"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-route"]')).toBeVisible();

    // View optimized route
    await page.selectOption('[data-testid="route-date"]', '2024-07-08');
    await page.click('[data-testid="optimize-route"]');
    await expect(page.locator('[data-testid="optimized-sequence"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-drive-time"]')).toContainText('hours');
    await expect(page.locator('[data-testid="total-distance"]')).toContainText('miles');

    // Manually adjust route order
    await page.dragAndDrop('[data-testid="route-stop-1"]', '[data-testid="route-stop-3"]');
    await page.click('[data-testid="recalculate-route"]');
    await expect(page.locator('[data-testid="updated-drive-time"]')).toBeVisible();

    // Add buffer time between appointments
    await page.fill('[data-testid="buffer-time"]', '30');
    await page.click('[data-testid="apply-buffer"]');
    await helpers.expectToastMessage('Buffer time applied to route');

    // Traffic and weather considerations
    await expect(page.locator('[data-testid="traffic-alerts"]')).toBeVisible();
    await expect(page.locator('[data-testid="weather-impact"]')).toBeVisible();

    // Save preferred route
    await page.click('[data-testid="save-route"]');
    await page.fill('[data-testid="route-name"]', 'Monday North Route');
    await page.click('[data-testid="confirm-save-route"]');
    await helpers.expectToastMessage('Route saved successfully');

    // Export route to GPS
    await page.click('[data-testid="export-to-gps"]');
    await page.selectOption('[data-testid="gps-format"]', 'google-maps');
    await page.click('[data-testid="generate-export"]');
    await helpers.expectToastMessage('Route exported to GPS');
  });

  test('Performance tracking and earnings', async ({ page }) => {
    await page.goto('/installer/reports');
    await helpers.waitForLoadingToFinish();

    // Verify performance dashboard
    await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();

    // View monthly performance
    await page.selectOption('[data-testid="performance-period"]', 'monthly');
    await helpers.waitForLoadingToFinish();

    await expect(page.locator('[data-testid="jobs-completed"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-earnings"]')).toContainText('$');
    await expect(page.locator('[data-testid="average-rating"]')).toContainText(/\d\.\d/);
    await expect(page.locator('[data-testid="efficiency-score"]')).toContainText('%');

    // Detailed earnings breakdown
    await page.click('[data-testid="earnings-detail"]');
    await expect(page.locator('[data-testid="base-pay"]')).toContainText('$');
    await expect(page.locator('[data-testid="performance-bonus"]')).toContainText('$');
    await expect(page.locator('[data-testid="material-allowance"]')).toContainText('$');
    await expect(page.locator('[data-testid="travel-compensation"]')).toContainText('$');

    // Customer feedback summary
    await page.click('[data-testid="feedback-tab"]');
    await expect(page.locator('[data-testid="recent-reviews"]')).toBeVisible();
    await expect(page.locator('[data-testid="positive-feedback"]')).toContainText('%');
    await expect(page.locator('[data-testid="areas-improvement"]')).toBeVisible();

    // Quality metrics
    await page.click('[data-testid="quality-tab"]');
    await expect(page.locator('[data-testid="installation-quality"]')).toContainText(/\d\.\d/);
    await expect(page.locator('[data-testid="timeliness-score"]')).toContainText(/\d\.\d/);
    await expect(page.locator('[data-testid="communication-rating"]')).toContainText(/\d\.\d/);

    // Goals and targets
    await page.click('[data-testid="goals-tab"]');
    await page.fill('[data-testid="monthly-job-target"]', '25');
    await page.fill('[data-testid="quality-target"]', '4.8');
    await page.fill('[data-testid="earnings-goal"]', '3500');
    await page.click('[data-testid="save-goals"]');
    await helpers.expectToastMessage('Performance goals updated');

    // Export performance report
    await page.click('[data-testid="export-performance"]');
    await page.selectOption('[data-testid="report-format"]', 'pdf');
    await page.selectOption('[data-testid="report-period"]', 'quarterly');
    await page.click('[data-testid="generate-report"]');
    await helpers.expectToastMessage('Performance report generated');
  });
});