import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loaded
    await expect(page).toHaveTitle(/Blinds/i);
    
    // Check for common elements
    const header = page.locator('header, [role="banner"], nav');
    await expect(header).toBeVisible();
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('Products page loads', async ({ page }) => {
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Check if products or product cards are visible
    const products = page.locator('[class*="product"], [data-testid*="product"], article');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });

  test('Registration page is accessible', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check for basic registration fields
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('Cart page is accessible', async ({ page }) => {
    await page.goto('/cart');
    
    // Check for cart page elements
    const cartTitle = page.locator('h1:has-text("Cart"), h2:has-text("Cart"), [aria-label*="cart" i]');
    await expect(cartTitle.first()).toBeVisible();
  });
});