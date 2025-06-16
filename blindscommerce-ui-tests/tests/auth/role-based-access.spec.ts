import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Role-Based Access Control', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Admin role access and restrictions', async ({ page }) => {
    await helpers.loginAs('admin');
    
    // Admin should access admin dashboard
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    
    // Admin can manage users
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    
    // Admin can create vendors
    await page.goto('/admin/vendors/new');
    await expect(page.locator('[data-testid="vendor-form"]')).toBeVisible();
    
    // Admin cannot access super-admin features
    await page.goto('/super-admin');
    await expect(page).toHaveURL('/admin'); // Should redirect
  });

  test('Vendor role access and restrictions', async ({ page }) => {
    await helpers.loginAs('vendor');
    
    // Vendor should access vendor dashboard
    await page.goto('/vendor');
    await expect(page.locator('[data-testid="vendor-dashboard"]')).toBeVisible();
    
    // Vendor can manage their products
    await page.goto('/vendor/products');
    await expect(page.locator('[data-testid="vendor-products"]')).toBeVisible();
    
    // Vendor can create sales roles
    await page.goto('/vendor/sales/new');
    await expect(page.locator('[data-testid="sales-creation-form"]')).toBeVisible();
    
    // Vendor cannot access admin panel
    await page.goto('/admin');
    await expect(page).toHaveURL('/vendor'); // Should redirect
    
    // Vendor cannot access other vendor's products
    await page.goto('/admin/vendors/123'); // Different vendor
    await expect(page).toHaveURL('/vendor'); // Should redirect
  });

  test('Customer role access and restrictions', async ({ page }) => {
    await helpers.loginAs('customer');
    
    // Customer should access account dashboard
    await page.goto('/account');
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
    
    // Customer can view products and configure
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-catalog"]')).toBeVisible();
    
    // Customer can access cart and checkout
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-page"]')).toBeVisible();
    
    // Customer cannot access admin or vendor areas
    await page.goto('/admin');
    await expect(page).toHaveURL('/account'); // Should redirect
    
    await page.goto('/vendor');
    await expect(page).toHaveURL('/account'); // Should redirect
  });

  test('Sales role access and restrictions', async ({ page }) => {
    await helpers.loginAs('sales');
    
    // Sales should access sales dashboard
    await page.goto('/sales');
    await expect(page.locator('[data-testid="sales-dashboard"]')).toBeVisible();
    
    // Sales can assist customers
    await page.goto('/sales/assistance');
    await expect(page.locator('[data-testid="customer-assistance"]')).toBeVisible();
    
    // Sales can view their leads
    await page.goto('/sales/leads');
    await expect(page.locator('[data-testid="sales-leads"]')).toBeVisible();
    
    // Sales cannot access vendor product management
    await page.goto('/vendor/products');
    await expect(page).toHaveURL('/sales'); // Should redirect
    
    // Sales cannot access admin functions
    await page.goto('/admin');
    await expect(page).toHaveURL('/sales'); // Should redirect
  });

  test('Installer role access and restrictions', async ({ page }) => {
    await helpers.loginAs('installer');
    
    // Installer should access installer dashboard
    await page.goto('/installer');
    await expect(page.locator('[data-testid="installer-dashboard"]')).toBeVisible();
    
    // Installer can view assigned jobs
    await page.goto('/installer/jobs');
    await expect(page.locator('[data-testid="installer-jobs"]')).toBeVisible();
    
    // Installer can manage appointments
    await page.goto('/installer/appointments');
    await expect(page.locator('[data-testid="installer-appointments"]')).toBeVisible();
    
    // Installer cannot access vendor or admin areas
    await page.goto('/vendor');
    await expect(page).toHaveURL('/installer'); // Should redirect
    
    await page.goto('/admin');
    await expect(page).toHaveURL('/installer'); // Should redirect
  });

  test('Guest user restrictions', async ({ page }) => {
    // Guest can view public pages
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-catalog"]')).toBeVisible();
    
    await page.goto('/');
    await expect(page.locator('[data-testid="homepage"]')).toBeVisible();
    
    // Guest can configure products but needs to login for cart
    await helpers.navigateToProductConfiguration('premium-roller-shade');
    await expect(page.locator('[data-testid="configuration-steps"]')).toBeVisible();
    
    await helpers.completeBasicProductConfiguration();
    await page.click('[data-testid="add-to-cart"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Guest cannot access protected areas
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto('/vendor');
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Role hierarchy and permission inheritance', async ({ page }) => {
    await helpers.loginAs('admin');
    
    // Admin can perform customer actions
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-catalog"]')).toBeVisible();
    
    // Admin can view vendor information (higher privilege)
    await page.goto('/admin/vendors');
    await expect(page.locator('[data-testid="vendor-list"]')).toBeVisible();
    
    // Test permission escalation prevention
    await page.goto('/super-admin');
    await expect(page).toHaveURL('/admin'); // Cannot access higher role
  });

  test('Session timeout and re-authentication', async ({ page }) => {
    await helpers.loginAs('customer');
    
    // Simulate session expiry by manipulating token
    await page.evaluate(() => {
      localStorage.removeItem('auth-token');
      sessionStorage.removeItem('auth-token');
    });
    
    // Try to access protected area
    await page.goto('/account/orders');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
  });

  test('Cross-role data isolation', async ({ page }) => {
    // Login as vendor A
    await helpers.loginAs('vendor');
    await page.goto('/vendor/products');
    
    const vendorAProducts = await page.locator('[data-testid="product-item"]').count();
    await helpers.logout();
    
    // Login as different vendor (would need different test account)
    // This test assumes we have multiple vendor accounts
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'vendor2@test.com');
    await page.fill('[data-testid="password"]', 'vendor123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/vendor/products');
    const vendorBProducts = await page.locator('[data-testid="product-item"]').count();
    
    // Vendors should not see each other's products
    expect(vendorAProducts).not.toBe(vendorBProducts);
  });
});