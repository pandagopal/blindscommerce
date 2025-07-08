import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
}

export async function waitForElementAndFill(page: Page, selector: string, value: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.fill(selector, value);
  } catch (error) {
    // Try alternative selectors
    const alternatives = [
      selector.replace('[name=', '[id='),
      selector.replace('[data-testid=', '[aria-label='),
      selector.replace('[data-testid=', '.'),
    ];
    
    for (const alt of alternatives) {
      try {
        await page.fill(alt, value);
        return;
      } catch (e) {
        // Continue to next alternative
      }
    }
    throw new Error(`Could not find element: ${selector}`);
  }
}

export async function waitForElementAndClick(page: Page, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
  } catch (error) {
    // Try alternative selectors
    const alternatives = [
      selector.replace('[data-testid=', '[aria-label='),
      selector.replace('[data-testid=', '.'),
      `button:has-text("${selector.match(/\[(.*?)=(.*?)\]/)?.[2]?.replace(/"/g, '')}")`,
    ];
    
    for (const alt of alternatives) {
      try {
        await page.click(alt);
        return;
      } catch (e) {
        // Continue to next alternative
      }
    }
    throw new Error(`Could not find element: ${selector}`);
  }
}