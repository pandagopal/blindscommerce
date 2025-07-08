import { test, expect } from '@playwright/test';

test.describe('Minimal Tests', () => {
  test('Application responds to requests', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('Page has a title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log('Page title:', title);
  });

  test('Page has some content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(10);
  });
});