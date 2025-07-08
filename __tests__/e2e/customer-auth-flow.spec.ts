import { test, expect } from '@playwright/test';

test.describe('Customer Registration and Login Flow', () => {
  test('New customer registers successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', `jane.smith.${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    // Accept terms and conditions
    await page.check('input[name="acceptTerms"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Verify email verification message
    await expect(page.locator('[data-testid="verification-message"]')).toContainText('Please check your email to verify your account');
    
    // Simulate email verification (in real test, would check email)
    await page.goto('/verify-email?token=test-token');
    
    // Verify redirect to login with success message
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Email verified successfully');
  });

  test('Customer logs in and accesses account', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Fill login credentials
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Verify redirect to homepage or dashboard
    await expect(page).toHaveURL(/\/(dashboard|$)/);
    
    // Verify user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Click on user menu
    await page.click('[data-testid="user-menu"]');
    
    // Verify menu options
    await expect(page.locator('[data-testid="menu-account"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-logout"]')).toBeVisible();
    
    // Navigate to account
    await page.click('[data-testid="menu-account"]');
    await expect(page).toHaveURL('/account');
  });

  test('Customer resets forgotten password', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Click forgot password
    await page.click('[data-testid="forgot-password-link"]');
    
    // Enter email
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.click('[data-testid="send-reset-email"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText('Password reset email sent');
    
    // Simulate clicking reset link (in real test, would check email)
    await page.goto('/reset-password?token=test-reset-token');
    
    // Enter new password
    await page.fill('input[name="newPassword"]', 'NewSecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'NewSecurePass123!');
    await page.click('[data-testid="reset-password-submit"]');
    
    // Verify redirect to login with success
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="password-reset-success"]')).toContainText('Password reset successfully');
    
    // Verify can login with new password
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'NewSecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|$)/);
  });

  test('Customer logs in with social provider (Google)', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Click Google login button
    await page.click('[data-testid="login-google"]');
    
    // Mock Google OAuth flow (in real test, would handle OAuth)
    // For testing purposes, we'll check if it navigates to Google
    await expect(page).toHaveURL(/accounts\.google\.com/);
    
    // Simulate successful OAuth callback
    await page.goto('/auth/callback?provider=google&token=test-token');
    
    // Verify redirect to home/dashboard
    await expect(page).toHaveURL(/\/(dashboard|$)/);
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Invalid login attempts show proper errors', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Test empty fields
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    
    // Test incorrect credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid email or password');
    
    // Test account lockout after multiple attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="password"]', `WrongPass${i}!`);
      await page.click('button[type="submit"]');
    }
    await expect(page.locator('[data-testid="account-locked"]')).toContainText('Account temporarily locked');
  });
});