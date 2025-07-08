import { test, expect } from '@playwright/test';

test.describe('Explore Application Structure', () => {
  test('Discover available routes and navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('=== Application Structure Discovery ===');
    console.log('Homepage URL:', page.url());
    
    // Get all links on the page
    const links = await page.locator('a').all();
    const routes = new Set<string>();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        routes.add(href);
      }
    }
    
    console.log('Found routes:', Array.from(routes));
    
    // Check common routes
    const commonRoutes = [
      '/', '/products', '/cart', '/login', '/register',
      '/account', '/checkout', '/admin', '/vendor'
    ];
    
    const availableRoutes: string[] = [];
    
    for (const route of commonRoutes) {
      try {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        if (response && response.status() < 400) {
          availableRoutes.push(route);
          console.log(`✓ ${route} - Status: ${response.status()}`);
        }
      } catch (e) {
        console.log(`✗ ${route} - Not available`);
      }
    }
    
    expect(availableRoutes.length).toBeGreaterThan(0);
    console.log('Available routes:', availableRoutes);
  });

  test('Analyze login page structure', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('=== Login Page Analysis ===');
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      
      console.log(`Input ${i + 1}:`, {
        type,
        name,
        id,
        placeholder
      });
    }
    
    // Find buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      
      console.log(`Button ${i + 1}:`, {
        text: text?.trim(),
        type
      });
    }
  });

  test('Analyze product listing structure', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('=== Product Page Analysis ===');
    
    // Find elements that might be products
    const possibleProductSelectors = [
      '[class*="product"]',
      '[class*="card"]',
      '[class*="item"]',
      'article',
      '[data-product]',
      'a[href*="/product"]'
    ];
    
    for (const selector of possibleProductSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        // Analyze first element
        const first = elements[0];
        const classes = await first.getAttribute('class');
        console.log('Classes:', classes);
        
        // Check for child elements
        const hasImage = await first.locator('img').count() > 0;
        const hasPrice = (await first.textContent())?.includes('$') || false;
        
        console.log('Has image:', hasImage);
        console.log('Has price:', hasPrice);
      }
    }
  });
});