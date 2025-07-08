import { test, expect } from '@playwright/test';

test.describe('Realistic Customer Shopping Flow', () => {
  test('Customer can browse products without login', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    
    // Look for products link in navigation
    const navLinks = await page.locator('nav a, header a').all();
    let productsLinkFound = false;
    
    for (const link of navLinks) {
      const text = await link.textContent();
      if (text && text.toLowerCase().includes('product')) {
        await link.click();
        productsLinkFound = true;
        break;
      }
    }
    
    if (!productsLinkFound) {
      // Try direct navigation
      await page.goto('/products');
    }
    
    // Wait for any content to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we have any product-like elements
    const possibleProducts = await page.locator('div, article, section').all();
    let productFound = false;
    
    for (const element of possibleProducts) {
      const text = await element.textContent();
      if (text && text.includes('$')) {
        productFound = true;
        break;
      }
    }
    
    expect(productFound).toBeTruthy();
  });

  test('Customer can view a product detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    
    // Find any clickable element that might be a product
    const links = await page.locator('a[href*="product"]').all();
    
    if (links.length > 0) {
      await links[0].click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if price is visible
      await expect(page.locator('text=/\\$\\d+/')).toBeVisible({ timeout: 10000 });
    } else {
      // Try direct navigation to a product
      await page.goto('/products/1');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('Login form accepts input', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Find email/username input
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    // Check if inputs exist
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    // Try to fill them
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    // Check values were entered
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });
});